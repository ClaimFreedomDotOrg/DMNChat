import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelectSuggestion,
  disabled = false
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles size={14} className="text-sky-400 mt-1 flex-shrink-0" />
          <p className="text-xs text-slate-500">Suggested questions:</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => !disabled && onSelectSuggestion(suggestion)}
              disabled={disabled}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800/50 hover:bg-slate-700/70 active:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 rounded-lg text-sm text-slate-300 hover:text-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestionChips;
