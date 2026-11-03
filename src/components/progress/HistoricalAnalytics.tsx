/**
 * Historical Data Analysis & Progress Tracking Component
 * Visualizes longitudinal trends in Pitch F0, Resonance Control, and Stability.
 */

import React, { useState } from 'react';
import { SessionRecord, VocalTrack } from '../../types/voice';
import {
  TrendingUp,
  Calendar,
  Activity,
  Award,
  Clock,
  Sparkles,
  BarChart2,
  Trash2,
  FileDown,
  ChevronRight,
  Brain,
} from 'lucide-react';

interface HistoricalAnalyticsProps {
  history: SessionRecord[];
  track: VocalTrack;
  onClearHistory: () => void;
  onSeedDemoData: () => void;
}

export const HistoricalAnalytics: React.FC<HistoricalAnalyticsProps> = ({
  history,
  track,
  onClearHistory,
  onSeedDemoData,
}) => {
  const [filterTrack, setFilterTrack] = useState<VocalTrack | 'all'>('all');
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  const filteredHistory = history.filter((s) => filterTrack === 'all' || s.track === filterTrack);

  // Overall statistics
  const totalSessions = filteredHistory.length;
  const totalSeconds = filteredHistory.reduce((acc, s) => acc + (s.durationSec || 30), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const avgPitchAll =
    totalSessions > 0
      ? Math.round(filteredHistory.reduce((acc, s) => acc + s.avgPitch, 0) / totalSessions)
      : 0;

  const avgStabilityAll =
    totalSessions > 0
      ? Math.round(filteredHistory.reduce((acc, s) => acc + s.pitchStability, 0) / totalSessions)
      : 0;

  const avgResonanceAll =
    totalSessions > 0
      ? Math.round(filteredHistory.reduce((acc, s) => acc + s.avgResonance, 0) / totalSessions)
      : 0;

  // Chart coordinate helper (10 most recent sessions)
  const recent10 = filteredHistory.slice(-10);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Practice Time</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {totalMinutes} <span className="text-xs text-slate-500 font-sans">mins</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{totalSessions} sessions logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Average Pitch</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {avgPitchAll > 0 ? `${avgPitchAll}` : '--'} <span className="text-xs text-slate-500 font-sans">Hz</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">F0 median range</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Resonance Control</span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-400">
            {avgResonanceAll > 0 ? `${avgResonanceAll}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Vocal tract tuning</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pitch Stability</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {avgStabilityAll > 0 ? `${avgStabilityAll}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Wobble resistance</div>
        </div>
      </div>

      {/* Interactive Time-Series Progression Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pitch Trend Over Sessions */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Fundamental Pitch (F0) Progression</h3>
              <p className="text-xs text-slate-400">Tracking median pitch across recent training drills</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
              Target: {track === 'feminization' ? '185–250 Hz' : '90–140 Hz'}
            </span>
          </div>

          {/* SVG Pitch Chart */}
          <div className="h-48 w-full relative pt-2">
            {recent10.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 p-4">
                <BarChart2 className="w-8 h-8 text-slate-700 mb-2" />
                <p>Complete at least 2 drills or load sample data to generate your pitch trend curve.</p>
                <button
                  type="button"
                  onClick={onSeedDemoData}
                  className="mt-2 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Load 7-Day Sample History
                </button>
              </div>
            ) : (
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Horizontal reference grid lines */}
                <line x1="30" y1="20" x2="490" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="30" y1="80" x2="490" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="30" y1="140" x2="490" y2="140" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Y-axis labels */}
                <text x="5" y="24" fill="#64748b" fontSize="10" fontFamily="monospace">250Hz</text>
                <text x="5" y="84" fill="#64748b" fontSize="10" fontFamily="monospace">170Hz</text>
                <text x="5" y="144" fill="#64748b" fontSize="10" fontFamily="monospace">90Hz</text>

                {/* Target Range Corridor */}
                {track === 'feminization' ? (
                  <rect x="30" y="20" width="460" height="50" fill="rgba(245, 158, 11, 0.08)" />
                ) : (
                  <rect x="30" y="90" width="460" height="50" fill="rgba(168, 85, 247, 0.08)" />
                )}

                {/* Polyline */}
                {(() => {
                  const points = recent10.map((s, i) => {
                    const x = 30 + (i / (recent10.length - 1)) * 460;
                    // Scale from 80Hz (y=150) to 260Hz (y=15)
                    const clamped = Math.max(80, Math.min(260, s.avgPitch));
                    const y = 150 - ((clamped - 80) / 180) * 135;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                      {recent10.map((s, i) => {
                        const x = 30 + (i / (recent10.length - 1)) * 460;
                        const clamped = Math.max(80, Math.min(260, s.avgPitch));
                        const y = 150 - ((clamped - 80) / 180) * 135;
                        return (
                          <g key={s.id}>
                            <circle cx={x} cy={y} r="4" fill="#f59e0b" />
                            <text
                              x={x}
                              y={y - 8}
                              fill="#fde68a"
                              fontSize="9"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {Math.round(s.avgPitch)}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* Resonance & Stability Evolution Chart */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Resonance & Stability Evolution</h3>
              <p className="text-xs text-slate-400">Tracking vocal tract brightening/darkening and control</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-teal-400">
                <span className="w-2 h-2 rounded-full bg-teal-400" /> Resonance %
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Stability %
              </span>
            </div>
          </div>

          {/* SVG Resonance / Stability Chart */}
          <div className="h-48 w-full relative pt-2">
            {recent10.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 p-4">
                <BarChart2 className="w-8 h-8 text-slate-700 mb-2" />
                <p>Complete at least 2 drills to see your resonance and stability progression lines.</p>
              </div>
            ) : (
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Horizontal reference lines */}
                <line x1="30" y1="20" x2="490" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="30" y1="80" x2="490" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="30" y1="140" x2="490" y2="140" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Y-axis labels */}
                <text x="5" y="24" fill="#64748b" fontSize="10" fontFamily="monospace">100%</text>
                <text x="5" y="84" fill="#64748b" fontSize="10" fontFamily="monospace">50%</text>
                <text x="5" y="144" fill="#64748b" fontSize="10" fontFamily="monospace">0%</text>

                {/* Resonance line (Teal) */}
                {(() => {
                  const resPoints = recent10.map((s, i) => {
                    const x = 30 + (i / (recent10.length - 1)) * 460;
                    const y = 140 - (s.avgResonance / 100) * 120;
                    return `${x},${y}`;
                  }).join(' ');

                  const stabPoints = recent10.map((s, i) => {
                    const x = 30 + (i / (recent10.length - 1)) * 460;
                    const y = 140 - (s.pitchStability / 100) * 120;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={resPoints}
                      />
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                        points={stabPoints}
                      />
                      {recent10.map((s, i) => {
                        const x = 30 + (i / (recent10.length - 1)) * 460;
                        const yRes = 140 - (s.avgResonance / 100) * 120;
                        return <circle key={s.id} cx={x} cy={yRes} r="3.5" fill="#2dd4bf" />;
                      })}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Historical Drill Sessions Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-slate-100 text-sm">Session History Log</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onSeedDemoData}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Seed Sample Data
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 border border-rose-900/40"
              >
                Clear Log
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No voice training sessions recorded yet. Complete a daily drill to log your progress!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Drill Title</th>
                  <th className="py-2.5 px-3">Track</th>
                  <th className="py-2.5 px-3">Pitch F0</th>
                  <th className="py-2.5 px-3">Resonance</th>
                  <th className="py-2.5 px-3">Stability</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">AI Insights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredHistory.slice().reverse().map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 text-slate-400 font-sans whitespace-nowrap">
                      {new Date(s.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-slate-200">
                      {s.drillTitle || 'Voice Drill'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-sans font-semibold ${
                          s.track === 'feminization'
                            ? 'bg-teal-500/15 text-teal-300'
                            : 'bg-purple-500/15 text-purple-300'
                        }`}
                      >
                        {s.track}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-400">{Math.round(s.avgPitch)} Hz</td>
                    <td className="py-3 px-3 text-teal-400">{Math.round(s.avgResonance)}%</td>
                    <td className="py-3 px-3 text-emerald-400">{Math.round(s.pitchStability)}%</td>
                    <td className="py-3 px-3 font-bold text-slate-100">{s.overallScore}/100</td>
                    <td className="py-3 px-3 font-sans text-slate-400 max-w-xs truncate">
                      {s.aiFeedbackSummary || 'Target achieved'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Session Detail
                </span>
                <h3 className="text-lg font-bold text-slate-100">{selectedSession.drillTitle}</h3>
                <span className="text-xs text-slate-400">
                  {new Date(selectedSession.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Average Pitch</span>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {Math.round(selectedSession.avgPitch)} Hz
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Resonance Score</span>
                <div className="text-lg font-bold font-mono text-teal-400">
                  {Math.round(selectedSession.avgResonance)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Stability</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {Math.round(selectedSession.pitchStability)}%
                </div>
              </div>
            </div>

            {selectedSession.aiFeedbackSummary && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-teal-400">
                  <Brain className="w-4 h-4" /> AI Voice Coach Assessment:
                </div>
                <p className="leading-relaxed text-slate-300">{selectedSession.aiFeedbackSummary}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
