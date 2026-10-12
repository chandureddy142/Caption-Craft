/** Check the adapter without initializing Transformers.js/ONNX sessions. */
export async function hasUsableWebGpu(): Promise<boolean> {
  // WebGPU is not included in every TypeScript DOM lib supported by the app.
  const runtime = globalThis as typeof globalThis & {
    navigator?: {
      gpu?: {
        requestAdapter?: (options: { powerPreference: 'high-performance' }) => Promise<unknown>;
      };
    };
  };
  const gpu = runtime.navigator?.gpu;
  if (typeof gpu?.requestAdapter !== 'function') return false;
  try {
    // Match Transformers.js's ONNX WebGPU power preference. Chrome can expose
    // the API but return null with GPU disabled or an unsupported driver.
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    return adapter != null;
  } catch {
    // Only adapter probing is caught here; no model/network work has started.
    return false;
  }
}
