// Named Entity Detector: Identifies and protects proper nouns.
// Recognizes people names, cities, countries, brands, organizations,
// technical terms. Prevents false-positive corrections on proper nouns.

import { normalizeApostrophe } from './text';

// Named entities from dictionary.ts (re-exported here for the engine pipeline)
import { NAMED_ENTITIES } from './dictionary';

// Build a normalized Set for fast lookup
const ENTITY_SET = new Set<string>();
for (const entity of NAMED_ENTITIES) {
  ENTITY_SET.add(normalizeApostrophe(entity.toLowerCase()));
}

// Technical terms that should not be "corrected"
const TECHNICAL_TERMS = new Set([
  'javascript', 'typescript', 'python', 'react', 'node', 'java', 'c++', 'rust',
  'golang', 'kotlin', 'swift', 'php', 'ruby', 'docker', 'kubernetes', 'nginx',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest',
  'api', 'sdk', 'oauth', 'jwt', 'json', 'xml', 'yaml', 'toml', 'csv',
  'html', 'css', 'sql', 'bash', 'powershell', 'linux', 'windows', 'macos',
  'android', 'ios', 'github', 'gitlab', 'bitbucket', 'jenkins', 'circleci',
  'aws', 'gcp', 'azure', 'vercel', 'netlify', 'heroku', 'railway', 'render',
  'supabase', 'firebase', 'stripe', 'twilio', 'sendgrid',
]);

// Suffixes that named entities can take (case suffixes, plural)
const ENTITY_SUFFIXES = ['ga', 'da', 'dan', 'ni', 'ning', 'lar', 'lari', 'imiz', 'ingiz'];

// Add technical terms to protection set
for (const term of TECHNICAL_TERMS) {
  ENTITY_SET.add(term);
}

/**
 * Check if a word is a known named entity.
 */
export function isNamedEntity(word: string): boolean {
  const normalized = normalizeApostrophe(word.toLowerCase());
  return ENTITY_SET.has(normalized);
}

/**
 * Check if a word is a named entity with a valid suffix.
 * E.g., "Toshkentda" → stem "Toshkent" + suffix "da" → valid entity form.
 */
export function isNamedEntityWithSuffix(word: string): { entity: string; suffix: string } | null {
  const normalized = normalizeApostrophe(word.toLowerCase());

  // Try stripping common suffixes
  for (const suffix of ENTITY_SUFFIXES) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
      const stem = normalized.slice(0, -suffix.length);
      if (ENTITY_SET.has(stem)) {
        return { entity: stem, suffix };
      }
      // Try stripping a possessive layer
      const possSuffixes = ['im', 'ing', 'i', 'imiz', 'ingiz', 'lari'];
      for (const poss of possSuffixes) {
        if (stem.endsWith(poss) && stem.length > poss.length + 2) {
          const innerStem = stem.slice(0, -poss.length);
          if (ENTITY_SET.has(innerStem)) {
            return { entity: innerStem, suffix: poss + suffix };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Check if a word looks like a proper noun we don't know.
 * Uses capitalization heuristics:
 * - Non-first-word capitalized → likely proper noun
 * - First-word capitalized + known entity → entity
 * - First-word capitalized + unknown + lowercase form in dict → just capitalization issue
 */
export function isLikelyProperNoun(word: string, isFirstWord: boolean): boolean {
  if (!isCapitalized(word)) return false;
  if (isFirstWord) return false;

  // Known entity
  if (isNamedEntity(word)) return true;

  // Entity with suffix
  if (isNamedEntityWithSuffix(word)) return true;

  // If lowercase form IS in dictionary, it's just a common word capitalized
  // (handled by the caller)
  return true; // Unknown capitalized word → likely a name
}

/**
 * Check if a word starts with a capital letter.
 */
export function isCapitalized(word: string): boolean {
  return word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
}

/**
 * Check if a word is a technical term (should not be corrected).
 */
export function isTechnicalTerm(word: string): boolean {
  const normalized = normalizeApostrophe(word.toLowerCase());
  return TECHNICAL_TERMS.has(normalized);
}

/**
 * Get all protected words (named entities + technical terms).
 */
export function getProtectedWords(): Set<string> {
  return ENTITY_SET;
}
