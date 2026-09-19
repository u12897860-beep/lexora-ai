import { analyzeWord, isValidForm } from './morphology';
import { analyzeCaseSuffix } from './suffixEngine';
import { checkText } from './checker';

let assertions = 0;
function assert(condition: unknown, message: string): asserts condition {
  assertions++;
  if (!condition) throw new Error(message);
}

function expectAnalysis(word: string, stem: string, suffixes: string[]): void {
  const analysis = analyzeWord(word);
  assert(analysis !== null, `${word}: analysis expected`);
  assert(analysis.stem === stem, `${word}: expected stem ${stem}, got ${analysis.stem}`);
  assert(JSON.stringify(analysis.suffixes) === JSON.stringify(suffixes),
    `${word}: expected ${suffixes.join('+')}, got ${analysis.suffixes.join('+')}`);
  assert(isValidForm(word), `${word}: expected a valid form`);
}

// Individual productive slots.
expectAnalysis('kitoblar', 'kitob', ['lar']);
expectAnalysis('kitobim', 'kitob', ['im']);
expectAnalysis('kitobning', 'kitob', ['ning']);
expectAnalysis('maktabga', 'maktab', ['ga']);
expectAnalysis('doʻstka', 'doʻst', ['ka']);
expectAnalysis('doʻsttan', 'doʻst', ['tan']);

// Ordered combinations: plural + possessive, possessive + case, and all three.
expectAnalysis('kitoblarimiz', 'kitob', ['lar', 'imiz']);
expectAnalysis('kitobimni', 'kitob', ['im', 'ni']);
expectAnalysis('kitoblaringizdan', 'kitob', ['lar', 'ingiz', 'dan']);
expectAnalysis('talabalaringizning', 'talaba', ['lar', 'ingiz', 'ning']);

// Unknown dictionary roots require at least two unambiguous ordered slots.
expectAnalysis('startaplarimizdan', 'startap', ['lar', 'imiz', 'dan']);
expectAnalysis('podkastlaringizga', 'podkast', ['lar', 'ingiz', 'ga']);
expectAnalysis('vebinarimda', 'vebinar', ['im', 'da']);
assert(!isValidForm('startaplar'), 'one suffix must not whitelist an unknown root');
assert(!isValidForm('talabaim'), 'an impossible possessive allomorph must be rejected');

// Phonetic variants are validated against the whole case base.
assert(!isValidForm('kitoblarimta'), 'voiceless locative after a voiced possessive base must fail');
const layeredError = analyzeCaseSuffix('kitoblarimta');
assert(layeredError?.correctedWord === 'kitoblarimda', 'layered case correction must retain inner suffixes');
assert(!isValidForm('vebinarimta'), 'unknown-root layered form must still validate case phonetics');

// Spell pipeline integration: valid productive forms must not become false positives.
for (const word of ['kitoblaringizdan', 'startaplarimizdan', 'podkastlaringizga', 'vebinarimda']) {
  const lexical = checkText(word).corrections.filter(correction => correction.type !== 'punctuation');
  assert(lexical.length === 0, `${word}: checker produced a false positive`);
}

// Layered generated forms must not displace a simple plural correction just
// because a later word happens to provide locative context.
const pluralTypo = checkText('Kitoblr stol ustida.').corrections.find(correction => correction.original === 'Kitoblr');
assert(pluralTypo?.suggestions.some(suggestion => suggestion.word === 'Kitoblar'),
  'simple plural correction must remain in the top suggestions');

console.log(`Morphology Engine v2 regression tests passed (${assertions} assertions).`);
