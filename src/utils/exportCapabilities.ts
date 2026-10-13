import type { AspectRatio, ExportResolutionPreset, ExportResolutionConfig } from '../types';

export interface MediaRecorderSupport {
  isTypeSupported: (mimeType: string) => boolean;
}

/** @deprecated Use getPreferredMimeType() which also probes MP4. */
export function getSupportedWebmMimeType(
  hasAudio: boolean,
  support?: MediaRecorderSupport,
): string | null {
  const recorder = support ?? (typeof MediaRecorder === 'undefined' ? undefined : MediaRecorder);
  if (!recorder) return null;
  const candidates = hasAudio
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return candidates.find(candidate => recorder.isTypeSupported(candidate)) ?? null;
}

/**
 * Returns the best supported MIME type for MediaRecorder, prioritising:
 * VP9+Opus (WebM) → H.264+AAC (MP4) → generic WebM.
 */
export function getPreferredMimeType(hasAudio: boolean): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = hasAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/webm',
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/mp4;codecs=avc1',
        'video/webm',
      ];
  return candidates.find(c => MediaRecorder.isTypeSupported(c)) ?? null;
}

// ---------------------------------------------------------------------------
// Resolution Presets
// ---------------------------------------------------------------------------

/**
 * Canonical export resolution configurations.
 * Landscape dimensions cover 16:9, 1:1, and 4:5 aspect ratios.
 * Vertical dimensions cover 9:16.
 */
export const EXPORT_RESOLUTION_PRESETS: Record<ExportResolutionPreset, ExportResolutionConfig> = {
  '720p': {
    label: '720p HD',
    widthLandscape: 1280,
    heightLandscape: 720,
    widthVertical: 720,
    heightVertical: 1280,
    videoBitsPerSecond: 4_000_000,
  },
  '1080p': {
    label: '1080p Full HD',
    widthLandscape: 1920,
    heightLandscape: 1080,
    widthVertical: 1080,
    heightVertical: 1920,
    videoBitsPerSecond: 8_000_000,
  },
  '2K': {
    label: '2K QHD',
    widthLandscape: 2560,
    heightLandscape: 1440,
    widthVertical: 1440,
    heightVertical: 2560,
    videoBitsPerSecond: 16_000_000,
  },
  '4K': {
    label: '4K UHD',
    widthLandscape: 3840,
    heightLandscape: 2160,
    widthVertical: 2160,
    heightVertical: 3840,
    videoBitsPerSecond: 35_000_000,
  },
};

/**
 * Resolves the exact pixel dimensions for a given preset + aspect ratio.
 * 9:16 uses the vertical dimensions; all others use landscape dimensions
 * adjusted to maintain the exact ratio.
 */
export function getExportDimensions(
  preset: ExportResolutionPreset,
  aspectRatio: AspectRatio,
): { width: number; height: number; videoBitsPerSecond: number } {
  const config = EXPORT_RESOLUTION_PRESETS[preset];
  const bps = config.videoBitsPerSecond;

  switch (aspectRatio) {
    case '9:16':
      return { width: config.widthVertical, height: config.heightVertical, videoBitsPerSecond: bps };
    case '16:9':
      return { width: config.widthLandscape, height: config.heightLandscape, videoBitsPerSecond: bps };
    case '1:1':
      // Square: use the landscape height for both dimensions
      return { width: config.heightLandscape, height: config.heightLandscape, videoBitsPerSecond: bps };
    case '4:5': {
      // Portrait 4:5: derive from landscape height
      const h = config.heightLandscape;
      return { width: Math.round(h * (4 / 5)), height: h, videoBitsPerSecond: bps };
    }
    default:
      return { width: config.widthLandscape, height: config.heightLandscape, videoBitsPerSecond: bps };
  }
}
