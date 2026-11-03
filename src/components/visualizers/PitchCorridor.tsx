/**
 * Real-Time Pitch Corridor & Musical Tuner
 * Displays target frequency corridor, live pitch cursor, musical note, and stability meter.
 */

import React, { useEffect, useRef } from 'react';
import { VoiceMetrics, VocalTarget } from '../../types/voice';
import { Music, ShieldCheck, AlertCircle } from 'lucide-react';

interface PitchCorridorProps {
  metrics: VoiceMetrics;
  target: VocalTarget;
}

export const PitchCorridor: React.FC<PitchCorridorProps> = ({ metrics, target }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (metrics.pitch > 0) {
      pitchHistoryRef.current.push(metrics.pitch);
      if (pitchHistoryRef.current.length > 100) {
        pitchHistoryRef.current.shift();
      }
    } else {
      // Add null or zero for silence
      pitchHistoryRef.current.push(0);
      if (pitchHistoryRef.current.length > 100) {
        pitchHistoryRef.current.shift();
      }
    }
  }, [metrics.pitch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#090d12';
    ctx.fillRect(0, 0, width, height);

    // Dynamic display range: from 60 Hz to 350 Hz
    const minDisplayHz = 70;
    const maxDisplayHz = 320;

    const hzToY = (hz: number) => {
      const clamped = Math.max(minDisplayHz, Math.min(maxDisplayHz, hz));
      const ratio = (clamped - minDisplayHz) / (maxDisplayHz - minDisplayHz);
      return height - ratio * height;
    };

    // Target corridor fill
    const targetTopY = hzToY(target.pitchMaxHz);
    const targetBottomY = hzToY(target.pitchMinHz);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(0, targetTopY, width, targetBottomY - targetTopY);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(0, targetTopY);
    ctx.lineTo(width, targetTopY);
    ctx.moveTo(0, targetBottomY);
    ctx.lineTo(width, targetBottomY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ideal pitch line
    const idealY = hzToY(target.pitchIdealHz);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, idealY);
    ctx.lineTo(width, idealY);
    ctx.stroke();

    // Target Label
    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.fillText(`Target: ${target.pitchIdealHz} Hz (${target.pitchMinHz}–${target.pitchMaxHz} Hz)`, 10, idealY - 4);

    // Draw scrolling pitch history line
    const history = pitchHistoryRef.current;
    if (history.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = 2.5;

      let hasStarted = false;
      for (let i = 0; i < history.length; i++) {
        const pitch = history[i];
        const x = (i / 100) * width;

        if (pitch > 0) {
          const y = hzToY(pitch);
          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          hasStarted = false;
        }
      }

      ctx.strokeStyle = metrics.inTargetZone ? '#34d399' : '#f59e0b';
      ctx.stroke();
    }

    // Current Pitch Indicator
    if (metrics.pitch > 0) {
      const currentY = hzToY(metrics.pitch);
      ctx.fillStyle = metrics.inTargetZone ? '#34d399' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(width - 8, currentY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [metrics, target]);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-amber-400" />
          <h4 className="font-semibold text-slate-100 text-sm">Pitch Stability Corridor</h4>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
          <span className="text-amber-400 font-bold">{metrics.pitch > 0 ? `${Math.round(metrics.pitch)} Hz` : '--'}</span>
          {metrics.note !== '--' && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
              {metrics.note} ({metrics.cents > 0 ? `+${metrics.cents}` : metrics.cents}¢)
            </span>
          )}
        </div>
      </div>

      <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#090d12]">
        <canvas ref={canvasRef} width={400} height={120} className="w-full h-28 block" />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          {metrics.stability >= 80 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>
            Stability: <strong className="text-slate-200">{metrics.stability}%</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500">Target Range: {target.pitchMinHz}–{target.pitchMaxHz} Hz</span>
      </div>
    </div>
  );
};
