import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client (with recommended headers)
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * AI Voice Coach Drill Analysis Endpoint
 */
app.post('/api/ai-coach/analyze', async (req, res) => {
  try {
    const {
      track = 'feminization',
      drillTitle = 'Vocal Drill',
      avgPitch = 0,
      pitchStability = 0,
      avgResonance = 0,
      vocalWeight = 50,
      durationSec = 10,
      notes = '',
    } = req.body;

    // Check if Gemini API is available
    if (aiClient) {
      const prompt = `You are an elite Speech-Language Pathologist (SLP) and world-renowned gender-affirming voice coach specializing in vocal feminization, masculinization, and vocal agility.
Analyze this vocal training session:
- Goal/Track: ${track}
- Drill: ${drillTitle}
- Average Fundamental Frequency (Pitch F0): ${avgPitch} Hz
- Pitch Stability: ${pitchStability}%
- Acoustic Resonance Score: ${avgResonance}/100 (0 = dark pharyngeal/chest resonance, 100 = bright oral/head resonance)
- Vocal Weight / Fold Thickness: ${vocalWeight}/100 (0 = thin/light, 100 = heavy/thick)
- Practice Duration: ${durationSec} seconds
- User feedback/feel: "${notes || 'Felt focused'}"

Provide an empathetic, anatomically precise, actionable assessment. For feminization, focus on vocal tract shortening (larynx elevation, oropharyngeal narrowing, tongue fronting, light vocal weight without falsetto strain). For masculinization, focus on pharyngeal widening, comfortable larynx depression, chest resonance placement, thick vocal folds without pushing. Avoid throat constriction or tension.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert gender-affirming voice coach. Return structured JSON with compassionate, physiologically actionable feedback.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER, description: 'Overall drill execution score out of 100' },
              summary: { type: Type.STRING, description: 'Brief 2-sentence encouraging summary of the performance' },
              resonanceFeedback: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, description: "'optimal', 'too-dark', 'too-bright', or 'inconsistent'" },
                  details: { type: Type.STRING, description: 'Acoustic observation about formants and vocal tract length' },
                  physiologicalAdjustment: { type: Type.STRING, description: 'Precise physical cue (tongue arch, soft palate, larynx, embouchure)' },
                },
                required: ['status', 'details', 'physiologicalAdjustment'],
              },
              pitchFeedback: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, description: "'optimal', 'too-low', 'too-high', or 'unstable'" },
                  details: { type: Type.STRING, description: 'Observation on pitch frequency and melodic stability' },
                  musicalTip: { type: Type.STRING, description: 'Actionable tip on pitch control without straining vocal cords' },
                },
                required: ['status', 'details', 'musicalTip'],
              },
              toneFeedback: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, description: "'balanced', 'too-heavy', 'too-strained', or 'too-breathy'" },
                  details: { type: Type.STRING, description: 'Observation on vocal fold mass and glottal closure' },
                  vocalHealthTip: { type: Type.STRING, description: 'Vocal hygiene and strain prevention advice' },
                },
                required: ['status', 'details', 'vocalHealthTip'],
              },
              actionableSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 numbered step-by-step corrections to try on the next attempt',
              },
              encouragement: { type: Type.STRING, description: 'Warm gender-affirming closing word' },
            },
            required: ['overallScore', 'summary', 'resonanceFeedback', 'pitchFeedback', 'toneFeedback', 'actionableSteps', 'encouragement'],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? '{}');
      return res.json(parsed);
    }

    // Heuristic fallback if Gemini API is not configured or in testing
    const fallbackResponse = generateHeuristicAnalysis({
      track,
      drillTitle,
      avgPitch,
      pitchStability,
      avgResonance,
      vocalWeight,
      durationSec,
    });
    return res.json(fallbackResponse);
  } catch (error: any) {
    console.error('AI Coach analyze error:', error);
    // Fallback gracefully so drill never crashes
    const fallback = generateHeuristicAnalysis(req.body);
    return res.json(fallback);
  }
});

/**
 * AI Coach Conversational Guidance Endpoint
 */
app.post('/api/ai-coach/chat', async (req, res) => {
  try {
    const { messages = [], track = 'feminization', currentMetrics } = req.body;
    const latestUserMessage = messages[messages.length - 1]?.text || 'Hello coach';

    if (aiClient) {
      const systemInstruction = `You are Resona's AI Voice Coach, an expert in acoustic voice modification, gender-affirming vocal training (feminization and masculinization), and speech pathology.
The user is currently training on the "${track}" track.
Current live metrics if available: Pitch: ${currentMetrics?.pitch || 'N/A'} Hz, Resonance: ${currentMetrics?.resonanceScore || 'N/A'}/100, Vocal Weight: ${currentMetrics?.vocalWeight || 'N/A'}/100.
Always emphasize:
1. Pitch and resonance are independent acoustic variables (you can have high pitch with dark resonance, or low pitch with bright resonance).
2. Avoiding vocal strain, tongue tension, and constricting the false vocal folds.
3. Concrete physiological cues (e.g. whispering "ee" for high tongue root, yawning silently for pharyngeal expansion, dog panting for larynx control).
Keep responses clear, warm, structured, and easy to read during practice sessions.`;

      const contents = messages.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      return res.json({ reply: response.text });
    }

    // Heuristic coaching reply
    const reply = getHeuristicCoachReply(latestUserMessage, track);
    return res.json({ reply });
  } catch (error: any) {
    console.error('AI Coach chat error:', error);
    const reply = getHeuristicCoachReply('help', req.body.track || 'feminization');
    return res.json({ reply });
  }
});

/**
 * Heuristic fallback engine with clinical gender-affirming vocal knowledge
 */
function generateHeuristicAnalysis(data: any) {
  const isFem = data.track === 'feminization';
  const pitch = Number(data.avgPitch) || (isFem ? 210 : 115);
  const resonance = Number(data.avgResonance) || (isFem ? 75 : 28);
  const stability = Number(data.pitchStability) || 82;
  const weight = Number(data.vocalWeight) || (isFem ? 35 : 70);

  let overallScore = 78;
  if (isFem) {
    const pitchMatch = Math.max(0, 100 - Math.abs(pitch - 215) * 1.5);
    const resMatch = Math.max(0, 100 - Math.abs(resonance - 80) * 1.8);
    overallScore = Math.round(pitchMatch * 0.4 + resMatch * 0.4 + stability * 0.2);
  } else {
    const pitchMatch = Math.max(0, 100 - Math.abs(pitch - 110) * 1.5);
    const resMatch = Math.max(0, 100 - Math.abs(resonance - 25) * 1.8);
    overallScore = Math.round(pitchMatch * 0.4 + resMatch * 0.4 + stability * 0.2);
  }

  overallScore = Math.min(96, Math.max(62, overallScore));

  if (isFem) {
    return {
      overallScore,
      summary: `Solid execution! Your average pitch of ${Math.round(pitch)} Hz and resonance score of ${Math.round(resonance)}% show great engagement of your upper vocal tract.`,
      resonanceFeedback: {
        status: resonance >= 65 ? 'optimal' : 'too-dark',
        details: resonance >= 65
          ? 'Forward oral resonance is bright and elevated with strong F2 harmonic presence.'
          : 'Resonance still leans slightly toward the throat/pharynx. Shorten the vocal tract for a brighter sound.',
        physiologicalAdjustment: 'Gently smile into your soft palate, raise the back of your tongue into an /i/ ("ee") posture, and keep your neck relaxed.',
      },
      pitchFeedback: {
        status: pitch >= 180 ? 'optimal' : 'too-low',
        details: `Your fundamental frequency centered at ${Math.round(pitch)} Hz with ${Math.round(stability)}% stability.`,
        musicalTip: 'Anchor your voice comfortably between G#3 and B3. Avoid jumping up using tension; glide smoothly using steady breath support.',
      },
      toneFeedback: {
        status: weight <= 45 ? 'balanced' : 'too-heavy',
        details: weight <= 45
          ? 'Vocal weight is thin and agile, preventing chesty heaviness.'
          : 'Slightly heavy vocal fold contact. Think of a feather-light onset.',
        vocalHealthTip: 'Take a sip of water and check for throat tension. Your larynx should float naturally without pinching.',
      },
      actionableSteps: [
        'Practice a silent whisper siren up into the "small dog" posture before vocalizing.',
        'Sustain an "ee" vowel while keeping the resonance high in your cheekbones.',
        'Keep the breath steady like blowing out a birthday candle from across the room.',
      ],
      encouragement: 'Every minute of focused practice rewires your muscle memory. You are making real progress!',
    };
  } else {
    return {
      overallScore,
      summary: `Grounded practice session! Your pitch centered at ${Math.round(pitch)} Hz with a warm resonance profile of ${Math.round(resonance)}%.`,
      resonanceFeedback: {
        status: resonance <= 38 ? 'optimal' : 'too-bright',
        details: resonance <= 38
          ? 'Deep pharyngeal resonance achieved with expanded vocal tract volume.'
          : 'Sound is sitting slightly forward. Open the back of the throat to deepen the timbre.',
        physiologicalAdjustment: 'Initiate a gentle silent yawn to drop the larynx and expand the pharyngeal wall, letting the sound vibrate in your sternum.',
      },
      pitchFeedback: {
        status: pitch <= 140 ? 'optimal' : 'too-high',
        details: `Pitch averaged ${Math.round(pitch)} Hz with ${Math.round(stability)}% stability score.`,
        musicalTip: 'Aim for a comfortable bottom speaking range (F2 to C3). Let pitch decline naturally at the end of statements.',
      },
      toneFeedback: {
        status: weight >= 55 ? 'balanced' : 'too-breathy',
        details: weight >= 55
          ? 'Vocal fold contact has good mass and grounded chest resonance.'
          : 'Voice has a bit of breathy dispersion. Engage firm, comfortable glottal closure.',
        vocalHealthTip: 'Never push down forcefully on your neck or voice box. True depth comes from open space, not muscular strain.',
      },
      actionableSteps: [
        'Do a slow yawn-sigh starting high and sliding down into your chest resonance.',
        'Speak the phrase "Morning coffee" focusing on downward sentence-final inflection.',
        'Place one hand on your upper chest to physically feel sympathetic bone vibrations.',
      ],
      encouragement: 'Your lower resonance is developing consistent depth. Keep trusting the open pharyngeal space!',
    };
  }
}

function getHeuristicCoachReply(msg: string, track: string): string {
  const lower = msg.toLowerCase();
  const isFem = track === 'feminization';

  if (lower.includes('strain') || lower.includes('hurt') || lower.includes('tight')) {
    return `If your throat feels tight or strained, pause immediately and swallow gently with a sip of lukewarm water.
Strain usually happens when the false vocal folds constrict, or when you push pitch higher using neck muscles instead of breath support.
Try the "Silent Giggle" drill: exhale silently with a gentle smile and open throat. This elevates the larynx safely without squeezing.`;
  }

  if (lower.includes('resonance') || lower.includes('bright') || lower.includes('dark')) {
    if (isFem) {
      return `To brighten resonance without raising pitch:
1. **Shorten Vocal Tract:** Elevate the larynx gently using the "Big Dog / Small Dog" panting drill.
2. **Tongue Root Position:** Arch the back of the tongue toward your upper molars like saying the vowel in "key".
3. **Mouth Shape:** Bring lip corners slightly back (a pleasant neutral face, not an exaggerated grin) to reduce front space.`;
    } else {
      return `To darken resonance without straining your pitch:
1. **Expand Vocal Tract:** Silently begin a yawn. Feel the back of your throat expand into a warm cavern.
2. **Larynx Relaxation:** Allow the larynx to sit in a neutral-low resting position.
3. **Chest Placement:** Focus on feeling vibrations in your collarbone and upper chest rather than your nose.`;
    }
  }

  if (lower.includes('pitch') || lower.includes('hz') || lower.includes('frequency')) {
    if (isFem) {
      return `For vocal feminization, 190–240 Hz is the standard speaking pitch target (around G3 to B3).
However, resonance and speech inflection account for 70% of perceived gender in voice! A pitch of 185 Hz with bright resonance sounds significantly more feminine than 240 Hz with hollow throat resonance.`;
    } else {
      return `For vocal masculinization, 90–135 Hz is the typical speaking pitch target (around F#2 to C#3).
Focus on steady, downward sentence endings (falling intonation) rather than monotone force. Deep resonance will make 120 Hz sound deep, authoritative, and grounded.`;
    }
  }

  return `Welcome to your session! I'm here to help you hone your ${isFem ? 'vocal feminization' : 'vocal masculinization'}.
You can ask me about:
• How to isolate resonance from pitch
• Removing throat and tongue tension
• Exercises for vocal tract length control
• Tips for your live spectrograph readings`;
}

// ==========================================
// REAL-TIME VOICE CHAT & TEXT MESSAGING (WS)
// ==========================================

interface ServerRoom {
  id: string;
  name: string;
  topic: string;
  category: 'resonance' | 'pitch' | 'casual' | 'warmup' | 'custom';
  isCustom: boolean;
  recommendedTrack: 'feminization' | 'masculinization' | 'all';
  messages: any[];
  users: Map<string, {
    id: string;
    name: string;
    track: string;
    avatar: any;
    inVoice: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    ws: WebSocket;
  }>;
  voicePeers: Map<string, {
    id: string;
    name: string;
    track: string;
    avatar: any;
    isMuted: boolean;
    isDeafened: boolean;
    isSpeaking: boolean;
    audioLevel: number;
    currentPitch?: number;
    currentResonance?: number;
    inTargetZone?: boolean;
    joinedVoiceAt: number;
  }>;
}

const rooms = new Map<string, ServerRoom>();

function initPresetRooms() {
  const presetDefinitions: Omit<ServerRoom, 'users' | 'voicePeers' | 'messages'>[] = [
    {
      id: 'resonance-lab',
      name: 'Resonance Lab',
      topic: 'Vowel formant shaping, larynx positioning, and oral vs pharyngeal space.',
      category: 'resonance',
      isCustom: false,
      recommendedTrack: 'feminization',
    },
    {
      id: 'pitch-dojo',
      name: 'Pitch Corridor Dojo',
      topic: 'Pitch stability, intonation glides, and natural cadence practice.',
      category: 'pitch',
      isCustom: false,
      recommendedTrack: 'all',
    },
    {
      id: 'casual-lounge',
      name: 'Voice Lounge',
      topic: 'Casual conversational practice in your authentic voice with supportive peers.',
      category: 'casual',
      isCustom: false,
      recommendedTrack: 'all',
    },
    {
      id: 'warmup-circle',
      name: 'Warm-Up Circle',
      topic: 'Group lip trills, straw phonation, and resonant humming scales.',
      category: 'warmup',
      isCustom: false,
      recommendedTrack: 'all',
    },
  ];

  for (const preset of presetDefinitions) {
    rooms.set(preset.id, {
      ...preset,
      users: new Map(),
      voicePeers: new Map(),
      messages: [
        {
          id: `sys-welcome-${preset.id}`,
          roomId: preset.id,
          senderId: 'system-coach',
          senderName: 'Resona SLP Coach',
          senderTrack: preset.recommendedTrack,
          avatar: {
            skinTone: '#fed7aa',
            hairStyle: 'bob',
            hairColor: '#38bdf8',
            eyeStyle: 'focused',
            makeup: 'natural',
            clothing: 'hoodie',
            clothingColor: '#0284c7',
            accessory: 'headphones',
            expression: 'happy',
          },
          text: `Welcome to #${preset.name}! Connect your voice or chat with fellow learners. Practice reading out loud, trade resonance tips, or use the live telemetry meter to check each other's formants!`,
          timestamp: Date.now() - 3600000,
          isSystem: true,
          drillPrompt: preset.category === 'resonance' ? {
            title: 'Resonance Anchor Drill',
            description: 'Say: "Key, Tea, See, Bee" with a high tongue posture, then check peer resonance meters.',
            samplePhrase: 'Keep the sound humming right between your eyes and cheekbones.',
          } : preset.category === 'pitch' ? {
            title: 'Rainbow Passage Sentence 1',
            description: 'Read: "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow."',
            samplePhrase: 'Aim for a smooth downward inflection at the period.',
          } : undefined,
        },
      ],
    });
  }
}

initPresetRooms();

function getRoomListPayload() {
  return Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    topic: r.topic,
    category: r.category,
    memberCount: r.users.size,
    voiceCount: r.voicePeers.size,
    recommendedTrack: r.recommendedTrack,
    isCustom: r.isCustom,
  }));
}

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const member of room.users.values()) {
    if (member.ws !== excludeWs && member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(payload);
    }
  }
}

function broadcastGlobal(message: any) {
  const payload = JSON.stringify(message);
  for (const room of rooms.values()) {
    for (const member of room.users.values()) {
      if (member.ws.readyState === WebSocket.OPEN) {
        member.ws.send(payload);
      }
    }
  }
}

// Attach WebSocketServer
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host || 'localhost:3000'}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: WebSocket) => {
  let currentUserId: string | null = null;
  let currentRoomId: string | null = null;
  let isAlive = true;

  ws.on('pong', () => {
    isAlive = true;
  });

  // Immediately send initial room list upon connection
  ws.send(JSON.stringify({
    type: 'room_list',
    rooms: getRoomListPayload(),
  }));

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.type) {
        case 'join_room': {
          const { roomId, user } = data;
          if (!roomId || !user) return;

          // If currently in another room, leave first
          if (currentRoomId && currentRoomId !== roomId) {
            leaveCurrentRoom();
          }

          let room = rooms.get(roomId);
          if (!room) {
            // Auto-create room if custom
            room = {
              id: roomId,
              name: data.roomName || 'Practice Room',
              topic: data.roomTopic || 'Custom peer practice space',
              category: 'custom',
              isCustom: true,
              recommendedTrack: 'all',
              messages: [],
              users: new Map(),
              voicePeers: new Map(),
            };
            rooms.set(roomId, room);
          }

          currentUserId = user.id;
          currentRoomId = roomId;

          // Add user to room
          room.users.set(user.id, {
            id: user.id,
            name: user.name || 'Anonymous Learner',
            track: user.track || 'feminization',
            avatar: user.avatar,
            inVoice: false,
            isMuted: false,
            isDeafened: false,
            ws,
          });

          // Send full room state to the newly joined client
          ws.send(JSON.stringify({
            type: 'room_state',
            room: {
              id: room.id,
              name: room.name,
              topic: room.topic,
              category: room.category,
              memberCount: room.users.size,
              voiceCount: room.voicePeers.size,
              recommendedTrack: room.recommendedTrack,
              isCustom: room.isCustom,
            },
            users: Array.from(room.users.values()).map(u => ({
              id: u.id,
              name: u.name,
              track: u.track,
              avatar: u.avatar,
              inVoice: u.inVoice,
              isMuted: u.isMuted,
              isDeafened: u.isDeafened,
              connectedAt: Date.now(),
            })),
            voicePeers: Array.from(room.voicePeers.values()),
            messages: room.messages,
          }));

          // Notify existing room members
          broadcastToRoom(roomId, {
            type: 'user_joined',
            user: {
              id: user.id,
              name: user.name,
              track: user.track,
              avatar: user.avatar,
              inVoice: false,
              connectedAt: Date.now(),
            },
          }, ws);

          // Update global room list counts
          broadcastGlobal({
            type: 'room_list',
            rooms: getRoomListPayload(),
          });
          break;
        }

        case 'leave_room': {
          leaveCurrentRoom();
          break;
        }

        case 'chat_message': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const member = room.users.get(currentUserId);
          if (!member) return;

          const newMsg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            roomId: currentRoomId,
            senderId: member.id,
            senderName: member.name,
            senderTrack: member.track,
            avatar: member.avatar,
            text: (data.text || '').trim().slice(0, 1000),
            timestamp: Date.now(),
            reactions: {},
            drillPrompt: data.drillPrompt || undefined,
          };

          room.messages.push(newMsg);
          if (room.messages.length > 100) {
            room.messages.shift();
          }

          broadcastToRoom(currentRoomId, {
            type: 'message_received',
            message: newMsg,
          });
          break;
        }

        case 'chat_reaction': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const { messageId, emoji } = data;
          const targetMsg = room.messages.find(m => m.id === messageId);
          if (!targetMsg) return;

          if (!targetMsg.reactions) targetMsg.reactions = {};
          const usersList = targetMsg.reactions[emoji] || [];
          const userObj = room.users.get(currentUserId);
          const userName = userObj?.name || 'Someone';

          if (usersList.includes(userName)) {
            targetMsg.reactions[emoji] = usersList.filter((u: string) => u !== userName);
            if (targetMsg.reactions[emoji].length === 0) {
              delete targetMsg.reactions[emoji];
            }
          } else {
            targetMsg.reactions[emoji] = [...usersList, userName];
          }

          broadcastToRoom(currentRoomId, {
            type: 'reaction_updated',
            messageId,
            reactions: targetMsg.reactions,
          });
          break;
        }

        case 'voice_join': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const member = room.users.get(currentUserId);
          if (!member) return;

          member.inVoice = true;

          const newVoicePeer = {
            id: member.id,
            name: member.name,
            track: member.track,
            avatar: member.avatar,
            isMuted: Boolean(data.isMuted),
            isDeafened: Boolean(data.isDeafened),
            isSpeaking: false,
            audioLevel: 0,
            joinedVoiceAt: Date.now(),
          };

          room.voicePeers.set(member.id, newVoicePeer);

          // Tell the new peer about existing voice peers to initiate WebRTC offers
          ws.send(JSON.stringify({
            type: 'existing_voice_peers',
            peers: Array.from(room.voicePeers.values()).filter(p => p.id !== member.id),
          }));

          // Broadcast peer joined to all in room
          broadcastToRoom(currentRoomId, {
            type: 'peer_voice_joined',
            peer: newVoicePeer,
          }, ws);

          broadcastGlobal({
            type: 'room_list',
            rooms: getRoomListPayload(),
          });
          break;
        }

        case 'voice_leave': {
          if (!currentRoomId || !currentUserId) return;
          leaveVoiceInRoom(currentRoomId, currentUserId);
          break;
        }

        case 'voice_status': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const peer = room.voicePeers.get(currentUserId);
          if (peer) {
            if (typeof data.isMuted === 'boolean') peer.isMuted = data.isMuted;
            if (typeof data.isDeafened === 'boolean') peer.isDeafened = data.isDeafened;

            broadcastToRoom(currentRoomId, {
              type: 'peer_voice_status',
              peerId: currentUserId,
              isMuted: peer.isMuted,
              isDeafened: peer.isDeafened,
            });
          }
          break;
        }

        case 'voice_telemetry': {
          if (!currentRoomId || !currentUserId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const peer = room.voicePeers.get(currentUserId);
          if (peer) {
            peer.currentPitch = data.pitch;
            peer.currentResonance = data.resonance;
            peer.inTargetZone = data.inTarget;
            peer.audioLevel = data.audioLevel;
            peer.isSpeaking = data.isSpeaking;

            broadcastToRoom(currentRoomId, {
              type: 'peer_telemetry',
              peerId: currentUserId,
              telemetry: {
                pitch: data.pitch,
                resonance: data.resonance,
                inTarget: data.inTarget,
                audioLevel: data.audioLevel,
                isSpeaking: data.isSpeaking,
              },
            }, ws);
          }
          break;
        }

        case 'signal': {
          // WebRTC Signaling Relay
          if (!currentRoomId || !currentUserId) return;
          const { targetUserId, signal } = data;
          if (!targetUserId || !signal) return;

          const room = rooms.get(currentRoomId);
          if (!room) return;

          const targetMember = room.users.get(targetUserId);
          if (targetMember && targetMember.ws.readyState === WebSocket.OPEN) {
            targetMember.ws.send(JSON.stringify({
              type: 'signal_received',
              fromUserId: currentUserId,
              signal,
            }));
          }
          break;
        }

        case 'create_room': {
          const newRoomId = `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          const newRoom: ServerRoom = {
            id: newRoomId,
            name: (data.name || 'Custom Practice Room').trim().slice(0, 40),
            topic: (data.topic || 'Peer practice and feedback').trim().slice(0, 100),
            category: data.category || 'custom',
            isCustom: true,
            recommendedTrack: data.recommendedTrack || 'all',
            messages: [
              {
                id: `msg-welcome-${newRoomId}`,
                roomId: newRoomId,
                senderId: 'system',
                senderName: 'System',
                senderTrack: 'all',
                avatar: {
                  skinTone: '#fed7aa',
                  hairStyle: 'pixie',
                  hairColor: '#a855f7',
                  eyeStyle: 'focused',
                  makeup: 'glam',
                  clothing: 'cardigan',
                  clothingColor: '#9333ea',
                  accessory: 'headphones',
                  expression: 'happy',
                },
                text: `Welcome to ${data.name || 'this practice room'}! Jump in voice or post text messages to practice together.`,
                timestamp: Date.now(),
                isSystem: true,
              },
            ],
            users: new Map(),
            voicePeers: new Map(),
          };
          rooms.set(newRoomId, newRoom);

          ws.send(JSON.stringify({
            type: 'room_created',
            roomId: newRoomId,
          }));

          broadcastGlobal({
            type: 'room_list',
            rooms: getRoomListPayload(),
          });
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  function leaveVoiceInRoom(roomId: string, userId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const member = room.users.get(userId);
    if (member) member.inVoice = false;

    if (room.voicePeers.has(userId)) {
      room.voicePeers.delete(userId);
      broadcastToRoom(roomId, {
        type: 'peer_voice_left',
        peerId: userId,
      });
      broadcastGlobal({
        type: 'room_list',
        rooms: getRoomListPayload(),
      });
    }
  }

  function leaveCurrentRoom() {
    if (!currentRoomId || !currentUserId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      leaveVoiceInRoom(currentRoomId, currentUserId);
      room.users.delete(currentUserId);

      broadcastToRoom(currentRoomId, {
        type: 'user_left',
        userId: currentUserId,
      });

      // If custom room is empty, remove it to prevent stale rooms
      if (room.isCustom && room.users.size === 0) {
        rooms.delete(currentRoomId);
      }

      broadcastGlobal({
        type: 'room_list',
        rooms: getRoomListPayload(),
      });
    }
    currentRoomId = null;
  }

  ws.on('close', () => {
    leaveCurrentRoom();
  });
});

// 30-second ping interval to clean dead connections
const pingInterval = setInterval(() => {
  for (const room of rooms.values()) {
    for (const [userId, member] of room.users.entries()) {
      if (member.ws.readyState === WebSocket.OPEN) {
        member.ws.ping();
      } else {
        room.users.delete(userId);
        room.voicePeers.delete(userId);
      }
    }
  }
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Resona voice training server with WebSockets listening on http://0.0.0.0:${port}`);
  });
}

startServer();

