// Suffix Engine: Analyzes and validates Uzbek case suffixes.
// Handles dative (-ga/-ka/-qa), locative (-da/-ta), ablative (-dan/-tan),
// accusative (-ni), genitive (-ning), and their phonetic variants.
//
// The key insight: Uzbek case suffixes have voiced and voiceless variants.
// The voiced variants (-ga, -da, -dan) are the literary standard.
// The voiceless variants (-ka, -ta, -tan) appear after voiceless consonants
// in colloquial speech but are non-standard in literary Uzbek.
//
// After voiced consonants and vowels, voiceless variants are ERRORS.

import { normalizeApostrophe } from './text';
import { inDictionary, isValidForm } from './morphology';
import { validateCaseSuffix, splitCaseSuffix, endsWithVoiceless } from './phonetics';

export interface SuffixAnalysis {
  stem: string;
  suffix: string;
  caseType: 'dat' | 'loc' | 'abl' | 'acc' | 'gen' | null;
  isCorrect: boolean;
  correctSuffix: string;
  correctedWord: string;
  reason: string;
  confidence: number;
}

const SUFFIX_TO_CASE: Record<string, 'dat' | 'loc' | 'abl' | 'acc' | 'gen'> = {
  'ga': 'dat', 'ka': 'dat', 'qa': 'dat',
  'da': 'loc', 'ta': 'loc',
  'dan': 'abl', 'tan': 'abl',
  'ni': 'acc',
  'ning': 'gen',
};

/**
 * Analyze a word for case suffix correctness.
 * Returns null if no case suffix is detected or if the suffix is correct.
 * Returns SuffixAnalysis if an incorrect case suffix is found.
 */
export function analyzeCaseSuffix(word: string): SuffixAnalysis | null {
  const w = normalizeApostrophe(word.toLowerCase());
  const split = splitCaseSuffix(w);
  if (!split) return null;

  const { stem, suffix } = split;
  const caseType = SUFFIX_TO_CASE[suffix] ?? null;
  if (!caseType) return null;

  // Check if the stem is a known word (dictionary or valid form)
  // The case suffix is outermost. Its base can itself be a productive form
  // (kitoblarim+da), not merely a bare dictionary root.
  const stemValid = inDictionary(stem) || isValidForm(stem);

  // Validate the suffix against the stem's phonology
  const validation = validateCaseSuffix(stem, suffix);

  // If suffix is phonetically valid, no correction needed
  if (validation.isPhoneticallyValid) return null;

  // The suffix is wrong. Build the correction.
  const correctSuffix = validation.correctSuffix;
  const correctedWord = stem + correctSuffix;

  // Verify the corrected word is valid (stem is known)
  if (!stemValid) return null;

  // Determine confidence based on:
  // 1. Whether the stem is a known word
  // 2. Whether the suffix is clearly wrong (voiced stem + voiceless suffix)
  let confidence = 0.85;
  if (stemValid) confidence = 0.93;

  // Boost confidence for clear phonetic violations
  if (!endsWithVoiceless(stem) && ['ka', 'ta', 'tan', 'qa'].includes(suffix)) {
    confidence = 0.95;
  }

  const reason = getSuffixReason(suffix, correctSuffix, caseType);

  return {
    stem,
    suffix,
    caseType,
    isCorrect: false,
    correctSuffix,
    correctedWord,
    reason,
    confidence,
  };
}

function getSuffixReason(wrongSuffix: string, correctSuffix: string, caseType: string): string {
  const caseName: Record<string, string> = {
    dat: 'ravish (joʻnalish)',
    loc: 'oʻrin-vaqt',
    abl: 'chiqish',
    acc: 'tushum',
    gen: 'qaratqich',
  };
  const cn = caseName[caseType] ?? caseType;
  return `Notoʻgʻri kelishik qoʻshimchasi: -${wrongSuffix} oʻrniga -${correctSuffix}`;
}

/**
 * Check if a word has a valid case suffix.
 * This is used to validate words that are in the dictionary with suffixes.
 */
export function hasValidCaseSuffix(word: string): boolean {
  const analysis = analyzeCaseSuffix(word);
  return analysis === null; // null means no problem found
}

/**
 * Get the stem of a word by removing its case suffix, if any.
 */
export function getCaseStem(word: string): { stem: string; suffix: string; caseType: string } | null {
  const w = normalizeApostrophe(word.toLowerCase());
  const split = splitCaseSuffix(w);
  if (!split) return null;

  const caseType = SUFFIX_TO_CASE[split.suffix];
  if (!caseType) return null;

  return {
    stem: split.stem,
    suffix: split.suffix,
    caseType,
  };
}
