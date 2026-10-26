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

export function exportToASS(subtitles: Subtitle[], language: CaptionLanguage = 'en'): string {
  const events = subtitles.map((subtitle) => {
    const text = escapeAssText(getCaptionText(subtitle.text, language, subtitle.tenglishText));
    return `Dialogue: 0,${formatAssTime(subtitle.start)},${formatAssTime(subtitle.end)},Default,,0,0,0,,${text}`;
  });

  return [
    '[Script Info]',
    'Title: Create Captions Export',
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Arial,32,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1',
    '[Events]',
    ...events,
  ].join('\n');
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

function formatAssTime(seconds: number): string {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const centiseconds = Math.floor((safeSeconds - Math.floor(safeSeconds)) * 100);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function escapeAssText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r?\n/g, ' ')
    .replace(/,/g, '\\,');
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
