import {
  env,
  pipeline,
  type ProgressInfo,
} from '@huggingface/transformers';
import { hasUsableWebGpu } from './whisperBackend';
import type {
  ModelProgressMessage,
  ModelStatusMessage,
  TranscribeChunkRequest,
  TranscriptionErrorMessage,
  TranscriptionResultMessage,
  TranscriptionProgressMessage,
  TranscriptionSegmentMessage,
  WhisperWorkerRequest,
  WhisperWorkerResponse,
} from '../services/localTranscription';

// Keep this literal aligned with the client's public model ID. A type-only
// service import avoids bundling a nested Worker factory into this worker.
const LOCAL_WHISPER_MODEL_ID = 'onnx-community/whisper-tiny';

// Only Transformers.js downloads public model/runtime assets. Audio never
// leaves this worker. Initial use needs network access to Hugging Face; the
// library's Cache API model/WASM caches permit subsequent offline use while
// those assets remain stored. Browser eviction/private mode can require a
// fresh download. These caches do not make the application shell an offline PWA.
env.allowLocalModels = false;
env.useBrowserCache = typeof caches !== 'undefined';
env.useWasmCache = typeof caches !== 'undefined';
// The worker already isolates CPU inference. Single-thread WASM also works
// without cross-origin-isolation headers or SharedArrayBuffer support.
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;

type WhisperPipeline = Awaited<ReturnType<typeof pipeline<'automatic-speech-recognition'>>>;

let currentModelId = LOCAL_WHISPER_MODEL_ID;
let modelPromise: Promise<WhisperPipeline> | null = null;
let modelBackend: 'webgpu' | 'wasm' | undefined;
const cancelledJobs = new Set<string>();
let activeChunk = false;

self.onmessage = (event: MessageEvent<WhisperWorkerRequest>) => {
  void handleRequest(event.data);
};

async function handleRequest(request: WhisperWorkerRequest): Promise<void> {
  if (request.type === 'cancel') {
    cancelledJobs.add(request.jobId);
    return;
  }
  if (request.type === 'dispose') {
    cancelledJobs.clear();
    const model = await modelPromise?.catch(() => null);
    await model?.dispose?.();
    modelPromise = null;
    self.close();
    return;
  }
  if (request.type === 'load-model') {
    if (request.modelId && request.modelId !== currentModelId) {
      const model = await modelPromise?.catch(() => null);
      await model?.dispose?.();
      modelPromise = null;
      currentModelId = request.modelId;
    }
    try {
      await getModel();
      if (modelBackend) postReady(modelBackend);
    } catch {
      // getModel already reports a typed model-status error.
    }
    return;
  }

  if (activeChunk) {
    postError(request, new Error('The Whisper worker is already transcribing a chunk.'));
    return;
  }
  if (request.modelId && request.modelId !== currentModelId) {
    const model = await modelPromise?.catch(() => null);
    await model?.dispose?.();
    modelPromise = null;
    currentModelId = request.modelId;
  }
  activeChunk = true;
  try {
    await transcribeChunk(request);
  } catch (error) {
    postError(request, error);
  } finally {
    activeChunk = false;
    cancelledJobs.delete(request.jobId);
  }
}

async function getModel(): Promise<WhisperPipeline> {
  if (!modelPromise) {
    modelPromise = loadModel();
  }
  try {
    return await modelPromise;
  } catch (error) {
    modelPromise = null;
    throw error;
  }
}

async function loadModel(forceWasm = false): Promise<WhisperPipeline> {
  const modelId = currentModelId;
  postMessage({
    type: 'model-status',
    status: 'loading',
    modelId,
  } satisfies ModelStatusMessage);

  const progress_callback = (info: ProgressInfo): void => {
    const progress = progressValue(info);
    postMessage({
      type: 'model-progress',
      modelId,
      status: info.status,
      file: 'file' in info && typeof info.file === 'string' ? info.file : undefined,
      progress,
      loaded: 'loaded' in info && typeof info.loaded === 'number' ? info.loaded : undefined,
      total: 'total' in info && typeof info.total === 'number' ? info.total : undefined,
    } satisfies ModelProgressMessage);
  };

  // Transformers.js 4.3.1 chains browser session initialization without
  // recovering a rejection (backends/onnx.js: webInitChain). A failed GPU
  // initialization therefore also rejects a later WASM pipeline in this worker.
  // Probe before creating any sessions, not just for navigator.gpu presence.
  const webGpuAvailable = !forceWasm && await hasUsableWebGpu();
  if (webGpuAvailable) {
    try {
      const model = await pipeline('automatic-speech-recognition', modelId, {
        device: 'webgpu',
        // Quantized weights keep the first download and browser memory use
        // reasonable for the multilingual model.
        dtype: 'q8',
        progress_callback,
      });
      modelBackend = 'webgpu';
      postReady(modelBackend);
      return model;
    } catch (error) {
      // Retry only identified GPU failures; model/download errors must retain
      // their original error. The preflight above handles missing adapters
      // before the library's session-initialization chain can be poisoned.
      if (!isSupportedWebGpuFailure(error)) {
        postModelError(error);
        throw error;
      }
      postMessage({
        type: 'model-status',
        status: 'loading',
        backend: 'wasm',
        modelId,
        message: 'Optimizing engine for your device hardware.',
      } satisfies ModelStatusMessage);
    }
  }

  try {
    const model = await pipeline('automatic-speech-recognition', modelId, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback,
    });
    modelBackend = 'wasm';
    postReady(modelBackend);
    return model;
  } catch (error) {
    postModelError(error);
    throw error;
  }
}

async function transcribeChunk(request: TranscribeChunkRequest): Promise<void> {
  if (cancelledJobs.has(request.jobId)) return;
  let model = await getModel();
  if (cancelledJobs.has(request.jobId)) return;
  const audio = wavToFloat32(request.audio);
  if (isNearlySilent(audio)) {
    postChunkResult(request, '', []);
    return;
  }
  const inferenceOptions = {
    language: request.language,
    task: 'transcribe',
    return_timestamps: true as const,
  };
  let output: unknown;
  try {
    output = await model(audio, inferenceOptions);
  } catch (error) {
    // A GPU may initialize successfully yet lack an operator or lose its
    // device on first inference. Retry once on CPU only for GPU failures.
    if (modelBackend !== 'webgpu' || !isSupportedWebGpuFailure(error)) throw error;
    await model.dispose().catch(() => undefined);
    if (cancelledJobs.has(request.jobId)) return;
    modelPromise = loadModel(true);
    model = await getModel();
    if (cancelledJobs.has(request.jobId)) return;
    output = await model(audio, inferenceOptions);
  }
  if (cancelledJobs.has(request.jobId)) return;

  const result = normalizeOutput(output, audio.length / 16_000);
  postChunkResult(request, result.text, result.segments);
}

function postChunkResult(
  request: TranscribeChunkRequest,
  text: string,
  segments: TranscriptionSegmentMessage[],
): void {
  postMessage({
    type: 'transcription-progress',
    jobId: request.jobId,
    chunkIndex: request.chunkIndex,
    completedChunks: request.chunkIndex + 1,
    totalChunks: request.totalChunks,
    percent: Math.round((request.chunkIndex + 1) / request.totalChunks * 100),
    chunkStart: request.chunkStart,
    chunkEnd: request.chunkEnd,
    processedDuration: request.chunkEnd,
    totalDuration: request.totalDuration,
  } satisfies TranscriptionProgressMessage);
  postMessage({
    type: 'transcription-result',
    jobId: request.jobId,
    chunkIndex: request.chunkIndex,
    text,
    segments,
  } satisfies TranscriptionResultMessage);
}

function isNearlySilent(audio: Float32Array): boolean {
  if (audio.length === 0) return true;
  let sumSquares = 0;
  let peak = 0;
  for (const sample of audio) {
    sumSquares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  const rms = Math.sqrt(sumSquares / audio.length);
  return rms < 0.003 && peak < 0.02;
}

function normalizeOutput(output: unknown, duration: number): { text: string; segments: TranscriptionSegmentMessage[] } {
  if (!isRecord(output) || typeof output.text !== 'string') {
    throw new Error('Whisper returned an invalid transcription result.');
  }
  const text = output.text;
  if (!Array.isArray(output.chunks)) return { text, segments: [] };
  const segments: TranscriptionSegmentMessage[] = [];
  for (const rawChunk of output.chunks) {
    if (!isRecord(rawChunk) || typeof rawChunk.text !== 'string' || !Array.isArray(rawChunk.timestamp)) continue;
    const [start, rawEnd] = rawChunk.timestamp;
    // Whisper can leave the final segment open-ended. Bound that segment to
    // its known source audio extent; this is not a word-level alignment.
    const end = rawEnd === null ? duration : rawEnd;
    if (typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (end <= start || !rawChunk.text.trim()) continue;
    segments.push({ text: rawChunk.text, start, end });
  }
  return { text, segments };
}

function wavToFloat32(buffer: ArrayBuffer): Float32Array {
  const view = new DataView(buffer);
  if (
    view.byteLength < 44 ||
    readAscii(view, 0, 4) !== 'RIFF' ||
    readAscii(view, 8, 4) !== 'WAVE' ||
    readAscii(view, 12, 4) !== 'fmt ' ||
    readAscii(view, 36, 4) !== 'data'
  ) {
    throw new Error('Local transcription requires a compact PCM WAV chunk.');
  }
  const format = view.getUint16(20, true);
  const channels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  const dataSize = view.getUint32(40, true);
  if (format !== 1 || channels !== 1 || sampleRate !== 16_000 || bitsPerSample !== 16) {
    throw new Error('Local transcription audio must be 16 kHz mono 16-bit PCM.');
  }
  if (44 + dataSize > view.byteLength || dataSize % 2 !== 0) {
    throw new Error('Local transcription WAV data is invalid.');
  }
  const samples = new Float32Array(dataSize / 2);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(44 + index * 2, true) / 32_768;
  }
  return samples;
}

function isSupportedWebGpuFailure(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error
    ? error.message
    : isRecord(error) && typeof error.message === 'string'
      ? error.message
      : String(error);
  if (/fetch|network|http|404|401|403|not found|tokenizer|config/i.test(`${name} ${message}`)) return false;
  return name === 'GPUValidationError' || name === 'GPUOutOfMemoryError' ||
    /no available backend.*webgpu|\[webgpu\].*(?:adapter|backend)/i.test(message) ||
    /(?:webgpu|gpu\s*device|gpu\s*adapter|requestAdapter|requestDevice|GPUBuffer|GPUShader|GPUCommand|wgsl).*(?:unavailable|unsupported|not supported|failed|lost|limit|validation|error)|(?:no|failed to (?:get|create|request)|unable to (?:get|create|request)).*(?:gpu|adapter)|webgpu.*backend|backend.*webgpu/i.test(message);
}

function postReady(backend: 'webgpu' | 'wasm'): void {
  postMessage({
    type: 'model-status',
    status: 'ready',
    backend,
    modelId: currentModelId,
  } satisfies ModelStatusMessage);
}

function postModelError(error: unknown): void {
  postMessage({
    type: 'model-status',
    status: 'error',
    backend: modelBackend,
    modelId: currentModelId,
    message: error instanceof Error ? error.message : 'Unable to load the local Whisper model.',
  } satisfies ModelStatusMessage);
}

function postError(request: TranscribeChunkRequest, error: unknown): void {
  const message: TranscriptionErrorMessage = {
    type: 'transcription-error',
    jobId: request.jobId,
    chunkIndex: request.chunkIndex,
    message: error instanceof Error ? error.message : 'Local transcription failed.',
    name: error instanceof Error ? error.name : undefined,
  };
  postMessage(message satisfies WhisperWorkerResponse);
}

function progressValue(info: ProgressInfo): number | undefined {
  if ('progress' in info && typeof info.progress === 'number') return info.progress;
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = '';
  for (let index = 0; index < length; index += 1) value += String.fromCharCode(view.getUint8(offset + index));
  return value;
}
