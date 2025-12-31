# Voice Conversation Feature - Implementation Guide

## Overview

The voice conversation feature enables users to have natural, spoken interactions with DMN using Gemini's multimodal capabilities combined with browser-based speech recognition and text-to-speech.

## Features Implemented

### Frontend Components

1. **VoiceConversation.tsx** - Main voice conversation UI
   - Real-time microphone recording
   - Live transcription display
   - Audio playback controls
   - Visual feedback for recording/processing/speaking states
   - Mute/unmute controls
   - Error handling and user feedback

2. **MessageInput.tsx** - Updated with voice button
   - Purple microphone button for easy access
   - Integrates seamlessly with existing chat interface
   - Disabled during typing/processing

3. **voiceService.ts** - Voice communication service
   - Audio recording and encoding
   - Communication with Firebase Cloud Function
   - Browser capability detection
   - Base64 audio conversion utilities

### Backend Functions

1. **sendVoiceMessage.ts** - Firebase Cloud Function
   - Processes audio input with Gemini multimodal API
   - Transcribes speech to text
   - Generates contextual AI responses
   - Saves conversation to user's chat history
   - Returns response text and optional TTS audio
   - Integrates with journey-based guidance

## How It Works

### User Flow

1. **Initiate Conversation**: User clicks the purple microphone button in MessageInput
2. **Permission Check**: Browser requests microphone permission
3. **Recording**: User speaks naturally; visual indicator shows recording state
4. **Processing**:
   - Audio is encoded as base64 WebM
   - Sent to Firebase Cloud Function
   - Gemini transcribes audio to text
   - Gemini generates contextual response
5. **Playback**:
   - Response text is displayed
   - Audio playback (Web Speech API fallback if Gemini TTS unavailable)
6. **Continue or End**: User can continue conversation or end call

### Technical Architecture

```markdown
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VoiceConversation Component                         │   │
│  │  - MediaRecorder API (audio capture)                 │   │
│  │  - Web Speech Recognition (live transcription)       │   │
│  │  - Web Speech Synthesis (TTS fallback)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         ↓ ↑ (base64 audio)
┌─────────────────────────────────────────────────────────────┐
│              Firebase Cloud Function                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  sendVoiceMessage                                    │   │
│  │  1. Decode audio from base64                         │   │
│  │  2. Send to Gemini for transcription                 │   │
│  │  3. Load conversation history + system prompt        │   │
│  │  4. Generate response with Gemini                    │   │
│  │  5. Save to Firestore                                │   │
│  │  6. Return transcript + response + optional TTS      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                 Google Gemini API                           │
│  - gemini-2.5-flash (transcription + chat)                  │
│  - gemini-2.5-flash-preview-tts (TTS - when available)      │
└─────────────────────────────────────────────────────────────┘
```

## Browser Requirements

### Required APIs

- **MediaDevices.getUserMedia**: Microphone access
- **MediaRecorder**: Audio recording
- **AudioContext**: Audio processing and playback

### Optional APIs (Fallbacks)

- **Web Speech Recognition**: Live transcription preview
- **SpeechSynthesis**: Client-side TTS fallback

### Supported Browsers

- Chrome/Edge: Full support ✅
- Firefox: Full support ✅
- Safari: Partial support (no Web Speech Recognition) ⚠️
- Mobile browsers: Check device-specific limitations

## Configuration

### Environment Variables

No additional environment variables required beyond existing Gemini API key:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

### Gemini Models Used

1. **Transcription & Chat**: `gemini-2.5-flash`
   - Fast and accurate transcription
   - Contextual conversation
   - 1M token context window

2. **TTS (Future)**: `gemini-2.5-flash-preview-tts`
   - Currently in preview
   - Will provide natural voice synthesis
   - Fallback to Web Speech API until fully available

## Usage Instructions

### For Users

1. **Start Voice Conversation**:
   - Click purple microphone button in chat
   - Allow microphone permissions when prompted

2. **Speak Your Question**:
   - Press and hold the large microphone button
   - Speak naturally
   - Release when finished

3. **Listen to Response**:
   - DMN's response will be read aloud
   - Text is also displayed on screen

4. **Continue Conversation**:
   - Tap microphone again for follow-up questions
   - Previous context is maintained

5. **End Conversation**:
   - Click red phone icon to end session
   - Conversation is saved to chat history

### For Developers

#### Adding Voice Support to New Features

```typescript
import { sendVoiceMessage } from '@/services/voiceService';

// Record audio
const mediaRecorder = new MediaRecorder(stream);
// ... recording logic ...

// Send to backend
const result = await sendVoiceMessage(audioBlob, journeyId);
console.log(result.transcript); // User's transcribed speech
console.log(result.responseText); // AI response
console.log(result.audioData); // Optional TTS audio (base64)
```

#### Customizing System Prompt

Update the system prompt in Firebase:

```typescript
// In Firebase Console or via admin SDK
db.collection('systemConfig').doc('settings').update({
  systemPrompt: `Your custom prompt for voice conversations...`
});
```

## Firestore Data Structure

### Voice Conversations

Stored in user's chats collection with special flag:

```typescript
{
  chatId: "auto-generated",
  title: "Voice Conversation",
  isVoiceConversation: true,
  journeyId: "optional-journey-id",
  messages: [
    {
      role: "user",
      text: "transcribed user speech",
      isVoiceMessage: true,
      timestamp: Timestamp
    },
    {
      role: "model",
      text: "AI response",
      isVoiceMessage: true,
      timestamp: Timestamp
    }
  ]
}
```

## Performance Considerations

1. **Audio Encoding**: WebM format, typically 10-50KB per utterance
2. **Latency**:
   - Transcription: ~1-2 seconds
   - Response generation: ~2-4 seconds
   - Total: ~3-6 seconds round trip
3. **Rate Limiting**: Standard Firebase function limits apply
4. **Token Usage**: Shorter responses optimized for voice (2-3 sentences)

## Limitations & Future Improvements

### Current Limitations

1. **Gemini TTS API**: Still in preview, using Web Speech API fallback
2. **Background Noise**: May affect transcription accuracy
3. **Language**: Currently optimized for English only
4. **Continuous Conversation**: Requires manual button press for each turn

### Planned Enhancements

1. **Continuous Listening**: "Hey DMN" wake word detection
2. **Emotion Detection**: Analyze voice tone and adjust responses
3. **Multi-language Support**: Expand beyond English
4. **Native TTS**: Full integration when Gemini TTS API is production-ready
5. **Offline Mode**: Cache responses for common questions
6. **Voice Profiles**: Personalized voice preferences

## Troubleshooting

### "Microphone access denied"

- **Solution**: Check browser permissions, ensure HTTPS connection

### "Voice mode not supported"

- **Solution**: Verify browser compatibility, check required APIs

### "Failed to process audio"

- **Solution**: Check Firebase function logs, verify Gemini API key

### No audio playback

- **Solution**: Check mute settings, verify browser audio permissions

### Poor transcription quality

- **Solution**: Reduce background noise, speak clearly, check microphone quality

## Testing

### Manual Testing Checklist

- [ ] Microphone permission prompt appears
- [ ] Recording indicator shows during capture
- [ ] Transcription appears after recording
- [ ] AI response is generated
- [ ] Audio plays back correctly
- [ ] Mute toggle works
- [ ] End call properly cleans up
- [ ] Conversation saves to history
- [ ] Works on mobile browsers
- [ ] Journey context is applied correctly

### Automated Testing

```bash
# Run frontend tests
cd frontend
npm test -- VoiceConversation.test.tsx

# Test voice service
npm test -- voiceService.test.ts

# Test Firebase function
cd firebase-functions
npm test -- sendVoiceMessage.test.ts
```

## Security & Privacy

1. **Audio Data**: Never stored permanently, only transmitted for processing
2. **Transcripts**: Saved to user's private Firestore collection
3. **Permissions**: Microphone access required, requested explicitly
4. **HTTPS**: Required for MediaRecorder API
5. **Authentication**: User must be signed in

## Resources

- [Gemini Multimodal API Docs](https://ai.google.dev/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## Support

For issues or questions:

1. Check browser console for errors
2. Review Firebase function logs
3. Verify Gemini API quota
4. Open GitHub issue with details

---

> **Built with ❤️ for the journey of awakening**

*Voice conversation brings DMN closer to natural human interaction, making the framework more accessible and engaging.*
