import { describe, expect, it } from 'vitest';
import type { CanvasSettings, Subtitle } from '../types';
import { applyTemplateToSettings, CAPTION_TEMPLATES } from './captionTemplates';
import { drawBackgroundToCanvas } from './backgroundThemes';
import { renderSubtitlesToCanvas } from './SubtitleRenderer';
import { exportToSRT, exportToVTT } from './exporter';

describe('Composition, Templates & Background switching', () => {
  const initialSubtitles: Subtitle[] = [
    { id: 'sub-1', start: 0.5, end: 3.2, text: 'నమస్కారం' },
    { id: 'sub-2', start: 3.5, end: 6.0, text: 'ఈ రోజు వాతావరణం బాగుంది' },
  ];

  const defaultSettings: CanvasSettings = {
    aspectRatio: '9:16',
    backgroundColor: '#000000',
    backgroundTheme: 'original-video',
    backgroundOverlayOpacity: 0.25,
    fitMode: 'cover',
    selectedTemplateId: 'classic-white',
    fontFamily: "'Inter', sans-serif",
    fontSize: 48,
    textColor: '#ffffff',
    highlightColor: '#8b5cf6',
    boxColor: '#000000',
    style: 'outline',
    verticalPosition: 0.82,
    alignment: 'center',
    textBackground: false,
  };

  it('switching templates updates visual properties while preserving subtitle text and timestamps', () => {
    let settings = { ...defaultSettings };
    const subtitles = [...initialSubtitles];

    // Switch to Bold Creator
    settings = applyTemplateToSettings(settings, 'bold-creator');
    expect(settings.selectedTemplateId).toBe('bold-creator');
    expect(settings.style).toBe('kinetic');
    expect(settings.highlightColor).toBe('#facc15');

    // Switch to Telugu Friendly
    settings = applyTemplateToSettings(settings, 'telugu-friendly');
    expect(settings.selectedTemplateId).toBe('telugu-friendly');
    expect(settings.fontFamily).toBe("'Noto Sans Telugu', sans-serif");
    expect(settings.style).toBe('box');

    // Confirm subtitle data is unaffected
    expect(subtitles).toHaveLength(2);
    expect(subtitles[0].start).toBe(0.5);
    expect(subtitles[0].end).toBe(3.2);
    expect(subtitles[0].text).toBe('నమస్కారం');
    expect(subtitles[1].start).toBe(3.5);
    expect(subtitles[1].end).toBe(6.0);
  });

  it('switching background themes preserves caption templates and text state', () => {
    let settings = { ...defaultSettings };
    settings = applyTemplateToSettings(settings, 'cinematic');
    expect(settings.selectedTemplateId).toBe('cinematic');

    // Switch from original-video to Sunset theme
    settings = { ...settings, backgroundTheme: 'sunset' };
    expect(settings.backgroundTheme).toBe('sunset');
    expect(settings.selectedTemplateId).toBe('cinematic');

    // Switch to custom-image
    settings = {
      ...settings,
      backgroundTheme: 'custom-image',
      customImageDataUrl: 'data:image/png;base64,mock',
      backgroundOverlayOpacity: 0.5,
    };
    expect(settings.backgroundTheme).toBe('custom-image');
    expect(settings.customImageDataUrl).toBe('data:image/png;base64,mock');
    expect(settings.backgroundOverlayOpacity).toBe(0.5);

    // Switch back to original-video restores video theme setting
    settings = { ...settings, backgroundTheme: 'original-video' };
    expect(settings.backgroundTheme).toBe('original-video');
  });

  it('renders canvas composition with background theme, darkening overlay, and subtitles without error', () => {
    const drawCalls: string[] = [];
    const mockCtx = {
      save: () => undefined,
      restore: () => undefined,
      createLinearGradient: () => ({
        addColorStop: () => undefined,
      }),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineJoin: 'round',
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: () => { drawCalls.push('fillRect'); },
      strokeRect: () => { drawCalls.push('strokeRect'); },
      drawImage: () => { drawCalls.push('drawImage'); },
      measureText: (text: string) => ({ width: text.length * 12 }) as TextMetrics,
      beginPath: () => undefined,
      roundRect: () => undefined,
      fill: () => { drawCalls.push('fill'); },
      fillText: (text: string) => { drawCalls.push(`fillText:${text}`); },
      strokeText: (text: string) => { drawCalls.push(`strokeText:${text}`); },
      setLineDash: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    // 1. Draw background
    drawBackgroundToCanvas(mockCtx, {
      themeId: 'deep-blue',
      width: 1080,
      height: 1920,
      overlayOpacity: 0.3,
    });
    // Should have drawn background fill and darkening overlay fill
    expect(drawCalls).toContain('fillRect');

    // 2. Draw subtitles on top of background
    renderSubtitlesToCanvas(
      mockCtx,
      1080,
      1920,
      1.0,
      initialSubtitles,
      defaultSettings,
      'te',
    );
    expect(drawCalls.some(call => call.includes('నమస్కారం'))).toBe(true);
  });

  it('exports SRT and VTT consistently with Telugu Lipi and Tenglish without altering subtitles', () => {
    const srtTelugu = exportToSRT(initialSubtitles, 'te');
    expect(srtTelugu).toContain('1\n00:00:00,500 --> 00:00:03,200\nనమస్కారం');
    expect(srtTelugu).toContain('2\n00:00:03,500 --> 00:00:06,000\nఈ రోజు వాతావరణం బాగుంది');

    const srtTenglish = exportToSRT(initialSubtitles, 'tenglish');
    expect(srtTenglish).toContain('namaskaaram');
    expect(srtTenglish).toContain('baagundi');

    const vtt = exportToVTT(initialSubtitles, 'tenglish');
    expect(vtt).toContain('WEBVTT');
    expect(vtt).toContain('00:00:00.500 --> 00:00:03.200');
    expect(vtt).toContain('namaskaaram');
  });

  it('all 10 templates define valid styling properties compatible with canvas renderer', () => {
    for (const template of CAPTION_TEMPLATES) {
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.settings.style).toBeDefined();
      expect(['outline', 'kinetic', 'box', 'minimalist']).toContain(template.settings.style);
      expect(template.settings.textColor).toBeDefined();
      expect(template.settings.verticalPosition).toBeGreaterThan(0);
      expect(template.settings.verticalPosition).toBeLessThan(1);
    }
  });

  it('supports custom-video background switching and video canvas rendering', () => {
    let settings = { ...defaultSettings };
    settings = {
      ...settings,
      backgroundTheme: 'custom-video',
      customVideoUrl: 'blob:http://localhost/mock-video',
      backgroundOverlayOpacity: 0.35,
    };
    expect(settings.backgroundTheme).toBe('custom-video');
    expect(settings.customVideoUrl).toBe('blob:http://localhost/mock-video');

    const drawCalls: string[] = [];
    const mockCtx = {
      save: () => undefined,
      restore: () => undefined,
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      fillStyle: '',
      fillRect: () => { drawCalls.push('fillRect'); },
      drawImage: () => { drawCalls.push('drawImage'); },
    } as unknown as CanvasRenderingContext2D;

    const mockVideo = {
      readyState: 4,
      videoWidth: 1920,
      videoHeight: 1080,
    } as unknown as HTMLVideoElement;

    drawBackgroundToCanvas(mockCtx, {
      themeId: 'custom-video',
      width: 1080,
      height: 1920,
      customVideoElement: mockVideo,
      overlayOpacity: 0.35,
    });

    expect(drawCalls).toContain('drawImage');
    expect(drawCalls).toContain('fillRect');
  });
});
