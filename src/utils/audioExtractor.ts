/**
 * Audio preparation helpers used by the transcription service.
 *
 * The local Whisper worker accepts PCM WAV files. Keeping the conversion here
 * means every inference request has the same, known format: mono, 16-bit PCM,
 * 16 kHz.
 */

export const AUDIO_SAMPLE_RATE = 16_000;
export const AUDIO_CHANNELS = 1;
export const AUDIO_BITS_PER_SAMPLE = 16;
export const WAV_HEADER_SIZE = 44;
export const DEFAULT_CHUNK_DURATION_SECONDS = 300;
export const DEFAULT_CHUNK_OVERLAP_SECONDS = 1;

export interface AudioChunk {
  blob: Blob;
  index: number;
  start: number;
  end: number;
}

export interface AudioChunkOptions {
  chunkDurationSeconds?: number;
  overlapSeconds?: number;
}

export interface AudioChunkIterator {
  totalChunks: number;
  durationSeconds: number;
  chunks: AsyncGenerator<AudioChunk>;
}

let sharedAudioContext: AudioContext | null = null;
let audioContextCreation: Promise<AudioContext> | null = null;

interface WavInfo {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  blockAlign: number;
  dataOffset: number;
  dataSize: number;
  frameCount: number;
}

type AudioContextConstructor = new () => AudioContext;
type OfflineAudioContextConstructor = new (
  numberOfChannels: number,
  length: number,
  sampleRate: number,
) => OfflineAudioContext;

/** Decode a media file and produce a valid mono 16 kHz PCM WAV. */
export async function extractAudioToWav(file: File): Promise<Blob> {
  if (file.size === 0) {
    throw new Error('The selected file is empty and has no audio to transcribe.');
  }

  const OfflineAudioContextClass = getOfflineAudioContextConstructor();
  const audioContext = await getAudioContext();

  try {
    // decodeAudioData consumes the encoded buffer and we never reuse it. Avoid
    // an extra full-file copy here so long uploads do not briefly require twice
    // the encoded media size before resampling starts.
    const decoded = await audioContext.decodeAudioData(await file.arrayBuffer());
    const outputLength = Math.max(
      1,
      Math.round(decoded.length * AUDIO_SAMPLE_RATE / decoded.sampleRate),
    );
    const offlineContext = new OfflineAudioContextClass(
      AUDIO_CHANNELS,
      outputLength,
      AUDIO_SAMPLE_RATE,
    );
    const source = offlineContext.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineContext.destination);
    source.start(0);

    const resampled = await offlineContext.startRendering();
    return audioBufferToWav(resampled);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown audio decoding error';
    throw new Error(`Unable to decode the selected media for transcription: ${message}`);
  }
}

/**
 * Return the duration of a WAV blob without decoding the entire media stream.
 * For a non-WAV Blob (for example, the original video), the browser decoder is
 * used as a fallback.
 */
export async function getAudioDuration(source: Blob | ArrayBuffer): Promise<number> {
  const bytes = source instanceof Blob ? await source.arrayBuffer() : source.slice(0);

  try {
    const wav = readWavInfo(bytes);
    return wav.frameCount / wav.sampleRate;
  } catch {
    const audioContext = await getAudioContext();
    try {
      const decoded = await audioContext.decodeAudioData(bytes.slice(0));
      return decoded.duration;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown audio decoding error';
      throw new Error(`Unable to determine audio duration: ${message}`);
    }
  }
}

/** Return the duration of a PCM WAV ArrayBuffer, validating its header. */
export function getWavDuration(arrayBuffer: ArrayBuffer): number {
  const wav = readWavInfo(arrayBuffer);
  return wav.frameCount / wav.sampleRate;
}

/**
 * Read the duration of one of the normalized WAV blobs without copying its
 * PCM payload. The extractor writes a compact 44-byte header, so only that
 * header needs to be read for progress and chunk planning.
 */
export async function getWavDurationFromBlob(audioBlob: Blob): Promise<number> {
  const header = await audioBlob.slice(0, WAV_HEADER_SIZE).arrayBuffer();
  const wav = readNormalizedWavHeader(header, audioBlob.size);
  return wav.frameCount / wav.sampleRate;
}

/**
 * Calculate a compact peak envelope for the normalized WAV without copying the
 * entire PCM payload into another ArrayBuffer. The preview uses this for
 * audio-only media instead of pretending an audio file has a video frame.
 */
export async function getWavWaveform(audioBlob: Blob, sampleCount = 180): Promise<number[]> {
  if (!Number.isInteger(sampleCount) || sampleCount <= 0) {
    throw new Error('Waveform sample count must be a positive integer.');
  }
  const header = await audioBlob.slice(0, WAV_HEADER_SIZE).arrayBuffer();
  const wav = readNormalizedWavHeader(header, audioBlob.size);
  if (
    wav.audioFormat !== 1 ||
    wav.channels !== AUDIO_CHANNELS ||
    wav.sampleRate !== AUDIO_SAMPLE_RATE ||
    wav.bitsPerSample !== AUDIO_BITS_PER_SAMPLE
  ) {
    throw new Error('Waveform audio must be 16 kHz mono 16-bit PCM WAV.');
  }

  const peaks = new Float32Array(sampleCount);
  const stream = audioBlob.slice(wav.dataOffset, wav.dataOffset + wav.dataSize).stream();
  const reader = stream.getReader();
  let frameIndex = 0;
  let pendingLowByte: number | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      let offset = 0;
      if (pendingLowByte !== null && bytes.length > 0) {
        const sample = Math.abs(((bytes[0] << 8) | pendingLowByte) << 16 >> 16) / 32_768;
        const bucket = Math.min(sampleCount - 1, Math.floor(frameIndex * sampleCount / wav.frameCount));
        peaks[bucket] = Math.max(peaks[bucket], sample);
        frameIndex += 1;
        pendingLowByte = null;
        offset = 1;
      }
      for (; offset + 1 < bytes.length; offset += 2) {
        const sample = Math.abs(((bytes[offset + 1] << 8) | bytes[offset]) << 16 >> 16) / 32_768;
        const bucket = Math.min(sampleCount - 1, Math.floor(frameIndex * sampleCount / wav.frameCount));
        peaks[bucket] = Math.max(peaks[bucket], sample);
        frameIndex += 1;
      }
      if (offset < bytes.length) pendingLowByte = bytes[offset];
    }
  } finally {
    reader.releaseLock();
  }

  return Array.from(peaks);
}

/**
 * Split a normalized WAV into overlapping, independently valid WAV files.
 * Frame boundaries are used for both slicing and offsets so timestamps do not
 * accumulate floating point chunk-duration errors.
 */
export async function createAudioChunks(
  audioBlob: Blob,
  options: AudioChunkOptions = {},
): Promise<AudioChunk[]> {
  const plan = await createAudioChunkIterator(audioBlob, options);
  const chunks: AudioChunk[] = [];
  for await (const chunk of plan.chunks) chunks.push(chunk);
  return chunks;
}

/**
 * Create a lazy chunk stream. Only the current chunk's Blob wrapper and WAV
 * header are allocated; the source PCM remains in the original Blob and is
 * never copied into an in-memory array of every chunk. This is important for
 * long recordings where retaining all overlapping chunks can exhaust memory.
 */
export async function createAudioChunkIterator(
  audioBlob: Blob,
  options: AudioChunkOptions = {},
): Promise<AudioChunkIterator> {
  const { chunkDurationSeconds, overlapSeconds } = validateChunkOptions(options);
  let wav: WavInfo;
  try {
    // All blobs produced by extractAudioToWav use this compact layout. Fall
    // back to a full parse for externally supplied WAVs with extra chunks.
    try {
      wav = readNormalizedWavHeader(
        await audioBlob.slice(0, WAV_HEADER_SIZE).arrayBuffer(),
        audioBlob.size,
      );
    } catch {
      wav = readWavInfo(await audioBlob.arrayBuffer());
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid WAV data';
    throw new Error(`Audio must be a valid PCM WAV before transcription: ${message}`);
  }

  if (
    wav.audioFormat !== 1 ||
    wav.channels !== AUDIO_CHANNELS ||
    wav.sampleRate !== AUDIO_SAMPLE_RATE ||
    wav.bitsPerSample !== AUDIO_BITS_PER_SAMPLE
  ) {
    throw new Error(
      `Transcription audio must be ${AUDIO_SAMPLE_RATE} Hz, mono, 16-bit PCM WAV ` +
      `(received ${wav.sampleRate} Hz, ${wav.channels} channel(s), ${wav.bitsPerSample}-bit).`,
    );
  }

  const framesPerChunk = Math.max(1, Math.floor(chunkDurationSeconds * AUDIO_SAMPLE_RATE));
  const overlapFrames = Math.floor(overlapSeconds * AUDIO_SAMPLE_RATE);
  const stepFrames = framesPerChunk - overlapFrames;
  const totalChunks = wav.frameCount === 0
    ? 0
    : Math.ceil(Math.max(0, wav.frameCount - framesPerChunk) / stepFrames) + 1;

  async function* iterate(): AsyncGenerator<AudioChunk> {
    let index = 0;
    for (let startFrame = 0; startFrame < wav.frameCount; startFrame += stepFrames) {
      const endFrame = Math.min(wav.frameCount, startFrame + framesPerChunk);
      const dataStart = wav.dataOffset + startFrame * wav.blockAlign;
      const dataEnd = wav.dataOffset + endFrame * wav.blockAlign;
      const header = encodePcmWavHeader(endFrame - startFrame, AUDIO_SAMPLE_RATE);
      yield {
        blob: new Blob([header, audioBlob.slice(dataStart, dataEnd)], { type: 'audio/wav' }),
        index,
        start: startFrame / AUDIO_SAMPLE_RATE,
        end: endFrame / AUDIO_SAMPLE_RATE,
      };
      index += 1;
      if (endFrame === wav.frameCount) break;
    }
  }

  return {
    totalChunks,
    durationSeconds: wav.frameCount / AUDIO_SAMPLE_RATE,
    chunks: iterate(),
  };
}

/** Encode an AudioBuffer as mono, 16-bit PCM WAV. */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  if (buffer.length === 0) {
    throw new Error('Decoded audio contains no samples.');
  }

  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => (
    buffer.getChannelData(index)
  ));
  let peak = 0;
  for (let frame = 0; frame < buffer.length; frame += 1) {
    let sample = 0;
    for (const channel of channels) sample += channel[frame] ?? 0;
    sample /= Math.max(1, channels.length);
    peak = Math.max(peak, Math.abs(sample));
  }
  // Apply only modest gain. Quiet recordings become easier for Whisper to
  // recognize, while already-loud speech is never pushed into clipping.
  const gain = peak > 0 ? Math.min(1.5, 0.98 / peak) : 1;

  const pcm = new Uint8Array(buffer.length * 2);
  const view = new DataView(pcm.buffer);

  for (let frame = 0; frame < buffer.length; frame += 1) {
    let sample = 0;
    for (const channel of channels) sample += channel[frame] ?? 0;
    sample /= Math.max(1, channels.length);
    sample = Math.max(-1, Math.min(1, sample * gain));
    const pcmSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(frame * 2, pcmSample, true);
  }

  return new Blob([
    encodePcmWav(pcm, buffer.length, buffer.sampleRate),
  ], { type: 'audio/wav' });
}

function encodePcmWav(pcm: Uint8Array, frameCount: number, sampleRate: number): ArrayBuffer {
  const dataSize = pcm.byteLength;
  const output = new ArrayBuffer(WAV_HEADER_SIZE + dataSize);
  new Uint8Array(output, WAV_HEADER_SIZE).set(pcm);
  new Uint8Array(output, 0, WAV_HEADER_SIZE).set(new Uint8Array(
    encodePcmWavHeader(frameCount, sampleRate, dataSize),
  ));

  // frameCount is intentionally checked here, rather than silently allowing
  // malformed callers to create a header whose data size is not frame-aligned.
  if (dataSize !== frameCount * AUDIO_CHANNELS * (AUDIO_BITS_PER_SAMPLE / 8)) {
    throw new Error('PCM data does not match the declared WAV frame count.');
  }
  return output;
}

function encodePcmWavHeader(
  frameCount: number,
  sampleRate: number,
  dataSize = frameCount * AUDIO_CHANNELS * (AUDIO_BITS_PER_SAMPLE / 8),
): ArrayBuffer {
  const output = new ArrayBuffer(WAV_HEADER_SIZE);
  const view = new DataView(output);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, AUDIO_CHANNELS, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * AUDIO_CHANNELS * 2, true);
  view.setUint16(32, AUDIO_CHANNELS * 2, true);
  view.setUint16(34, AUDIO_BITS_PER_SAMPLE, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  return output;
}

function validateChunkOptions(options: AudioChunkOptions): {
  chunkDurationSeconds: number;
  overlapSeconds: number;
} {
  const chunkDurationSeconds = options.chunkDurationSeconds ?? DEFAULT_CHUNK_DURATION_SECONDS;
  const overlapSeconds = options.overlapSeconds ?? DEFAULT_CHUNK_OVERLAP_SECONDS;
  if (!Number.isFinite(chunkDurationSeconds) || chunkDurationSeconds <= 0) {
    throw new Error('Audio chunk duration must be greater than zero seconds.');
  }
  if (!Number.isFinite(overlapSeconds) || overlapSeconds < 0) {
    throw new Error('Audio chunk overlap cannot be negative.');
  }
  if (overlapSeconds >= chunkDurationSeconds) {
    throw new Error('Audio chunk overlap must be shorter than the chunk duration.');
  }
  return { chunkDurationSeconds, overlapSeconds };
}

function readWavInfo(arrayBuffer: ArrayBuffer): WavInfo {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 12 || readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
    throw new Error('missing RIFF/WAVE header');
  }

  let format: Omit<WavInfo, 'dataOffset' | 'dataSize' | 'frameCount'> | undefined;
  let dataOffset = -1;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const chunkData = offset + 8;
    if (chunkData + size > view.byteLength) throw new Error('WAV chunk extends beyond the file');

    if (chunkId === 'fmt ' && size >= 16) {
      format = {
        audioFormat: view.getUint16(chunkData, true),
        channels: view.getUint16(chunkData + 2, true),
        sampleRate: view.getUint32(chunkData + 4, true),
        bitsPerSample: view.getUint16(chunkData + 14, true),
        blockAlign: view.getUint16(chunkData + 12, true),
      };
    } else if (chunkId === 'data') {
      dataOffset = chunkData;
      dataSize = size;
      break;
    }
    offset = chunkData + size + (size % 2);
  }

  if (!format) throw new Error('WAV fmt chunk is missing or invalid');
  if (dataOffset < 0) throw new Error('WAV data chunk is missing');
  if (format.blockAlign <= 0 || dataSize % format.blockAlign !== 0) {
    throw new Error('WAV data is not aligned to complete audio frames');
  }

  return { ...format, dataOffset, dataSize, frameCount: dataSize / format.blockAlign };
}

function readNormalizedWavHeader(arrayBuffer: ArrayBuffer, blobSize: number): WavInfo {
  const view = new DataView(arrayBuffer);
  if (
    view.byteLength < WAV_HEADER_SIZE ||
    readAscii(view, 0, 4) !== 'RIFF' ||
    readAscii(view, 8, 4) !== 'WAVE' ||
    readAscii(view, 12, 4) !== 'fmt ' ||
    readAscii(view, 36, 4) !== 'data'
  ) {
    throw new Error('missing compact PCM WAV header');
  }

  const dataSize = view.getUint32(40, true);
  const format: WavInfo = {
    audioFormat: view.getUint16(20, true),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    blockAlign: view.getUint16(32, true),
    bitsPerSample: view.getUint16(34, true),
    dataOffset: WAV_HEADER_SIZE,
    dataSize,
    frameCount: 0,
  };
  if (format.blockAlign <= 0 || dataSize % format.blockAlign !== 0) {
    throw new Error('WAV data is not aligned to complete audio frames');
  }
  if (WAV_HEADER_SIZE + dataSize > blobSize) {
    throw new Error('WAV data extends beyond the file');
  }
  format.frameCount = dataSize / format.blockAlign;
  return format;
}

function getAudioContextConstructor(): AudioContextConstructor {
  const browserWindow = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const constructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  if (!constructor) throw new Error('This browser does not support audio decoding.');
  return constructor;
}

/**
 * Return the browser audio context shared by decoding and duration work.
 * Creating/closing a context for every upload can exhaust browser audio
 * resources, especially when a user replaces media repeatedly. A closed
 * context cannot be resumed, so it is replaced lazily on the next request.
 */
export async function getAudioContext(): Promise<AudioContext> {
  if (sharedAudioContext?.state === 'closed') {
    sharedAudioContext = null;
  }

  if (sharedAudioContext) {
    if (sharedAudioContext.state === 'suspended') {
      await sharedAudioContext.resume().catch(() => undefined);
    }
    return sharedAudioContext;
  }

  if (!audioContextCreation) {
    const AudioContextClass = getAudioContextConstructor();
    audioContextCreation = Promise.resolve().then(() => new AudioContextClass());
  }

  try {
    sharedAudioContext = await audioContextCreation;
    if (sharedAudioContext.state === 'suspended') {
      await sharedAudioContext.resume().catch(() => undefined);
    }
    return sharedAudioContext;
  } finally {
    audioContextCreation = null;
  }
}

function getOfflineAudioContextConstructor(): OfflineAudioContextConstructor {
  const browserWindow = window as unknown as {
    OfflineAudioContext?: OfflineAudioContextConstructor;
    webkitOfflineAudioContext?: OfflineAudioContextConstructor;
  };
  const constructor = browserWindow.OfflineAudioContext ?? browserWindow.webkitOfflineAudioContext;
  if (!constructor) throw new Error('This browser does not support audio resampling.');
  return constructor;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }
  return value;
}
