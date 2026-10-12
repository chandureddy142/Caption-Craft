import { describe, expect, it } from 'vitest';
import { exportToSRT, exportToVTT } from './exporter';

const subtitles = [{ id: '1', start: 0.125, end: 1.5, text: 'నమస్కారం', tenglishText: 'namaskaaram' }];

describe('caption exports', () => {
  it('exports SRT with selected Tenglish text', () => {
    expect(exportToSRT(subtitles, 'tenglish')).toContain('00:00:00,125 --> 00:00:01,500\nnamaskaaram');
  });

  it('exports valid VTT header and Telugu text', () => {
    const vtt = exportToVTT(subtitles, 'te');
    expect(vtt.startsWith('WEBVTT\n\n')).toBe(true);
    expect(vtt).toContain('నమస్కారం');
  });
});
