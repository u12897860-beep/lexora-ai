# lexora-ai

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-icy8qe6m)

## Verification

The benchmark has two intentionally separate modes:

- `npm run benchmark:legacy` runs the original 340-case regression baseline.
- `npm run benchmark:expanded` runs the legacy cases plus the 80 RuleEngine
  measurement cases.

Run the focused regression suites with `npm run test:apostrophe` and
`npm run test:rules`. Keeping the legacy and expanded benchmarks separate
prevents the expanded dataset from being compared to the 340-case baseline as
though their composition were identical.
