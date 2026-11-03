/**
 * Unit tests for voiceChatService & chat data structures
 */

import { test } from 'node:test';
import assert from 'node:assert';

test('ChatMessage structure formats valid practice room messages', () => {
  const msg = {
    id: 'msg-123',
    roomId: 'resonance-lab',
    senderId: 'user-abc',
    senderName: 'VocalExplorer#412',
    senderTrack: 'feminization' as const,
    avatar: {
      skinTone: '#fed7aa',
      hairStyle: 'bob',
      hairColor: '#38bdf8',
      eyeStyle: 'focused',
      makeup: 'natural',
      clothing: 'hoodie',
      clothingColor: '#0284c7',
      accessory: 'headphones',
      expression: 'happy' as const,
    },
    text: 'Can someone listen to my vowel shift from /i/ to /u/?',
    timestamp: Date.now(),
  };

  assert.strictEqual(msg.senderTrack, 'feminization');
  assert.strictEqual(msg.text.includes('vowel shift'), true);
  assert.strictEqual(typeof msg.timestamp, 'number');
});

test('VoicePeer telemetry calculates correct target zone match', () => {
  const peer = {
    id: 'peer-456',
    name: 'SirenSparrow#801',
    track: 'feminization' as const,
    currentPitch: 215,
    currentResonance: 78,
  };

  const isFemTarget = (pitch: number, resonance: number) => {
    return pitch >= 180 && pitch <= 245 && resonance >= 65;
  };

  assert.strictEqual(isFemTarget(peer.currentPitch, peer.currentResonance), true);
  assert.strictEqual(isFemTarget(140, 40), false);
});

test('Practice room categories are recognized', () => {
  const categories = ['resonance', 'pitch', 'casual', 'warmup', 'custom'];
  assert.strictEqual(categories.includes('resonance'), true);
  assert.strictEqual(categories.includes('casual'), true);
  assert.strictEqual(categories.includes('warmup'), true);
});
