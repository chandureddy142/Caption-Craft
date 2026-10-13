import { describe, expect, it } from 'vitest';
import { partitionWords, segmentIntoShortCaptions } from './captionSegmentation';

describe('captionSegmentation', () => {
  describe('partitionWords', () => {
    it('keeps 1, 2, and 3 words in a single group', () => {
      expect(partitionWords(['hello'])).toEqual([['hello']]);
      expect(partitionWords(['hello', 'world'])).toEqual([['hello', 'world']]);
      expect(partitionWords(['one', 'two', 'three'])).toEqual([['one', 'two', 'three']]);
    });

    it('partitions 4 words into 2 + 2', () => {
      const result = partitionWords(['Hello', 'everyone', 'welcome', 'back']);
      expect(result).toEqual([
        ['Hello', 'everyone'],
        ['welcome', 'back'],
      ]);
    });

    it('partitions 5 words into 3 + 2 or 2 + 3 respecting punctuation', () => {
      const withComma = partitionWords(['Hello', 'there,', 'welcome', 'to', 'channel']);
      expect(withComma).toEqual([
        ['Hello', 'there,'],
        ['welcome', 'to', 'channel'],
      ]);

      const withoutComma = partitionWords(['One', 'two', 'three', 'four', 'five']);
      expect(withoutComma).toEqual([
        ['One', 'two', 'three'],
        ['four', 'five'],
      ]);
    });

    it('partitions 7 words into 2–3 word groups without dropping words', () => {
      const words = ['Hello', 'everyone,', 'welcome', 'back', 'to', 'my', 'channel'];
      const result = partitionWords(words);
      const flattened = result.flat();
      expect(flattened).toEqual(words);
      for (const group of result) {
        expect(group.length).toBeGreaterThanOrEqual(1);
        expect(group.length).toBeLessThanOrEqual(3);
      }
    });

    it('handles Telugu sentences and words cleanly', () => {
      const words = ['నమస్కారం', 'అండి,', 'అందరికీ', 'స్వాగతం', 'ఈ', 'రోజు', 'వీడియోకి'];
      const result = partitionWords(words);
      expect(result.flat()).toEqual(words);
      for (const group of result) {
        expect(group.length).toBeGreaterThanOrEqual(1);
        expect(group.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('segmentIntoShortCaptions', () => {
    it('returns empty array for empty or whitespace text', () => {
      expect(segmentIntoShortCaptions('', 0, 5)).toEqual([]);
      expect(segmentIntoShortCaptions('   ', 0, 5)).toEqual([]);
    });

    it('preserves start and end timestamps and attaches word timestamps', () => {
      const text = 'Hello everyone welcome back';
      const result = segmentIntoShortCaptions(text, 1.0, 3.0, { chunkOffset: 10 });
      expect(result.length).toBe(2);

      // Check first group
      expect(result[0].start).toBeCloseTo(11.0);
      expect(result[0].text).toBe('Hello everyone');
      expect(result[0].words).toBeDefined();
      expect(result[0].words?.length).toBe(2);
      expect(result[0].words?.[0].word).toBe('Hello');

      // Check second group ends exactly at chunkOffset + endTime
      expect(result[1].text).toBe('welcome back');
      expect(result[1].end).toBeCloseTo(13.0);
      expect(result[1].words?.[1].word).toBe('back');
      expect(result[1].words?.[1].end).toBeCloseTo(13.0);
    });

    it('ensures monotonic, non-overlapping timestamps within media boundaries', () => {
      const text = 'This is a longer speech sequence that needs to be segmented into short reels captions';
      const result = segmentIntoShortCaptions(text, 0, 10, { chunkOffset: 0 });

      let previousEnd = 0;
      for (const caption of result) {
        expect(caption.start).toBeGreaterThanOrEqual(previousEnd - 0.001);
        expect(caption.end).toBeGreaterThan(caption.start);
        expect(caption.end).toBeLessThanOrEqual(10.001);
        previousEnd = caption.end;
      }
      expect(result[result.length - 1].end).toBeCloseTo(10.0);
    });

    it('handles Telugu script and preserves punctuation', () => {
      const text = 'నమస్కారం అండి, ఈ రోజు వాతావరణం చాలా బాగుంది.';
      const result = segmentIntoShortCaptions(text, 0.5, 4.5);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].text).toContain('నమస్కారం');
      expect(result.map(r => r.text).join(' ')).toBe(text);

      for (const sub of result) {
        const wordCount = sub.text.split(/\s+/).length;
        expect(wordCount).toBeGreaterThanOrEqual(1);
        expect(wordCount).toBeLessThanOrEqual(3);
      }
    });

    it('correctly handles a single word without error', () => {
      const result = segmentIntoShortCaptions('అవును', 0.2, 0.8);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('అవును');
      expect(result[0].start).toBe(0.2);
      expect(result[0].end).toBe(0.8);
      expect(result[0].words?.[0].word).toBe('అవును');
    });
  });
});
