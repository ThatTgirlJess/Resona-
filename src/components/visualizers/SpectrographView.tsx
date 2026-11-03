/**
 * Real-Time Vocal Spectrograph Visualization
 * Displays Waterfall Spectrogram, Live Harmonic Spectrum, F0 Pitch Trail,
 * and Formant (F1, F2) Resonance Tracking with Interactive SLP Interpretation Guides.
 */

import React, { useEffect, useRef, useState } from 'react';
import { VoiceMetrics, VocalTrack } from '../../types/voice';
import { audioEngine } from '../../services/audioEngine';
import {
  Activity,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SpectrographViewProps {
  metrics: VoiceMetrics;
  track: VocalTrack;
  isAudioRunning: boolean;
}

export const SpectrographView: React.FC<SpectrographViewProps> = ({
  metrics,
  track,
  isAudioRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState<'waterfall' | 'spectrum' | 'dual'>('dual');
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [colorScheme, setColorScheme] = useState<'soothing-teal' | 'emerald-sage' | 'amethyst-slate'>('soothing-teal');
  const [contrast, setContrast] = useState<number>(1.2);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  // Waterfall offscreen buffer
  const waterfallBufferRef = useRef<HTMLCanvasElement | null>(null);

  // Pitch trail history for overlay
  const pitchTrailRef = useRef<{ x: number; y: number; f0: number; inTarget: boolean }[]>([]);

  // Initialize offscreen canvas
  useEffect(() => {
    if (!waterfallBufferRef.current) {
      const buffer = document.createElement('canvas');
      buffer.width = 600;
      buffer.height = 300;
      const ctx = buffer.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d12';
        ctx.fillRect(0, 0, buffer.width, buffer.height);
      }
      waterfallBufferRef.current = buffer;
    }
  }, []);

  // Animation render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      if (isFrozen) {
        animId = requestAnimationFrame(render);
        return;
      }

      // If audio is not running, slow down render loop to idle (5 FPS)
      if (!isAudioRunning) {
        animId = window.setTimeout(render, 200) as any;
        return;
      }

      const canvas = canvasRef.current;
      const spectrumCanvas = spectrumCanvasRef.current;

      const buffer = waterfallBufferRef.current;
      const fftSize = audioEngine.getFftSize();
      const sampleRate = audioEngine.getSampleRate();
      const freqData = new Uint8Array(fftSize / 2);
      audioEngine.getFrequencyData(freqData);

      // Max frequency to render on spectrograph (4500 Hz covers human voice formants up to F3)
      const maxDisplayFreq = 4500;
      const nyquist = sampleRate / 2;
      const maxBinIndex = Math.min(
        freqData.length - 1,
        Math.floor((maxDisplayFreq / nyquist) * freqData.length)
      );

      // 1. RENDER WATERFALL SPECTROGRAM
      if (canvas && buffer) {
        const ctx = canvas.getContext('2d');
        const bCtx = buffer.getContext('2d');

        if (ctx && bCtx) {
          const width = canvas.width;
          const height = canvas.height;

          // Shift offscreen buffer left by 2px
          bCtx.drawImage(buffer, 2, 0, width - 2, height, 0, 0, width - 2, height);

          // Draw newest 2px column on the right edge of buffer
          const columnX = width - 2;

          for (let y = 0; y < height; y++) {
            // Y: 0 is highest frequency (4500Hz), height is 0Hz
            const freqRatio = 1 - y / height;
            const binIndex = Math.floor(freqRatio * maxBinIndex);
            const val = freqData[binIndex] || 0;
            const boostedVal = Math.min(255, val * contrast);

            // Get color from palette
            bCtx.fillStyle = getSpectrogramColor(boostedVal, colorScheme);
            bCtx.fillRect(columnX, y, 2, 1);
          }

          // Blit offscreen buffer onto visible canvas
          ctx.drawImage(buffer, 0, 0);

          // Target Guidelines & Overlays
          if (showOverlays) {
            drawOverlays(ctx, width, height, maxDisplayFreq, metrics, track);
          }
        }
      }

      // 2. RENDER LIVE FFT SPECTRUM & FORMANT PEAKS
      if (spectrumCanvas) {
        const sCtx = spectrumCanvas.getContext('2d');
        if (sCtx) {
          const sWidth = spectrumCanvas.width;
          const sHeight = spectrumCanvas.height;

          sCtx.fillStyle = '#0b1016';
          sCtx.fillRect(0, 0, sWidth, sHeight);

          // Grid lines
          sCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          sCtx.lineWidth = 1;
          for (let f = 500; f <= maxDisplayFreq; f += 500) {
            const x = (f / maxDisplayFreq) * sWidth;
            sCtx.beginPath();
            sCtx.moveTo(x, 0);
            sCtx.lineTo(x, sHeight);
            sCtx.stroke();
          }

          // Draw frequency curve
          sCtx.beginPath();
          sCtx.strokeStyle = colorScheme === 'emerald-sage' ? '#34d399' : '#38bdf8';
          sCtx.lineWidth = 2;

          for (let i = 0; i < maxBinIndex; i++) {
            const freq = (i / freqData.length) * nyquist;
            const x = (freq / maxDisplayFreq) * sWidth;
            const amp = freqData[i] / 255;
            const y = sHeight - amp * sHeight * 0.9 - 4;

            if (i === 0) sCtx.moveTo(x, y);
            else sCtx.lineTo(x, y);
          }
          sCtx.stroke();

          // Fill gradient under curve
          const grad = sCtx.createLinearGradient(0, 0, 0, sHeight);
          grad.addColorStop(0, colorScheme === 'emerald-sage' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(56, 189, 248, 0.22)');
          grad.addColorStop(1, 'rgba(11, 16, 22, 0)');
          sCtx.fillStyle = grad;
          sCtx.lineTo(sWidth, sHeight);
          sCtx.lineTo(0, sHeight);
          sCtx.closePath();
          sCtx.fill();

          // Highlight F0 (Pitch)
          if (metrics.pitch > 0 && metrics.pitch <= maxDisplayFreq) {
            const f0X = (metrics.pitch / maxDisplayFreq) * sWidth;
            sCtx.strokeStyle = '#f59e0b';
            sCtx.lineWidth = 2;
            sCtx.setLineDash([4, 4]);
            sCtx.beginPath();
            sCtx.moveTo(f0X, 0);
            sCtx.lineTo(f0X, sHeight);
            sCtx.stroke();
            sCtx.setLineDash([]);

            sCtx.fillStyle = '#f59e0b';
            sCtx.font = '10px monospace';
            sCtx.fillText(`F0: ${Math.round(metrics.pitch)}Hz (${metrics.note})`, f0X + 4, 16);
          }

          // Highlight F1 Formant
          if (metrics.formantF1 > 0 && metrics.formantF1 <= maxDisplayFreq) {
            const f1X = (metrics.formantF1 / maxDisplayFreq) * sWidth;
            sCtx.strokeStyle = '#a855f7';
            sCtx.lineWidth = 1.5;
            sCtx.beginPath();
            sCtx.moveTo(f1X, sHeight * 0.3);
            sCtx.lineTo(f1X, sHeight);
            sCtx.stroke();

            sCtx.fillStyle = '#c084fc';
            sCtx.font = '10px monospace';
            sCtx.fillText(`F1: ${metrics.formantF1}Hz`, f1X + 4, sHeight * 0.35);
          }

          // Highlight F2 Formant (Resonance Key!)
          if (metrics.formantF2 > 0 && metrics.formantF2 <= maxDisplayFreq) {
            const f2X = (metrics.formantF2 / maxDisplayFreq) * sWidth;
            sCtx.strokeStyle = '#2dd4bf';
            sCtx.lineWidth = 2;
            sCtx.beginPath();
            sCtx.moveTo(f2X, 0);
            sCtx.lineTo(f2X, sHeight);
            sCtx.stroke();

            sCtx.fillStyle = '#2dd4bf';
            sCtx.font = '10px monospace';
            sCtx.fillText(`F2 Oral: ${metrics.formantF2}Hz`, f2X + 4, 30);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(animId);
    };
  }, [colorScheme, contrast, showOverlays, isFrozen, metrics, track, isAudioRunning]);

  // Color mapping helper for waterfall spectrogram
  const getSpectrogramColor = (val: number, scheme: string): string => {
    if (val < 10) return '#090d12';

    const norm = val / 255;
    if (scheme === 'emerald-sage') {
      if (norm < 0.25) return `rgb(${Math.round(norm * 40)}, ${Math.round(norm * 80)}, ${Math.round(norm * 60)})`;
      if (norm < 0.6) return `rgb(${Math.round(norm * 80)}, ${Math.round(norm * 210)}, ${Math.round(norm * 140)})`;
      return `rgb(${Math.round(180 + norm * 75)}, ${Math.round(230 + norm * 25)}, ${Math.round(200 + norm * 55)})`;
    }

    if (scheme === 'amethyst-slate') {
      if (norm < 0.25) return `rgb(${Math.round(norm * 60)}, ${Math.round(norm * 40)}, ${Math.round(norm * 100)})`;
      if (norm < 0.6) return `rgb(${Math.round(norm * 140)}, ${Math.round(norm * 100)}, ${Math.round(norm * 240)})`;
      return `rgb(${Math.round(220 + norm * 35)}, ${Math.round(190 + norm * 65)}, ${Math.round(250 + norm * 5)})`;
    }

    // Default Soothing Teal
    if (norm < 0.2) return `rgb(10, ${Math.round(norm * 70)}, ${Math.round(norm * 110)})`;
    if (norm < 0.55) return `rgb(${Math.round(norm * 30)}, ${Math.round(100 + norm * 150)}, ${Math.round(140 + norm * 115)})`;
    return `rgb(${Math.round(160 + norm * 95)}, ${Math.round(230 + norm * 25)}, ${Math.round(240 + norm * 15)})`;
  };

  // Overlay guidelines
  const drawOverlays = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    maxFreq: number,
    m: VoiceMetrics,
    currTrack: VocalTrack
  ) => {
    const isFem = currTrack === 'feminization';

    // 1. Target Resonance Zone (F2 region)
    const targetF2Min = isFem ? 1750 : 850;
    const targetF2Max = isFem ? 2400 : 1300;

    const yF2Top = (1 - targetF2Max / maxFreq) * height;
    const yF2Bottom = (1 - targetF2Min / maxFreq) * height;

    ctx.fillStyle = isFem ? 'rgba(45, 212, 191, 0.08)' : 'rgba(168, 85, 247, 0.08)';
    ctx.fillRect(0, yF2Top, width, yF2Bottom - yF2Top);

    ctx.strokeStyle = isFem ? 'rgba(45, 212, 191, 0.35)' : 'rgba(168, 85, 247, 0.35)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(0, yF2Top);
    ctx.lineTo(width, yF2Top);
    ctx.moveTo(0, yF2Bottom);
    ctx.lineTo(width, yF2Bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label for target band
    ctx.fillStyle = isFem ? '#2dd4bf' : '#c084fc';
    ctx.font = '10px sans-serif';
    ctx.fillText(
      isFem ? '★ Target F2 Bright Oral Band (1750–2400 Hz)' : '★ Target F2 Dark Pharyngeal Band (850–1300 Hz)',
      12,
      yF2Top + 14
    );

    // 2. Pitch F0 Target Corridor
    const targetF0Min = isFem ? 185 : 90;
    const targetF0Max = isFem ? 250 : 140;
    const yF0Top = (1 - targetF0Max / maxFreq) * height;
    const yF0Bottom = (1 - targetF0Min / maxFreq) * height;

    ctx.fillStyle = 'rgba(245, 158, 11, 0.09)';
    ctx.fillRect(0, yF0Top, width, yF0Bottom - yF0Top);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, yF0Top);
    ctx.lineTo(width, yF0Top);
    ctx.moveTo(0, yF0Bottom);
    ctx.lineTo(width, yF0Bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(
      isFem ? 'Target Pitch Corridor (185–250 Hz)' : 'Target Pitch Corridor (90–140 Hz)',
      width - 210,
      yF0Bottom - 4
    );

    // 3. Live F0 Indicator on right edge
    if (m.pitch > 0 && m.pitch <= maxFreq) {
      const liveY = (1 - m.pitch / maxFreq) * height;
      ctx.fillStyle = m.inTargetZone ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(width - 8, liveY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal cursor guide
      ctx.strokeStyle = m.inTargetZone ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width - 50, liveY);
      ctx.lineTo(width, liveY);
      ctx.stroke();
    }
  };

  return (
    <div className="space-y-4">
      {/* Visualizer Shell */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl backdrop-blur-sm">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                Real-Time Voice Spectrograph & Formants
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono">
                  60 FPS FFT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing Fundamental Pitch (F0), Oral Resonances (F2), and Throat Depth (F1)
              </p>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-800/90 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('dual')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'dual'
                    ? 'bg-slate-700 text-teal-300 shadow font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('waterfall')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'waterfall'
                    ? 'bg-slate-700 text-teal-300 shadow font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Waterfall
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('spectrum')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'spectrum'
                    ? 'bg-slate-700 text-teal-300 shadow font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Formants
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFrozen(!isFrozen)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                isFrozen
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isFrozen ? 'Resume' : 'Freeze'}
            </button>

            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                showOverlays
                  ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle target corridor guides"
              aria-label="Toggle target corridor guides"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Canvas Surface */}
        <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-800/90 bg-[#090d12]">
          {/* Waterfall Canvas */}
          {(activeTab === 'waterfall' || activeTab === 'dual') && (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={260}
                className="w-full h-56 md:h-64 block"
              />

              {/* Y-Axis Frequency Calibration Labels */}
              <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400 select-none bg-slate-950/70 px-1.5 py-0.5 rounded backdrop-blur-xs">
                <span>4.5 kHz</span>
                <span className="text-teal-400">2.2 kHz (F2)</span>
                <span className="text-purple-400">1.0 kHz (F1)</span>
                <span className="text-amber-400">200 Hz (F0)</span>
                <span>0 Hz</span>
              </div>

              {/* Time Indicator */}
              <div className="absolute bottom-1 right-3 text-[10px] font-mono text-slate-500 pointer-events-none">
                Scroll ← Realtime
              </div>
            </div>
          )}

          {/* FFT Formant Curve Canvas */}
          {(activeTab === 'spectrum' || activeTab === 'dual') && (
            <div className="border-t border-slate-800/80 relative">
              <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded">
                Live Acoustic Energy & Resonance Peaks
              </div>
              <canvas
                ref={spectrumCanvasRef}
                width={800}
                height={120}
                className="w-full h-28 block"
              />
            </div>
          )}

          {!isAudioRunning && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 mb-2">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-slate-200 font-medium">Spectrograph Inactive</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Turn on your microphone or start a demo voice generator to see your vocal resonance and pitch live.
              </p>
            </div>
          )}
        </div>

        {/* Live Metric Ribbon */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 flex flex-col">
            <span className="text-slate-400">Current Pitch (F0)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-400">
                {metrics.pitch > 0 ? `${Math.round(metrics.pitch)}` : '--'}
              </span>
              <span className="text-slate-500 font-mono">Hz</span>
              {metrics.note !== '--' && (
                <span className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                  {metrics.note}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 flex flex-col">
            <span className="text-slate-400">F2 Oral Resonance</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-teal-400">
                {metrics.formantF2 > 0 ? `${metrics.formantF2}` : '--'}
              </span>
              <span className="text-slate-500 font-mono">Hz</span>
              <span
                className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  metrics.resonanceScore >= 65
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}
              >
                {metrics.resonanceScore >= 65 ? 'Bright' : 'Deep'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 flex flex-col">
            <span className="text-slate-400">Pitch Stability</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-lg font-bold font-mono ${
                  metrics.stability >= 85
                    ? 'text-emerald-400'
                    : metrics.stability >= 70
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {metrics.pitch > 0 ? `${metrics.stability}%` : '--'}
              </span>
              <span className="text-slate-500 text-[10px]">steady</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-2.5 flex flex-col">
            <span className="text-slate-400">Target Match</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-lg font-bold font-mono ${
                  metrics.inTargetZone ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {metrics.inTargetZone ? 'In Corridor' : 'Aligning'}
              </span>
              <div
                className={`ml-auto w-2.5 h-2.5 rounded-full ${
                  metrics.inTargetZone ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'
                }`}
              />
            </div>
          </div>
        </div>

        {/* View adjustments */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-500" /> Contrast:
            </span>
            <input
              type="range"
              min="0.8"
              max="2.2"
              step="0.1"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="w-20 accent-teal-400"
              aria-label="Adjust spectrogram contrast"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Color Palette:</span>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
              aria-label="Spectrograph color palette"
            >
              <option value="soothing-teal">Soothing Teal</option>
              <option value="emerald-sage">Emerald Sage</option>
              <option value="amethyst-slate">Amethyst Slate</option>
            </select>
          </div>
        </div>
      </div>

      {/* How to Read the Spectrograph: Detailed Interpretation Guide */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg transition-all">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-200 text-sm">
              Clinical Interpretation Guide: How to Read Your Voice Spectrograph
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 font-mono">
              SLP Guide
            </span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showGuide && (
          <div className="p-5 pt-0 border-t border-slate-800/60 text-xs space-y-4 text-slate-300">
            {/* Feminization vs Masculinization Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              {/* Feminization Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  track === 'feminization'
                    ? 'bg-teal-950/20 border-teal-500/40 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <h4 className="font-semibold text-teal-300 flex items-center gap-2">
                    <span>🌸</span> Vocal Feminization Interpretation
                  </h4>
                  {track === 'feminization' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 uppercase">
                      Active Goal
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5">
                  <li className="flex gap-2">
                    <span className="text-teal-400 font-bold">1.</span>
                    <div>
                      <strong className="text-slate-200">Elevated F2 Resonance (1800–2400 Hz):</strong>
                      <p className="text-slate-400 mt-0.5">
                        Watch the teal horizontal glow band. When you raise your larynx and arch your tongue (small dog posture),
                        this bright energy bar ascends upward on your screen.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400 font-bold">2.</span>
                    <div>
                      <strong className="text-slate-200">Fundamental Pitch F0 (190–245 Hz):</strong>
                      <p className="text-slate-400 mt-0.5">
                        Your lowest glowing line should rest in the amber corridor (A3/B3 musical notes). Avoid jumping above 260 Hz into falsetto strain.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400 font-bold">3.</span>
                    <div>
                      <strong className="text-slate-200">Light Vocal Weight & Wide Harmonics:</strong>
                      <p className="text-slate-400 mt-0.5">
                        Notice crisp, well-spaced horizontal harmonic lines without heavy mud in the 100–300 Hz sub-bass area.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Masculinization Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  track === 'masculinization'
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                    <span>🌲</span> Vocal Masculinization Interpretation
                  </h4>
                  {track === 'masculinization' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                      Active Goal
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5">
                  <li className="flex gap-2">
                    <span className="text-purple-400 font-bold">1.</span>
                    <div>
                      <strong className="text-slate-200">Deep F1/F2 Lowering (850–1300 Hz):</strong>
                      <p className="text-slate-400 mt-0.5">
                        As you yawn-sigh and relax the larynx downward, the formant peaks migrate toward the bottom of the screen, creating dark, cavernous acoustic warmth.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400 font-bold">2.</span>
                    <div>
                      <strong className="text-slate-200">Fundamental Pitch F0 (90–135 Hz):</strong>
                      <p className="text-slate-400 mt-0.5">
                        The lowest harmonic sits comfortably deep near the bottom axis (F#2–C3 notes) with a calm, grounded baseline.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-400 font-bold">3.</span>
                    <div>
                      <strong className="text-slate-200">Heavy Harmonic Density (Chest Resonance):</strong>
                      <p className="text-slate-400 mt-0.5">
                        Expect tightly packed, dense horizontal harmonic bands below 1000 Hz, reflecting full vocal fold contact and sympathetic chest vibration.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* General Acoustic Note */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-slate-400">
                <strong className="text-slate-200">Key Takeaway:</strong> Pitch (how high or low your note sounds)
                and Resonance (how large or small the acoustic space sounds) are independent!
                On this spectrograph, you can see someone speaking at 190 Hz with dark resonance (hollow/masculine)
                or 190 Hz with bright resonance (forward/feminine).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
