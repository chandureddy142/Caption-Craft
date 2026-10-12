/**
 * Upload validation is intentionally kept separate from audio decoding so the
 * UI can explain a rejected file before the browser allocates decode buffers.
 */
export const MAX_MEDIA_FILE_BYTES = 256 * 1024 * 1024;

const SUPPORTED_MEDIA_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|mp4|mov|webm|mkv)$/i;

export function validateMediaFile(file: File): string | null {
  if (file.size === 0) return 'Choose a non-empty audio or video file.';
  if (file.size > MAX_MEDIA_FILE_BYTES) {
    return 'This file is larger than the 256 MB browser limit. Choose a smaller media file.';
  }
  if (!file.type.startsWith('audio/') && !file.type.startsWith('video/') && !SUPPORTED_MEDIA_EXTENSIONS.test(file.name)) {
    return 'Choose a supported audio or video file: MP3, WAV, M4A, AAC, OGG, MP4, MOV, WEBM, or MKV.';
  }
  return null;
}

export function formatMediaLimit(): string {
  return `${MAX_MEDIA_FILE_BYTES / (1024 * 1024)} MB`;
}
