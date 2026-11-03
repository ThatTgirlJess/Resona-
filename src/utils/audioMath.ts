/**
 * Pure Audio and Vocal Physics Mathematics
 * Decoupled from UI for testing and high-performance Web Audio processing.
 */

import { VocalTrack, VocalTarget, VoiceMetrics } from '../types/voice';

// Musical note names
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Converts a frequency in Hz to musical note representation
 */
export function hzToNote(hz: number): { note: string; octave: number; cents: number; fullNote: string } {
  if (hz <= 0 || !isFinite(hz)) {
    return { note: '--', octave: 0, cents: 0, fullNote: '--' };
  }

  // A4 = 440 Hz is MIDI 69
  const midi = 12 * (Math.log2(hz / 440)) + 69;
  const roundedMidi = Math.round(midi);
  const cents = Math.round((midi - roundedMidi) * 100);

  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const note = NOTE_NAMES[noteIndex];

  return {
    note,
    octave,
    cents,
    fullNote: `${note}${octave}`,
  };
}

/**
 * Converts a musical note string like "A4", "C3", "F#4" to frequency in Hz
 */
export function noteToHz(noteStr: string): number {
  const match = noteStr.trim().match(/^([A-G]#?)(-?\d+)$/i);
  if (!match) return 440;

  const noteName = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const noteIndex = NOTE_NAMES.indexOf(noteName as any);
  if (noteIndex === -1) return 440;

  const midi = (octave + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Autocorrelation-based pitch detection with normalized square difference and parabolic interpolation
 * Tuned for vocal fundamental frequency (F0) range 60 Hz to 650 Hz
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  minFreq: number = 60,
  maxFreq: number = 650
): { pitch: number; confidence: number } {
  const bufferSize = buffer.length;

  // Calculate RMS to gate silence
  let sumSquare = 0;
  for (let i = 0; i < bufferSize; i++) {
    sumSquare += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquare / bufferSize);

  // Silence threshold
  if (rms < 0.01) {
    return { pitch: 0, confidence: 0 };
  }

  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.min(Math.floor(sampleRate / minFreq), bufferSize - 1);

  let bestPeriod = -1;
  let maxCorrelation = 0;

  // Normalized autocorrelation across lags
  const correlations: number[] = new Array(maxPeriod + 1).fill(0);

  for (let tau = minPeriod; tau <= maxPeriod; tau++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < bufferSize - tau; i++) {
      const s1 = buffer[i];
      const s2 = buffer[i + tau];
      correlation += s1 * s2;
      norm1 += s1 * s1;
      norm2 += s2 * s2;
    }

    const denom = Math.sqrt(norm1 * norm2);
    if (denom > 0) {
      correlations[tau] = correlation / denom;
      if (correlations[tau] > maxCorrelation) {
        maxCorrelation = correlations[tau];
      }
    }
  }

  // Minimum correlation threshold for voiced speech
  if (maxCorrelation < 0.55) {
    return { pitch: 0, confidence: Math.max(0, maxCorrelation) };
  }

  // Peak picking: find the FIRST prominent local maximum above threshold
  // This prevents period-doubling (octave underestimation, e.g. 110 instead of 220)
  const peakThreshold = Math.max(0.65, maxCorrelation * 0.85);
  for (let tau = minPeriod + 1; tau < maxPeriod; tau++) {
    const val = correlations[tau];
    // Check if local maximum
    if (val >= peakThreshold && val > correlations[tau - 1] && val >= correlations[tau + 1]) {
      bestPeriod = tau;
      maxCorrelation = val;
      break;
    }
  }

  if (bestPeriod === -1) {
    // Fallback to highest correlation index
    let highestVal = 0;
    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      if (correlations[tau] > highestVal) {
        highestVal = correlations[tau];
        bestPeriod = tau;
      }
    }
    maxCorrelation = highestVal;
  }

  // Parabolic interpolation for sub-sample precision
  let refinedPeriod = bestPeriod;
  if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
    let prevCorr = 0;
    let nextCorr = 0;
    let norm1 = 0;
    let normPrev = 0;
    let normNext = 0;

    for (let i = 0; i < bufferSize - bestPeriod; i++) {
      const s0 = buffer[i];
      norm1 += s0 * s0;
      if (i + bestPeriod - 1 < bufferSize) {
        prevCorr += s0 * buffer[i + bestPeriod - 1];
        normPrev += buffer[i + bestPeriod - 1] * buffer[i + bestPeriod - 1];
      }
      if (i + bestPeriod + 1 < bufferSize) {
        nextCorr += s0 * buffer[i + bestPeriod + 1];
        normNext += buffer[i + bestPeriod + 1] * buffer[i + bestPeriod + 1];
      }
    }

    const c1 = prevCorr / (Math.sqrt(norm1 * normPrev) || 1);
    const c2 = maxCorrelation;
    const c3 = nextCorr / (Math.sqrt(norm1 * normNext) || 1);

    const delta = (c3 - c1) / (2 * (2 * c2 - c1 - c3) || 1);
    if (Math.abs(delta) < 1) {
      refinedPeriod += delta;
    }
  }

  const pitch = sampleRate / refinedPeriod;

  // Extra bounds check
  if (pitch < minFreq || pitch > maxFreq) {
    return { pitch: 0, confidence: 0 };
  }

  return {
    pitch: Math.round(pitch * 10) / 10,
    confidence: Math.min(1, Math.max(0, maxCorrelation)),
  };
}

/**
 * Analyzes spectral resonance (Formants F1, F2 approximation, Spectral Centroid,
 * Vocal Weight, and Breathiness).
 *
 * In acoustic phonetics:
 * - F1 (300 - 900 Hz): Pharyngeal / throat resonance & jaw aperture.
 * - F2 (900 - 2600 Hz): Oral cavity resonance & tongue fronting (key for vocal tract length shortening / feminization).
 * - Spectral Centroid: Perceived brightness / acoustic forwardness.
 */
export function analyzeResonance(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  f0: number
): {
  f1: number;
  f2: number;
  spectralCentroid: number;
  resonanceScore: number;
  vocalWeight: number;
  breathiness: number;
} {
  const binCount = freqData.length;
  const binWidth = sampleRate / fftSize;

  let totalPower = 0;
  let weightedFreqSum = 0;

  // Find energy in key formant bands:
  // F1 band: 300 - 950 Hz
  // F2 band: 950 - 2700 Hz
  // High harmonics band: 2700 - 5500 Hz
  let f1MaxEnergy = -1;
  let f1PeakFreq = 500;
  let f2MaxEnergy = -1;
  let f2PeakFreq = 1500;

  let lowBandEnergy = 0;   // 100 - 800 Hz (Chest / pharyngeal depth)
  let midBandEnergy = 0;   // 800 - 2500 Hz (Oral / vocal tract length)
  let highBandEnergy = 0;  // 2500 - 6000 Hz (Ring / brightness)

  for (let i = 1; i < binCount; i++) {
    const freq = i * binWidth;
    if (freq > 7000) break;

    const amplitude = freqData[i];
    const power = amplitude * amplitude;

    totalPower += power;
    weightedFreqSum += freq * power;

    // F1 range check
    if (freq >= 300 && freq <= 950) {
      if (amplitude > f1MaxEnergy) {
        f1MaxEnergy = amplitude;
        f1PeakFreq = Math.round(freq);
      }
    }

    // F2 range check
    if (freq >= 950 && freq <= 2700) {
      if (amplitude > f2MaxEnergy) {
        f2MaxEnergy = amplitude;
        f2PeakFreq = Math.round(freq);
      }
    }

    if (freq >= 100 && freq < 800) {
      lowBandEnergy += power;
    } else if (freq >= 800 && freq < 2500) {
      midBandEnergy += power;
    } else if (freq >= 2500 && freq <= 6000) {
      highBandEnergy += power;
    }
  }

  // Spectral centroid (brightness)
  const spectralCentroid = totalPower > 0 ? weightedFreqSum / totalPower : 1000;

  // Calculate Resonance Score (0 to 100)
  // Feminine resonance is characterized by higher F2 (shortened vocal tract) and higher mid/high to low energy ratio.
  // Masculine resonance is characterized by deep low-frequency dominance and lower F2.
  let resonanceScore = 50;
  if (totalPower > 500) {
    // Normalization factors
    const f2Factor = Math.min(1, Math.max(0, (f2PeakFreq - 1100) / (2300 - 1100)));
    const energyRatio = (midBandEnergy * 1.2 + highBandEnergy) / (lowBandEnergy + 1);
    const ratioFactor = Math.min(1, Math.max(0, (energyRatio - 0.4) / (2.2 - 0.4)));

    // Combined resonance metric
    resonanceScore = Math.round((f2Factor * 0.6 + ratioFactor * 0.4) * 100);
  }

  // Vocal Weight (0 to 100)
  // Heavy vocal weight has strong low harmonics (H1, H2) relative to high harmonics.
  // Thin vocal weight has reduced low-end drive.
  let vocalWeight = 50;
  if (totalPower > 500) {
    const lowToTotalRatio = lowBandEnergy / (totalPower + 1);
    vocalWeight = Math.round(Math.min(100, Math.max(0, lowToTotalRatio * 130)));
  }

  // Breathiness (0 to 100)
  // Breathiness manifests as diffuse high-frequency noise floor relative to distinct peaks
  let breathiness = 20;
  if (totalPower > 500 && highBandEnergy > 0) {
    const highRatio = highBandEnergy / (totalPower + 1);
    breathiness = Math.round(Math.min(100, Math.max(5, highRatio * 180)));
  }

  return {
    f1: f1PeakFreq,
    f2: f2PeakFreq,
    spectralCentroid: Math.round(spectralCentroid),
    resonanceScore: Math.max(0, Math.min(100, resonanceScore)),
    vocalWeight: Math.max(0, Math.min(100, vocalWeight)),
    breathiness: Math.max(0, Math.min(100, breathiness)),
  };
}

/**
 * Calculates pitch stability percentage (0 to 100%) from recent pitch history.
 * Standard deviation of semitones is used to be perceptually accurate across octaves.
 */
export function calculateStability(pitchHistory: number[]): number {
  const voicedPitches = pitchHistory.filter((p) => p > 60 && p < 650);
  if (voicedPitches.length < 5) return 80;

  // Convert Hz to semitones relative to A4 (440 Hz)
  const semitones = voicedPitches.map((p) => 12 * Math.log2(p / 440));

  // Mean
  const mean = semitones.reduce((a, b) => a + b, 0) / semitones.length;

  // Variance & Standard Deviation
  const variance =
    semitones.reduce((sum, st) => sum + Math.pow(st - mean, 2), 0) / semitones.length;
  const stdDev = Math.sqrt(variance);

  // In vocal pedagogy, standard deviation < 0.35 semitones is exceptionally stable (>95%),
  // > 1.8 semitones indicates wobble or pitch drifting (<50%).
  const stability = Math.max(0, Math.min(100, Math.round(100 - stdDev * 35)));
  return stability;
}

/**
 * Evaluates how closely the user's metrics match their chosen target track
 */
export function calculateTargetScore(
  metrics: VoiceMetrics,
  target: VocalTarget
): {
  overall: number;
  pitchScore: number;
  resonanceScore: number;
  weightScore: number;
  isInTarget: boolean;
} {
  if (metrics.pitch === 0) {
    return { overall: 0, pitchScore: 0, resonanceScore: 0, weightScore: 0, isInTarget: false };
  }

  // Pitch scoring
  let pitchScore = 100;
  if (metrics.pitch < target.pitchMinHz) {
    const diff = target.pitchMinHz - metrics.pitch;
    pitchScore = Math.max(0, 100 - diff * 1.5);
  } else if (metrics.pitch > target.pitchMaxHz) {
    const diff = metrics.pitch - target.pitchMaxHz;
    pitchScore = Math.max(0, 100 - diff * 1.2);
  } else {
    // Within range: give bonus towards ideal
    const diffIdeal = Math.abs(metrics.pitch - target.pitchIdealHz);
    pitchScore = Math.max(85, 100 - diffIdeal * 0.4);
  }

  // Resonance scoring
  let resScore = 100;
  if (metrics.resonanceScore < target.resonanceMin) {
    const diff = target.resonanceMin - metrics.resonanceScore;
    resScore = Math.max(0, 100 - diff * 2.5);
  } else if (metrics.resonanceScore > target.resonanceMax) {
    const diff = metrics.resonanceScore - target.resonanceMax;
    resScore = Math.max(0, 100 - diff * 2.5);
  } else {
    const diffIdeal = Math.abs(metrics.resonanceScore - target.resonanceIdeal);
    resScore = Math.max(85, 100 - diffIdeal * 0.5);
  }

  // Vocal Weight scoring
  let weightScore = 100;
  if (metrics.vocalWeight < target.weightMin) {
    weightScore = Math.max(0, 100 - (target.weightMin - metrics.vocalWeight) * 2);
  } else if (metrics.vocalWeight > target.weightMax) {
    weightScore = Math.max(0, 100 - (metrics.vocalWeight - target.weightMax) * 2);
  } else {
    weightScore = 95;
  }

  // Target zone condition
  const inPitch = metrics.pitch >= target.pitchMinHz && metrics.pitch <= target.pitchMaxHz;
  const inRes =
    metrics.resonanceScore >= target.resonanceMin && metrics.resonanceScore <= target.resonanceMax;
  const isInTarget = inPitch && inRes;

  const overall = Math.round(pitchScore * 0.45 + resScore * 0.45 + weightScore * 0.1);

  return {
    overall: Math.min(100, Math.max(0, overall)),
    pitchScore: Math.round(pitchScore),
    resonanceScore: Math.round(resScore),
    weightScore: Math.round(weightScore),
    isInTarget,
  };
}

/**
 * Default gender-affirming voice targets
 */
export function getDefaultTarget(track: VocalTrack): VocalTarget {
  switch (track) {
    case 'feminization':
      return {
        track: 'feminization',
        name: 'Vocal Feminization',
        description: 'Bright forward resonance, elevated larynx position, pitch target ~190–245 Hz, lighter vocal weight.',
        pitchMinHz: 185,
        pitchMaxHz: 250,
        pitchIdealHz: 215, // Approx A3
        resonanceMin: 65,
        resonanceMax: 95,
        resonanceIdeal: 80,
        weightMin: 20,
        weightMax: 48,
        weightIdeal: 35,
      };

    case 'masculinization':
      return {
        track: 'masculinization',
        name: 'Vocal Masculinization',
        description: 'Warm chest & pharyngeal resonance, expanded vocal tract, pitch target ~90–135 Hz, grounded vocal weight.',
        pitchMinHz: 90,
        pitchMaxHz: 140,
        pitchIdealHz: 110, // Approx A2
        resonanceMin: 12,
        resonanceMax: 38,
        resonanceIdeal: 25,
        weightMin: 55,
        weightMax: 88,
        weightIdeal: 72,
      };

    case 'androgynous':
      return {
        track: 'androgynous',
        name: 'Androgynous / Vocal Flexibility',
        description: 'Balanced acoustic resonance, versatile pitch target ~145–185 Hz, adaptive vocal weight.',
        pitchMinHz: 145,
        pitchMaxHz: 185,
        pitchIdealHz: 165, // Approx E3
        resonanceMin: 42,
        resonanceMax: 60,
        resonanceIdeal: 50,
        weightMin: 40,
        weightMax: 60,
        weightIdeal: 50,
      };

    case 'custom':
      return {
        track: 'custom',
        name: 'Custom Target',
        description: 'Personalized target range for your unique vocal goals.',
        pitchMinHz: 130,
        pitchMaxHz: 220,
        pitchIdealHz: 175,
        resonanceMin: 40,
        resonanceMax: 70,
        resonanceIdeal: 55,
        weightMin: 30,
        weightMax: 70,
        weightIdeal: 50,
      };
  }
}
