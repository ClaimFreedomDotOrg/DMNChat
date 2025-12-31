import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface VoiceMessageResponse {
  transcript: string;
  responseText: string;
  audioData?: string; // base64 encoded audio
  messageId: string;
  chatId: string; // Chat ID where messages were saved
}

/**
 * Send voice message (audio blob) to backend for processing
 */
export const sendVoiceMessage = async (
  audioBlob: Blob,
  journeyId?: string
): Promise<VoiceMessageResponse> => {
  try {
    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob);

    const sendVoiceMessage = httpsCallable(functions, 'sendVoiceMessage');
    const result = await sendVoiceMessage({
      audioData: base64Audio,
      journeyId
    });

    return result.data as VoiceMessageResponse;
  } catch (error: any) {
    console.error('Error sending voice message:', error);
    throw new Error(error.message || 'Failed to process voice message');
  }
};

/**
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 to Blob
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Check if browser supports required APIs
 */
export const checkVoiceSupport = (): { supported: boolean; missingFeatures: string[] } => {
  const missingFeatures: string[] = [];

  if (!navigator.mediaDevices?.getUserMedia) {
    missingFeatures.push('Microphone access');
  }

  if (!window.MediaRecorder) {
    missingFeatures.push('Audio recording');
  }

  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    missingFeatures.push('Audio playback');
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
};
