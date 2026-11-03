/**
 * Daily Affirmation & Vocal Success Tip Service
 * Delivers track-aware, clinical Speech-Language Pathology (SLP) affirmations,
 * confidence boosters, and physiological vocal tips upon the first login of each day.
 */

import { VocalTrack } from '../types/voice';
import { gamificationService } from './gamificationService';

export interface AffirmationItem {
  id: string;
  quote: string;
  author: string;
  tipTitle: string;
  tipContent: string;
  actionableCue: string;
  category: 'confidence' | 'physiology' | 'dysphoria-relief' | 'mindset';
  track: 'feminization' | 'masculinization' | 'universal';
  tag: string;
}

export const AFFIRMATIONS_CATALOG: AffirmationItem[] = [
  // Feminization Track
  {
    id: 'fem-01',
    quote: 'Your voice is not a static biological given; it is a musical instrument shaped by neuromuscular coordination and muscle memory.',
    author: 'SLP Transgender Voice Clinical Guide',
    tipTitle: 'Resonance Over Raw Pitch',
    tipContent: 'Perception of feminine vocal timbre is 70% vocal tract resonance (F1/F2 ratio) and only 30% fundamental pitch (F0). Do not strain your vocal folds reaching for high notes; gentle bright oral resonance is where genuine femininity lives.',
    actionableCue: 'Focus your vibration behind your top front teeth rather than high in the throat.',
    category: 'physiology',
    track: 'feminization',
    tag: 'Resonance Mastery',
  },
  {
    id: 'fem-02',
    quote: 'Be patient with the mirror of your ears. Neuroplasticity requires gentle repetition, not forceful effort.',
    author: 'Voice Affirmation Lab',
    tipTitle: 'Relaxing False Vocal Folds',
    tipContent: 'When we try too hard to sound higher, the false vocal folds (ventricular cords) reflexively squeeze inward, producing a strained, thin tone. Sigh out a silent gentle breath like fogging a pair of glasses to keep the airway spacious.',
    actionableCue: 'Maintain the open, cool feeling at the back of your throat as you begin phonation.',
    category: 'confidence',
    track: 'feminization',
    tag: 'Constriction Release',
  },
  {
    id: 'fem-03',
    quote: 'Vocal dysphoria often tells lies about what others hear. You are hearing your bone conduction, not the beautiful acoustic wave propagating into the room.',
    author: 'Acoustic Voice Psychology',
    tipTitle: 'Bone Conduction Reality Check',
    tipContent: 'Your skull conducts low frequencies directly to your inner ear, making your own voice sound heavier to you than to anyone listening. Trust the objective spectrograph and resonance gauge—they measure the actual air pressure wave.',
    actionableCue: 'Record a 5-second clip and play it back with headphones to hear your true external acoustics.',
    category: 'dysphoria-relief',
    track: 'feminization',
    tag: 'Dysphoria Comfort',
  },
  {
    id: 'fem-04',
    quote: 'Bright resonance is an invitation to play, like sunlight bouncing across water.',
    author: 'Dr. Evelyn Ward, SLP',
    tipTitle: 'The Gentle Smile Muscle (Zygomaticus)',
    tipContent: 'Subtle contraction of the cheek muscles (zygomaticus major) naturally shortens the anterior oral tract by 3-5mm. This passively raises formant F2 without any neck tension.',
    actionableCue: 'Let a warm, faint smile grace your cheeks while pronouncing "ee" [i] and "ay" [e].',
    category: 'physiology',
    track: 'feminization',
    tag: 'Acoustic Brightness',
  },
  {
    id: 'fem-05',
    quote: 'Every day you practice, your brain builds new myelin sheaths around the laryngeal motor pathways.',
    author: 'Neurobiology of Phonation',
    tipTitle: 'Thin Vocal Fold Edges (M1 to M2 Transition)',
    tipContent: 'Feminine voice utilizes thinner vibrating vocal fold mass (cricothyroid tilt). Practice gentle "mm-hmm" affirmations as if agreeing with a friend to find your effortless lighter vocal weight.',
    actionableCue: 'Notice how feather-light the "mm-hmm" feels—strive to keep that lightness in normal sentences.',
    category: 'mindset',
    track: 'feminization',
    tag: 'Vocal Weight',
  },
  {
    id: 'fem-06',
    quote: 'Your voice belongs to you. It does not define your authenticity—it is a creative canvas that reflects your truth.',
    author: 'Voice Empowerment Initiative',
    tipTitle: 'Sentence Intonation & Melodic Varied Contours',
    tipContent: 'Feminine speech patterns often naturally feature upward inflections and dynamic pitch contours. Avoid flat, monotone cadences by letting your pitch gently dance across key emotional words.',
    actionableCue: 'Emphasize adjectives with a gentle pitch swoop rather than increased volume.',
    category: 'confidence',
    track: 'feminization',
    tag: 'Prosody & Melodics',
  },

  // Masculinization Track
  {
    id: 'masc-01',
    quote: 'True vocal depth comes from expansive resonance and grounded breath, not throat pressing.',
    author: 'Masculine Acoustic Mechanics',
    tipTitle: 'Lowering the Laryngeal Baseline Safely',
    tipContent: 'Pressing your chin into your neck creates tension and hoarseness. Deep resonance comes from an open pharyngeal space (expanded throat). Think of yawning gently behind closed lips to allow the thyroid cartilage to settle naturally.',
    actionableCue: 'Imagine an open cavern at the root of your tongue; feel the drop in resonance naturally.',
    category: 'physiology',
    track: 'masculinization',
    tag: 'Pharyngeal Space',
  },
  {
    id: 'masc-02',
    quote: 'Your resonance is your anchor. Give yourself permission to take up acoustic space in every room.',
    author: 'Trans Masculine SLP Practice',
    tipTitle: 'Chest Wall Sympathetic Resonance',
    tipContent: 'Place your flat palm over the center of your sternum. Speak the low vowel "AW" or "OH". You should feel steady, warm vibration beneath your hand. That tactile feedback confirms full vocal fold contact (Modal Register M1).',
    actionableCue: 'Aim your vocal energy straight downward toward your sternum.',
    category: 'confidence',
    track: 'masculinization',
    tag: 'Chest Resonance',
  },
  {
    id: 'masc-03',
    quote: 'Patience through vocal changes: your thyroarytenoid muscles are adapting, growing, and recalibrating.',
    author: 'Hormonal Phonation Research',
    tipTitle: 'Navigating Pitch Breaks & Instability',
    tipContent: 'Voice cracking during testosterone therapy or masculinization drills is a normal sign of tissue remodeling and fluid shifts. Never force through a crack; ease off with gentle humming on a straw to restore mucosal alignment.',
    actionableCue: 'If your voice catches, pause, take a diaphragmatic breath, and resume at 70% volume.',
    category: 'dysphoria-relief',
    track: 'masculinization',
    tag: 'Vocal Health',
  },
  {
    id: 'masc-04',
    quote: 'Masculine prosody is grounded in economy of movement and steady cadence.',
    author: 'Sociophonetics & Gender Expression',
    tipTitle: 'Downward Terminal Pitch Glide',
    tipContent: 'A hallmark of masculine speech prosody is allowing pitch to gently cascade downward at the end of statements rather than stepping upward. This conveys grounding and calm authority.',
    actionableCue: 'End your sentences with a gentle descent down the musical scale.',
    category: 'mindset',
    track: 'masculinization',
    tag: 'Prosody Grounding',
  },
  {
    id: 'masc-05',
    quote: 'You do not have to growl to sound masculine. Warmth and depth are far more resonant than gravel.',
    author: 'Vocal Pedagogy Journal',
    tipTitle: 'Open Jaw Hinge & Tongue Root Relaxation',
    tipContent: 'A clenched jaw traps sound in the mouth and raises resonant frequencies. Drop your lower jaw 3 millimeters more on "AH" and "OH" vowels to create a larger acoustic chamber that amplifies lower harmonics.',
    actionableCue: 'Massage the jaw hinge right in front of your earlobes before speaking.',
    category: 'physiology',
    track: 'masculinization',
    tag: 'Acoustic Volume',
  },

  // Universal Mindful Track
  {
    id: 'uni-01',
    quote: 'The voice is the only instrument where the player and the instrument are one and the same. Treat yourself with reverence.',
    author: 'Ingo Titze, Ph.D., Voice Acoustic Scientist',
    tipTitle: 'Systemic Hydration & The Mucosal Wave',
    tipContent: 'Your vocal cords vibrate up to 250 times every single second. They need internal hydration to maintain their supple gelatinous mucosal wave. Water consumed now takes 2 to 3 hours to hydrate vocal fold tissue.',
    actionableCue: 'Keep a glass of room-temperature water nearby and take mindful sips throughout practice.',
    category: 'physiology',
    track: 'universal',
    tag: 'Vocal Hygiene',
  },
  {
    id: 'uni-02',
    quote: 'Progress in voice modification is non-linear. The days that feel clumsy are the very days your brain is reorganizing.',
    author: 'Neuro-Rehabilitation Principles',
    tipTitle: 'The 1% Micro-Shift Rule',
    tipContent: 'Attempting a 100% voice transformation in a single session triggers defensive muscle tension. Aim for a 1% clearer resonance or 5 Hz smoother glide. Micro-shifts compound into permanent vocal transformation.',
    actionableCue: 'Celebrate one small acoustic win today, no matter how modest it might feel.',
    category: 'mindset',
    track: 'universal',
    tag: 'Consistency',
  },
  {
    id: 'uni-03',
    quote: 'Breathe into your lower ribs. Your voice rides atop the column of air like a leaf floating on a river.',
    author: 'Somatic Voice Therapy',
    tipTitle: 'Diaphragmatic Freedom (No Shoulder Rise)',
    tipContent: 'Shallow chest breathing activates the scalene and sternocleidomastoid neck muscles, tightening the larynx. Place one hand on your lower belly and feel it expand gently on inhale, keeping your shoulders motionless.',
    actionableCue: 'Inhale through your nose for 4 seconds, feeling your belt line expand laterally.',
    category: 'physiology',
    track: 'universal',
    tag: 'Breath Support',
  },
  {
    id: 'uni-04',
    quote: 'You do not owe anyone a stereotype. The best voice in the world is the one that lets you speak your truth without exhaustion.',
    author: 'Gender-Affirming SLP Collective',
    tipTitle: 'Vocal Fatigue Check & The Straw Reset',
    tipContent: 'If your throat feels scratchy, dry, or tired, stop high-pitch drills immediately. Do 60 seconds of gentle bubbling through a drinking straw into half a glass of water (SOVTE). It balances subglottic pressure and massages the cords.',
    actionableCue: 'Listen to vocal fatigue as an ally signaling when to rest, not as a failure.',
    category: 'dysphoria-relief',
    track: 'universal',
    tag: 'Self-Compassion',
  },
  {
    id: 'uni-05',
    quote: 'Every voice explorer before you felt unsure at the beginning. You are walking a proven path of vocal mastery.',
    author: 'Resona Community Ethos',
    tipTitle: 'Warm Up Before High Demands',
    tipContent: 'Athletes never sprint without warming up their hamstrings; singers never perform without warming up their vocal folds. Spending 3 minutes on lip trills and gentle humming cuts vocal strain by over 60%.',
    actionableCue: 'Always visit the Warm-Up tab before tackling challenging resonance drills.',
    category: 'confidence',
    track: 'universal',
    tag: 'Athletic Preparation',
  },
];

const STORAGE_LAST_SEEN = 'resona_affirmation_last_seen_date';
const STORAGE_CLAIMED = 'resona_affirmation_claimed_dates';
const STORAGE_FAVORITES = 'resona_affirmation_favorites';

export class DailyAffirmationService {
  /**
   * Check if the user has already seen their daily affirmation today.
   */
  public hasSeenToday(): boolean {
    try {
      const lastSeen = localStorage.getItem(STORAGE_LAST_SEEN);
      const today = this.getTodayDateString();
      return lastSeen === today;
    } catch {
      return false;
    }
  }

  /**
   * Mark that the user has seen their daily affirmation today.
   */
  public markSeenToday(): void {
    try {
      const today = this.getTodayDateString();
      localStorage.setItem(STORAGE_LAST_SEEN, today);
    } catch (e) {
      console.warn('Could not save affirmation seen date', e);
    }
  }

  /**
   * Check if user has claimed their +10 XP bonus for today.
   */
  public hasClaimedBonusToday(): boolean {
    try {
      const claimedStr = localStorage.getItem(STORAGE_CLAIMED);
      if (!claimedStr) return false;
      const dates: string[] = JSON.parse(claimedStr);
      return dates.includes(this.getTodayDateString());
    } catch {
      return false;
    }
  }

  /**
   * Claim the daily +10 XP bonus upon reading today's affirmation.
   */
  public claimDailyBonus(): { success: boolean; xpAwarded: number; leveledUp: boolean; newLevel: number } {
    if (this.hasClaimedBonusToday()) {
      return { success: false, xpAwarded: 0, leveledUp: false, newLevel: gamificationService.getState().level };
    }

    const result = gamificationService.addXp(10, 'Daily Affirmation & Vocal Check-in');
    try {
      const claimedStr = localStorage.getItem(STORAGE_CLAIMED);
      const dates: string[] = claimedStr ? JSON.parse(claimedStr) : [];
      dates.push(this.getTodayDateString());
      localStorage.setItem(STORAGE_CLAIMED, JSON.stringify(dates.slice(-30))); // keep last 30 days
    } catch (e) {
      console.warn('Could not save claimed affirmation bonus', e);
    }

    return {
      success: true,
      xpAwarded: 10,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
    };
  }

  /**
   * Retrieve today's affirmation based on date and vocal track.
   * Deterministic so reloads give the same daily spark, unless user explicitly shuffles.
   */
  public getTodayAffirmation(track: VocalTrack, forceOffset: number = 0): AffirmationItem {
    const pool = this.getAffirmationsForTrack(track);
    const dayOfYear = this.getDayOfYear();
    const index = (dayOfYear + forceOffset) % pool.length;
    return pool[Math.max(0, index)];
  }

  /**
   * Get another random inspiration from the pool.
   */
  public getRandomAffirmation(track: VocalTrack, excludeId?: string): AffirmationItem {
    const pool = this.getAffirmationsForTrack(track).filter((a) => a.id !== excludeId);
    if (pool.length === 0) return AFFIRMATIONS_CATALOG[0];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  /**
   * Filter affirmations applicable to the selected vocal track (track-specific + universal).
   */
  public getAffirmationsForTrack(track: VocalTrack): AffirmationItem[] {
    return AFFIRMATIONS_CATALOG.filter(
      (item) => item.track === track || item.track === 'universal'
    );
  }

  /**
   * Favorites management
   */
  public getFavoriteIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public isFavorite(id: string): boolean {
    return this.getFavoriteIds().includes(id);
  }

  public toggleFavorite(id: string): boolean {
    try {
      const current = this.getFavoriteIds();
      let updated: string[];
      let isFav = false;
      if (current.includes(id)) {
        updated = current.filter((favId) => favId !== id);
      } else {
        updated = [...current, id];
        isFav = true;
      }
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(updated));
      return isFav;
    } catch {
      return false;
    }
  }

  public getFavoriteAffirmations(): AffirmationItem[] {
    const ids = this.getFavoriteIds();
    return AFFIRMATIONS_CATALOG.filter((item) => ids.includes(item.id));
  }

  /**
   * Helper: YYYY-MM-DD local date string
   */
  public getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Day of Year (1 - 366)
   */
  public getDayOfYear(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Get a friendly time-of-day greeting (e.g., "Good morning, Voice Explorer")
   */
  public getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Peaceful late night';
  }
}

export const dailyAffirmationService = new DailyAffirmationService();
