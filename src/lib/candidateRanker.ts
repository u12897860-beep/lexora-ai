// Candidate Ranker: Multi-factor scoring system for correction candidates.
// Combines:
//   - edit distance similarity (Levenshtein / Damerau-Levenshtein)
//   - dictionary validity
//   - morphological compatibility
//   - suffix compatibility
//   - word frequency
//   - context probability
//   - phonetic similarity
//
// Weight formula:
//   candidateScore =
//     0.20 * editSimilarity +
//     0.15 * dictionaryScore +
//     0.15 * morphologyScore +
//     0.10 * suffixScore +
//     0.15 * frequencyScore +
//     0.15 * contextScore +
//     0.10 * phoneticScore

import { levenshtein, jaroWinkler, ngramSimilarity, keyboardTypoScore } from './fuzzy';
import { inDictionary, analyzeWord, getDictEntry, isValidForm } from './morphology';
import { phoneticSimilarity, phoneticCode, splitCaseSuffix, validateCaseSuffix } from './phonetics';
import { normalizeApostrophe } from './text';
import { analyzeContext, contextScore, ContextInfo, ExpectedCase } from './contextEngine';
import { DictEntry } from './dictionary';
import { getCorrectCaseSuffix } from './phonetics';

export interface RankedCandidate {
  word: string;
  score: number;
  reason: string;
  errorType: string;
  components: {
    edit: number;
    dictionary: number;
    morphology: number;
    suffix: number;
    frequency: number;
    context: number;
    phonetic: number;
  };
}

export interface RankOptions {
  context?: ContextInfo;
  customDict?: Set<string>;
}

// Score weights
const WEIGHTS = {
  edit: 0.20,
  dictionary: 0.15,
  morphology: 0.15,
  suffix: 0.10,
  frequency: 0.15,
  context: 0.15,
  phonetic: 0.10,
};

/**
 * Get the frequency score for a word.
 * Lower frequency number = more common = higher score.
 * Dictionary freq values range from ~10 (very common) to ~900 (rare).
 */
function frequencyScore(freq: number | undefined): number {
  if (freq === undefined) return 0.3; // Unknown word
  // Normalize: freq 10 → 1.0, freq 500 → ~0.1
  const normalized = 1 - Math.min(freq / 500, 0.9);
  return Math.max(0.1, normalized);
}

/**
 * Morphology score: how well does the candidate's morphology match the input?
 * If the input appears to be a misspelling of a morphological form, score higher.
 */
function morphologyScore(inputNorm: string, candidateNorm: string): number {
  const inputAnalysis = analyzeWord(inputNorm);
  const candidateAnalysis = analyzeWord(candidateNorm);

  // Both are valid forms of the same stem
  if (inputAnalysis && candidateAnalysis) {
    if (inputAnalysis.stem === candidateAnalysis.stem) return 1.0;
    return 0.5;
  }

  // Candidate is a valid form, input is not
  if (candidateAnalysis && !inputAnalysis) {
    // Check if the stems are similar (maybe the input has a typo in the stem)
    const inputStem = stripSuffixForStem(inputNorm);
    const candStem = candidateAnalysis.stem;
    if (inputStem && candStem) {
      const stemDist = levenshtein(inputStem, candStem);
      if (stemDist <= 2) return 0.8;
    }
    return 0.6;
  }

  // Neither is a valid form — just compare stems
  return 0.3;
}

function stripSuffixForStem(word: string): string | null {
  const split = splitCaseSuffix(word);
  if (split) return split.stem;
  return null;
}

/**
 * Suffix compatibility score.
 * If the input has a case suffix and the candidate has a different one,
 * check if the candidate's suffix is the correct phonetic variant.
 */
function suffixScore(inputNorm: string, candidateNorm: string): number {
  const inputSplit = splitCaseSuffix(inputNorm);
  const candSplit = splitCaseSuffix(candidateNorm);

  if (!inputSplit && !candSplit) return 0.5; // No suffixes involved
  if (!inputSplit || !candSplit) return 0.4; // One has suffix, other doesn't

  // Both have suffixes
  if (inputSplit.suffix === candSplit.suffix) return 0.7; // Same suffix
  if (inputSplit.stem === candSplit.stem) {
    // Same stem, different suffix — check if candidate suffix is phonetically correct
    const validation = validateCaseSuffix(candSplit.stem, candSplit.suffix);
    if (validation.isPhoneticallyValid) return 0.9; // Correct suffix for this stem
    return 0.2; // Wrong suffix
  }
  return 0.3;
}

/**
 * Context score: how well does the candidate fit the surrounding sentence?
 */
function contextScoreForCandidate(
  candidateNorm: string,
  context: ContextInfo | undefined
): number {
  if (!context || !context.expectedCase) return 0.5;

  // Determine what case the candidate has
  const split = splitCaseSuffix(candidateNorm);
  const candidateCase: ExpectedCase = split
    ? (mapSuffixToCase(split.suffix) as ExpectedCase)
    : null;

  if (context.expectedCase === candidateCase) {
    return Math.min(1.0, 0.7 + context.confidence * 0.3);
  }
  if (candidateCase === null) return 0.5;
  return Math.max(0.0, 0.3 - context.confidence * 0.3);
}

function mapSuffixToCase(suffix: string): string | null {
  const map: Record<string, string> = {
    ga: 'dat', ka: 'dat', qa: 'dat',
    da: 'loc', ta: 'loc',
    dan: 'abl', tan: 'abl',
    ni: 'acc', ning: 'gen',
  };
  return map[suffix] ?? null;
}

/**
 * Dictionary score: is the candidate a known dictionary word?
 */
function dictionaryScore(candidateNorm: string, customDict?: Set<string>): number {
  if (inDictionary(candidateNorm)) return 1.0;
  if (isValidForm(candidateNorm)) return 0.8;
  if (customDict && customDict.has(candidateNorm)) return 0.9;
  return 0.2;
}

/**
 * Phonetic score: how phonetically similar are the input and candidate?
 */
function phoneticScore(inputNorm: string, candidateNorm: string): number {
  const ps = phoneticSimilarity(inputNorm, candidateNorm);
  const pc1 = phoneticCode(inputNorm);
  const pc2 = phoneticCode(candidateNorm);
  const codeMatch = pc1 === pc2 ? 0.3 : 0;
  return Math.min(1.0, ps * 0.7 + codeMatch);
}

/**
 * Rank candidates using the multi-factor scoring system.
 */
export function rankCandidates(
  input: string,
  candidates: string[],
  options: RankOptions = {}
): RankedCandidate[] {
  const inputNorm = normalizeApostrophe(input.toLowerCase());
  const { context, customDict } = options;

  const ranked: RankedCandidate[] = [];

  for (const candidate of candidates) {
    const candNorm = normalizeApostrophe(candidate.toLowerCase());
    if (candNorm === inputNorm) continue;

    const lev = levenshtein(inputNorm, candNorm);
    const maxLen = Math.max(inputNorm.length, candNorm.length);
    const editSim = 1 - lev / maxLen;
    const jw = jaroWinkler(inputNorm, candNorm);
    const ng = ngramSimilarity(inputNorm, candNorm, 2);
    const kb = keyboardTypoScore(inputNorm, candNorm);

    // Combined edit-based score
    const editCombined = editSim * 0.4 + jw * 0.3 + ng * 0.2 + kb * 0.1;

    // Dictionary score
    const dictS = dictionaryScore(candNorm, customDict);

    // Morphology score
    const morphS = morphologyScore(inputNorm, candNorm);

    // Suffix score
    const sufS = suffixScore(inputNorm, candNorm);

    // Frequency score
    const entry = getDictEntry(candNorm);
    const freqS = frequencyScore(entry?.freq);

    // Context score
    const ctxS = contextScoreForCandidate(candNorm, context);

    // Phonetic score
    const phonS = phoneticScore(inputNorm, candNorm);

    // Weighted total
    const total =
      editCombined * WEIGHTS.edit +
      dictS * WEIGHTS.dictionary +
      morphS * WEIGHTS.morphology +
      sufS * WEIGHTS.suffix +
      freqS * WEIGHTS.frequency +
      ctxS * WEIGHTS.context +
      phonS * WEIGHTS.phonetic;

    // Determine error type and reason
    const { errorType, reason } = classifyError(
      inputNorm,
      candNorm,
      lev,
      kb,
      editCombined,
      sufS,
      ctxS,
      context
    );

    ranked.push({
      word: candNorm,
      score: Math.min(0.99, total),
      reason,
      errorType,
      components: {
        edit: editCombined,
        dictionary: dictS,
        morphology: morphS,
        suffix: sufS,
        frequency: freqS,
        context: ctxS,
        phonetic: phonS,
      },
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

function classifyError(
  inputNorm: string,
  candidateNorm: string,
  lev: number,
  kb: number,
  editSim: number,
  sufS: number,
  ctxS: number,
  context: ContextInfo | undefined
): { errorType: string; reason: string } {
  const inputSplit = splitCaseSuffix(inputNorm);
  const candSplit = splitCaseSuffix(candidateNorm);

  // Case suffix error
  if (inputSplit && candSplit && inputSplit.stem === candSplit.stem && inputSplit.suffix !== candSplit.suffix) {
    const validation = validateCaseSuffix(candSplit.stem, candSplit.suffix);
    if (validation.isPhoneticallyValid) {
      let reason = `Notoʻgʻri kelishik qoʻshimchasi: -${inputSplit.suffix} oʻrniga -${candSplit.suffix}`;
      if (context && context.reason) reason += ` (${context.reason})`;
      return { errorType: 'grammar', reason };
    }
  }

  // Keyboard typo
  if (kb > 0.5 && lev <= 2) {
    return { errorType: 'spelling', reason: 'Klaviatura xatosi' };
  }

  // Transposition
  if (lev === 1 && inputNorm.length === candidateNorm.length) {
    return { errorType: 'spelling', reason: 'Harf almashtirilgan (oʻrin almashinishi)' };
  }

  // Missing letter
  if (lev === 1 && inputNorm.length < candidateNorm.length) {
    return { errorType: 'spelling', reason: 'Harf yetishmagan' };
  }

  // Extra letter
  if (lev === 1 && inputNorm.length > candidateNorm.length) {
    return { errorType: 'spelling', reason: 'Ortiqcha harf' };
  }

  // Wrong letter
  if (lev === 1) {
    return { errorType: 'spelling', reason: 'Notoʻgʻri harf' };
  }

  // General spelling error
  return { errorType: 'spelling', reason: 'Imlo xatosi' };
}
