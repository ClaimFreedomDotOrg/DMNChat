/**
 * Journey Manager Component (Admin Panel)
 *
 * Allows admins to create, edit, and manage journeys
 */

import React, { useState } from 'react';
import { Journey } from '@/types';
import { useAllJourneys } from '@/hooks/useJourneys';
import { createJourney, updateJourney, deleteJourney } from '@/services/journeyService';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit2, Trash2, Save, X, Loader2, Compass, Eye, EyeOff } from 'lucide-react';

const JourneyManager: React.FC = () => {
  const { user } = useAuth();
  const { journeys, loading } = useAllJourneys();

  const [editingJourney, setEditingJourney] = useState<Partial<Journey> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingJourney({
      title: '',
      description: '',
      systemPrompt: '',
      icon: '🧭',
      order: journeys.length,
      isActive: true,
    });
    setIsCreating(true);
    setError(null);
  };

  const handleEdit = (journey: Journey) => {
    setEditingJourney(journey);
    setIsCreating(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditingJourney(null);
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingJourney) return;

    // Validation
    if (!editingJourney.title?.trim()) {
      setError('Title is required');
      return;
    }
    if (!editingJourney.description?.trim()) {
      setError('Description is required');
      return;
    }
    if (!editingJourney.systemPrompt?.trim()) {
      setError('System Prompt is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isCreating) {
        // Create new journey
        await createJourney({
          title: editingJourney.title,
          description: editingJourney.description,
          systemPrompt: editingJourney.systemPrompt,
          icon: editingJourney.icon || '🧭',
          order: editingJourney.order ?? journeys.length,
          isActive: editingJourney.isActive ?? true,
          createdBy: user?.uid,
        });
      } else if (editingJourney.id) {
        // Update existing journey
        await updateJourney(editingJourney.id, {
          title: editingJourney.title,
          description: editingJourney.description,
          systemPrompt: editingJourney.systemPrompt,
          icon: editingJourney.icon,
          order: editingJourney.order,
          isActive: editingJourney.isActive,
        });
      }

      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save journey');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (journeyId: string) => {
    if (!confirm('Are you sure you want to delete this journey? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteJourney(journeyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete journey');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (journey: Journey) => {
    setSaving(true);
    setError(null);

    try {
      await updateJourney(journey.id, {
        isActive: !journey.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update journey');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Journey Management</h2>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Create Journey
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Edit/Create Form */}
      {editingJourney && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-slate-200">
            {isCreating ? 'Create New Journey' : 'Edit Journey'}
          </h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={editingJourney.title || ''}
              onChange={(e) => setEditingJourney({ ...editingJourney, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-sky-500 focus:outline-none transition-colors"
              placeholder="e.g., Processing Trauma"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Icon (Emoji)
            </label>
            <input
              type="text"
              value={editingJourney.icon || ''}
              onChange={(e) => setEditingJourney({ ...editingJourney, icon: e.target.value })}
              className="w-32 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-sky-500 focus:outline-none transition-colors text-center text-2xl"
              placeholder="🧭"
              maxLength={2}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={editingJourney.description || ''}
              onChange={(e) => setEditingJourney({ ...editingJourney, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-sky-500 focus:outline-none transition-colors resize-none"
              rows={3}
              placeholder="Brief description of what this journey helps with..."
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={editingJourney.systemPrompt || ''}
              onChange={(e) => setEditingJourney({ ...editingJourney, systemPrompt: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-sky-500 focus:outline-none transition-colors resize-none font-mono text-sm"
              rows={12}
              placeholder="The specific system prompt that will guide DMN for this journey..."
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editingJourney.isActive ?? true}
              onChange={(e) => setEditingJourney({ ...editingJourney, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-300">
              Active (visible to users)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Journey List */}
      <div className="space-y-3">
        {journeys.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No journeys created yet. Create your first journey to get started.</p>
          </div>
        ) : (
          journeys.map((journey) => (
            <div
              key={journey.id}
              className={`bg-slate-800 border rounded-lg p-4 transition-all ${
                journey.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl" aria-hidden="true">
                  {journey.icon || '🧭'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-1">
                        {journey.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">
                        {journey.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        Created {new Date(journey.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(journey)}
                        disabled={saving}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        title={journey.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {journey.isActive ? (
                          <Eye className="w-4 h-4 text-sky-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(journey)}
                        disabled={saving}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(journey.id)}
                        disabled={saving}
                        className="p-2 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JourneyManager;
