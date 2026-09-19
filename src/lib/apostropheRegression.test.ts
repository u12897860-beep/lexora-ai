import { checkText } from './checker';
import { normalizeApostrophe, tokenize } from './text';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const forms = ["o'qidi", 'o‘qidi', 'o’qidi', 'oʻqidi', 'O\'QIDI', 'O‘QIDI', 'O’QIDI', 'OʻQIDI'];
for (const form of forms) {
  assert(normalizeApostrophe(form) === `${form[0]}ʻ${form.slice(2)}`, `did not normalize ${form}`);
}

for (const form of ["g'oya", 'g‘oya', 'g’oya', 'gʻoya', 'G\'OYA', 'G‘OYA', 'G’OYA', 'GʻOYA']) {
  assert(normalizeApostrophe(form) === `${form[0]}ʻ${form.slice(2)}`, `did not normalize ${form}`);
}

const sentence = "U o'qidi, g‘oya va o’zbek soʻzlarini yozdi.";
const words = tokenize(sentence).filter(token => token.isWord);
assert(words.some(token => token.text === "o'qidi" && token.normalizedText === 'oʻqidi'), 'ASCII token was split');
assert(words.some(token => token.text === 'g‘oya' && token.normalizedText === 'gʻoya'), 'left quote variant was split');
assert(words.some(token => token.text === 'o’zbek' && token.normalizedText === 'oʻzbek'), 'right quote variant was split');
for (const token of words) {
  assert(sentence.slice(token.start, token.end) === token.text, `offsets changed for ${token.text}`);
}

const quoted = "'Salom', ‘dunyo’.";
assert(normalizeApostrophe(quoted) === quoted, 'ordinary quotation marks were normalized');
assert(tokenize(quoted).filter(token => token.isWord).map(token => token.text).join('|') === 'Salom|dunyo', 'quotes became word characters');

for (const valid of ['oʻqituvchi', 'gʻoya', 'Oʻzbekiston']) {
  const corrections = checkText(valid).corrections.filter(correction => correction.type !== 'punctuation');
  assert(corrections.length === 0, `canonical word was flagged: ${valid}`);
}

const correction = checkText("Men o'qidim.").corrections.find(item => item.original === "o'qidim");
assert(correction !== undefined, 'non-canonical apostrophe was not reported');
assert(correction.start === 4 && correction.end === 11, 'correction offsets do not address the original text');
assert(correction.suggestions[0]?.word === 'oʻqidim', 'correction did not use the canonical form');

console.log('Apostrophe regression tests passed.');
