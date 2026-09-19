// Uzbek phonological rules: vowel harmony, consonant voicing,
// phonetic similarity, and sound class classification.
// These rules govern which suffix variants are valid for a given stem.

// Uzbek vowels classified by frontness/backness and rounding
export type VowelClass = 'front' | 'back';
export type RoundClass = 'rounded' | 'unrounded';

const FRONT_VOWELS = new Set(['e', 'i', 'a', 'oʻ', 'e']);
const BACK_VOWELS = new Set(['a', 'o', 'u', 'i']);
// Uzbek doesn't have strict vowel harmony like Turkish, but there are
// phonetic tendencies. The main distinction for suffixes is:
// - After back vowels (a, o, u): -ga, -da, -dan
// - After front vowels (e, i): -ga, -da, -dan (Uzbek is more unified)
// The key phonetic rule is consonant voicing assimilation.

// Consonant classes
const VOICED_CONSONANTS = new Set(['b', 'v', 'g', 'gʻ', 'd', 'j', 'z', 'y', 'l', 'm', 'n', 'r']);
const VOICELESS_CONSONANTS = new Set(['p', 't', 'k', 'q', 's', 'f', 'h', 'x', 'ch', 'sh']);
const SONORANTS = new Set(['l', 'm', 'n', 'r', 'y', 'v']);

// Vowel inventory
const ALL_VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'oʻ', 'a']);

// Sound similarity for typo detection (phonetically similar pairs)
const PHONETIC_PAIRS: Array<[string, string]> = [
  ['s', 'z'], ['z', 's'],
  ['t', 'd'], ['d', 't'],
  ['k', 'g'], ['g', 'k'],
  ['p', 'b'], ['b', 'p'],
  ['f', 'v'], ['v', 'f'],
  ['sh', 's'], ['s', 'sh'],
  ['ch', 't'], ['t', 'ch'],
  ['h', 'x'], ['x', 'h'],
  ['q', 'k'], ['k', 'q'],
  ['q', 'g'], ['g', 'q'],
  ['gʻ', 'g'], ['g', 'gʻ'],
  ['oʻ', 'o'], ['o', 'oʻ'],
  ['oʻ', 'u'], ['u', 'oʻ'],
  ['e', 'i'], ['i', 'e'],
  ['a', 'o'], ['o', 'a'],
  ['a', 'e'], ['e', 'a'],
  ['v', 'w'], ['w', 'v'],
  ['s', 'c'], ['c', 's'],
  ['k', 'c'], ['c', 'k'],
];

const PHONETIC_SIMILARITY = new Map<string, number>();
for (const [a, b] of PHONETIC_PAIRS) {
  PHONETIC_SIMILARITY.set(a + '|' + b, 0.8);
}

// Special: 'w' is not Uzbek — likely a typo for 'v' or 's' (on QWERTY, w near s and v)
PHONETIC_SIMILARITY.set('w|v', 0.7);
PHONETIC_SIMILARITY.set('w|s', 0.65);

/**
 * Get the last consonant of a word (for voicing rules).
 */
export function lastConsonant(word: string): string | null {
  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i];
    if (!ALL_VOWELS.has(ch) && ch !== 'ʻ') {
      // Check for digraph
      if (i > 0) {
        const two = word.slice(i - 1, i + 1);
        if (two === 'sh' || two === 'ch' || two === 'gʻ' || two === 'oʻ') {
          return two;
        }
      }
      return ch;
    }
  }
  return null;
}

/**
 * Get the last vowel of a word.
 */
export function lastVowel(word: string): string | null {
  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i];
    // Check for oʻ before checking single char
    if (i > 0 && word[i - 1] === 'o' && ch === 'ʻ') {
      return 'oʻ';
    }
    if (ALL_VOWELS.has(ch) && ch !== 'ʻ') {
      return ch;
    }
  }
  return null;
}

/**
 * Check if a stem ends with a voiced consonant.
 */
export function endsWithVoiced(stem: string): boolean {
  const lc = lastConsonant(stem);
  return lc !== null && VOICED_CONSONANTS.has(lc);
}

/**
 * Check if a stem ends with a voiceless consonant.
 */
export function endsWithVoiceless(stem: string): boolean {
  const lc = lastConsonant(stem);
  return lc !== null && VOICELESS_CONSONANTS.has(lc);
}

/**
 * Check if a stem ends with a vowel.
 */
export function endsWithVowel(stem: string): boolean {
  if (stem.length === 0) return false;
  const last = stem[stem.length - 1];
  if (last === 'ʻ') {
    return stem.length >= 2 && stem[stem.length - 2] === 'o';
  }
  return ALL_VOWELS.has(last);
}

/**
 * Check if a stem ends with a sonorant consonant.
 */
export function endsWithSonorant(stem: string): boolean {
  const lc = lastConsonant(stem);
  return lc !== null && SONORANTS.has(lc);
}

/**
 * Determine which case suffix variant is phonetically appropriate for a stem.
 * Uzbek case suffixes: -ga/-ka/-qa (dative), -da/-ta (locative), -dan/-tan (ablative)
 *
 * Rules:
 * - After voiced consonants and vowels: -ga, -da, -dan (voiced variants)
 * - After voiceless consonants: -ka/qa, -ta, -tan (voiceless variants)
 * - -qa is used after back vowels with q-harmony tendencies
 *
 * In standard literary Uzbek, the voiced forms (-ga, -da, -dan) are
 * most common. The voiceless forms (-ka, -ta, -tan) are used after
 * voiceless consonants in some dialectal/colloquial usage but are
 * considered non-standard in literary Uzbek.
 *
 * For correction purposes:
 * - -ka, -ta, -tan after voiceless consonants are ACCEPTABLE but less formal
 * - -ka, -ta, -tan after voiced consonants or vowels are ERRORS
 */
export type CaseVariant = 'ga' | 'ka' | 'qa' | 'da' | 'ta' | 'dan' | 'tan' | 'ni';

export interface CaseSuffixInfo {
  correctSuffix: string;
  incorrectVariants: string[];
  isPhoneticallyValid: boolean;
  reason: string;
}

/**
 * Given a stem and a case suffix that was used, determine if it's phonetically valid.
 */
export function validateCaseSuffix(stem: string, suffix: string): CaseSuffixInfo {
  const endsVoiceless = endsWithVoiceless(stem);
  const endsVoiced = endsWithVoiced(stem);
  const endsVowel = endsWithVowel(stem);
  const endsSonorant = endsWithSonorant(stem);

  // Dative: -ga is standard. -ka and -qa are dialectal.
  if (suffix === 'ga') {
    return { correctSuffix: 'ga', incorrectVariants: ['ka', 'qa'], isPhoneticallyValid: true, reason: 'ga' };
  }
  if (suffix === 'ka') {
    // -ka is acceptable after voiceless consonants (phonetic assimilation)
    // but -ga is the literary standard everywhere.
    // After voiced/vowels: definitely wrong
    if (endsVoiceless) {
      return { correctSuffix: 'ga', incorrectVariants: [], isPhoneticallyValid: true, reason: 'ka_after_voiceless' };
    }
    return { correctSuffix: 'ga', incorrectVariants: ['ka'], isPhoneticallyValid: false, reason: 'ka_after_voiced' };
  }
  if (suffix === 'qa') {
    // -qa is a dialectal variant, -ga is standard
    return { correctSuffix: 'ga', incorrectVariants: ['qa'], isPhoneticallyValid: false, reason: 'qa_nonstandard' };
  }

  // Locative: -da is standard. -ta is dialectal.
  if (suffix === 'da') {
    return { correctSuffix: 'da', incorrectVariants: ['ta'], isPhoneticallyValid: true, reason: 'da' };
  }
  if (suffix === 'ta') {
    if (endsVoiceless) {
      // Acceptable phonetic assimilation but -da is literary standard
      return { correctSuffix: 'da', incorrectVariants: [], isPhoneticallyValid: true, reason: 'ta_after_voiceless' };
    }
    return { correctSuffix: 'da', incorrectVariants: ['ta'], isPhoneticallyValid: false, reason: 'ta_after_voiced' };
  }

  // Ablative: -dan is standard. -tan is dialectal.
  if (suffix === 'dan') {
    return { correctSuffix: 'dan', incorrectVariants: ['tan'], isPhoneticallyValid: true, reason: 'dan' };
  }
  if (suffix === 'tan') {
    if (endsVoiceless) {
      return { correctSuffix: 'dan', incorrectVariants: [], isPhoneticallyValid: true, reason: 'tan_after_voiceless' };
    }
    return { correctSuffix: 'dan', incorrectVariants: ['tan'], isPhoneticallyValid: false, reason: 'tan_after_voiced' };
  }

  // Accusative: -ni is standard, no variants
  if (suffix === 'ni') {
    return { correctSuffix: 'ni', incorrectVariants: [], isPhoneticallyValid: true, reason: 'ni' };
  }

  // Genitive: -ning is standard
  if (suffix === 'ning') {
    return { correctSuffix: 'ning', incorrectVariants: [], isPhoneticallyValid: true, reason: 'ning' };
  }

  return { correctSuffix: suffix, incorrectVariants: [], isPhoneticallyValid: true, reason: 'unknown' };
}

/**
 * Compute phonetic similarity between two strings.
 * Returns 0-1 where 1 means phonetically identical.
 */
export function phoneticSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Compare character by character with phonetic awareness
  const lenDiff = Math.abs(a.length - b.length);
  if (lenDiff > 3) return 0;

  let matchScore = 0;
  let totalPositions = Math.max(a.length, b.length);

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const ca = a[i];
    const cb = b[i];
    if (ca === cb) {
      matchScore += 1;
    } else {
      const sim = PHONETIC_SIMILARITY.get(ca + '|' + cb);
      if (sim) {
        matchScore += sim * 0.5;
      }
      // Check digraph context
      if (i > 0) {
        const da = a.slice(i - 1, i + 1);
        const db = b.slice(i - 1, i + 1);
        const diSim = PHONETIC_SIMILARITY.get(da + '|' + db);
        if (diSim) {
          matchScore += diSim * 0.3;
        }
      }
    }
  }

  return matchScore / totalPositions;
}

/**
 * Get the phonetic code for a word (simplified soundex-like for Uzbek).
 * This helps group phonetically similar words.
 */
export function phoneticCode(word: string): string {
  const w = word.toLowerCase();
  if (w.length === 0) return '';

  let code = w[0]; // Keep first letter
  let prev = w[0];

  for (let i = 1; i < w.length; i++) {
    const ch = w[i];

    // Skip 'ʻ' — it's a modifier, not a primary sound
    if (ch === 'ʻ') continue;

    // Reduce doubled letters
    if (ch === prev) continue;

    // Map phonetically similar consonants
    let mapped = ch;
    if (ch === 's' || ch === 'z') mapped = 's';
    else if (ch === 't' || ch === 'd') mapped = 't';
    else if (ch === 'k' || ch === 'g' || ch === 'q') mapped = 'k';
    else if (ch === 'p' || ch === 'b') mapped = 'p';
    else if (ch === 'f' || ch === 'v') mapped = 'f';
    else if (ch === 'h' || ch === 'x') mapped = 'h';
    else if (ch === 'o' || ch === 'u') mapped = 'o';
    else if (ch === 'i' || ch === 'e') mapped = 'i';
    else if (ch === 'a') mapped = 'a';

    code += mapped;
    prev = ch;
  }

  return code;
}

/**
 * Check if two words are phonetically similar (confusable).
 */
export function arePhoneticallySimilar(a: string, b: string): boolean {
  return phoneticCode(a) === phoneticCode(b);
}

/**
 * Determine the likely intended case suffix when a word has an incorrect one.
 * Uses stem phonology to pick the best candidate.
 */
export function getCorrectCaseSuffix(stem: string, wrongSuffix: string): string | null {
  const info = validateCaseSuffix(stem, wrongSuffix);
  if (info.isPhoneticallyValid) return null;
  return info.correctSuffix;
}

/**
 * Check if a word ends with what looks like a case suffix.
 * Returns the stem and suffix if found, null otherwise.
 */
export function splitCaseSuffix(word: string): { stem: string; suffix: string } | null {
  const w = word.toLowerCase();

  // Order matters: try longer suffixes first
  const caseSuffixes = ['dan', 'tan', 'ning', 'ga', 'ka', 'qa', 'da', 'ta', 'ni'];

  for (const suf of caseSuffixes) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const stem = w.slice(0, -suf.length);
      return { stem, suffix: suf };
    }
  }

  return null;
}
