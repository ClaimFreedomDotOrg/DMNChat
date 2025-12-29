import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false
}) => {
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
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
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 focus-within:ring-2 focus-within:ring-sky-500/50 focus-within:border-sky-500 transition-all">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask DMN about the framework, suffering, or the voice in your head..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 p-4 pr-14 rounded-xl resize-none focus:outline-none min-h-[60px] max-h-[200px]"
            rows={1}
            disabled={disabled}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!value.trim() || disabled}
            className="absolute right-3 bottom-3 p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-600">
            DMN uses the provided texts to guide you. It is an AI tool, not a human therapist.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
