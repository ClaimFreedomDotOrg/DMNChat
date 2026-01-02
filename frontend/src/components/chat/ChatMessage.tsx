import React, { useState, useRef, useCallback } from 'react';
import { Message as MessageType } from '@/types';
import { User, Sparkles, Mic, Volume2, Square, Pause, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError || false;

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Strip markdown for TTS - convert to plain text
  const getPlainText = useCallback((text: string): string => {
    return text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove bold/italic markers
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove list markers
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }, []);

  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    // If already speaking, stop
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      return;
    }

    // If paused, resume
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Start new speech
    const plainText = getPlainText(message.text);
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [message.text, isSpeaking, isPaused, getPlainText]);

  const handlePause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, []);

  return (
    <div className={`flex w-full py-6 px-4 ${isUser ? 'bg-slate-900/50' : ''}`}>
      <div className="flex max-w-4xl mx-auto gap-6 w-full">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-slate-700 text-slate-300'
              : isError
              ? 'bg-red-600 text-white'
              : 'bg-sky-600 text-white'
          }`}>
            {isUser ? <User size={16} /> : <Sparkles size={16} />}
          </div>

          {/* Voice Message Badge */}
          {message.isVoiceMessage && (
            <div
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-slate-300 rounded-full flex items-center justify-center border border-slate-400"
              title="Voice Message"
            >
              <Mic size={10} className="text-slate-700" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className={`text-sm ${isError ? 'text-red-400' : 'text-slate-200'} break-words`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300 pl-2">{children}</li>,
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

          {/* Timestamp and TTS Controls */}
          <div className="flex items-center gap-3 mt-2">
            <div className="text-[10px] text-slate-600">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>

            {/* TTS Play Button - Only for DMN responses */}
            {!isUser && !isError && 'speechSynthesis' in window && (
              <div className="flex items-center gap-1">
                {!isSpeaking ? (
                  <button
                    onClick={handleSpeak}
                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                    title="Read aloud"
                  >
                    <Volume2 size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={isPaused ? handleSpeak : handlePause}
                      className="p-1 rounded hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                      title={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={handleStop}
                      className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Stop"
                    >
                      <Square size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
