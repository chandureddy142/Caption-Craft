import type { CSSProperties } from 'react';

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

export type CaptionTemplateId = string;

export type BackgroundThemeId =
  | "original-video"
  | "midnight"
  | "deep-blue"
  | "studio"
  | "paper"
  | "gradient"
  | "sunset"
  | "gradient-sunset"
  | "gradient-aurora"
  | "gradient-pastel"
  | "gradient-nebula"
  | "pattern-topography"
  | "pattern-hex"
  | "pattern-halftone"
  | "pattern-dunes"
  | "custom-image"
  | "custom-video";

export type BackgroundFitMode = "cover" | "contain" | "stretch" | "blur-fill";

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
  letterSpacing?: number;
  lineHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  boxOpacity?: number;
  fontWeight?: FontWeightValue;
  textTransform?: "uppercase" | "none";
  wordPatterns?: WordStyleRule[];
  animation?: string;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
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

export type CaptionCategory = 'trending' | 'classic' | 'animations' | 'transitions' | 'boxes' | 'typo';

export type FontWeightValue = 'normal' | '600' | '700' | '800' | '900';

/**
 * Per-word style. Templates alternate rules by word index (index % rules.length),
 * so a 2-rule template styles "Caption" with rule 0 and "Craft" with rule 1.
 * The canvas renderer and the sidebar preview both read these fields.
 */
export interface WordStyleRule {
  /** Legacy alias of textColor. */
  color?: string;
  textColor?: string;
  /** Color while the word is actively spoken (needs word timings). */
  highlightColor?: string;
  /** Individual word background (box / pill / marker). */
  backgroundColor?: string;
  /** Corner radius in canvas px at the template's base font size. */
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  outlineColor?: string;
  outlineWidth?: number;
  underlineColor?: string;
  glowColor?: string;
  glowBlur?: number;
  /** Tilt in degrees. */
  rotation?: number;
  scale?: number;
  fontSizeMultiplier?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: FontWeightValue;
  uppercase?: boolean;
}

export interface TemplatePreviewSample {
  en: string;
  te: string;
  tenglish: string;
  [key: string]: string | undefined;
}

export interface PreviewToken {
  text: string;
  style?: CSSProperties;
  className?: string;
}

export interface CaptionTemplateDefinition {
  id: CaptionTemplateId;
  name: string;
  category?: CaptionCategory;
  description?: string;
  badge?: string;
  previewUrl?: string;
  previewSample?: string | TemplatePreviewSample;
  /** Optional manual override. When omitted, tokens are derived from wordPatterns. */
  previewTokens?: PreviewToken[];
  settings: Partial<CanvasSettings>;
  canvasSettings?: Partial<CanvasSettings>;
  wordPatterns?: WordStyleRule[];
  styleRules?: WordStyleRule[];
  isCustom?: boolean;
}
