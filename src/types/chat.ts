/**
 * Real-Time Voice Chat & Text Messaging Types
 */

import { VocalTrack } from './voice.js';
import { AvatarCustomization } from '../services/gamificationService.js';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderTrack: VocalTrack;
  avatar: AvatarCustomization;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of user names
  drillPrompt?: {
    title: string;
    description: string;
    samplePhrase?: string;
  };
}

export interface VoicePeer {
  id: string;
  name: string;
  track: VocalTrack;
  avatar: AvatarCustomization;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 1
  currentPitch?: number; // Hz
  currentResonance?: number; // 0 - 100
  inTargetZone?: boolean;
  joinedVoiceAt: number;
}

export interface RoomUser {
  id: string;
  name: string;
  track: VocalTrack;
  avatar: AvatarCustomization;
  inVoice: boolean;
  isMuted?: boolean;
  connectedAt: number;
}

export interface PracticeRoom {
  id: string;
  name: string;
  topic: string;
  category: 'resonance' | 'pitch' | 'casual' | 'warmup' | 'custom';
  memberCount: number;
  voiceCount: number;
  recommendedTrack?: VocalTrack | 'all';
  isCustom?: boolean;
}

export interface VoiceTelemetryData {
  pitch: number;
  resonance: number;
  inTarget: boolean;
  audioLevel: number;
  isSpeaking: boolean;
}
