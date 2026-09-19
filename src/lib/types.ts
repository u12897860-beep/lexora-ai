export type Script = 'latin' | 'cyrillic';

export type PartOfSpeech = 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'num' | 'postp' | 'conj' | 'part' | 'interj';

export type ErrorType = 'spelling' | 'grammar' | 'punctuation' | 'style';

export interface MorphAnalysis {
  stem: string;
  suffixes: string[];
  pos: PartOfSpeech | null;
  number: 'singular' | 'plural' | null;
  case: 'nom' | 'acc' | 'dat' | 'gen' | 'abl' | 'loc' | null;
  posessive: string | null;
  tense: string | null;
  polarity: 'pos' | 'neg' | null;
}

export interface Suggestion {
  word: string;
  confidence: number;
  reason: string;
}

export interface Correction {
  /** Stable identifier when the correction was produced by RuleEngine. */
  ruleId?: string;
  original: string;
  start: number;
  end: number;
  type: ErrorType;
  suggestions: Suggestion[];
  explanation: string;
  isCorrect?: boolean;
}

export interface CheckResult {
  corrections: Correction[];
  correctedText: string;
  stats: {
    words: number;
    characters: number;
    errors: number;
    spelling: number;
    grammar: number;
    punctuation: number;
    style: number;
  };
  score: number;
}

export interface CustomDictionary {
  words: string[];
}

export type StyleMode = 'academic' | 'formal' | 'business' | 'simple' | 'casual';

export type UiLang = 'uz' | 'ru' | 'en';
