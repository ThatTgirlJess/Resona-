/**
 * Minimalist, Eye-Care Optimized Navigation Bar
 * Controls Track Selection, Audio Engine Sources, Active Views, and Avatar Status.
 */

import React from 'react';
import { VocalTrack } from '../types/voice';
import { AudioSourceType } from '../services/audioEngine';
import { UserGamificationState } from '../services/gamificationService';
import { AvatarRenderer } from './avatar/AvatarRenderer';
import { VoiceMetrics } from '../types/voice';
import {
  Activity,
  Mic,
  MicOff,
  Flame,
  Layers,
  Sparkles,
  Trophy,
  Brain,
  BarChart2,
  Volume2,
  ChevronDown,
  User,
  Sun,
  Users,
  MessageSquare,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  track: VocalTrack;
  onTrackChange: (track: VocalTrack) => void;
  isAudioRunning: boolean;
  activeSource: AudioSourceType;
  onToggleMic: () => void;
  onSelectSynthetic: (type: AudioSourceType) => void;
  gamification: UserGamificationState;
  metrics: VoiceMetrics;
  onOpenAffirmation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  track,
  onTrackChange,
  isAudioRunning,
  activeSource,
  onToggleMic,
  onSelectSynthetic,
  gamification,
  metrics,
  onOpenAffirmation,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Track Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-slate-100 text-base tracking-tight flex items-center gap-1.5">
                Resona
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  AI SLP
                </span>
              </span>
            </div>
          </div>

          {/* Goal / Track Toggle Pill */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onTrackChange('feminization')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                track === 'feminization'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌸 Feminization
            </button>
            <button
              type="button"
              onClick={() => onTrackChange('masculinization')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                track === 'masculinization'
                  ? 'bg-purple-600 text-slate-100 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌲 Masculinization
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {[
            { id: 'spectrograph', label: 'Spectrograph Studio', icon: Activity },
            { id: 'lounge', label: 'Voice & Chat Lounge', icon: MessageSquare },
            { id: 'warmup', label: 'Vocal Warm-Up', icon: Sun },
            { id: 'drills', label: 'Daily Drills', icon: Sparkles },
            { id: 'challenges', label: 'Challenges & Rank', icon: Trophy },
            { id: 'leaderboard', label: 'Leaderboard', icon: Users },
            { id: 'avatar', label: 'Avatar & Style', icon: User },
            { id: 'coach', label: 'AI Voice Coach', icon: Brain },
            { id: 'progress', label: 'Progress History', icon: BarChart2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-teal-300 font-semibold shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Audio Engine Controls & Mini Avatar HUD */}
        <div className="flex items-center gap-2.5">
          {/* Audio Input Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {/* Live Mic Button */}
            <button
              type="button"
              onClick={onToggleMic}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                isAudioRunning && activeSource === 'mic'
                  ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              {isAudioRunning && activeSource === 'mic' ? (
                <>
                  <Mic className="w-3.5 h-3.5" /> Mic Live
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> Turn On Mic
                </>
              )}
            </button>

            {/* Demo Audio Synthesizer Dropdown (Great for test runs without mic!) */}
            <select
              value={activeSource}
              onChange={(e) => onSelectSynthetic(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
              aria-label="Audio source or demo voice generator"
            >
              <option value="mic">Audio: Microphone</option>
              <option value="synth-fem">Demo: Feminine Voice (215Hz)</option>
              <option value="synth-masc">Demo: Masculine Voice (110Hz)</option>
              <option value="synth-siren">Demo: Pitch Siren Glide</option>
              <option value="synth-unstable">Demo: Wobble Sample</option>
            </select>
          </div>

          {/* Daily Spark / Affirmation Button */}
          <button
            type="button"
            onClick={onOpenAffirmation}
            className="px-2.5 py-1.5 rounded-xl bg-linear-to-r from-teal-500/15 to-emerald-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:scale-105"
            title="Open Daily Affirmation & Vocal Tip"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="hidden md:inline">Daily Spark</span>
          </button>

          {/* Mini Avatar in Nav */}
          <button
            type="button"
            onClick={() => onTabChange('avatar')}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Open Avatar Customizer"
          >
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 font-mono">Lv {gamification.level}</div>
              <div className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-400" />
                {gamification.streakDays}d
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700/80 overflow-hidden flex items-center justify-center">
              <AvatarRenderer
                customization={gamification.avatarCustomization}
                metrics={metrics}
                size="sm"
                showReactivity={true}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
