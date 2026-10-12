import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasUsableWebGpu } from './whisperBackend';

afterEach(() => vi.unstubAllGlobals());

describe('Whisper WebGPU preflight', () => {
  it.each([undefined, {}, { gpu: {} }])('uses CPU when the adapter API is missing (%j)', async navigator => {
    vi.stubGlobal('navigator', navigator);
    expect(await hasUsableWebGpu()).toBe(false);
  });

  it('uses CPU when Chromium exposes WebGPU but has no adapter', async () => {
    const requestAdapter = vi.fn().mockResolvedValue(null);
    vi.stubGlobal('navigator', { gpu: { requestAdapter } });
    expect(await hasUsableWebGpu()).toBe(false);
    expect(requestAdapter).toHaveBeenCalledWith({ powerPreference: 'high-performance' });
  });

  it('uses CPU when requesting an adapter rejects', async () => {
    vi.stubGlobal('navigator', { gpu: { requestAdapter: vi.fn().mockRejectedValue(new Error('GPU disabled')) } });
    expect(await hasUsableWebGpu()).toBe(false);
  });

  it('awaits the adapter and calls requestAdapter with its GPU receiver', async () => {
    let resolveAdapter!: (adapter: object) => void;
    const adapterPromise = new Promise<object>(resolve => { resolveAdapter = resolve; });
    const gpu = {
      requestAdapter: vi.fn(function (this: unknown) {
        expect(this).toBe(gpu);
        return adapterPromise;
      }),
    };
    vi.stubGlobal('navigator', { gpu });
    let settled = false;
    const result = hasUsableWebGpu().then(value => { settled = true; return value; });
    await Promise.resolve();
    expect(settled).toBe(false);
    resolveAdapter({});
    expect(await result).toBe(true);
  });
});
