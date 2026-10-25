export type SafeZonePlatform = "instagram" | "tiktok" | "youtube" | "youtube-shorts" | "youtube-long";

export interface SafeZoneRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface PlatformSafeZone {
  name: string;
  safeArea: { x: number; y: number; width: number; height: number };
  blocked: SafeZoneRegion[];
}

export function getPlatformSafeZone(platform: string = "instagram", aspectRatio: string = "9:16"): PlatformSafeZone {
  if (platform === "youtube-long" || aspectRatio === "16:9") {
    return {
      name: "YouTube 16:9 Video",
      safeArea: { x: 0.05, y: 0.08, width: 0.9, height: 0.8 },
      blocked: [
        { x: 0, y: 0, width: 1, height: 0.1, label: "Title & Channel Header" },
        { x: 0, y: 0.86, width: 1, height: 0.14, label: "Controls & Scrub Bar" },
      ],
    };
  }

  if (platform === "youtube" || platform === "youtube-shorts") {
    return {
      name: "YouTube Shorts",
      safeArea: { x: 0.06, y: 0.11, width: 0.74, height: 0.64 },
      blocked: [
        { x: 0, y: 0, width: 1, height: 0.09, label: "Header" },
        { x: 0.84, y: 0.40, width: 0.16, height: 0.58, label: "Actions" },
        { x: 0, y: 0.76, width: 0.84, height: 0.24, label: "Channel & Title" },
      ],
    };
  }

  // Instagram Reels
  return {
    name: "Instagram Reels",
    safeArea: { x: 0.06, y: 0.10, width: 0.74, height: 0.65 },
    blocked: [
      { x: 0, y: 0, width: 1, height: 0.09, label: "Header" },
      { x: 0.84, y: 0.42, width: 0.16, height: 0.56, label: "Actions" },
      { x: 0, y: 0.78, width: 0.84, height: 0.22, label: "Profile & Caption" },
    ],
  };
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isSafeZoneWarning(
  boundsOrX: RectBounds | number,
  platformOrY?: string | number,
  aspectRatioOrWidth?: string | number,
  height?: number,
  platformArg?: string,
  aspectRatioArg?: string
): boolean {
  let bounds: RectBounds;
  let platform = "instagram";
  let aspectRatio = "9:16";

  if (typeof boundsOrX === "object" && boundsOrX !== null) {
    bounds = boundsOrX;
    if (typeof platformOrY === "string") platform = platformOrY;
    if (typeof aspectRatioOrWidth === "string") aspectRatio = aspectRatioOrWidth;
  } else {
    bounds = {
      x: Number(boundsOrX || 0),
      y: Number(platformOrY || 0),
      width: Number(aspectRatioOrWidth || 0),
      height: Number(height || 0),
    };
    if (platformArg) platform = platformArg;
    if (aspectRatioArg) aspectRatio = aspectRatioArg;
  }

  const zone = getPlatformSafeZone(platform, aspectRatio);
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  return zone.blocked.some(b => {
    return bounds.x < (b.x + b.width) && right > b.x && bounds.y < (b.y + b.height) && bottom > b.y;
  });
}

export function calculateDuckedMusicLevel(
  baseVolume: number = 1,
  isVoiceActive: boolean = false,
  isDuckingEnabled: boolean = true,
  duckedVolume: number = 0.3,
  _duckingAmount?: number
): number {
  if (!isDuckingEnabled) return baseVolume;
  return isVoiceActive ? duckedVolume : baseVolume;
}

export interface SilenceRegion {
  start: number;
  end: number;
  duration: number;
}

export function detectSilenceRegions(
  samples: Float32Array | number[],
  sampleRate: number,
  options?: { minDuration?: number; threshold?: number }
): SilenceRegion[] {
  if (!samples || samples.length === 0 || !sampleRate) return [];
  const minDuration = options?.minDuration ?? 0.4;
  const threshold = options?.threshold ?? 0.01;

  const regions: SilenceRegion[] = [];
  let inSilence = false;
  let silenceStartIndex = 0;

  for (let i = 0; i < samples.length; i++) {
    const isSilent = Math.abs(samples[i]) <= threshold;
    if (isSilent && !inSilence) {
      inSilence = true;
      silenceStartIndex = i;
    } else if (!isSilent && inSilence) {
      inSilence = false;
      const duration = (i - silenceStartIndex) / sampleRate;
      if (duration >= minDuration) {
        regions.push({
          start: silenceStartIndex / sampleRate,
          end: i / sampleRate,
          duration,
        });
      }
    }
  }

  if (inSilence) {
    const duration = (samples.length - silenceStartIndex) / sampleRate;
    if (duration >= minDuration) {
      regions.push({
        start: silenceStartIndex / sampleRate,
        end: samples.length / sampleRate,
        duration,
      });
    }
  }

  return regions;
}

export interface HookSuggestion {
  title: string;
  hook: string;
}

export function generateHookSuggestions(script: string, _language: string = "en"): HookSuggestion[] {
  if (!script || !script.trim()) return [];
  const words = script.trim().split(/s+/).slice(0, 5).join(" ");
  return [
    { title: words || "Hook suggestion", hook: "Stop scrolling: " + words },
    { title: "Key takeaway", hook: "Watch till the end to see what happens next" },
    { title: "Did you know?", hook: "The most important detail you should know" }
  ];
}

export function validateCustomFontFile(file: File | { name: string; size?: number }): { valid: boolean; message: string } {
  if (!file || !file.name) {
    return { valid: false, message: "No font file supplied." };
  }
  const isMatch = /.(ttf|otf|woff|woff2)$/i.test(file.name);
  if (!isMatch) {
    return { valid: false, message: "Unsupported font file type." };
  }
  return { valid: true, message: "Font ready for use." };
}

// Cached overlay image elements
const overlayImageCache: Record<string, HTMLImageElement> = {};

function getCachedOverlayImage(src: string): HTMLImageElement {
  if (!overlayImageCache[src]) {
    const img = new Image();
    img.src = src;
    overlayImageCache[src] = img;
  }
  return overlayImageCache[src];
}

export function drawPlatformUIOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  platform: string = "instagram",
  aspectRatio: string = "9:16"
) {
  ctx.save();

  // 1. Determine overlay asset based on platform
  let overlaySrc = "";
  if (platform === "instagram") {
    overlaySrc = "/overlays/instagram_reels.png";
  } else if (platform === "youtube" || platform === "youtube-shorts") {
    overlaySrc = "/overlays/youtube_shorts.png";
  } else if (platform === "youtube-long" || platform === "tiktok" || aspectRatio === "16:9") {
    overlaySrc = "/overlays/youtube_long.svg";
  }

  // 2. If a transparent PNG exists, draw the authentic UI layer
  if (overlaySrc) {
    const img = getCachedOverlayImage(overlaySrc);
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, width, height);
    }
  }

  // 3. Draw the clean, subtle safe boundary lines
  

  ctx.restore();
}