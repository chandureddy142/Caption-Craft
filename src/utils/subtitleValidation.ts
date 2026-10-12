import type { Subtitle } from '../types';

export const MIN_SUBTITLE_DURATION = 0.05;

export function normalizeSubtitles(subtitles: Subtitle[], duration = Number.POSITIVE_INFINITY): Subtitle[] {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return subtitles
    .map(subtitle => {
      const rawStart = Number.isFinite(subtitle.start) ? subtitle.start : 0;
      const startLimit = Number.isFinite(safeDuration)
        ? Math.max(0, safeDuration - MIN_SUBTITLE_DURATION)
        : safeDuration;
      const start = Math.max(0, Math.min(rawStart, startLimit));
      const requestedEnd = Number.isFinite(subtitle.end)
        ? subtitle.end
        : start + MIN_SUBTITLE_DURATION;
      const end = Math.min(
        safeDuration,
        Math.max(start + MIN_SUBTITLE_DURATION, requestedEnd),
      );
      return {
        ...subtitle,
        start,
        end: end > start ? end : Math.max(start + MIN_SUBTITLE_DURATION, safeDuration),
      };
    })
    .filter(subtitle => subtitle.end > subtitle.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);
}

export function mergeOverlappingSubtitles(subtitles: Subtitle[]): Subtitle[] {
  const ordered = normalizeSubtitles(subtitles);
  const merged: Subtitle[] = [];
  for (const candidate of ordered) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push(candidate);
      continue;
    }
    const overlap = Math.min(previous.end, candidate.end) - Math.max(previous.start, candidate.start);
    const previousText = normalizeText(previous.text);
    const candidateText = normalizeText(candidate.text);
    const sameText = previousText === candidateText;
    const relatedText = previousText.includes(candidateText) || candidateText.includes(previousText);
    if ((sameText || (overlap > 0.15 && relatedText)) && (overlap > 0 || Math.abs(previous.end - candidate.start) < 0.05)) {
      previous.start = Math.min(previous.start, candidate.start);
      previous.end = Math.max(previous.end, candidate.end);
      if (candidateText.length > previousText.length) previous.text = candidate.text;
      previous.words = [...(previous.words ?? []), ...(candidate.words ?? [])]
        .sort((left, right) => left.start - right.start)
        .filter((word, index, words) => index === 0 || word.word !== words[index - 1].word || Math.abs(word.start - words[index - 1].start) > 0.01);
    } else {
      merged.push(candidate);
    }
  }
  return merged.map((subtitle, index) => ({ ...subtitle, id: String(index + 1) }));
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
