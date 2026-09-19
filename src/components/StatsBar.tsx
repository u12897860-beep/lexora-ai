import { UiLang, STRINGS } from '@/lib/i18n';
import { Type, Hash, AlertTriangle, Award } from 'lucide-react';

interface StatsBarProps {
  stats: {
    words: number;
    characters: number;
    errors: number;
    spelling: number;
    grammar: number;
    punctuation: number;
    style: number;
  };
  score: number;
  uiLang: UiLang;
  hasText: boolean;
}

export function StatsBar({ stats, score, uiLang, hasText }: StatsBarProps) {
  const t = STRINGS[uiLang];

  const scoreColor = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = score >= 90 ? 'from-emerald-400 to-emerald-500' : score >= 70 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={Type} label={t.words} value={hasText ? stats.words : 0} color="text-slate-600 dark:text-slate-300" />
      <StatCard icon={Hash} label={t.characters} value={hasText ? stats.characters : 0} color="text-slate-600 dark:text-slate-300" />
      <StatCard icon={AlertTriangle} label={t.errors} value={hasText ? stats.errors : 0} color={stats.errors > 0 ? 'text-red-500' : 'text-emerald-500'} />
      <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
            <circle
              cx="20" cy="20" r="16" fill="none" stroke="url(#scoreGradient)" strokeWidth="3"
              strokeDasharray={`${(hasText ? score : 0) * 1.005} 100`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`[stop-color:var(--tw-gradient-from)] bg-gradient-to-r ${scoreBg}`} />
                <stop offset="100%" className={`[stop-color:var(--tw-gradient-to)] bg-gradient-to-r ${scoreBg}`} />
              </linearGradient>
            </defs>
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${scoreColor}`}>
            {hasText ? score : '--'}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 truncate">{t.score}</p>
          <p className={`text-lg font-bold ${scoreColor}`}>{hasText ? `${score}/100` : '--'}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs text-slate-400 truncate">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
