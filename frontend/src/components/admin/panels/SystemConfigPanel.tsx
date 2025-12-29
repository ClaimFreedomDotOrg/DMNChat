import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { SystemConfig } from '@/types';
import { getSystemConfig, updateSystemConfigService } from '@/services/adminService';
import { DEFAULT_SYSTEM_CONFIG } from '@/config/systemDefaults';

interface SystemConfigPanelProps {
  onConfigSaved?: () => void;
}

const SystemConfigPanel: React.FC<SystemConfigPanelProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedConfig = await getSystemConfig();
      setConfig(loadedConfig);
    } catch (err: unknown) {
      console.error('Error loading config:', err);
      setError('Failed to load configuration. Using defaults.');
      setConfig(DEFAULT_SYSTEM_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const updatedConfig = await updateSystemConfigService(config);
      setConfig(updatedConfig);
      setSaved(true);
      onConfigSaved?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      console.error('Error saving config:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-slate-400">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-200 mb-2">System Configuration</h2>
          <p className="text-slate-400">Configure AI model parameters and RAG settings</p>
        </div>
        <button
          onClick={loadConfig}
          disabled={loading}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          title="Reload configuration"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 px-4 py-3 bg-red-900/20 border border-red-900/50 rounded-lg">
          <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

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
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Select the AI model to use for generating responses
              </p>
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
                  ai: { ...config.ai, maxTokens: parseInt(e.target.value) || 2000 }
                })}
                min={100}
                max={32000}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Maximum length of generated responses (100-32000)
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
                    rag: { ...config.rag, chunkSize: parseInt(e.target.value) || 1500 }
                  })}
                  min={100}
                  max={10000}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Characters per chunk (100-10000)</p>
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
                    rag: { ...config.rag, chunkOverlap: parseInt(e.target.value) || 200 }
                  })}
                  min={0}
                  max={1000}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Overlap between chunks (0-1000)</p>
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
                    rag: { ...config.rag, maxChunks: parseInt(e.target.value) || 5 }
                  })}
                  min={1}
                  max={50}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Number of relevant chunks (1-50)</p>
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
            rows={16}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            placeholder="Enter system prompt..."
          />
          <p className="text-xs text-slate-500 mt-2">
            This prompt defines DMN's persona and behavior. Character count: {config.systemPrompt.length}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Configuration
              </>
            )}
          </button>

          {saved && (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">Configuration saved successfully</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPanel;
