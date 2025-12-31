/**
 * Journey Selector Component
 *
 * Allows users to select a Journey when starting a new chat or changing journey
 */

import React from 'react';
import { useJourneys } from '@/hooks/useJourneys';
import { Compass, Loader2 } from 'lucide-react';

interface JourneySelectorProps {
  selectedJourneyId?: string;
  onSelectJourney: (journeyId: string | undefined) => void;
  className?: string;
}

const JourneySelector: React.FC<JourneySelectorProps> = ({
  selectedJourneyId,
  onSelectJourney,
  className = '',
}) => {
  const { journeys, loading, error } = useJourneys();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm p-4 ${className}`}>
        Error loading journeys: {error.message}
      </div>
    );
  }

  if (journeys.length === 0) {
    return null; // No journeys configured, don't show the selector
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-slate-300 mb-3">
        <Compass className="w-5 h-5 text-sky-400" />
        <h3 className="text-sm font-medium">Choose Your Journey</h3>
      </div>

      {/* Default option */}
      <button
        onClick={() => onSelectJourney(undefined)}
        className={`w-full text-left p-4 rounded-lg border transition-all ${
          !selectedJourneyId
            ? 'border-sky-500 bg-sky-900/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }`}
      >
        <div className="font-medium text-slate-200 mb-1">
          General Guidance
        </div>
        <div className="text-sm text-slate-400">
          Explore the framework without a specific focus
        </div>
      </button>

      {/* Journey options */}
      {journeys.map((journey) => (
        <button
          key={journey.id}
          onClick={() => onSelectJourney(journey.id)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selectedJourneyId === journey.id
              ? 'border-sky-500 bg-sky-900/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start gap-2">
            {journey.icon && (
              <span className="text-2xl" aria-hidden="true">
                {journey.icon}
              </span>
            )}
            <div className="flex-1">
              <div className="font-medium text-slate-200 mb-1">
                {journey.title}
              </div>
              <div className="text-sm text-slate-400">
                {journey.description}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default JourneySelector;
