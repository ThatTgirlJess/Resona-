/**
 * Personalized Daily Drill Routine Component
 * Generates tailored exercises targeting historical weaknesses (resonance control & pitch stability)
 * and runs full interactive drill sessions with real-time scoring and AI Coach reviews.
 */

import React, { useState, useEffect } from 'react';
import { VocalTrack, VoiceMetrics, SessionRecord, AiCoachAnalysis } from '../../types/voice';
import {
  generatePersonalizedDrills,
  PersonalizedRoutine,
  TailoredDrill,
} from '../../services/drillGenerator';
import { gamificationService } from '../../services/gamificationService';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle,
  Clock,
  Target,
  Flame,
  Award,
  ArrowRight,
  Brain,
  Volume2,
  ChevronRight,
  X,
  RotateCcw,
  Sun,
} from 'lucide-react';

interface PersonalizedDailyDrillsProps {
  track: VocalTrack;
  metrics: VoiceMetrics;
  history: SessionRecord[];
  onSaveSession: (session: SessionRecord) => void;
  onRequestSwitchTab: (tab: string) => void;
}

export const PersonalizedDailyDrills: React.FC<PersonalizedDailyDrillsProps> = ({
  track,
  metrics,
  history,
  onSaveSession,
  onRequestSwitchTab,
}) => {
  const [routine, setRoutine] = useState<PersonalizedRoutine | null>(null);
  const [activeDrill, setActiveDrill] = useState<TailoredDrill | null>(null);

  // Drill Runner State
  const [isDrillRunning, setIsDrillRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [drillScore, setDrillScore] = useState<number>(0);
  const [drillPitchSamples, setDrillPitchSamples] = useState<number[]>([]);
  const [drillResonanceSamples, setDrillResonanceSamples] = useState<number[]>([]);
  const [drillWeightSamples, setDrillWeightSamples] = useState<number[]>([]);
  const [drillAiResult, setDrillAiResult] = useState<AiCoachAnalysis | null>(null);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState<boolean>(false);
  const [hasCompletedActiveDrill, setHasCompletedActiveDrill] = useState<boolean>(false);

  // Generate routine when track or history changes
  useEffect(() => {
    const generated = generatePersonalizedDrills(track, history);
    setRoutine(generated);
  }, [track, history]);

  // Drill Runner Countdown & Data Collection Timer
  useEffect(() => {
    let timer: any = null;

    if (isDrillRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);

        // Collect metrics sample during drill
        if (metrics.pitch > 60) {
          setDrillPitchSamples((prev) => [...prev, metrics.pitch]);
          setDrillResonanceSamples((prev) => [...prev, metrics.resonanceScore]);
          setDrillWeightSamples((prev) => [...prev, metrics.vocalWeight]);

          // Update gamification challenge: resonance time
          if (metrics.inTargetZone) {
            gamificationService.updateChallengeProgress('resonance-sec', 1);
          }
        }
      }, 1000);
    } else if (isDrillRunning && timeLeft === 0) {
      // Drill Finished!
      finishDrill();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDrillRunning, timeLeft, metrics]);

  const handleStartDrill = (drill: TailoredDrill) => {
    setActiveDrill(drill);
    setTimeLeft(drill.durationSec);
    setDrillScore(0);
    setDrillPitchSamples([]);
    setDrillResonanceSamples([]);
    setDrillWeightSamples([]);
    setDrillAiResult(null);
    setHasCompletedActiveDrill(false);
    setIsDrillRunning(true);

    // If audio is not running, start live mic or synthetic
    audioEngine.startMic();
  };

  const finishDrill = async () => {
    setIsDrillRunning(false);
    setHasCompletedActiveDrill(true);

    // Compute session results
    const pitchAvg =
      drillPitchSamples.length > 0
        ? Math.round(drillPitchSamples.reduce((a, b) => a + b, 0) / drillPitchSamples.length)
        : metrics.pitch;

    const resAvg =
      drillResonanceSamples.length > 0
        ? Math.round(drillResonanceSamples.reduce((a, b) => a + b, 0) / drillResonanceSamples.length)
        : metrics.resonanceScore;

    const weightAvg =
      drillWeightSamples.length > 0
        ? Math.round(drillWeightSamples.reduce((a, b) => a + b, 0) / drillWeightSamples.length)
        : metrics.vocalWeight;

    // Calculate score
    const isFem = track === 'feminization';
    const pitchAccuracy = isFem
      ? Math.max(0, 100 - Math.abs(pitchAvg - 215) * 1.5)
      : Math.max(0, 100 - Math.abs(pitchAvg - 110) * 1.5);
    const resAccuracy = isFem
      ? Math.max(0, 100 - Math.abs(resAvg - 80) * 1.8)
      : Math.max(0, 100 - Math.abs(resAvg - 25) * 1.8);

    const calculatedScore = Math.min(
      98,
      Math.max(60, Math.round(pitchAccuracy * 0.45 + resAccuracy * 0.45 + metrics.stability * 0.1))
    );
    setDrillScore(calculatedScore);

    // Confetti celebration if high score
    if (calculatedScore >= 80) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#2dd4bf', '#34d399', '#f59e0b', '#a855f7'],
        });
      } catch (e) {}
    }

    // Award XP
    gamificationService.addXp(calculatedScore + 40, `Finished ${activeDrill?.title}`);
    gamificationService.recordPracticeDay();
    gamificationService.updateChallengeProgress('drill-done', 1);
    if (metrics.stability >= 85) {
      gamificationService.updateChallengeProgress('stable-drill', 1);
    }

    // Update routine status
    if (routine && activeDrill) {
      const updatedDrills = routine.drills.map((d) =>
        d.id === activeDrill.id ? { ...d, isCompleted: true, bestScore: calculatedScore } : d
      );
      setRoutine({
        ...routine,
        drills: updatedDrills,
        completedCount: updatedDrills.filter((d) => d.isCompleted).length,
      });
    }

    // Call server AI Coach
    setIsEvaluatingAi(true);
    try {
      const res = await fetch('/api/ai-coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track,
          drillTitle: activeDrill?.title || 'Vocal Exercise',
          avgPitch: pitchAvg,
          pitchStability: metrics.stability,
          avgResonance: resAvg,
          vocalWeight: weightAvg,
          durationSec: activeDrill?.durationSec || 30,
          notes: 'Daily routine exercise take',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDrillAiResult(data);

        // Save session record
        const sessionRecord: SessionRecord = {
          id: `session-${Date.now()}`,
          timestamp: new Date().toISOString(),
          track,
          drillId: activeDrill?.id,
          drillTitle: activeDrill?.title,
          durationSec: activeDrill?.durationSec || 30,
          avgPitch: pitchAvg,
          minPitch: Math.min(...(drillPitchSamples.length ? drillPitchSamples : [pitchAvg])),
          maxPitch: Math.max(...(drillPitchSamples.length ? drillPitchSamples : [pitchAvg])),
          pitchStability: metrics.stability,
          avgResonance: resAvg,
          avgVocalWeight: weightAvg,
          overallScore: calculatedScore,
          aiFeedbackSummary: data.summary,
        };
        onSaveSession(sessionRecord);
      }
    } catch (err) {
      console.warn('AI evaluation request failed, using local diagnostics:', err);
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  const handleRegenerate = () => {
    if (!routine) return;
    const fresh = generatePersonalizedDrills(track, history);
    setRoutine(fresh);
  };

  if (!routine) return null;

  return (
    <div className="space-y-6">
      {/* Personalized Diagnosis Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                AI Diagnostic Engine
              </span>
              <span className="text-xs text-slate-400">
                Track: <strong className="text-slate-200 capitalize">{track}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              Tailored Routine for Your Voice
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {routine.diagnosedNeeds.description}
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-teal-400 font-medium">Recommended Focus:</span>
              <span>{routine.diagnosedNeeds.recommendedFocus}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Daily Routine Progress</div>
              <div className="text-lg font-bold font-mono text-teal-400">
                {routine.completedCount} / {routine.drills.length} Completed
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRequestSwitchTab('warmup')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Warm Up Voice
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routine.drills.map((drill, idx) => (
          <div
            key={drill.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
              drill.isCompleted
                ? 'bg-slate-900/60 border-emerald-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-teal-400 font-bold text-xs flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase tracking-wider">
                    {drill.category}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{drill.difficulty}</span>
                </div>
                {drill.isCompleted && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4" /> {drill.bestScore}% Best
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-slate-100 text-base mb-1">{drill.title}</h3>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{drill.summary}</p>

              {/* Tailored Rationale Badge */}
              <div className="mb-3 p-2.5 rounded-xl bg-teal-950/25 border border-teal-500/20 text-xs text-teal-200/90 flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-teal-300">Why for you: </strong>
                  <span>{drill.tailoredReason}</span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> {drill.durationSec}s Drill
              </span>
              <button
                type="button"
                onClick={() => handleStartDrill(drill)}
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md hover:shadow-teal-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {drill.isCompleted ? 'Practice Again' : 'Start Drill'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Drill Runner Modal */}
      {activeDrill && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsDrillRunning(false);
                setActiveDrill(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close drill"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Drill Modal Header */}
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
                <span>{activeDrill.category} Drill</span>
                <span>•</span>
                <span>{activeDrill.difficulty}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">{activeDrill.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{activeDrill.summary}</p>
            </div>

            {/* Drill Active Status & Timer */}
            <div className="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Target Goal</span>
                <p className="text-sm font-semibold text-teal-300">{activeDrill.specificGoal}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Time Remaining</span>
                <div className="text-2xl font-bold font-mono text-amber-400">{timeLeft}s</div>
              </div>
            </div>

            {/* Live Metrics Meter Bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-5">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400">Current Pitch</span>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {metrics.pitch > 0 ? `${Math.round(metrics.pitch)} Hz` : '--'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400">Resonance Score</span>
                <div className="text-lg font-bold font-mono text-teal-400">
                  {metrics.resonanceScore}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400">Stability</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {metrics.stability}%
                </div>
              </div>
            </div>

            {/* Passage Text if Reading Drill */}
            {activeDrill.passageText && (
              <div className="mb-5 p-4 rounded-xl bg-teal-950/20 border border-teal-500/30 text-slate-200 text-sm leading-relaxed">
                <div className="text-xs font-semibold text-teal-400 mb-1 uppercase tracking-wider">
                  Read Aloud with Target Inflection:
                </div>
                "{activeDrill.passageText}"
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 mb-5">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Step-by-Step Execution:
              </h4>
              <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                {activeDrill.instructions.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    <span className="text-slate-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Physiological Cues */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 mb-5">
              <strong className="text-teal-300 block mb-1">Anatomical Focus:</strong>
              <ul className="list-disc list-inside space-y-0.5">
                {activeDrill.physiologicalCues.map((cue, i) => (
                  <li key={i}>{cue}</li>
                ))}
              </ul>
            </div>

            {/* Post-Drill Results & AI Coach Analysis */}
            {hasCompletedActiveDrill && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-300 font-semibold uppercase">Drill Score</span>
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                      {drillScore} / 100
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <span className="text-teal-300 font-bold">+ {drillScore + 40} XP Earned!</span>
                    <p className="text-slate-400 mt-0.5">Session recorded to history</p>
                  </div>
                </div>

                {isEvaluatingAi ? (
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3 text-slate-300 text-xs">
                    <Brain className="w-5 h-5 text-teal-400 animate-spin" />
                    <span>AI Voice Coach is analyzing your formants and pitch stability...</span>
                  </div>
                ) : drillAiResult ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-teal-400 font-semibold">
                      <Brain className="w-4 h-4" />
                      <span>AI Vocal Coach Diagnostic Review</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{drillAiResult.summary}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <strong className="text-teal-300">Resonance Correction:</strong>
                        <p className="text-slate-400 mt-0.5">
                          {drillAiResult.resonanceFeedback.physiologicalAdjustment}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <strong className="text-amber-300">Pitch & Breath Tip:</strong>
                        <p className="text-slate-400 mt-0.5">{drillAiResult.pitchFeedback.musicalTip}</p>
                      </div>
                    </div>

                    <div className="text-teal-300/90 italic text-[11px]">
                      "{drillAiResult.encouragement}"
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Runner Action Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              {hasCompletedActiveDrill ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleStartDrill(activeDrill)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Drill
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDrill(null)}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold"
                  >
                    Done
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={finishDrill}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  End Drill Early & Score
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
