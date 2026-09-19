import { analyzeWord, inDictionary, isValidForm } from './morphology';
import { normalizeApostrophe, tokenize, Token } from './text';
import { Correction } from './types';

export type RuleId =
  | 'particle_hyphen'
  | 'particle_joined'
  | 'possessive_ning'
  | 'reduplicative_hyphen'
  | 'bolmasa_person'
  | 'xalos_xolos'
  | 'suffix_li_lik'
  | 'lar_giz';

export interface RuleMatch extends Correction {
  ruleId: RuleId;
}

const HYPHEN_PARTICLES = ['yey', 'chi', 'ku', 'ey', 'yu', 'ya', 'da', 'u', 'a'] as const;
const JOINED_PARTICLES = new Set(['mi', 'oq', 'ov', 'yov', 'gina', 'kina', 'ki']);
const KNOWN_PAIRS = new Set(['bugun erta', 'erta kech', 'oq qora']);
const RELEASE_CUES = new Set(['qutuldi', 'qutulish', 'ozod', 'etdi', 'boʻldi']);
const ONLY_CUES = new Set(['faqat', 'shunchaki', 'bor', 'edi']);
const NUMBERS = new Set(['bir', 'ikki', 'uch', 'toʻrt', 'besh', 'olti', 'yetti', 'sakkiz', 'toʻqqiz', 'oʻn']);

function preserveInitial(original: string, replacement: string): string {
  return /^[A-Z]/.test(original) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
}

function match(ruleId: RuleId, original: string, suggestion: string, start: number, end: number, explanation: string, confidence: number): RuleMatch {
  return {
    ruleId, original, start, end, type: 'grammar',
    suggestions: [{ word: suggestion, confidence, reason: explanation }],
    explanation,
  };
}

function words(text: string): Token[] {
  return tokenize(text).filter(token => token.isWord);
}

function norm(token: Token): string {
  return normalizeApostrophe(token.text.toLowerCase());
}

function hasPlainGap(text: string, left: Token, right: Token): boolean {
  return /^\s+$/.test(text.slice(left.end, right.start));
}

function isVerbForm(value: string): boolean {
  const analysis = analyzeWord(value);
  return analysis?.pos === 'verb' || /(di|gan|man|miz|siz|san|yapmiz|yapman|aman|adi)$/.test(value);
}

function isFiniteVerbForm(value: string): boolean {
  return /(di|gan|man|miz|siz|san|yapmiz|yapman|aman|adi)$/.test(value);
}

function particleRules(text: string, tokens: Token[]): RuleMatch[] {
  const result: RuleMatch[] = [];
  for (const token of tokens) {
    const value = norm(token);
    for (const particle of HYPHEN_PARTICLES) {
      if (!value.endsWith(particle) || value.length <= particle.length + 2) continue;
      const base = value.slice(0, -particle.length);
      const strongParticle = ['ku', 'chi', 'ey', 'yey'].includes(particle);
      const baseIsKnown = isValidForm(base) || isVerbForm(base);
      const needsFiniteForm = ['a', 'ya', 'da'].includes(particle);
      if (!baseIsKnown || (!strongParticle && !isVerbForm(base)) || (needsFiniteForm && !isFiniteVerbForm(base))) continue;
      const suggestion = preserveInitial(token.text, `${base}-${particle}`);
      result.push(match('particle_hyphen', token.text, suggestion, token.start, token.end, `-${particle} yuklamasi defis bilan yoziladi.`, 0.94));
      break;
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const left = tokens[i];
    const right = tokens[i + 1];
    const particle = norm(right);
    if (!JOINED_PARTICLES.has(particle) || (!isValidForm(norm(left)) && !isVerbForm(norm(left)))) continue;
    const separator = text.slice(left.end, right.start);
    if (separator !== '-' && !/^\s+$/.test(separator)) continue;
    // A space before short particles is often syntactically valid. Only a
    // written hyphen is unambiguously contrary to the joined-particle rule.
    if (separator !== '-') continue;
    const original = text.slice(left.start, right.end);
    result.push(match('particle_joined', original, `${left.text}${right.text}`, left.start, right.end, `-${particle} yuklamasi oʻzi bogʻlangan soʻzga qoʻshib yoziladi.`, 0.97));
  }
  return result;
}

function possessiveNing(text: string, tokens: Token[]): RuleMatch[] {
  const result: RuleMatch[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const owner = tokens[i];
    const possessed = tokens[i + 1];
    if (!hasPlainGap(text, owner, possessed)) continue;
    const ownerValue = norm(owner);
    const possessedValue = norm(possessed);
    const ownerAnalysis = analyzeWord(ownerValue);
    const possessedAnalysis = analyzeWord(possessedValue);
    const kinshipOwner = /^(dadam|onam|akam|ukam|opam|singlim)ni$/.test(ownerValue);
    const possessiveNoun = possessedAnalysis?.pos === 'noun' && possessedAnalysis.posessive !== null
      || (possessedValue.endsWith('si') && inDictionary(possessedValue.slice(0, -2)))
      || (possessedValue.endsWith('i') && inDictionary(possessedValue.slice(0, -1)));
    if (!(ownerAnalysis?.case === 'acc' && ['noun', 'pron'].includes(ownerAnalysis.pos ?? '')) && !kinshipOwner) continue;
    if (!possessiveNoun) continue;
    const suggestion = owner.text.slice(0, -2) + (/[A-Z]/.test(owner.text.slice(-2)) ? 'NING' : 'ning');
    result.push(match('possessive_ning', owner.text, suggestion, owner.start, owner.end, 'Qaratuvchi ot yoki olmosh -ning qoʻshimchasini oladi.', 0.97));
  }
  return result;
}

function reduplicativeRules(text: string, tokens: Token[]): RuleMatch[] {
  const result: RuleMatch[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const left = tokens[i];
    const right = tokens[i + 1];
    if (!hasPlainGap(text, left, right)) continue;
    const a = norm(left), b = norm(right);
    const known = KNOWN_PAIRS.has(`${a} ${b}`);
    const repeated = (b === `${a}ida` || b === `${a}icha`) && isValidForm(a);
    if (!known && !repeated) continue;
    const original = text.slice(left.start, right.end);
    result.push(match('reduplicative_hyphen', original, `${left.text}-${right.text}`, left.start, right.end, 'Juft yoki takroriy soʻz qismlari defis bilan yoziladi.', 0.96));
  }
  return result;
}

function semanticRules(tokens: Token[]): RuleMatch[] {
  const result: RuleMatch[] = [];
  const values = tokens.map(norm);
  for (let i = 0; i < tokens.length; i++) {
    const value = values[i];
    const window = new Set(values.slice(Math.max(0, i - 3), i + 4));
    if (value === 'boʻlmasa' && window.has('men')) {
      result.push(match('bolmasa_person', tokens[i].text, preserveInitial(tokens[i].text, 'boʻlmasam'), tokens[i].start, tokens[i].end, 'Men olmoshi bilan birinchi shaxs shakli -m talab qilinadi.', 0.98));
    } else if (value === 'boʻlmasam' && (window.has('u') || window.has('ular'))) {
      result.push(match('bolmasa_person', tokens[i].text, preserveInitial(tokens[i].text, 'boʻlmasa'), tokens[i].start, tokens[i].end, 'U/ular bilan uchinchi shaxs shart shakli ishlatiladi.', 0.98));
    }
    if (value === 'xolos' && [...window].some(cue => RELEASE_CUES.has(cue))) {
      result.push(match('xalos_xolos', tokens[i].text, preserveInitial(tokens[i].text, 'xalos'), tokens[i].start, tokens[i].end, 'Qutulish yoki ozodlik maʼnosida “xalos” yoziladi.', 0.91));
    } else if (value === 'xalos' && [...window].some(cue => ONLY_CUES.has(cue)) && ![...window].some(cue => RELEASE_CUES.has(cue))) {
      result.push(match('xalos_xolos', tokens[i].text, preserveInitial(tokens[i].text, 'xolos'), tokens[i].start, tokens[i].end, '“Faqat, shunchaki” maʼnosida “xolos” yoziladi.', 0.91));
    }
  }
  return result;
}

function suffixRules(text: string, tokens: Token[]): RuleMatch[] {
  const result: RuleMatch[] = [];
  for (let i = 1; i < tokens.length - 1; i++) {
    const value = norm(tokens[i]);
    if (!value.endsWith('li') || !NUMBERS.has(norm(tokens[i - 1]))) continue;
    if (!hasPlainGap(text, tokens[i - 1], tokens[i]) || !hasPlainGap(text, tokens[i], tokens[i + 1])) continue;
    const stem = value.slice(0, -2);
    if (!['kun', 'oy', 'yil', 'soat', 'hafta'].includes(stem)) continue;
    const suggestion = preserveInitial(tokens[i].text, `${stem}lik`);
    result.push(match('suffix_li_lik', tokens[i].text, suggestion, tokens[i].start, tokens[i].end, 'Davr yoki muddatni bildiruvchi aniqlovchida -lik qoʻshimchasi ishlatiladi.', 0.93));
  }
  return result;
}

function larGizRules(tokens: Token[]): RuleMatch[] {
  const result: RuleMatch[] = [];
  for (const token of tokens) {
    const value = norm(token);
    if (!/(ingiz|ngiz)lar$/.test(value)) continue;
    const singularRespect = value.slice(0, -3);
    if (!isVerbForm(singularRespect)) continue;
    result.push(match('lar_giz', token.text, preserveInitial(token.text, singularRespect), token.start, token.end, '-ngiz dan keyingi -lar ortiqcha koʻplik koʻrsatkichidir.', 0.96));
  }
  return result;
}

/** Run conservative, context-sensitive rules before lexical spell checking. */
export function applyRuleEngine(text: string): RuleMatch[] {
  const tokens = words(text);
  return [
    ...particleRules(text, tokens),
    ...possessiveNing(text, tokens),
    ...reduplicativeRules(text, tokens),
    ...semanticRules(tokens),
    ...suffixRules(text, tokens),
    ...larGizRules(tokens),
  ].sort((a, b) => a.start - b.start || a.end - b.end);
}
