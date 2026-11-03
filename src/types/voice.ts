/**
 * Voice Analysis & Training Types
 */

export type VocalTrack = 'feminization' | 'masculinization' | 'androgynous' | 'custom';

export interface VocalTarget {
  track: VocalTrack;
  name: string;
  description: string;
  // Pitch
  pitchMinHz: number;
  pitchMaxHz: number;
  pitchIdealHz: number;
  // Resonance (0: Dark Pharyngeal/Chest -> 100: Bright Oral/Head)
  resonanceMin: number;
  resonanceMax: number;
  resonanceIdeal: number;
  // Vocal weight (0: Whisper/thin -> 100: Heavy/thick fold)
  weightMin: number;
  weightMax: number;
  weightIdeal: number;
}

export interface VoiceMetrics {
  pitch: number;            // F0 in Hz (0 if silence/unvoiced)
  note: string;             // e.g. "G3"
  octave: number;           // e.g. 3
  cents: number;            // -50 to +50
  confidence: number;       // 0 to 1
  stability: number;        // 0 to 100%
  formantF1: number;        // Hz (~300 - 900 Hz)
  formantF2: number;        // Hz (~900 - 2800 Hz)
  spectralCentroid: number; // Hz (brightness)
  resonanceScore: number;   // 0 to 100 (vocal tract length & formant brightness index)
  vocalWeight: number;      // 0 to 100
  breathiness: number;      // 0 to 100
  volumeDb: number;         // -100 to 0 dB
  inTargetZone: boolean;
  timestamp: number;
}

export interface Drill {
  id: string;
  title: string;
  track: VocalTrack | 'all';
  category: 'resonance' | 'pitch' | 'inflection' | 'vocal-weight' | 'warmup';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationSec: number;
  summary: string;
  instructions: string[];
  physiologicalCues: string[];
  targetDescription: string;
  expectedPattern: 'sustained' | 'siren-up' | 'siren-down' | 'staircase' | 'reading';
  passageText?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  track: VocalTrack | 'all';
  type: 'pitch-tunnel' | 'resonance-shift' | 'inflection-wave';
  difficulty: 'easy' | 'medium' | 'hard';
  targetDurationSec: number;
}

export interface SessionRecord {
  id: string;
  timestamp: string;
  track: VocalTrack;
  drillId?: string;
  drillTitle?: string;
  durationSec: number;
  avgPitch: number;
  minPitch: number;
  maxPitch: number;
  pitchStability: number;
  avgResonance: number;
  avgVocalWeight: number;
  overallScore: number;
  aiFeedbackSummary?: string;
  audioBlobUrl?: string;
  audioDurationSec?: number;
}

export interface AiCoachAnalysis {
  overallScore: number;
  summary: string;
  resonanceFeedback: {
    status: 'optimal' | 'too-dark' | 'too-bright' | 'inconsistent';
    details: string;
    physiologicalAdjustment: string;
  };
  pitchFeedback: {
    status: 'optimal' | 'too-low' | 'too-high' | 'unstable';
    details: string;
    musicalTip: string;
  };
  toneFeedback: {
    status: 'balanced' | 'too-heavy' | 'too-strained' | 'too-breathy';
    details: string;
    vocalHealthTip: string;
  };
  actionableSteps: string[];
  encouragement: string;
}
