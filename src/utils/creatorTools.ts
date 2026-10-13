import type { AspectRatio, AudioCut, CaptionLanguage, SafeZonePlatform, Subtitle } from '../types';
import { transliterateTeluguToTenglish } from './transliterate';

export interface HookSuggestion {
  id: string;
  title: string;
  style: 'curiosity' | 'technology' | 'educational' | 'creator';
}

export interface SafeZoneRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface PlatformSafeZone {
  platform: SafeZonePlatform;
  name: string;
  safeArea: { x: number; y: number; width: number; height: number };
  blocked: SafeZoneRegion[];
}

export function getPlatformSafeZone(platform: SafeZonePlatform, aspectRatio: AspectRatio): PlatformSafeZone {
  const landscape = aspectRatio === '16:9' || aspectRatio === '1:1';
  const safeArea = {
    x: landscape ? 0.08 : 0.12,
    y: landscape ? 0.09 : 0.11,
    width: landscape ? 0.84 : 0.76,
    height: landscape ? 0.8 : 0.78,
  };

  const blockedByPlatform: Record<SafeZonePlatform, SafeZoneRegion[]> = {
    instagram: [
      { x: 0.02, y: 0.02, width: 0.4, height: 0.14, label: 'Header' },
      { x: 0.86, y: 0.2, width: 0.12, height: 0.5, label: 'Engagement' },
      { x: 0.08, y: 0.86, width: 0.84, height: 0.12, label: 'Caption UI' },
    ],
    youtube: [
      { x: 0.02, y: 0.02, width: 0.28, height: 0.12, label: 'Header' },
      { x: 0.9, y: 0.16, width: 0.08, height: 0.5, label: 'Actions' },
      { x: 0.08, y: 0.88, width: 0.84, height: 0.1, label: 'Controls' },
    ],
    tiktok: [
      { x: 0.03, y: 0.02, width: 0.44, height: 0.12, label: 'Header' },
      { x: 0.9, y: 0.2, width: 0.08, height: 0.46, label: 'Engagement' },
      { x: 0.1, y: 0.88, width: 0.8, height: 0.12, label: 'Caption UI' },
    ],
  };

  return {
    platform,
    name: platform === 'instagram' ? 'Instagram Reels' : platform === 'youtube' ? 'YouTube Shorts' : 'TikTok',
    safeArea,
    blocked: blockedByPlatform[platform],
  };
}

export function isSafeZoneWarning(
  box: { x: number; y: number; width: number; height: number },
  platform: SafeZonePlatform,
  aspectRatio: AspectRatio,
): boolean {
  const zone = getPlatformSafeZone(platform, aspectRatio);
  const margin = 0.04;
  const nearLeft = box.x < zone.safeArea.x + margin;
  const nearTop = box.y < zone.safeArea.y + margin;
  const nearRight = box.x + box.width > zone.safeArea.x + zone.safeArea.width - margin;
  const nearBottom = box.y + box.height > zone.safeArea.y + zone.safeArea.height - margin;

  const overlapsBlocked = zone.blocked.some(region => {
    const left = box.x < region.x + region.width && box.x + box.width > region.x;
    const top = box.y < region.y + region.height && box.y + box.height > region.y;
    return left && top;
  });

  return nearLeft || nearTop || nearRight || nearBottom || overlapsBlocked;
}

function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(text: string): string[] {
  const cleaned = normalizeText(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .map(word => word.toLowerCase())
    .filter(word => !['this','that','with','from','your','they','about','have','been','would','there','about','into','their'].includes(word));
  const unique: string[] = [];
  for (const word of cleaned) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= 4) break;
  }
  return unique;
}

export function generateHookSuggestions(
  transcript: string | Subtitle[],
  language: CaptionLanguage,
): HookSuggestion[] {
  const content = Array.isArray(transcript)
    ? transcript.map(item => item.text).join(' ')
    : transcript;

  const normalized = normalizeText(content);
  if (!normalized) {
    return [
      { id: 'hook-empty-1', title: 'This one tip changes everything', style: 'educational' },
      { id: 'hook-empty-2', title: 'Here is the shortcut', style: 'creator' },
      { id: 'hook-empty-3', title: 'This is the part everyone misses', style: 'curiosity' },
    ];
  }

  const keywords = extractKeywords(normalized);
  const topic = keywords[0] ?? 'creator workflow';
  const topicTitle = topic
    .replace(/\b\w/g, char => char.toUpperCase());

  const fallbackSuggestions: HookSuggestion[] = [
    { id: 'hook-1', title: `This ${topicTitle} trick saves hours`, style: 'technology' },
    { id: 'hook-2', title: `You are doing ${topicTitle} wrong`, style: 'curiosity' },
    { id: 'hook-3', title: `One ${topicTitle} tip you should know`, style: 'educational' },
    { id: 'hook-4', title: `This is the ${topicTitle} shortcut`, style: 'creator' },
  ];

  if (language === 'te' || /[\u0C00-\u0C7F]/.test(normalized)) {
    const teluguTopic = transliterateTeluguToTenglish(topicTitle) || topicTitle;
    return [
      { id: 'hook-te-1', title: `${teluguTopic} tho easy workflow`, style: 'creator' },
      { id: 'hook-te-2', title: `Ee ${teluguTopic} trick enti?`, style: 'curiosity' },
      { id: 'hook-te-3', title: `${teluguTopic} gurinchi one simple tip`, style: 'educational' },
      { id: 'hook-te-4', title: `This ${teluguTopic} hack saves time`, style: 'technology' },
    ];
  }

  return fallbackSuggestions.slice(0, 4);
}

export function calculateDuckedMusicLevel(
  volume: number,
  speechActive: boolean,
  duckingEnabled = true,
  duckingRatio = 0.3,
  currentLevel?: number,
  attack = 0.12,
  release = 0.18,
): number {
  const safeVolume = Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1) : 0;
  const target = speechActive && duckingEnabled ? Math.min(safeVolume, safeVolume * duckingRatio) : safeVolume;
  if (currentLevel === undefined) return target;
  const normalizedCurrent = Number.isFinite(currentLevel) ? Math.min(Math.max(currentLevel, 0), 1) : 0;
  const smoothing = speechActive ? attack : release;
  const delta = target - normalizedCurrent;
  const step = Math.max(-smoothing, Math.min(smoothing, delta));
  return Math.min(1, Math.max(0, normalizedCurrent + step));
}

export function detectSilenceRegions(
  samples: Float32Array,
  sampleRate: number,
  options: { minDuration?: number; threshold?: number; windowSize?: number } = {},
): AudioCut[] {
  const minDuration = options.minDuration ?? 0.6;
  const threshold = options.threshold ?? 0.015;
  const windowSize = options.windowSize ?? Math.max(256, Math.floor(sampleRate * 0.02));

  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || samples.length === 0) {
    return [];
  }

  const cuts: AudioCut[] = [];
  let silentStart: number | null = null;
  let silentEnd: number | null = null;

  for (let index = 0; index < samples.length; index += windowSize) {
    const slice = samples.subarray(index, Math.min(index + windowSize, samples.length));
    let rms = 0;
    for (let i = 0; i < slice.length; i += 1) {
      rms += slice[i] * slice[i];
    }
    const energy = slice.length > 0 ? Math.sqrt(rms / slice.length) : 0;
    const isSilent = energy < threshold;

    if (isSilent) {
      if (silentStart === null) {
        silentStart = index / sampleRate;
      }
      silentEnd = (index + slice.length) / sampleRate;
    } else if (silentStart !== null && silentEnd !== null) {
      const duration = silentEnd - silentStart;
      if (duration >= minDuration) {
        cuts.push({
          id: `cut-${cuts.length + 1}`,
          start: silentStart,
          end: silentEnd,
          selected: true,
          reason: 'silence',
        });
      }
      silentStart = null;
      silentEnd = null;
    }
  }

  if (silentStart !== null && silentEnd !== null) {
    const duration = silentEnd - silentStart;
    if (duration >= minDuration) {
      cuts.push({
        id: `cut-${cuts.length + 1}`,
        start: silentStart,
        end: silentEnd,
        selected: true,
        reason: 'silence',
      });
    }
  }

  return cuts;
}

export function validateCustomFontFile(file: File): { valid: boolean; message: string; fontFamily?: string } {
  const name = file.name.toLowerCase();
  const allowed = ['.ttf', '.otf'];
  const isAllowed = allowed.some(extension => name.endsWith(extension));

  if (!isAllowed) {
    return { valid: false, message: 'Unsupported font format. Please upload a .ttf or .otf file.' };
  }

  if (file.size > 25 * 1024 * 1024) {
    return { valid: false, message: 'This font file is too large for safe project use. Please keep it under 25 MB.' };
  }

  const family = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  return { valid: true, message: 'Custom font ready for project use.', fontFamily: family };
}

export function exportToASS(subtitles: Subtitle[], language: CaptionLanguage = 'en'): string {
  const lines = subtitles.map((subtitle) => {
    const text = (language === 'tenglish' ? subtitle.tenglishText ?? subtitle.text : subtitle.text).trim() || ' ';
    const start = formatAssTime(subtitle.start);
    const end = formatAssTime(subtitle.end);
    const safeText = escapeAssText(text);
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${safeText}`;
  });

  return [
    '[Script Info]',
    'Title: CaptionCraft Export',
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Default,Arial,32,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1',
    '[Events]',
    ...lines,
  ].join('\n');
}

function formatAssTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const centiseconds = Math.floor((safe - Math.floor(safe)) * 100);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function escapeAssText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, ' ');
}
