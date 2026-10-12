import type { CanvasSettings, CaptionTemplateId } from '../types';

export interface CaptionTemplateDefinition {
  id: CaptionTemplateId;
  name: string;
  description: string;
  badge?: string;
  settings: Partial<CanvasSettings>;
  previewSample: {
    en: string;
    te: string;
    tenglish: string;
  };
}

export const CAPTION_TEMPLATES: CaptionTemplateDefinition[] = [
  {
    id: 'classic-white',
    name: 'Classic White',
    description: 'White text with a crisp dark outline for all media.',
    settings: {
      textColor: '#ffffff',
      highlightColor: '#8b5cf6',
      boxColor: '#000000',
      style: 'outline',
      fontFamily: "'Inter', sans-serif",
      fontSize: 46,
      verticalPosition: 0.82,
      alignment: 'center',
      textBackground: false,
    },
    previewSample: {
      en: 'Classic White',
      te: 'తెలుగు శీర్షిక',
      tenglish: 'Telugu Caption',
    },
  },
  {
    id: 'bold-creator',
    name: 'Bold Creator',
    description: 'Punchy social media style with active gold highlight.',
    badge: 'Popular',
    settings: {
      textColor: '#ffffff',
      highlightColor: '#facc15',
      boxColor: 'rgba(0, 0, 0, 0.85)',
      style: 'kinetic',
      fontFamily: "'Inter', sans-serif",
      fontSize: 52,
      verticalPosition: 0.78,
      alignment: 'center',
      textBackground: true,
    },
    previewSample: {
      en: 'Bold Creator',
      te: 'ముఖ్యమైన సమాచారం',
      tenglish: 'Bold Creator',
    },
  },
  {
    id: 'word-highlight',
    name: 'Word Highlight',
    description: 'Dynamic word-level glow with refined typography.',
    settings: {
      textColor: '#f1f5f9',
      highlightColor: '#a855f7',
      boxColor: 'rgba(15, 23, 42, 0.65)',
      style: 'kinetic',
      fontFamily: "'Inter', sans-serif",
      fontSize: 48,
      verticalPosition: 0.8,
      alignment: 'center',
      textBackground: false,
    },
    previewSample: {
      en: 'Word Highlight',
      te: 'పదాల ప్రాధాన్యత',
      tenglish: 'Word Highlight',
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Restrained typography with soft drop shadows and no box.',
    settings: {
      textColor: '#f8fafc',
      highlightColor: '#8b5cf6',
      boxColor: 'rgba(0, 0, 0, 0.5)',
      style: 'minimalist',
      fontFamily: "'Inter', sans-serif",
      fontSize: 40,
      verticalPosition: 0.85,
      alignment: 'center',
      textBackground: false,
    },
    previewSample: {
      en: 'Minimal Clean',
      te: 'సరళమైన శైలి',
      tenglish: 'Minimal Clean',
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Lower-positioned subtitle with warm ivory tones.',
    settings: {
      textColor: '#fef08a',
      highlightColor: '#fef08a',
      boxColor: 'rgba(0, 0, 0, 0.9)',
      style: 'outline',
      fontFamily: 'Georgia, serif',
      fontSize: 38,
      verticalPosition: 0.88,
      alignment: 'center',
      textBackground: false,
    },
    previewSample: {
      en: 'Cinematic Movie',
      te: 'చలనచిత్ర శైలి',
      tenglish: 'Cinematic Movie',
    },
  },
  {
    id: 'karaoke',
    name: 'Karaoke',
    description: 'High-contrast cyan active word tracking over slate box.',
    settings: {
      textColor: '#94a3b8',
      highlightColor: '#38bdf8',
      boxColor: 'rgba(15, 23, 42, 0.8)',
      style: 'kinetic',
      fontFamily: "'Inter', sans-serif",
      fontSize: 46,
      verticalPosition: 0.8,
      alignment: 'center',
      textBackground: true,
    },
    previewSample: {
      en: 'Karaoke Beat',
      te: 'పాటల సాహిత్యం',
      tenglish: 'Karaoke Beat',
    },
  },
  {
    id: 'yellow-emphasis',
    name: 'Yellow Emphasis',
    description: 'High-visibility yellow subtitles with a bold black stroke.',
    badge: 'High Contrast',
    settings: {
      textColor: '#fde047',
      highlightColor: '#fde047',
      boxColor: '#000000',
      style: 'outline',
      fontFamily: "'Inter', sans-serif",
      fontSize: 50,
      verticalPosition: 0.8,
      alignment: 'center',
      textBackground: false,
    },
    previewSample: {
      en: 'Yellow Emphasis',
      te: 'స్పష్టమైన పసుపు',
      tenglish: 'Yellow Emphasis',
    },
  },
  {
    id: 'boxed-subtitle',
    name: 'Boxed Subtitle',
    description: 'Crisp captions inside a rounded semi-transparent dark box.',
    settings: {
      textColor: '#ffffff',
      highlightColor: '#a78bfa',
      boxColor: 'rgba(15, 23, 42, 0.88)',
      style: 'box',
      fontFamily: "'Inter', sans-serif",
      fontSize: 44,
      verticalPosition: 0.8,
      alignment: 'center',
      textBackground: true,
    },
    previewSample: {
      en: 'Boxed Subtitle',
      te: 'చతురస్ర శీర్షిక',
      tenglish: 'Boxed Subtitle',
    },
  },
  {
    id: 'telugu-friendly',
    name: 'Telugu Friendly',
    description: 'Generous line height and spacing tuned for Telugu Lipi.',
    badge: 'తెలుగు',
    settings: {
      textColor: '#ffffff',
      highlightColor: '#38bdf8',
      boxColor: 'rgba(0, 0, 0, 0.82)',
      style: 'box',
      fontFamily: "'Noto Sans Telugu', sans-serif",
      fontSize: 44,
      verticalPosition: 0.8,
      alignment: 'center',
      textBackground: true,
    },
    previewSample: {
      en: 'Telugu Friendly',
      te: 'తెలుగు అక్షరమాల',
      tenglish: 'Telugu Friendly',
    },
  },
  {
    id: 'tenglish-creator',
    name: 'Tenglish Creator',
    description: 'Modern romanized Telugu style with mint accent highlights.',
    badge: 'Tenglish',
    settings: {
      textColor: '#ffffff',
      highlightColor: '#34d399',
      boxColor: 'rgba(0, 0, 0, 0.8)',
      style: 'kinetic',
      fontFamily: "'Inter', sans-serif",
      fontSize: 48,
      verticalPosition: 0.78,
      alignment: 'center',
      textBackground: true,
    },
    previewSample: {
      en: 'Tenglish Creator',
      te: 'తెలుగు మాటలు',
      tenglish: 'Tenglish Creator',
    },
  },
];

export function getTemplateById(id: CaptionTemplateId): CaptionTemplateDefinition | undefined {
  return CAPTION_TEMPLATES.find(template => template.id === id);
}

export function applyTemplateToSettings(
  current: CanvasSettings,
  templateId: CaptionTemplateId,
): CanvasSettings {
  const template = getTemplateById(templateId);
  if (!template) {
    return { ...current, selectedTemplateId: templateId };
  }
  return {
    ...current,
    ...template.settings,
    selectedTemplateId: templateId,
  };
}

export const DEFAULT_TEMPLATE_ID: CaptionTemplateId = 'classic-white';
