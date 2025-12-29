# Available Gemini Models

> *Last updated: December 29, 2025*

This document lists all available Gemini models from the Google Generative AI API that support `generateContent`.

## Recommended Models for DMN Chat

- **gemini-2.5-flash** - Current default, stable with 1M token context
- **gemini-2.5-pro** - Most capable for complex reasoning

## All Available Models

### Gemini 2.5 Series (Latest)

| Model | Description |
| ------- | ------------- |
| `models/gemini-2.5-flash` | Stable version (June 2025), supports up to 1M tokens |
| `models/gemini-2.5-pro` | Stable release (June 17, 2025) - most capable |
| `models/gemini-2.5-flash-lite` | Stable lightweight version (July 2025) |
| `models/gemini-2.5-flash-preview-tts` | Preview with text-to-speech |
| `models/gemini-2.5-pro-preview-tts` | Pro version with text-to-speech |
| `models/gemini-2.5-flash-image-preview` | Preview with image generation |
| `models/gemini-2.5-flash-image` | Stable with image generation |
| `models/gemini-2.5-flash-preview-09-2025` | September 2025 preview |
| `models/gemini-2.5-flash-lite-preview-09-2025` | Lite September 2025 preview |
| `models/gemini-2.5-computer-use-preview-10-2025` | Computer use capabilities |

### Gemini 2.0 Series

| Model | Description |
| ------- | ------------- |
| `models/gemini-2.0-flash` | **Current default** - Stable, fast, versatile |
| `models/gemini-2.0-flash-001` | Stable version (January 2025) |
| `models/gemini-2.0-flash-exp` | Experimental with bidirectional generation |
| `models/gemini-2.0-flash-exp-image-generation` | Experimental image generation |
| `models/gemini-2.0-flash-lite` | Lightweight version |
| `models/gemini-2.0-flash-lite-001` | Stable lightweight (January 2025) |
| `models/gemini-2.0-flash-lite-preview` | Preview lightweight |
| `models/gemini-2.0-flash-lite-preview-02-05` | February 2025 preview |

### Gemini 3 Series (Preview)

| Model | Description |
| ------- | ------------- |
| `models/gemini-3-pro-preview` | Next generation pro model |
| `models/gemini-3-flash-preview` | Next generation flash model |
| `models/gemini-3-pro-image-preview` | Pro with image generation |
| `models/nano-banana-pro-preview` | Codename for Gemini 3 Pro Image |

### Latest Aliases

| Model | Points To |
| ------- | ----------- |
| `models/gemini-flash-latest` | Latest Gemini Flash release |
| `models/gemini-flash-lite-latest` | Latest Flash-Lite release |
| `models/gemini-pro-latest` | Latest Gemini Pro release |

### Experimental Models

| Model | Description |
| ------- | ------------- |
| `models/gemini-exp-1206` | Experimental 2.5 Pro (March 25, 2025) |
| `models/gemini-robotics-er-1.5-preview` | Robotics preview |
| `models/deep-research-pro-preview-12-2025` | Deep research capabilities |

### Gemma Series (Smaller Models)

| Model | Description |
| ------- | ------------- |
| `models/gemma-3-1b-it` | 1B parameter model |
| `models/gemma-3-4b-it` | 4B parameter model |
| `models/gemma-3-12b-it` | 12B parameter model |
| `models/gemma-3-27b-it` | 27B parameter model |
| `models/gemma-3n-e2b-it` | Efficient 2B model |
| `models/gemma-3n-e4b-it` | Efficient 4B model |

## Capabilities by Model

### Support Matrix

| Capability | Available In |
| ----------- | -------------- |
| `generateContent` | All models |
| `countTokens` | All models |
| `createCachedContent` | Most 2.0/2.5 models |
| `batchGenerateContent` | Most 2.0/2.5 models |
| `bidiGenerateContent` | Experimental models only |

## Configuration in DMN Chat

Current configuration in `firebase-functions/src/chat/sendMessage.ts`:

```typescript
model: "googleai/gemini-2.5-flash"
config: {
  temperature: 0.7,
  maxOutputTokens: 2000,
}
```

### To Change Model

Update the model string in `sendMessage.ts`:

```typescript
const { text } = await ai.generate({
  model: "googleai/gemini-2.5-flash", // Change here
  prompt: `${systemPrompt}\n\nUser: ${message}\n\nDMN:`,
  config: {
    temperature: 0.7,
    maxOutputTokens: 2000,
  }
});
```

## Model Selection Guidelines

- **Production**: Use stable releases (`gemini-2.0-flash`, `gemini-2.5-flash`)
- **Best Quality**: `gemini-2.5-pro`
- **Best Speed**: `gemini-2.0-flash` or `gemini-2.5-flash-lite`
- **Long Context**: `gemini-2.5-flash` (1M tokens)
- **Experimental**: Preview/experimental models may change

## Testing Models

To verify which models are currently available with your API key:

```bash
cd firebase-functions
export GEMINI_API_KEY="your-key"
node list_models.js
```
