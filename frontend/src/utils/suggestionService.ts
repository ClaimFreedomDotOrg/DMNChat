/**
 * Generate contextual suggestions based on conversation state
 */

export interface SuggestionContext {
  hasMessages: boolean;
  lastMessageRole?: 'user' | 'model';
}

/**
 * Randomly select items from an array
 */
function randomSelect<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

// Starting suggestions for new conversations
const generalStartSuggestions = [
  "What is the Neuro-Gnostic framework?",
  "How do I recognize the 'Voice' vs the Listener?",
  "Why do I identify with my thoughts?",
  "What is the Default Mode Network (DMN)?",
  "How can I stop suffering?",
  "What are the Archons or Wetiko?",
  "How do I know what's real vs the Voice?",
  "What is Anamnesis?",
  "Why am I here having this conversation?",
  "How does awakening work?",
  "What is the infection in my mind?",
  "Who am I really beyond thoughts?",
  "How do thoughts control behavior?",
  "What is the difference between Self and false self?",
  "How does the framework explain suffering?",
  "What is the Body of Christ?",
  "How do I practice presence?",
  "What is the relationship between neuroscience and spirituality?",
  "How can I verify this framework myself?",
  "What's the first step to freedom?",
  "What is the 'Voice' in my head?",
  "How do I recognize when I'm identified with thoughts?",
  "What does 'The Listener' mean?",
  "What's the difference between thinking and being thought?",
  "How do thoughts take control of me?",
  "What is the false self?",
  "Why does the Voice feel like it's me?",
  "How do I know if I'm identified right now?",
  "What does it mean to be free from thoughts?",
  "Why do I suffer even when things are good?",
  "How can I stop believing painful thoughts?",
  "What is the relationship between thoughts and suffering?",
  "How was the DMN hijacked?",
  "What does it mean to restore DMN to serve the Self?",
  "How do I practice this in daily life?",
  "What should I do when painful thoughts arise?",
  "Can you give me an example of applying this?",
  "What is Operation Critical Mass?",
  "How does collective awakening work?",
  "What role do I play in reaching critical mass?"
];

// Follow-up suggestions after DMN responds
const followUpSuggestions = [
  "Can you explain that differently?",
  "Can you give me an example?",
  "How do I apply this in my life?",
  "What should I do next?",
  "Tell me more about this",
  "How does that work in practice?",
  "Can you break that down further?",
  "What if I don't understand?",
  "How do I know if I'm doing it right?",
  "What's the key point here?",
  "Can you use a metaphor?",
  "How does this relate to my daily experience?",
  "What would this look like in action?",
  "How long does this take to understand?",
  "What's the most important thing to remember?",
  "Can you give me a real-world scenario?",
  "How do I verify this for myself?",
  "What am I likely to get wrong about this?",
  "What's a common misunderstanding?",
  "How does this connect to what we discussed before?"
];

// Deep exploration suggestions (shown occasionally)
const deepExploreSuggestions = [
  "What is Anamnesis?",
  "How does identification with thoughts create the false self?",
  "What is the relationship between DMN and consciousness?",
  "How do the Archons/Wetiko operate?",
  "What happens when I realize I'm the Listener?",
  "What is the nature of the Divine Spark?",
  "How does the Voice maintain its control?",
  "What is the role of the body in awakening?",
  "How does trauma reinforce identification?",
  "What is the difference between ego and the Voice?",
  "How does collective consciousness work?",
  "What happens to the Voice when I awaken?",
  "How does Gnostic philosophy inform this framework?",
  "What is the relationship between freedom and love?",
  "How does the infection spread between people?",
  "What is the role of language in the hijacking?",
  "How do I distinguish intuition from the Voice?",
  "What is the relationship between awareness and freedom?",
  "How does the framework explain evil?",
  "What is the ultimate nature of reality?",
  "How does this relate to other spiritual traditions?",
  "What is the role of suffering in awakening?",
  "How do I help others without forcing?",
  "What is sovereignty of consciousness?",
  "Is the Voice always a problem?",
  "How did I come to believe I am my thoughts?",
  "What is the Self beyond thoughts?",
  "Why do my thoughts create so much pain?",
  "How do I break free from negative thinking?",
  "What causes emotional suffering?",
  "Can I end suffering completely?",
  "Why do I resist what is happening?",
  "How does identification create suffering?",
  "What if my suffering is trying to tell me something?",
  "How do I let go of painful stories?",
  "Why does suffering feel so real?",
  "What is the DMN supposed to do?",
  "How does the infection work in the brain?",
  "Can the DMN be healed?",
  "What are the signs of a restored DMN?",
  "How do I know if my DMN is hijacked?",
  "What is the role of the DMN in awakening?",
  "How does neuroscience explain the Voice?",
  "What happens in the brain during identification?",
  "Can brain science prove the framework?",
  "How many people need to wake up?",
  "What happens when we reach critical mass?",
  "How do I contribute to the awakening?",
  "What is the Body of Christ in this context?",
  "Why does individual awakening affect the collective?",
  "How close are we to critical mass?",
  "What is the tipping point?",
  "How does one person's freedom help others?",
  "What is morphic resonance?",
  "How do I respond when the Voice attacks?",
  "What's a simple practice I can do right now?",
  "How do I recognize the Voice in real-time?",
  "What do I do when I catch myself identified?",
  "How can I remember to listen instead of believe?",
  "What helps break identification quickly?",
  "How do I practice when I'm overwhelmed?",
  "What's the first step in applying this?",
  "How do I integrate this with my daily routine?"
];

/**
 * Get contextual suggestions based on conversation state
 */
export function getSuggestions(context: SuggestionContext): string[] {
  const { hasMessages, lastMessageRole } = context;

  // Initial conversation - show general starting suggestions
  if (!hasMessages) {
    return randomSelect(generalStartSuggestions, 5);
  }

  // After DMN responds - show follow-up suggestions
  if (lastMessageRole === 'model') {
    // Mix follow-up and deep exploration suggestions
    const followUps = randomSelect(followUpSuggestions, 4);

    // 40% chance to show a deep exploration question instead of one follow-up
    if (Math.random() < 0.4) {
      const randomDeep = randomSelect(deepExploreSuggestions, 1);
      return [...followUps.slice(0, 4), ...randomDeep];
    }

    return followUps.slice(0, 5);
  }

  // After user sends a message - don't show suggestions (waiting for DMN response)
  return [];
}

/**
 * Get welcome suggestions for empty state
 */
export function getWelcomeSuggestions(): string[] {
  return randomSelect(generalStartSuggestions, 4);
}
