/**
 * Anonymous Opt-In Community Leaderboard Service
 * Tracks 'Voice Focus Time' and 'Drill Streaks' with privacy-first anonymity.
 */

import { VocalTrack } from '../types/voice';

export interface LeaderboardEntry {
  id: string;
  alias: string;
  track: VocalTrack;
  avatarColor: string;
  avatarEmoji: string;
  focusTimeMinutes: number;
  streakDays: number;
  level: number;
  isCurrentUser: boolean;
  rankBadge?: string;
}

export interface LeaderboardSettings {
  isOptedIn: boolean;
  userAlias: string;
  userEmoji: string;
  avatarColor: string;
}

const SETTINGS_KEY = 'resona_leaderboard_settings_v1';

const ANONYMOUS_ADJECTIVES = [
  'Resonant',
  'Harmonic',
  'Melodic',
  'Acoustic',
  'Velvet',
  'Bright',
  'Grounded',
  'Luminous',
  'Serene',
  'Golden',
  'Breezy',
  'Echo',
];

const ANONYMOUS_NOUNS = [
  'Lark',
  'Sparrow',
  'Wave',
  'Cedar',
  'Chime',
  'Voice',
  'Aura',
  'Stream',
  'Solstice',
  'Clover',
  'Falcon',
  'Breeze',
];

const AVATAR_EMOJIS = ['🌸', '🌲', '✨', '🎙️', '🌊', '🍃', '🕊️', '🌙', '⭐', '☀️', '🦊', '🦉'];
const AVATAR_COLORS = ['#2dd4bf', '#34d399', '#38bdf8', '#818cf8', '#c084fc', '#fb7185', '#f59e0b'];

export function generateRandomAlias(): string {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const noun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}#${num}`;
}

export class LeaderboardService {
  private settings: LeaderboardSettings;
  private communityPool: LeaderboardEntry[];

  constructor() {
    this.settings = this.loadSettings();
    this.communityPool = this.generateCommunityPool();
  }

  private loadSettings(): LeaderboardSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      isOptedIn: false, // Opt-in by default is false for privacy
      userAlias: generateRandomAlias(),
      userEmoji: '🎙️',
      avatarColor: '#2dd4bf',
    };
  }

  public saveSettings(newSettings: Partial<LeaderboardSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {}
  }

  public getSettings(): LeaderboardSettings {
    return { ...this.settings };
  }

  private generateCommunityPool(): LeaderboardEntry[] {
    return [
      {
        id: 'peer-1',
        alias: 'ResonantSparrow#742',
        track: 'feminization',
        avatarColor: '#2dd4bf',
        avatarEmoji: '🌸',
        focusTimeMinutes: 245,
        streakDays: 19,
        level: 6,
        isCurrentUser: false,
        rankBadge: 'Vocal Veteran',
      },
      {
        id: 'peer-2',
        alias: 'CedarEcho#318',
        track: 'masculinization',
        avatarColor: '#a855f7',
        avatarEmoji: '🌲',
        focusTimeMinutes: 210,
        streakDays: 14,
        level: 5,
        isCurrentUser: false,
        rankBadge: 'Resonance Anchor',
      },
      {
        id: 'peer-3',
        alias: 'VelvetLark#502',
        track: 'feminization',
        avatarColor: '#fb7185',
        avatarEmoji: '✨',
        focusTimeMinutes: 185,
        streakDays: 11,
        level: 4,
        isCurrentUser: false,
      },
      {
        id: 'peer-4',
        alias: 'GroundedSolstice#119',
        track: 'masculinization',
        avatarColor: '#38bdf8',
        avatarEmoji: '🌊',
        focusTimeMinutes: 160,
        streakDays: 9,
        level: 4,
        isCurrentUser: false,
      },
      {
        id: 'peer-5',
        alias: 'GoldenChime#824',
        track: 'feminization',
        avatarColor: '#f59e0b',
        avatarEmoji: '🌙',
        focusTimeMinutes: 135,
        streakDays: 8,
        level: 3,
        isCurrentUser: false,
      },
      {
        id: 'peer-6',
        alias: 'AcousticBreeze#407',
        track: 'masculinization',
        avatarColor: '#34d399',
        avatarEmoji: '🍃',
        focusTimeMinutes: 115,
        streakDays: 7,
        level: 3,
        isCurrentUser: false,
      },
      {
        id: 'peer-7',
        alias: 'LuminousVoice#261',
        track: 'feminization',
        avatarColor: '#c084fc',
        avatarEmoji: '⭐',
        focusTimeMinutes: 95,
        streakDays: 5,
        level: 2,
        isCurrentUser: false,
      },
      {
        id: 'peer-8',
        alias: 'SereneFalcon#933',
        track: 'masculinization',
        avatarColor: '#818cf8',
        avatarEmoji: '🦉',
        focusTimeMinutes: 80,
        streakDays: 4,
        level: 2,
        isCurrentUser: false,
      },
    ];
  }

  /**
   * Returns sorted leaderboard entries based on metric, track filter, and user participation
   */
  public getEntries(
    metric: 'focusTime' | 'streak',
    trackFilter: 'all' | VocalTrack,
    userData: { focusMinutes: number; streakDays: number; track: VocalTrack; level: number }
  ): { entries: LeaderboardEntry[]; userRank: number | null; totalParticipants: number } {
    let pool = [...this.communityPool];

    // If user is opted in, add/update their entry in the list
    if (this.settings.isOptedIn) {
      const userEntry: LeaderboardEntry = {
        id: 'user-current',
        alias: `${this.settings.userAlias} (You)`,
        track: userData.track,
        avatarColor: this.settings.avatarColor,
        avatarEmoji: this.settings.userEmoji,
        focusTimeMinutes: Math.max(12, userData.focusMinutes),
        streakDays: Math.max(1, userData.streakDays),
        level: userData.level,
        isCurrentUser: true,
      };
      pool.push(userEntry);
    }

    // Filter by track if requested
    if (trackFilter !== 'all') {
      pool = pool.filter((e) => e.track === trackFilter);
    }

    // Sort by metric descending
    pool.sort((a, b) => {
      if (metric === 'focusTime') {
        return b.focusTimeMinutes - a.focusTimeMinutes;
      }
      return b.streakDays - a.streakDays;
    });

    // Find user's rank
    const userIndex = pool.findIndex((e) => e.isCurrentUser);
    const userRank = userIndex !== -1 ? userIndex + 1 : null;

    return {
      entries: pool,
      userRank,
      totalParticipants: pool.length,
    };
  }
}

export const leaderboardService = new LeaderboardService();
