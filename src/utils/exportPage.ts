import type { AspectRatio, CaptionLanguage, ExportResolutionPreset, Subtitle } from '../types';
import { exportToSRT, exportToVTT, downloadStringAsFile } from './exporter';

export type ExportFormat = 'webm' | 'mp4';

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

  const codecs = format === 'webm'
    ? (includeAudio
      ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'])
    : (includeAudio
      ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4']
      : ['video/mp4;codecs=avc1', 'video/mp4']);
  const mimeType = codecs.find(codec => mediaRecorder.isTypeSupported(codec)) ?? null;
  return mimeType
    ? { supported: true, mimeType }
    : {
        supported: false,
        mimeType: null,
        message: `${format.toUpperCase()} with ${includeAudio ? 'audio' : 'no audio'} is not supported by this browser.`,
      };
}

export function normalizeExportFilename(filename: string, format: ExportFormat): string {
  const withoutExtension = filename.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\.+$/, '') || 'caption-export';
  return `${withoutExtension.replace(/\.(webm|mp4)$/i, '')}.${format}`;
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
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
