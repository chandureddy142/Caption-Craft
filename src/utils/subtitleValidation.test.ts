import { describe, expect, it } from 'vitest';
import { mergeOverlappingSubtitles, normalizeSubtitles } from './subtitleValidation';

describe('subtitle validation', () => {
  it('clamps invalid timing to the media duration and sorts segments', () => {
    const result = normalizeSubtitles([
      { id: 'b', start: 8, end: 2, text: 'second' },
      { id: 'a', start: -2, end: 1, text: 'first' },
    ], 10);

    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(1);
    expect(result[1].start).toBe(8);
    expect(result[1].end).toBe(8.05);
  });

  it('merges duplicate overlapping segments without inventing text', () => {
    const result = mergeOverlappingSubtitles([
      { id: '1', start: 0, end: 2, text: 'Hello' },
      { id: '2', start: 1.5, end: 3, text: 'hello' },
      { id: '3', start: 4, end: 5, text: 'Other' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ start: 0, end: 3, text: 'Hello' });
    expect(result[1].text).toBe('Other');
  });
});
