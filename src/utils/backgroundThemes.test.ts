import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_THEMES,
  getBackgroundTheme,
  drawBackgroundToCanvas,
} from './backgroundThemes';

describe('Background Themes', () => {
  it('contains all required built-in visual themes and original video', () => {
    const ids = BACKGROUND_THEMES.map(t => t.id);
    expect(ids).toContain('original-video');
    expect(ids).toContain('midnight');
    expect(ids).toContain('deep-blue');
    expect(ids).toContain('purple-haze');
    expect(ids).toContain('sunset');
    expect(ids).toContain('forest');
    expect(ids).toContain('paper');
    expect(ids).toContain('studio');
    expect(ids).toContain('gradient');
    expect(ids).toContain('custom-image');
    expect(ids).toContain('custom-video');
  });

  it('retrieves theme definition by id', () => {
    const theme = getBackgroundTheme('sunset');
    expect(theme).toBeDefined();
    expect(theme?.name).toBe('Sunset');
    expect(getBackgroundTheme('unknown' as any)).toBeUndefined();
  });

  it('draws built-in background gradient without throwing on mock context', () => {
    const mockCtx = {
      createLinearGradient: () => ({
        addColorStop: () => undefined,
      }),
      fillStyle: '',
      fillRect: () => undefined,
      drawImage: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    expect(() => {
      drawBackgroundToCanvas(mockCtx, {
        themeId: 'deep-blue',
        width: 1080,
        height: 1920,
        overlayOpacity: 0.3,
      });
    }).not.toThrow();
  });
});
