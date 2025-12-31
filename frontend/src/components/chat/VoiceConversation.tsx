import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Play, Pause, RotateCcw, Square } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sendVoiceMessage } from '@/services/voiceService';
import ReactMarkdown from 'react-markdown';

interface VoiceConversationProps {
  onClose: () => void;
  chatId?: string; // Current chat ID to send voice message to
  onChatUpdated?: (chatId: string) => void; // Notify parent when chat is updated
}

const VoiceConversation: React.FC<VoiceConversationProps> = ({ onClose, chatId, onChatUpdated }) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [hasAudioToPlay, setHasAudioToPlay] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentAudioData, setCurrentAudioData] = useState<string | null>(null);
  const [showTranscriptOnly, setShowTranscriptOnly] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const speechDetectedRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Silence detection configuration
  const SILENCE_THRESHOLD = 0.04; // Audio level threshold for silence (increased to be less sensitive)
  const SPEECH_THRESHOLD = 0.03; // Audio level threshold to detect speech has started
  const SILENCE_DURATION = 3500; // 3.5 seconds of silence triggers auto-submit (increased from 2s)
  const MIN_RECORDING_DURATION = 1000; // Minimum 1 second before silence detection can trigger

  // Initialize audio context and cleanup on unmount
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Initialize Speech Recognition API for live transcription (optional fallback)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };
    }

    // Cleanup function - critical for preventing memory leaks
    return () => {
      console.log('VoiceConversation component unmounting - cleaning up all resources');

      // Stop and clean up media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        const stream = mediaRecorderRef.current.stream;
        stream?.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped media track:', track.kind);
        });
      }

      // Stop silence detection timer
      if (silenceDetectionTimerRef.current) {
        clearTimeout(silenceDetectionTimerRef.current);
        silenceDetectionTimerRef.current = null;
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }

      // Stop any playing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }

      // Cancel Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      // Reset refs
      isRecordingRef.current = false;
      speechDetectedRef.current = false;
      silenceStartTimeRef.current = null;
      recordingStartTimeRef.current = null;

      console.log('Cleanup complete');
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start speech recognition for live feedback
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Set up audio analysis for silence detection
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      console.log('Audio analyser set up, starting silence detection');

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        // Stop silence detection
        stopSilenceDetection();

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      recordingStartTimeRef.current = Date.now(); // Track when recording started
      speechDetectedRef.current = false; // Reset speech detection flag
      setError(null);

      // Start silence detection AFTER setting isRecordingRef to true
      startSilenceDetection();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const startSilenceDetection = () => {
    console.log('startSilenceDetection called, analyserRef:', !!analyserRef.current);
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    console.log('Silence detection initialized, buffer length:', bufferLength);

    const checkAudioLevel = () => {
      if (!analyserRef.current || !isRecordingRef.current) {
        console.log('Check stopped - analyser:', !!analyserRef.current, 'recording:', isRecordingRef.current);
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) to determine audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Log every time now for debugging
      console.log('Audio RMS level:', rms.toFixed(4), 'Threshold:', SILENCE_THRESHOLD);

      // First, check if speech has been detected yet
      if (!speechDetectedRef.current) {
        if (rms > SPEECH_THRESHOLD) {
          speechDetectedRef.current = true;
          console.log('Speech detected! Now monitoring for silence...');
        }
        // Keep monitoring but don't start silence timer yet
        silenceDetectionTimerRef.current = setTimeout(checkAudioLevel, 100);
        return;
      }

      // Speech has been detected, now monitor for silence
      if (rms < SILENCE_THRESHOLD) {
        // Silence detected
        if (silenceStartTimeRef.current === null) {
          silenceStartTimeRef.current = Date.now();
          console.log('Silence started');
        } else {
          const silenceDuration = Date.now() - silenceStartTimeRef.current;
          const recordingDuration = recordingStartTimeRef.current
            ? Date.now() - recordingStartTimeRef.current
            : 0;

          // Only auto-submit if we've been recording for at least MIN_RECORDING_DURATION
          if (recordingDuration >= MIN_RECORDING_DURATION && silenceDuration >= SILENCE_DURATION) {
            // Auto-submit after silence duration
            console.log('Silence duration reached - auto-submitting');
            stopRecording();
            return;
          }
        }
      } else {
        // Audio detected, reset silence timer
        if (silenceStartTimeRef.current !== null) {
          console.log('Audio detected - resetting silence timer');
        }
        silenceStartTimeRef.current = null;
      }

      // Continue monitoring
      silenceDetectionTimerRef.current = setTimeout(checkAudioLevel, 100);
    };

    checkAudioLevel();
  };

  const stopSilenceDetection = () => {
    if (silenceDetectionTimerRef.current) {
      clearTimeout(silenceDetectionTimerRef.current);
      silenceDetectionTimerRef.current = null;
    }
    silenceStartTimeRef.current = null;
  };

  const cancelRecording = () => {
    console.log('Cancelling recording...');
    if (mediaRecorderRef.current && isRecordingRef.current) {
      stopSilenceDetection();
      isRecordingRef.current = false;

      // Stop the recorder without processing
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        // Just clean up, don't process
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        // Stop all tracks
        const stream = mediaRecorderRef.current?.stream;
        stream?.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear the chunks
      audioChunksRef.current = [];

      console.log('Recording cancelled');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      console.log('Stopping recording...');
      stopSilenceDetection();
      isRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      console.log('Cannot stop - mediaRecorder:', !!mediaRecorderRef.current, 'isRecording:', isRecordingRef.current);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!user) {
      setError('You must be signed in to use voice mode');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResponse(''); // Clear previous response
    setShowTranscriptOnly(true); // Show only transcript while processing

    try {
      // Send audio to backend for processing with Gemini
      const result = await sendVoiceMessage(audioBlob, chatId);

      setTranscript(result.transcript);
      setResponse(result.responseText);
      setShowTranscriptOnly(false); // Show response once processing is complete

      // Notify parent component that chat was updated
      if (onChatUpdated && result.chatId) {
        onChatUpdated(result.chatId);
      }

      console.log('Voice message result:', {
        hasAudioData: !!result.audioData,
        audioDataType: typeof result.audioData,
        audioDataLength: result.audioData?.length,
        audioDataPreview: result.audioData?.substring(0, 50)
      });

      // Play TTS audio if available, otherwise use Web Speech API
      if (result.audioData && !isMuted) {
        setCurrentAudioData(result.audioData);
        setHasAudioToPlay(true);
        await playAudio(result.audioData);
      } else if (!isMuted) {
        console.log('No audio data, using Web Speech API fallback');
        // Fallback to Web Speech API
        speakText(result.responseText);
      }
    } catch (err: any) {
      console.error('Error processing audio:', err);
      setError(err.message || 'Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Playback control functions
  const stopAudio = () => {
    // Stop HTML audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }

    // Stop Web Audio API source node
    if (audioSourceNodeRef.current) {
      try {
        audioSourceNodeRef.current.stop();
        audioSourceNodeRef.current.disconnect();
      } catch (e) {
        // Already stopped
      }
      audioSourceNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {
        // Already closed
      }
      audioContextRef.current = null;
    }

    // Cancel Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsAudioPaused(false);
  };

  const pauseAudio = () => {
    if (audioElementRef.current && !audioElementRef.current.paused) {
      audioElementRef.current.pause();
      setIsAudioPaused(true);
      setIsSpeaking(true); // Keep speaking state true so we know there's audio to resume
    }
    // Use AudioContext.suspend() for Web Audio API (PCM audio)
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
      setIsAudioPaused(true);
      setIsSpeaking(true);
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsAudioPaused(true);
      setIsSpeaking(true);
    }
  };

  const resumeAudio = () => {
    if (audioElementRef.current && audioElementRef.current.paused && isAudioPaused) {
      audioElementRef.current.play();
      setIsAudioPaused(false);
      setIsSpeaking(true);
    }
    // Use AudioContext.resume() for Web Audio API (PCM audio)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      setIsAudioPaused(false);
      setIsSpeaking(true);
    }
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsAudioPaused(false);
      setIsSpeaking(true);
    }
  };

  const restartAudio = async () => {
    stopAudio();
    if (currentAudioData) {
      await playAudio(currentAudioData);
    } else if (response) {
      speakText(response);
    }
  };

  const playAudio = async (audioData: string) => {
    try {
      console.log('playAudio called with audioData:', audioData?.substring(0, 100));
      setIsSpeaking(true);
      setIsAudioPaused(false);

      // Check if audioData is a data URL or pure base64
      let base64Audio = audioData;
      let mimeType = 'audio/mp3';

      if (audioData.startsWith('data:')) {
        // Extract mime type and base64 from data URL
        const mimeMatch = audioData.match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        base64Audio = audioData.split(',')[1];
      }

      console.log('Audio format:', mimeType, 'Base64 length:', base64Audio.length);

      // Special handling for PCM audio (L16)
      if (mimeType.includes('L16') || mimeType.includes('pcm')) {
        console.log('Detected PCM audio, using Web Audio API');
        await playPCMAudio(audioData);
        return;
      }

      // For other formats, use standard audio element
      const audioBlob = base64ToBlob(base64Audio, mimeType);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }

      // Set up event listeners for proper state tracking
      audioElementRef.current.onplay = () => {
        setIsSpeaking(true);
        setIsAudioPaused(false);
      };

      audioElementRef.current.onpause = () => {
        // Only set paused if we haven't explicitly ended
        if (audioElementRef.current && audioElementRef.current.currentTime < audioElementRef.current.duration) {
          setIsAudioPaused(true);
        }
      };

      audioElementRef.current.onended = () => {
        setIsSpeaking(false);
        setIsAudioPaused(false);
        URL.revokeObjectURL(audioUrl);
        // Auto-enable mic after DMN finishes speaking for natural conversation flow
        if (!isMuted) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
      };

      audioElementRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsSpeaking(false);
        setIsAudioPaused(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioElementRef.current.src = audioUrl;
      await audioElementRef.current.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsSpeaking(false);
      setIsAudioPaused(false);

      // Fallback to Web Speech API TTS
      speakText(response);
    }
  };

  const playPCMAudio = async (dataUrl: string) => {
    try {
      // Parse the data URL to extract PCM parameters
      const match = dataUrl.match(/data:audio\/L16;codec=pcm;rate=(\d+);base64,(.+)/);
      if (!match) {
        throw new Error('Invalid PCM data URL format');
      }

      const sampleRate = parseInt(match[1]);
      const base64Data = match[2];

      console.log('PCM sample rate:', sampleRate);

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to 16-bit PCM samples
      const pcmData = new Int16Array(bytes.buffer);
      console.log('PCM samples:', pcmData.length);

      // Create audio context if needed (don't close it until we're done)
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Created new AudioContext for PCM playback');
      }

      // Create audio buffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        pcmData.length,
        sampleRate
      );

      // Copy PCM data to audio buffer (normalize to -1.0 to 1.0)
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0; // Normalize 16-bit to float
      }

      // Create buffer source and play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      // Store reference so we can stop it later
      audioSourceNodeRef.current = source;

      source.onended = () => {
        setIsSpeaking(false);
        audioSourceNodeRef.current = null;
        // Auto-enable mic after DMN finishes speaking for natural conversation flow
        if (!isMuted) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
      };

      source.start(0);
      console.log('PCM audio playback started');
    } catch (err) {
      console.error('Error playing PCM audio:', err);
      setIsSpeaking(false);
      throw err;
    }
  };

  // Fallback TTS using Web Speech API
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech not supported in this browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Auto-enable mic after DMN finishes speaking for natural conversation flow
        if (!isMuted) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setError('Text-to-speech failed');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // When muting, stop all currently playing audio
    if (newMutedState) {
      stopAudio();
    }
  };

  const handleEndCall = () => {
    console.log('handleEndCall called - cleaning up');

    // Stop silence detection
    stopSilenceDetection();

    // Stop recording if active
    if (mediaRecorderRef.current && isRecordingRef.current) {
      try {
        mediaRecorderRef.current.stop();
        const stream = mediaRecorderRef.current.stream;
        stream?.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track on close:', track.kind);
        });
      } catch (e) {
        console.log('MediaRecorder already stopped');
      }
    }
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }

    // Stop all audio playback (including Web Audio API and Web Speech API)
    stopAudio();

    // Reset all state
    setIsProcessing(false);
    setIsSpeaking(false);
    setIsAudioPaused(false);
    setHasAudioToPlay(false);
    setCurrentAudioData(null);
    setTranscript('');
    setResponse('');
    setError(null);

    // Call parent's onClose
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleEndCall}
    >
      <div
        className="relative w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-sky-900/30 to-purple-900/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Voice Conversation (BETA)</h2>
              <p className="text-sm text-slate-400 mt-1">Speak naturally with DMN</p>
            </div>
            <button
              onClick={handleEndCall}
              className="p-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
              title="End conversation"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="p-8 min-h-[400px] flex-1 overflow-y-auto flex flex-col items-center justify-center">

          {/* Status Indicator */}
          <div className="mb-8">
            {isRecording && (
              <div className="flex items-center space-x-3 text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center space-x-3 text-sky-400">
                <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Processing...</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center space-x-3 text-purple-400">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">DMN is speaking...</span>
              </div>
            )}
            {!isRecording && !isProcessing && !isSpeaking && (
              <div className="text-slate-400 text-sm text-center">
                <div>Tap the microphone to start speaking</div>
                <div className="text-xs mt-1 text-slate-500">Speech will auto-submit after 2 seconds of silence</div>
              </div>
            )}
          </div>

          {/* Microphone Button */}
          <button
            onClick={isRecording ? cancelRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            className={`
              relative w-32 h-32 rounded-full transition-all duration-300 shadow-2xl
              ${isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110'
                : 'bg-gradient-to-br from-sky-500 to-sky-600 hover:scale-105'
              }
              ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              disabled:scale-100
            `}
          >
            <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
            {isRecording ? (
              <MicOff className="w-16 h-16 text-white absolute inset-0 m-auto" />
            ) : (
              <Mic className="w-16 h-16 text-white absolute inset-0 m-auto" />
            )}
          </button>

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-8 w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-2">You said:</div>
              <div className="text-slate-200">{transcript}</div>
            </div>
          )}

          {/* Response Display */}
          {response && !showTranscriptOnly && (
            <div className="mt-4 w-full bg-sky-900/20 rounded-xl p-4 border border-sky-700/50">
              <div className="text-xs font-semibold text-sky-400 uppercase mb-2">DMN responds:</div>
              <div className="text-slate-200 prose prose-invert prose-sm max-w-none">
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
                      <a href={href} className="text-sky-400 hover:text-sky-300 underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-sky-300">{children}</strong>,
                    em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-sky-300">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 text-sky-300">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-sky-300">{children}</h3>,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 w-full bg-red-900/20 rounded-xl p-4 border border-red-700/50">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center justify-center space-x-4">
            {/* Playback Controls - Show when audio is available */}
            {hasAudioToPlay && (
              <>
                <button
                  onClick={stopAudio}
                  disabled={!isSpeaking && !isAudioPaused}
                  className={`
                    p-3 rounded-full transition-colors
                    ${(!isSpeaking && !isAudioPaused)
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }
                  `}
                  title="Stop audio"
                >
                  <Square className="w-5 h-5" />
                </button>

                <button
                  onClick={isAudioPaused ? resumeAudio : pauseAudio}
                  disabled={!isSpeaking && !isAudioPaused}
                  className={`
                    p-3 rounded-full transition-colors
                    ${(!isSpeaking && !isAudioPaused)
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }
                  `}
                  title={isAudioPaused ? 'Resume audio' : 'Pause audio'}
                >
                  {isAudioPaused ? (
                    <Play className="w-5 h-5" />
                  ) : (
                    <Pause className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={restartAudio}
                  disabled={isProcessing}
                  className={`
                    p-3 rounded-full transition-colors
                    ${isProcessing
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }
                  `}
                  title="Restart audio"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Volume Control */}
            <button
              onClick={toggleMute}
              className={`
                p-3 rounded-full transition-colors
                ${isMuted
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }
              `}
              title={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <div className="text-xs text-slate-500">
              {isMuted ? 'Audio muted' : 'Audio enabled'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoiceConversation;
