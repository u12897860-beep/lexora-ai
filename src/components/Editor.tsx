import { useRef, useEffect } from 'react';
import { Correction } from '@/lib/types';
import { UiLang, STRINGS } from '@/lib/i18n';

interface EditorProps {
  text: string;
  onChange: (text: string) => void;
  corrections: Correction[];
  onWordClick: (correction: Correction, index: number) => void;
  selectedCorrection?: number;
  uiLang: UiLang;
  placeholder: string;
}

export function Editor({ text, onChange, corrections, onWordClick, selectedCorrection, uiLang, placeholder }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [text]);

  // Build highlighted overlay from corrections
  const buildOverlay = () => {
    if (!text) {
      return <span className="text-transparent">{placeholder}</span>;
    }

    // Sort corrections by start position
    const sorted = [...corrections].filter(c => c.start !== c.end || c.type === 'punctuation').sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    sorted.forEach((corr, idx) => {
      // Add text before this correction
      if (corr.start > lastEnd) {
        parts.push(<span key={`text-${idx}`} className="text-transparent">{text.slice(lastEnd, corr.start)}</span>);
      }
      // Add the highlighted word
      const colorClass =
        corr.type === 'spelling' ? 'bg-red-200/60 border-b-2 border-red-500' :
        corr.type === 'grammar' ? 'bg-amber-200/60 border-b-2 border-amber-500' :
        corr.type === 'punctuation' ? 'bg-purple-200/60 border-b-2 border-purple-500' :
        'bg-blue-200/60 border-b-2 border-blue-500';

      const isSelected = selectedCorrection === idx;
      const selectedClass = isSelected ? 'ring-2 ring-offset-1 ring-slate-700' : '';

      if (corr.start !== corr.end) {
        parts.push(
          <span
            key={`corr-${idx}`}
            className={`${colorClass} ${selectedClass} rounded px-0.5 cursor-pointer transition-all`}
            onClick={() => onWordClick(corr, idx)}
          >
            {text.slice(corr.start, corr.end)}
          </span>
        );
      }
      lastEnd = corr.end;
    });

    // Add remaining text
    if (lastEnd < text.length) {
      parts.push(<span key="text-end" className="text-transparent">{text.slice(lastEnd)}</span>);
    }

    return parts;
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Highlight overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 overflow-auto pointer-events-none px-4 py-3.5 text-base leading-7 whitespace-pre-wrap break-words"
        aria-hidden="true"
        style={{ fontFamily: 'inherit' }}
      >
        {buildOverlay()}
      </div>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="absolute inset-0 w-full h-full px-4 py-3.5 text-base leading-7 bg-transparent resize-none outline-none whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100 caret-slate-700 dark:caret-slate-300"
        placeholder={placeholder}
        spellCheck={false}
        onMouseDown={() => {}}
      />
    </div>
  );
}
