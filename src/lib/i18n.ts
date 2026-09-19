// Internationalization (i18n) for the UI — Uzbek, Russian, English.

import { UiLang } from './types';
export type { UiLang };

export interface Strings {
  // App
  appName: string;
  tagline: string;
  // Editor
  placeholder: string;
  checkBtn: string;
  correctBtn: string;
  clearBtn: string;
  // Sidebar
  spelling: string;
  grammar: string;
  punctuation: string;
  style: string;
  noErrors: string;
  errorsFound: string;
  // Stats
  words: string;
  characters: string;
  errors: string;
  score: string;
  // Correction panel
  suggestions: string;
  explanation: string;
  confidence: string;
  apply: string;
  dismiss: string;
  noSuggestions: string;
  // Settings
  settings: string;
  language: string;
  styleMode: string;
  academic: string;
  formal: string;
  business: string;
  simple: string;
  casual: string;
  autoCorrect: string;
  customDictionary: string;
  addWord: string;
  wordPlaceholder: string;
  improveUzbekCorrect: string;
  // Transliteration
  transliterate: string;
  toCyrillic: string;
  toLatin: string;
  // Landing
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  featuresTitle: string;
  howItWorksTitle: string;
  technologyTitle: string;
  examplesTitle: string;
  faqTitle: string;
  aboutTitle: string;
  // Features
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  feature5Title: string;
  feature5Desc: string;
  feature6Title: string;
  feature6Desc: string;
  // How it works
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  // Nav
  editor: string;
  home: string;
}

export const STRINGS: Record<UiLang, Strings> = {
  uz: {
    appName: 'UzbekCorrect AI',
    tagline: 'Oʻzbek tilini mukammal yozing.',
    placeholder: 'Matningizni shu yerga yozing...',
    checkBtn: 'Tekshirish',
    correctBtn: 'Tuzatish',
    clearBtn: 'Tozalash',
    spelling: 'Imlo',
    grammar: 'Grammatika',
    punctuation: 'Tinish belgilari',
    style: 'Uslub',
    noErrors: 'Xato topilmadi',
    errorsFound: 'xato topildi',
    words: 'Soʻzlar',
    characters: 'Belgilar',
    errors: 'Xatolar',
    score: 'Ball',
    suggestions: 'Tavsiyalar',
    explanation: 'Tushuntirish',
    confidence: 'Ishonch',
    apply: 'Qoʻllash',
    dismiss: 'Oʻtkazib yuborish',
    noSuggestions: 'Tavsiya yoʻq',
    settings: 'Sozlamalar',
    language: 'Til',
    styleMode: 'Uslub rejimi',
    academic: 'Akademik',
    formal: 'Rasmiy',
    business: 'Biznes',
    simple: 'Oddiy',
    casual: 'Soʻzlashuv',
    autoCorrect: 'Avtomatik tuzatish',
    customDictionary: 'Shaxsiy lugʻat',
    addWord: 'Soʻz qoʻshish',
    wordPlaceholder: 'Soʻz kiriting...',
    improveUzbekCorrect: 'UzbekCorrect ni yaxshilash',
    transliterate: 'Alifbo',
    toCyrillic: 'Kirillga',
    toLatin: 'Lotingga',
    heroTitle: 'Oʻzbek tilini mukammal yozing',
    heroSubtitle: 'Sunʼiy intellekt asosidagi imlo, grammatika va uslub tekshiruvchisi',
    heroCta: 'Boshlash',
    featuresTitle: 'Imkoniyatlar',
    howItWorksTitle: 'Qanday ishlaydi',
    technologyTitle: 'Texnologiya',
    examplesTitle: 'Misollar',
    faqTitle: 'Tez-tez soʻraladigan savollar',
    aboutTitle: 'Loyiha haqida',
    feature1Title: 'Imlo tekshirish',
    feature1Desc: 'Morfologik tahlil yordamida soʻzlarning toʻgʻri yozilishini tekshiradi',
    feature2Title: 'Grammatika',
    feature2Desc: 'Qaratqich, kestiruv va boshqa grammatik qoidalarini tekshiradi',
    feature3Title: 'Uslub',
    feature3Desc: 'Matn uslubini baholaydi va takliflar beradi',
    feature4Title: 'Alifbo konvertori',
    feature4Desc: 'Lotin va Kirill yozuvlari oʻrtasida konvertatsiya',
    feature5Title: 'Shaxsiy lugʻat',
    feature5Desc: 'Oʻz soʻzlaringizni qoʻshing va ular xato deb topilmasin',
    feature6Title: 'Ishonch balli',
    feature6Desc: 'Har bir tuzatish uchun ishonch darajasi koʻrsatiladi',
    step1: 'Matn kiritiladi',
    step2: 'Morfologik tahlil',
    step3: 'Xatolarni aniqlash',
    step4: 'Tuzatishni qoʻllash',
    editor: 'Muharrir',
    home: 'Bosh sahifa',
  },
  ru: {
    appName: 'UzbekCorrect AI',
    tagline: 'Пишите на узбекском безупречно.',
    placeholder: 'Введите ваш текст здесь...',
    checkBtn: 'Проверить',
    correctBtn: 'Исправить',
    clearBtn: 'Очистить',
    spelling: 'Орфография',
    grammar: 'Грамматика',
    punctuation: 'Пунктуация',
    style: 'Стиль',
    noErrors: 'Ошибок не найдено',
    errorsFound: 'ошибок найдено',
    words: 'Слова',
    characters: 'Символы',
    errors: 'Ошибки',
    score: 'Оценка',
    suggestions: 'Предложения',
    explanation: 'Объяснение',
    confidence: 'Уверенность',
    apply: 'Применить',
    dismiss: 'Пропустить',
    noSuggestions: 'Нет предложений',
    settings: 'Настройки',
    language: 'Язык',
    styleMode: 'Режим стиля',
    academic: 'Академический',
    formal: 'Формальный',
    business: 'Бизнес',
    simple: 'Простой',
    casual: 'Разговорный',
    autoCorrect: 'Автоисправление',
    customDictionary: 'Личный словарь',
    addWord: 'Добавить слово',
    wordPlaceholder: 'Введите слово...',
    improveUzbekCorrect: 'Улучшить UzbekCorrect',
    transliterate: 'Алфавит',
    toCyrillic: 'На кириллицу',
    toLatin: 'На латиницу',
    heroTitle: 'Пишите на узбекском безупречно',
    heroSubtitle: 'Проверка орфографии, грамматики и стиля на базе искусственного интеллекта',
    heroCta: 'Начать',
    featuresTitle: 'Возможности',
    howItWorksTitle: 'Как это работает',
    technologyTitle: 'Технология',
    examplesTitle: 'Примеры',
    faqTitle: 'Часто задаваемые вопросы',
    aboutTitle: 'О проекте',
    feature1Title: 'Проверка орфографии',
    feature1Desc: 'Проверяет правильность написания слов с помощью морфологического анализа',
    feature2Title: 'Грамматика',
    feature2Desc: 'Проверяет падежи, суффиксы и другие грамматические правила',
    feature3Title: 'Стиль',
    feature3Desc: 'Оценивает стиль текста и дает рекомендации',
    feature4Title: 'Конвертер алфавита',
    feature4Desc: 'Преобразование между латиницей и кириллицей',
    feature5Title: 'Личный словарь',
    feature5Desc: 'Добавляйте свои слова, чтобы они не помечались как ошибки',
    feature6Title: 'Оценка уверенности',
    feature6Desc: 'Для каждого исправления показывается уровень уверенности',
    step1: 'Ввод текста',
    step2: 'Морфологический анализ',
    step3: 'Обнаружение ошибок',
    step4: 'Применение исправлений',
    editor: 'Редактор',
    home: 'Главная',
  },
  en: {
    appName: 'UzbekCorrect AI',
    tagline: 'Write Uzbek flawlessly.',
    placeholder: 'Type your text here...',
    checkBtn: 'Check',
    correctBtn: 'Correct',
    clearBtn: 'Clear',
    spelling: 'Spelling',
    grammar: 'Grammar',
    punctuation: 'Punctuation',
    style: 'Style',
    noErrors: 'No errors found',
    errorsFound: 'errors found',
    words: 'Words',
    characters: 'Characters',
    errors: 'Errors',
    score: 'Score',
    suggestions: 'Suggestions',
    explanation: 'Explanation',
    confidence: 'Confidence',
    apply: 'Apply',
    dismiss: 'Dismiss',
    noSuggestions: 'No suggestions',
    settings: 'Settings',
    language: 'Language',
    styleMode: 'Style mode',
    academic: 'Academic',
    formal: 'Formal',
    business: 'Business',
    simple: 'Simple',
    casual: 'Casual',
    autoCorrect: 'Auto-correct',
    customDictionary: 'Custom dictionary',
    addWord: 'Add word',
    wordPlaceholder: 'Enter a word...',
    improveUzbekCorrect: 'Improve UzbekCorrect',
    transliterate: 'Script',
    toCyrillic: 'To Cyrillic',
    toLatin: 'To Latin',
    heroTitle: 'Write Uzbek flawlessly',
    heroSubtitle: 'AI-powered spelling, grammar, and style checker for the Uzbek language',
    heroCta: 'Get started',
    featuresTitle: 'Features',
    howItWorksTitle: 'How it works',
    technologyTitle: 'Technology',
    examplesTitle: 'Examples',
    faqTitle: 'Frequently asked questions',
    aboutTitle: 'About',
    feature1Title: 'Spelling check',
    feature1Desc: 'Checks correct spelling using morphological analysis',
    feature2Title: 'Grammar',
    feature2Desc: 'Checks cases, suffixes, and other grammatical rules',
    feature3Title: 'Style',
    feature3Desc: 'Evaluates text style and provides recommendations',
    feature4Title: 'Script converter',
    feature4Desc: 'Convert between Latin and Cyrillic scripts',
    feature5Title: 'Custom dictionary',
    feature5Desc: 'Add your own words so they are not flagged as errors',
    feature6Title: 'Confidence score',
    feature6Desc: 'Each correction shows a confidence level',
    step1: 'Text input',
    step2: 'Morphological analysis',
    step3: 'Error detection',
    step4: 'Apply corrections',
    editor: 'Editor',
    home: 'Home',
  },
};
