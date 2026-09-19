// Context Engine: Analyzes surrounding words to disambiguate corrections.
// Determines which case suffix is most likely based on verb semantics
// and sentence structure.
//
// Key insight: In Uzbek, the verb determines which case is expected:
// - yashash (to live) → locative (-da) → "Toshkentda yashayman"
// - bormoq (to go) → dative (-ga) → "Toshkentga bordim"
// - oʻqimoq (to study at) → dative (-ga) → "maktabga bordim"
// - oʻqimoq (to study in) → locative (-da) → "maktabda oʻqidim"
// - bermoq (to give) → dative (-ga) for recipient
// - aytmoq (to say) → dative (-ga) for addressee

import { normalizeApostrophe } from './text';

// Verbs that strongly imply locative case (-da) for the preceding noun
const LOCATIVE_VERBS = new Set([
  'yashayman', 'yashaysan', 'yashaydi', 'yashaymiz', 'yashaysiz', 'yashaydilar',
  'yashadim', 'yashading', 'yashadi', 'yashadik', 'yashadingiz', 'yashadilar',
  'yashagan', 'yashaganman', 'yashagansan', 'yashagandi',
  'turaman', 'turasan', 'turadi', 'turamiz', 'turasiz', 'turadilar',
  'turdim', 'turing', 'turdi', 'turdik', 'turdilar',
  'oʻtiraman', 'oʻtirsan', 'oʻtiradi', 'oʻtiramiz', 'oʻtirasiz', 'oʻtiradilar',
  'oʻtirdim', 'oʻtirdi', 'oʻtirdik',
  'yotaman', 'yotasan', 'yotadi', 'yotamiz', 'yotasiz', 'yotadilar',
  'yotdim', 'yotdi', 'yotdik',
  'ishlayman', 'ishlaysan', 'ishlaydi', 'ishlaymiz', 'ishlaysiz', 'ishlaydilar',
  'ishladim', 'ishladi', 'ishladik',
  'oʻqidim', 'oʻqiding', 'oʻqidi', 'oʻqidingiz', 'oʻqidilar',
  'oʻqiyman', 'oʻqiysan', 'oʻqiydi', 'oʻqiyimiz', 'oʻqiysiz', 'oʻqiydilar',
  'oʻqiganman', 'oʻqigansan', 'oʻqigandi',
  'tugʻildim', 'tugʻilding', 'tugʻildi', 'tugʻildik', 'tugʻildingiz',
  'tugʻilgan', 'tugʻilganman',
  'qoldim', 'qolding', 'qoldi', 'qoldik', 'qoldingiz', 'qoldilar',
  'qolaman', 'qolasan', 'qoladi', 'qolamiz', 'qolasiz', 'qoladilar',
  'oʻsdi', 'oʻsdim', 'oʻsdik', 'oʻsdi', 'oʻsadir', 'oʻsaman',
  'topildim', 'topildi', 'topildik',
  'koʻrdim', 'koʻrdi', 'koʻrdik', 'koʻraman', 'koʻradi',
  'uchratdim', 'uchratdi',
  'boraman', 'borasan', 'boradi', 'boramiz', 'borasiz', 'boradilar',
]);

// Verbs that strongly imply dative case (-ga) for the preceding noun
const DATIVE_VERBS = new Set([
  'bordim', 'bording', 'bordi', 'bordik', 'bordingiz', 'bordilar',
  'boraman', 'borasan', 'boradi', 'boramiz', 'borasiz', 'boradilar',
  'borganman', 'borgansan', 'borgandi',
  'keldim', 'kelding', 'keldi', 'keldik', 'keldingiz', 'keldilar',
  'kelaman', 'kelasan', 'keladi', 'kelamiz', 'kelasiz', 'keladilar',
  'kelganman', 'kelgansan', 'kelgandi',
  'yubordim', 'yubordi', 'yubordik',
  'qaytdim', 'qaytdi', 'qaytdik', 'qaytaman', 'qaytadi',
  'koʻchdim', 'koʻchdi', 'koʻchdik',
  'koʻchaman', 'koʻchasan', 'koʻchadi',
  'uchdim', 'uchdi', 'uchdik',
  'suzdim', 'suzdi', 'suzdik',
  'harakatlanardim',
  'intilaman', 'intildi',
  'yondashdim', 'yondashdi',
  'kirdim', 'kirding', 'kirdi', 'kirdik', 'kirdingiz', 'kirdilar',
  'kiraman', 'kirasan', 'kiradi', 'kiramiz', 'kirasiz', 'kiradilar',
]);

// Verbs that can take both dative and locative depending on meaning
const AMBIGUOUS_VERBS = new Set([
  'oʻqidim', 'oʻqiyman', 'oʻqidi', 'oʻqiydi', // "maktabga bordim, maktabda oʻqidim"
  'ishladim', 'ishlayman', 'ishladi', 'ishlaydi',
]);

// Prepositions/postpositions that indicate case
const DATIVE_MARKERS = new Set(['qarab', 'tomon', 'qarab']);
const LOCATIVE_MARKERS = new Set(['ichida', 'tashqarisida', 'ustida', 'oldida', 'orqasida', 'yonida']);

export type ExpectedCase = 'dat' | 'loc' | 'abl' | 'acc' | 'gen' | null;

export interface ContextInfo {
  expectedCase: ExpectedCase;
  confidence: number;
  reason: string;
}

/**
 * Analyze the context around a word to determine the expected case.
 * Looks at the following verb to infer which case suffix is appropriate.
 *
 * @param words Array of word tokens (lowercase, normalized)
 * @param wordIndex Index of the target word in the array
 */
export function analyzeContext(
  words: string[],
  wordIndex: number
): ContextInfo {
  const normalized = words.map(w => normalizeApostrophe(w.toLowerCase()));

  // Look forward up to 3 words for a verb
  for (let i = wordIndex + 1; i < Math.min(wordIndex + 4, normalized.length); i++) {
    const nextWord = normalized[i];

    // Skip common particles
    if (['ham', 'da', 'chi', 'ku', 'mas', 'eaxir', 'axir'].includes(nextWord)) continue;

    if (DATIVE_VERBS.has(nextWord)) {
      // Check if it's also a locative verb (ambiguous)
      if (LOCATIVE_VERBS.has(nextWord)) {
        // Ambiguous — slight preference for dative (destination)
        return {
          expectedCase: 'dat',
          confidence: 0.6,
          reason: 'Feʼl konteksti: joʻnalish ehtimoli yuqori',
        };
      }
      return {
        expectedCase: 'dat',
        confidence: 0.85,
        reason: 'Feʼl konteksti: joʻnalish kelishigi (-ga) kerak',
      };
    }

    if (LOCATIVE_VERBS.has(nextWord)) {
      return {
        expectedCase: 'loc',
        confidence: 0.85,
        reason: 'Feʼl konteksti: oʻrin-vaqt kelishigi (-da) kerak',
      };
    }

    // If we hit a verb we don't recognize, stop searching
    // (heuristic: verbs commonly end in -di, -man, -san, -miz, -siz, -di)
    if (/(di|man|san|miz|siz|dilar|yman|ysan|ydi|ymiz|ysiz|ydilar)$/.test(nextWord) && nextWord.length > 3) {
      // Unknown verb — use default phonetic rules, no context preference
      break;
    }
  }

  // Look for prepositions
  for (let i = wordIndex + 1; i < Math.min(wordIndex + 3, normalized.length); i++) {
    if (DATIVE_MARKERS.has(normalized[i])) {
      return { expectedCase: 'dat', confidence: 0.7, reason: 'Koʻmakchi konteksti: -ga kerak' };
    }
    if (LOCATIVE_MARKERS.has(normalized[i])) {
      return { expectedCase: 'loc', confidence: 0.7, reason: 'Koʻmakchi konteksti: -da kerak' };
    }
  }

  return { expectedCase: null, confidence: 0, reason: '' };
}

/**
 * Score how well a candidate correction fits the surrounding context.
 * Returns 0-1 bonus to add to candidate score.
 */
export function contextScore(
  candidateCase: ExpectedCase,
  context: ContextInfo
): number {
  if (!context.expectedCase || !candidateCase) return 0;
  if (context.expectedCase === candidateCase) {
    return context.confidence * 0.15; // Up to ~0.13 bonus
  }
  // Mismatch penalty
  return -context.confidence * 0.2;
}
