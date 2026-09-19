# RuleEngine v3 benchmark analysis

## Baseline failure taxonomy

All 91 legacy failures from the v2 baseline were inspected individually. The
groups below are mutually exclusive: each case is assigned to its primary
cause rather than counted several times.

| Primary cause | Count | Legacy case IDs |
| --- | ---: | --- |
| Dictionary coverage | 14 | 44, 52, 117, 141, 171, 228, 232, 239, 240, 241, 254, 255, 322, 340 |
| Morphology | 25 | 32, 45, 54, 59, 76, 108, 109, 121, 130, 133, 134, 148, 220, 243, 244, 248, 251, 253, 287, 290, 295, 296, 298, 300, 312 |
| Suffix/stem decomposition | 11 | 61, 67, 144, 145, 150, 271, 286, 288, 299, 314, 325 |
| ContextEngine | 4 | 166, 167, 168, 172 |
| CandidateRanker | 8 | 51, 98, 103, 105, 131, 270, 282, 283 |
| Cyrillic pipeline | 2 | 207, 214 |
| NamedEntity/suffixed entity | 2 | 137, 267 |
| Apostrophe/lexical coverage | 8 | 176, 181, 187, 188, 191, 192, 194, 204 |
| RuleEngine v2 | 0 | — |
| Ambiguous/problematic dataset case | 8 | 104, 127, 128, 129, 147, 269, 294, 333 |
| Other: benchmark stem/full-token comparison | 9 | 49, 71, 86, 96, 211, 256, 259, 281, 306 |
| **Total** | **91** | |

The “other” group contains real detections that the old evaluator called false
negatives because the fixture names a misspelled stem (for example, `maktap`)
while the checker necessarily reports the complete surface token
(`maktapga`). Cyrillic fixtures had the same comparison problem after the
checker transliterated its analysis token.

## Selected low-risk systemic improvements

1. **Morphology-aware benchmark matching.** Expected stems may match a
   correction with a recognized productive suffix; the same suffix must also
   be present on the suggested correction. Expected Cyrillic text is
   transliterated through the production transliterator before comparison.
   This changes evaluation only; it does not make the checker more permissive.
2. **Conservative case government.** Existing `-ga`/`-da` forms are changed
   only when their dictionary-backed stem is followed by a verb for which
   ContextEngine has confidence of at least 0.8. Multi-government verbs such
   as `oʻqimoq` and `ishlamoq` explicitly abstain.
3. **Missing buffer-vowel recovery.** Subject agreement plus a known noun or
   verb stem detects omitted `i`/`a` in productive personal, possessive and
   plural suffixes. Consonant-final guards prevent a valid vowel-final stem
   from being expanded accidentally.

No dictionary entries or CandidateRanker weights were changed.

## Before / after

| Dataset / metric | Before v3 | After v3 |
| --- | ---: | ---: |
| Legacy passed | 249/340 | 269/340 |
| Legacy accuracy | 73.2% | 79.1% |
| Legacy precision | 65.8% | 69.8% |
| Legacy recall | 78.4% | 92.2% |
| Legacy F1 | 71.5% | 79.5% |
| Legacy FPR | 25.2% | 25.2% |
| Legacy FNR | 21.6% | 7.8% |
| Legacy correction accuracy | 88.3% | 92.2% |
| Expanded passed | 329/420 | 349/420 |
| Expanded accuracy | 78.3% | 83.1% |
| Expanded precision | 72.0% | 74.8% |
| Expanded recall | 82.9% | 93.8% |
| Expanded F1 | 77.1% | 83.2% |
| Expanded FPR | 20.5% | 20.5% |
| Expanded FNR | 17.1% | 6.2% |
| Expanded correction accuracy | 91.0% | 93.8% |
| RuleEngine benchmark | 80/80 (100%) | 80/80 (100%) |

Twenty old failures are now passing and there are no new regressions. Eight of
the twenty are corrected benchmark classifications for suffixed surface tokens;
the remaining twelve are engine corrections from the general context and
buffer-vowel rules.

## Remaining failures

The remaining 71 cases are intentionally not addressed by v3:

- **51 false positives** mostly require broader curated lexical coverage,
  irregular morphology, or resolution of fixtures that mark visibly malformed
  forms as correct. Adding benchmark words as exceptions would hide rather
  than solve those limitations.
- **10 false negatives** include malformed case suffixes on named entities,
  a duplicated accusative suffix, and several cases whose intended error is
  not safely inferable from local context.
- **10 wrong suggestions** require broader candidate generation or lexical
  evidence. CandidateRanker weights were left unchanged because there was no
  evidence that a global reweighting could fix these without regressions.

The remaining failure records are printed in full by `npm run benchmark:legacy`;
their per-category distribution is included in that report.
