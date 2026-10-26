import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type FfmpegContainer = 'mp4' | 'mkv' | 'mov';

const CORE_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFfmpeg(signal: AbortSignal): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;
  if (!loadPromise) {
    const instance = new FFmpeg();
    loadPromise = Promise.all([
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    ]).then(async ([coreURL, wasmURL]) => {
      await instance.load({ coreURL, wasmURL }, { signal });
      ffmpeg = instance;
      return instance;
    }).catch(error => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

function outputMimeType(container: FfmpegContainer): string {
  if (container === 'mkv') return 'video/x-matroska';
  if (container === 'mov') return 'video/quicktime';
  return 'video/mp4';
}

function outputArguments(container: FfmpegContainer, _frameRate: number, includeAudio: boolean): string[] {
  const args = [
    "-i", "createcaptions-input.webm",
    "-c:v", "copy",
  ];

  if (includeAudio) {
    args.push("-c:a", "aac", "-b:a", "192k");
  } else {
    args.push("-an");
  }

  if (container === "mp4") {
    args.push("-movflags", "+faststart");
  }

  args.push(`createcaptions-output.${container}`);
  return args;
}

export async function transcodeWithFfmpeg(
  input: Blob,
  container: FfmpegContainer,
  frameRate: number,
  includeAudio: boolean,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  const instance = await getFfmpeg(signal);
  const progress = ({ progress: value }: { progress: number }) => onProgress(Math.max(0, Math.min(100, value * 100)));
  instance.on('progress', progress);
  try {
    await instance.writeFile('createcaptions-input.webm', await fetchFile(input), { signal });
    const exitCode = await instance.exec(outputArguments(container, frameRate, includeAudio), undefined, { signal });
    if (exitCode !== 0) throw new Error(`FFmpeg could not encode ${container.toUpperCase()} output (exit code ${exitCode}).`);
    const output = await instance.readFile(`createcaptions-output.${container}`, undefined, { signal });
    if (typeof output === 'string') throw new Error('FFmpeg returned an invalid binary output.');
    const outputBytes = new Uint8Array(output.byteLength);
    outputBytes.set(output);
    return new Blob([outputBytes.buffer], { type: outputMimeType(container) });
  } catch (error) {
    if (signal.aborted) throw new Error('Export cancelled.');
    throw error instanceof Error ? error : new Error('FFmpeg export failed.');
  } finally {
    instance.off('progress', progress);
    await Promise.allSettled([
      instance.deleteFile('createcaptions-input.webm'),
      instance.deleteFile(`createcaptions-output.${container}`),
    ]);
  }
}
