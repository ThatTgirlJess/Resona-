/**
 * Gamification Service for Resona
 * Manages XP, Levels, Daily/Weekly Challenges, Unlockable Themes & Exercises,
 * Badges, and Streaks with localStorage persistence.
 */

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  unlocked: boolean;
  colors: {
    bg: string;
    card: string;
    accent: string;
    border: string;
    highlight: string;
  };
}

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly';
  targetValue: number;
  currentValue: number;
  xpReward: number;
  isCompleted: boolean;
  icon: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  unlocked: boolean;
}

export interface AvatarCustomization {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  makeup: string;
  clothing: string;
  clothingColor: string;
  accessory: string;
  expression: 'neutral' | 'happy' | 'singing' | 'focused';
}

export interface UnlockableAvatarItem {
  id: string;
  type: 'hairColor' | 'makeup' | 'clothing' | 'accessory';
  name: string;
  previewColor?: string;
  requiredLevel: number;
  unlocked: boolean;
  challengeRequired?: string;
}

export interface UserGamificationState {
  totalXp: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  xpToNextLevel: number;
  streakDays: number;
  lastPracticeDate: string;
  activeThemeId: string;
  unlockedThemes: string[];
  unlockedExercises: string[];
  unlockedBadges: string[];
  unlockedAvatarItems: string[];
  avatarCustomization: AvatarCustomization;
  dailyChallenges: ChallengeItem[];
  weeklyChallenges: ChallengeItem[];
}

const STORAGE_KEY = 'resona_gamification_v2';

export const THEMES: ThemeConfig[] = [
  {
    id: 'slate-serenity',
    name: 'Slate Serenity (Default)',
    description: 'Calm deep charcoal and soft eucalyptus green to minimize eye fatigue.',
    requiredLevel: 1,
    unlocked: true,
    colors: {
      bg: 'bg-slate-950',
      card: 'bg-slate-900/90',
      accent: 'text-teal-400',
      border: 'border-slate-800',
      highlight: '#2dd4bf',
    },
  },
  {
    id: 'emerald-sage',
    name: 'Emerald Sage',
    description: 'Earthy forest tones with gentle sage green accents.',
    requiredLevel: 2,
    unlocked: false,
    colors: {
      bg: 'bg-[#0b1411]',
      card: 'bg-[#12201b]/90',
      accent: 'text-emerald-400',
      border: 'border-emerald-950/80',
      highlight: '#34d399',
    },
  },
  {
    id: 'amethyst-twilight',
    name: 'Amethyst Twilight',
    description: 'Deep soothing indigo and muted lavender for relaxing evening practice.',
    requiredLevel: 3,
    unlocked: false,
    colors: {
      bg: 'bg-[#0f0e1a]',
      card: 'bg-[#18162b]/90',
      accent: 'text-indigo-400',
      border: 'border-indigo-950/80',
      highlight: '#818cf8',
    },
  },
  {
    id: 'nordic-aurora',
    name: 'Nordic Aurora',
    description: 'Crisp midnight dark blue with luminous cyan ribbons.',
    requiredLevel: 5,
    unlocked: false,
    colors: {
      bg: 'bg-[#0a1118]',
      card: 'bg-[#0f1d29]/90',
      accent: 'text-sky-400',
      border: 'border-sky-950/80',
      highlight: '#38bdf8',
    },
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Ember',
    description: 'Gentle warm dark amber to filter blue light and relax eye strain.',
    requiredLevel: 7,
    unlocked: false,
    colors: {
      bg: 'bg-[#140e0b]',
      card: 'bg-[#221712]/90',
      accent: 'text-amber-400',
      border: 'border-amber-950/80',
      highlight: '#fbbf24',
    },
  },
];

export const BADGES: BadgeItem[] = [
  {
    id: 'badge-first-vocalization',
    name: 'First Vocalization',
    description: 'Completed your very first vocal training drill.',
    icon: '🎙️',
    unlocked: false,
  },
  {
    id: 'badge-pitch-architect',
    name: 'Pitch Architect',
    description: 'Maintained 92%+ pitch stability during a full exercise.',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'badge-resonance-sculptor',
    name: 'Resonance Sculptor',
    description: 'Achieved optimal target resonance for 30 consecutive seconds.',
    icon: '✨',
    unlocked: false,
  },
  {
    id: 'badge-streak-3',
    name: 'Consistent Voice (3-Day)',
    description: 'Practiced your voice 3 days in a row.',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'badge-streak-7',
    name: 'Dedication Master (7-Day)',
    description: 'Built a 7-day voice training habit.',
    icon: '⚡',
    unlocked: false,
  },
  {
    id: 'badge-level-5',
    name: 'Acoustic Adept',
    description: 'Reached Level 5 in vocal training.',
    icon: '👑',
    unlocked: false,
  },
];

export const UNLOCKABLE_AVATAR_CATALOG: UnlockableAvatarItem[] = [
  // Special Hair Colors
  { id: 'hair-hologram-teal', type: 'hairColor', name: 'Cyber Teal Glow', previewColor: '#2dd4bf', requiredLevel: 2, unlocked: false },
  { id: 'hair-lavender-mist', type: 'hairColor', name: 'Pastel Lavender', previewColor: '#c084fc', requiredLevel: 3, unlocked: false },
  { id: 'hair-sunset-coral', type: 'hairColor', name: 'Sunset Coral', previewColor: '#fb7185', requiredLevel: 4, unlocked: false },
  { id: 'hair-silver-starlight', type: 'hairColor', name: 'Silver Starlight', previewColor: '#e2e8f0', requiredLevel: 5, unlocked: false },
  { id: 'hair-rose-gold', type: 'hairColor', name: 'Rose Gold', previewColor: '#f43f5e', requiredLevel: 6, unlocked: false },

  // Special Makeup & Expressions
  { id: 'mu-gloss-wings', type: 'makeup', name: 'Glossy Lip & Sharp Liner', requiredLevel: 2, unlocked: false },
  { id: 'mu-stardust-freckles', type: 'makeup', name: 'Stardust Freckles & Gems', requiredLevel: 3, unlocked: false },
  { id: 'mu-groomed-shadow', type: 'makeup', name: 'Groomed Stubble Contour', requiredLevel: 2, unlocked: false },
  { id: 'mu-bold-amethyst', type: 'makeup', name: 'Bold Violet Lip & Glow', requiredLevel: 4, unlocked: false },
  { id: 'mu-golden-hour', type: 'makeup', name: 'Golden Hour Highlighter', requiredLevel: 5, unlocked: false },

  // Special Outfits
  { id: 'cloth-celestial-bomber', type: 'clothing', name: 'Starlight Satin Bomber', requiredLevel: 3, unlocked: false },
  { id: 'cloth-velvet-suit', type: 'clothing', name: 'Plum Velvet Blazer', requiredLevel: 4, unlocked: false },
  { id: 'cloth-cyber-leather', type: 'clothing', name: 'Neo-City Biker Jacket', requiredLevel: 5, unlocked: false },
  { id: 'cloth-pastel-knit', type: 'clothing', name: 'Cloud Knit Cardigan', requiredLevel: 2, unlocked: false },

  // Special Accessories
  { id: 'acc-studio-headset', type: 'accessory', name: 'Studio Pro Headset', requiredLevel: 2, unlocked: false },
  { id: 'acc-laurel-crown', type: 'accessory', name: 'Golden Laurel Tiara', requiredLevel: 4, unlocked: false },
  { id: 'acc-hoop-earrings', type: 'accessory', name: 'Gleaming Gold Hoops', requiredLevel: 3, unlocked: false },
  { id: 'acc-cyber-shades', type: 'accessory', name: 'Cyberpunk Visor Shades', requiredLevel: 5, unlocked: false },
];

const DEFAULT_AVATAR: AvatarCustomization = {
  skinTone: '#fcd34d',
  hairStyle: 'bob',
  hairColor: '#332314',
  eyeStyle: 'open',
  makeup: 'natural',
  clothing: 'hoodie',
  clothingColor: '#1e293b',
  accessory: 'none',
  expression: 'happy',
};

const LEVEL_TITLES = [
  'Vocal Novice',
  'Resonance Seeker',
  'Acoustic Explorer',
  'Pitch Apprentice',
  'Harmonic Sculptor',
  'Vocal Alchemist',
  'Formant Master',
  'Vocal Artisan',
  'Timbre Virtuoso',
  'Acoustic Maestro',
];

export class GamificationService {
  private state: UserGamificationState;
  private listeners: ((state: UserGamificationState) => void)[] = [];

  constructor() {
    this.state = this.loadState();
    this.checkStreak();
    this.ensureFreshChallenges();
    this.applyTheme(this.state.activeThemeId);
  }

  public getState(): UserGamificationState {
    return { ...this.state };
  }

  public subscribe(listener: (state: UserGamificationState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.saveState();
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  private loadState(): UserGamificationState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          dailyChallenges: parsed.dailyChallenges || this.createDailyChallenges(),
          weeklyChallenges: parsed.weeklyChallenges || this.createWeeklyChallenges(),
        };
      }
    } catch (e) {
      console.warn('Failed to load gamification state from localStorage', e);
    }

    return {
      totalXp: 120,
      level: 1,
      levelTitle: LEVEL_TITLES[0],
      currentLevelXp: 120,
      xpToNextLevel: 250,
      streakDays: 1,
      lastPracticeDate: new Date().toISOString().split('T')[0],
      activeThemeId: 'slate-serenity',
      unlockedThemes: ['slate-serenity'],
      unlockedExercises: ['fem-whisper-siren', 'fem-small-dog-pant', 'masc-yawn-sigh', 'masc-big-dog-breath'],
      unlockedBadges: [],
      unlockedAvatarItems: ['hair-hologram-teal'], // Gift first cool item to test immediately!
      avatarCustomization: DEFAULT_AVATAR,
      dailyChallenges: this.createDailyChallenges(),
      weeklyChallenges: this.createWeeklyChallenges(),
    };
  }

  public setAvatarCustomization(customization: Partial<AvatarCustomization>) {
    this.state.avatarCustomization = {
      ...this.state.avatarCustomization,
      ...customization,
    };
    this.notify();
  }

  public unlockAvatarItem(itemId: string) {
    if (!this.state.unlockedAvatarItems.includes(itemId)) {
      this.state.unlockedAvatarItems.push(itemId);
      this.notify();
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}
  }

  private createDailyChallenges(): ChallengeItem[] {
    return [
      {
        id: 'dc-1',
        title: 'Resonance Precision',
        description: 'Spend 45 total seconds inside your target resonance zone',
        category: 'daily',
        targetValue: 45,
        currentValue: 0,
        xpReward: 60,
        isCompleted: false,
        icon: '🎛️',
      },
      {
        id: 'dc-2',
        title: 'Laser Pitch Stability',
        description: 'Complete 2 drills with at least 85% pitch stability score',
        category: 'daily',
        targetValue: 2,
        currentValue: 0,
        xpReward: 75,
        isCompleted: false,
        icon: '🎯',
      },
      {
        id: 'dc-3',
        title: 'Daily Drill Routine',
        description: 'Finish all exercises in your personalized daily routine',
        category: 'daily',
        targetValue: 3,
        currentValue: 0,
        xpReward: 100,
        isCompleted: false,
        icon: '✨',
      },
    ];
  }

  private createWeeklyChallenges(): ChallengeItem[] {
    return [
      {
        id: 'wc-1',
        title: 'Iron Habit (4-Day Streak)',
        description: 'Practice your voice on 4 different days this week',
        category: 'weekly',
        targetValue: 4,
        currentValue: 1,
        xpReward: 200,
        isCompleted: false,
        icon: '🔥',
      },
      {
        id: 'wc-2',
        title: 'Mastery Marathon',
        description: 'Accumulate 10 minutes (600s) of active voice practice',
        category: 'weekly',
        targetValue: 600,
        currentValue: 75,
        xpReward: 250,
        isCompleted: false,
        icon: '⏱️',
      },
    ];
  }

  private ensureFreshChallenges() {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.lastPracticeDate !== today) {
      // Check if day changed - reset daily challenges
      const dayDiff = this.getDayDifference(this.state.lastPracticeDate, today);
      if (dayDiff >= 1) {
        this.state.dailyChallenges = this.createDailyChallenges();
      }
    }
  }

  private checkStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (!this.state.lastPracticeDate) {
      this.state.lastPracticeDate = today;
      this.state.streakDays = 1;
      return;
    }

    const diff = this.getDayDifference(this.state.lastPracticeDate, today);
    if (diff === 1) {
      // Practiced yesterday, continuing streak today
    } else if (diff > 1) {
      // Broken streak
      this.state.streakDays = 1;
    }
  }

  public recordPracticeDay() {
    const today = new Date().toISOString().split('T')[0];
    const diff = this.getDayDifference(this.state.lastPracticeDate, today);
    if (diff === 1) {
      this.state.streakDays += 1;
    } else if (diff === 0) {
      // already counted today
    } else {
      this.state.streakDays = 1;
    }
    this.state.lastPracticeDate = today;

    // Check streak badges
    if (this.state.streakDays >= 3) {
      this.unlockBadge('badge-streak-3');
    }
    if (this.state.streakDays >= 7) {
      this.unlockBadge('badge-streak-7');
    }

    this.notify();
  }

  private getDayDifference(dateStr1: string, dateStr2: string): number {
    try {
      const d1 = new Date(dateStr1).getTime();
      const d2 = new Date(dateStr2).getTime();
      return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  }

  public addXp(amount: number, reason: string = ''): { leveledUp: boolean; newLevel: number } {
    let leveledUp = false;
    this.state.totalXp += amount;
    this.state.currentLevelXp += amount;

    // Level calculation: Each level requires level * 200 + 100 XP
    while (this.state.currentLevelXp >= this.state.xpToNextLevel) {
      this.state.currentLevelXp -= this.state.xpToNextLevel;
      this.state.level += 1;
      this.state.xpToNextLevel = this.state.level * 220 + 100;
      this.state.levelTitle =
        LEVEL_TITLES[Math.min(this.state.level - 1, LEVEL_TITLES.length - 1)];
      leveledUp = true;

      // Unlock themes based on level
      for (const t of THEMES) {
        if (this.state.level >= t.requiredLevel && !this.state.unlockedThemes.includes(t.id)) {
          this.state.unlockedThemes.push(t.id);
        }
      }

      // Unlock avatar items based on level
      for (const item of UNLOCKABLE_AVATAR_CATALOG) {
        if (this.state.level >= item.requiredLevel && !this.state.unlockedAvatarItems.includes(item.id)) {
          this.state.unlockedAvatarItems.push(item.id);
        }
      }

      if (this.state.level >= 5) {
        this.unlockBadge('badge-level-5');
      }
    }

    this.notify();
    return { leveledUp, newLevel: this.state.level };
  }

  public updateChallengeProgress(type: 'resonance-sec' | 'stable-drill' | 'drill-done' | 'active-sec', amount: number = 1) {
    let updated = false;

    for (const ch of this.state.dailyChallenges) {
      if (ch.isCompleted) continue;
      if (type === 'resonance-sec' && ch.id === 'dc-1') {
        ch.currentValue = Math.min(ch.targetValue, ch.currentValue + amount);
        if (ch.currentValue >= ch.targetValue) {
          ch.isCompleted = true;
          this.addXp(ch.xpReward, `Completed Daily Challenge: ${ch.title}`);
        }
        updated = true;
      } else if (type === 'stable-drill' && ch.id === 'dc-2') {
        ch.currentValue = Math.min(ch.targetValue, ch.currentValue + amount);
        if (ch.currentValue >= ch.targetValue) {
          ch.isCompleted = true;
          this.addXp(ch.xpReward, `Completed Daily Challenge: ${ch.title}`);
        }
        updated = true;
      } else if (type === 'drill-done' && ch.id === 'dc-3') {
        ch.currentValue = Math.min(ch.targetValue, ch.currentValue + amount);
        if (ch.currentValue >= ch.targetValue) {
          ch.isCompleted = true;
          this.addXp(ch.xpReward, `Completed Daily Challenge: ${ch.title}`);
        }
        updated = true;
      }
    }

    for (const ch of this.state.weeklyChallenges) {
      if (ch.isCompleted) continue;
      if (type === 'drill-done' && ch.id === 'wc-1') {
        ch.currentValue = Math.min(ch.targetValue, this.state.streakDays);
        if (ch.currentValue >= ch.targetValue) {
          ch.isCompleted = true;
          this.addXp(ch.xpReward, `Completed Weekly Challenge: ${ch.title}`);
        }
        updated = true;
      } else if (type === 'active-sec' && ch.id === 'wc-2') {
        ch.currentValue = Math.min(ch.targetValue, ch.currentValue + amount);
        if (ch.currentValue >= ch.targetValue) {
          ch.isCompleted = true;
          this.addXp(ch.xpReward, `Completed Weekly Challenge: ${ch.title}`);
        }
        updated = true;
      }
    }

    if (updated) {
      this.notify();
    }
  }

  public unlockBadge(badgeId: string) {
    if (!this.state.unlockedBadges.includes(badgeId)) {
      this.state.unlockedBadges.push(badgeId);
      this.addXp(100, `Unlocked Badge: ${badgeId}`);
      this.notify();
    }
  }

  public setTheme(themeId: string): boolean {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return false;

    if (!this.state.unlockedThemes.includes(themeId) && this.state.level < theme.requiredLevel) {
      return false;
    }

    this.state.activeThemeId = themeId;
    this.applyTheme(themeId);
    this.notify();
    return true;
  }

  private applyTheme(themeId: string) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-resona-theme', themeId);
  }
}

export const gamificationService = new GamificationService();
