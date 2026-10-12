import { describe, expect, it } from 'vitest';
import { MAX_MEDIA_FILE_BYTES, validateMediaFile } from './mediaValidation';

describe('media validation', () => {
  it('accepts supported audio and video files below the browser limit', () => {
    expect(validateMediaFile(new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' }))).toBeNull();
    expect(validateMediaFile(new File(['video'], 'clip.mp4', { type: 'video/mp4' }))).toBeNull();
  });

  it('rejects empty, unsupported, and oversized files with actionable messages', () => {
    expect(validateMediaFile(new File([], 'empty.wav', { type: 'audio/wav' }))).toContain('non-empty');
    expect(validateMediaFile(new File(['data'], 'notes.txt', { type: 'text/plain' }))).toContain('supported audio');
    const oversized = { size: MAX_MEDIA_FILE_BYTES + 1, type: 'audio/wav', name: 'large.wav' } as File;
    expect(validateMediaFile(oversized)).toContain('256 MB');
  });
});
