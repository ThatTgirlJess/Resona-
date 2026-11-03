/**
 * Daily Affirmation & Vocal Success Tip Modal
 * Presents an SLP-grounded motivational quote and physiological success tip
 * on first daily login to boost confidence and reduce vocal anxiety.
 */

import React, { useState, useEffect } from 'react';
import { VocalTrack } from '../../types/voice';
import {
  dailyAffirmationService,
  AffirmationItem,
} from '../../services/dailyAffirmationService';
import {
  Sparkles,
  Heart,
  X,
  Volume2,
  RefreshCw,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sun,
  ShieldCheck,
  Wind,
  Flame,
} from 'lucide-react';

interface DailyAffirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: VocalTrack;
  onNavigateToWarmup?: () => void;
  onXpAwarded?: (xp: number) => void;
}

export const DailyAffirmationModal: React.FC<DailyAffirmationModalProps> = ({
  isOpen,
  onClose,
  track,
  onNavigateToWarmup,
  onXpAwarded,
}) => {
  const [currentAffirmation, setCurrentAffirmation] = useState<AffirmationItem>(() =>
    dailyAffirmationService.getTodayAffirmation(track)
  );
  const [isFav, setIsFav] = useState<boolean>(() =>
    dailyAffirmationService.isFavorite(currentAffirmation.id)
  );
  const [hasClaimed, setHasClaimed] = useState<boolean>(() =>
    dailyAffirmationService.hasClaimedBonusToday()
  );
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  // Somatic Breathing Pacer state (4-7-8 tension release)
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale (4s)' | 'Hold & Soften (7s)' | 'Gentle Sigh Exhale (8s)'>('Inhale (4s)');
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(4);

  // Favorites Drawer toggle
  const [showFavoritesView, setShowFavoritesView] = useState<boolean>(false);
  const [favoriteList, setFavoriteList] = useState<AffirmationItem[]>(() =>
    dailyAffirmationService.getFavoriteAffirmations()
  );

  // Update affirmation when track changes
  useEffect(() => {
    const todayItem = dailyAffirmationService.getTodayAffirmation(track);
    setCurrentAffirmation(todayItem);
    setIsFav(dailyAffirmationService.isFavorite(todayItem.id));
    setHasClaimed(dailyAffirmationService.hasClaimedBonusToday());
  }, [track]);

  // Breathing timer cycle
  useEffect(() => {
    if (!isBreathingActive) return;

    let phase = 0; // 0 = Inhale (4s), 1 = Hold (7s), 2 = Exhale (8s)
    let remaining = 4;
    setBreathPhase('Inhale (4s)');
    setBreathSecondsLeft(4);

    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (phase === 0) {
          phase = 1;
          remaining = 7;
          setBreathPhase('Hold & Soften (7s)');
        } else if (phase === 1) {
          phase = 2;
          remaining = 8;
          setBreathPhase('Gentle Sigh Exhale (8s)');
        } else {
          // Completed one cycle
          setIsBreathingActive(false);
          setClaimFeedback('Centering breath complete. Larynx relaxed!');
          setTimeout(() => setClaimFeedback(null), 3500);
          return;
        }
      }
      setBreathSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  if (!isOpen) return null;

  const handleToggleFavorite = (item: AffirmationItem) => {
    const updated = dailyAffirmationService.toggleFavorite(item.id);
    if (item.id === currentAffirmation.id) {
      setIsFav(updated);
    }
    setFavoriteList(dailyAffirmationService.getFavoriteAffirmations());
  };

  const handleShuffleAffirmation = () => {
    const nextItem = dailyAffirmationService.getRandomAffirmation(track, currentAffirmation.id);
    setCurrentAffirmation(nextItem);
    setIsFav(dailyAffirmationService.isFavorite(nextItem.id));
  };

  const handleClaimBonus = () => {
    if (hasClaimed) return;
    const result = dailyAffirmationService.claimDailyBonus();
    if (result.success) {
      setHasClaimed(true);
      setClaimFeedback('+10 XP Claimed! Mindful vocal habit rewarded.');
      if (onXpAwarded) {
        onXpAwarded(result.xpAwarded);
      }
      setTimeout(() => setClaimFeedback(null), 4000);
    }
  };

  const handleStartSession = () => {
    dailyAffirmationService.markSeenToday();
    onClose();
    if (onNavigateToWarmup) {
      onNavigateToWarmup();
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const greeting = dailyAffirmationService.getTimeGreeting();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="affirmation-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 flex flex-col gap-6">
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Daily Voice Spark
              </span>
              <span className="text-xs text-slate-400 font-mono">{formattedDate}</span>
            </div>
            <h2 id="affirmation-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{greeting}, Voice Explorer</span>
            </h2>
            <p className="text-xs text-slate-400">
              {track === 'feminization'
                ? '🌸 Feminine Acoustic Focus • Resonance Elevation & Gentle Soft Phonation'
                : '🌲 Masculine Acoustic Focus • Pharyngeal Expansion & Grounded Depth'}
            </p>
          </div>

          {/* Action Icons: Favorite & Close */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleFavorite(currentAffirmation)}
              className={`p-2 rounded-xl border transition-all ${
                isFav
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
              }`}
              title={isFav ? 'Remove from favorites' : 'Save to favorite affirmations'}
              aria-label="Toggle favorite affirmation"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400 stroke-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                dailyAffirmationService.markSeenToday();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-100 hover:bg-slate-700 transition-colors"
              title="Close modal"
              aria-label="Close daily affirmation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Toggle: Today's Spark vs Saved Favorites */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex rounded-xl bg-slate-950/80 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setShowFavoritesView(false)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                !showFavoritesView
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today's Affirmation
            </button>
            <button
              type="button"
              onClick={() => setShowFavoritesView(true)}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                showFavoritesView
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Saved Sparks ({favoriteList.length})</span>
            </button>
          </div>

          {!showFavoritesView && (
            <button
              type="button"
              onClick={handleShuffleAffirmation}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 text-[11px] font-semibold transition-all shadow-xs"
              title="Get another quote or physiological tip"
            >
              <RefreshCw className="w-3 h-3 text-teal-400" />
              <span>Another Tip</span>
            </button>
          )}
        </div>

        {/* MAIN BODY: TODAY'S AFFIRMATION VIEW */}
        {!showFavoritesView ? (
          <div className="space-y-5">
            {/* Motivational Quote Card */}
            <div className="relative rounded-2xl bg-linear-to-br from-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                  #{currentAffirmation.tag}
                </span>
                <span className="text-xs text-slate-400 capitalize flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  {currentAffirmation.category.replace('-', ' ')}
                </span>
              </div>

              <blockquote className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed italic border-l-2 border-teal-400/60 pl-4 my-2">
                "{currentAffirmation.quote}"
              </blockquote>

              <div className="text-right text-xs text-slate-400 font-semibold mt-2">
                — {currentAffirmation.author}
              </div>
            </div>

            {/* Physiological Vocal Success Tip */}
            <div className="rounded-2xl bg-slate-950/70 border border-teal-500/20 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <span>SLP Clinical Tip: {currentAffirmation.tipTitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
                {currentAffirmation.tipContent}
              </p>

              {/* Actionable Cue Pill */}
              <div className="mt-3 ml-8 p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/40 text-xs text-teal-200 flex items-start gap-2">
                <span className="font-bold text-teal-400 whitespace-nowrap">✨ Action Cue:</span>
                <span>{currentAffirmation.actionableCue}</span>
              </div>
            </div>

            {/* Somatic Centering & False Vocal Fold Release Micro-Pacer (4-7-8) */}
            <div className="rounded-2xl bg-slate-950/50 border border-slate-800/80 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Wind className="w-4 h-4 text-teal-400" />
                  <span>Somatic Centering (15-sec Laryngeal Release)</span>
                </div>
                {!isBreathingActive ? (
                  <button
                    type="button"
                    onClick={() => setIsBreathingActive(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold text-[11px] transition-colors"
                  >
                    Start Breath Pacer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsBreathingActive(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 font-semibold text-[11px]"
                  >
                    Stop
                  </button>
                )}
              </div>

              {isBreathingActive ? (
                <div className="flex flex-col items-center justify-center py-3 space-y-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-1000 ${
                      breathPhase.startsWith('Inhale')
                        ? 'scale-110 bg-teal-500/20 border-teal-400 text-teal-300'
                        : breathPhase.startsWith('Hold')
                        ? 'scale-100 bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'scale-90 bg-purple-500/20 border-purple-400 text-purple-300'
                    }`}
                  >
                    {breathSecondsLeft}s
                  </div>
                  <div className="text-sm font-bold text-slate-200">{breathPhase}</div>
                  <p className="text-[11px] text-slate-400 text-center max-w-xs">
                    Drop shoulders and feel throat muscles soften like warm honey.
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px]">
                  Take 15 seconds to release tension in the false vocal cords before speaking.
                </p>
              )}
            </div>

            {/* Bonus XP Claim Banner */}
            {claimFeedback && (
              <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{claimFeedback}</span>
              </div>
            )}
          </div>
        ) : (
          /* SAVED FAVORITES VIEW */
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {favoriteList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                <Heart className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No saved affirmations yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click the heart icon on any quote or vocal tip to keep it in your personal sanctuary.
                </p>
              </div>
            ) : (
              favoriteList.map((fav) => (
                <div
                  key={fav.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-300">#{fav.tag}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(fav)}
                      className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-400" />
                      <span>Remove</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 italic">"{fav.quote}"</p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>— {fav.author}</span>
                    <span className="text-teal-400 font-medium">Tip: {fav.tipTitle}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="relative pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClaimBonus}
              disabled={hasClaimed}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                hasClaimed
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                  : 'bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md hover:scale-[1.02]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{hasClaimed ? '✓ Daily +10 XP Claimed' : 'Claim Daily +10 XP'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                dailyAffirmationService.markSeenToday();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleStartSession}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Warm Up Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
