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
