import { describe, expect, it } from 'vitest';
import { getExportFormatAvailability, normalizeExportFilename } from './exportPage';

describe('export page helpers', () => {
  it('normalizes unsafe names and replaces video extensions', () => {
    expect(normalizeExportFilename('my:captions.webm', 'mp4')).toBe('my-captions.mp4');
    expect(normalizeExportFilename('   ', 'webm')).toBe('caption-export.webm');
  });

  it('reports unsupported formats honestly', () => {
    const recorder = { isTypeSupported: (mimeType: string) => mimeType === 'video/webm;codecs=vp8' };
    expect(getExportFormatAvailability('webm', false, recorder).supported).toBe(true);
    expect(getExportFormatAvailability('mp4', false, recorder)).toMatchObject({ supported: false, mimeType: null });
  });
});
