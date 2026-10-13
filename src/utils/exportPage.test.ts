import { describe, expect, it } from 'vitest';
import { getExportFormatAvailability, normalizeExportFilename } from './exportPage';

describe('export page helpers', () => {
  it('normalizes unsafe names and replaces video extensions', () => {
    expect(normalizeExportFilename('my:captions.webm', 'mp4')).toBe('my-captions.mp4');
    expect(normalizeExportFilename('   ', 'webm')).toBe('caption-export.webm');
    expect(normalizeExportFilename(' final-cut.mp4... ', 'webm')).toBe('final-cut.webm');
    expect(normalizeExportFilename('source.mkv', 'webm')).toBe('source.webm');
  });

  it('reports browser staging support for FFmpeg containers', () => {
    const recorder = { isTypeSupported: (mimeType: string) => mimeType === 'video/webm;codecs=vp8' };
    expect(getExportFormatAvailability('webm', false, recorder).supported).toBe(true);
    expect(getExportFormatAvailability('mp4', false, recorder)).toMatchObject({ supported: true, mimeType: null });
    expect(getExportFormatAvailability('mkv', true, recorder)).toMatchObject({ supported: true, mimeType: null });
  });

  it('describes the local x264 FFmpeg path', () => {
    const unsupported = { isTypeSupported: () => false };
    expect(getExportFormatAvailability('mp4', true, unsupported).message).toContain('FFmpeg.wasm');
    expect(getExportFormatAvailability('mp4', true, unsupported).supported).toBe(true);
  });
});
