// Morphology Engine for Uzbek (agglutinative language).
// Decomposes a word into stem + suffixes, determines POS, number, case,
// possessive, tense, polarity. Also generates valid inflected forms
// from a dictionary root so we can recognize word forms beyond the root.

import { MorphAnalysis } from './types';
import { DICTIONARY, DictEntry } from './dictionary';
import { normalizeApostrophe } from './text';
import { validateCaseSuffix } from './phonetics';

// Uzbek suffix inventory (order matters — suffixes attach in sequence).
// These are the productive suffixes of modern literary Uzbek (Latin script).

// Plural
const PLURAL_SUFFIXES = ['lar', 'larim', 'laringiz', 'lari', 'larimiz'];

// Possessive
const POSSESSIVE_SUFFIXES: Array<[string, string]> = [
  ['im', '1sg'], ['m', '1sg'],
  ['ing', '2sg'], ['ng', '2sg'],
  ['i', '3sg'],
  ['imiz', '1pl'], ['miz', '1pl'],
  ['ingiz', '2sg/formal'], ['ngiz', '2sg/formal'],
  ['lari', '3pl'], ['si', '3sg/3pl'],
];

// Case (attach after plural/possessive)
// Includes both literary standard (ga, da, dan, ni, ning) and
// dialectal/phonetic variants (ka, qa, ta, tan) which appear after
// voiceless consonants. The suffix engine validates correctness.
const CASE_SUFFIXES: Array<[string, string]> = [
  ['ni', 'acc'],
  ['ning', 'gen'],
  ['ga', 'dat'], ['ka', 'dat'], ['qa', 'dat'],
  ['da', 'loc'], ['ta', 'loc'],
  ['dan', 'abl'], ['tan', 'abl'],
];

// Verbal suffixes
const VERB_NEGATION = ['ma', 'me'];
const VERB_TENSE_SUFFIXES: Array<[string, string]> = [
  ['dim', 'past_1sg'], ['ding', 'past_2sg'], ['di', 'past_3sg'],
  ['dik', 'past_1pl'], ['dingiz', 'past_2sg/formal'], ['dilar', 'past_3pl'],
  ['man', 'pres_1sg'], ['san', 'pres_2sg'], ['di', 'pres_3sg'],
  ['miz', 'pres_1pl'], ['siz', 'pres_2sg/formal'], ['dilar', 'pres_3pl'],
  ['yapman', 'cont_1sg'], ['yapsan', 'cont_2sg'], ['yapdi', 'cont_3sg'],
  ['yapmiz', 'cont_1pl'], ['yapsiz', 'cont_2pl'], ['yapdilar', 'cont_3pl'],
  ['yman', 'pres_1sg'], ['ysan', 'pres_2sg'], ['ydi', 'pres_3sg'],
  ['ymiz', 'pres_1pl'], ['ysiz', 'pres_2pl'], ['ydilar', 'pres_3pl'],
  ['aman', 'pres_1sg'], ['asan', 'pres_2sg'], ['adi', 'pres_3sg'],
  ['amiz', 'pres_1pl'], ['asiz', 'pres_2pl'], ['adilar', 'pres_3pl'],
  ['ganim', 'pastpart_1sg'], ['ganing', 'pastpart_2sg'], ['gani', 'pastpart_3sg'],
  ['gan', 'pastpart'], ['qan', 'pastpart'],
  ['yotir', 'cont_inf'], ['yotman', 'cont_1sg'], ['yotsan', 'cont_2sg'],
  ['yotmiz', 'cont_1pl'], ['yotsiz', 'cont_2pl'],
];

// Build a Set of all dictionary words (normalized) for quick exact lookup.
const DICT_MAP = new Map<string, DictEntry>();
for (const entry of DICTIONARY) {
  DICT_MAP.set(normalizeApostrophe(entry.word), entry);
  if (entry.variants) {
    for (const v of entry.variants) {
      DICT_MAP.set(normalizeApostrophe(v), entry);
    }
  }
}

// Set of all dictionary stems for morphology matching
const DICT_STEMS = new Set<string>(DICT_MAP.keys());

export function inDictionary(word: string): boolean {
  return DICT_MAP.has(normalizeApostrophe(word.toLowerCase()));
}

export function getDictEntry(word: string): DictEntry | undefined {
  return DICT_MAP.get(normalizeApostrophe(word.toLowerCase()));
}

/**
 * Try to find a dictionary stem by stripping known suffixes.
 * Returns the stem + list of suffixes stripped, or null.
 */
function stripSuffixes(word: string): { stem: string; suffixes: string[] } | null {
  const w = normalizeApostrophe(word.toLowerCase());
  // Try stripping case suffix first (outermost layer), then possessive, then plural
  // We try all combinations greedily.
  for (const caseSuf of CASE_SUFFIXES.map(s => s[0])) {
    if (w.endsWith(caseSuf) && w.length > caseSuf.length + 2) {
      const afterCase = w.slice(0, -caseSuf.length);
      // Check stem directly
      if (DICT_STEMS.has(afterCase)) return { stem: afterCase, suffixes: [caseSuf] };
      // Try possessive
      for (const possSuf of POSSESSIVE_SUFFIXES.map(s => s[0])) {
        if (afterCase.endsWith(possSuf) && afterCase.length > possSuf.length + 2) {
          const afterPoss = afterCase.slice(0, -possSuf.length);
          if (DICT_STEMS.has(afterPoss)) return { stem: afterPoss, suffixes: [possSuf, caseSuf] };
          // Try plural
          for (const plurSuf of PLURAL_SUFFIXES) {
            if (afterPoss.endsWith(plurSuf) && afterPoss.length > plurSuf.length + 2) {
              const afterPlur = afterPoss.slice(0, -plurSuf.length);
              if (DICT_STEMS.has(afterPlur)) return { stem: afterPlur, suffixes: [plurSuf, possSuf, caseSuf] };
            }
          }
        }
      }
      // Try plural directly (without possessive)
      for (const plurSuf of PLURAL_SUFFIXES) {
        if (afterCase.endsWith(plurSuf) && afterCase.length > plurSuf.length + 2) {
          const afterPlur = afterCase.slice(0, -plurSuf.length);
          if (DICT_STEMS.has(afterPlur)) return { stem: afterPlur, suffixes: [plurSuf, caseSuf] };
        }
      }
    }
  }
  // Try possessive only (no case)
  for (const possSuf of POSSESSIVE_SUFFIXES.map(s => s[0])) {
    if (w.endsWith(possSuf) && w.length > possSuf.length + 2) {
      const afterPoss = w.slice(0, -possSuf.length);
      if (DICT_STEMS.has(afterPoss)) return { stem: afterPoss, suffixes: [possSuf] };
      // Try plural under possessive
      for (const plurSuf of PLURAL_SUFFIXES) {
        if (afterPoss.endsWith(plurSuf) && afterPoss.length > plurSuf.length + 2) {
          const afterPlur = afterPoss.slice(0, -plurSuf.length);
          if (DICT_STEMS.has(afterPlur)) return { stem: afterPlur, suffixes: [plurSuf, possSuf] };
        }
      }
    }
  }
  // Try plural only
  for (const plurSuf of PLURAL_SUFFIXES) {
    if (w.endsWith(plurSuf) && w.length > plurSuf.length + 2) {
      const afterPlur = w.slice(0, -plurSuf.length);
      if (DICT_STEMS.has(afterPlur)) return { stem: afterPlur, suffixes: [plurSuf] };
    }
  }
  // Try verb suffixes
  for (const [tenseSuf] of VERB_TENSE_SUFFIXES) {
    if (w.endsWith(tenseSuf) && w.length > tenseSuf.length + 2) {
      const stem = w.slice(0, -tenseSuf.length);
      if (DICT_STEMS.has(stem)) return { stem, suffixes: [tenseSuf] };
      // Try with negation
      for (const negSuf of VERB_NEGATION) {
        if (stem.endsWith(negSuf) && stem.length > negSuf.length + 2) {
          const negStem = stem.slice(0, -negSuf.length);
          if (DICT_STEMS.has(negStem)) return { stem: negStem, suffixes: [negSuf, tenseSuf] };
        }
      }
    }
  }
  return null;
}

export function analyzeWord(word: string): MorphAnalysis | null {
  const w = normalizeApostrophe(word.toLowerCase());
  // Direct dictionary hit
  const direct = DICT_MAP.get(w);
  if (direct) {
    return {
      stem: w,
      suffixes: [],
      pos: direct.pos,
      number: null,
      case: null,
      posessive: null,
      tense: null,
      polarity: null,
    };
  }
  // Try stripping suffixes
  const stripped = stripSuffixes(word);
  if (!stripped) return null;
  const stemEntry = DICT_MAP.get(stripped.stem);
  const pos = stemEntry?.pos ?? null;
  const suffixes = stripped.suffixes;
  let number: 'singular' | 'plural' | null = null;
  let caseType: MorphAnalysis['case'] = null;
  let posessive: string | null = null;
  let tense: string | null = null;
  let polarity: 'pos' | 'neg' | null = null;

  for (const suf of suffixes) {
    if (PLURAL_SUFFIXES.includes(suf)) number = 'plural';
    const possMatch = POSSESSIVE_SUFFIXES.find(s => s[0] === suf);
    if (possMatch) posessive = possMatch[1];
    const caseMatch = CASE_SUFFIXES.find(s => s[0] === suf);
    if (caseMatch) caseType = caseMatch[1] as MorphAnalysis['case'];
    const tenseMatch = VERB_TENSE_SUFFIXES.find(s => s[0] === suf);
    if (tenseMatch) tense = tenseMatch[1];
    if (VERB_NEGATION.includes(suf)) polarity = 'neg';
  }
  return { stem: stripped.stem, suffixes, pos, number, case: caseType, posessive, tense, polarity };
}

/**
 * Generate all valid inflected forms from a dictionary root.
 * Used to build a larger recognition set from roots.
 */
export function generateForms(root: string): string[] {
  const forms = new Set<string>([root]);
  // Plural
  for (const p of ['lar']) forms.add(root + p);
  // Possessive
  for (const [p] of POSSESSIVE_SUFFIXES) {
    forms.add(root + p);
    forms.add(root + 'lar' + p);
  }
  // Case
  for (const [c] of CASE_SUFFIXES) {
    forms.add(root + c);
    forms.add(root + 'lar' + c);
    forms.add(root + 'larim' + c.replace('ni', 'ni').replace('ga', 'ga'));
  }
  // Verb forms
  for (const [t] of VERB_TENSE_SUFFIXES) {
    forms.add(root + t);
  }
  return Array.from(forms);
}

/**
 * Check if a word is a valid inflected form of a dictionary root.
 * Also validates that case suffixes are phonetically correct.
 */
export function isValidForm(word: string): boolean {
  if (inDictionary(word)) return true;
  const analysis = analyzeWord(word);
  if (!analysis) return false;

  // If the word has a case suffix, validate it phonetically
  if (analysis.case) {
    const w = normalizeApostrophe(word.toLowerCase());
    // Find which case suffix was used
    for (const [suf, caseType] of CASE_SUFFIXES) {
      if (w.endsWith(suf) && caseType === analysis.case) {
        const validation = validateCaseSuffix(analysis.stem, suf);
        if (!validation.isPhoneticallyValid) return false;
        break;
      }
    }
  }
  return true;
}

export function getStem(word: string): string | null {
  const a = analyzeWord(word);
  return a?.stem ?? null;
}

export function getPartOfSpeech(word: string): import('./types').PartOfSpeech | null {
  const a = analyzeWord(word);
  return a?.pos ?? null;
}

/**
 * Build a large Set of all recognized words (roots + generated forms).
 * Cached after first call.
 */
let allFormsCache: Set<string> | null = null;
export function getAllForms(): Set<string> {
  if (allFormsCache) return allFormsCache;
  const set = new Set<string>();
  for (const entry of DICTIONARY) {
    const w = normalizeApostrophe(entry.word);
    set.add(w);
    if (entry.variants) for (const v of entry.variants) set.add(normalizeApostrophe(v));
    // Generate noun forms for nouns
    if (entry.pos === 'noun' || entry.pos === 'adj') {
      for (const f of generateForms(w)) set.add(f);
    }
    if (entry.variants) {
      for (const v of entry.variants) {
        if (entry.pos === 'noun' || entry.pos === 'adj') {
          for (const f of generateForms(normalizeApostrophe(v))) set.add(f);
        }
      }
    }
  }
  allFormsCache = set;
  return set;
}
