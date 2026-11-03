/**
 * Anonymous, Opt-In Community Leaderboard Component
 * Compete in friendly peer rankings for total 'Voice Focus Time' and 'Drill Streaks'
 * with full privacy and pseudonymity controls.
 */

import React, { useState } from 'react';
import { VocalTrack } from '../../types/voice';
import {
  leaderboardService,
  LeaderboardSettings,
  LeaderboardEntry,
  generateRandomAlias,
} from '../../services/leaderboardService';
import {
  Trophy,
  Flame,
  Clock,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Award,
  Users,
  ChevronUp,
  Check,
  Zap,
} from 'lucide-react';

interface AnonymousLeaderboardProps {
  track: VocalTrack;
  userStats: {
    focusMinutes: number;
    streakDays: number;
    level: number;
  };
}

export const AnonymousLeaderboard: React.FC<AnonymousLeaderboardProps> = ({
  track,
  userStats,
}) => {
  const [settings, setSettings] = useState<LeaderboardSettings>(
    leaderboardService.getSettings()
  );
  const [activeMetric, setActiveMetric] = useState<'focusTime' | 'streak'>('focusTime');
  const [trackFilter, setTrackFilter] = useState<VocalTrack | 'all'>('all');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const { entries, userRank, totalParticipants } = leaderboardService.getEntries(
    activeMetric,
    trackFilter,
    {
      focusMinutes: userStats.focusMinutes,
      streakDays: userStats.streakDays,
      track,
      level: userStats.level,
    }
  );

  const handleToggleOptIn = () => {
    const nextVal = !settings.isOptedIn;
    const updated = { ...settings, isOptedIn: nextVal };
    setSettings(updated);
    leaderboardService.saveSettings({ isOptedIn: nextVal });
  };

  const handleRegenerateAlias = () => {
    const newAlias = generateRandomAlias();
    const updated = { ...settings, userAlias: newAlias };
    setSettings(updated);
    leaderboardService.saveSettings({ userAlias: newAlias });
  };

  const top3 = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Privacy-First Opt-In Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-900 to-teal-950/30 border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Anonymous & Opt-In
            </span>
            <span className="text-xs text-slate-400">
              {totalParticipants} Community Members Training
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Community Focus & Streak Standings
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Boost your daily voice training motivation through friendly, supportive peer rankings.
            Your voice audio is never shared. Only your anonymous alias, focus time, and streak are listed.
          </p>
        </div>

        {/* Opt-In Switch & Pseudonym Control */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {settings.isOptedIn ? (
            <div className="flex items-center gap-2 bg-slate-950/80 border border-teal-500/30 px-3.5 py-2 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <div className="text-slate-400 text-[10px]">Your Pseudonym:</div>
                <div className="font-bold text-teal-300 font-mono">{settings.userAlias}</div>
              </div>
              <button
                type="button"
                onClick={handleRegenerateAlias}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Generate new anonymous alias"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-right sm:text-left">
              <div className="text-xs font-semibold text-slate-300">Currently Anonymous Lurker</div>
              <div className="text-[11px] text-slate-500">Not visible on leaderboard</div>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleOptIn}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              settings.isOptedIn
                ? 'bg-slate-800 hover:bg-rose-950/50 text-rose-300 border border-rose-900/40'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
            }`}
          >
            {settings.isOptedIn ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Opt Out
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Join Leaderboard
              </>
            )}
          </button>
        </div>
      </div>

      {/* Leaderboard Controls (Metric Switcher & Track Filter) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
        {/* Metric Selector */}
        <div className="flex rounded-xl bg-slate-950 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveMetric('focusTime')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeMetric === 'focusTime'
                ? 'bg-slate-800 text-teal-300 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Voice Focus Time</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('streak')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeMetric === 'streak'
                ? 'bg-slate-800 text-amber-300 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Drill Streaks</span>
          </button>
        </div>

        {/* Track / Community Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] hidden sm:inline">Filter by Track:</span>
          <div className="flex rounded-xl bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setTrackFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                trackFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Voices
            </button>
            <button
              type="button"
              onClick={() => setTrackFilter('feminization')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                trackFilter === 'feminization'
                  ? 'bg-teal-500/20 text-teal-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌸 Feminization
            </button>
            <button
              type="button"
              onClick={() => setTrackFilter('masculinization')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                trackFilter === 'masculinization'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌲 Masculinization
            </button>
          </div>
        </div>
      </div>

      {/* User Status Bar (If Opted In) */}
      {settings.isOptedIn && userRank && (
        <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/40 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center font-mono">
              #{userRank}
            </span>
            <div>
              <span className="font-semibold text-teal-300">Your Current Community Standing</span>
              <p className="text-[11px] text-slate-400">
                You are ranked #{userRank} out of {totalParticipants} active participants!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-right">
            <div>
              <div className="text-slate-400 text-[10px]">Your Focus Time</div>
              <div className="text-teal-400 font-bold">{userStats.focusMinutes} mins</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Your Streak</div>
              <div className="text-amber-400 font-bold">{userStats.streakDays}d 🔥</div>
            </div>
          </div>
        </div>
      )}

      {/* Podium Cards for Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {top3.map((entry, index) => {
            const rank = index + 1;
            const podiumStyles = {
              1: {
                border: 'border-amber-500/50',
                badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                medal: '🥇 Champion',
                glow: 'from-amber-950/20 to-transparent',
              },
              2: {
                border: 'border-slate-400/40',
                badge: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
                medal: '🥈 2nd Place',
                glow: 'from-slate-900/40 to-transparent',
              },
              3: {
                border: 'border-amber-700/40',
                badge: 'bg-amber-700/20 text-amber-300 border-amber-700/40',
                medal: '🥉 3rd Place',
                glow: 'from-amber-950/10 to-transparent',
              },
            }[rank as 1 | 2 | 3] || {
              border: 'border-slate-800',
              badge: 'bg-slate-800 text-slate-300',
              medal: `#${rank}`,
              glow: '',
            };

            return (
              <div
                key={entry.id}
                className={`rounded-2xl p-5 border ${podiumStyles.border} bg-linear-to-b ${podiumStyles.glow} bg-slate-900/90 shadow-xl flex flex-col justify-between relative overflow-hidden ${
                  entry.isCurrentUser ? 'ring-2 ring-teal-400' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${podiumStyles.badge}`}
                    >
                      {podiumStyles.medal}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        entry.track === 'feminization'
                          ? 'bg-teal-500/10 text-teal-300'
                          : 'bg-purple-500/10 text-purple-300'
                      }`}
                    >
                      {entry.track === 'feminization' ? '🌸 Fem' : '🌲 Masc'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-2">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/10"
                      style={{ backgroundColor: entry.avatarColor + '25' }}
                    >
                      {entry.avatarEmoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        {entry.alias}
                        {entry.isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                            You
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] text-slate-500">
                        Level {entry.level} Practitioner
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Focus Time</span>
                    <strong className="text-teal-400 font-bold">{entry.focusTimeMinutes}m</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Drill Streak</span>
                    <strong className="text-amber-400 font-bold">{entry.streakDays}d 🔥</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Table for Remaining Standings */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Community Standings (Ranks 4+)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Anonymous Practitioner</th>
                <th className="py-2.5 px-3">Track</th>
                <th className="py-2.5 px-3">Voice Focus Time</th>
                <th className="py-2.5 px-3">Active Streak</th>
                <th className="py-2.5 px-3">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {restEntries.map((entry, idx) => {
                const rankNumber = idx + 4;
                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-teal-950/20 text-teal-200 font-semibold'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400 font-bold">#{rankNumber}</td>
                    <td className="py-3 px-3 font-sans flex items-center gap-2">
                      <span className="text-sm">{entry.avatarEmoji}</span>
                      <span className={entry.isCurrentUser ? 'text-teal-300 font-bold' : 'text-slate-200'}>
                        {entry.alias}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-sans uppercase ${
                          entry.track === 'feminization'
                            ? 'bg-teal-500/15 text-teal-300'
                            : 'bg-purple-500/15 text-purple-300'
                        }`}
                      >
                        {entry.track}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-teal-400">{entry.focusTimeMinutes} mins</td>
                    <td className="py-3 px-3 text-amber-400">{entry.streakDays} days 🔥</td>
                    <td className="py-3 px-3 text-slate-400">Lv {entry.level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
