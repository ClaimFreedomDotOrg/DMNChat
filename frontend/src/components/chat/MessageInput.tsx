import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Mic } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export interface MessageInputRef {
  focus: () => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>((
  { value, onChange, onSend, disabled = false },
  ref
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  // Auto-focus on mount (only on non-touch devices to avoid keyboard popping up on mobile)
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      textareaRef.current?.focus();
    }
  }, []);
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      // Blur the input to close keyboard on mobile
      textareaRef.current?.blur();
      onSend(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-shrink-0 px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 focus-within:ring-2 focus-within:ring-sky-500/50 focus-within:border-sky-500 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask DMN about the framework, suffering, or the voice in your head..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 p-3 sm:p-4 pr-12 sm:pr-14 rounded-xl resize-none focus:outline-none min-h-[72px] sm:min-h-[80px] max-h-[200px] text-[16px]"
            rows={2}
            disabled={disabled}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-3">
            <button
              onClick={() => handleSubmit()}
              disabled={!value.trim() || disabled}
              className="p-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-600 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all touch-manipulation"
              aria-label="Send message"
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
        <div className="text-center mt-1.5 sm:mt-2">
          <p className="text-[10px] text-slate-600 px-2">
            DMN uses the provided texts to guide you. It is an AI tool, not a human therapist.
          </p>
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
