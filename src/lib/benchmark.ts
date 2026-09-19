// Benchmark runner for Lexora AI.
// Runs the full test dataset through the real CorrectionEngine (checker.ts)
// and computes: accuracy, precision, recall, F1, false positive/negative rates,
// correction accuracy, and per-category breakdowns.

import { checkText } from './checker';
import { TEST_DATASET, TestCase } from './testDataset';
import { normalizeApostrophe } from './text';
import { RULE_ENGINE_CATEGORIES, RULE_ENGINE_TEST_DATASET } from './ruleEngineBenchmarkDataset';

export interface TestResult {
  testCase: TestCase;
  passed: boolean;
  outcome: 'TP' | 'TN' | 'FP' | 'FN' | 'WRONG_SUGGESTION';
  detectedWord?: string;
  suggestedWords?: string[];
  detail: string;
}

export interface CategoryStats {
  category: string;
  total: number;
  passed: number;
  failed: number;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  wrongSuggestion: number;
  accuracy: number;
}

export interface BenchmarkSummary {
  totalTests: number;
  passed: number;
  failed: number;
  // Confusion matrix counts
  tp: number; // true positive: error expected & detected with correct suggestion
  tn: number; // true negative: no error expected & none detected
  fp: number; // false positive: no error expected but one was flagged
  fn: number; // false negative: error expected but not detected
  wrongSuggestion: number; // error detected but wrong suggestion
  // Metrics
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  correctionAccuracy: number;
  // Per-category
  categoryStats: CategoryStats[];
  // Failures
  failures: TestResult[];
}

/**
 * Run a single test case through the real checker and evaluate the result.
 */
function runTest(tc: TestCase): TestResult {
  const result = checkText(tc.input, { styleMode: 'simple' });

  // Filter out punctuation-only corrections (period-at-end, comma-after-salom)
  // since those are structural checks, not word-level corrections. RuleEngine
  // cases measure the named rule in isolation: an unrelated lexical warning
  // must not turn a rule's negative case into a false positive.
  const isRuleEngineCase = RULE_ENGINE_CATEGORIES.includes(tc.category as typeof RULE_ENGINE_CATEGORIES[number]);
  const wordCorrections = result.corrections.filter(c =>
    c.type !== 'punctuation' && (!isRuleEngineCase || c.ruleId === tc.category)
  );

  if (tc.expectError) {
    // We expect an error to be detected
    if (wordCorrections.length === 0) {
      return {
        testCase: tc,
        passed: false,
        outcome: 'FN',
        detail: 'Error expected but no correction was produced.',
      };
    }

    // Check if the expected word was flagged
    const expectedWordNorm = tc.expectedWord ? normalizeApostrophe(tc.expectedWord.toLowerCase()) : null;
    const matchingCorr = expectedWordNorm
      ? wordCorrections.find(c =>
          normalizeApostrophe(c.original.toLowerCase()) === expectedWordNorm
        )
      : wordCorrections[0];

    if (!matchingCorr) {
      // The expected word was not among the flagged words
      const flagged = wordCorrections.map(c => c.original).join(', ');
      return {
        testCase: tc,
        passed: false,
        outcome: 'FN',
        detectedWord: flagged,
        detail: `Expected to flag "${tc.expectedWord}" but flagged: ${flagged}`,
      };
    }

    // Check if the expected suggestion is among the suggestions
    if (tc.expectedSuggestion !== null && tc.expectedSuggestion !== undefined) {
      const expectedSuggNorm = normalizeApostrophe(tc.expectedSuggestion.toLowerCase());
      const allSuggestions = matchingCorr.suggestions.map(s => normalizeApostrophe(s.word.toLowerCase()));
      const found = allSuggestions.includes(expectedSuggNorm);
      if (!found) {
        return {
          testCase: tc,
          passed: false,
          outcome: 'WRONG_SUGGESTION',
          detectedWord: matchingCorr.original,
          suggestedWords: matchingCorr.suggestions.map(s => s.word),
          detail: `Expected suggestion "${tc.expectedSuggestion}" not found. Got: ${matchingCorr.suggestions.map(s => s.word).join(', ')}`,
        };
      }
    }

    return {
      testCase: tc,
      passed: true,
      outcome: 'TP',
      detectedWord: matchingCorr.original,
      suggestedWords: matchingCorr.suggestions.map(s => s.word),
      detail: 'OK',
    };
  } else {
    // We expect NO error
    if (wordCorrections.length > 0) {
      // Check shouldNotFlag list
      const shouldNotFlagNorm = (tc.shouldNotFlag ?? []).map(w => normalizeApostrophe(w.toLowerCase()));
      const flaggedWords = wordCorrections.map(c => normalizeApostrophe(c.original.toLowerCase()));

      // If shouldNotFlag is specified, only count as FP if a shouldNotFlag word was flagged
      if (shouldNotFlagNorm.length > 0) {
        const falsePositive = flaggedWords.some(fw => shouldNotFlagNorm.includes(fw));
        if (!falsePositive) {
          // Flagged something else (like a word not in shouldNotFlag) — still a FP for the sentence
          return {
            testCase: tc,
            passed: false,
            outcome: 'FP',
            detectedWord: wordCorrections.map(c => c.original).join(', '),
            detail: `No error expected but flagged: ${wordCorrections.map(c => c.original).join(', ')}`,
          };
        }
      }

      return {
        testCase: tc,
        passed: false,
        outcome: 'FP',
        detectedWord: wordCorrections.map(c => c.original).join(', '),
        detail: `No error expected but flagged: ${wordCorrections.map(c => c.original).join(', ')}`,
      };
    }

    return {
      testCase: tc,
      passed: true,
      outcome: 'TN',
      detail: 'OK',
    };
  }
}

/**
 * Run the full benchmark and print results.
 */
export function runBenchmark(dataset: readonly TestCase[] = TEST_DATASET): BenchmarkSummary {
  const results: TestResult[] = [];

  for (const tc of dataset) {
    const tr = runTest(tc);
    results.push(tr);
  }

  // Aggregate
  let tp = 0, tn = 0, fp = 0, fn = 0, wrongSuggestion = 0;
  let passed = 0;

  for (const r of results) {
    if (r.passed) passed++;
    switch (r.outcome) {
      case 'TP': tp++; break;
      case 'TN': tn++; break;
      case 'FP': fp++; break;
      case 'FN': fn++; break;
      case 'WRONG_SUGGESTION': wrongSuggestion++; break;
    }
  }

  const totalTests = results.length;
  const failed = totalTests - passed;

  // Metrics
  // Precision = TP / (TP + FP)
  // Recall = TP / (TP + FN)
  // F1 = 2 * P * R / (P + R)
  // FPR = FP / (FP + TN)
  // FNR = FN / (FN + TP)
  // Accuracy = (TP + TN) / total
  // Correction Accuracy = TP / (TP + wrongSuggestion)  [when an error is detected, how often is the suggestion right]
  const accuracy = totalTests > 0 ? (tp + tn) / totalTests : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falsePositiveRate = (fp + tn) > 0 ? fp / (fp + tn) : 0;
  const falseNegativeRate = (fn + tp) > 0 ? fn / (fn + tp) : 0;
  const correctionAccuracy = (tp + wrongSuggestion) > 0 ? tp / (tp + wrongSuggestion) : 0;

  // Per-category
  const categoryMap = new Map<string, CategoryStats>();
  for (const r of results) {
    const cat = r.testCase.category;
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        category: cat,
        total: 0, passed: 0, failed: 0,
        tp: 0, tn: 0, fp: 0, fn: 0, wrongSuggestion: 0,
        accuracy: 0,
      });
    }
    const cs = categoryMap.get(cat)!;
    cs.total++;
    if (r.passed) cs.passed++;
    else cs.failed++;
    switch (r.outcome) {
      case 'TP': cs.tp++; break;
      case 'TN': cs.tn++; break;
      case 'FP': cs.fp++; break;
      case 'FN': cs.fn++; break;
      case 'WRONG_SUGGESTION': cs.wrongSuggestion++; break;
    }
  }

  for (const cs of categoryMap.values()) {
    cs.accuracy = cs.total > 0 ? cs.passed / cs.total : 0;
  }

  const categoryStats = Array.from(categoryMap.values()).sort((a, b) => a.accuracy - b.accuracy);

  const failures = results.filter(r => !r.passed);

  const summary: BenchmarkSummary = {
    totalTests,
    passed,
    failed,
    tp, tn, fp, fn, wrongSuggestion,
    accuracy,
    precision,
    recall,
    f1,
    falsePositiveRate,
    falseNegativeRate,
    correctionAccuracy,
    categoryStats,
    failures,
  };

  return summary;
}

/**
 * Format and print the benchmark report.
 */
export function printBenchmarkReport(summary: BenchmarkSummary): void {
  const pct = (v: number) => (v * 100).toFixed(1) + '%';

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                 LEXORA AI — BENCHMARK REPORT               ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  console.log('── OVERALL METRICS ──────────────────────────────────────');
  console.log(`  Total tests:        ${summary.totalTests}`);
  console.log(`  Passed:             ${summary.passed}`);
  console.log(`  Failed:             ${summary.failed}`);
  console.log('');
  console.log(`  True Positives:     ${summary.tp}`);
  console.log(`  True Negatives:     ${summary.tn}`);
  console.log(`  False Positives:    ${summary.fp}`);
  console.log(`  False Negatives:    ${summary.fn}`);
  console.log(`  Wrong Suggestion:   ${summary.wrongSuggestion}`);
  console.log('');
  console.log(`  Accuracy:           ${pct(summary.accuracy)}`);
  console.log(`  Precision:          ${pct(summary.precision)}`);
  console.log(`  Recall:             ${pct(summary.recall)}`);
  console.log(`  F1 Score:           ${pct(summary.f1)}`);
  console.log(`  False Positive Rate:${pct(summary.falsePositiveRate)}`);
  console.log(`  False Negative Rate:${pct(summary.falseNegativeRate)}`);
  console.log(`  Correction Accuracy:${pct(summary.correctionAccuracy)}`);
  console.log('');

  const ruleCategories = new Set<string>(RULE_ENGINE_CATEGORIES);
  const ruleStats = summary.categoryStats.filter(category => ruleCategories.has(category.category));
  if (ruleStats.length > 0) {
    const total = ruleStats.reduce((sum, category) => sum + category.total, 0);
    const passed = ruleStats.reduce((sum, category) => sum + category.passed, 0);
    console.log('── RULEENGINE AGGREGATE ──────────────────────────────────');
    console.log(`  Total:              ${total}`);
    console.log(`  Passed:             ${passed}`);
    console.log(`  Failed:             ${total - passed}`);
    console.log(`  Accuracy:           ${pct(total > 0 ? passed / total : 0)}`);
    console.log('');
  }

  console.log('── PER-CATEGORY RESULTS (sorted by accuracy, ascending) ──');
  console.log('  Category               Total  Pass  Fail  TP   TN   FP   FN   WS   Acc');
  console.log('  ────────────────────────────────────────────────────────────────────────');
  for (const cs of summary.categoryStats) {
    const cat = cs.category.padEnd(22);
    console.log(`  ${cat}  ${String(cs.total).padStart(5)}  ${String(cs.passed).padStart(4)}  ${String(cs.failed).padStart(4)}  ${String(cs.tp).padStart(4)}  ${String(cs.tn).padStart(4)}  ${String(cs.fp).padStart(4)}  ${String(cs.fn).padStart(4)}  ${String(cs.wrongSuggestion).padStart(4)}  ${pct(cs.accuracy)}`);
  }
  console.log('');

  console.log('── WEAKEST 5 CATEGORIES ──────────────────────────────────');
  const weakest = summary.categoryStats.slice(0, 5);
  for (const cs of weakest) {
    console.log(`  ${cs.category}: ${pct(cs.accuracy)} (${cs.passed}/${cs.total}) — FP:${cs.fp} FN:${cs.fn} WS:${cs.wrongSuggestion}`);
  }
  console.log('');

  console.log('── 20 SAMPLE FAILURES ───────────────────────────────────');
  const sampleFailures = summary.failures.slice(0, 20);
  for (const f of sampleFailures) {
    console.log(`  [${f.outcome}] #${f.testCase.id} (${f.testCase.category})`);
    console.log(`    Input:    "${f.testCase.input}"`);
    if (f.testCase.expectedWord) {
      console.log(`    Expected: flag "${f.testCase.expectedWord}" → suggest "${f.testCase.expectedSuggestion ?? 'any'}"`);
    } else {
      console.log(`    Expected: no error`);
    }
    if (f.detectedWord) {
      console.log(`    Detected: "${f.detectedWord}"`);
    }
    if (f.suggestedWords && f.suggestedWords.length > 0) {
      console.log(`    Suggested: ${f.suggestedWords.join(', ')}`);
    }
    console.log(`    Reason:   ${f.detail}`);
    console.log('');
  }

  const ruleFailures = summary.failures.filter(failure => ruleCategories.has(failure.testCase.category));
  if (ruleFailures.length > 0) {
    console.log('── ALL RULEENGINE FAILURES ───────────────────────────────');
    for (const failure of ruleFailures) {
      console.log(`  [${failure.outcome}] #${failure.testCase.id} (${failure.testCase.category})`);
      console.log(`    Input:    "${failure.testCase.input}"`);
      console.log(`    Reason:   ${failure.detail}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

// CLI entry point when run directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  const expanded = process.argv.includes('--expanded');
  const dataset = expanded ? [...TEST_DATASET, ...RULE_ENGINE_TEST_DATASET] : TEST_DATASET;
  console.log(expanded ? 'Dataset: expanded (legacy + RuleEngine)' : 'Dataset: legacy');
  const summary = runBenchmark(dataset);
  printBenchmarkReport(summary);
}
