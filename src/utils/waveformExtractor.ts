/**
 * Decodes audio using Web Audio API and extracts dense, high-fidelity
 * waveform peaks with root-mean-square (RMS) dynamics and natural noise floor.
 */
export async function extractWaveformPeaks(
  audioSource: Blob | File | string,
  targetDensityPerSec: number = 24
): Promise<number[]> {
  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof audioSource === "string") {
      const resp = await fetch(audioSource);
      arrayBuffer = await resp.arrayBuffer();
    } else {
      arrayBuffer = await audioSource.arrayBuffer();
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 22050,
    });

    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    await audioCtx.close();

    const channelData = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;
    const totalBars = Math.max(200, Math.min(3000, Math.floor(duration * targetDensityPerSec)));
    const blockSize = Math.floor(channelData.length / totalBars);
    const peaks: number[] = [];

    for (let i = 0; i < totalBars; i++) {
      const start = i * blockSize;
      let sumSq = 0;
      let count = 0;
      // Stride sampling for speed while capturing high transients
      for (let j = 0; j < blockSize && start + j < channelData.length; j += 2) {
        const val = channelData[start + j];
        sumSq += val * val;
        count++;
      }
      const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
      peaks.push(rms);
    }

    // Dynamic normalization with soft curve compression so quiet speech stays visible
    const max = Math.max(...peaks, 0.005);
    return peaks.map(p => {
      const norm = p / max;
      // Exponential curve expansion for punchy visual contrast
      return Math.max(0.08, Math.min(1, Math.pow(norm, 0.65)));
    });
  } catch (err) {
    console.warn("Could not compute waveform peaks:", err);
    return [];
  }
}
