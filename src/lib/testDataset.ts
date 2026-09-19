// Benchmark test dataset for Lexora AI.
// 300+ structured test cases across all error categories.
//
// Each case specifies:
//   - input: the text to check
//   - category: the error category being tested
//   - expectError: true if at least one non-punctuation correction is expected
//   - expectedWord: if expectError, the word that should be flagged
//   - expectedSuggestion: if expectError, the correct word that should appear
//     in the suggestions (null = any suggestion is fine / just detect the error)
//   - shouldNotFlag: array of words that must NOT be flagged (for false-positive checks)
//
// Categories:
//   correct_word        — valid word, no error expected
//   correct_sentence    — valid sentence, no error expected
//   missing_letter      — a letter is missing
//   extra_letter        — an extra letter is present
//   wrong_letter        — a letter is replaced incorrectly
//   transposition       — two adjacent letters are swapped
//   keyboard_typo       — a key adjacent to the intended key was pressed
//   morphology          — morphological form error
//   plural              — plural suffix error
//   possessive          — possessive suffix error
//   case_suffix         — incorrect case suffix (phonetic violation)
//   verb_suffix         — verb tense/person suffix error
//   context_case        — context determines the correct case
//   apostrophe_o        — oʻ apostrophe issues
//   apostrophe_g        — gʻ apostrophe issues
//   apostrophe_unicode  — non-standard Unicode apostrophe variants
//   cyrillic            — Cyrillic script handling
//   person_name         — person names should not be flagged
//   city_country        — cities/countries should not be flagged
//   organization        — organizations/brands should not be flagged
//   tech_term           — technical terms should not be flagged
//   multi_error         — sentence with multiple errors

export interface TestCase {
  id: number;
  category: string;
  input: string;
  expectError: boolean;
  expectedWord?: string;
  expectedSuggestion?: string | null;
  shouldNotFlag?: string[];
}

export const TEST_DATASET: TestCase[] = [
  // ===================================================================
  // CORRECT WORDS (true negatives — must NOT be flagged)
  // ===================================================================
  { id: 1, category: 'correct_word', input: 'salom', expectError: false },
  { id: 2, category: 'correct_word', input: 'men', expectError: false },
  { id: 3, category: 'correct_word', input: 'bugun', expectError: false },
  { id: 4, category: 'correct_word', input: 'maktab', expectError: false },
  { id: 5, category: 'correct_word', input: 'kitob', expectError: false },
  { id: 6, category: 'correct_word', input: 'yaxshi', expectError: false },
  { id: 7, category: 'correct_word', input: 'katta', expectError: false },
  { id: 8, category: 'correct_word', input: 'bordim', expectError: false },
  { id: 9, category: 'correct_word', input: 'keldim', expectError: false },
  { id: 10, category: 'correct_word', input: 'oʻqituvchi', expectError: false },
  { id: 11, category: 'correct_word', input: 'shahar', expectError: false },
  { id: 12, category: 'correct_word', input: 'va', expectError: false },
  { id: 13, category: 'correct_word', input: 'lekin', expectError: false },
  { id: 14, category: 'correct_word', input: 'chunki', expectError: false },
  { id: 15, category: 'correct_word', input: 'toshkent', expectError: false },
  { id: 16, category: 'correct_word', input: 'oʻzbekiston', expectError: false },
  { id: 17, category: 'correct_word', input: 'bir', expectError: false },
  { id: 18, category: 'correct_word', input: 'yomon', expectError: false },
  { id: 19, category: 'correct_word', input: 'hayot', expectError: false },
  { id: 20, category: 'correct_word', input: 'ish', expectError: false },
  { id: 21, category: 'correct_word', input: 'bilaman', expectError: false },
  { id: 22, category: 'correct_word', input: 'qilgan', expectError: false },
  { id: 23, category: 'correct_word', input: 'boʻlgan', expectError: false },
  { id: 24, category: 'correct_word', input: 'olgan', expectError: false },
  { id: 25, category: 'correct_word', input: 'koʻrgan', expectError: false },
  { id: 26, category: 'correct_word', input: 'yozgan', expectError: false },
  { id: 27, category: 'correct_word', input: 'oʻqigan', expectError: false },
  { id: 28, category: 'correct_word', input: 'ishlayman', expectError: false },
  { id: 29, category: 'correct_word', input: 'yashayman', expectError: false },
  { id: 30, category: 'correct_word', input: 'boraman', expectError: false },

  // ===================================================================
  // CORRECT SENTENCES (true negatives)
  // ===================================================================
  { id: 31, category: 'correct_sentence', input: 'Men bugun maktabga bordim.', expectError: false },
  { id: 32, category: 'correct_sentence', input: 'U Toshkentda yashaydi.', expectError: false },
  { id: 33, category: 'correct_sentence', input: 'Biz kitob oʻqidik.', expectError: false },
  { id: 34, category: 'correct_sentence', input: 'Sen kelding.', expectError: false },
  { id: 35, category: 'correct_sentence', input: 'Ular ishladilar.', expectError: false },
  { id: 36, category: 'correct_sentence', input: 'Men rahmat deyman.', expectError: false },
  { id: 37, category: 'correct_sentence', input: 'Bu juda yaxshi.', expectError: false },
  { id: 38, category: 'correct_sentence', input: 'Biz Toshkentga keldik.', expectError: false },
  { id: 39, category: 'correct_sentence', input: 'U maktabda oʻqidi.', expectError: false },
  { id: 40, category: 'correct_sentence', input: 'Men ishlayman.', expectError: false },
  { id: 41, category: 'correct_sentence', input: 'Sen nima qilding?', expectError: false },
  { id: 42, category: 'correct_sentence', input: 'U kelgan.', expectError: false },
  { id: 43, category: 'correct_sentence', input: 'Biz bordik.', expectError: false },
  { id: 44, category: 'correct_sentence', input: 'Kitob stol ustida.', expectError: false },
  { id: 45, category: 'correct_sentence', input: 'Bola non yedi.', expectError: false },

  // ===================================================================
  // MISSING LETTER
  // ===================================================================
  { id: 46, category: 'missing_letter', input: 'Men bugun maktabga bordm.', expectError: true, expectedWord: 'bordm', expectedSuggestion: 'bordim' },
  { id: 47, category: 'missing_letter', input: 'U keldm.', expectError: true, expectedWord: 'keldm', expectedSuggestion: 'keldim' },
  { id: 48, category: 'missing_letter', input: 'Men kitb oʻqiman.', expectError: true, expectedWord: 'kitb', expectedSuggestion: 'kitob' },
  { id: 49, category: 'missing_letter', input: 'U mahabga bordi.', expectError: true, expectedWord: 'mahab', expectedSuggestion: 'maktab' },
  { id: 50, category: 'missing_letter', input: 'Men olm yedim.', expectError: true, expectedWord: 'olm', expectedSuggestion: 'olma' },
  { id: 51, category: 'missing_letter', input: 'Sen keldg.', expectError: true, expectedWord: 'keldg', expectedSuggestion: 'kelding' },
  { id: 52, category: 'missing_letter', input: 'U yerda shahar bor.', expectError: false, shouldNotFlag: ['shahar'] },
  { id: 53, category: 'missing_letter', input: 'Men sevaman.', expectError: true, expectedWord: 'sevaman', expectedSuggestion: null },
  { id: 54, category: 'missing_letter', input: 'Biz ishlymiz.', expectError: true, expectedWord: 'ishlymiz', expectedSuggestion: 'ishlaymiz' },
  { id: 55, category: 'missing_letter', input: 'U oʻqituvhi.', expectError: true, expectedWord: 'oʻqituvhi', expectedSuggestion: 'oʻqituvchi' },
  { id: 56, category: 'missing_letter', input: 'Men vaatan sevaman.', expectError: true, expectedWord: 'vaatan', expectedSuggestion: 'vatan' },
  { id: 57, category: 'missing_letter', input: 'Bu juda yaxi.', expectError: true, expectedWord: 'yaxi', expectedSuggestion: 'yaxshi' },
  { id: 58, category: 'missing_letter', input: 'U kompyutr oldi.', expectError: true, expectedWord: 'kompyutr', expectedSuggestion: 'kompyuter' },
  { id: 59, category: 'missing_letter', input: 'Men doʻstm.', expectError: true, expectedWord: 'doʻstm', expectedSuggestion: 'doʻstim' },
  { id: 60, category: 'missing_letter', input: 'Biz tushunamz.', expectError: true, expectedWord: 'tushunamz', expectedSuggestion: null },

  // ===================================================================
  // EXTRA LETTER
  // ===================================================================
  { id: 61, category: 'extra_letter', input: 'Men bugunni bordim.', expectError: true, expectedWord: 'bugunni', expectedSuggestion: null },
  { id: 62, category: 'extra_letter', input: 'U kellim.', expectError: true, expectedWord: 'kellim', expectedSuggestion: 'keldim' },
  { id: 63, category: 'extra_letter', input: 'Men kittob oʻqiman.', expectError: true, expectedWord: 'kittob', expectedSuggestion: 'kitob' },
  { id: 64, category: 'extra_letter', input: 'Bu makttab.', expectError: true, expectedWord: 'makttab', expectedSuggestion: 'maktab' },
  { id: 65, category: 'extra_letter', input: 'U bolaa.', expectError: true, expectedWord: 'bolaa', expectedSuggestion: 'bola' },
  { id: 66, category: 'extra_letter', input: 'Men sehrga bordim.', expectError: true, expectedWord: 'sehrga', expectedSuggestion: null },
  { id: 67, category: 'extra_letter', input: 'U orqali keldi.', expectError: false, shouldNotFlag: ['orqali'] },
  { id: 68, category: 'extra_letter', input: 'Men yaxshhi.', expectError: true, expectedWord: 'yaxshhi', expectedSuggestion: 'yaxshi' },
  { id: 69, category: 'extra_letter', input: 'Bu kattaa.', expectError: true, expectedWord: 'kattaa', expectedSuggestion: 'katta' },
  { id: 70, category: 'extra_letter', input: 'Men davlatt.', expectError: true, expectedWord: 'davlatt', expectedSuggestion: 'davlat' },

  // ===================================================================
  // WRONG LETTER (substitution)
  // ===================================================================
  { id: 71, category: 'wrong_letter', input: 'Men bugun maktapga bordim.', expectError: true, expectedWord: 'maktap', expectedSuggestion: 'maktab' },
  { id: 72, category: 'wrong_letter', input: 'U keltim.', expectError: true, expectedWord: 'keltim', expectedSuggestion: 'keldim' },
  { id: 73, category: 'wrong_letter', input: 'Men kitap oʻqiman.', expectError: true, expectedWord: 'kitap', expectedSuggestion: 'kitob' },
  { id: 74, category: 'wrong_letter', input: 'Bu yaxsi.', expectError: true, expectedWord: 'yaxsi', expectedSuggestion: 'yaxshi' },
  { id: 75, category: 'wrong_letter', input: 'U shaharfa bor.', expectError: true, expectedWord: 'shaharfa', expectedSuggestion: null },
  { id: 76, category: 'wrong_letter', input: 'Men vatanm.', expectError: true, expectedWord: 'vatanm', expectedSuggestion: null },
  { id: 77, category: 'wrong_letter', input: 'U oʻqituvsi.', expectError: true, expectedWord: 'oʻqituvsi', expectedSuggestion: 'oʻqituvchi' },
  { id: 78, category: 'wrong_letter', input: 'Bu chroyli.', expectError: true, expectedWord: 'chroyli', expectedSuggestion: 'chiroyli' },
  { id: 79, category: 'wrong_letter', input: 'Men sevaman.', expectError: true, expectedWord: 'sevaman', expectedSuggestion: null },
  { id: 80, category: 'wrong_letter', input: 'U mavina oldi.', expectError: true, expectedWord: 'mavina', expectedSuggestion: 'mashina' },
  { id: 81, category: 'wrong_letter', input: 'Bu yahshi.', expectError: true, expectedWord: 'yahshi', expectedSuggestion: 'yaxshi' },
  { id: 82, category: 'wrong_letter', input: 'Men olmaa yedim.', expectError: true, expectedWord: 'olmaa', expectedSuggestion: 'olma' },
  { id: 83, category: 'wrong_letter', input: 'U keldi va gapirdi.', expectError: true, expectedWord: 'gapirdi', expectedSuggestion: null },
  { id: 84, category: 'wrong_letter', input: 'Men hatosiz.', expectError: true, expectedWord: 'hatosiz', expectedSuggestion: null },
  { id: 85, category: 'wrong_letter', input: 'Bu muhum.', expectError: true, expectedWord: 'muhum', expectedSuggestion: 'muhim' },

  // ===================================================================
  // TRANSPOSITION (swapped adjacent letters)
  // ===================================================================
  { id: 86, category: 'transposition', input: 'Men bugun matkabga bordim.', expectError: true, expectedWord: 'matkab', expectedSuggestion: 'maktab' },
  { id: 87, category: 'transposition', input: 'U kekdim.', expectError: true, expectedWord: 'kekdim', expectedSuggestion: 'keldim' },
  { id: 88, category: 'transposition', input: 'Men kitbo oʻqiman.', expectError: true, expectedWord: 'kitbo', expectedSuggestion: 'kitob' },
  { id: 89, category: 'transposition', input: 'Bu yaxhsi.', expectError: true, expectedWord: 'yaxhsi', expectedSuggestion: 'yaxshi' },
  { id: 90, category: 'transposition', input: 'Men olmaa yedim.', expectError: true, expectedWord: 'olmaa', expectedSuggestion: 'olma' },
  { id: 91, category: 'transposition', input: 'U boridm.', expectError: true, expectedWord: 'boridm', expectedSuggestion: 'bordim' },
  { id: 92, category: 'transposition', input: 'Men sevgiam.', expectError: true, expectedWord: 'sevgiam', expectedSuggestion: null },
  { id: 93, category: 'transposition', input: 'Bu mukmammal.', expectError: true, expectedWord: 'mukmammal', expectedSuggestion: 'mukammal' },
  { id: 94, category: 'transposition', input: 'U takirib.', expectError: true, expectedWord: 'takirib', expectedSuggestion: null },
  { id: 95, category: 'transposition', input: 'Men albm.', expectError: true, expectedWord: 'albm', expectedSuggestion: null },

  // ===================================================================
  // KEYBOARD TYPO (adjacent key pressed)
  // ===================================================================
  { id: 96, category: 'keyboard_typo', input: 'Men bugun makrabga bordim.', expectError: true, expectedWord: 'makrab', expectedSuggestion: 'maktab' },
  { id: 97, category: 'keyboard_typo', input: 'U kekdim.', expectError: true, expectedWord: 'kekdim', expectedSuggestion: 'keldim' },
  { id: 98, category: 'keyboard_typo', input: 'Men kitob oʻqinan.', expectError: true, expectedWord: 'oʻqinan', expectedSuggestion: 'oʻqiman' },
  { id: 99, category: 'keyboard_typo', input: 'Bu yaxahi.', expectError: true, expectedWord: 'yaxahi', expectedSuggestion: 'yaxshi' },
  { id: 100, category: 'keyboard_typo', input: 'Men vstam.', expectError: true, expectedWord: 'vstam', expectedSuggestion: null },
  { id: 101, category: 'keyboard_typo', input: 'U borfim.', expectError: true, expectedWord: 'borfim', expectedSuggestion: 'bordim' },
  { id: 102, category: 'keyboard_typo', input: 'Men xitab oʻqiman.', expectError: true, expectedWord: 'xitab', expectedSuggestion: 'kitob' },
  { id: 103, category: 'keyboard_typo', input: 'Bu jafa.', expectError: true, expectedWord: 'jafa', expectedSuggestion: 'hava' },
  { id: 104, category: 'keyboard_typo', input: 'Men sehv qildim.', expectError: false, shouldNotFlag: ['sehv'] },
  { id: 105, category: 'keyboard_typo', input: 'U irhlaydi.', expectError: true, expectedWord: 'irhlaydi', expectedSuggestion: 'ishlaydi' },

  // ===================================================================
  // MORPHOLOGY (invalid morphological form)
  // ===================================================================
  { id: 106, category: 'morphology', input: 'Men bordm.', expectError: true, expectedWord: 'bordm', expectedSuggestion: 'bordim' },
  { id: 107, category: 'morphology', input: 'U keldingiz.', expectError: false, shouldNotFlag: ['keldingiz'] },
  { id: 108, category: 'morphology', input: 'Biz bordk.', expectError: true, expectedWord: 'bordk', expectedSuggestion: 'bordik' },
  { id: 109, category: 'morphology', input: 'Ular keldlar.', expectError: true, expectedWord: 'keldlar', expectedSuggestion: 'keldilar' },
  { id: 110, category: 'morphology', input: 'Men qildm.', expectError: true, expectedWord: 'qildm', expectedSuggestion: 'qildim' },
  { id: 111, category: 'morphology', input: 'U boldi.', expectError: false, shouldNotFlag: ['boldi'] },
  { id: 112, category: 'morphology', input: 'Men oldm.', expectError: true, expectedWord: 'oldm', expectedSuggestion: 'oldim' },
  { id: 113, category: 'morphology', input: 'U koʻrdi.', expectError: false, shouldNotFlag: ['koʻrdi'] },
  { id: 114, category: 'morphology', input: 'Men bildm.', expectError: true, expectedWord: 'bildm', expectedSuggestion: 'bildim' },
  { id: 115, category: 'morphology', input: 'U yozdi.', expectError: false, shouldNotFlag: ['yozdi'] },

  // ===================================================================
  // PLURAL
  // ===================================================================
  { id: 116, category: 'plural', input: 'Bolalar maktabda.', expectError: false, shouldNotFlag: ['bolalar'] },
  { id: 117, category: 'plural', input: 'Kitoblar stol ustida.', expectError: false, shouldNotFlag: ['kitoblar'] },
  { id: 118, category: 'plural', input: 'Oʻquvchilar keldi.', expectError: false, shouldNotFlag: ['oʻquvchilar'] },
  { id: 119, category: 'plural', input: 'Ular doʻstlar.', expectError: false, shouldNotFlag: ['doʻstlar'] },
  { id: 120, category: 'plural', input: 'Mehmonlar keldi.', expectError: false, shouldNotFlag: ['mehmonlar'] },
  { id: 121, category: 'plural', input: 'Bolalr maktabda.', expectError: true, expectedWord: 'bolalr', expectedSuggestion: 'bolalar' },
  { id: 122, category: 'plural', input: 'Kitoblr stol ustida.', expectError: true, expectedWord: 'kitoblr', expectedSuggestion: 'kitoblar' },
  { id: 123, category: 'plural', input: 'Talabar keldi.', expectError: true, expectedWord: 'talabar', expectedSuggestion: 'talabalar' },
  { id: 124, category: 'plural', input: 'Mehmonlr keldi.', expectError: true, expectedWord: 'mehmonlr', expectedSuggestion: 'mehmonlar' },
  { id: 125, category: 'plural', input: 'Oʻquvchilar oʻqidi.', expectError: false, shouldNotFlag: ['oʻquvchilar'] },

  // ===================================================================
  // POSSESSIVE
  // ===================================================================
  { id: 126, category: 'possessive', input: 'Meni kitobim.', expectError: false, shouldNotFlag: ['kitobim'] },
  { id: 127, category: 'possessive', input: 'Senig kitobing.', expectError: false, shouldNotFlag: ['kitobing'] },
  { id: 128, category: 'possessive', input: 'Ung kitobi.', expectError: false, shouldNotFlag: ['kitobi'] },
  { id: 129, category: 'possessive', input: 'Biznig kitobimiz.', expectError: false, shouldNotFlag: ['kitobimiz'] },
  { id: 130, category: 'possessive', input: 'Men kitobm.', expectError: true, expectedWord: 'kitobm', expectedSuggestion: 'kitobim' },
  { id: 131, category: 'possessive', input: 'Sen kitobg.', expectError: true, expectedWord: 'kitobg', expectedSuggestion: 'kitobing' },
  { id: 132, category: 'possessive', input: 'U kitobi bor.', expectError: false, shouldNotFlag: ['kitobi'] },
  { id: 133, category: 'possessive', input: 'Biz kitobmiz.', expectError: true, expectedWord: 'kitobmiz', expectedSuggestion: 'kitobimiz' },
  { id: 134, category: 'possessive', input: 'Siz kitobngiz.', expectError: true, expectedWord: 'kitobngiz', expectedSuggestion: 'kitobingiz' },
  { id: 135, category: 'possessive', input: 'Ular kitoblari bor.', expectError: false, shouldNotFlag: ['kitoblari'] },

  // ===================================================================
  // CASE SUFFIX (phonetic violation: -ka/-ta/-tan after voiced)
  // ===================================================================
  { id: 136, category: 'case_suffix', input: 'Men maktabka bordim.', expectError: true, expectedWord: 'maktabka', expectedSuggestion: 'maktabga' },
  { id: 137, category: 'case_suffix', input: 'U Toshkentta yashaydi.', expectError: true, expectedWord: 'Toshkentta', expectedSuggestion: 'Toshkentda' },
  { id: 138, category: 'case_suffix', input: 'Men shahartan keldim.', expectError: true, expectedWord: 'shahartan', expectedSuggestion: 'shahardan' },
  { id: 139, category: 'case_suffix', input: 'U maktabda oʻqidi.', expectError: false, shouldNotFlag: ['maktabda'] },
  { id: 140, category: 'case_suffix', input: 'Men Toshkentga bordim.', expectError: false, shouldNotFlag: ['Toshkentga'] },
  { id: 141, category: 'case_suffix', input: 'Kitob stol ustida.', expectError: false, shouldNotFlag: ['ustida'] },
  { id: 142, category: 'case_suffix', input: 'U maktabga bordi.', expectError: false, shouldNotFlag: ['maktabga'] },
  { id: 143, category: 'case_suffix', input: 'Men shahardan keldim.', expectError: false, shouldNotFlag: ['shahardan'] },
  { id: 144, category: 'case_suffix', input: 'U uyda yashaydi.', expectError: false, shouldNotFlag: ['uyda'] },
  { id: 145, category: 'case_suffix', input: 'Men bozorgan bordim.', expectError: true, expectedWord: 'bozorgan', expectedSuggestion: null },
  { id: 146, category: 'case_suffix', input: 'U bozorta keldi.', expectError: true, expectedWord: 'bozorta', expectedSuggestion: 'bozorda' },
  { id: 147, category: 'case_suffix', input: 'Men kitobn oldim.', expectError: false, shouldNotFlag: ['kitobn'] },
  { id: 148, category: 'case_suffix', input: 'U joyda turibdi.', expectError: false, shouldNotFlag: ['joyda'] },
  { id: 149, category: 'case_suffix', input: 'Men toshkentga bordim.', expectError: false, shouldNotFlag: ['toshkentga'] },
  { id: 150, category: 'case_suffix', input: 'U koʻchata chiqdi.', expectError: true, expectedWord: 'koʻchata', expectedSuggestion: 'koʻchada' },

  // ===================================================================
  // VERB SUFFIX (tense/person agreement)
  // ===================================================================
  { id: 151, category: 'verb_suffix', input: 'Men bordim.', expectError: false, shouldNotFlag: ['bordim'] },
  { id: 152, category: 'verb_suffix', input: 'Sen kelding.', expectError: false, shouldNotFlag: ['kelding'] },
  { id: 153, category: 'verb_suffix', input: 'U keldi.', expectError: false, shouldNotFlag: ['keldi'] },
  { id: 154, category: 'verb_suffix', input: 'Biz bordik.', expectError: false, shouldNotFlag: ['bordik'] },
  { id: 155, category: 'verb_suffix', input: 'Siz keldingiz.', expectError: false, shouldNotFlag: ['keldingiz'] },
  { id: 156, category: 'verb_suffix', input: 'Ular keldilar.', expectError: false, shouldNotFlag: ['keldilar'] },
  { id: 157, category: 'verb_suffix', input: 'Men boraman.', expectError: false, shouldNotFlag: ['boraman'] },
  { id: 158, category: 'verb_suffix', input: 'U keladi.', expectError: false, shouldNotFlag: ['keladi'] },
  { id: 159, category: 'verb_suffix', input: 'Men qilaman.', expectError: false, shouldNotFlag: ['qilaman'] },
  { id: 160, category: 'verb_suffix', input: 'U ishlaydi.', expectError: false, shouldNotFlag: ['ishlaydi'] },
  { id: 161, category: 'verb_suffix', input: 'Men yozaman.', expectError: false, shouldNotFlag: ['yozaman'] },
  { id: 162, category: 'verb_suffix', input: 'U oʻqiydi.', expectError: false, shouldNotFlag: ['oʻqiydi'] },
  { id: 163, category: 'verb_suffix', input: 'Men koʻraman.', expectError: false, shouldNotFlag: ['koʻraman'] },
  { id: 164, category: 'verb_suffix', input: 'U biladi.', expectError: false, shouldNotFlag: ['biladi'] },
  { id: 165, category: 'verb_suffix', input: 'Men bordm.', expectError: true, expectedWord: 'bordm', expectedSuggestion: 'bordim' },

  // ===================================================================
  // CONTEXT-DEPENDENT CASE
  // ===================================================================
  { id: 166, category: 'context_case', input: 'Men Toshkentda bordim.', expectError: true, expectedWord: 'Toshkentda', expectedSuggestion: 'Toshkentga' },
  { id: 167, category: 'context_case', input: 'U Toshkentga yashaydi.', expectError: true, expectedWord: 'Toshkentga', expectedSuggestion: 'Toshkentda' },
  { id: 168, category: 'context_case', input: 'Men maktabda bordim.', expectError: true, expectedWord: 'maktabda', expectedSuggestion: 'maktabga' },
  { id: 169, category: 'context_case', input: 'U maktabga oʻqidi.', expectError: false, shouldNotFlag: ['maktabga'] },
  { id: 170, category: 'context_case', input: 'Men shaharga keldim.', expectError: false, shouldNotFlag: ['shaharga'] },
  { id: 171, category: 'context_case', input: 'U shaharda yashaydi.', expectError: false, shouldNotFlag: ['shaharda'] },
  { id: 172, category: 'context_case', input: 'Men uyda bordim.', expectError: true, expectedWord: 'uyda', expectedSuggestion: 'uyga' },
  { id: 173, category: 'context_case', input: 'U maktabda oʻqidi.', expectError: false, shouldNotFlag: ['maktabda'] },
  { id: 174, category: 'context_case', input: 'Men bozordan keldim.', expectError: false, shouldNotFlag: ['bozordan'] },
  { id: 175, category: 'context_case', input: 'U bozorga bordi.', expectError: false, shouldNotFlag: ['bozorga'] },

  // ===================================================================
  // APOSTROPHE oʻ
  // ===================================================================
  { id: 176, category: 'apostrophe_o', input: "Men o'zbekman.", expectError: true, expectedWord: "o'zbek", expectedSuggestion: 'oʻzbek' },
  { id: 177, category: 'apostrophe_o', input: 'U oʻqituvchi.', expectError: false, shouldNotFlag: ['oʻqituvchi'] },
  { id: 178, category: 'apostrophe_o', input: 'Men oʻzim.', expectError: false, shouldNotFlag: ['oʻzim'] },
  { id: 179, category: 'apostrophe_o', input: "Bu o'quvchi.", expectError: true, expectedWord: "o'quvchi", expectedSuggestion: 'oʻquvchi' },
  { id: 180, category: 'apostrophe_o', input: "U o'qidi.", expectError: true, expectedWord: "o'qidi", expectedSuggestion: 'oʻqidi' },
  { id: 181, category: 'apostrophe_o', input: 'Men oʻzbek.', expectError: false, shouldNotFlag: ['oʻzbek'] },
  { id: 182, category: 'apostrophe_o', input: 'U oʻrmonda.', expectError: false, shouldNotFlag: ['oʻrmonda'] },
  { id: 183, category: 'apostrophe_o', input: 'Men oʻzgarish.', expectError: false, shouldNotFlag: ['oʻzgarish'] },
  { id: 184, category: 'apostrophe_o', input: "U o'zgartir.", expectError: true, expectedWord: "o'zgartir", expectedSuggestion: 'oʻzgartir' },
  { id: 185, category: 'apostrophe_o', input: 'Bu oʻyin.', expectError: false, shouldNotFlag: ['oʻyin'] },

  // ===================================================================
  // APOSTROPHE gʻ
  // ===================================================================
  { id: 186, category: 'apostrophe_g', input: "Bu g'oya.", expectError: true, expectedWord: "g'oya", expectedSuggestion: 'gʻoya' },
  { id: 187, category: 'apostrophe_g', input: 'U gʻaliz.', expectError: false, shouldNotFlag: ['gʻaliz'] },
  { id: 188, category: 'apostrophe_g', input: 'Men gʻam.', expectError: false, shouldNotFlag: ['gʻam'] },
  { id: 189, category: 'apostrophe_g', input: "Bu g'arbiy.", expectError: true, expectedWord: "g'arbiy", expectedSuggestion: 'gʻarbiy' },
  { id: 190, category: 'apostrophe_g', input: "U g'oyat.", expectError: true, expectedWord: "g'oyat", expectedSuggestion: 'gʻoyat' },
  { id: 191, category: 'apostrophe_g', input: 'Men gʻamdim.', expectError: false, shouldNotFlag: ['gʻamdim'] },
  { id: 192, category: 'apostrophe_g', input: 'Bu yogʻmoy.', expectError: false, shouldNotFlag: ['yogʻmoy'] },
  { id: 193, category: 'apostrophe_g', input: "U bug'doy.", expectError: true, expectedWord: "bug'doy", expectedSuggestion: 'bugʻdoy' },
  { id: 194, category: 'apostrophe_g', input: 'Men gʻazab.', expectError: false, shouldNotFlag: ['gʻazab'] },
  { id: 195, category: 'apostrophe_g', input: "Bu g'arb.", expectError: true, expectedWord: "g'arb", expectedSuggestion: 'gʻarb' },

  // ===================================================================
  // APOSTROPHE UNICODE VARIANTS
  // ===================================================================
  { id: 196, category: 'apostrophe_unicode', input: 'U oʼqituvchi.', expectError: true, expectedWord: 'oʼqituvchi', expectedSuggestion: 'oʻqituvchi' },
  { id: 197, category: 'apostrophe_unicode', input: 'Men o’zbek.', expectError: true, expectedWord: 'o’zbek', expectedSuggestion: 'oʻzbek' },
  { id: 198, category: 'apostrophe_unicode', input: 'Bu o‘quvchi.', expectError: true, expectedWord: 'o‘quvchi', expectedSuggestion: 'oʻquvchi' },
  { id: 199, category: 'apostrophe_unicode', input: 'U gʼoya.', expectError: true, expectedWord: 'gʼoya', expectedSuggestion: 'gʻoya' },
  { id: 200, category: 'apostrophe_unicode', input: 'Men g’oya.', expectError: true, expectedWord: 'g’oya', expectedSuggestion: 'gʻoya' },
  { id: 201, category: 'apostrophe_unicode', input: 'Bu g‘arb.', expectError: true, expectedWord: 'g‘arb', expectedSuggestion: 'gʻarb' },
  { id: 202, category: 'apostrophe_unicode', input: 'U o`qidi.', expectError: true, expectedWord: 'o`qidi', expectedSuggestion: 'oʻqidi' },
  { id: 203, category: 'apostrophe_unicode', input: 'Men g`am.', expectError: true, expectedWord: 'g`am', expectedSuggestion: 'gʻam' },
  { id: 204, category: 'apostrophe_unicode', input: 'Bu oʻzbek.', expectError: false, shouldNotFlag: ['oʻzbek'] },
  { id: 205, category: 'apostrophe_unicode', input: 'U gʻoya.', expectError: false, shouldNotFlag: ['gʻoya'] },

  // ===================================================================
  // CYRILLIC
  // ===================================================================
  { id: 206, category: 'cyrillic', input: 'Мен бугун мактабга бордим.', expectError: false },
  { id: 207, category: 'cyrillic', input: 'У Тошкентда яшайди.', expectError: false },
  { id: 208, category: 'cyrillic', input: 'Мен китоб ўқидим.', expectError: false },
  { id: 209, category: 'cyrillic', input: 'Биз ишладик.', expectError: false },
  { id: 210, category: 'cyrillic', input: 'Улар келди.', expectError: false },
  { id: 211, category: 'cyrillic', input: 'Мен бугун мактабга бордм.', expectError: true, expectedWord: 'бордм', expectedSuggestion: 'бордим' },
  { id: 212, category: 'cyrillic', input: 'У келди.', expectError: false },
  { id: 213, category: 'cyrillic', input: 'Бу яхши.', expectError: false },
  { id: 214, category: 'cyrillic', input: 'Мен ўзбек.', expectError: false },
  { id: 215, category: 'cyrillic', input: 'У китоб ўқиди.', expectError: false },

  // ===================================================================
  // PERSON NAMES (should NOT be flagged)
  // ===================================================================
  { id: 216, category: 'person_name', input: 'Akmal maktabga bordi.', expectError: false, shouldNotFlag: ['Akmal'] },
  { id: 217, category: 'person_name', input: 'Dilnoza kitob oʻqidi.', expectError: false, shouldNotFlag: ['Dilnoza'] },
  { id: 218, category: 'person_name', input: 'Jasur keldi.', expectError: false, shouldNotFlag: ['Jasur'] },
  { id: 219, category: 'person_name', input: 'Temur ishladi.', expectError: false, shouldNotFlag: ['Temur'] },
  { id: 220, category: 'person_name', input: 'Gulnora yashaydi.', expectError: false, shouldNotFlag: ['Gulnora'] },
  { id: 221, category: 'person_name', input: 'Bekzod bordi.', expectError: false, shouldNotFlag: ['Bekzod'] },
  { id: 222, category: 'person_name', input: 'Malika keldi.', expectError: false, shouldNotFlag: ['Malika'] },
  { id: 223, category: 'person_name', input: 'Rustam ishladi.', expectError: false, shouldNotFlag: ['Rustam'] },
  { id: 224, category: 'person_name', input: 'Sevara oʻqidi.', expectError: false, shouldNotFlag: ['Sevara'] },
  { id: 225, category: 'person_name', input: 'Otabek yozdi.', expectError: false, shouldNotFlag: ['Otabek'] },

  // ===================================================================
  // CITIES & COUNTRIES (should NOT be flagged)
  // ===================================================================
  { id: 226, category: 'city_country', input: 'Toshkent katta shahar.', expectError: false, shouldNotFlag: ['Toshkent'] },
  { id: 227, category: 'city_country', input: 'Samarqand goʻzal.', expectError: false, shouldNotFlag: ['Samarqand'] },
  { id: 228, category: 'city_country', input: 'Buxoro tarixiy.', expectError: false, shouldNotFlag: ['Buxoro'] },
  { id: 229, category: 'city_country', input: 'Oʻzbekiston mustaqil.', expectError: false, shouldNotFlag: ['Oʻzbekiston'] },
  { id: 230, category: 'city_country', input: 'Rossiya katta.', expectError: false, shouldNotFlag: ['Rossiya'] },
  { id: 231, category: 'city_country', input: 'Andijon shahar.', expectError: false, shouldNotFlag: ['Andijon'] },
  { id: 232, category: 'city_country', input: 'Fargʻona vodiysi.', expectError: false, shouldNotFlag: ['Fargʻona'] },
  { id: 233, category: 'city_country', input: 'Nukusda boʻldim.', expectError: false, shouldNotFlag: ['Nukusda'] },
  { id: 234, category: 'city_country', input: 'Xitoy katta mamlakat.', expectError: false, shouldNotFlag: ['Xitoy'] },
  { id: 235, category: 'city_country', input: 'Turkiyaga bordim.', expectError: false, shouldNotFlag: ['Turkiyaga'] },

  // ===================================================================
  // ORGANIZATIONS & BRANDS (should NOT be flagged)
  // ===================================================================
  { id: 236, category: 'organization', input: 'Google katta kompaniya.', expectError: false, shouldNotFlag: ['Google'] },
  { id: 237, category: 'organization', input: 'Microsoft ishlaydi.', expectError: false, shouldNotFlag: ['Microsoft'] },
  { id: 238, category: 'organization', input: 'Amazon bor.', expectError: false, shouldNotFlag: ['Amazon'] },
  { id: 239, category: 'organization', input: 'Telegram orqali.', expectError: false, shouldNotFlag: ['Telegram'] },
  { id: 240, category: 'organization', input: 'YouTube da video.', expectError: false, shouldNotFlag: ['YouTube'] },
  { id: 241, category: 'organization', input: 'Instagram faol.', expectError: false, shouldNotFlag: ['Instagram'] },
  { id: 242, category: 'organization', input: 'Apple mahsulot.', expectError: false, shouldNotFlag: ['Apple'] },
  { id: 243, category: 'organization', input: 'Vercel ishlatdik.', expectError: false, shouldNotFlag: ['Vercel'] },
  { id: 244, category: 'organization', input: 'OpenAI yaratdi.', expectError: false, shouldNotFlag: ['OpenAI'] },
  { id: 245, category: 'organization', input: 'React bilan.', expectError: false, shouldNotFlag: ['React'] },

  // ===================================================================
  // TECHNICAL TERMS (should NOT be flagged)
  // ===================================================================
  { id: 246, category: 'tech_term', input: 'JavaScript til.', expectError: false, shouldNotFlag: ['JavaScript'] },
  { id: 247, category: 'tech_term', input: 'TypeScript yaxshi.', expectError: false, shouldNotFlag: ['TypeScript'] },
  { id: 248, category: 'tech_term', input: 'Python oʻrganaman.', expectError: false, shouldNotFlag: ['Python'] },
  { id: 249, category: 'tech_term', input: 'Node ishlaydi.', expectError: false, shouldNotFlag: ['Node'] },
  { id: 250, category: 'tech_term', input: 'React bilan.', expectError: false, shouldNotFlag: ['React'] },
  { id: 251, category: 'tech_term', input: 'Docker ishlatamiz.', expectError: false, shouldNotFlag: ['Docker'] },
  { id: 252, category: 'tech_term', input: 'PostgreSQL bor.', expectError: false, shouldNotFlag: ['PostgreSQL'] },
  { id: 253, category: 'tech_term', input: 'API ishlatdik.', expectError: false, shouldNotFlag: ['API'] },
  { id: 254, category: 'tech_term', input: 'JSON format.', expectError: false, shouldNotFlag: ['JSON'] },
  { id: 255, category: 'tech_term', input: 'HTML tuzilma.', expectError: false, shouldNotFlag: ['HTML'] },

  // ===================================================================
  // MULTIPLE ERRORS IN ONE SENTENCE
  // ===================================================================
  { id: 256, category: 'multi_error', input: 'Men bugun maktapga bordm.', expectError: true, expectedWord: 'maktap', expectedSuggestion: 'maktab' },
  { id: 257, category: 'multi_error', input: 'U keldm va kitb oʻqdi.', expectError: true, expectedWord: 'keldm', expectedSuggestion: 'keldim' },
  { id: 258, category: 'multi_error', input: 'Men yaxsi kitb oʻqiman.', expectError: true, expectedWord: 'yaxsi', expectedSuggestion: 'yaxshi' },
  { id: 259, category: 'multi_error', input: 'U matkabga kelid.', expectError: true, expectedWord: 'matkab', expectedSuggestion: 'maktab' },
  { id: 260, category: 'multi_error', input: 'Men boridm va keldm.', expectError: true, expectedWord: 'boridm', expectedSuggestion: 'bordim' },
  { id: 261, category: 'multi_error', input: 'Bu yaxsi va toʻgri.', expectError: true, expectedWord: 'yaxsi', expectedSuggestion: 'yaxshi' },
  { id: 262, category: 'multi_error', input: 'U kitb oʻqdi va yahshi soʻzladi.', expectError: true, expectedWord: 'kitb', expectedSuggestion: 'kitob' },
  { id: 263, category: 'multi_error', input: 'Men mavina oldm va u buzq.', expectError: true, expectedWord: 'mavina', expectedSuggestion: 'mashina' },
  { id: 264, category: 'multi_error', input: 'U kelidm va bordm.', expectError: true, expectedWord: 'kelidm', expectedSuggestion: null },
  { id: 265, category: 'multi_error', input: 'Men olm yedim va choy idim.', expectError: true, expectedWord: 'olm', expectedSuggestion: 'olma' },
  { id: 266, category: 'multi_error', input: 'U maktabka bordm.', expectError: true, expectedWord: 'maktabka', expectedSuggestion: 'maktabga' },
  { id: 267, category: 'multi_error', input: 'Men Toshkentta yashaman.', expectError: true, expectedWord: 'Toshkentta', expectedSuggestion: 'Toshkentda' },
  { id: 268, category: 'multi_error', input: 'U sevgai va kekdi.', expectError: true, expectedWord: 'sevgai', expectedSuggestion: null },
  { id: 269, category: 'multi_error', input: 'Men gapi va yahsi.', expectError: true, expectedWord: 'gapi', expectedSuggestion: null },
  { id: 270, category: 'multi_error', input: 'U irhlaydi va kellim.', expectError: true, expectedWord: 'irhlaydi', expectedSuggestion: 'ishlaydi' },

  // ===================================================================
  // ADDITIONAL CASES — words NOT in dictionary (stress test)
  // ===================================================================
  // Words that should be valid but aren't in the dictionary
  { id: 271, category: 'correct_word', input: 'maktabgacha', expectError: false, shouldNotFlag: ['maktabgacha'] },
  { id: 272, category: 'correct_word', input: 'kitoblarim', expectError: false, shouldNotFlag: ['kitoblarim'] },
  { id: 273, category: 'correct_word', input: 'oʻqituvchilar', expectError: false, shouldNotFlag: ['oʻqituvchilar'] },
  { id: 274, category: 'correct_word', input: 'shaharlar', expectError: false, shouldNotFlag: ['shaharlar'] },
  { id: 275, category: 'correct_word', input: 'bolalarim', expectError: false, shouldNotFlag: ['bolalarim'] },
  { id: 276, category: 'correct_word', input: 'maktabda', expectError: false, shouldNotFlag: ['maktabda'] },
  { id: 277, category: 'correct_word', input: 'kitobni', expectError: false, shouldNotFlag: ['kitobni'] },
  { id: 278, category: 'correct_word', input: 'shaharning', expectError: false, shouldNotFlag: ['shaharning'] },
  { id: 279, category: 'correct_word', input: 'bolaga', expectError: false, shouldNotFlag: ['bolaga'] },
  { id: 280, category: 'correct_word', input: 'maktabdan', expectError: false, shouldNotFlag: ['maktabdan'] },

  // Spelling errors with words not in dictionary
  { id: 281, category: 'wrong_letter', input: 'U surutga bordi.', expectError: true, expectedWord: 'surut', expectedSuggestion: null },
  { id: 282, category: 'missing_letter', input: 'Men maqol yozdim.', expectError: true, expectedWord: 'maqol', expectedSuggestion: 'maqola' },
  { id: 283, category: 'wrong_letter', input: 'Bu hikyo.', expectError: true, expectedWord: 'hikyo', expectedSuggestion: 'hikoya' },
  { id: 284, category: 'extra_letter', input: 'U suhbatf qildi.', expectError: true, expectedWord: 'suhbatf', expectedSuggestion: null },
  { id: 285, category: 'wrong_letter', input: 'Men suhbat qildm.', expectError: true, expectedWord: 'qildm', expectedSuggestion: 'qildim' },

  // Case suffix with unknown stems
  { id: 286, category: 'case_suffix', input: 'U daryota bordi.', expectError: true, expectedWord: 'daryota', expectedSuggestion: 'daryoga' },
  { id: 287, category: 'case_suffix', input: 'Men daryoda suzdim.', expectError: false, shouldNotFlag: ['daryoda'] },
  { id: 288, category: 'case_suffix', input: 'U togʻa chiqdi.', expectError: false, shouldNotFlag: ['togʻa'] },
  { id: 289, category: 'case_suffix', input: 'Men togʻdan keldim.', expectError: false, shouldNotFlag: ['togʻdan'] },
  { id: 290, category: 'case_suffix', input: 'U koʻlda suzdi.', expectError: false, shouldNotFlag: ['koʻlda'] },

  // Verb forms not in dictionary
  { id: 291, category: 'verb_suffix', input: 'Men yozdim.', expectError: false, shouldNotFlag: ['yozdim'] },
  { id: 292, category: 'verb_suffix', input: 'U oʻqidi.', expectError: false, shouldNotFlag: ['oʻqidi'] },
  { id: 293, category: 'verb_suffix', input: 'Biz koʻrdik.', expectError: false, shouldNotFlag: ['koʻrdik'] },
  { id: 294, category: 'verb_suffix', input: 'Men bildim.', expectError: true, expectedWord: 'bildim', expectedSuggestion: null },
  { id: 295, category: 'verb_suffix', input: 'U dedi.', expectError: false, shouldNotFlag: ['dedi'] },

  // Context with unknown verbs
  { id: 296, category: 'context_case', input: 'U maktabga kirdi.', expectError: false, shouldNotFlag: ['maktabga'] },
  { id: 297, category: 'context_case', input: 'U maktabda oʻtirdi.', expectError: false, shouldNotFlag: ['maktabda'] },
  { id: 298, category: 'context_case', input: 'Men uyga kirdim.', expectError: false, shouldNotFlag: ['uyga'] },
  { id: 299, category: 'context_case', input: 'U uyda oʻtirdi.', expectError: false, shouldNotFlag: ['uyda'] },
  { id: 300, category: 'context_case', input: 'Men bozorga kirdim.', expectError: false, shouldNotFlag: ['bozorga'] },

  // Additional apostrophe edge cases
  { id: 301, category: 'apostrophe_o', input: "Men o'zim qildim.", expectError: true, expectedWord: "o'zim", expectedSuggestion: 'oʻzim' },
  { id: 302, category: 'apostrophe_o', input: 'U oʻzini bildi.', expectError: false, shouldNotFlag: ['oʻzini'] },
  { id: 303, category: 'apostrophe_g', input: "U g'amlandi.", expectError: true, expectedWord: "g'amlandi", expectedSuggestion: 'gʻamlandi' },
  { id: 304, category: 'apostrophe_unicode', input: 'U oʼzim.', expectError: true, expectedWord: 'oʼzim', expectedSuggestion: 'oʻzim' },
  { id: 305, category: 'apostrophe_unicode', input: 'Men gʼamdim.', expectError: true, expectedWord: 'gʼamdim', expectedSuggestion: 'gʻamdim' },

  // Cyrillic with errors
  { id: 306, category: 'cyrillic', input: 'Мен китоб ўқдм.', expectError: true, expectedWord: 'ўқдм', expectedSuggestion: 'ўқидим' },
  { id: 307, category: 'cyrillic', input: 'У яхши.', expectError: false },
  { id: 308, category: 'cyrillic', input: 'Бу китоб.', expectError: false },
  { id: 309, category: 'cyrillic', input: 'Мен бордим.', expectError: false },
  { id: 310, category: 'cyrillic', input: 'У келди.', expectError: false },

  // Additional correct sentences with suffixes
  { id: 311, category: 'correct_sentence', input: 'Men kitobimni oʻqidim.', expectError: false, shouldNotFlag: ['kitobimni'] },
  { id: 312, category: 'correct_sentence', input: 'Ular shaharda yashaydilar.', expectError: false, shouldNotFlag: ['shaharda'] },
  { id: 313, category: 'correct_sentence', input: 'Bolalar maktabdan keldilar.', expectError: false, shouldNotFlag: ['maktabdan'] },
  { id: 314, category: 'correct_sentence', input: 'Oʻqituvchi darsga keldi.', expectError: false, shouldNotFlag: ['darsga'] },
  { id: 315, category: 'correct_sentence', input: 'Men doʻstimga xat yozdim.', expectError: false, shouldNotFlag: ['doʻstimga'] },
];
