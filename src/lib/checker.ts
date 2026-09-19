// Main checker engine: orchestrates the full correction pipeline.
//
// Pipeline:
//   TEXT → NORMALIZATION → TOKENIZATION → DICTIONARY LOOKUP →
//   MORPHOLOGY → SUFFIX ANALYSIS → CONTEXT ANALYSIS →
//   CANDIDATE GENERATION → CANDIDATE RANKING → CONFIDENCE → CORRECTION

import { Correction, CheckResult, Suggestion, StyleMode } from './types';
import { tokenize, normalizeApostrophe, detectScript, capitalize, cyrillicToLatin } from './text';
import { inDictionary, isValidForm } from './morphology';
import { findCandidates } from './fuzzy';
import { analyzeCaseSuffix } from './suffixEngine';
import { analyzeContext, ContextInfo } from './contextEngine';
import { isNamedEntity, isNamedEntityWithSuffix, isLikelyProperNoun, isTechnicalTerm } from './namedEntity';
import { SLANG } from './dictionary';

// Preserve capitalization from original word
function preserveCase(original: string, replacement: string): string {
  if (original.length > 0 && original[0] === original[0]?.toUpperCase()) {
    return capitalize(replacement);
  }
  return replacement;
}

// Punctuation checks
function checkPunctuation(text: string): Correction[] {
  const corrections: Correction[] = [];
  // Check for missing comma after greeting "Salom"
  const salomMatch = text.match(/^(\s*)(Salom|salom)(\s+)([^,!?.\n]+)/);
  if (salomMatch) {
    const start = (salomMatch[1] + salomMatch[2] + salomMatch[3]).length;
    corrections.push({
      original: '',
      start: start,
      end: start,
      type: 'punctuation',
      suggestions: [{ word: ', ', confidence: 0.85, reason: 'Salomdan keyin vergul qoʻyilishi kerak' }],
      explanation: 'Salom soʻzidan keyin vergul qoʻyilishi kerak.',
    });
  }
  // Check for missing period at end of sentence
  const trimmed = text.trim();
  if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
    corrections.push({
      original: '',
      start: text.length,
      end: text.length,
      type: 'punctuation',
      suggestions: [{ word: '.', confidence: 0.7, reason: 'Gap oxirida nuqta boʻlishi kerak' }],
      explanation: 'Gap oxirida nuqta qoʻyilishi kerak.',
    });
  }
  return corrections;
}

// Style checks
function checkStyle(text: string, mode: StyleMode): Correction[] {
  const corrections: Correction[] = [];
  const words = tokenize(text).filter(t => t.isWord).map(t => t.text.toLowerCase());
  // Check for repeated words
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 2) {
      corrections.push({
        original: words[i],
        start: 0,
        end: 0,
        type: 'style',
        suggestions: [],
        explanation: `"${words[i]}" soʻzi ikki marta takrorlangan.`,
      });
    }
  }
  // Check for very long sentences
  const sentences = text.split(/[.!?]+/);
  for (const sent of sentences) {
    const sentWords = sent.trim().split(/\s+/).filter(w => w.length > 0);
    if (sentWords.length > 30) {
      corrections.push({
        original: '',
        start: 0,
        end: 0,
        type: 'style',
        suggestions: [],
        explanation: 'Gap juda uzun. Uni ikkiga boʻlish tavsiya etiladi.',
      });
    }
  }
  // Slang detection in formal/academic mode
  if (mode === 'formal' || mode === 'academic' || mode === 'business') {
    for (const token of tokenize(text)) {
      if (!token.isWord) continue;
      const lower = token.text.toLowerCase();
      if (SLANG[lower]) {
        corrections.push({
          original: token.text,
          start: token.start,
          end: token.end,
          type: 'style',
          suggestions: [{ word: SLANG[lower], confidence: 0.8, reason: 'Rasmiy uslubda soʻzlash kerak' }],
          explanation: `"${token.text}" soʻzi soʻzlashuv uslubida. Rasmiy matnda "${SLANG[lower]}" ishlatish tavsiya etiladi.`,
        });
      }
    }
  }
  return corrections;
}

export interface CheckOptions {
  customDictionary?: string[];
  styleMode?: StyleMode;
  autoCorrect?: boolean;
}

/**
 * Main check function: analyzes text and returns all corrections.
 */
export function checkText(text: string, options: CheckOptions = {}): CheckResult {
  const { customDictionary = [], styleMode = 'simple', autoCorrect = false } = options;
  const customSet = new Set(customDictionary.map(w => normalizeApostrophe(w.toLowerCase())));
  const tokens = tokenize(text);
  const corrections: Correction[] = [];
  const script = detectScript(text);

  // If text is Cyrillic, transliterate to Latin for analysis
  const analyzeText = script === 'cyrillic' ? cyrToLatMap(text) : text;
  const analyzeTokens = script === 'cyrillic' ? tokenize(analyzeText) : tokens;

  // Build word list for context analysis
  const wordTokens = (script === 'cyrillic' ? analyzeTokens : tokens).filter(t => t.isWord);
  const wordTexts = wordTokens.map(t => normalizeApostrophe(t.text.toLowerCase()));

  let wordIndex = -1;
  for (const token of (script === 'cyrillic' ? analyzeTokens : tokens)) {
    if (!token.isWord) continue;
    wordIndex++;
    const word = token.text;
    const isFirstWord = wordIndex === 0;

    // Skip if in custom dictionary
    if (customSet.has(normalizeApostrophe(word.toLowerCase()))) continue;

    // Skip technical terms
    if (isTechnicalTerm(word)) continue;

    // Named entity protection
    if (isNamedEntity(word)) {
      // Check for apostrophe normalization issues on named entities
      const hasNonStandardApostrophe = word !== normalizeApostrophe(word) && /[oOgG][''`ʻʼ]/.test(word.replace(/oʻ|gʻ/g, ''));
      if (hasNonStandardApostrophe) {
        const fixed = normalizeApostrophe(word);
        corrections.push({
          original: word,
          start: token.start,
          end: token.end,
          type: 'spelling',
          suggestions: [{ word: fixed, confidence: 0.95, reason: 'Apostrof belgisi notoʻgʻri' }],
          explanation: 'Apostrof belgisi standart shaklda emas. Oʻzbek lotin yozuvida ʻ belgisi ishlatiladi.',
        });
      }
      continue;
    }

    // Check for named entity with suffix (e.g., "Toshkentda" is valid)
    const entityWithSuffix = isNamedEntityWithSuffix(word);
    if (entityWithSuffix) {
      // Validate the suffix phonetically
      const suffixAnalysis = analyzeCaseSuffix(word);
      if (suffixAnalysis && !suffixAnalysis.isCorrect) {
        // The entity has a wrong case suffix
        const corrected = preserveCase(word, suffixAnalysis.correctedWord);
        // Use context to boost confidence
        const context = analyzeContext(wordTexts, wordIndex);
        let confidence = suffixAnalysis.confidence;
        let reason = suffixAnalysis.reason;
        if (context.expectedCase) {
          const expectedSuffix = context.expectedCase === 'dat' ? 'ga' :
                                  context.expectedCase === 'loc' ? 'da' :
                                  context.expectedCase === 'abl' ? 'dan' : null;
          if (expectedSuffix && expectedSuffix === suffixAnalysis.correctSuffix) {
            confidence = Math.min(0.98, confidence + 0.05);
            reason += ` (${context.reason})`;
          }
        }
        corrections.push({
          original: word,
          start: token.start,
          end: token.end,
          type: 'grammar',
          suggestions: [{ word: corrected, confidence, reason }],
          explanation: `"${word}" soʻzida kelishik qoʻshimchasi notoʻgʻri ishlatilgan. Tavsiya: "${corrected}".`,
        });
      }
      continue;
    }

    // Skip likely proper nouns (non-first-word capitalized unknown words)
    if (isLikelyProperNoun(word, isFirstWord)) {
      // But still check if it has a wrong case suffix
      const suffixAnalysis = analyzeCaseSuffix(word);
      if (suffixAnalysis && !suffixAnalysis.isCorrect && inDictionary(suffixAnalysis.stem)) {
        const corrected = preserveCase(word, suffixAnalysis.correctedWord);
        corrections.push({
          original: word,
          start: token.start,
          end: token.end,
          type: 'grammar',
          suggestions: [{ word: corrected, confidence: suffixAnalysis.confidence, reason: suffixAnalysis.reason }],
          explanation: `"${word}" soʻzida kelishik qoʻshimchasi notoʻgʻri. Tavsiya: "${corrected}".`,
        });
      }
      continue;
    }

    // Check if word is valid (in dictionary or valid morphological form)
    const normalized = normalizeApostrophe(word.toLowerCase());
    if (inDictionary(normalized) || isValidForm(normalized)) {
      // Check for apostrophe normalization issues
      const hasNonStandardApostrophe = word !== normalizeApostrophe(word) && /[oOgG][''`ʻʼ]/.test(word.replace(/oʻ|gʻ/g, ''));
      if (hasNonStandardApostrophe) {
        const fixed = normalizeApostrophe(word);
        corrections.push({
          original: word,
          start: token.start,
          end: token.end,
          type: 'spelling',
          suggestions: [{ word: fixed, confidence: 0.95, reason: 'Apostrof belgisi notoʻgʻri' }],
          explanation: 'Apostrof belgisi standart shaklda emas. Oʻzbek lotin yozuvida ʻ belgisi ishlatiladi.',
        });
      }
      continue; // Word is valid, no correction needed
    }

    // Check for slang
    if (SLANG[normalized]) {
      corrections.push({
        original: word,
        start: token.start,
        end: token.end,
        type: 'style',
        suggestions: [{ word: preserveCase(word, SLANG[normalized]), confidence: 0.85, reason: 'Soʻzlashuv uslubi' }],
        explanation: `"${word}" soʻzlashuv uslubidagi soʻz. Adabiy varianti: "${SLANG[normalized]}".`,
      });
      continue;
    }

    // Try suffix engine first (case suffix errors)
    const suffixAnalysis = analyzeCaseSuffix(word);
    if (suffixAnalysis && !suffixAnalysis.isCorrect) {
      const corrected = preserveCase(word, suffixAnalysis.correctedWord);
      // Use context to boost confidence
      const context = analyzeContext(wordTexts, wordIndex);
      let confidence = suffixAnalysis.confidence;
      let reason = suffixAnalysis.reason;
      if (context.expectedCase) {
        const expectedSuffix = context.expectedCase === 'dat' ? 'ga' :
                                context.expectedCase === 'loc' ? 'da' :
                                context.expectedCase === 'abl' ? 'dan' : null;
        if (expectedSuffix && expectedSuffix === suffixAnalysis.correctSuffix) {
          confidence = Math.min(0.98, confidence + 0.05);
          reason += ` (${context.reason})`;
        }
      }
      corrections.push({
        original: word,
        start: token.start,
        end: token.end,
        type: 'grammar',
        suggestions: [{ word: corrected, confidence, reason }],
        explanation: `"${word}" soʻzida kelishik qoʻshimchasi notoʻgʻri ishlatilgan. -${suffixAnalysis.suffix} oʻrniga -${suffixAnalysis.correctSuffix} boʻlishi kerak. Tavsiya: "${corrected}".`,
      });
      continue;
    }

    // Try fuzzy matching with context-aware ranking for spelling errors
    const candidates = findCandidates(word, 5, customSet, wordTexts, wordIndex);
    if (candidates.length > 0 && candidates[0].score > 0.5) {
      const suggestions: Suggestion[] = candidates.map(c => ({
        word: preserveCase(word, c.word),
        confidence: c.score,
        reason: c.reason,
      }));
      const errorType = candidates[0].errorType === 'grammar' ? 'grammar' : 'spelling';
      const explanation = errorType === 'grammar'
        ? `"${word}" soʻzida kelishik qoʻshimchasi notoʻgʻri. Tavsiya: "${suggestions[0].word}".`
        : `"${word}" soʻzi imlo xatosi bilan yozilgan. Ehtimol toʻgʻri variant: "${suggestions[0].word}".`;
      corrections.push({
        original: word,
        start: token.start,
        end: token.end,
        type: errorType,
        suggestions,
        explanation,
      });
    } else if (candidates.length > 0) {
      // Low confidence — suggest but mark as uncertain
      corrections.push({
        original: word,
        start: token.start,
        end: token.end,
        type: 'spelling',
        suggestions: candidates.map(c => ({
          word: preserveCase(word, c.word),
          confidence: c.score,
          reason: c.reason,
        })),
        explanation: `"${word}" soʻzi topilmadi. Ehtimol, siz quyidagini nazarda tutgandirsiz:`,
      });
    }
  }

  // Punctuation checks
  const punctCorrections = checkPunctuation(analyzeText);
  corrections.push(...punctCorrections);

  // Style checks
  const styleCorrections = checkStyle(analyzeText, styleMode);
  corrections.push(...styleCorrections);

  // Build corrected text
  const correctedText = buildCorrectedText(text, corrections, autoCorrect, script);

  // Calculate stats
  const wordCount = tokens.filter(t => t.isWord).length;
  const charCount = text.length;
  const spellingCount = corrections.filter(c => c.type === 'spelling').length;
  const grammarCount = corrections.filter(c => c.type === 'grammar').length;
  const punctCount = corrections.filter(c => c.type === 'punctuation').length;
  const styleCount = corrections.filter(c => c.type === 'style').length;
  const totalErrors = spellingCount + grammarCount + punctCount + styleCount;

  // Score: start at 100, deduct per error, scaled by word count
  const errorPenalty = totalErrors * Math.max(2, 100 / Math.max(wordCount, 1));
  const score = Math.max(0, Math.min(100, Math.round(100 - errorPenalty + Math.min(wordCount * 0.1, 5))));

  return {
    corrections,
    correctedText,
    stats: {
      words: wordCount,
      characters: charCount,
      errors: totalErrors,
      spelling: spellingCount,
      grammar: grammarCount,
      punctuation: punctCount,
      style: styleCount,
    },
    score,
  };
}

function buildCorrectedText(
  original: string,
  corrections: Correction[],
  autoCorrect: boolean,
  _script: string
): string {
  const sorted = [...corrections]
    .filter(c => c.suggestions.length > 0)
    .sort((a, b) => b.start - a.start);

  let result = original;
  for (const corr of sorted) {
    const shouldApply = autoCorrect ? corr.suggestions[0].confidence > 0.95 : false;
    if (!shouldApply) continue;
    const replacement = corr.suggestions[0].word;
    if (corr.start === corr.end) {
      result = result.slice(0, corr.start) + replacement + result.slice(corr.end);
    } else {
      result = result.slice(0, corr.start) + replacement + result.slice(corr.end);
    }
  }
  return result;
}

function cyrToLatMap(text: string): string {
  return cyrillicToLatin(text);
}
