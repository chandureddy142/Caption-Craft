import { describe, expect, it } from 'vitest';
import type { CanvasSettings, Subtitle } from '../types';
import { getSubtitleCanvasLayout, renderSubtitlesToCanvas } from './SubtitleRenderer';

const settings: CanvasSettings = {
  aspectRatio: '16:9',
  backgroundColor: '#000000',
  backgroundTheme: 'midnight',
  backgroundOverlayOpacity: 0.2,
  fitMode: 'cover',
  fontFamily: 'Arial',
  fontSize: 40,
  textColor: '#ffffff',
  highlightColor: '#8b5cf6',
  boxColor: '#000000',
  style: 'kinetic',
  verticalPosition: 0.8,
  alignment: 'center',
  textBackground: true,
};

function context(fillTexts: string[] = []): CanvasRenderingContext2D {
  return {
    save: () => undefined,
    restore: () => undefined,
    measureText: (text: string) => ({ width: text.length * 10 }) as TextMetrics,
    beginPath: () => undefined,
    roundRect: () => undefined,
    fill: () => undefined,
    fillText: (text: string) => fillTexts.push(text),
    strokeText: () => undefined,
    setLineDash: () => undefined,
  } as unknown as CanvasRenderingContext2D;
}

describe('subtitle renderer', () => {
  it('aligns hit-test layout with left and right rendered text', () => {
    const subtitle: Subtitle = { id: '1', start: 0, end: 2, text: 'hello' };
    const left = getSubtitleCanvasLayout(context(), 200, 100, 1, [subtitle], { ...settings, alignment: 'left', textBackground: false, style: 'minimalist' }, 'en');
    const right = getSubtitleCanvasLayout(context(), 200, 100, 1, [subtitle], { ...settings, alignment: 'right', textBackground: false, style: 'minimalist' }, 'en');
    expect(left?.left).toBe(75);
    expect(right?.x).toBe(125);
  });

  it('keeps kinetic highlighting active when a text background is enabled', () => {
    const fillTexts: string[] = [];
    const subtitle: Subtitle = {
      id: '1', start: 0, end: 2, text: 'hello world',
      words: [{ word: 'hello', start: 0, end: 1 }, { word: 'world', start: 1, end: 2 }],
    };
    renderSubtitlesToCanvas(context(fillTexts), 200, 100, 0.5, [subtitle], settings, 'en');
    expect(fillTexts).toEqual(['hello', 'world']);
  });
});
