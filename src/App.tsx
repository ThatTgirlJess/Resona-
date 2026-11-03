/**
 * Resona - Voice Feminization & Masculinization Training App
 * Minimalist, eye-care optimized interface with real-time spectrograph,
 * personalized daily drills, gamification challenges, and cartoonish avatar companion.
 */

import React, { useEffect, useState } from 'react';
import { VocalTrack, VoiceMetrics, SessionRecord, VocalTarget } from './types/voice';
import { audioEngine, AudioSourceType } from './services/audioEngine';
import {
  gamificationService,
  UserGamificationState,
  AvatarCustomization,
} from './services/gamificationService';
import { getDefaultTarget } from './utils/audioMath';
import { Navbar } from './components/Navbar';
import { SpectrographView } from './components/visualizers/SpectrographView';
import { ResonanceGauge } from './components/visualizers/ResonanceGauge';
import { PitchCorridor } from './components/visualizers/PitchCorridor';
import { PersonalizedDailyDrills } from './components/drills/PersonalizedDailyDrills';
import { GamificationHub } from './components/challenges/GamificationHub';
import { AvatarCustomizer } from './components/avatar/AvatarCustomizer';
import { AiCoachView } from './components/coach/AiCoachView';
import { HistoricalAnalytics } from './components/progress/HistoricalAnalytics';
import { VocalWarmupModule } from './components/warmup/VocalWarmupModule';
import { AnonymousLeaderboard } from './components/leaderboard/AnonymousLeaderboard';
import { CommunityPracticeLounge } from './components/social/CommunityPracticeLounge';
import { DailyAffirmationModal } from './components/affirmation/DailyAffirmationModal';
import { dailyAffirmationService } from './services/dailyAffirmationService';
import { leaderboardService } from './services/leaderboardService';
import {
  Sparkles,
  Activity,
  Layers,
  Award,
  Volume2,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Sun,
} from 'lucide-react';

const SESSIONS_STORAGE_KEY = 'resona_sessions_v2';

export default function App() {
  const [track, setTrack] = useState<VocalTrack>('feminization');
  const [activeTab, setActiveTab] = useState<string>('spectrograph');

  // Live Audio Metrics state (updated at 60fps)
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    pitch: 0,
    note: '--',
    octave: 0,
    cents: 0,
    confidence: 0,
    stability: 85,
    formantF1: 500,
    formantF2: 1750,
    spectralCentroid: 1400,
    resonanceScore: 65,
    vocalWeight: 40,
    breathiness: 20,
    volumeDb: -100,
    inTargetZone: false,
    timestamp: Date.now(),
  });

  const [isAudioRunning, setIsAudioRunning] = useState<boolean>(false);
  const [activeSource, setActiveSource] = useState<AudioSourceType>('mic');
  const [target, setTarget] = useState<VocalTarget>(getDefaultTarget('feminization'));

  // Gamification state
  const [gamification, setGamification] = useState<UserGamificationState>(
    gamificationService.getState()
  );

  // History state
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return getInitialSeedSessions();
  });

  // Daily Affirmation Modal State
  const [isAffirmationOpen, setIsAffirmationOpen] = useState<boolean>(false);

  // Present affirmation on first login of the day
  useEffect(() => {
    if (!dailyAffirmationService.hasSeenToday()) {
      setIsAffirmationOpen(true);
    }
  }, []);

  // Track change handler
  const handleTrackChange = (newTrack: VocalTrack) => {
    setTrack(newTrack);
    setTarget(getDefaultTarget(newTrack));
    audioEngine.setTrack(newTrack);
  };

  // Subscribe to audio engine
  useEffect(() => {
    const unsubMetrics = audioEngine.subscribeMetrics((m) => {
      setMetrics(m);
    });

    const unsubState = audioEngine.subscribeState((running, source) => {
      setIsAudioRunning(running);
      setActiveSource(source);
    });

    const unsubGamification = gamificationService.subscribe((g) => {
      setGamification(g);
    });

    return () => {
      unsubMetrics();
      unsubState();
      unsubGamification();
      audioEngine.stop();
    };
  }, []);

  // Save history to localStorage
  const handleSaveSession = (newSession: SessionRecord) => {
    setHistory((prev) => {
      const updated = [...prev, newSession];
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
    } catch (e) {}
  };

  const handleSeedDemoData = () => {
    const seeds = getInitialSeedSessions();
    setHistory(seeds);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(seeds));
    } catch (e) {}
  };

  // Audio toggles
  const handleToggleMic = () => {
    if (isAudioRunning && activeSource === 'mic') {
      audioEngine.stop();
    } else {
      audioEngine.startMic();
    }
  };

  const handleSelectSynthetic = (source: AudioSourceType) => {
    if (source === 'mic') {
      audioEngine.startMic();
    } else {
      audioEngine.startSynthetic(source as any);
    }
  };

  // Avatar updates
  const handleUpdateAvatar = (custom: Partial<AvatarCustomization>) => {
    gamificationService.setAvatarCustomization(custom);
  };

  // Theme selector
  const handleThemeSelect = (themeId: string) => {
    gamificationService.setTheme(themeId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        track={track}
        onTrackChange={handleTrackChange}
        isAudioRunning={isAudioRunning}
        activeSource={activeSource}
        onToggleMic={handleToggleMic}
        onSelectSynthetic={handleSelectSynthetic}
        gamification={gamification}
        metrics={metrics}
        onOpenAffirmation={() => setIsAffirmationOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* VIEW 1: SPECTROGRAPH LIVE STUDIO */}
        {activeTab === 'spectrograph' && (
          <div className="space-y-6">
            {/* Quick Live Mode Helper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="font-semibold text-slate-200">
                  {track === 'feminization' ? '🌸 Feminization Mode:' : '🌲 Masculinization Mode:'}
                </span>
                <span className="text-slate-400">
                  {track === 'feminization'
                    ? 'Elevating F2 resonance (>70%) and targeting 185–250 Hz pitch corridor'
                    : 'Deepening pharyngeal resonance (<35%) and grounding pitch at 90–140 Hz'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAffirmationOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Daily Spark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('warmup')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Warm Up First</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('drills')}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Daily Drills</span>
                </button>
              </div>
            </div>

            {/* Spectrograph Primary Surface */}
            <SpectrographView
              metrics={metrics}
              track={track}
              isAudioRunning={isAudioRunning}
            />

            {/* Twin Secondary Visualizers: Resonance Gauge + Pitch Corridor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResonanceGauge
                metrics={metrics}
                target={target}
                track={track}
              />
              <PitchCorridor
                metrics={metrics}
                target={target}
              />
            </div>
          </div>
        )}

        {/* VIEW: REAL-TIME VOICE CHAT & TEXT MESSAGING LOUNGE */}
        {activeTab === 'lounge' && (
          <CommunityPracticeLounge
            currentTrack={track}
            userAvatar={gamification.avatarCustomization}
            userHandle={leaderboardService.getSettings().userAlias}
            liveMetrics={metrics}
            onSelectDrill={() => setActiveTab('drills')}
          />
        )}

        {/* VIEW: VOCAL WARM-UP MODULE */}
        {activeTab === 'warmup' && (
          <VocalWarmupModule
            track={track}
            metrics={metrics}
            onWarmupComplete={() => {}}
            onNavigateToDrills={() => setActiveTab('drills')}
          />
        )}

        {/* VIEW 2: PERSONALIZED DAILY DRILLS */}
        {activeTab === 'drills' && (
          <PersonalizedDailyDrills
            track={track}
            metrics={metrics}
            history={history}
            onSaveSession={handleSaveSession}
            onRequestSwitchTab={setActiveTab}
          />
        )}

        {/* VIEW 3: GAMIFICATION & CHALLENGES */}
        {activeTab === 'challenges' && (
          <GamificationHub
            gamification={gamification}
            onThemeSelect={handleThemeSelect}
            onOpenDrills={() => setActiveTab('drills')}
            onOpenLeaderboard={() => setActiveTab('leaderboard')}
          />
        )}

        {/* VIEW: ANONYMOUS OPT-IN LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <AnonymousLeaderboard
            track={track}
            userStats={{
              focusMinutes: Math.max(
                18,
                Math.round(history.reduce((a, b) => a + (b.durationSec || 30), 0) / 60)
              ),
              streakDays: gamification.streakDays,
              level: gamification.level,
            }}
          />
        )}

        {/* VIEW 4: CARTOONISH AVATAR CUSTOMIZER */}
        {activeTab === 'avatar' && (
          <AvatarCustomizer
            gamification={gamification}
            onUpdateAvatar={handleUpdateAvatar}
            metrics={metrics}
          />
        )}

        {/* VIEW 5: AI COACH CONSULTATION */}
        {activeTab === 'coach' && (
          <AiCoachView
            track={track}
            metrics={metrics}
          />
        )}

        {/* VIEW 6: HISTORICAL PROGRESS ANALYTICS */}
        {activeTab === 'progress' && (
          <HistoricalAnalytics
            history={history}
            track={track}
            onClearHistory={handleClearHistory}
            onSeedDemoData={handleSeedDemoData}
          />
        )}
      </main>

      {/* Daily Affirmation & Motivational Spark Modal */}
      <DailyAffirmationModal
        isOpen={isAffirmationOpen}
        onClose={() => setIsAffirmationOpen(false)}
        track={track}
        onNavigateToWarmup={() => setActiveTab('warmup')}
        onXpAwarded={(xp) => {
          // Re-fetch gamification state or let event listener handle it
        }}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Resona Voice Training • Acoustic SLP & Gender-Affirming Voice Lab</span>
          <span>Designed with soothing low-glare palettes to prevent eye fatigue</span>
        </div>
      </footer>
    </div>
  );
}

// Initial seed sessions for historical analytics demonstration
function getInitialSeedSessions(): SessionRecord[] {
  return [
    {
      id: 'seed-1',
      timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      track: 'feminization',
      drillId: 'fem-whisper-siren',
      drillTitle: 'Silent Whisper Siren',
      durationSec: 45,
      avgPitch: 195,
      minPitch: 180,
      maxPitch: 220,
      pitchStability: 74,
      avgResonance: 58,
      avgVocalWeight: 44,
      overallScore: 72,
      aiFeedbackSummary: 'Good initial larynx elevation; watch for tongue root tension.',
    },
    {
      id: 'seed-2',
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      track: 'feminization',
      drillId: 'fem-small-dog-pant',
      drillTitle: 'Small Dog Pant (Vocal Tract Shortening)',
      durationSec: 45,
      avgPitch: 204,
      minPitch: 185,
      maxPitch: 228,
      pitchStability: 80,
      avgResonance: 66,
      avgVocalWeight: 38,
      overallScore: 81,
      aiFeedbackSummary: 'Noticeable brightening in F2 formant band. Resonance gauge reached 66%.',
    },
    {
      id: 'seed-3',
      timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      track: 'feminization',
      drillId: 'fem-bright-vowel-shaping',
      drillTitle: 'Bright Vowel Chain (/i/ → /e/)',
      durationSec: 50,
      avgPitch: 212,
      minPitch: 198,
      maxPitch: 232,
      pitchStability: 86,
      avgResonance: 74,
      avgVocalWeight: 34,
      overallScore: 89,
      aiFeedbackSummary: 'Excellent forward oral placement and steady cricothyroid control!',
    },
    {
      id: 'seed-4',
      timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      track: 'feminization',
      drillId: 'fem-pitch-corridor-sustain',
      drillTitle: 'Laser Pitch Stability Corridor',
      durationSec: 45,
      avgPitch: 216,
      minPitch: 208,
      maxPitch: 225,
      pitchStability: 91,
      avgResonance: 79,
      avgVocalWeight: 32,
      overallScore: 94,
      aiFeedbackSummary: 'Exceptional stability score of 91% with bright vocal tract resonance.',
    },
  ];
}
