import { Correction } from '@/lib/types';
import { UiLang, STRINGS } from '@/lib/i18n';
import { CheckCircle2, AlertCircle, BookOpen, Palette, PenLine } from 'lucide-react';

interface CorrectionPanelProps {
  corrections: Correction[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onApply: (correction: Correction, suggestionIndex: number) => void;
  onDismiss: (index: number) => void;
  uiLang: UiLang;
}

const typeConfig = {
  spelling: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  grammar: { icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  punctuation: { icon: PenLine, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  style: { icon: Palette, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export function CorrectionPanel({ corrections, selectedIndex, onSelect, onApply, onDismiss, uiLang }: CorrectionPanelProps) {
  const t = STRINGS[uiLang];

  if (corrections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">{t.noErrors}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {corrections.map((corr, idx) => {
        const config = typeConfig[corr.type];
        const Icon = config.icon;
        const isSelected = idx === selectedIndex;
        return (
          <div
            key={idx}
            className={`rounded-xl border ${config.border} ${config.bg} p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-slate-400 shadow-md' : 'hover:shadow-sm'}`}
            onClick={() => onSelect(idx)}
          >
            <div className="flex items-start gap-2 mb-2">
              <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                {corr.original && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 line-through decoration-red-500">
                      {corr.original}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {corr.explanation}
                </p>
              </div>
            </div>
            {corr.suggestions.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.suggestions}</p>
                {corr.suggestions.map((sug, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between gap-2 bg-white/70 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {sug.word}
                      </span>
                      <span className="text-xs text-slate-400">
                        {Math.round(sug.confidence * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onApply(corr, sIdx); }}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-1 rounded-md transition-colors flex-shrink-0"
                    >
                      {t.apply}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-xs text-slate-400 italic">{t.noSuggestions}</p>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(idx); }}
              className="mt-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {t.dismiss}
            </button>
          </div>
        );
      })}
    </div>
  );
}
