import { describe, expect, it } from 'vitest';
import {
  CAPTION_TEMPLATES,
  getTemplateById,
  applyTemplateToSettings,
  DEFAULT_TEMPLATE_ID,
} from './captionTemplates';
import type { CanvasSettings } from '../types';

describe('Caption Templates', () => {
  const initialSettings: CanvasSettings = {
    aspectRatio: '9:16',
    backgroundColor: '#000000',
    backgroundTheme: 'midnight',
    backgroundOverlayOpacity: 0.2,
    fitMode: 'cover',
    fontFamily: "'Inter', sans-serif",
    fontSize: 48,
    textColor: '#ffffff',
    highlightColor: '#8b5cf6',
    boxColor: 'rgba(0,0,0,0.6)',
    style: 'kinetic',
    verticalPosition: 0.8,
    alignment: 'center',
    textBackground: true,
  };

  it('contains the 10 required art-directed templates', () => {
    expect(CAPTION_TEMPLATES).toHaveLength(10);
    const ids = CAPTION_TEMPLATES.map(t => t.id);
    expect(ids).toContain('classic-white');
    expect(ids).toContain('bold-creator');
    expect(ids).toContain('word-highlight');
    expect(ids).toContain('minimal-clean');
    expect(ids).toContain('cinematic');
    expect(ids).toContain('karaoke');
    expect(ids).toContain('yellow-emphasis');
    expect(ids).toContain('boxed-subtitle');
    expect(ids).toContain('telugu-friendly');
    expect(ids).toContain('tenglish-creator');
  });

  it('applies template properties without affecting aspect ratio or background theme', () => {
    const updated = applyTemplateToSettings(initialSettings, 'yellow-emphasis');
    expect(updated.selectedTemplateId).toBe('yellow-emphasis');
    expect(updated.textColor).toBe('#fde047');
    expect(updated.style).toBe('outline');
    // Aspect ratio and background remain untouched
    expect(updated.aspectRatio).toBe('9:16');
    expect(updated.backgroundTheme).toBe('midnight');
  });

  it('applies telugu-friendly template with appropriate font and styling', () => {
    const updated = applyTemplateToSettings(initialSettings, 'telugu-friendly');
    expect(updated.fontFamily).toBe("'Noto Sans Telugu', sans-serif");
    expect(updated.style).toBe('box');
    expect(updated.textBackground).toBe(true);
  });

  it('getTemplateById returns undefined for unknown template', () => {
    expect(getTemplateById('nonexistent' as any)).toBeUndefined();
    expect(getTemplateById(DEFAULT_TEMPLATE_ID)).toBeDefined();
  });
});
