/**
 * Real-Time Voice Chat & Text Messaging Client Service
 * Manages WebSocket communication, WebRTC peer connections,
 * audio streams, speaking detection, and live acoustic telemetry syncing.
 */

import { ChatMessage, PracticeRoom, RoomUser, VoicePeer, VoiceTelemetryData } from '../types/chat.js';
import { VocalTrack } from '../types/voice.js';
import { AvatarCustomization } from './gamificationService.js';

type EventCallback = (data: any) => void;

class VoiceChatService {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  // Current session state
  public currentUser: {
    id: string;
    name: string;
    track: VocalTrack;
    avatar: AvatarCustomization;
  } | null = null;
  public currentRoomId: string | null = null;
  public isConnected = false;
  public inVoice = false;
  public isMuted = false;
  public isDeafened = false;

  // WebRTC
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // VAD & Local level monitoring
  private audioCtx: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private vadInterval: any = null;
  private telemetryInterval: any = null;
  private latestTelemetry: VoiceTelemetryData = {
    pitch: 0,
    resonance: 0,
    inTarget: false,
    audioLevel: 0,
    isSpeaking: false,
  };

  constructor() {
    // Generate or restore anonymous user ID
    let storedId = localStorage.getItem('resona_chat_uid');
    if (!storedId) {
      storedId = `user-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('resona_chat_uid', storedId);
    }
  }

  public getUserId(): string {
    return localStorage.getItem('resona_chat_uid') || `user-${Date.now()}`;
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      this.isExplicitDisconnect = false;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.emit('connection_change', { connected: true });
          resolve(true);

          // If we had a current room and user, re-join
          if (this.currentRoomId && this.currentUser) {
            this.joinRoom(this.currentRoomId, this.currentUser);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('connection_change', { connected: false });
          if (!this.isExplicitDisconnect) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, 3000);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('VoiceChat WebSocket error:', err);
          resolve(false);
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
        resolve(false);
      }
    });
  }

  public disconnect() {
    this.isExplicitDisconnect = true;
    clearTimeout(this.reconnectTimer);
    this.leaveVoice();
    this.leaveRoom();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public joinRoom(roomId: string, user: { id: string; name: string; track: VocalTrack; avatar: AvatarCustomization }) {
    this.currentRoomId = roomId;
    this.currentUser = user;
    this.send({
      type: 'join_room',
      roomId,
      user,
    });
  }

  public leaveRoom() {
    if (this.currentRoomId) {
      this.send({ type: 'leave_room' });
      this.currentRoomId = null;
    }
  }

  public sendMessage(text: string, drillPrompt?: any) {
    if (!text.trim() && !drillPrompt) return;
    this.send({
      type: 'chat_message',
      text,
      drillPrompt,
    });
  }

  public sendReaction(messageId: string, emoji: string) {
    this.send({
      type: 'chat_reaction',
      messageId,
      emoji,
    });
  }

  public createCustomRoom(name: string, topic: string, category: 'resonance' | 'pitch' | 'casual' | 'warmup' | 'custom' = 'custom') {
    this.send({
      type: 'create_room',
      name,
      topic,
      category,
      recommendedTrack: 'all',
    });
  }

  // ==========================================
  // REAL-TIME WEBRTC VOICE IMPLEMENTATION
  // ==========================================

  public async joinVoice(): Promise<boolean> {
    if (this.inVoice) return true;
    if (!this.currentRoomId) return false;

    try {
      // 1. Acquire local microphone stream with high-quality echo cancellation
      if (!this.localStream) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
        } catch (mediaErr) {
          console.warn('Microphone permission denied or not available:', mediaErr);
          // If running in restricted iframe or without mic, create a dummy silent stream so client can still listen to peers
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const dst = ctx.createMediaStreamDestination();
          const gain = ctx.createGain();
          gain.gain.value = 0; // mute
          osc.connect(gain);
          gain.connect(dst);
          osc.start();
          this.localStream = dst.stream;
        }
      }

      // Apply initial mute state to local tracks
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = !this.isMuted;
        });
      }

      // 2. Setup VAD (Voice Activity Detection) analyser
      this.setupLocalAudioAnalysis();

      // 3. Notify server of joining voice
      this.inVoice = true;
      this.send({
        type: 'voice_join',
        roomId: this.currentRoomId,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
      });

      // 4. Start local telemetry reporting
      this.startTelemetryLoop();

      this.emit('local_voice_change', {
        inVoice: true,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
      });

      return true;
    } catch (err) {
      console.error('Failed to join voice:', err);
      return false;
    }
  }

  public leaveVoice() {
    if (!this.inVoice) return;
    this.inVoice = false;

    this.send({
      type: 'voice_leave',
      roomId: this.currentRoomId,
    });

    // Close all peer connections
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();

    // Remove remote audio elements
    this.remoteAudioElements.forEach((audio) => {
      audio.srcObject = null;
      audio.remove();
    });
    this.remoteAudioElements.clear();

    // Stop VAD & telemetry
    clearInterval(this.vadInterval);
    clearInterval(this.telemetryInterval);
    this.vadInterval = null;
    this.telemetryInterval = null;

    // Release mic stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }

    this.emit('local_voice_change', {
      inVoice: false,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }

    this.send({
      type: 'voice_status',
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });

    this.emit('local_voice_change', {
      inVoice: this.inVoice,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setDeafened(deafened: boolean) {
    this.isDeafened = deafened;

    // When deafened, also auto-mute
    if (deafened && !this.isMuted) {
      this.setMuted(true);
    }

    // Mute/unmute all remote audio elements
    this.remoteAudioElements.forEach((audio) => {
      audio.muted = deafened;
    });

    this.send({
      type: 'voice_status',
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });

    this.emit('local_voice_change', {
      inVoice: this.inVoice,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });
  }

  public toggleDeafen(): boolean {
    this.setDeafened(!this.isDeafened);
    return this.isDeafened;
  }

  /**
   * Updates the live acoustic telemetry to be broadcasted to peers in the voice room
   */
  public updateTelemetry(data: Partial<VoiceTelemetryData>) {
    this.latestTelemetry = {
      ...this.latestTelemetry,
      ...data,
    };
  }

  private setupLocalAudioAnalysis() {
    if (!this.localStream) return;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.localStream);
      this.localAnalyser = this.audioCtx.createAnalyser();
      this.localAnalyser.fftSize = 512;
      this.localAnalyser.smoothingTimeConstant = 0.3;
      source.connect(this.localAnalyser);

      const buffer = new Uint8Array(this.localAnalyser.frequencyBinCount);

      clearInterval(this.vadInterval);
      this.vadInterval = setInterval(() => {
        if (!this.localAnalyser || this.isMuted) {
          this.emit('local_speaking', { isSpeaking: false, level: 0 });
          return;
        }

        this.localAnalyser.getByteFrequencyData(buffer as any);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const normalized = Math.min(1, avg / 80);
        const isSpeaking = normalized > 0.12;

        this.latestTelemetry.audioLevel = normalized;
        this.latestTelemetry.isSpeaking = isSpeaking;

        this.emit('local_speaking', { isSpeaking, level: normalized });
      }, 100);
    } catch (err) {
      console.warn('VAD analysis could not be started:', err);
    }
  }

  private startTelemetryLoop() {
    clearInterval(this.telemetryInterval);
    this.telemetryInterval = setInterval(() => {
      if (!this.inVoice) return;
      this.send({
        type: 'voice_telemetry',
        ...this.latestTelemetry,
      });
    }, 200);
  }

  // ==========================================
  // WebRTC Signaling Handlers
  // ==========================================

  private async createPeerConnection(targetUserId: string, isInitiator: boolean) {
    if (this.peerConnections.has(targetUserId)) {
      return this.peerConnections.get(targetUserId)!;
    }

    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(targetUserId, pc);

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'signal',
          targetUserId,
          signal: {
            candidate: event.candidate,
          },
        });
      }
    };

    // Remote Track Handling
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      let audio = this.remoteAudioElements.get(targetUserId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.muted = this.isDeafened;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.remoteAudioElements.set(targetUserId, audio);
      }
      audio.srcObject = remoteStream;
      audio.play().catch(e => console.warn('Autoplay prevented:', e));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.cleanupPeer(targetUserId);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        this.send({
          type: 'signal',
          targetUserId,
          signal: {
            sdp: pc.localDescription,
          },
        });
      } catch (err) {
        console.error('Failed to create offer for peer', targetUserId, err);
      }
    }

    return pc;
  }

  private async handleSignal(fromUserId: string, signal: any) {
    if (!this.inVoice) return;

    let pc = this.peerConnections.get(fromUserId);
    if (!pc) {
      pc = await this.createPeerConnection(fromUserId, false);
    }

    try {
      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.send({
            type: 'signal',
            targetUserId: fromUserId,
            signal: {
              sdp: pc.localDescription,
            },
          });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.error('Error handling signal from', fromUserId, err);
    }
  }

  private cleanupPeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const audio = this.remoteAudioElements.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      this.remoteAudioElements.delete(peerId);
    }
  }

  // ==========================================
  // Inbound Server Messages Router
  // ==========================================

  private handleServerMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      switch (msg.type) {
        case 'room_list':
          this.emit('room_list', msg.rooms as PracticeRoom[]);
          break;

        case 'room_state':
          this.emit('room_state', {
            room: msg.room as PracticeRoom,
            users: msg.users as RoomUser[],
            voicePeers: msg.voicePeers as VoicePeer[],
            messages: msg.messages as ChatMessage[],
          });
          break;

        case 'user_joined':
          this.emit('user_joined', msg.user as RoomUser);
          break;

        case 'user_left':
          this.emit('user_left', msg.userId as string);
          break;

        case 'message_received':
          this.emit('message_received', msg.message as ChatMessage);
          break;

        case 'reaction_updated':
          this.emit('reaction_updated', {
            messageId: msg.messageId,
            reactions: msg.reactions,
          });
          break;

        case 'existing_voice_peers':
          // We just joined voice, initiate WebRTC peer connections with each existing peer
          if (Array.isArray(msg.peers)) {
            msg.peers.forEach((peer: VoicePeer) => {
              this.createPeerConnection(peer.id, true);
            });
          }
          break;

        case 'peer_voice_joined':
          this.emit('peer_voice_joined', msg.peer as VoicePeer);
          // Wait for incoming offer or initiate
          break;

        case 'peer_voice_left':
          this.cleanupPeer(msg.peerId);
          this.emit('peer_voice_left', msg.peerId as string);
          break;

        case 'peer_voice_status':
          this.emit('peer_voice_status', {
            peerId: msg.peerId,
            isMuted: msg.isMuted,
            isDeafened: msg.isDeafened,
          });
          break;

        case 'peer_telemetry':
          this.emit('peer_telemetry', {
            peerId: msg.peerId,
            telemetry: msg.telemetry,
          });
          break;

        case 'signal_received':
          this.handleSignal(msg.fromUserId, msg.signal);
          break;

        case 'room_created':
          this.emit('room_created', msg.roomId as string);
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket server message:', err);
    }
  }
}

export const voiceChatService = new VoiceChatService();
