/**
 * Gemini Caption Service
 * ----------------------
 * Replaces Whisper/WebWorker pipeline with Gemini 2.0 Flash for audio
 * transcription that natively supports Telugu, Tenglish (Roman-phonetic
 * Telugu), and English. Returns timestamped SubtitleSegment[] objects
 * ready to feed directly into the caption editor.
 *
 * Audio limits
 * - Gemini inline audio payload: up to 20 MB per request (~10–12 min of
 *   mono WAV at 16 kHz / 16-bit, or longer with compressed formats).
 * - For audio > 10 minutes the service automatically slices the Blob into
 *   10-minute chunks via createAudioChunkIterator and stitches timestamps
 *   using cumulative time offsets.
 *
 * Security note
 * - The API key is read from import.meta.env.VITE_GEMINI_API_KEY.
 * - For production deployments, proxy calls through a server-side endpoint.
 */

import type { CaptionLanguage, SourceLanguage, Subtitle } from '../types';
import { createAudioChunkIterator } from '../utils/audioExtractor';
import { segmentIntoShortCaptions } from '../utils/captionSegmentation';
import { mergeOverlappingSubtitles } from '../utils/subtitleValidation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Maximum audio chunk duration sent per Gemini request (seconds). */
const CHUNK_DURATION_SECONDS = 10 * 60; // 10 minutes
/** Small overlap to prevent word-boundary clipping at chunk seams. */
const CHUNK_OVERLAP_SECONDS = 0;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SubtitleSegment {
  id?: string;
  start: number; // seconds, relative to full audio
  end: number;   // seconds, relative to full audio
  text: string;
}

export interface GeminiTranscriptionProgress {
  completedChunks: number;
  totalChunks: number;
  percent: number;
  chunkIndex: number;
  chunkStart: number;
  chunkEnd: number;
  processedDuration: number;
  totalDuration: number;
}

export interface GeminiTranscriptionOptions {
  /** Source language spoken in the audio. */
  sourceLanguage?: SourceLanguage;
  /**
   * Caption output language format:
   * - 'en'       → clean English with punctuation
   * - 'te'       → native Unicode Telugu script
   * - 'tenglish' → Roman-phonetic Tenglish (transliteration, NOT translation)
   */
  captionLanguage?: CaptionLanguage;
  /** Abort signal to cancel in-flight requests. */
  signal?: AbortSignal;
  /** Called after each chunk completes. */
  onProgress?: (progress: GeminiTranscriptionProgress) => void;
  /** Called with cumulative subtitles after each chunk. */
  onPartialResult?: (subtitles: Subtitle[], progress: GeminiTranscriptionProgress) => void;
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class GeminiKeyMissingError extends Error {
  constructor() {
    super('CaptionCraft AI is not configured. Add the transcription provider key to your .env file to continue.');
    this.name = 'GeminiKeyMissingError';
  }
}

export class GeminiRateLimitError extends Error {
  constructor() {
    super('CaptionCraft AI rate limit reached. Please wait a moment and try again.');
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiPayloadError extends Error {
  constructor(message: string) {
    super(`CaptionCraft AI rejected the audio payload: ${message}`);
    this.name = 'GeminiPayloadError';
  }
}

export class GeminiTranscriptionError extends Error {
  readonly partialSubtitles: Subtitle[];
  readonly failedChunkIndex: number;
  constructor(message: string, failedChunkIndex: number, partialSubtitles: Subtitle[]) {
    super(message);
    this.name = 'GeminiTranscriptionError';
    this.failedChunkIndex = failedChunkIndex;
    this.partialSubtitles = partialSubtitles;
  }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  sourceLanguage: SourceLanguage,
  captionLanguage: CaptionLanguage,
): string {
  const baseInstruction = `You are a professional audio transcription engine. Analyse the provided audio and return a JSON object with a single key "segments" containing an array of timed subtitle segments. Each segment must have:
- "start": number (start time in seconds, relative to the beginning of this audio clip)
- "end": number (end time in seconds, must be > start)
- "text": string (the transcribed text for that time range)

Produce SHORT segments — ideally 3 to 10 words each — suitable for social-media video captions. Split at natural phrase boundaries. Do not exceed 12 words per segment. Ensure timestamps are precise and contiguous with no overlaps.`;

  if (captionLanguage === 'te') {
    return `${baseInstruction}

LANGUAGE RULES:
- The audio contains spoken Telugu.
- Transcribe ALL speech directly into native Unicode Telugu script (తెలుగు లిపి).
- Preserve colloquial and regional vocabulary exactly as spoken.
- Do NOT romanise, translate, or switch to English words.
- Correct common Telugu spelling for colloquial expressions.`;
  }

  if (captionLanguage === 'tenglish') {
    return `${baseInstruction}

LANGUAGE RULES — TENGLISH MODE (CRITICAL):
- The audio contains spoken Telugu.
- Transcribe the PHONETIC SOUNDS of Telugu speech using the Roman/Latin alphabet ONLY.
- This is called "Tenglish" — it is social-media style phonetic transliteration.
- Examples: "నేను రేపు వస్తున్నా" → "Nenu repu vasthunna", "చాలా బాగుంది" → "Chala bagundi".
- DO NOT translate meaning into English words.
- DO NOT use Telugu script Unicode characters.
- DO NOT use diacritics or special characters (pure ASCII a-z A-Z space punctuation only).
- Capture natural filler words ("aa", "ee", "enti") as they are spoken.`;
  }

  // English
  return `${baseInstruction}

LANGUAGE RULES:
- The audio contains spoken ${sourceLanguage === 'te' ? 'Telugu-English code-switching' : 'English'}.
- Transcribe exactly what is spoken in English with accurate punctuation and sentence casing.
- Do not add words that were not spoken.`;
}

// ---------------------------------------------------------------------------
// JSON schema for structured output
// ---------------------------------------------------------------------------

const SEGMENTS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    segments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' },
          text: { type: 'string' },
        },
        required: ['start', 'end', 'text'],
      },
    },
  },
  required: ['segments'],
} as const;

// ---------------------------------------------------------------------------
// Base64 helpers
// ---------------------------------------------------------------------------

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data-URL prefix (e.g. "data:audio/wav;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob as base64.'));
    reader.readAsDataURL(blob);
  });
}

function getBlobMimeType(blob: Blob): string {
  if (blob.type && blob.type !== 'application/octet-stream') return blob.type;
  return 'audio/wav'; // default for our extracted WAV blobs
}

// ---------------------------------------------------------------------------
// Single-chunk Gemini request
// ---------------------------------------------------------------------------

interface RawSegment {
  start: number;
  end: number;
  text: string;
}

async function transcribeChunkWithGemini(
  chunkBlob: Blob,
  chunkOffsetSeconds: number,
  systemPrompt: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<RawSegment[]> {
  const base64Audio = await blobToBase64(chunkBlob);
  const mimeType = getBlobMimeType(chunkBlob);

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Audio,
            },
          },
          {
            text: 'Transcribe this audio clip and return the timed segments JSON.',
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SEGMENTS_RESPONSE_SCHEMA,
      temperature: 0.1, // low temperature for factual transcription
    },
  };

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new Error(`Network error calling CaptionCraft AI: ${(error as Error).message}`);
  }

  if (response.status === 429) throw new GeminiRateLimitError();
  if (response.status === 400) {
    const body = await response.text().catch(() => '');
    throw new GeminiPayloadError(body || 'Bad request');
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`CaptionCraft AI error ${response.status}: ${body || response.statusText}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    error?: { message: string };
  };

  if (json.error) throw new Error(`CaptionCraft AI: ${json.error.message}`);

  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!rawText) return [];

  let parsed: { segments?: RawSegment[] };
  try {
    parsed = JSON.parse(rawText) as { segments?: RawSegment[] };
  } catch {
    // Try extracting JSON from markdown code fences
    const match = /```(?:json)?\s*([\s\S]*?)```/i.exec(rawText);
    if (match) {
      try {
        parsed = JSON.parse(match[1]) as { segments?: RawSegment[] };
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  const rawSegments = parsed.segments ?? [];

  // Apply chunk time offset and filter malformed entries
  return rawSegments
    .filter(
      (s): s is RawSegment =>
        typeof s.start === 'number' &&
        typeof s.end === 'number' &&
        typeof s.text === 'string' &&
        s.text.trim().length > 0 &&
        Number.isFinite(s.start) &&
        Number.isFinite(s.end) &&
        s.end > s.start,
    )
    .map(s => ({
      start: s.start + chunkOffsetSeconds,
      end: s.end + chunkOffsetSeconds,
      text: s.text.trim(),
    }));
}

// ---------------------------------------------------------------------------
// Segment → Subtitle conversion
// ---------------------------------------------------------------------------

function segmentsToSubtitles(
  segments: RawSegment[],
  chunkIndex: number,
  chunkStart: number,
  chunkEnd: number,
): Subtitle[] {
  const chunkDuration = chunkEnd - chunkStart;
  const result: Subtitle[] = [];
  let orderIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Timestamps from Gemini are already absolute (we applied offset in transcribeChunkWithGemini)
    // But for segmentIntoShortCaptions we need chunk-relative times
    const relStart = Math.max(0, seg.start - chunkStart);
    const relEnd = Math.min(chunkDuration, Math.max(relStart + 0.05, seg.end - chunkStart));

    const shortCaptions = segmentIntoShortCaptions(seg.text, relStart, relEnd, {
      chunkOffset: chunkStart,
      idPrefix: `g${chunkIndex}:${i}`,
    });
    for (const cap of shortCaptions) {
      result.push({ ...cap });
      orderIndex++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Transcribe an audio Blob using the Gemini 2.0 Flash model.
 *
 * Automatically chunks audio > 10 minutes and stitches timestamps.
 * Returns an array of normalized Subtitle objects ready for the editor.
 */
export async function transcribeWithGemini(
  audioBlob: Blob,
  options: GeminiTranscriptionOptions = {},
): Promise<Subtitle[]> {
  // Validate API key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new GeminiKeyMissingError();
  }

  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
    throw new Error('No audio blob provided for CaptionCraft AI transcription.');
  }

  const sourceLanguage = options.sourceLanguage ?? 'en';
  const captionLanguage = options.captionLanguage ?? (sourceLanguage === 'te' ? 'te' : 'en');
  const signal = options.signal;

  const systemPrompt = buildSystemPrompt(sourceLanguage, captionLanguage);

  throwIfAborted(signal);

  // Plan chunks
  const chunkPlan = await createAudioChunkIterator(audioBlob, {
    chunkDurationSeconds: CHUNK_DURATION_SECONDS,
    overlapSeconds: CHUNK_OVERLAP_SECONDS,
  });

  throwIfAborted(signal);

  if (chunkPlan.totalChunks === 0) return [];

  const allSubtitles: Subtitle[] = [];

  for await (const chunk of chunkPlan.chunks) {
    throwIfAborted(signal);

    let rawSegments: RawSegment[];
    try {
      rawSegments = await transcribeChunkWithGemini(
        chunk.blob,
        chunk.start,
        systemPrompt,
        apiKey,
        signal,
      );
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      const merged = mergeOverlappingSubtitles(allSubtitles);
      throw new GeminiTranscriptionError(
        error instanceof Error ? error.message : 'CaptionCraft AI transcription failed.',
        chunk.index,
        merged,
      );
    }

    const chunkSubtitles = segmentsToSubtitles(
      rawSegments,
      chunk.index,
      chunk.start,
      chunk.end,
    );
    allSubtitles.push(...chunkSubtitles);

    const completedChunks = chunk.index + 1;
    const progress: GeminiTranscriptionProgress = {
      completedChunks,
      totalChunks: chunkPlan.totalChunks,
      percent: Math.round((completedChunks / chunkPlan.totalChunks) * 100),
      chunkIndex: chunk.index,
      chunkStart: chunk.start,
      chunkEnd: chunk.end,
      processedDuration: chunk.end,
      totalDuration: chunkPlan.durationSeconds,
    };

    options.onProgress?.(progress);
    throwIfAborted(signal);

    const partial = mergeOverlappingSubtitles(allSubtitles);
    options.onPartialResult?.(partial, progress);
  }

  throwIfAborted(signal);
  return mergeOverlappingSubtitles(allSubtitles);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException('CaptionCraft AI transcription was cancelled.', 'AbortError');
  }
}
