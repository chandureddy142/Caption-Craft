/**
 * Deterministic Telugu to Tenglish (Roman script) transliteration.
 *
 * Telugu consonants carry an inherent "a" unless they are followed by a
 * vowel sign or a virama. Processing code points rather than whitespace-
 * separated words keeps English, URLs, numbers, punctuation, and spacing
 * byte-for-byte intact while also handling conjunct consonants and
 * contextual anusvara correctly.
 */

import type { CaptionLanguage } from '../types';

const independentVowels: Readonly<Record<string, string>> = {
  'అ': 'a',
  'ఆ': 'aa',
  'ఇ': 'i',
  'ఈ': 'ee',
  'ఉ': 'u',
  'ఊ': 'oo',
  'ఋ': 'ru',
  'ౠ': 'roo',
  'ఌ': 'lu',
  'ౡ': 'loo',
  'ఎ': 'e',
  'ఏ': 'e',
  'ఐ': 'ai',
  'ఒ': 'o',
  'ఓ': 'o',
  'ఔ': 'au',
};

// Stems intentionally omit the inherent vowel, which is added below only
// when a consonant has neither a vowel sign nor a following virama.
const consonantStems: Readonly<Record<string, string>> = {
  'క': 'k',
  'ఖ': 'kh',
  'గ': 'g',
  'ఘ': 'gh',
  'ఙ': 'ng',
  'చ': 'ch',
  'ఛ': 'chh',
  'జ': 'j',
  'ఝ': 'jh',
  'ఞ': 'ny',
  'ట': 't',
  'ఠ': 'th',
  'డ': 'd',
  'ఢ': 'dh',
  'ణ': 'n',
  'త': 't',
  'థ': 'th',
  'ద': 'd',
  'ధ': 'dh',
  'న': 'n',
  'ప': 'p',
  'ఫ': 'ph',
  'బ': 'b',
  'భ': 'bh',
  'మ': 'm',
  'య': 'y',
  'ర': 'r',
  'ఱ': 'r',
  'ల': 'l',
  'ళ': 'l',
  'వ': 'v',
  'శ': 'sh',
  'ష': 'sh',
  'స': 's',
  'హ': 'h',
};

const vowelSigns: Readonly<Record<string, string>> = {
  'ా': 'aa',
  'ి': 'i',
  'ీ': 'ee',
  'ు': 'u',
  'ూ': 'oo',
  'ృ': 'ru',
  'ౄ': 'roo',
  'ె': 'e',
  'ే': 'e',
  'ై': 'ai',
  'ొ': 'o',
  'ో': 'o',
  'ౌ': 'au',
  'ౢ': 'lu',
  'ౣ': 'loo',
};

const VIRAMA = '్';
const ZWNJ = '\u200C';
const ZWJ = '\u200D';

// Consonant groups for contextual anusvara ('ం') transliteration:
// Bilabials (p, ph, b, bh, m) -> 'm'
const bilabialConsonants = new Set(['ప', 'ఫ', 'బ', 'భ', 'మ']);
// Coronal/Velar/Palatal consonants (t, th, d, dh, ch, j, k, g, etc.) -> 'n'
const coronalVelarPalatalConsonants = new Set([
  'క', 'ఖ', 'గ', 'ఘ',
  'చ', 'ఛ', 'జ', 'ఝ',
  'ట', 'ఠ', 'డ', 'ఢ', 'ణ',
  'త', 'థ', 'ద', 'ధ', 'న',
]);

const marks: Readonly<Record<string, string>> = {
  'ఀ': 'm', // combining candrabindu above
  'ఁ': 'm', // candrabindu
  'ః': 'h', // visarga
  'ఄ': 'm', // combining anusvara above
  '఼': '',  // nukta
  'ఽ': "'", // avagraha
  'ౕ': '',  // length mark
  'ౖ': '',  // ai length mark
};

/**
 * Transliterates Unicode Telugu text into natural, readable Tenglish (Roman script).
 * Preserves Latin characters, numbers, URLs, punctuation, and emojis.
 */
export function transliterateTeluguToTenglish(text: string): string {
  if (!text) return '';
  // Normalize Unicode to NFC so decomposed vowel signs are composed
  const normalized = text.normalize('NFC');
  const codePoints = Array.from(normalized);
  let result = '';

  for (let index = 0; index < codePoints.length; index += 1) {
    const character = codePoints[index];

    // Skip zero-width non-joiners/joiners
    if (character === ZWNJ || character === ZWJ) {
      continue;
    }

    const consonant = consonantStems[character];
    if (consonant !== undefined) {
      result += consonant;
      let nextIndex = index + 1;

      // Skip any intervening ZWNJ/ZWJ before checking for virama or vowel sign
      while (codePoints[nextIndex] === ZWNJ || codePoints[nextIndex] === ZWJ) {
        nextIndex += 1;
      }

      const nextCharacter = codePoints[nextIndex];

      if (nextCharacter === VIRAMA) {
        // Consonant followed by virama: skip virama and any attached ZWNJ/ZWJ
        index = nextIndex;
        while (codePoints[index + 1] === ZWNJ || codePoints[index + 1] === ZWJ) {
          index += 1;
        }
      } else {
        const vowelSign = vowelSigns[nextCharacter];
        if (vowelSign !== undefined) {
          result += vowelSign;
          index = nextIndex;
        } else {
          // If the next character is not a virama or a vowel sign, the inherent 'a' is pronounced
          result += 'a';
        }
      }
      continue;
    }

    const vowel = independentVowels[character];
    if (vowel !== undefined) {
      result += vowel;
      continue;
    }

    // Context-sensitive Anusvara ('ం')
    if (character === 'ం') {
      let lookaheadIndex = index + 1;
      while (codePoints[lookaheadIndex] === ZWNJ || codePoints[lookaheadIndex] === ZWJ) {
        lookaheadIndex += 1;
      }
      const nextChar = codePoints[lookaheadIndex];

      if (nextChar && bilabialConsonants.has(nextChar)) {
        result += 'm';
      } else if (nextChar && coronalVelarPalatalConsonants.has(nextChar)) {
        result += 'n';
      } else {
        result += 'm';
      }
      continue;
    }

    const mark = marks[character];
    if (mark !== undefined) {
      result += mark;
      continue;
    }

    // Preserve every non-Telugu character exactly, including ASCII words,
    // URLs, numbers, punctuation, whitespace, emoji, and unknown symbols.
    result += character;
  }

  return result;
}

/**
 * Return the text that should be shown/exported for the selected caption mode.
 * `text` is deliberately kept as the canonical value so switching between
 * Telugu, Tenglish, and English never destroys the source transcript.
 * When a user edits Tenglish directly, that edit is stored in `tenglishText`
 * and reused until the canonical Telugu text is edited again.
 */
export function getCaptionText(
  text: string,
  language: CaptionLanguage,
  tenglishText?: string,
): string {
  if (language === 'tenglish') {
    return tenglishText ?? transliterateTeluguToTenglish(text);
  }
  return text;
}
