/**
 * Gamification Hub
 * Daily and Weekly Challenges, Level Progression, Unlockable Soothing Themes,
 * and Achievement Badges.
 */

import React from 'react';
import {
  gamificationService,
  UserGamificationState,
  THEMES,
  BADGES,
} from '../../services/gamificationService';
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface GamificationHubProps {
  gamification: UserGamificationState;
  onThemeSelect: (themeId: string) => void;
  onOpenDrills: () => void;
  onOpenLeaderboard?: () => void;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({
  gamification,
  onThemeSelect,
  onOpenDrills,
  onOpenLeaderboard,
}) => {
  const percentToNext = Math.min(
    100,
    Math.round((gamification.currentLevelXp / gamification.xpToNextLevel) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Level & Streak Hero Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-3xl font-extrabold font-mono shadow-inner">
              {gamification.level}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Level {gamification.level}
                </span>
                <span className="text-xs font-semibold text-slate-300 font-sans">
                  {gamification.levelTitle}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Vocal Mastery & Rank</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Total XP Earned:</span>
                <strong className="text-teal-400 font-mono">{gamification.totalXp} XP</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 px-5 py-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-orange-400 leading-tight">
                  {gamification.streakDays} Day{gamification.streakDays === 1 ? '' : 's'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Active Training Streak</div>
              </div>
            </div>

            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="px-4 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span>View Leaderboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Level {gamification.level} Progress</span>
            <span className="font-mono text-slate-300">
              {gamification.currentLevelXp} / {gamification.xpToNextLevel} XP ({percentToNext}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-teal-500 to-emerald-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${percentToNext}%` }}
            />
          </div>
        </div>
      </div>

      {/* Challenges Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Challenges */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-slate-100 text-sm">Today's Vocal Challenges</h3>
            </div>
            <span className="text-xs text-slate-500">Resets Midnight</span>
          </div>

          <div className="space-y-3">
            {gamification.dailyChallenges.map((ch) => {
              const progressPct = Math.min(100, Math.round((ch.currentValue / ch.targetValue) * 100));
              return (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    ch.isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ch.icon}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">{ch.title}</h4>
                        <p className="text-[11px] text-slate-400">{ch.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-400 shrink-0 font-mono">
                      +{ch.xpReward} XP
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          ch.isCompleted ? 'bg-emerald-400' : 'bg-teal-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {ch.currentValue}/{ch.targetValue}
                    </span>
                    {ch.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenDrills}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            Go to Daily Drills <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Weekly Challenges */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Weekly Endurance Milestones</h3>
            </div>
            <span className="text-xs text-slate-500">Weekly Refresh</span>
          </div>

          <div className="space-y-3">
            {gamification.weeklyChallenges.map((ch) => {
              const progressPct = Math.min(100, Math.round((ch.currentValue / ch.targetValue) * 100));
              return (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    ch.isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ch.icon}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">{ch.title}</h4>
                        <p className="text-[11px] text-slate-400">{ch.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 shrink-0 font-mono">
                      +{ch.xpReward} XP
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          ch.isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {ch.currentValue}/{ch.targetValue}
                    </span>
                    {ch.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Completing weekly challenges grants bonus XP and cosmetic theme unlocks!</span>
          </div>
        </div>
      </div>

      {/* Unlockable Cosmetic Themes Section */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Soothing Visual Eye-Care Themes</h3>
              <p className="text-xs text-slate-400">
                Unlock specialized low-glare palettes designed to eliminate eye fatigue during long sessions
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {gamification.unlockedThemes.length} / {THEMES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEMES.map((theme) => {
            const isUnlocked =
              gamification.unlockedThemes.includes(theme.id) ||
              gamification.level >= theme.requiredLevel;
            const isActive = gamification.activeThemeId === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onThemeSelect(theme.id)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                  isActive
                    ? 'border-teal-400 bg-slate-800/90 shadow-md ring-1 ring-teal-500/50'
                    : isUnlocked
                    ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    : 'border-slate-900 bg-slate-950/30 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.colors.highlight }}
                    />
                    <span className="font-semibold text-xs text-slate-200">{theme.name}</span>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                      Active
                    </span>
                  ) : !isUnlocked ? (
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Lv {theme.requiredLevel}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {theme.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>Palette preview</span>
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-700"
                      style={{ backgroundColor: theme.colors.highlight }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Badges Showcase */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Achievement Badges</h3>
              <p className="text-xs text-slate-400">Permanent acoustic milestones awarded for vocal precision</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {gamification.unlockedBadges.length} / {BADGES.length} Badges
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BADGES.map((badge) => {
            const isUnlocked = gamification.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all ${
                  isUnlocked
                    ? 'bg-slate-950/80 border-amber-500/30 shadow-xs'
                    : 'bg-slate-950/30 border-slate-900 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1.5">{badge.icon}</div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{badge.name}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{badge.description}</p>
                <div className="mt-2 text-[10px] font-mono">
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-semibold">Unlocked</span>
                  ) : (
                    <span className="text-slate-500 flex items-center justify-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
