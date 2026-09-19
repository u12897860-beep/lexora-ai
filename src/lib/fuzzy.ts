// Fuzzy matching engine: candidate generation and ranking integration.
// Pure string-similarity functions live in stringSimilarity.ts to avoid
// a circular dependency with candidateRanker.ts.

import { DICTIONARY } from './dictionary';
import { normalizeApostrophe } from './text';
import { getAllForms, inDictionary, isValidForm } from './morphology';
import { splitCaseSuffix } from './phonetics';
import { analyzeContext, ContextInfo } from './contextEngine';
import { rankCandidates, RankedCandidate } from './candidateRanker';
import { levenshtein } from './stringSimilarity';

// Re-export similarity functions for backward compatibility
export { levenshtein, jaro, jaroWinkler, ngramSimilarity, keyboardTypoScore } from './stringSimilarity';

// ── Suffix inventory for decomposition ──────────────────────────────
// These must match the morphology engine's suffix lists.
// Ordered longest-first to prefer maximal suffix matches.

const ALL_SUFFIXES: string[] = [
  // Case suffixes (longest first)
  'laringiz', 'larimiz', 'larim', 'lari', 'laring', 'lar',
  'ning', 'dan', 'tan', 'dilar', 'dingiz',
  'ga', 'ka', 'qa', 'da', 'ta', 'ni',
  'dim', 'dik', 'man', 'miz', 'san', 'siz',
  'im', 'ing', 'miz', 'ngiz', 'lari', 'si',
  'gan', 'qan', 'di', 'gan', 'ib',
  // Short verb/person suffixes
  'm', 'i', 'ng', 'si',
];

// Minimum stem length after suffix stripping — prevents aggressive stripping
// of short words where the "suffix" is coincidental.
const MIN_STEM_LENGTH = 3;

// Maximum edit distance for stem fuzzy matching
const MAX_STEM_EDIT_DISTANCE = 2;

// ── Candidate pool ──────────────────────────────────────────────────

interface Candidate {
  word: string;
  freq: number;
  pos: string;
}
let candidatePool: Candidate[] | null = null;

function getCandidatePool(): Candidate[] {
  if (candidatePool) return candidatePool;
  const pool: Candidate[] = [];
  const allForms = getAllForms();
  const formToFreq = new Map<string, number>();
  for (const entry of DICTIONARY) {
    const w = normalizeApostrophe(entry.word);
    formToFreq.set(w, entry.freq);
    if (entry.variants) for (const v of entry.variants) formToFreq.set(normalizeApostrophe(v), entry.freq);
  }
  for (const form of allForms) {
    pool.push({
      word: form,
      freq: formToFreq.get(form) ?? 999,
      pos: '',
    });
  }
  candidatePool = pool;
  return pool;
}

// Dictionary roots only (for stem-level fuzzy matching)
let dictRootsCache: string[] | null = null;
function getDictRoots(): string[] {
  if (dictRootsCache) return dictRootsCache;
  const roots = new Set<string>();
  for (const entry of DICTIONARY) {
    roots.add(normalizeApostrophe(entry.word));
    if (entry.variants) for (const v of entry.variants) roots.add(normalizeApostrophe(v));
  }
  dictRootsCache = Array.from(roots);
  return dictRootsCache;
}

export interface ScoredCandidate {
  word: string;
  score: number;      // 0-1 confidence
  reason: string;
  errorType?: string;
}

/**
 * Generate candidates by decomposing input into stem + suffix,
 * fuzzy-matching the stem against dictionary roots, and reassembling.
 *
 * Example: "maktapga" → stem "maktap" + suffix "ga"
 *          → fuzzy match "maktap" → "maktab"
 *          → reassemble → "maktabga"
 */
function generateStemSuffixCandidates(
  input: string,
  seen: Set<string>,
  customDict?: Set<string>
): string[] {
  const normalized = normalizeApostrophe(input.toLowerCase());
  const candidates: string[] = [];
  const roots = getDictRoots();
  const customRoots = customDict ? Array.from(customDict).map(w => normalizeApostrophe(w.toLowerCase())) : [];
  const allRoots = customRoots.length > 0 ? [...roots, ...customRoots] : roots;

  // Try each possible suffix
  for (const suffix of ALL_SUFFIXES) {
    if (!normalized.endsWith(suffix)) continue;
    const stem = normalized.slice(0, -suffix.length);

    // Guard: stem must be long enough to avoid aggressive stripping
    if (stem.length < MIN_STEM_LENGTH) continue;

    // If the stem IS in the dictionary, the word is a valid form — skip
    // (this case is handled by the normal candidate flow)
    if (inDictionary(stem)) continue;

    // Fuzzy match the stem against dictionary roots
    for (const root of allRoots) {
      const lev = levenshtein(stem, root);
      if (lev > MAX_STEM_EDIT_DISTANCE) continue;

      // Reassemble: corrected stem + suffix
      const fullForm = root + suffix;
      if (fullForm === normalized) continue;  // Don't suggest the same word
      if (seen.has(fullForm)) continue;

      // Sanity check: the full form should ideally be a valid form
      // (in dictionary or valid morphological form).
      // But we also accept close matches even if not in allForms,
      // because the ranker will filter them.
      candidates.push(fullForm);
      seen.add(fullForm);
    }
  }

  return candidates;
}

/**
 * Find the best correction candidates for a misspelled word.
 * Uses multi-factor ranking with morphology, phonetics, frequency, and context.
 */
export function findCandidates(
  input: string,
  limit = 5,
  customDict?: Set<string>,
  contextWords?: string[],
  wordIndex?: number
): ScoredCandidate[] {
  const normalized = normalizeApostrophe(input.toLowerCase());
  if (normalized.length < 2) return [];

  // Analyze context if provided
  let contextInfo: ContextInfo | undefined;
  if (contextWords && wordIndex !== undefined) {
    contextInfo = analyzeContext(contextWords, wordIndex);
  }

  // Include custom dictionary in candidate pool
  const pool = getCandidatePool();
  const customCandidates: Candidate[] = [];
  if (customDict) {
    for (const w of customDict) {
      customCandidates.push({ word: normalizeApostrophe(w.toLowerCase()), freq: 1, pos: '' });
    }
  }
  const fullPool = customCandidates.length ? [...pool, ...customCandidates] : pool;

  // Collect raw candidates by edit distance (whole-word matching)
  const rawCandidates: string[] = [];
  const seen = new Set<string>();

  for (const candidate of fullPool) {
    const cand = candidate.word;
    if (cand === normalized) continue;
    const lenDiff = Math.abs(cand.length - normalized.length);
    if (lenDiff > 3) continue;

    const lev = levenshtein(normalized, cand);
    if (lev > 3) continue;

    if (!seen.has(cand)) {
      rawCandidates.push(cand);
      seen.add(cand);
    }
  }

  // Generate suffix variants if the input has a case suffix
  const inputSplit = splitCaseSuffix(normalized);
  if (inputSplit) {
    const caseSuffixes = ['ga', 'ka', 'qa', 'da', 'ta', 'dan', 'tan', 'ni', 'ning'];
    for (const suf of caseSuffixes) {
      const variant = inputSplit.stem + suf;
      if (!seen.has(variant) && variant !== normalized) {
        rawCandidates.push(variant);
        seen.add(variant);
      }
    }
  }

  // Generate stem+suffix decomposition candidates
  // This handles misspelled-stem + valid-suffix cases like:
  // "maktapga" → stem "maktap" → fuzzy → "maktab" → "maktabga"
  const stemSuffixCandidates = generateStemSuffixCandidates(input, seen, customDict);
  rawCandidates.push(...stemSuffixCandidates);

  // Rank candidates using the multi-factor system
  const ranked: RankedCandidate[] = rankCandidates(input, rawCandidates, { context: contextInfo, customDict });

  return ranked.slice(0, limit).map((r: RankedCandidate) => ({
    word: r.word,
    score: r.score,
    reason: r.reason,
    errorType: r.errorType,
  }));
}

/**
 * Check if a word is likely a proper noun (capitalized and not at sentence start).
 */
export function isCapitalized(word: string): boolean {
  return word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
}
