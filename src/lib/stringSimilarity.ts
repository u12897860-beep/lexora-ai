// Pure string-similarity functions: Levenshtein, Jaro, Jaro-Winkler,
// n-gram, and keyboard typo detection.
// Extracted into a separate module to break the circular dependency
// between fuzzy.ts (needs rankCandidates) and candidateRanker.ts
// (needs similarity functions).

/** Classic Levenshtein edit distance (with Damerau transposition). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      // Transposition (Damerau)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

/** Jaro similarity (0-1). */
export function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;
  const matchDist = Math.max(len1, len2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  transpositions = Math.floor(transpositions / 2);
  return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3;
}

/** Jaro-Winkler similarity, boosting common prefixes. */
export function jaroWinkler(s1: string, s2: string): number {
  const j = jaro(s1, s2);
  let prefixLen = 0;
  const maxPrefix = 4;
  while (prefixLen < s1.length && prefixLen < s2.length && s1[prefixLen] === s2[prefixLen] && prefixLen < maxPrefix) {
    prefixLen++;
  }
  return j + prefixLen * 0.1 * (1 - j);
}

/** Character n-gram similarity (Jaccard on bigrams). */
export function ngramSimilarity(a: string, b: string, n = 2): number {
  if (a.length < n || b.length < n) return a === b ? 1 : 0;
  const gramsA = new Set<string>();
  const gramsB = new Set<string>();
  for (let i = 0; i <= a.length - n; i++) gramsA.add(a.slice(i, i + n));
  for (let i = 0; i <= b.length - n; i++) gramsB.add(b.slice(i, i + n));
  let intersection = 0;
  for (const g of gramsA) if (gramsB.has(g)) intersection++;
  const union = gramsA.size + gramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// QWERTY keyboard layout for adjacency detection
const QWERTY_ROWS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

const KEYBOARD_NEIGHBORS: Record<string, string[]> = {};

for (let r = 0; r < QWERTY_ROWS.length; r++) {
  for (let c = 0; c < QWERTY_ROWS[r].length; c++) {
    const key = QWERTY_ROWS[r][c];
    const neighbors: string[] = [];
    if (c > 0) neighbors.push(QWERTY_ROWS[r][c - 1]);
    if (c < QWERTY_ROWS[r].length - 1) neighbors.push(QWERTY_ROWS[r][c + 1]);
    if (r > 0 && c < QWERTY_ROWS[r - 1].length) neighbors.push(QWERTY_ROWS[r - 1][c]);
    if (r > 0 && c - 1 >= 0 && c - 1 < QWERTY_ROWS[r - 1].length) neighbors.push(QWERTY_ROWS[r - 1][c - 1]);
    if (r < QWERTY_ROWS.length - 1 && c < QWERTY_ROWS[r + 1].length) neighbors.push(QWERTY_ROWS[r + 1][c]);
    if (r < QWERTY_ROWS.length - 1 && c + 1 < QWERTY_ROWS[r + 1].length) neighbors.push(QWERTY_ROWS[r + 1][c + 1]);
    KEYBOARD_NEIGHBORS[key] = neighbors;
  }
}

function isKeyboardAdjacent(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return true;
  const neighbors = KEYBOARD_NEIGHBORS[la];
  return neighbors ? neighbors.includes(lb) : false;
}

/**
 * Score how likely `input` is a keyboard typo of `candidate`.
 * Returns a penalty reduction (0-1): higher = more likely a typo.
 */
export function keyboardTypoScore(input: string, candidate: string): number {
  if (input.length !== candidate.length) return 0;
  let adjacentCount = 0;
  let diffCount = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== candidate[i]) {
      diffCount++;
      if (isKeyboardAdjacent(input[i], candidate[i])) adjacentCount++;
    }
  }
  if (diffCount === 0) return 0;
  return adjacentCount / diffCount;
}
