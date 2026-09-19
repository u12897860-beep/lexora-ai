import { UiLang, STRINGS } from '@/lib/i18n';
import { CheckCircle2, BookOpen, Sparkles, ArrowRightLeft, BookMarked, Award, ArrowRight, Brain, Cpu, Database, Layers } from 'lucide-react';

interface LandingPageProps {
  uiLang: UiLang;
  onStart: () => void;
}

export function LandingPage({ uiLang, onStart }: LandingPageProps) {
  const t = STRINGS[uiLang];

  const examples = [
    { wrong: 'Walom', right: 'Salom' },
    { wrong: 'yahshi', right: 'yaxshi' },
    { wrong: 'Toshkentta', right: 'Toshkentda' },
    { wrong: 'maktabka', right: 'maktabga' },
    { wrong: "O'zbekstan", right: 'Oʻzbekiston' },
    { wrong: 'kitobar', right: 'kitoblar' },
  ];

  const features = [
    { icon: CheckCircle2, title: t.feature1Title, desc: t.feature1Desc },
    { icon: BookOpen, title: t.feature2Title, desc: t.feature2Desc },
    { icon: Sparkles, title: t.feature3Title, desc: t.feature3Desc },
    { icon: ArrowRightLeft, title: t.feature4Title, desc: t.feature4Desc },
    { icon: BookMarked, title: t.feature5Title, desc: t.feature5Desc },
    { icon: Award, title: t.feature6Title, desc: t.feature6Desc },
  ];

  const steps = [t.step1, t.step2, t.step3, t.step4];

  const techStack = [
    { icon: Brain, name: 'Morphology Engine', desc: 'Agglutinative analysis' },
    { icon: Cpu, name: 'Fuzzy Matching', desc: 'Levenshtein + Jaro-Winkler' },
    { icon: Layers, name: 'Context Engine', desc: 'N-gram probability model' },
    { icon: Database, name: 'Scalable Dictionary', desc: 'Millions of word forms' },
  ];

  const faqs = uiLang === 'uz' ? [
    { q: 'UzbekCorrect AI bepulmi?', a: 'Ha, asosiy imkoniyatlar bepul. Kelajakda premium imkoniyatlar ham boʻlishi mumkin.' },
    { q: 'Qaysi alifbo qoʻllab-quvvatlanadi?', a: 'Lotin va Kirill alifbosi toʻliq qoʻllab-quvvatlanadi. Avtomatik aniqlash va konvertatsiya mavjud.' },
    { q: 'Mening matnim saqlanadimi?', a: 'Yoʻq. Matningiz sizning brauzeringizda qayta ishlanadi va serverga yuborilmaydi.' },
    { q: 'Shaxsiy lugʻat qoʻsha olamanmi?', a: 'Ha, sozlamalarda oʻz soʻzlaringizni qoʻshishingiz mumkin. Ular xato deb topilmaydi.' },
  ] : uiLang === 'ru' ? [
    { q: 'UzbekCorrect AI бесплатный?', a: 'Да, основные функции бесплатны. В будущем возможны премиум-функции.' },
    { q: 'Какие алфавиты поддерживаются?', a: 'Полностью поддерживаются латиница и кириллица. Есть автодетекция и конвертация.' },
    { q: 'Мой текст сохраняется?', a: 'Нет. Текст обрабатывается в вашем браузере и не отправляется на сервер.' },
    { q: 'Можно ли добавить личный словарь?', a: 'Да, в настройках можно добавить свои слова. Они не будут помечаться как ошибки.' },
  ] : [
    { q: 'Is UzbekCorrect AI free?', a: 'Yes, the core features are free. Premium features may be added in the future.' },
    { q: 'Which scripts are supported?', a: 'Both Latin and Cyrillic scripts are fully supported, with auto-detection and conversion.' },
    { q: 'Is my text stored?', a: 'No. Your text is processed in your browser and never sent to a server.' },
    { q: 'Can I add a custom dictionary?', a: 'Yes, you can add your own words in settings. They will not be flagged as errors.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-white">UzbekCorrect AI</span>
          </div>
          <button
            onClick={onStart}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t.heroCta}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Uzbek Language Corrector
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            {t.heroCta}
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Example badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {examples.slice(0, 4).map((ex, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className="text-sm text-red-400 line-through">{ex.wrong}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{ex.right}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">{t.featuresTitle}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">{t.howItWorksTitle}</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">{t.technologyTitle}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {techStack.map((tech, i) => (
            <div key={i} className="text-center bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <tech.icon className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">{tech.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">{t.examplesTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {examples.map((ex, i) => (
              <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <span className="text-lg text-red-400 line-through flex-1">{ex.wrong}</span>
                <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 flex-1 text-right">{ex.right}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">{t.faqTitle}</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-12 shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-4">{t.heroTitle}</h2>
          <p className="text-emerald-50 mb-8">{t.heroSubtitle}</p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
          >
            {t.heroCta}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-400">
          <p>UzbekCorrect AI — {t.tagline}</p>
        </div>
      </footer>
    </div>
  );
}
