// Fuzzy matching engine: candidate generation and ranking integration.
// Pure string-similarity functions live in stringSimilarity.ts to avoid
// a circular dependency with candidateRanker.ts.

import { DICTIONARY } from './dictionary';
import { normalizeApostrophe } from './text';
import { getAllForms } from './morphology';
import { splitCaseSuffix } from './phonetics';
import { analyzeContext, ContextInfo } from './contextEngine';
import { rankCandidates, RankedCandidate } from './candidateRanker';

// Re-export similarity functions for backward compatibility
export { levenshtein, jaro, jaroWinkler, ngramSimilarity, keyboardTypoScore } from './stringSimilarity';

import { levenshtein } from './stringSimilarity';

// Build the candidate pool: dictionary words + all generated forms.
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

export interface ScoredCandidate {
  word: string;
  score: number;      // 0-1 confidence
  reason: string;
  errorType?: string;
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

  // Collect raw candidates by edit distance
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

  // Also generate suffix variants if the input has a case suffix
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
