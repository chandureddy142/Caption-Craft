export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface Subtitle {
  id: string;
  start: number;
  end: number;
  /** Canonical caption text. For Telugu speech this remains Telugu script. */
  text: string;
  /** A user-edited Roman-script version, kept separate from the Telugu source. */
  tenglishText?: string;
  words?: SubtitleWord[];
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type SubtitleStyle = 'kinetic' | 'box' | 'minimalist' | 'outline';

export type CaptionAlignment = 'left' | 'center' | 'right';

export type SourceLanguage = 'en' | 'te';

export type CaptionLanguage = 'en' | 'te' | 'tenglish';

export type CaptionTemplateId =
  | 'classic-white'
  | 'bold-creator'
  | 'word-highlight'
  | 'minimal-clean'
  | 'cinematic'
  | 'karaoke'
  | 'karaoke-highlight'
  | 'yellow-emphasis'
  | 'boxed-subtitle'
  | 'telugu-friendly'
  | 'tenglish-creator'
  | 'custom';

export type BackgroundThemeId =
  | 'original-video'
  | 'midnight'
  | 'deep-blue'
  | 'purple-haze'
  | 'sunset'
  | 'forest'
  | 'paper'
  | 'studio'
  | 'gradient'
  | 'custom-image'
  | 'custom-video';

export type BackgroundFitMode = 'cover' | 'contain';

export type SafeZonePlatform = 'instagram' | 'youtube' | 'tiktok';

export interface HookOverlay {
  id: string;
  text: string;
  enabled: boolean;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outlineColor?: string;
  outlineWidth?: number;
  horizontalAlign: 'left' | 'center' | 'right';
  verticalPosition: number; // 0 = top, 1 = bottom
  xPosition?: number; // 0..1 normalized
  yPosition?: number; // 0..1 normalized
}

export interface SafeZoneSettings {
  platform: SafeZonePlatform;
  show: boolean;
}

export interface BackgroundMusicSettings {
  enabled: boolean;
  volume: number; // 0..1
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  startOffset: number;
  looping: boolean;
  duckingEnabled: boolean;
  duckingRatio: number; // target ducked volume ratio, default 0.3
  attack: number;
  release: number;
}

export interface ImportedFontAsset {
  id: string;
  fileName: string;
  fontFamily: string;
  format: 'ttf' | 'otf';
  dataUrl?: string;
  sizeBytes: number;
}

export interface BrandKit {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  captionBackground: string;
  defaultPosition: number;
  hookFontFamily: string;
  hookTextColor: string;
  watermarkEnabled: boolean;
  watermarkOpacity: number;
  logoUrl?: string;
}

export interface CaptionAnimationSettings {
  style: 'karaoke' | 'word-bounce' | 'bold-creator' | 'yellow-emphasis' | 'minimal' | 'subtle';
  wordHighlightEnabled: boolean;
  emojiEnhancement: boolean;
}

export interface AudioCut {
  id: string;
  start: number;
  end: number;
  selected: boolean;
  reason: 'silence';
}

export interface ProjectExportPreferences {
  subtitleFormat: 'srt' | 'vtt' | 'ass';
  includeHookOverlay: boolean;
  includeWatermark: boolean;
  audioExportFormat?: 'wav' | 'mp3';
}

export interface CanvasSettings {
  aspectRatio: AspectRatio;
  backgroundColor: string;
  backgroundTheme: BackgroundThemeId;
  customImageDataUrl?: string;
  customVideoUrl?: string;
  backgroundOverlayOpacity: number; // 0 to 0.9 darkening overlay
  fitMode: BackgroundFitMode;
  selectedTemplateId?: CaptionTemplateId;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  boxColor: string;
  style: SubtitleStyle;
  verticalPosition: number; // 0 (top) to 1 (bottom)
  alignment: CaptionAlignment;
  textBackground: boolean;
  hookOverlay?: HookOverlay;
  safeZones?: SafeZoneSettings;
  backgroundMusic?: BackgroundMusicSettings;
  importedFonts?: ImportedFontAsset[];
  brandKitId?: string;
  animationSettings?: CaptionAnimationSettings;
  audioCuts?: AudioCut[];
  exportPreferences?: ProjectExportPreferences;
  watermarkEnabled?: boolean;
  watermarkOpacity?: number;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
}

/** The four export quality presets exposed in the Export Modal. */
export type ExportResolutionPreset = '720p' | '1080p' | '2K' | '4K';

/**
 * Per-preset pixel dimensions and target bitrate for the MediaRecorder.
 * widthLandscape / heightLandscape → 16:9 and 1:1/4:5 variants.
 * widthVertical / heightVertical   → 9:16 variant.
 */
export interface ExportResolutionConfig {
  label: string;
  /** Width when aspect ratio is landscape (16:9) or square (1:1). */
  widthLandscape: number;
  /** Height when aspect ratio is landscape (16:9) or square (1:1). */
  heightLandscape: number;
  /** Width for vertical / portrait orientations (9:16, 4:5). */
  widthVertical: number;
  /** Height for vertical / portrait orientations (9:16, 4:5). */
  heightVertical: number;
  /** MediaRecorder.videoBitsPerSecond target. */
  videoBitsPerSecond: number;
}
