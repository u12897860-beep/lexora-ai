// Text utilities for Uzbek: apostrophe normalization, transliteration,
// tokenization, script detection.

/** The character used internally by every language-processing module. */
export const CANONICAL_UZBEK_APOSTROPHE = 'ʻ';

// Keep this list deliberately narrow. In particular, a quote is only treated
// as an Uzbek apostrophe when it follows O/o or G/g (see the helper below).
const APOSTROPHE_VARIANTS = new Set(["'", '‘', '’', 'ʻ', 'ʼ', '`']);

function isUzbekApostropheAt(text: string, index: number): boolean {
  if (!APOSTROPHE_VARIANTS.has(text[index])) return false;

  const previous = text[index - 1];
  if (!/[oOgG]/.test(previous ?? '')) return false;

  // Oʻ/Gʻ followed by a letter is unambiguously part of a word. A final
  // apostrophe is also valid after g (for example, "togʻ"). Requiring this
  // context prevents ordinary opening/closing quotes from becoming letters.
  const next = text[index + 1];
  return /[a-zA-Z]/.test(next ?? '') || /[gG]/.test(previous);
}

/**
 * Normalize apostrophes that form the Uzbek Oʻ/oʻ and Gʻ/gʻ letters.
 *
 * This is a one-code-unit-for-one-code-unit substitution: it intentionally
 * does not call String.normalize(), so offsets in the user's original UTF-16
 * text remain valid. Quotes and apostrophes outside an Uzbek letter are left
 * untouched.
 */
export function normalizeApostrophe(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += isUzbekApostropheAt(text, i) ? CANONICAL_UZBEK_APOSTROPHE : text[i];
  }
  return result;
}

/** True when a word contains a recognized, non-canonical Uzbek apostrophe. */
export function hasNonCanonicalUzbekApostrophe(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (isUzbekApostropheAt(text, i) && text[i] !== CANONICAL_UZBEK_APOSTROPHE) return true;
  }
  return false;
}

/** Lowercase that preserves special characters. */
export function lower(text: string): string {
  return text.toLowerCase();
}

export interface Token {
  text: string;        // the raw token text
  normalizedText: string; // canonical analysis form (same UTF-16 length)
  start: number;       // start index in original text
  end: number;         // end index
  isWord: boolean;     // true if this is a word (letters), false if punctuation/space
}

/** Tokenize text into words and non-words, preserving positions. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    // Check if it's a letter (including Uzbek special chars)
    if (isWordCharacter(text, i)) {
      let j = i;
      while (j < text.length && isWordCharacter(text, j)) j++;
      const raw = text.slice(i, j);
      tokens.push({ text: raw, normalizedText: normalizeApostrophe(raw), start: i, end: j, isWord: true });
      i = j;
    } else {
      let j = i;
      while (j < text.length && !isWordCharacter(text, j)) j++;
      const raw = text.slice(i, j);
      tokens.push({ text: raw, normalizedText: raw, start: i, end: j, isWord: false });
      i = j;
    }
  }
  return tokens;
}

function isWordCharacter(text: string, index: number): boolean {
  const ch = text[index];
  // Latin letters
  if (/[a-zA-Z]/.test(ch)) return true;
  // Cyrillic letters
  if (/[а-яА-ЯёЁ]/.test(ch)) return true;
  return isUzbekApostropheAt(text, index);
}

/** Detect if text is predominantly Cyrillic or Latin. */
export function detectScript(text: string): 'latin' | 'cyrillic' {
  let cyrillic = 0;
  let latin = 0;
  for (const ch of text) {
    if (/[а-яА-ЯёЁ]/.test(ch)) cyrillic++;
    if (/[a-zA-Z]/.test(ch)) latin++;
  }
  return cyrillic > latin ? 'cyrillic' : 'latin';
}

// Latin → Cyrillic mapping for Uzbek
const LATIN_TO_CYRILLIC: Record<string, string> = {
  'a': 'а', 'A': 'А', 'b': 'б', 'B': 'Б', 'd': 'д', 'D': 'Д',
  'e': 'е', 'E': 'Е', 'f': 'ф', 'F': 'Ф', 'g': 'г', 'G': 'Г',
  'h': 'ҳ', 'H': 'Ҳ', 'i': 'и', 'I': 'И', 'j': 'ж', 'J': 'Ж',
  'k': 'к', 'K': 'К', 'l': 'л', 'L': 'Л', 'm': 'м', 'M': 'М',
  'n': 'н', 'N': 'Н', 'o': 'о', 'O': 'О', 'p': 'п', 'P': 'П',
  'q': 'қ', 'Q': 'Қ', 'r': 'р', 'R': 'Р', 's': 'с', 'S': 'С',
  't': 'т', 'T': 'Т', 'u': 'у', 'U': 'У', 'v': 'в', 'V': 'В',
  'x': 'х', 'X': 'Х', 'y': 'й', 'Y': 'Й', 'z': 'з', 'Z': 'З',
  'oʻ': 'ў', 'Oʻ': 'Ў', 'gʻ': 'ғ', 'Gʻ': 'Ғ',
  'ch': 'ч', 'Ch': 'Ч', 'sh': 'ш', 'Sh': 'Ш', 'ng': 'нг', 'Ng': 'Нг',
  'ya': 'я', 'Ya': 'Я', 'yu': 'ю', 'Yu': 'Ю',
};

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'А': 'A', 'б': 'b', 'Б': 'B', 'д': 'd', 'Д': 'D',
  'е': 'e', 'Е': 'E', 'ф': 'f', 'Ф': 'F', 'г': 'g', 'Г': 'G',
  'ҳ': 'h', 'Ҳ': 'H', 'и': 'i', 'И': 'I', 'ж': 'j', 'Ж': 'J',
  'к': 'k', 'К': 'K', 'л': 'l', 'Л': 'L', 'м': 'm', 'М': 'M',
  'н': 'n', 'Н': 'N', 'о': 'o', 'О': 'O', 'п': 'p', 'П': 'P',
  'қ': 'q', 'Қ': 'Q', 'р': 'r', 'Р': 'R', 'с': 's', 'С': 'S',
  'т': 't', 'Т': 'T', 'у': 'u', 'У': 'U', 'в': 'v', 'В': 'V',
  'х': 'x', 'Х': 'X', 'й': 'y', 'Й': 'Y', 'з': 'z', 'З': 'Z',
  'ў': 'oʻ', 'Ў': 'Oʻ', 'ғ': 'gʻ', 'Ғ': 'Gʻ',
  'ч': 'ch', 'Ч': 'Ch', 'ш': 'sh', 'Ш': 'Sh',
  'я': 'ya', 'Я': 'Ya', 'ю': 'yu', 'Ю': 'Yu',
  'ц': 'ts', 'Ц': 'Ts', 'щ': 'shch', 'Щ': 'Shch',
  'э': 'e', 'Э': 'E', 'ъ': 'ʻ', 'Ъ': 'ʻ',
};

/** Convert Latin Uzbek text to Cyrillic. */
export function latinToCyrillic(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    // Check for digraphs/trigraphs first
    const two = text.slice(i, i + 2);
    const three = text.slice(i, i + 3);
    if (LATIN_TO_CYRILLIC[three]) {
      result += LATIN_TO_CYRILLIC[three];
      i += 3;
    } else if (LATIN_TO_CYRILLIC[two]) {
      result += LATIN_TO_CYRILLIC[two];
      i += 2;
    } else if (LATIN_TO_CYRILLIC[text[i]]) {
      result += LATIN_TO_CYRILLIC[text[i]];
      i++;
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}

/** Convert Cyrillic Uzbek text to Latin. */
export function cyrillicToLatin(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (CYRILLIC_TO_LATIN[two]) {
      result += CYRILLIC_TO_LATIN[two];
      i += 2;
    } else if (CYRILLIC_TO_LATIN[text[i]]) {
      result += CYRILLIC_TO_LATIN[text[i]];
      i++;
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}

/** Capitalize first letter. */
export function capitalize(word: string): string {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}
