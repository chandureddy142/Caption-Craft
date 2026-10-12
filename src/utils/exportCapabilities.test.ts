import { describe, expect, it } from 'vitest';
import { getSupportedWebmMimeType } from './exportCapabilities';

describe('WebM capability detection', () => {
  it('selects an audio-capable codec only when supported', () => {
    const support = { isTypeSupported: (mimeType: string) => mimeType === 'video/webm;codecs=vp8,opus' };
    expect(getSupportedWebmMimeType(true, support)).toBe('video/webm;codecs=vp8,opus');
    expect(getSupportedWebmMimeType(false, support)).toBe(null);
  });

  it('allows a video-only codec for silent exports', () => {
    const support = { isTypeSupported: (mimeType: string) => mimeType === 'video/webm;codecs=vp9' };
    expect(getSupportedWebmMimeType(false, support)).toBe('video/webm;codecs=vp9');
    expect(getSupportedWebmMimeType(true, support)).toBe(null);
  });
});
