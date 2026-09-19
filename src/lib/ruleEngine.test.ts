import { applyRuleEngine, RuleId } from './ruleEngine';

interface Case { kind: 'positive' | 'negative' | 'ambiguous'; text: string; ruleId?: RuleId; suggestion?: string }

const cases: Case[] = [
  { kind: 'positive', text: 'Men toʻlaymanku.', ruleId: 'particle_hyphen', suggestion: 'toʻlayman-ku' },
  { kind: 'positive', text: 'Biz qilyapmizda.', ruleId: 'particle_hyphen', suggestion: 'qilyapmiz-da' },
  { kind: 'negative', text: 'Men-chi, ertaga boraman.' },
  { kind: 'ambiguous', text: 'U shaharda yashaydi.' },
  { kind: 'positive', text: 'Savol bor-mi?', ruleId: 'particle_joined', suggestion: 'bormi' },
  { kind: 'positive', text: 'U keladi-yov.', ruleId: 'particle_joined', suggestion: 'keladiyov' },
  { kind: 'negative', text: 'Savol bormi?' },
  { kind: 'ambiguous', text: 'Bilmayman, u ham ki deydi.' },
  { kind: 'positive', text: 'Ukamni kitobi yangi.', ruleId: 'possessive_ning', suggestion: 'Ukamning' },
  { kind: 'positive', text: 'Dadamni mashinasi keldi.', ruleId: 'possessive_ning', suggestion: 'Dadamning' },
  { kind: 'positive', text: 'Onamni xonasi katta.', ruleId: 'possessive_ning', suggestion: 'Onamning' },
  { kind: 'positive', text: 'Kitobni muqovasi yirtilgan.', ruleId: 'possessive_ning', suggestion: 'Kitobning' },
  { kind: 'negative', text: 'Kartani oldi.' },
  { kind: 'negative', text: 'Men qarzni berdim.' },
  { kind: 'ambiguous', text: 'Manzilni soʻradi.' },
  { kind: 'ambiguous', text: 'Bolani yaxshi koʻrdi.' },
  { kind: 'positive', text: 'U joy joyida turibdi.', ruleId: 'reduplicative_hyphen', suggestion: 'joy-joyida' },
  { kind: 'positive', text: 'Bugun bugun erta masalasini koʻramiz.', ruleId: 'reduplicative_hyphen', suggestion: 'bugun-erta' },
  { kind: 'negative', text: 'Oq-qora tasvir.' },
  { kind: 'ambiguous', text: 'Kun kun bilan oʻtadi.' },
  { kind: 'positive', text: 'Men boʻlmasa, akam boradi.', ruleId: 'bolmasa_person', suggestion: 'boʻlmasam' },
  { kind: 'positive', text: 'U boʻlmasam, ish qoladi.', ruleId: 'bolmasa_person', suggestion: 'boʻlmasa' },
  { kind: 'negative', text: 'Men boʻlmasam, akam boradi.' },
  { kind: 'negative', text: 'Men aytdim: u boʻlmasa ham boshlaymiz.' },
  { kind: 'ambiguous', text: 'Kerak boʻlmasa ayting.' },
  { kind: 'positive', text: 'U qarzdan xolos boʻldi.', ruleId: 'xalos_xolos', suggestion: 'xalos' },
  { kind: 'positive', text: 'Bitta xalos bor.', ruleId: 'xalos_xolos', suggestion: 'xolos' },
  { kind: 'negative', text: 'U xavfdan xalos boʻldi.' },
  { kind: 'ambiguous', text: 'Gap shu, xolos.' },
  { kind: 'positive', text: 'Bu besh oyli bola.', ruleId: 'suffix_li_lik', suggestion: 'oylik' },
  { kind: 'positive', text: 'Ikki kunli safar boshlandi.', ruleId: 'suffix_li_lik', suggestion: 'kunlik' },
  { kind: 'negative', text: 'Bu tuzli ovqat.' },
  { kind: 'ambiguous', text: 'U suvli joyni tanladi.' },
  { kind: 'positive', text: 'Xush keldingizlar!', ruleId: 'lar_giz', suggestion: 'keldingiz' },
  { kind: 'positive', text: 'Siz yozdingizlar.', ruleId: 'lar_giz', suggestion: 'yozdingiz' },
  { kind: 'positive', text: 'Nega kech qoldingizlar?', ruleId: 'lar_giz', suggestion: 'qoldingiz' },
  { kind: 'negative', text: 'Xush keldingiz!' },
  { kind: 'ambiguous', text: 'Kech qoldilaringiz.' },
  { kind: 'positive', text: 'Men shaharda bordim.', ruleId: 'context_case_agreement', suggestion: 'shaharga' },
  { kind: 'ambiguous', text: 'U maktabga oʻqidi.' },
  { kind: 'positive', text: 'Men doʻstm.', ruleId: 'missing_buffer_vowel', suggestion: 'doʻstim' },
  { kind: 'positive', text: 'Biz keldk.', ruleId: 'missing_buffer_vowel', suggestion: 'keldik' },
  { kind: 'positive', text: 'Ular bordlar.', ruleId: 'missing_buffer_vowel', suggestion: 'bordilar' },
];

let positive = 0, negative = 0, ambiguous = 0;
for (const test of cases) {
  const matches = applyRuleEngine(test.text);
  if (test.kind === 'positive') {
    positive++;
    const found = matches.find(item => item.ruleId === test.ruleId && item.suggestions.some(s => s.word === test.suggestion));
    if (!found) throw new Error(`Expected ${test.ruleId} -> ${test.suggestion}: ${test.text}; got ${JSON.stringify(matches)}`);
    if (test.text.slice(found.start, found.end) !== found.original) throw new Error(`Invalid offsets: ${test.text}`);
  } else {
    if (test.kind === 'negative') negative++; else ambiguous++;
    if (matches.length) throw new Error(`Expected abstention: ${test.text}; got ${JSON.stringify(matches)}`);
  }
}

console.log(`RuleEngine regression tests passed: ${positive} positive, ${negative} negative, ${ambiguous} ambiguous.`);
