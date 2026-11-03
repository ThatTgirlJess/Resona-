/**
 * Resonance & Vocal Tract Length Balance Gauge
 * Visually shows user position from Dark Pharyngeal (<35%) to Bright Oral (>65%)
 */

import React from 'react';
import { VoiceMetrics, VocalTarget, VocalTrack } from '../../types/voice';
import { Compass, Flame, Sparkles } from 'lucide-react';

interface ResonanceGaugeProps {
  metrics: VoiceMetrics;
  target: VocalTarget;
  track: VocalTrack;
}

export const ResonanceGauge: React.FC<ResonanceGaugeProps> = ({
  metrics,
  target,
  track,
}) => {
  const isFem = track === 'feminization';
  const score = metrics.resonanceScore;

  // Calculate needle angle (-90deg to +90deg)
  const angle = Math.min(90, Math.max(-90, ((score - 50) / 50) * 85));

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-teal-400" />
          <h4 className="font-semibold text-slate-100 text-sm">Resonance & Vocal Tract</h4>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            metrics.resonanceScore >= target.resonanceMin &&
            metrics.resonanceScore <= target.resonanceMax
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {score}% Resonance
        </span>
      </div>

      {/* Semicircle Gauge Visual */}
      <div className="relative flex flex-col items-center justify-center my-4">
        {/* SVG Arc Gauge */}
        <div className="relative w-48 h-24 overflow-hidden">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background Arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Dark Pharyngeal Zone (Masculine Target) */}
            <path
              d="M 10 50 A 40 40 0 0 1 35 18"
              fill="none"
              stroke={isFem ? '#3b82f6' : '#a855f7'}
              strokeWidth="10"
              strokeOpacity={isFem ? '0.35' : '0.85'}
              strokeLinecap="round"
            />

            {/* Bright Oral Zone (Feminine Target) */}
            <path
              d="M 65 18 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={isFem ? '#2dd4bf' : '#3b82f6'}
              strokeWidth="10"
              strokeOpacity={isFem ? '0.85' : '0.35'}
              strokeLinecap="round"
            />

            {/* Target Marker Pin */}
            {isFem ? (
              <circle cx="78" cy="30" r="3" fill="#2dd4bf" className="animate-pulse" />
            ) : (
              <circle cx="22" cy="30" r="3" fill="#a855f7" className="animate-pulse" />
            )}
          </svg>

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-20 bg-slate-200 origin-bottom rounded-full shadow-lg transition-transform duration-200 ease-out"
            style={{
              transform: `translateX(-50%) rotate(${angle}deg)`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-teal-400 absolute top-0 -left-1 shadow" />
          </div>

          {/* Center Pin */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-900" />
        </div>

        {/* Labels underneath */}
        <div className="w-full flex justify-between text-[11px] font-medium text-slate-400 px-2 mt-1">
          <span className={!isFem ? 'text-purple-400 font-semibold' : ''}>
            ◀ Dark (Pharyngeal/Chest)
          </span>
          <span className="text-slate-500">Neutral</span>
          <span className={isFem ? 'text-teal-400 font-semibold' : ''}>
            Bright (Oral/Head) ▶
          </span>
        </div>
      </div>

      {/* Physiological Feedback Hint */}
      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-medium text-slate-200 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Physiological Cue:</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          {isFem ? (
            score < 65 ? (
              'Resonance is sitting back in the throat. Raise your larynx into the "small dog" posture and arch the tongue root.'
            ) : (
              'Excellent! Upper vocal tract is shortened, giving a crisp, forward feminine acoustic resonance.'
            )
          ) : score > 35 ? (
            'Resonance is slightly too forward. Initiate a relaxed yawn-sigh to drop the larynx and open the pharynx.'
          ) : (
            'Grounded! Deep pharyngeal cavern engaged with warm chest harmonic resonance.'
          )}
        </p>
      </div>
    </div>
  );
};
