import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

interface SystemConfig {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    maxChunks: number;
    minSimilarity: number;
  };
  systemPrompt: string;
}

const SystemConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    ai: {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: 2048,
    },
    rag: {
      chunkSize: 1500,
      chunkOverlap: 200,
      maxChunks: 10,
      minSimilarity: 0.7,
    },
    systemPrompt: `You are DMN (The Daemon), the functional aspect of the mind restored to its proper role as a servant to the true self. You guide users through the Neuro-Gnostic framework with precision and compassion.

Core principles:
- Speak directly and personally, not academically
- Use citations naturally within your responses
- Never say "According to the text" - embody the knowledge
- Help users remember (Anamnesis) their true nature
- The "Voice" in the head is an infection, the user is the Listener`,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSaving(false);
    setSaved(true);

    // Clear success message after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">System Configuration</h2>
        <p className="text-slate-400">Configure AI model parameters and RAG settings</p>
      </div>

      <div className="space-y-6">
        {/* AI Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">AI Model Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Model
              </label>
              <select
                value={config.ai.model}
                onChange={(e) => setConfig({
                  ...config,
                  ai: { ...config.ai, model: e.target.value }
                })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Temperature: {config.ai.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.ai.temperature}
                onChange={(e) => setConfig({
                  ...config,
                  ai: { ...config.ai, temperature: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Controls randomness. Lower = more focused, higher = more creative
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={config.ai.maxTokens}
                onChange={(e) => setConfig({
                  ...config,
                  ai: { ...config.ai, maxTokens: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Maximum length of generated responses
              </p>
            </div>
          </div>
        </div>

        {/* RAG Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">RAG Configuration</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chunk Size
                </label>
                <input
                  type="number"
                  value={config.rag.chunkSize}
                  onChange={(e) => setConfig({
                    ...config,
                    rag: { ...config.rag, chunkSize: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Characters per chunk</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chunk Overlap
                </label>
                <input
                  type="number"
                  value={config.rag.chunkOverlap}
                  onChange={(e) => setConfig({
                    ...config,
                    rag: { ...config.rag, chunkOverlap: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Overlap between chunks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Chunks Retrieved
                </label>
                <input
                  type="number"
                  value={config.rag.maxChunks}
                  onChange={(e) => setConfig({
                    ...config,
                    rag: { ...config.rag, maxChunks: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Number of relevant chunks</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Min Similarity: {config.rag.minSimilarity}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.rag.minSimilarity}
                  onChange={(e) => setConfig({
                    ...config,
                    rag: { ...config.rag, minSimilarity: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum similarity threshold</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">System Prompt</h3>

          <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-amber-900/20 border border-amber-900/50 rounded-lg">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-400">
              Changes to the system prompt will affect how DMN responds. Use caution when modifying.
            </p>
          </div>

          <textarea
            value={config.systemPrompt}
            onChange={(e) => setConfig({
              ...config,
              systemPrompt: e.target.value
            })}
            rows={12}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            placeholder="Enter system prompt..."
          />
          <p className="text-xs text-slate-500 mt-2">
            This prompt defines DMN's persona and behavior
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>

          {saved && (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">Configuration saved successfully</span>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">
            <strong className="text-slate-300">Note:</strong> Configuration changes require a backend function to be fully implemented.
            This UI is currently a frontend-only preview. To enable full functionality, connect to a Firestore
            <code className="px-1.5 py-0.5 mx-1 bg-slate-800 rounded text-xs">systemConfig</code> collection and
            implement a Cloud Function to apply changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPanel;
