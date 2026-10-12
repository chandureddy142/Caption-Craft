import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WhisperWorkerRequest } from '../services/localTranscription';

const { pipeline } = vi.hoisted(() => ({ pipeline: vi.fn() }));
vi.mock('@huggingface/transformers', () => ({
  env: { backends: { onnx: { wasm: {} } } },
  pipeline,
}));

beforeEach(() => {
  vi.resetModules();
  pipeline.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

async function loadModel() {
  const scope = { onmessage: null as ((event: MessageEvent<WhisperWorkerRequest>) => void) | null };
  const postMessage = vi.fn();
  vi.stubGlobal('self', scope);
  vi.stubGlobal('postMessage', postMessage);
  await import('./whisper.worker');
  scope.onmessage!({ data: { type: 'load-model' } } as MessageEvent<WhisperWorkerRequest>);
  return postMessage;
}

describe('Whisper worker backend selection', () => {
  it('loads WASM directly when the GPU API exists but no adapter is available', async () => {
    vi.stubGlobal('navigator', { gpu: { requestAdapter: vi.fn().mockResolvedValue(null) } });
    // Model the installed Transformers.js webInitChain: once a GPU session
    // fails, even a subsequent WASM session rejects with the same GPU error.
    let initChain: Promise<object> = Promise.resolve({});
    pipeline.mockImplementation((_task, _model, options: { device: string }) => {
      initChain = initChain.then(() => {
        if (options.device === 'webgpu') throw new Error('no available backend found. ERR: [webgpu] Failed to get GPU adapter');
        return {};
      });
      return initChain;
    });

    const postMessage = await loadModel();
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'model-status', status: 'ready', backend: 'wasm',
    })));
    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline).toHaveBeenCalledWith('automatic-speech-recognition', 'onnx-community/whisper-tiny', expect.objectContaining({
      device: 'wasm', dtype: 'q8',
    }));
  });

  it('uses WebGPU when an adapter is available', async () => {
    vi.stubGlobal('navigator', { gpu: { requestAdapter: vi.fn().mockResolvedValue({}) } });
    pipeline.mockResolvedValue({});
    const postMessage = await loadModel();
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'model-status', status: 'ready', backend: 'webgpu',
    })));
    expect(pipeline).toHaveBeenCalledTimes(1);
  });

  it.each([
    'Failed to fetch WebGPU model weights',
    'HTTP 403 loading tokenizer config',
    'Invalid model tensor dimensions',
  ])('reports the original model error without retrying another backend: %s', async message => {
    vi.stubGlobal('navigator', { gpu: { requestAdapter: vi.fn().mockResolvedValue({}) } });
    pipeline.mockRejectedValue(new Error(message));
    const postMessage = await loadModel();
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'model-status', status: 'error', message,
    })));
    expect(pipeline).toHaveBeenCalledTimes(1);
  });

  it('preserves WASM download errors after the adapter preflight selects CPU', async () => {
    vi.stubGlobal('navigator', { gpu: { requestAdapter: vi.fn().mockResolvedValue(null) } });
    pipeline.mockRejectedValue(new Error('Failed to fetch WASM model weights'));
    const postMessage = await loadModel();
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'model-status', status: 'error', message: 'Failed to fetch WASM model weights',
    })));
    expect(pipeline).toHaveBeenCalledTimes(1);
  });
});
