import type { AspectRatio, CaptionLanguage, ExportResolutionPreset, Subtitle } from '../types';
import { exportToSRT, exportToVTT, downloadStringAsFile } from './exporter';

/**
 * Formats that this browser-only exporter can produce.
 *
 * MP4/MKV/MOV use the bundled FFmpeg.wasm transcode path after the browser
 * render stage. WebM remains available through MediaRecorder.
 */
export type ExportFormat = 'webm' | 'mp4' | 'mkv' | 'mov';

export const BROWSER_EXPORT_LIMITATION =
  'MP4, MKV, and MOV are encoded directly on your device using crisp H.264 and clear AAC audio. The initial export loads the high-definition encoder.';

export interface ExportOptions {
  resolution: ExportResolutionPreset;
  frameRate: number;
  format: ExportFormat;
  includeAudio: boolean;
  filename: string;
  aspectRatio: AspectRatio;
}

export type ExportProgressCallback = (progress: number) => void;
export type RenderExport = (
  options: ExportOptions,
  onProgress: ExportProgressCallback,
  signal: AbortSignal,
) => Promise<Blob>;

export interface FormatAvailability {
  supported: boolean;
  mimeType: string | null;
  message?: string;
}

export function getExportFormatAvailability(
  format: ExportFormat,
  includeAudio: boolean,
  mediaRecorder: Pick<typeof MediaRecorder, 'isTypeSupported'> | undefined =
    typeof MediaRecorder === 'undefined' ? undefined : MediaRecorder,
): FormatAvailability {
  if (!mediaRecorder) {
    return { supported: false, mimeType: null, message: 'Video export requires MediaRecorder in this browser.' };
  }

  if (format !== 'webm') {
    return {
      supported: true,
      mimeType: null,
      message: BROWSER_EXPORT_LIMITATION,
    };
  }

  const codecs = includeAudio
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = codecs.find(codec => {
    try {
      return mediaRecorder.isTypeSupported(codec);
    } catch {
      return false;
    }
  }) ?? null;
  return mimeType
    ? { supported: true, mimeType }
    : {
        supported: false,
        mimeType: null,
        message: `WebM staging with ${includeAudio ? 'audio' : 'no audio'} is not supported by this browser.`,
      };
}

export function normalizeExportFilename(filename: string, format: ExportFormat): string {
  const sanitized = filename.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\.+$/, '');
  const withoutExtension = sanitized.replace(/\.(webm|mp4|mkv|mov)$/i, '') || 'caption-export';
  return `${withoutExtension}.${format}`;
}

export function downloadSubtitleFile(
  subtitles: Subtitle[],
  language: CaptionLanguage,
  format: 'srt' | 'vtt',
  filename = `captions.${format}`,
): void {
  downloadStringAsFile(format === 'srt' ? exportToSRT(subtitles, language) : exportToVTT(subtitles, language), filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  // Connecting the anchor makes the download reliable in browsers that ignore
  // clicks on detached elements (and preserves the exact filename passed by
  // the export page).
  document.body?.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
