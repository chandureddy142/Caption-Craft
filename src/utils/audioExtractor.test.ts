import { describe, expect, it } from 'vitest';
import { getWavWaveform } from './audioExtractor';

function makeWav(samples: number[]): Blob {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, value: string) => value.split('').forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16_000, true);
  view.setUint32(28, 32_000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  samples.forEach((sample, index) => view.setInt16(44 + index * 2, sample, true));
  return new Blob([buffer], { type: 'audio/wav' });
}

describe('audio waveform extraction', () => {
  it('returns peak amplitudes from normalized PCM without inventing a video frame', async () => {
    const waveform = await getWavWaveform(makeWav([0, 0, 16_384, -32_768, 0, 8_192, 0, 0]), 4);
    expect(waveform).toHaveLength(4);
    expect(waveform[0]).toBe(0);
    expect(waveform[1]).toBeCloseTo(1);
    expect(waveform[2]).toBeCloseTo(0.25);
    expect(waveform[3]).toBe(0);
  });
});
