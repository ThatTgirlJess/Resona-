/**
 * Vocal Warm-Up Module
 * Guided multi-stage vocal preparation:
 * 1. Gentle Physical Stretches (Neck, Jaw, Tongue Root, Diaphragm)
 * 2. SOVT Lip Trills & Airflow Balancing (Protective phonation)
 * 3. Resonant Humming Scales with Audio Reference Pitch
 */

import React, { useState, useEffect, useRef } from 'react';
import { VocalTrack, VoiceMetrics } from '../../types/voice';
import { gamificationService } from '../../services/gamificationService';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';
import {
  Sun,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Volume2,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  Flame,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface VocalWarmupModuleProps {
  track: VocalTrack;
  metrics: VoiceMetrics;
  onWarmupComplete?: () => void;
  onNavigateToDrills?: () => void;
}

export interface WarmupStep {
  id: string;
  stage: 'physical' | 'sovt' | 'scales';
  stageTitle: string;
  title: string;
  subtitle: string;
  durationSec: number;
  instructions: string[];
  anatomicalFocus: string;
  slpTip: string;
  isVoiced: boolean;
  referenceScale?: {
    notes: string[];
    frequencies: number[];
  };
  visualGuide: 'breath-circle' | 'neck-stretch' | 'jaw-massage' | 'lip-trill' | 'humming-scale';
}

export const VocalWarmupModule: React.FC<VocalWarmupModuleProps> = ({
  track,
  metrics,
  onWarmupComplete,
  onNavigateToDrills,
}) => {
  const isFem = track === 'feminization';

  // Base reference frequencies for track
  const baseFreq = isFem ? 220 : 110; // A3 vs A2
  const scaleFreqs = isFem
    ? [220, 247, 277, 294, 330] // A3, B3, C#4, D4, E4
    : [110, 123, 138, 147, 165]; // A2, B2, C#3, D3, E3
  const scaleNotes = isFem
    ? ['A3', 'B3', 'C#4', 'D4', 'E4']
    : ['A2', 'B2', 'C#3', 'D3', 'E3'];

  const WARMUP_STEPS: WarmupStep[] = [
    // STAGE 1: PHYSICAL STRETCHES & TENSION RELEASE
    {
      id: 'step-neck-jaw',
      stage: 'physical',
      stageTitle: 'Stage 1: Tension Release',
      title: 'Gentle Neck Rolls & Jaw Drop',
      subtitle: 'Release tension in the masseter, sternocleidomastoid, and strap muscles',
      durationSec: 35,
      visualGuide: 'neck-stretch',
      instructions: [
        'Sit tall with relaxed shoulders, letting your arms rest heavily.',
        'Drop your chin gently toward your collarbone and slowly roll your right ear toward your right shoulder.',
        'Hold for 5 seconds, breathing deeply. Now roll slowly to the left side.',
        'Let your lower jaw hang loose and unhinged, opening the mouth like a sleepy yawn.',
      ],
      anatomicalFocus: 'Laryngeal extrinsic muscles and masseter jaw joint (TMJ)',
      slpTip:
        'Extrinsic throat tension physically pins the larynx, making smooth pitch changes and resonance adjustments feel strained. Releasing the neck lets the larynx float naturally.',
      isVoiced: false,
    },
    {
      id: 'step-tongue-root',
      stage: 'physical',
      stageTitle: 'Stage 1: Tension Release',
      title: 'Tongue Root Extension (Hyoid Release)',
      subtitle: 'Free the hyoid bone and posterior tongue to prevent throat squeeze',
      durationSec: 30,
      visualGuide: 'jaw-massage',
      instructions: [
        'Open your mouth comfortably wide.',
        'Gently extend your tongue forward and downward toward your chin (Lion\'s stretch).',
        'Hold the gentle extension for 4 seconds without gagging or straining.',
        'Retract the tongue, swallow gently, and place fingertips beneath your jawbone to feel the muscle soften.',
      ],
      anatomicalFocus: 'Base of tongue, genioglossus, and hyoid suspension',
      slpTip:
        'A tense tongue root pushes down directly onto the larynx. Loosening the tongue root gives you instant access to clean high or low notes without tightening the throat.',
      isVoiced: false,
    },
    {
      id: 'step-breath-circle',
      stage: 'physical',
      stageTitle: 'Stage 1: Tension Release',
      title: 'Diaphragmatic Breath Expansion',
      subtitle: 'Ground the breath support to eliminate air surges and glottal shocks',
      durationSec: 30,
      visualGuide: 'breath-circle',
      instructions: [
        'Place one hand on your lower belly and one on your ribs.',
        'Inhale silently through the nose for 4 seconds, feeling your belly expand 360 degrees.',
        'Hold the breath suspended and relaxed for 2 seconds (ribs stay buoyant).',
        'Exhale through parted lips on a gentle "shhh" for 6 seconds, keeping your chest tall.',
      ],
      anatomicalFocus: 'Diaphragm, intercostal expansion, and abdominal wall',
      slpTip:
        'True vocal power and pitch stability come from steady, gentle airflow. Never pump air using chest heaving.',
      isVoiced: false,
    },

    // STAGE 2: SEMI-OCCLUDED VOCAL TRACT (SOVT) & LIP TRILLS
    {
      id: 'step-lip-trill-steady',
      stage: 'sovt',
      stageTitle: 'Stage 2: SOVT & Lip Trills',
      title: 'Gentle Sustained Lip Trills',
      subtitle: 'Equalize subglottic pressure and wake up vocal folds with zero collision',
      durationSec: 40,
      visualGuide: 'lip-trill',
      instructions: [
        'Place two fingers gently on your cheek corners to support your lips if needed.',
        'Blow air to create a relaxed motorboat or raspberry flutter ("brrrr").',
        'Now add a gentle comfortable vocal hum behind the lip flutter.',
        'Keep the sound steady and effortless. Feel the gentle buzzing on your lips.',
      ],
      anatomicalFocus: 'Vocal fold edge contact and acoustic back-pressure (inertance)',
      slpTip:
        'Lip trills are the gold standard SOVT exercise in voice pathology. Back-pressure from your lips separates the vocal folds slightly, allowing them to vibrate without forceful impact.',
      isVoiced: true,
      referenceScale: {
        notes: [isFem ? 'A3' : 'A2'],
        frequencies: [baseFreq],
      },
    },
    {
      id: 'step-pitch-glide-trills',
      stage: 'sovt',
      stageTitle: 'Stage 2: SOVT & Lip Trills',
      title: 'Lip Trill Pitch Glides (Sirens)',
      subtitle: 'Gradually stretch and thin the vocal folds across your pitch range',
      durationSec: 40,
      visualGuide: 'lip-trill',
      instructions: [
        'Start your lip trill comfortably at your baseline pitch.',
        'Glide slowly upward like a siren, maintaining steady breath pressure.',
        'Glide back down into your comfortable floor without pushing or breaking.',
        'Repeat 3 smooth glides. Keep the sound light and continuous.',
      ],
      anatomicalFocus: 'Cricothyroid muscle stretch and thyroid cartilage tilt',
      slpTip:
        'Gliding on a lip trill warms up the stretching mechanism (cricothyroid) safely before you attempt sustained high or low speech vowels.',
      isVoiced: true,
      referenceScale: {
        notes: [isFem ? 'A3' : 'A2', isFem ? 'E4' : 'E3'],
        frequencies: [baseFreq, baseFreq * 1.5],
      },
    },

    // STAGE 3: RESONANT HUMMING SCALES
    {
      id: 'step-humming-scales',
      stage: 'scales',
      stageTitle: 'Stage 3: Resonant Humming Scales',
      title: '5-Tone Resonant Humming Ladder',
      subtitle: 'Connect acoustic forward buzz with pitch steps before speech drills',
      durationSec: 45,
      visualGuide: 'humming-scale',
      instructions: [
        'Press "Play Reference Scale" below to hear the gentle tones.',
        'Hum an open "mmm" along with the 5 scale steps (1-2-3-4-5-4-3-2-1).',
        isFem
          ? 'Focus on feeling vibrations in your nose bridge, upper lip, and cheekbones (bright forward placement).'
          : 'Focus on feeling sympathetic vibration in your sternum and collarbone (dark chest resonance).',
        'Release into a soft "mah" on the final note.',
      ],
      anatomicalFocus: 'Vocal tract impedance matching & pharyngeal resonance tuning',
      slpTip:
        'Humming activates facial/chest bone resonance without straining your articulators, priming your ear and muscle memory for target frequencies.',
      isVoiced: true,
      referenceScale: {
        notes: scaleNotes,
        frequencies: scaleFreqs,
      },
    },
  ];

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARMUP_STEPS[0].durationSec);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isWarmupFinished, setIsWarmupFinished] = useState(false);

  // Audio tone synthesizer for scales
  const synthAudioCtxRef = useRef<AudioContext | null>(null);

  const step = WARMUP_STEPS[currentStepIdx];

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // Advance to next step or complete
      handleNextStep();
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  // When step changes, update time
  const goToStep = (idx: number) => {
    setCurrentStepIdx(idx);
    setTimeLeft(WARMUP_STEPS[idx].durationSec);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    // Mark current step as completed
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps((prev) => [...prev, step.id]);
    }

    if (currentStepIdx < WARMUP_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setTimeLeft(WARMUP_STEPS[nextIdx].durationSec);
      setIsPlaying(true);
    } else {
      // Finished all steps!
      setIsPlaying(false);
      setIsWarmupFinished(true);
      gamificationService.addXp(60, 'Completed Daily Vocal Warm-Up Routine');
      gamificationService.updateChallengeProgress('drill-done', 1);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2dd4bf', '#34d399', '#f59e0b', '#c084fc'],
        });
      } catch (e) {}

      if (onWarmupComplete) {
        onWarmupComplete();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      goToStep(currentStepIdx - 1);
    }
  };

  // Play gentle reference tone or scale using Web Audio
  const playReferenceTone = (freq: number, durationSec: number = 1.2) => {
    try {
      if (!synthAudioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        synthAudioCtxRef.current = new AudioContextClass();
      }
      const ctx = synthAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Smooth attack and decay envelope
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch (e) {
      console.warn('Tone synth error:', e);
    }
  };

  const playFullScale = () => {
    if (!step.referenceScale) return;
    const freqs = step.referenceScale.frequencies;
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        playReferenceTone(freq, 0.7);
      }, idx * 600);
    });
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SLP Vocal Conditioning
              </span>
              <span className="text-xs text-slate-400 capitalize">
                Track: <strong className="text-slate-200">{track}</strong>
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              Gentle Daily Vocal Warm-Up
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Protect your vocal folds before practice. This 3-stage clinical routine gently releases
              neck and jaw tension, balances subglottic air pressure with lip trills, and primes your
              resonance through guided humming scales.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-4 py-3 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
              {currentStepIdx + 1}/{WARMUP_STEPS.length}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {step.stageTitle}
              </div>
              <div className="text-[11px] text-slate-400">
                {completedSteps.length} of {WARMUP_STEPS.length} Steps Done
              </div>
            </div>
          </div>
        </div>

        {/* Multi-step progress track */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-1.5">
          {WARMUP_STEPS.map((s, idx) => {
            const isCurrent = idx === currentStepIdx;
            const isDone = completedSteps.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(idx)}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-amber-400 ring-2 ring-amber-400/30'
                    : isDone
                    ? 'bg-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={`${idx + 1}. ${s.title}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Interactive Warm-Up Stage */}
      {!isWarmupFinished ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Step Guide & Visualizer (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-5">
            <div>
              {/* Stage & Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">
                  {step.stageTitle}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Step {currentStepIdx + 1} of {WARMUP_STEPS.length}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-xl font-bold text-slate-100">{step.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{step.subtitle}</p>
              </div>

              {/* Dynamic Visual Aid Illustration */}
              <div className="my-6 p-6 rounded-2xl bg-[#090d12] border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden min-h-[170px]">
                {/* Visual Guide: Breathing Circle */}
                {step.visualGuide === 'breath-circle' && (
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`w-24 h-24 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-500/10 shadow-lg ${
                        isPlaying ? 'animate-pulse scale-110 duration-1000' : ''
                      }`}
                    >
                      <span className="text-xs font-semibold text-emerald-300 font-mono">
                        {isPlaying ? (timeLeft % 10 < 4 ? 'Inhale 4s' : timeLeft % 10 < 6 ? 'Hold 2s' : 'Exhale 4s') : 'Breathe'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-3 font-medium">
                      Paced 360° Diaphragmatic Breath
                    </span>
                  </div>
                )}

                {/* Visual Guide: Neck & Jaw */}
                {(step.visualGuide === 'neck-stretch' || step.visualGuide === 'jaw-massage') && (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 mb-2">
                      <HeartPulse className="w-8 h-8 animate-pulse" />
                    </div>
                    <span className="text-xs text-slate-300 font-medium max-w-xs">
                      Drop jaw loose, roll ear gently to shoulder. Zero forceful pulling.
                    </span>
                  </div>
                )}

                {/* Visual Guide: Lip Trills */}
                {step.visualGuide === 'lip-trill' && (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex gap-2 items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce delay-100" />
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce delay-200" />
                    </div>
                    <span className="text-sm font-bold font-mono text-teal-300">"BRRRRR..."</span>
                    <span className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Gentle lip flutter. Subglottic air cushions the vocal cords.
                    </span>
                  </div>
                )}

                {/* Visual Guide: Humming Scale Ladder */}
                {step.visualGuide === 'humming-scale' && (
                  <div className="w-full flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {scaleNotes.map((n, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => playReferenceTone(scaleFreqs[i])}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-mono text-xs flex flex-col items-center transition-colors shadow-xs"
                        >
                          <span className="text-[10px] text-slate-400">Step {i + 1}</span>
                          <strong className="text-sm">{n}</strong>
                          <span className="text-[9px] text-slate-500">{scaleFreqs[i]}Hz</span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={playFullScale}
                      className="px-4 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Play Full 5-Note Scale
                    </button>
                  </div>
                )}
              </div>

              {/* Step Execution List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  How to execute:
                </h4>
                <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                  {step.instructions.map((inst, i) => (
                    <li key={i}>
                      <span className="text-slate-300">{inst}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Step Controls: Timer & Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {timeLeft}s
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Timer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeLeft(step.durationSec)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  title="Reset step timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentStepIdx === 0}
                  onClick={handlePrevStep}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <span>{currentStepIdx === WARMUP_STEPS.length - 1 ? 'Finish Warm-Up' : 'Next Step'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Acoustic Reactivity & SLP Insights (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Vocal Pitch & Resonance Check (Active when step is voiced) */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider">
                    {step.isVoiced ? 'Live Phonation Tracker' : 'Passive Physical Stretch'}
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {step.isVoiced ? 'Listening' : 'Silent Stretch'}
                </span>
              </div>

              {step.isVoiced ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Detected Pitch</span>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                        {metrics.pitch > 0 ? `${Math.round(metrics.pitch)} Hz` : '--'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{metrics.note}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Resonance Glow</span>
                      <div className="text-xl font-bold font-mono text-teal-400 mt-0.5">
                        {metrics.resonanceScore}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {metrics.resonanceScore >= 65 ? 'Forward Oral' : 'Warm Pharyngeal'}
                      </span>
                    </div>
                  </div>

                  {/* Target guide cue */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <span className="text-slate-400">Target Range:</span>
                    <strong className="text-teal-300 font-mono">
                      {isFem ? '190–240 Hz (A3/B3)' : '95–130 Hz (A2/C3)'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-teal-400/80 mx-auto mb-1" />
                  <p className="text-slate-300 font-medium">Keep Throat & Cords Silent</p>
                  <p className="text-[11px] text-slate-500">
                    Focus on the physical sensation of muscle elongation. Do not vocalize yet.
                  </p>
                </div>
              )}
            </div>

            {/* Anatomical & SLP Science Note */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>SLP Clinical Rationale</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{step.slpTip}</p>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <strong className="text-slate-300">Target Anatomy: </strong>
                {step.anatomicalFocus}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Warm-Up Completed Celebration Card */
        <div className="rounded-2xl bg-linear-to-b from-slate-900 to-emerald-950/40 border border-emerald-500/40 p-8 shadow-2xl text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Vocal Cords Primed
            </span>
            <h3 className="text-2xl font-extrabold text-slate-100">
              Vocal Warm-Up Complete!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your vocal tract is relaxed, subglottic air pressure is equalized, and resonance
              pathways are open. You are ready for high-intensity speech and resonance drills!
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 inline-flex items-center gap-3 text-xs">
            <span className="text-amber-400 font-bold font-mono">+60 XP Earned</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Daily Warm-up Logged</span>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsWarmupFinished(false);
                goToStep(0);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Restart Warm-Up
            </button>
            {onNavigateToDrills && (
              <button
                type="button"
                onClick={onNavigateToDrills}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-teal-500/20 transition-all"
              >
                <span>Proceed to Daily Drills</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
