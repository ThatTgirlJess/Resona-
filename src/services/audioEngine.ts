/**
 * Web Audio Engine for Real-Time Vocal Pitch, Formant, and Spectrogram Analysis.
 * Supports both Live Microphone input and a built-in Synthetic Vocal Generator
 * for automated testing, practice demonstrations, and headless verification.
 */

import { VoiceMetrics, VocalTarget, VocalTrack } from '../types/voice';
import {
  detectPitch,
  hzToNote,
  analyzeResonance,
  calculateStability,
  calculateTargetScore,
  getDefaultTarget,
} from '../utils/audioMath';

export type AudioSourceType = 'mic' | 'synth-fem' | 'synth-masc' | 'synth-siren' | 'synth-unstable';

export class VoiceAudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private synthOsc: OscillatorNode | null = null;
  private synthGain: GainNode | null = null;
  private synthFilter: BiquadFilterNode | null = null;
  private synthTimer: any = null;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private activeSource: AudioSourceType = 'mic';

  // Buffers
  private timeDomainBuffer: Float32Array = new Float32Array(2048);
  private frequencyBuffer: Uint8Array = new Uint8Array(1024);
  private pitchHistory: number[] = [];
  private maxHistoryLength = 40;

  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime = 0;

  // Active Target
  public currentTarget: VocalTarget = getDefaultTarget('feminization');

  // Callback listeners
  private metricListeners: ((metrics: VoiceMetrics) => void)[] = [];
  private stateListeners: ((isRunning: boolean, source: AudioSourceType) => void)[] = [];

  constructor() {
    this.currentTarget = getDefaultTarget('feminization');
  }

  public setTrack(track: VocalTrack) {
    this.currentTarget = getDefaultTarget(track);
  }

  public subscribeMetrics(callback: (metrics: VoiceMetrics) => void): () => void {
    this.metricListeners.push(callback);
    return () => {
      this.metricListeners = this.metricListeners.filter((cb) => cb !== callback);
    };
  }

  public subscribeState(callback: (isRunning: boolean, source: AudioSourceType) => void): () => void {
    this.stateListeners.push(callback);
    callback(this.isRunning, this.activeSource);
    return () => {
      this.stateListeners = this.stateListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyState() {
    for (const listener of this.stateListeners) {
      listener(this.isRunning, this.activeSource);
    }
  }

  /**
   * Initialize AudioContext and AnalyserNode
   */
  private async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.78;
      this.timeDomainBuffer = new Float32Array(this.analyser.fftSize);
      this.frequencyBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    }
    return this.audioCtx;
  }

  /**
   * Start Live Microphone Input
   */
  public async startMic(): Promise<boolean> {
    try {
      this.stop();
      const ctx = await this.ensureAudioContext();

      // Request user media with acoustic echo cancellation and noise suppression
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.sourceNode = ctx.createMediaStreamSource(this.micStream);
      this.sourceNode.connect(this.analyser!);

      this.activeSource = 'mic';
      this.isRunning = true;
      this.notifyState();
      this.startAnalysisLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable, falling back to synthetic generator:', err);
      // Automatically fallback to synthetic demo generator so app is 100% interactive
      await this.startSynthetic('synth-fem');
      return false;
    }
  }

  /**
   * Start Synthetic Voice Generator (Ideal for testing, demonstrations, or when mic is disabled)
   */
  public async startSynthetic(
    mode: 'synth-fem' | 'synth-masc' | 'synth-siren' | 'synth-unstable' = 'synth-fem'
  ): Promise<void> {
    this.stop();
    const ctx = await this.ensureAudioContext();

    this.synthOsc = ctx.createOscillator();
    this.synthGain = ctx.createGain();
    this.synthFilter = ctx.createBiquadFilter();

    this.synthGain.gain.value = 0.08; // Comfortable quiet volume

    if (mode === 'synth-fem') {
      // Feminine voice demo: ~215 Hz with high harmonic presence
      this.synthOsc.type = 'sawtooth';
      this.synthOsc.frequency.setValueAtTime(215, ctx.currentTime);
      this.synthFilter.type = 'bandpass';
      this.synthFilter.frequency.setValueAtTime(1850, ctx.currentTime); // Bright F2 oral resonance
      this.synthFilter.Q.setValueAtTime(2.0, ctx.currentTime);
    } else if (mode === 'synth-masc') {
      // Masculine voice demo: ~110 Hz with low chest resonance
      this.synthOsc.type = 'sawtooth';
      this.synthOsc.frequency.setValueAtTime(110, ctx.currentTime);
      this.synthFilter.type = 'lowpass';
      this.synthFilter.frequency.setValueAtTime(750, ctx.currentTime); // Dark pharyngeal resonance
      this.synthFilter.Q.setValueAtTime(1.5, ctx.currentTime);
    } else if (mode === 'synth-siren') {
      // Pitch glide siren
      this.synthOsc.type = 'triangle';
      this.synthOsc.frequency.setValueAtTime(150, ctx.currentTime);
      let up = true;
      let curr = 150;
      this.synthTimer = setInterval(() => {
        if (!this.synthOsc || !this.audioCtx) return;
        if (curr >= 260) up = false;
        if (curr <= 140) up = true;
        curr += up ? 4 : -4;
        this.synthOsc.frequency.setValueAtTime(curr, this.audioCtx.currentTime);
      }, 50);
    } else {
      // Unstable wobbly demo
      this.synthOsc.type = 'sawtooth';
      this.synthTimer = setInterval(() => {
        if (!this.synthOsc || !this.audioCtx) return;
        const wobble = 180 + Math.sin(Date.now() / 150) * 45;
        this.synthOsc.frequency.setValueAtTime(wobble, this.audioCtx.currentTime);
      }, 60);
    }

    // Connect: Osc -> Filter -> Gain -> Analyser (do not connect to ctx.destination to avoid ear fatigue unless desired)
    this.synthOsc.connect(this.synthFilter);
    this.synthFilter.connect(this.synthGain);
    this.synthGain.connect(this.analyser!);

    this.synthOsc.start();
    this.activeSource = mode;
    this.isRunning = true;
    this.notifyState();
    this.startAnalysisLoop();
  }

  /**
   * Stop all audio sources and analysis loop
   */
  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    if (this.synthOsc) {
      try {
        this.synthOsc.stop();
        this.synthOsc.disconnect();
      } catch (e) {}
      this.synthOsc = null;
    }
    if (this.synthGain) {
      try {
        this.synthGain.disconnect();
      } catch (e) {}
      this.synthGain = null;
    }
    if (this.synthFilter) {
      try {
        this.synthFilter.disconnect();
      } catch (e) {}
      this.synthFilter = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.notifyState();
  }

  /**
   * Get raw frequency data for spectrogram visualizer
   */
  public getFrequencyData(outputArray: Uint8Array): void {
    if (this.analyser && this.isRunning) {
      (this.analyser as any).getByteFrequencyData(outputArray);
    } else {
      outputArray.fill(0);
    }
  }

  /**
   * Get sample rate
   */
  public getSampleRate(): number {
    return this.audioCtx ? this.audioCtx.sampleRate : 44100;
  }

  /**
   * Get FFT size
   */
  public getFftSize(): number {
    return this.analyser ? this.analyser.fftSize : 2048;
  }

  /**
   * 60 FPS analysis loop
   */
  private startAnalysisLoop() {
    const loop = () => {
      if (!this.isRunning || !this.analyser || !this.audioCtx) return;

      (this.analyser as any).getFloatTimeDomainData(this.timeDomainBuffer);
      (this.analyser as any).getByteFrequencyData(this.frequencyBuffer);

      const sampleRate = this.audioCtx.sampleRate;
      const { pitch, confidence } = detectPitch(this.timeDomainBuffer, sampleRate);

      // Manage pitch history
      if (pitch > 50) {
        this.pitchHistory.push(pitch);
        if (this.pitchHistory.length > this.maxHistoryLength) {
          this.pitchHistory.shift();
        }
      } else {
        // Decay slowly during pauses
        if (this.pitchHistory.length > 0) {
          this.pitchHistory.shift();
        }
      }

      const noteInfo = hzToNote(pitch);
      const stability = calculateStability(this.pitchHistory);

      // Resonance and formants
      const res = analyzeResonance(
        this.frequencyBuffer,
        sampleRate,
        this.analyser.fftSize,
        pitch
      );

      // Volume in dB
      let sum = 0;
      for (let i = 0; i < this.timeDomainBuffer.length; i++) {
        sum += this.timeDomainBuffer[i] * this.timeDomainBuffer[i];
      }
      const rms = Math.sqrt(sum / this.timeDomainBuffer.length);
      const volumeDb = rms > 0.0001 ? Math.max(-100, Math.round(20 * Math.log10(rms))) : -100;

      const metrics: VoiceMetrics = {
        pitch,
        note: noteInfo.note,
        octave: noteInfo.octave,
        cents: noteInfo.cents,
        confidence,
        stability,
        formantF1: res.f1,
        formantF2: res.f2,
        spectralCentroid: res.spectralCentroid,
        resonanceScore: res.resonanceScore,
        vocalWeight: res.vocalWeight,
        breathiness: res.breathiness,
        volumeDb,
        inTargetZone: false,
        timestamp: Date.now(),
      };

      const scoreInfo = calculateTargetScore(metrics, this.currentTarget);
      metrics.inTargetZone = scoreInfo.isInTarget;

      for (const cb of this.metricListeners) {
        cb(metrics);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Start recording audio take for drill evaluation and playback
   */
  public startRecording(): boolean {
    if (!this.micStream && this.activeSource === 'mic') {
      return false;
    }
    this.recordedChunks = [];
    this.recordingStartTime = Date.now();

    try {
      // If micStream is present use that, otherwise if audioCtx exists record destination
      const stream = this.micStream;
      if (!stream) return false;

      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(100);
      return true;
    } catch (e) {
      console.warn('MediaRecorder not supported or stream error:', e);
      return false;
    }
  }

  /**
   * Stop recording audio take and return Blob URL
   */
  public stopRecording(): Promise<{ blobUrl: string; durationSec: number } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      const durationSec = Math.round((Date.now() - this.recordingStartTime) / 1000);
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(blob);
        resolve({ blobUrl, durationSec });
      };

      this.mediaRecorder.stop();
    });
  }
}

// Global singleton instance
export const audioEngine = new VoiceAudioEngine();
