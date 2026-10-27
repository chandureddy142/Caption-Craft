import type { Subtitle, SubtitleWord } from '../types';

export interface CaptionSegmentOptions {
  /** Maximum words per segment under normal conditions (default: 3) */
  maxWordsPerSegment?: number;
  /** Minimum words per segment under normal conditions (default: 2) */
  minWordsPerSegment?: number;
  /** Chunk time offset in seconds (default: 0) */
  chunkOffset?: number;
  /** Segment ID prefix */
  idPrefix?: string;
}

/**
 * Splits recognized speech into short, readable caption segments (normally 2–3 words)
 * with defensible timestamp alignment based on speech duration and word weights.
 */
export function segmentIntoShortCaptions(
  rawText: string,
  startTime: number,
  endTime: number,
  options: CaptionSegmentOptions = {},
): Subtitle[] {
  const text = rawText.trim();
  if (!text) return [];

  const maxWords = options.maxWordsPerSegment ?? 3;
  const minWords = options.minWordsPerSegment ?? 2;
  const chunkOffset = options.chunkOffset ?? 0;
  const idPrefix = options.idPrefix ?? `${Math.round(startTime * 100)}`;

  // Whisper speech segment duration in seconds
  const totalDuration = Math.max(0.05, endTime - startTime);

  // Split into whitespace-separated tokens, preserving attached punctuation
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  if (words.length === 0) return [];

  // If there are 3 or fewer words, keep as a single caption segment
  if (words.length <= maxWords) {
    const segmentStart = chunkOffset + startTime;
    const segmentEnd = chunkOffset + endTime;
    const wordDurations = allocateWordDurations(words, totalDuration);
    let currentWordStart = segmentStart;
    const subtitleWords: SubtitleWord[] = words.map((word, index) => {
      const wDuration = wordDurations[index];
      const wStart = currentWordStart;
      const wEnd = index === words.length - 1 ? segmentEnd : Math.min(segmentEnd, currentWordStart + wDuration);
      currentWordStart = wEnd;
      return { word, start: wStart, end: wEnd };
    });

    return [{
      id: `${idPrefix}:0`,
      start: segmentStart,
      end: segmentEnd,
      text,
      words: subtitleWords,
    }];
  }

  // Break words into groups of 2–3 words, preferring natural punctuation boundaries
  const wordGroups: string[][] = partitionWords(words, minWords, maxWords);

  // Allocate speech time across all individual words based on character length weight
  const allWordDurations = allocateWordDurations(words, totalDuration);

  const subtitles: Subtitle[] = [];
  let globalWordIndex = 0;
  let accumulatedTime = 0;

  for (let groupIndex = 0; groupIndex < wordGroups.length; groupIndex += 1) {
    const group = wordGroups[groupIndex];
    const groupStartIndex = globalWordIndex;
    const groupDuration = group.reduce(
      (sum, _, i) => sum + (allWordDurations[groupStartIndex + i] ?? 0),
      0,
    );

    const groupStart = chunkOffset + startTime + accumulatedTime;
    // For the final group, ensure it anchors exactly at chunkOffset + endTime
    const groupEnd = groupIndex === wordGroups.length - 1
      ? chunkOffset + endTime
      : Math.min(chunkOffset + endTime, groupStart + groupDuration);

    // Build word timestamps within this group
    let wordStartCursor = groupStart;
    const subtitleWords: SubtitleWord[] = group.map((word, i) => {
      const wDuration = allWordDurations[groupStartIndex + i] ?? (groupDuration / group.length);
      const wStart = wordStartCursor;
      const wEnd = (i === group.length - 1)
        ? groupEnd
        : Math.min(groupEnd, wordStartCursor + wDuration);
      wordStartCursor = wEnd;
      return { word, start: wStart, end: wEnd };
    });

    subtitles.push({
      id: `${idPrefix}:${groupIndex}`,
      start: groupStart,
      end: Math.max(groupStart + 0.05, groupEnd),
      text: group.join(' '),
      words: subtitleWords,
    });

    accumulatedTime += groupDuration;
    globalWordIndex += group.length;
  }

  return subtitles;
}

/**
 * Partitions an array of words into groups that are normally 2–3 words each.
 * Respects punctuation boundaries (commas, periods, questions, etc.) where practical.
 */
export function partitionWords(words: string[], minWords = 2, maxWords = 3): string[][] {
  const groups: string[][] = [];
  let index = 0;

  while (index < words.length) {
    const remaining = words.length - index;

    // Remaining words can fit in a single group
    if (remaining <= maxWords) {
      groups.push(words.slice(index));
      break;
    }

    // If remaining is 4, prefer 2 + 2 instead of 3 + 1
    if (remaining === 4) {
      // Check if word 0 or 1 has punctuation
      const splitAt = hasPunctuationBoundary(words[index]) ? 1 : 2;
      const take = splitAt === 1 && remaining - 1 <= maxWords ? 1 : 2;
      groups.push(words.slice(index, index + take));
      index += take;
      continue;
    }

    // If remaining is 5, prefer 3 + 2 or 2 + 3 based on punctuation
    if (remaining === 5) {
      let take = 3;
      if (hasPunctuationBoundary(words[index + 1])) {
        take = 2; // Split after word 1
      }
      groups.push(words.slice(index, index + take));
      index += take;
      continue;
    }

    // Default greedy choice: look ahead up to maxWords (3) for natural punctuation
    let take = maxWords;
    for (let candidate = minWords; candidate <= maxWords; candidate += 1) {
      if (index + candidate - 1 < words.length && hasPunctuationBoundary(words[index + candidate - 1])) {
        take = candidate;
        break;
      }
    }

    // Ensure we don't leave an awkward remainder of 1 word if possible
    if (remaining - take === 1) {
      take = take - 1 >= minWords ? take - 1 : take;
    }

    groups.push(words.slice(index, index + take));
    index += take;
  }

  return groups;
}

/**
 * Checks if a word ends with a phrase or sentence punctuation boundary.
 */
function hasPunctuationBoundary(word: string): boolean {
  return /[,.!?;:—–]$|[.!?]["']$/.test(word.trim());
}

/**
 * Calculates duration for each word proportional to its text/character length
 * and punctuation pauses within the parent segment duration.
 */
function allocateWordDurations(words: string[], totalDuration: number): number[] {
  if (words.length === 0) return [];
  if (words.length === 1) return [totalDuration];

  // Base character length + bonus weight for punctuation pauses
  const weights = words.map(w => {
    const cleanWord = w.replace(/[^\p{L}\p{N}]/gu, '');
    const baseWeight = Math.max(1, cleanWord.length);
    const pauseBonus = hasPunctuationBoundary(w) ? 1.5 : 0;
    return baseWeight + pauseBonus;
  });

  const totalWeight = weights.reduce((sum, wt) => sum + wt, 0);
  if (totalWeight <= 0) {
    const equalShare = totalDuration / words.length;
    return words.map(() => equalShare);
  }

  return weights.map(wt => (wt / totalWeight) * totalDuration);
}
