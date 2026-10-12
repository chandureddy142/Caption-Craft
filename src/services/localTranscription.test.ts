import { describe, expect, it, vi } from 'vitest';
import type { WhisperWorkerRequest, WhisperWorkerResponse } from './localTranscription';
import { createLocalTranscriptionClient } from './localTranscription';
import { TranscriptionSession } from './transcriptionSession';

const SAMPLE_RATE = 16_000;

class FakeWorker {
  onmessage: ((event: MessageEvent<WhisperWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminated = false;
  holdTranscription = false;
  transcriptionCount = 0;
  modelReady = false;
  lastLanguage = '';

  postMessage(request: WhisperWorkerRequest): void {
    if (request.type === 'dispose') {
      this.terminated = true;
      return;
    }
    if (request.type === 'cancel') return;
    if (request.type === 'load-model') {
      this.emitModelReady();
      return;
    }
    this.lastLanguage = request.language;
    this.transcriptionCount += 1;
    if (!this.modelReady) this.emitModelReady();
    if (this.holdTranscription) return;
    queueMicrotask(() => this.emit({
      type: 'transcription-result',
      jobId: request.jobId,
      chunkIndex: request.chunkIndex,
      text: `chunk-${request.chunkIndex}`,
      segments: [{ text: `chunk-${request.chunkIndex}`, start: 0.1, end: 0.4 }],
    }));
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(data: WhisperWorkerResponse): void {
    this.onmessage?.({ data } as MessageEvent<WhisperWorkerResponse>);
  }

  private emitModelReady(): void {
    this.modelReady = true;
    queueMicrotask(() => this.emit({ type: 'model-status', status: 'loading', modelId: 'test' }));
    queueMicrotask(() => this.emit({ type: 'model-progress', modelId: 'test', status: 'progress', progress: 100 }));
    queueMicrotask(() => this.emit({ type: 'model-status', status: 'ready', backend: 'wasm', modelId: 'test' }));
  }
}

function makeWav(seconds: number): Blob {
  const data = new Uint8Array(SAMPLE_RATE * seconds * 2);
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const ascii = (offset: number, value: string) => value.split('').forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  ascii(0, 'RIFF'); view.setUint32(4, 36 + data.length, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true); view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, data.length, true);
  return new Blob([header, data], { type: 'audio/wav' });
}

describe('local transcription client', () => {
  it('loads the model lazily and offsets chunk timestamps', async () => {
    const worker = new FakeWorker();
    const client = createLocalTranscriptionClient({ workerFactory: () => worker as unknown as Worker });
    const statuses: string[] = [];
    const result = await client.transcribe(makeWav(2), {
      chunkDurationSeconds: 1,
      sourceLanguage: 'en',
      onModelStatus: status => statuses.push(status.status),
    });

    expect(worker.transcriptionCount).toBe(2);
    expect(result).toHaveLength(2);
    expect(result[1].start).toBeCloseTo(1.1);
    expect(statuses).toContain('ready');
    client.cleanup();
  });

  it('cancels a pending worker job', async () => {
    const worker = new FakeWorker();
    worker.holdTranscription = true;
    const client = createLocalTranscriptionClient({ workerFactory: () => worker as unknown as Worker });
    const controller = new AbortController();
    const promise = client.transcribe(makeWav(1), { signal: controller.signal });
    await vi.waitFor(() => expect(worker.transcriptionCount).toBe(1));
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminated).toBe(true);
  });

  it('passes Telugu as the selected Whisper source language', async () => {
    const worker = new FakeWorker();
    const client = createLocalTranscriptionClient({ workerFactory: () => worker as unknown as Worker });
    await client.transcribe(makeWav(1), { sourceLanguage: 'te' });
    expect(worker.lastLanguage).toBe('telugu');
    client.cleanup();
  });

  it('keeps the client reusable after React-style cleanup', async () => {
    let workerCount = 0;
    const client = createLocalTranscriptionClient({
      workerFactory: () => {
        workerCount += 1;
        return new FakeWorker() as unknown as Worker;
      },
    });
    client.cleanup();
    const result = await client.transcribe(makeWav(1));
    expect(result).toHaveLength(1);
    expect(workerCount).toBe(1);
    client.cleanup();
  });

  it('does not resurrect an explicitly terminated client during cleanup', async () => {
    const workerFactory = vi.fn(() => new FakeWorker() as unknown as Worker);
    const client = createLocalTranscriptionClient({ workerFactory });
    client.terminate();
    client.cleanup();
    await expect(client.preload()).rejects.toThrow('client has been terminated');
    await expect(client.transcribe(makeWav(1))).rejects.toThrow('client has been terminated');
    expect(workerFactory).not.toHaveBeenCalled();
  });

  it('keeps a replacement job active when the cancelled job settles', async () => {
    const workers: FakeWorker[] = [];
    const client = createLocalTranscriptionClient({
      workerFactory: () => {
        const worker = new FakeWorker();
        worker.holdTranscription = true;
        workers.push(worker);
        return worker as unknown as Worker;
      },
    });
    const first = client.transcribe(makeWav(1));
    const firstRejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(workers[0]?.transcriptionCount).toBe(1));
    client.cancel();
    const second = client.transcribe(makeWav(1));
    const secondRejected = expect(second).rejects.toMatchObject({ name: 'AbortError' });
    await firstRejected;
    await expect(client.transcribe(makeWav(1))).rejects.toMatchObject({ name: 'LocalTranscriptionBusyError' });
    await vi.waitFor(() => expect(workers[1]?.transcriptionCount).toBe(1));
    client.cancel();
    await secondRejected;
    expect(workers.every(worker => worker.terminated)).toBe(true);
  });

  it('does not deliver partial results after a progress callback cancels the job', async () => {
    const client = createLocalTranscriptionClient({ workerFactory: () => new FakeWorker() as unknown as Worker });
    const onPartialResult = vi.fn();
    await expect(client.transcribe(makeWav(2), {
      chunkDurationSeconds: 1,
      onProgress: progress => {
        if (progress.completedChunks === 1) client.cancel();
      },
      onPartialResult,
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(onPartialResult).not.toHaveBeenCalled();
  });

  it('preserves a cancelled run checkpoint while invalidating stale finally handlers', () => {
    const session = new TranscriptionSession();
    const audio = makeWav(1);
    const firstRevision = session.start(audio, 'en', 2);
    expect(firstRevision).not.toBeNull();
    session.recordCompleted(firstRevision!, 3);
    session.cancel();

    expect(session.resume(audio, 'en')).toBe(3);
    expect(session.resume(audio, 'te')).toBeNull();
    expect(session.finish(firstRevision!)).toBe(false);

    const retryRevision = session.start(audio, 'en', 3);
    expect(retryRevision).not.toBeNull();
    session.complete(retryRevision!);
    expect(session.resume(audio, 'en')).toBeNull();
  });
});
