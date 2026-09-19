// Morphology Engine v2 for Uzbek.
//
// Nominal morphology is parsed as a sequence rather than as unrelated string
// endings: ROOT + (OTHER) + (PLURAL) + (POSSESSIVE) + (CASE).  Keeping the
// slots explicit prevents an ending such as -i or -lar from being removed
// repeatedly or in an impossible order.

import { MorphAnalysis, PartOfSpeech } from './types';
import { DICTIONARY, DictEntry } from './dictionary';
import { normalizeApostrophe } from './text';
import { endsWithVowel, validateCaseSuffix } from './phonetics';

type NominalCase = Exclude<MorphAnalysis['case'], 'nom' | null>;

interface SuffixSlot {
  value: string;
  label: string;
}

interface ParsedNominal {
  stem: string;
  suffixes: string[];
  plural: boolean;
  possessive: string | null;
  caseType: NominalCase | null;
  caseBase: string | null;
  knownStem: boolean;
}

const CASE_SUFFIXES: readonly SuffixSlot[] = [
  { value: 'ning', label: 'gen' }, { value: 'dan', label: 'abl' },
  { value: 'tan', label: 'abl' }, { value: 'ga', label: 'dat' },
  { value: 'ka', label: 'dat' }, { value: 'qa', label: 'dat' },
  { value: 'da', label: 'loc' }, { value: 'ta', label: 'loc' },
  { value: 'ni', label: 'acc' },
];

// Longest first. Vowel-final stems use the short/buffered series, while
// consonant-final stems use the vowel-initial series.
const POSSESSIVE_SUFFIXES: readonly SuffixSlot[] = [
  { value: 'ingiz', label: '2sg/formal' }, { value: 'imiz', label: '1pl' },
  { value: 'ngiz', label: '2sg/formal' }, { value: 'miz', label: '1pl' },
  { value: 'ing', label: '2sg' }, { value: 'si', label: '3sg/3pl' },
  { value: 'im', label: '1sg' }, { value: 'ng', label: '2sg' },
  { value: 'm', label: '1sg' }, { value: 'i', label: '3sg' },
];

// Productive derivational/postpositional endings which may precede nominal
// inflection. They are accepted only when the resulting root is known.
const OTHER_SUFFIXES = ['gacha', 'dagi', 'lik', 'chi'] as const;

const VERB_NEGATION = ['ma', 'me'] as const;
const VERB_TENSE_SUFFIXES: readonly SuffixSlot[] = [
  { value: 'yapdilar', label: 'cont_3pl' }, { value: 'yapman', label: 'cont_1sg' },
  { value: 'yapsan', label: 'cont_2sg' }, { value: 'yapmiz', label: 'cont_1pl' },
  { value: 'yapsiz', label: 'cont_2pl' }, { value: 'yapdi', label: 'cont_3sg' },
  { value: 'dingiz', label: 'past_2sg/formal' }, { value: 'dilar', label: 'past_3pl' },
  { value: 'ydilar', label: 'pres_3pl' }, { value: 'adilar', label: 'pres_3pl' },
  { value: 'ganim', label: 'pastpart_1sg' }, { value: 'ganing', label: 'pastpart_2sg' },
  { value: 'gani', label: 'pastpart_3sg' }, { value: 'dim', label: 'past_1sg' },
  { value: 'ding', label: 'past_2sg' }, { value: 'dik', label: 'past_1pl' },
  { value: 'yman', label: 'pres_1sg' }, { value: 'ysan', label: 'pres_2sg' },
  { value: 'ymiz', label: 'pres_1pl' }, { value: 'ysiz', label: 'pres_2pl' },
  { value: 'aman', label: 'pres_1sg' }, { value: 'asan', label: 'pres_2sg' },
  { value: 'amiz', label: 'pres_1pl' }, { value: 'asiz', label: 'pres_2pl' },
  { value: 'gan', label: 'pastpart' }, { value: 'qan', label: 'pastpart' },
  { value: 'man', label: 'pres_1sg' }, { value: 'san', label: 'pres_2sg' },
  { value: 'miz', label: 'pres_1pl' }, { value: 'siz', label: 'pres_2sg/formal' },
  { value: 'adi', label: 'pres_3sg' }, { value: 'ydi', label: 'pres_3sg' },
  { value: 'dim', label: 'past_1sg' }, { value: 'di', label: 'past_3sg' },
];

const DICT_MAP = new Map<string, DictEntry>();
for (const entry of DICTIONARY) {
  DICT_MAP.set(normalizeApostrophe(entry.word.toLowerCase()), entry);
  for (const variant of entry.variants ?? []) {
    DICT_MAP.set(normalizeApostrophe(variant.toLowerCase()), entry);
  }
}
const DICT_STEMS = new Set(DICT_MAP.keys());

export function inDictionary(word: string): boolean {
  return DICT_MAP.has(normalizeApostrophe(word.toLowerCase()));
}

export function getDictEntry(word: string): DictEntry | undefined {
  return DICT_MAP.get(normalizeApostrophe(word.toLowerCase()));
}

function removeEnding(word: string, endings: readonly SuffixSlot[]): { base: string; slot: SuffixSlot } | null {
  for (const slot of endings) {
    if (word.endsWith(slot.value) && word.length - slot.value.length >= 3) {
      return { base: word.slice(0, -slot.value.length), slot };
    }
  }
  return null;
}

function possessiveFits(base: string, suffix: string): boolean {
  return endsWithVowel(base)
    ? ['m', 'ng', 'si', 'miz', 'ngiz'].includes(suffix)
    : ['im', 'ing', 'i', 'imiz', 'ingiz'].includes(suffix);
}

/** Parse every nominal slot from the outside in, then validate inside out. */
function parseNominal(word: string): ParsedNominal | null {
  let remainder = word;
  const suffixesFromOutside: string[] = [];
  let caseType: NominalCase | null = null;
  let caseBase: string | null = null;
  let possessive: string | null = null;
  let plural = false;

  const caseMatch = removeEnding(remainder, CASE_SUFFIXES);
  if (caseMatch) {
    caseType = caseMatch.slot.label as NominalCase;
    caseBase = caseMatch.base;
    remainder = caseMatch.base;
    suffixesFromOutside.push(caseMatch.slot.value);
  }

  const possessiveMatch = removeEnding(remainder, POSSESSIVE_SUFFIXES);
  if (possessiveMatch && possessiveFits(possessiveMatch.base, possessiveMatch.slot.value)) {
    possessive = possessiveMatch.slot.label;
    remainder = possessiveMatch.base;
    suffixesFromOutside.push(possessiveMatch.slot.value);
  }

  if (remainder.endsWith('lar') && remainder.length > 6) {
    plural = true;
    remainder = remainder.slice(0, -3);
    suffixesFromOutside.push('lar');
  }

  for (const suffix of OTHER_SUFFIXES) {
    if (remainder.endsWith(suffix) && remainder.length - suffix.length >= 3) {
      remainder = remainder.slice(0, -suffix.length);
      suffixesFromOutside.push(suffix);
      break;
    }
  }

  if (suffixesFromOutside.length === 0) return null;
  const knownStem = DICT_STEMS.has(remainder);
  // Unknown roots are intentionally accepted only with a strong structural
  // signal: at least two ordered inflection slots and a substantial root.
  // This protects new names/terms without turning arbitrary typo+ending
  // strings into valid words.
  if (!knownStem && (suffixesFromOutside.length < 2 || remainder.length < 4)) return null;

  return {
    stem: remainder,
    suffixes: suffixesFromOutside.reverse(),
    plural,
    possessive,
    caseType,
    caseBase,
    knownStem,
  };
}

function analyzeVerb(word: string): MorphAnalysis | null {
  for (const tense of VERB_TENSE_SUFFIXES) {
    if (!word.endsWith(tense.value) || word.length - tense.value.length < 2) continue;
    let stem = word.slice(0, -tense.value.length);
    const suffixes = [tense.value];
    let polarity: 'pos' | 'neg' = 'pos';
    const negation = VERB_NEGATION.find(value => stem.endsWith(value));
    if (negation) {
      stem = stem.slice(0, -negation.length);
      suffixes.unshift(negation);
      polarity = 'neg';
    }
    const entry = DICT_MAP.get(stem);
    if (!entry || entry.pos !== 'verb') continue;
    return { stem, suffixes, pos: entry.pos, number: null, case: null, posessive: null, tense: tense.label, polarity };
  }
  return null;
}

export function analyzeWord(word: string): MorphAnalysis | null {
  const normalized = normalizeApostrophe(word.toLowerCase());
  const direct = DICT_MAP.get(normalized);
  if (direct) {
    return { stem: normalized, suffixes: [], pos: direct.pos, number: null, case: null, posessive: null, tense: null, polarity: null };
  }

  const nominal = parseNominal(normalized);
  if (nominal) {
    const entry = DICT_MAP.get(nominal.stem);
    return {
      stem: nominal.stem,
      suffixes: nominal.suffixes,
      pos: entry?.pos ?? null,
      number: nominal.plural ? 'plural' : 'singular',
      case: nominal.caseType,
      posessive: nominal.possessive,
      tense: null,
      polarity: null,
    };
  }
  return analyzeVerb(normalized);
}

export function isValidForm(word: string): boolean {
  if (inDictionary(word)) return true;
  const normalized = normalizeApostrophe(word.toLowerCase());
  const nominal = parseNominal(normalized);
  if (nominal) {
    if (nominal.caseType && nominal.caseBase) {
      const suffix = nominal.suffixes[nominal.suffixes.length - 1];
      if (!validateCaseSuffix(nominal.caseBase, suffix).isPhoneticallyValid) return false;
    }
    return true;
  }
  return analyzeVerb(normalized) !== null;
}

export function generateForms(root: string): string[] {
  const normalized = normalizeApostrophe(root.toLowerCase());
  const forms = new Set<string>([normalized]);
  const cases = CASE_SUFFIXES.map(slot => slot.value);
  for (const plural of ['', 'lar']) {
    const numberBase = normalized + plural;
    const possessives = endsWithVowel(numberBase)
      ? ['m', 'ng', 'si', 'miz', 'ngiz']
      : ['im', 'ing', 'i', 'imiz', 'ingiz'];
    const bases = [numberBase, ...possessives.map(possessive => numberBase + possessive)];
    for (const base of bases) {
      forms.add(base);
      for (const caseSuffix of cases) forms.add(base + caseSuffix);
    }
  }
  for (const tense of VERB_TENSE_SUFFIXES) forms.add(normalized + tense.value);
  return [...forms];
}

export function getStem(word: string): string | null {
  return analyzeWord(word)?.stem ?? null;
}

export function getPartOfSpeech(word: string): PartOfSpeech | null {
  return analyzeWord(word)?.pos ?? null;
}

let allFormsCache: Set<string> | null = null;
export function getAllForms(): Set<string> {
  if (allFormsCache) return allFormsCache;
  const forms = new Set<string>();
  for (const entry of DICTIONARY) {
    for (const root of [entry.word, ...(entry.variants ?? [])]) {
      const normalized = normalizeApostrophe(root.toLowerCase());
      forms.add(normalized);
      if (entry.pos === 'noun' || entry.pos === 'adj') {
        for (const form of generateForms(normalized)) forms.add(form);
      }
    }
  }
  allFormsCache = forms;
  return forms;
}
