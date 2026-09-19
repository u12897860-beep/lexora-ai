import { useState } from 'react';
import { UiLang, STRINGS } from '@/lib/i18n';
import { StyleMode } from '@/lib/types';
import { Settings, Plus, X, ArrowRightLeft, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  uiLang: UiLang;
  onUiLangChange: (lang: UiLang) => void;
  styleMode: StyleMode;
  onStyleModeChange: (mode: StyleMode) => void;
  autoCorrect: boolean;
  onAutoCorrectChange: (v: boolean) => void;
  customDictionary: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
  improveUzbekCorrect: boolean;
  onImproveChange: (v: boolean) => void;
  onTransliterate: (toCyrillic: boolean) => void;
}

export function SettingsPanel({
  uiLang, onUiLangChange, styleMode, onStyleModeChange,
  autoCorrect, onAutoCorrectChange, customDictionary, onAddWord, onRemoveWord,
  improveUzbekCorrect, onImproveChange, onTransliterate,
}: SettingsPanelProps) {
  const t = STRINGS[uiLang];
  const [newWord, setNewWord] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const styleModes: Array<{ key: StyleMode; label: string }> = [
    { key: 'academic', label: t.academic },
    { key: 'formal', label: t.formal },
    { key: 'business', label: t.business },
    { key: 'simple', label: t.simple },
    { key: 'casual', label: t.casual },
  ];

  const handleAdd = () => {
    const w = newWord.trim();
    if (w && !customDictionary.includes(w)) {
      onAddWord(w);
      setNewWord('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Settings className="w-4 h-4" />
          {t.settings}
        </span>
        <span className="text-xs text-slate-400">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="px-4 py-3 space-y-4 border-t border-slate-200 dark:border-slate-700">
          {/* Language */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t.language}</label>
            <div className="flex gap-1.5">
              {(['uz', 'ru', 'en'] as UiLang[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => onUiLangChange(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    uiLang === lang
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'uz' ? 'Oʻzbekcha' : lang === 'ru' ? 'Русский' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* Style mode */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t.styleMode}</label>
            <div className="flex flex-wrap gap-1.5">
              {styleModes.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => onStyleModeChange(mode.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    styleMode === mode.key
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto correct */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.autoCorrect}
            </span>
            <button
              onClick={() => onAutoCorrectChange(!autoCorrect)}
              className={`relative w-10 h-5 rounded-full transition-colors ${autoCorrect ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoCorrect ? 'translate-x-5' : ''}`} />
            </button>
          </label>

          {/* Transliteration */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t.transliterate}</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => onTransliterate(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {t.toCyrillic}
              </button>
              <button
                onClick={() => onTransliterate(false)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {t.toLatin}
              </button>
            </div>
          </div>

          {/* Custom dictionary */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">{t.customDictionary}</label>
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder={t.wordPlaceholder}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {customDictionary.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customDictionary.map(word => (
                  <span key={word} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    {word}
                    <button onClick={() => onRemoveWord(word)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Improve UzbekCorrect */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-600 dark:text-slate-300">{t.improveUzbekCorrect}</span>
            <button
              onClick={() => onImproveChange(!improveUzbekCorrect)}
              className={`relative w-10 h-5 rounded-full transition-colors ${improveUzbekCorrect ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${improveUzbekCorrect ? 'translate-x-5' : ''}`} />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}
