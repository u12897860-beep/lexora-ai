import { useState, useMemo, useCallback } from 'react';
import { CheckResult, Correction, StyleMode, UiLang } from '@/lib/types';
import { checkText } from '@/lib/checker';
import { latinToCyrillic, cyrillicToLatin } from '@/lib/text';
import { STRINGS } from '@/lib/i18n';
import { Editor } from '@/components/Editor';
import { CorrectionPanel } from '@/components/CorrectionPanel';
import { StatsBar } from '@/components/StatsBar';
import { SettingsPanel } from '@/components/SettingsPanel';
import { LandingPage } from '@/components/LandingPage';
import { CheckCircle2, Wand2, Trash2, ChevronLeft } from 'lucide-react';

type View = 'landing' | 'editor';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [text, setText] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [selectedCorrIdx, setSelectedCorrIdx] = useState(-1);
  const [hasChecked, setHasChecked] = useState(false);

  // Settings
  const [uiLang, setUiLang] = useState<UiLang>('uz');
  const [styleMode, setStyleMode] = useState<StyleMode>('simple');
  const [autoCorrect, setAutoCorrect] = useState(false);
  const [customDictionary, setCustomDictionary] = useState<string[]>([]);
  const [improveUzbekCorrect, setImproveUzbekCorrect] = useState(false);

  const t = STRINGS[uiLang];

  const doCheck = useCallback(() => {
    if (!text.trim()) {
      setResult(null);
      setHasChecked(false);
      return;
    }
    const res = checkText(text, { customDictionary, styleMode, autoCorrect });
    setResult(res);
    setHasChecked(true);
    setSelectedCorrIdx(-1);
  }, [text, customDictionary, styleMode, autoCorrect]);

  const doCorrect = useCallback(() => {
    if (!text.trim()) return;
    const res = checkText(text, { customDictionary, styleMode, autoCorrect: true });
    setResult(res);
    setHasChecked(true);
    setText(res.correctedText);
  }, [text, customDictionary, styleMode]);

  const applyCorrection = useCallback((corr: Correction, suggestionIdx: number) => {
    if (!result) return;
    const sug = corr.suggestions[suggestionIdx];
    if (!sug) return;
    const newText = text.slice(0, corr.start) + sug.word + text.slice(corr.end);
    setText(newText);
    // Re-check
    const res = checkText(newText, { customDictionary, styleMode, autoCorrect });
    setResult(res);
  }, [text, result, customDictionary, styleMode, autoCorrect]);

  const dismissCorrection = useCallback((idx: number) => {
    if (!result) return;
    const newCorrs = result.corrections.filter((_, i) => i !== idx);
    setResult({ ...result, corrections: newCorrs });
  }, [result]);

  const handleTransliterate = useCallback((toCyrillic: boolean) => {
    if (!text.trim()) return;
    setText(toCyrillic ? latinToCyrillic(text) : cyrillicToLatin(text));
    setResult(null);
    setHasChecked(false);
  }, [text]);

  const addCustomWord = useCallback((word: string) => {
    setCustomDictionary(prev => [...prev, word]);
  }, []);

  const removeCustomWord = useCallback((word: string) => {
    setCustomDictionary(prev => prev.filter(w => w !== word));
  }, []);

  const clearText = useCallback(() => {
    setText('');
    setResult(null);
    setHasChecked(false);
    setSelectedCorrIdx(-1);
  }, []);

  // Auto-check on text change if already checked once
  const liveResult = useMemo(() => {
    if (!hasChecked || !text.trim()) return null;
    return checkText(text, { customDictionary, styleMode, autoCorrect });
  }, [text, hasChecked, customDictionary, styleMode, autoCorrect]);

  const displayResult = liveResult || result;

  if (view === 'landing') {
    return <LandingPage uiLang={uiLang} onStart={() => setView('editor')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('landing')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="font-bold text-base text-slate-800 dark:text-white hidden sm:block">UzbekCorrect AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['uz', 'ru', 'en'] as UiLang[]).map(lang => (
              <button
                key={lang}
                onClick={() => setUiLang(lang)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  uiLang === lang
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {lang === 'uz' ? 'UZ' : lang === 'ru' ? 'RU' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Editor + Stats */}
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={doCheck}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm shadow-sm hover:bg-emerald-600 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t.checkBtn}
              </button>
              <button
                onClick={doCorrect}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-medium text-sm shadow-sm hover:opacity-90 transition-opacity"
              >
                <Wand2 className="w-4 h-4" />
                {t.correctBtn}
              </button>
              <button
                onClick={clearText}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t.clearBtn}
              </button>
            </div>

            {/* Editor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[400px] sm:h-[500px]">
              <Editor
                text={text}
                onChange={setText}
                corrections={displayResult?.corrections ?? []}
                onWordClick={(_, idx) => setSelectedCorrIdx(idx)}
                selectedCorrection={selectedCorrIdx}
                uiLang={uiLang}
                placeholder={t.placeholder}
              />
            </div>

            {/* Stats */}
            <StatsBar
              stats={displayResult?.stats ?? { words: 0, characters: 0, errors: 0, spelling: 0, grammar: 0, punctuation: 0, style: 0 }}
              score={displayResult?.score ?? 0}
              uiLang={uiLang}
              hasText={!!text.trim()}
            />
          </div>

          {/* Right: Corrections + Settings */}
          <div className="space-y-4">
            {/* Error category tabs */}
            {displayResult && displayResult.corrections.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {displayResult.corrections.length} {t.errorsFound}
                </span>
              </div>
            )}

            {/* Correction panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-h-[500px] overflow-y-auto">
              <CorrectionPanel
                corrections={displayResult?.corrections ?? []}
                selectedIndex={selectedCorrIdx}
                onSelect={setSelectedCorrIdx}
                onApply={applyCorrection}
                onDismiss={dismissCorrection}
                uiLang={uiLang}
              />
            </div>

            {/* Settings */}
            <SettingsPanel
              uiLang={uiLang}
              onUiLangChange={setUiLang}
              styleMode={styleMode}
              onStyleModeChange={setStyleMode}
              autoCorrect={autoCorrect}
              onAutoCorrectChange={setAutoCorrect}
              customDictionary={customDictionary}
              onAddWord={addCustomWord}
              onRemoveWord={removeCustomWord}
              improveUzbekCorrect={improveUzbekCorrect}
              onImproveChange={setImproveUzbekCorrect}
              onTransliterate={handleTransliterate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
