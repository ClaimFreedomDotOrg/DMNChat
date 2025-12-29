import React from 'react';
import { Message as MessageType } from '@/types';
import { User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError || false;

  return (
    <div className={`flex w-full py-6 px-4 ${isUser ? 'bg-slate-900/50' : ''}`}>
      <div className="flex max-w-4xl mx-auto gap-6 w-full">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-slate-700 text-slate-300'
            : isError
            ? 'bg-red-600 text-white'
            : 'bg-sky-600 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${isError ? 'text-red-400' : 'text-slate-200'}`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className?.includes('language-');
                  return isInline ? (
                    <code className="bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-slate-800 text-slate-300 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-4">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="mb-4">{children}</pre>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-slate-500 font-semibold">Sources:</div>
              {message.citations.map((citation, idx) => (
                <a
                  key={idx}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-sky-400 hover:text-sky-300 hover:bg-slate-800/50 p-2 rounded transition-colors"
                >
                  <div className="font-mono">{citation.repoName}</div>
                  <div className="text-slate-500">{citation.filePath}</div>
                </a>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-[10px] text-slate-600 mt-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
