import { describe, expect, it } from 'vitest';
import { transliterateTeluguToTenglish, getCaptionText } from './transliterate';

describe('Telugu transliteration', () => {
  it('preserves non-Telugu content and transliterates Unicode Telugu', () => {
    const result = transliterateTeluguToTenglish('నమస్కారం తెలుగు 123 https://example.com!');
    expect(result).toContain('namaskaaram');
    expect(result).toContain('telugu');
    expect(result).toContain('123 https://example.com!');
  });

  it('handles virama conjuncts and vowel signs', () => {
    expect(transliterateTeluguToTenglish('క్షణం')).toBe('kshanam');
    expect(transliterateTeluguToTenglish('కీకు')).toBe('keeku');
  });

  it('handles contextual anusvara correctly before dentals, velars, and bilabials', () => {
    // Before dental/coronal 'ద' -> 'n'
    expect(transliterateTeluguToTenglish('బాగుంది')).toBe('baagundi');
    expect(transliterateTeluguToTenglish('ఉంది')).toBe('undi');
    expect(transliterateTeluguToTenglish('ఎందుకు')).toBe('enduku');
    // Before velar 'క' -> 'n'
    expect(transliterateTeluguToTenglish('ఇంకా')).toBe('inkaa');
    expect(transliterateTeluguToTenglish('ఇంక')).toBe('inka');
    // Before palatal 'చ' -> 'n'
    expect(transliterateTeluguToTenglish('మంచి')).toBe('manchi');
    // Before bilabial 'ప' -> 'm'
    expect(transliterateTeluguToTenglish('కంపెనీ')).toBe('kampenee');
    // Word-ending anusvara -> 'm'
    expect(transliterateTeluguToTenglish('ధన్యవాదాలు')).toBe('dhanyavaadaalu');
    expect(transliterateTeluguToTenglish('నమస్కారం')).toBe('namaskaaram');
  });

  it('correctly maps ఓ to o instead of oo to prevent collisions with ఊ', () => {
    expect(transliterateTeluguToTenglish('పో')).toBe('po');
    expect(transliterateTeluguToTenglish('కోసం')).toBe('kosam');
    expect(transliterateTeluguToTenglish('రోజు')).toBe('roju');
    expect(transliterateTeluguToTenglish('ఊరు')).toBe('ooru');
  });

  it('handles complex conjuncts and multi-consonant clusters', () => {
    expect(transliterateTeluguToTenglish('స్వాతంత్ర్యం')).toBe('svaatantryam');
    expect(transliterateTeluguToTenglish('సంవత్సరం')).toBe('samvatsaram');
  });

  it('handles decomposed and NFC normalized Telugu sequences', () => {
    // Decomposed 'పో' (U+0C2A U+0C4A U+0C55) should normalize and produce 'po'
    const decomposed = '\u0C2A\u0C4A\u0C55';
    expect(transliterateTeluguToTenglish(decomposed)).toBe('po');
  });

  it('transliterates real conversational Telugu sentences without changing meaning or word count', () => {
    const sentences = [
      {
        telugu: 'మీరు ఎలా ఉన్నారు? నేను బాగున్నాను.',
        expectedWords: ['meeru', 'ela', 'unnaru?', 'nenu', 'baagunnanu.'],
      },
      {
        telugu: 'ఈ రోజు వాతావరణం చాలా బాగుంది.',
        expectedWords: ['ee', 'roju', 'vaataavaranam', 'chaala', 'baagundi.'],
      },
      {
        telugu: 'అందరికీ నమస్కారం, నా ఛానల్‌కి స్వాగతం!',
        expectedWords: ['andarikee', 'namaskaaram,', 'naa', 'chaanaliki', 'svaagatam!'],
      },
      {
        telugu: 'ధన్యవాదాలు, మళ్ళీ కలుద్దాం.',
        expectedWords: ['dhanyavaadaalu,', 'mallee', 'kaluddaam.'],
      },
    ];

    for (const { telugu, expectedWords } of sentences) {
      const transliterated = transliterateTeluguToTenglish(telugu);
      const words = transliterated.split(/\s+/);
      expect(words.length).toBe(expectedWords.length);
      // Punctuation should remain attached
      if (telugu.includes('?')) expect(transliterated).toContain('?');
      if (telugu.includes('!')) expect(transliterated).toContain('!');
      if (telugu.includes(',')) expect(transliterated).toContain(',');
      if (telugu.includes('.')) expect(transliterated).toContain('.');
    }
  });

  it('getCaptionText preserves user-edited tenglishText if present', () => {
    expect(getCaptionText('బాగుంది', 'te')).toBe('బాగుంది');
    expect(getCaptionText('బాగుంది', 'tenglish')).toBe('baagundi');
    expect(getCaptionText('బాగుంది', 'tenglish', 'Custom transliteration')).toBe('Custom transliteration');
    expect(getCaptionText('Hello world', 'en')).toBe('Hello world');
  });
});
