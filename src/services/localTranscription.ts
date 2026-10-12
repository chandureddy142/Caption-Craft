import type { ProgressInfo } from '@huggingface/transformers';
import type { SourceLanguage, Subtitle } from '../types';
import {
  createAudioChunkIterator,
  type AudioChunk,
} from '../utils/audioExtractor';
import { mergeOverlappingSubtitles } from '../utils/subtitleValidation';

export const LOCAL_WHISPER_MODEL_ID = 'onnx-community/whisper-tiny';
export const LOCAL_WHISPER_BASE_MODEL_ID = 'onnx-community/whisper-base';
export const LOCAL_TRANSCRIPTION_SAMPLE_RATE = 16_000;
export const DEFAULT_LOCAL_CHUNK_DURATION_SECONDS = 30;
// Non-overlapping windows avoid duplicating speech when a model returns only
// segment text and provides no word alignments for an overlap seam.
export const DEFAULT_LOCAL_CHUNK_OVERLAP_SECONDS = 0;

/**
 * Transformers.js stores model assets in its browser cache (Cache API when
 * available). The first load therefore needs network access to Hugging Face;
 * later loads can use the cached assets and run without a transcription API.
 */
export type LocalModelBackend = 'webgpu' | 'wasm';
export type LocalModelStatus = 'idle' | 'loading' | 'ready' | 'error';
export type LocalModelProgressStatus = ProgressInfo['status'];

export interface ModelStatusMessage {
  type: 'model-status';
  status: LocalModelStatus;
  backend?: LocalModelBackend;
  modelId: string;
  message?: string;
}

export interface ModelProgressMessage {
  type: 'model-progress';
  modelId: string;
  status: LocalModelProgressStatus;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface TranscriptionProgressMessage {
  type: 'transcription-progress';
  jobId: string;
  chunkIndex: number;
  completedChunks: number;
  totalChunks: number;
  percent: number;
  chunkStart: number;
  chunkEnd: number;
  processedDuration: number;
  totalDuration: number;
}

export interface TranscriptionSegmentMessage {
  text: string;
  /** Segment-relative seconds returned by Whisper. */
  start: number;
  /** Segment-relative seconds returned by Whisper. */
  end: number;
}

export interface TranscriptionResultMessage {
  type: 'transcription-result';
  jobId: string;
  chunkIndex: number;
  text: string;
  segments: TranscriptionSegmentMessage[];
}

export interface TranscriptionErrorMessage {
  type: 'transcription-error';
  jobId: string;
  chunkIndex?: number;
  message: string;
  name?: string;
}

export interface LoadModelRequest {
  type: 'load-model';
  modelId?: string;
}

export interface TranscribeChunkRequest {
  type: 'transcribe-chunk';
  jobId: string;
  chunkIndex: number;
  audio: ArrayBuffer;
  language: string;
  totalChunks: number;
  chunkStart: number;
  chunkEnd: number;
  totalDuration: number;
  modelId?: string;
}

export interface CancelRequest {
  type: 'cancel';
  jobId: string;
}

export interface DisposeRequest {
  type: 'dispose';
}

export type WhisperWorkerRequest =
  | LoadModelRequest
  | TranscribeChunkRequest
  | CancelRequest
  | DisposeRequest;

export type WhisperWorkerResponse =
  | ModelStatusMessage
  | ModelProgressMessage
  | TranscriptionProgressMessage
  | TranscriptionResultMessage
  | TranscriptionErrorMessage;

export interface LocalTranscriptionProgress {
  completedChunks: number;
  totalChunks: number;
  percent: number;
  chunkIndex: number;
  chunkStart: number;
  chunkEnd: number;
  processedDuration: number;
  totalDuration: number;
}

export interface LocalTranscriptionOptions {
  modelId?: string;
  chunkDurationSeconds?: number;
  overlapSeconds?: number;
  sourceLanguage?: SourceLanguage;
  startChunkIndex?: number;
  initialSubtitles?: Subtitle[];
  signal?: AbortSignal;
  onModelStatus?: (status: ModelStatusMessage) => void;
  onModelProgress?: (progress: ModelProgressMessage) => void;
  onProgress?: (progress: LocalTranscriptionProgress) => void;
  onPartialResult?: (subtitles: Subtitle[], progress: LocalTranscriptionProgress) => void;
}

export interface LocalTranscriptionClientOptions {
  /** Injectable for tests or hosts that provide their own Worker wrapper. */
  workerFactory?: () => Worker;
}

export type WorkerFactory = () => Worker;

export class LocalTranscriptionBusyError extends Error {
  constructor() {
    super('A local transcription job is already running.');
    this.name = 'LocalTranscriptionBusyError';
  }
}

export class LocalTranscriptionError extends Error {
  readonly failedChunkIndex: number;
  readonly partialSubtitles: Subtitle[];

  constructor(message: string, failedChunkIndex: number, partialSubtitles: Subtitle[]) {
    super(message);
    this.name = 'LocalTranscriptionError';
    this.failedChunkIndex = failedChunkIndex;
    this.partialSubtitles = partialSubtitles;
  }
}

export class LocalTranscriptionClient {
  private worker: Worker | null = null;
  private activeJob: ActiveJob | null = null;
  private readonly workerFactory: WorkerFactory;
  private readonly modelLoadWaiters = new Set<ModelWaiter>();
  private terminated = false;

  constructor(options: LocalTranscriptionClientOptions = {}) {
    this.workerFactory = options.workerFactory ?? defaultWorkerFactory;
  }

  /** Load the cached/downloaded model without starting an audio job. */
  async preload(options: Pick<LocalTranscriptionOptions, 'onModelStatus' | 'onModelProgress' | 'modelId'> = {}): Promise<void> {
    this.assertUsable();
    const worker = this.ensureWorker();
    const promise = new Promise<void>((resolve, reject) => {
      this.modelLoadWaiters.add({ resolve, reject, ...options });
    });
    try {
      worker.postMessage({ type: 'load-model', modelId: options.modelId } satisfies LoadModelRequest);
    } catch (error) {
      this.replaceWorker(error instanceof Error ? error : new Error(String(error)));
    }
    return promise;
  }

  /**
   * Transcribe a normalized 16 kHz mono PCM WAV in sequential chunks. The
   * audio Blob is sent to the worker chunk-by-chunk so long recordings do not
   * require a second full-size decoded audio buffer in the main thread.
   */
  async transcribe(audioBlob: Blob, options: LocalTranscriptionOptions = {}): Promise<Subtitle[]> {
    this.assertUsable();
    if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
      throw new Error('No normalized audio was provided for local transcription.');
    }
    throwIfAborted(options.signal);
    if (this.activeJob) throw new LocalTranscriptionBusyError();

    const startChunkIndex = options.startChunkIndex ?? 0;
    if (!Number.isInteger(startChunkIndex) || startChunkIndex < 0) {
      throw new Error('The resume chunk index must be a non-negative integer.');
    }
    const sourceLanguage = options.sourceLanguage ?? 'en';
    if (!['en', 'te'].includes(sourceLanguage)) {
      throw new Error('Unsupported local transcription language.');
    }
    const chunkDurationSeconds = options.chunkDurationSeconds ?? DEFAULT_LOCAL_CHUNK_DURATION_SECONDS;
    if (chunkDurationSeconds > 30) throw new Error('Whisper audio chunks must be no longer than 30 seconds.');
    const initialSubtitles = options.initialSubtitles ?? [];
    const job: ActiveJob = {
      jobId: createJobId(),
      pendingReject: null,
      cancelled: false,
      modelStatus: options.onModelStatus,
      modelProgress: options.onModelProgress,
      abortHandler: () => undefined,
    };
    this.activeJob = job;
    const removeAbortListener = options.signal ? () => options.signal?.removeEventListener('abort', job.abortHandler) : undefined;
    job.abortHandler = () => {
      if (this.activeJob === job) this.cancel();
    };
    options.signal?.addEventListener('abort', job.abortHandler, { once: true });

    try {
      if (options.signal?.aborted) this.cancel();
      throwIfJobCancelled(job);
      // Reserve the active job before any asynchronous preparation so two
      // callers cannot both pass the single-job guard while reading a header.
      const chunkPlan = await createAudioChunkIterator(audioBlob, {
        chunkDurationSeconds,
        overlapSeconds: options.overlapSeconds ?? DEFAULT_LOCAL_CHUNK_OVERLAP_SECONDS,
      });
      throwIfJobCancelled(job);
      if (startChunkIndex > chunkPlan.totalChunks) throw new Error('Resume index exceeds the audio chunk count.');
      if (chunkPlan.totalChunks === 0) return [];
      const allSegments: TimestampedSubtitle[] = initialSubtitles.map((subtitle, index) => ({
        ...subtitle,
        sourceOrder: -1_000_000 + index,
      }));
      const initialCompleted = Math.min(startChunkIndex, chunkPlan.totalChunks);
      const initialStart = Math.min(
        chunkPlan.durationSeconds,
        startChunkIndex * Math.max(
          0,
          (options.chunkDurationSeconds ?? DEFAULT_LOCAL_CHUNK_DURATION_SECONDS) -
            (options.overlapSeconds ?? DEFAULT_LOCAL_CHUNK_OVERLAP_SECONDS),
        ),
      );
      options.onProgress?.({
        completedChunks: initialCompleted,
        totalChunks: chunkPlan.totalChunks,
        percent: Math.round(initialCompleted / chunkPlan.totalChunks * 100),
        chunkIndex: Math.min(startChunkIndex, Math.max(0, chunkPlan.totalChunks - 1)),
        chunkStart: initialStart,
        chunkEnd: initialStart,
        processedDuration: initialStart,
        totalDuration: chunkPlan.durationSeconds,
      });

      for await (const chunk of chunkPlan.chunks) {
        if (chunk.index < startChunkIndex) continue;
        throwIfJobCancelled(job);
        let result: TranscriptionResultMessage;
        try {
          result = await this.transcribeChunk(
            job,
            chunk,
            sourceLanguage,
            chunkPlan.totalChunks,
            chunkPlan.durationSeconds,
            options.modelId,
          );
          throwIfJobCancelled(job);
        } catch (error) {
          if (job.cancelled) throw createAbortError();
          throw new LocalTranscriptionError(
            error instanceof Error ? error.message : 'Local transcription failed.',
            chunk.index,
            mergeOverlappingSubtitles(allSegments),
          );
        }
        allSegments.push(...mapChunkResult(result, chunk));

        const completedChunks = chunk.index + 1;
        const progress: LocalTranscriptionProgress = {
          completedChunks,
          totalChunks: chunkPlan.totalChunks,
          percent: Math.round(completedChunks / chunkPlan.totalChunks * 100),
          chunkIndex: chunk.index,
          chunkStart: chunk.start,
          chunkEnd: chunk.end,
          processedDuration: chunk.end,
          totalDuration: chunkPlan.durationSeconds,
        };
        const partial = mergeOverlappingSubtitles(allSegments);
        options.onProgress?.(progress);
        throwIfJobCancelled(job);
        options.onPartialResult?.(partial, progress);
      }
      throwIfJobCancelled(job);
      return mergeOverlappingSubtitles(allSegments);
    } finally {
      removeAbortListener?.();
      if (this.activeJob === job) this.activeJob = null;
    }
  }

  /** Cancel the active job and stop any in-flight inference. */
  cancel(): void {
    const job = this.activeJob;
    if (!job) return;
    job.cancelled = true;
    try {
      this.worker?.postMessage({ type: 'cancel', jobId: job.jobId } satisfies CancelRequest);
    } catch {
      // Termination below still guarantees that inference is stopped.
    }
    job.pendingReject?.(createAbortError());
    job.pendingReject = null;
    job.pendingResolve = null;
    this.activeJob = null;
    // ONNX inference can block its worker event loop; terminating is the only
    // reliable immediate cancellation. Cached model assets are not deleted.
    this.replaceWorker(createAbortError());
  }

  /** Release the worker and reject any outstanding model/job waiters. */
  terminate(): void {
    this.terminated = true;
    this.releaseWorker(new Error('Local transcription worker was terminated.'));
  }

  /**
   * Release resources during component cleanup while keeping the client
   * reusable. React StrictMode intentionally runs effect cleanup and setup
   * twice in development, so cleanup must not permanently poison the client.
   */
  cleanup(): void {
    this.releaseWorker(new Error('Local transcription worker was cleaned up.'));
  }

  private releaseWorker(error: Error): void {
    const job = this.activeJob;
    if (job) {
      job.cancelled = true;
      job.pendingReject?.(createAbortError());
      job.pendingReject = null;
      job.pendingResolve = null;
      this.activeJob = null;
    }
    for (const waiter of this.modelLoadWaiters) waiter.reject(error);
    this.modelLoadWaiters.clear();
    this.replaceWorker(error);
  }

  private transcribeChunk(
    job: ActiveJob,
    chunk: AudioChunk,
    sourceLanguage: SourceLanguage,
    totalChunks: number,
    totalDuration: number,
    modelId?: string,
  ): Promise<TranscriptionResultMessage> {
    const worker = this.ensureWorker();
    return new Promise<TranscriptionResultMessage>((resolve, reject) => {
      job.pendingResolve = resolve;
      job.pendingReject = reject;
      job.chunkIndex = chunk.index;
      void chunk.blob.arrayBuffer().then(audio => {
        throwIfJobCancelled(job);
        worker.postMessage({
          type: 'transcribe-chunk',
          jobId: job.jobId,
          chunkIndex: chunk.index,
          audio,
          language: whisperLanguage(sourceLanguage),
          totalChunks,
          chunkStart: chunk.start,
          chunkEnd: chunk.end,
          totalDuration,
          modelId,
        } satisfies TranscribeChunkRequest, [audio]);
      }).catch(error => {
        job.pendingResolve = null;
        job.pendingReject = null;
        reject(error);
      });
    });
  }

  private ensureWorker(): Worker {
    this.assertUsable();
    if (this.worker) return this.worker;
    const worker = this.workerFactory();
    worker.onmessage = (event: MessageEvent<WhisperWorkerResponse>) => {
      if (this.worker === worker) this.handleWorkerMessage(event.data);
    };
    worker.onerror = (event) => {
      if (this.worker !== worker) return;
      const error = new Error(event.message || 'Local transcription worker failed.');
      this.activeJob?.pendingReject?.(error);
      this.replaceWorker(error);
    };
    worker.onmessageerror = () => {
      if (this.worker !== worker) return;
      const error = new Error('Unable to read a local transcription worker response.');
      this.activeJob?.pendingReject?.(error);
      this.replaceWorker(error);
    };
    this.worker = worker;
    return worker;
  }

  private handleWorkerMessage(message: WhisperWorkerResponse): void {
    if (message.type === 'model-status') {
      for (const waiter of this.modelLoadWaiters) {
        waiter.onModelStatus?.(message);
        if (message.status === 'ready') waiter.resolve();
        if (message.status === 'error') waiter.reject(new Error(message.message ?? 'Unable to load Whisper.'));
      }
      if (message.status === 'ready' || message.status === 'error') this.modelLoadWaiters.clear();
      this.activeJob?.modelStatus?.(message);
      return;
    }
    if (message.type === 'model-progress') {
      for (const waiter of this.modelLoadWaiters) waiter.onModelProgress?.(message);
      this.activeJob?.modelProgress?.(message);
      return;
    }
    if (message.type === 'transcription-progress') {
      return;
    }
    const job = this.activeJob;
    if (!job || message.jobId !== job.jobId || message.chunkIndex !== job.chunkIndex) return;
    if (message.type === 'transcription-result') {
      job.pendingReject = null;
      job.pendingResolve?.(message);
      job.pendingResolve = null;
      return;
    }
    const reject = job.pendingReject;
    job.pendingReject = null;
    job.pendingResolve = null;
    reject?.(new Error(message.message));
  }

  private replaceWorker(error: Error): void {
    this.worker?.terminate();
    this.worker = null;
    for (const waiter of this.modelLoadWaiters) waiter.reject(error);
    this.modelLoadWaiters.clear();
  }

  private assertUsable(): void {
    if (this.terminated) throw new Error('Local transcription client has been terminated.');
  }
}

interface ModelWaiter {
  resolve: () => void;
  reject: (error: Error) => void;
  onModelStatus?: (status: ModelStatusMessage) => void;
  onModelProgress?: (progress: ModelProgressMessage) => void;
}

interface ActiveJob {
  jobId: string;
  cancelled: boolean;
  pendingReject: ((error: unknown) => void) | null;
  pendingResolve?: ((message: TranscriptionResultMessage) => void) | null;
  abortHandler: () => void;
  modelStatus?: (status: ModelStatusMessage) => void;
  modelProgress?: (progress: ModelProgressMessage) => void;
  chunkIndex?: number;
}

interface TimestampedSubtitle extends Subtitle {
  sourceOrder: number;
}

function defaultWorkerFactory(): Worker {
  return new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), { type: 'module' });
}

export function createLocalTranscriptionClient(options: LocalTranscriptionClientOptions = {}): LocalTranscriptionClient {
  return new LocalTranscriptionClient(options);
}

function mapChunkResult(result: TranscriptionResultMessage, chunk: AudioChunk): TimestampedSubtitle[] {
  const chunkDuration = chunk.end - chunk.start;
  const validSegments = result.segments
    .filter(segment => (
      typeof segment.text === 'string' && segment.text.trim().length > 0 &&
      Number.isFinite(segment.start) && Number.isFinite(segment.end) &&
      segment.end > segment.start && segment.start < chunkDuration
    ))
    .map((segment, segmentIndex) => {
      const start = Math.max(0, segment.start);
      const end = Math.min(chunkDuration, Math.max(start, segment.end));
      return {
        id: `${chunk.index}:${segmentIndex}`,
        start: chunk.start + start,
        end: chunk.start + end,
        text: segment.text.trim(),
        sourceOrder: chunk.index * 1_000_000 + segmentIndex,
      };
    })
    .filter(segment => segment.end > segment.start);
  if (validSegments.length > 0) return validSegments;

  // If Whisper did not return timestamped chunks, retain its recognized text
  // as one source chunk. No word timestamps are inferred here.
  const text = result.text.trim();
  if (!text) return [];
  return [{
    id: `${chunk.index}:text`,
    start: chunk.start,
    end: chunk.end,
    text,
    sourceOrder: chunk.index * 1_000_000,
  }];
}

function whisperLanguage(language: SourceLanguage): string {
  return language === 'en' ? 'english' : 'telugu';
}

function createJobId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw createAbortError();
}

function throwIfJobCancelled(job: ActiveJob): void {
  if (job.cancelled) throw createAbortError();
}

function createAbortError(): DOMException {
  return new DOMException('Local transcription was cancelled.', 'AbortError');
}
