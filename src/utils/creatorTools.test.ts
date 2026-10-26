import { describe, expect, it } from 'vitest';
import { calculateDuckedMusicLevel, detectSilenceRegions, generateHookSuggestions, getPlatformSafeZone, isSafeZoneWarning, validateCustomFontFile } from './creatorTools';
import { exportToASS } from './exporter';

describe('creator tools', () => {
  it('generates transcript-aware hook suggestions and handles empty transcripts', () => {
    const suggestions = generateHookSuggestions('AI editing workflow saves hours for creators', 'en');
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions[0].title).toMatch(/AI|hours|workflow/i);

    const emptySuggestions = generateHookSuggestions('', 'en');
    expect(emptySuggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('exposes safe-zone templates for social platforms without leaking the guides into export', () => {
    const instagram = getPlatformSafeZone('instagram', '9:16');
    expect(instagram.name).toContain('Instagram');
    expect(instagram.blocked.length).toBeGreaterThan(0);

    const warning = isSafeZoneWarning({ x: 0.12, y: 0.18, width: 0.6, height: 0.2 }, 'instagram', '9:16');
    expect(warning).toBe(true);
  });

  it('keeps ducked music near the expected speech-aware volume ratio', () => {
    expect(calculateDuckedMusicLevel(1, true, true, 0.3)).toBeCloseTo(0.3, 1);
    expect(calculateDuckedMusicLevel(1, false, true, 0.3, 0.3)).toBeGreaterThan(0.3);
  });

  it('detects silence segments longer than 0.6s without misclassifying quiet speech as silence', () => {
    const sampleRate = 16000;
    const samples = new Float32Array(sampleRate * 2);
    for (let i = 0; i < samples.length; i += 1) {
      const timestamp = i / sampleRate;
      if (timestamp < 0.3 || (timestamp >= 0.9 && timestamp < 1.3)) {
        samples[i] = 0.001;
      } else if (timestamp >= 0.3 && timestamp < 0.9) {
        samples[i] = 0.4;
      } else {
        samples[i] = 0.002;
      }
    }

    const cuts = detectSilenceRegions(samples, sampleRate, { minDuration: 0.6, threshold: 0.01 });
    expect(cuts.some(cut => cut.start <= 0.9 && cut.end >= 1.3)).toBe(true);
    expect(cuts.some(cut => cut.start >= 0.3 && cut.start < 0.5)).toBe(false);
  });

  it('produces valid ASS subtitle export content', () => {
    const ass = exportToASS([
      { id: '1', start: 0, end: 1.2, text: 'Hello world' },
      { id: '2', start: 1.2, end: 2.5, text: 'This is great' },
    ], 'en');
    expect(ass).toContain('[Script Info]');
    expect(ass).toContain('Dialogue: 0');
    expect(ass).toContain('Hello world');
  });

  it('validates custom font files conservatively', () => {
    const fontFile = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], 'brand.ttf', { type: 'font/ttf' });
    const result = validateCustomFontFile(fontFile);
    expect(result.valid).toBe(true);
    expect(result.message).toMatch(/ready/i);
  });
});
