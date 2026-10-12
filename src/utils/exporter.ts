import type { CaptionLanguage, Subtitle } from '../types';
import { getCaptionText } from './transliterate';

export function exportToSRT(subtitles: Subtitle[], language: CaptionLanguage = 'en'): string {
  return subtitles
    .map((subtitle, index) => (
      `${index + 1}\n` +
      `${formatTime(subtitle.start, ',')} --> ${formatTime(subtitle.end, ',')}\n` +
      `${getCaptionText(subtitle.text, language, subtitle.tenglishText)}\n`
    ))
    .join('\n');
}

export function exportToVTT(subtitles: Subtitle[], language: CaptionLanguage = 'en'): string {
  const cues = subtitles
    .map((subtitle, index) => (
      `${index + 1}\n` +
      `${formatTime(subtitle.start, '.')} --> ${formatTime(subtitle.end, '.')}\n` +
      `${getCaptionText(subtitle.text, language, subtitle.tenglishText)}\n`
    ))
    .join('\n');
  return `WEBVTT\n\n${cues}`;
}

function formatTime(seconds: number, separator: ',' | '.'): string {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.floor((safeSeconds - Math.floor(safeSeconds)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:` +
    `${String(wholeSeconds).padStart(2, '0')}${separator}${String(milliseconds).padStart(3, '0')}`;
}

export function downloadStringAsFile(data: string, filename: string): void {
  const blob = new Blob([data], { type: filename.endsWith('.vtt') ? 'text/vtt' : 'text/plain' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Let the browser finish consuming the download URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
