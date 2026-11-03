/**
 * Community Practice Lounge
 * Real-time voice chat & text messaging system for co-practice,
 * mutual feedback, and conversation in target voice.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Users,
  MessageSquare,
  Send,
  Plus,
  Sparkles,
  Flame,
  Activity,
  Coffee,
  BookOpen,
  ChevronDown,
  Smile,
  CheckCircle2,
  Headphones,
  PhoneOff,
  Share2,
  Info,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { ChatMessage, PracticeRoom, RoomUser, VoicePeer, VoiceTelemetryData } from '../../types/chat.js';
import { VocalTrack, VoiceMetrics } from '../../types/voice.js';
import { AvatarCustomization } from '../../services/gamificationService.js';
import { voiceChatService } from '../../services/voiceChatService.js';
import { AvatarRenderer } from '../avatar/AvatarRenderer.js';
import { hzToNote } from '../../utils/audioMath.js';

interface CommunityPracticeLoungeProps {
  currentTrack: VocalTrack;
  userAvatar: AvatarCustomization;
  userHandle: string;
  liveMetrics: VoiceMetrics;
  onSelectDrill?: (drillId: string) => void;
}

const READING_PASSAGES = [
  {
    id: 'rainbow-1',
    title: 'The Rainbow Passage (Intonation & Pitch)',
    text: 'When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon.',
    focusCue: 'Aim for a steady speaking pitch and natural downward cadence at the end of each sentence.',
  },
  {
    id: 'resonance-vowels',
    title: '5-Vowel Formant Staircase (Resonance)',
    text: 'Key (/i/) — Hay (/e/) — Car (/a/) — Door (/o/) — Moon (/u/). Keep the oral space fronted and bright on "Key", then maintain vocal tract height through the vowel shift.',
    focusCue: 'Check that resonance remains above 70% (Feminization) or stays deeply pharyngeal (Masculinization).',
  },
  {
    id: 'casual-greeting',
    title: 'Daily Conversational Openers',
    text: '"Good morning! How has your voice training been going today? I was just practicing some gentle pitch glides and felt my resonance brightening up nicely."',
    focusCue: 'Speak as if addressing a friend across the table; focus on natural melodic inflections.',
  },
];

export const CommunityPracticeLounge: React.FC<CommunityPracticeLoungeProps> = ({
  currentTrack,
  userAvatar,
  userHandle,
  liveMetrics,
}) => {
  const [rooms, setRooms] = useState<PracticeRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('resonance-lab');
  const [activeRoom, setActiveRoom] = useState<PracticeRoom | null>(null);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Voice State
  const [inVoice, setInVoice] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState<boolean>(false);
  const [localLevel, setLocalLevel] = useState<number>(0);

  // Peer Telemetry mapping
  const [peerTelemetry, setPeerTelemetry] = useState<Record<string, VoiceTelemetryData>>({});

  // UI state
  const [selectedPassageId, setSelectedPassageId] = useState<string>('rainbow-1');
  const [showPassageDeck, setShowPassageDeck] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomTopic, setNewRoomTopic] = useState<string>('');
  const [newRoomCategory, setNewRoomCategory] = useState<'resonance' | 'pitch' | 'casual' | 'warmup' | 'custom'>('casual');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = voiceChatService.getUserId();

  // Initialize service & subscribe to events
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    voiceChatService.connect().then(() => {
      setIsConnected(voiceChatService.isConnected);
      // Join default room
      voiceChatService.joinRoom(activeRoomId, {
        id: currentUserId,
        name: userHandle,
        track: currentTrack,
        avatar: userAvatar,
      });
    });

    unsubs.push(
      voiceChatService.on('connection_change', (data: { connected: boolean }) => {
        setIsConnected(data.connected);
      }),
      voiceChatService.on('room_list', (roomList: PracticeRoom[]) => {
        setRooms(roomList);
      }),
      voiceChatService.on('room_state', (state: { room: PracticeRoom; users: RoomUser[]; voicePeers: VoicePeer[]; messages: ChatMessage[] }) => {
        setActiveRoom(state.room);
        setRoomUsers(state.users);
        setVoicePeers(state.voicePeers);
        setMessages(state.messages);
      }),
      voiceChatService.on('user_joined', (user: RoomUser) => {
        setRoomUsers(prev => {
          if (prev.some(u => u.id === user.id)) return prev;
          return [...prev, user];
        });
      }),
      voiceChatService.on('user_left', (userId: string) => {
        setRoomUsers(prev => prev.filter(u => u.id !== userId));
      }),
      voiceChatService.on('message_received', (msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);
      }),
      voiceChatService.on('reaction_updated', (data: { messageId: string; reactions: Record<string, string[]> }) => {
        setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
      }),
      voiceChatService.on('peer_voice_joined', (peer: VoicePeer) => {
        setVoicePeers(prev => {
          if (prev.some(p => p.id === peer.id)) return prev;
          return [...prev, peer];
        });
      }),
      voiceChatService.on('peer_voice_left', (peerId: string) => {
        setVoicePeers(prev => prev.filter(p => p.id !== peerId));
        setPeerTelemetry(prev => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }),
      voiceChatService.on('peer_voice_status', (data: { peerId: string; isMuted: boolean; isDeafened: boolean }) => {
        setVoicePeers(prev => prev.map(p => p.id === data.peerId ? { ...p, isMuted: data.isMuted, isDeafened: data.isDeafened } : p));
      }),
      voiceChatService.on('peer_telemetry', (data: { peerId: string; telemetry: VoiceTelemetryData }) => {
        setPeerTelemetry(prev => ({
          ...prev,
          [data.peerId]: data.telemetry,
        }));
      }),
      voiceChatService.on('local_speaking', (data: { isSpeaking: boolean; level: number }) => {
        setIsLocalSpeaking(data.isSpeaking);
        setLocalLevel(data.level);
      }),
      voiceChatService.on('local_voice_change', (data: { inVoice: boolean; isMuted: boolean; isDeafened: boolean }) => {
        setInVoice(data.inVoice);
        setIsMuted(data.isMuted);
        setIsDeafened(data.isDeafened);
      }),
      voiceChatService.on('room_created', (newId: string) => {
        setActiveRoomId(newId);
        voiceChatService.joinRoom(newId, {
          id: currentUserId,
          name: userHandle,
          track: currentTrack,
          avatar: userAvatar,
        });
        setShowCreateModal(false);
      })
    );

    return () => {
      unsubs.forEach(un => un());
    };
  }, []);

  // Sync user profile updates (avatar/track/handle) to server room
  useEffect(() => {
    if (isConnected && activeRoomId) {
      voiceChatService.joinRoom(activeRoomId, {
        id: currentUserId,
        name: userHandle,
        track: currentTrack,
        avatar: userAvatar,
      });
    }
  }, [userHandle, currentTrack, userAvatar]);

  // Feed live metrics into voiceChatService telemetry whenever user is in voice
  useEffect(() => {
    if (inVoice) {
      voiceChatService.updateTelemetry({
        pitch: Math.round(liveMetrics.pitch),
        resonance: Math.round(liveMetrics.resonanceScore),
        inTarget: liveMetrics.inTargetZone,
      });
    }
  }, [liveMetrics, inVoice]);

  // Scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRoomSwitch = (roomId: string) => {
    if (roomId === activeRoomId) return;
    setActiveRoomId(roomId);
    voiceChatService.joinRoom(roomId, {
      id: currentUserId,
      name: userHandle,
      track: currentTrack,
      avatar: userAvatar,
    });
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    voiceChatService.sendMessage(inputText);
    setInputText('');
  };

  const handleSendDrillPrompt = (passage: typeof READING_PASSAGES[0]) => {
    voiceChatService.sendMessage(`Let's practice "${passage.title}" together!`, {
      title: passage.title,
      description: passage.focusCue,
      samplePhrase: passage.text,
    });
  };

  const handleToggleVoice = async () => {
    if (inVoice) {
      voiceChatService.leaveVoice();
    } else {
      await voiceChatService.joinVoice();
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    voiceChatService.createCustomRoom(newRoomName, newRoomTopic, newRoomCategory);
    setNewRoomName('');
    setNewRoomTopic('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'resonance':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'pitch':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'warmup':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'casual':
      default:
        return <Coffee className="w-4 h-4 text-indigo-400" />;
    }
  };

  const activePassage = READING_PASSAGES.find(p => p.id === selectedPassageId) || READING_PASSAGES[0];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[620px] bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
      {/* Top Lounge Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            {getCategoryIcon(activeRoom?.category || 'casual')}
            <span className="font-semibold text-slate-100 text-sm">
              #{activeRoom?.name || 'Loading Lounge...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isConnected ? 'Real-Time Server Connected' : 'Connecting...'}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {roomUsers.length} in room
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Headphones className="w-3.5 h-3.5" />
              {voicePeers.length} in voice
            </span>
          </div>
        </div>

        {/* Room Switcher & Create Room */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <select
              value={activeRoomId}
              onChange={(e) => handleRoomSwitch(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-7"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.name} ({r.voiceCount} 🎙️, {r.memberCount} 👤)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            title="Create Custom Practice Room"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">New Room</span>
          </button>
        </div>
      </div>

      {/* Main Body: Voice Deck (Left) & Chat Feed (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Voice Practice Stage (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/40 p-4 overflow-y-auto space-y-4">
          {/* Voice Stage Header / Controls */}
          <div className="bg-slate-850/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${inVoice ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-slate-600'}`} />
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  Voice Practice Deck
                  {inVoice && <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">Live</span>}
                </h3>
                <p className="text-xs text-slate-400">
                  {inVoice ? `${voicePeers.length + 1} participant(s) with live acoustic telemetry` : 'Join voice to practice out loud with peer meters'}
                </p>
              </div>
            </div>

            {/* Voice Control Buttons */}
            <div className="flex items-center gap-2">
              {inVoice ? (
                <>
                  <button
                    onClick={() => voiceChatService.toggleMute()}
                    className={`p-2 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                      isMuted
                        ? 'bg-rose-950/80 border-rose-700/80 text-rose-300 hover:bg-rose-900'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                    }`}
                    title={isMuted ? 'Unmute Microphone (Hotkey: M)' : 'Mute Microphone (Hotkey: M)'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                    <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic On'}</span>
                  </button>

                  <button
                    onClick={() => voiceChatService.toggleDeafen()}
                    className={`p-2 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                      isDeafened
                        ? 'bg-rose-950/80 border-rose-700/80 text-rose-300 hover:bg-rose-900'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                    }`}
                    title={isDeafened ? 'Undeafen Voice' : 'Deafen (Mute Incoming Audio)'}
                  >
                    {isDeafened ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    onClick={handleToggleVoice}
                    className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center gap-1 text-xs font-medium shadow-md shadow-rose-900/40"
                    title="Leave Voice Room"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Leave</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleVoice}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-medium rounded-lg shadow-md shadow-cyan-900/30 flex items-center gap-2 transition"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Join Voice Practice</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice Participant Cards Grid */}
          {inVoice ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Local User Card */}
              <div className={`relative bg-slate-850/90 rounded-xl p-3.5 border transition-all ${
                isLocalSpeaking
                  ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <AvatarRenderer customization={userAvatar} metrics={liveMetrics} size="sm" showReactivity={true} />
                    {isLocalSpeaking && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-100 truncate">{userHandle} (You)</span>
                      {isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <span className="inline-block text-[11px] font-medium text-cyan-300 capitalize bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 mt-0.5">
                      {currentTrack} Target
                    </span>
                  </div>
                </div>

                {/* Live Acoustic Telemetry Gauges */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Live Pitch:</span>
                    <span className="font-mono font-semibold text-cyan-300">
                      {liveMetrics.pitch > 0 ? `${Math.round(liveMetrics.pitch)} Hz (${liveMetrics.note})` : 'Listening...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Resonance:</span>
                    <span className="font-mono text-emerald-300 font-semibold">
                      {Math.round(liveMetrics.resonanceScore)}%
                    </span>
                  </div>
                  {/* Resonance Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 transition-all duration-150"
                      style={{ width: `${Math.max(5, Math.min(100, liveMetrics.resonanceScore))}%` }}
                    />
                  </div>
                  {liveMetrics.inTargetZone && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>Locked into Target Zone!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Peer Cards */}
              {voicePeers.map((peer) => {
                const telem = peerTelemetry[peer.id];
                const isSpeaking = telem?.isSpeaking || false;
                const pitch = telem?.pitch || peer.currentPitch || 0;
                const resonance = telem?.resonance || peer.currentResonance || 0;
                const inTarget = telem?.inTarget || peer.inTargetZone || false;

                return (
                  <div
                    key={peer.id}
                    className={`relative bg-slate-850/90 rounded-xl p-3.5 border transition-all ${
                      isSpeaking
                        ? 'border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-950/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <AvatarRenderer
                          customization={peer.avatar}
                          metrics={{
                            pitch,
                            note: hzToNote(pitch).fullNote,
                            octave: hzToNote(pitch).octave,
                            cents: hzToNote(pitch).cents,
                            confidence: 1,
                            stability: 90,
                            formantF1: 500,
                            formantF2: 1700,
                            spectralCentroid: 1800,
                            resonanceScore: resonance,
                            vocalWeight: 50,
                            breathiness: 20,
                            volumeDb: isSpeaking ? -20 : -90,
                            inTargetZone: inTarget,
                            timestamp: Date.now(),
                          }}
                          size="sm"
                          showReactivity={true}
                        />
                        {isSpeaking && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-100 truncate">{peer.name}</span>
                          {peer.isMuted ? (
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <span className="inline-block text-[11px] font-medium text-purple-300 capitalize bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40 mt-0.5">
                          {peer.track} Target
                        </span>
                      </div>
                    </div>

                    {/* Remote Telemetry Gauges */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Live Pitch:</span>
                        <span className="font-mono font-semibold text-cyan-300">
                          {pitch > 0 ? `${Math.round(pitch)} Hz (${hzToNote(pitch).fullNote})` : 'Speaking...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Resonance:</span>
                        <span className="font-mono text-emerald-300 font-semibold">
                          {Math.round(resonance)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 transition-all duration-150"
                          style={{ width: `${Math.max(5, Math.min(100, resonance))}%` }}
                        />
                      </div>
                      {inTarget && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>In Optimal Zone</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Not in Voice Preview Prompt */
            <div className="bg-slate-850/50 rounded-xl p-5 border border-dashed border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-cyan-400 border border-slate-700">
                <Radio className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-semibold text-slate-200">Practice Together Out Loud</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your voice to speak with fellow learners. You will see each other's live pitch and resonance meters in real-time for immediate peer encouragement.
                </p>
              </div>
              <button
                onClick={handleToggleVoice}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-950/40 inline-flex items-center gap-2 transition"
              >
                <Mic className="w-4 h-4" />
                <span>Join Voice Practice Deck</span>
              </button>
            </div>
          )}

          {/* Reading & Drill Practice Studio Card */}
          <div className="bg-slate-850/90 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-slate-200">Shared Co-Practice Text</h4>
              </div>
              <button
                onClick={() => setShowPassageDeck(!showPassageDeck)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <span>{showPassageDeck ? 'Hide' : 'Show'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPassageDeck ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showPassageDeck && (
              <div className="space-y-3">
                {/* Passage tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {READING_PASSAGES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPassageId(p.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        selectedPassageId === p.id
                          ? 'bg-cyan-950/80 border-cyan-700/80 text-cyan-200'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.title.split(' ')[0]} Passage
                    </button>
                  ))}
                </div>

                {/* Active Passage Content */}
                <div className="bg-slate-900/90 rounded-lg p-3.5 border border-slate-800/80">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-300">{activePassage.title}</span>
                    <button
                      onClick={() => handleSendDrillPrompt(activePassage)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Post to Chat</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-serif">
                    {activePassage.text}
                  </p>
                  <div className="mt-2 text-[11px] text-emerald-400/90 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Cue: {activePassage.focusCue}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Chat Feed (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-950 h-full overflow-hidden">
          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10">
                No messages yet in this lounge. Say hello or share an exercise!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                const isSys = msg.isSystem;

                if (isSys) {
                  return (
                    <div key={msg.id} className="bg-slate-900/80 rounded-xl p-3 border border-cyan-800/40 text-xs space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{msg.senderName}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{msg.text}</p>
                      {msg.drillPrompt && (
                        <div className="mt-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                          <span className="font-semibold text-slate-200 block text-[11px]">{msg.drillPrompt.title}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{msg.drillPrompt.description}</p>
                          {msg.drillPrompt.samplePhrase && (
                            <p className="text-[11px] text-cyan-300 mt-1 italic">"{msg.drillPrompt.samplePhrase}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* User Avatar */}
                    <div className="shrink-0 mt-0.5">
                      <AvatarRenderer customization={msg.avatar} size="sm" showReactivity={false} />
                    </div>

                    {/* Bubble Content */}
                    <div className={`max-w-[82%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-1.5 text-[11px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-medium text-slate-300">{msg.senderName}</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700 uppercase">
                          {msg.senderTrack}
                        </span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-950/40'
                          : 'bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800'
                      }`}>
                        {msg.text}

                        {/* Attached Drill Prompt Card */}
                        {msg.drillPrompt && (
                          <div className={`mt-2 p-2 rounded-lg border text-[11px] ${
                            isMe ? 'bg-cyan-700/80 border-cyan-500/50 text-cyan-50' : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}>
                            <span className="font-semibold block">{msg.drillPrompt.title}</span>
                            <p className="mt-0.5 opacity-90">{msg.drillPrompt.description}</p>
                            {msg.drillPrompt.samplePhrase && (
                              <p className="mt-1 font-serif italic opacity-95">"{msg.drillPrompt.samplePhrase}"</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Emoji Reactions */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['👏', '🎯', '🌟', '❤️'].map(emoji => {
                          const count = msg.reactions?.[emoji]?.length || 0;
                          const hasReacted = msg.reactions?.[emoji]?.includes(userHandle);
                          return (
                            <button
                              key={emoji}
                              onClick={() => voiceChatService.sendReaction(msg.id, emoji)}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition flex items-center gap-1 ${
                                hasReacted
                                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                                  : count > 0
                                  ? 'bg-slate-850 border-slate-700 text-slate-300'
                                  : 'bg-slate-900/60 border-transparent text-slate-500 hover:border-slate-700'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span>{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message #${activeRoom?.name || 'chat'}...`}
                className="flex-1 bg-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white rounded-xl transition shadow-md shadow-cyan-950/40"
                title="Send Message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
              <span>Press Enter to send</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {roomUsers.length} online
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Create Custom Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Create Practice Lounge
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Fem Intonation Sprint"
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Topic / Objective</label>
                <input
                  type="text"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  placeholder="e.g. Practicing pitch glides and sentence-final inflection"
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value as any)}
                  className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="resonance">Resonance Lab</option>
                  <option value="pitch">Pitch Agility</option>
                  <option value="warmup">Warm-up Together</option>
                  <option value="casual">Casual Conversation</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg font-medium shadow-md shadow-cyan-950/40"
                >
                  Create & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
