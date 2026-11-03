import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hzToNote,
  noteToHz,
  detectPitch,
  analyzeResonance,
  calculateStability,
  calculateTargetScore,
  getDefaultTarget,
} from './audioMath';

test('hzToNote converts standard frequencies to correct musical notes', () => {
  // A4 = 440 Hz
  const a4 = hzToNote(440);
  assert.equal(a4.note, 'A');
  assert.equal(a4.octave, 4);
  assert.equal(a4.fullNote, 'A4');
  assert.equal(Math.abs(a4.cents), 0);

  // C4 = ~261.63 Hz (Middle C)
  const c4 = hzToNote(261.63);
  assert.equal(c4.note, 'C');
  assert.equal(c4.octave, 4);
  assert.equal(c4.fullNote, 'C4');

  // A2 = 110 Hz (Masculinization target)
  const a2 = hzToNote(110);
  assert.equal(a2.note, 'A');
  assert.equal(a2.octave, 2);
  assert.equal(a2.fullNote, 'A2');

  // 0 or invalid frequencies
  const zero = hzToNote(0);
  assert.equal(zero.fullNote, '--');
});

test('noteToHz correctly converts musical note strings to Hz', () => {
  assert.equal(Math.round(noteToHz('A4')), 440);
  assert.equal(Math.round(noteToHz('A2')), 110);
  assert.equal(Math.round(noteToHz('C4')), 262);
});

test('detectPitch accurately detects fundamental frequency from synthesized sine wave', () => {
  const sampleRate = 44100;
  const targetHz = 220; // A3
  const numSamples = 2048;
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    buffer[i] = Math.sin((2 * Math.PI * targetHz * i) / sampleRate);
  }

  const result = detectPitch(buffer, sampleRate, 60, 500);
  assert.ok(result.confidence > 0.8, 'Confidence should be high for clean sine');
  assert.ok(
    Math.abs(result.pitch - targetHz) < 2,
    `Detected pitch ${result.pitch} should be very close to ${targetHz}`
  );
});

test('detectPitch rejects pure silence', () => {
  const buffer = new Float32Array(2048);
  const result = detectPitch(buffer, 44100);
  assert.equal(result.pitch, 0);
  assert.equal(result.confidence, 0);
});

test('analyzeResonance computes formant peaks and resonance score', () => {
  const sampleRate = 44100;
  const fftSize = 2048;
  const binCount = 1024;
  const freqData = new Uint8Array(binCount);

  // Simulate bright oral resonance: boost bin corresponding to ~1800 Hz
  const binWidth = sampleRate / fftSize; // ~21.5 Hz per bin
  const brightBin = Math.round(1800 / binWidth);
  freqData[brightBin] = 220;
  freqData[brightBin - 1] = 160;
  freqData[brightBin + 1] = 160;

  const res = analyzeResonance(freqData, sampleRate, fftSize, 220);
  assert.ok(res.f2 >= 1600 && res.f2 <= 2000, `F2 should be near 1800 Hz, got ${res.f2}`);
  assert.ok(res.resonanceScore >= 50, `Resonance score should be elevated for bright peak, got ${res.resonanceScore}`);
});

test('calculateStability gives high score to steady pitch and lower score to erratic pitch', () => {
  const steadyPitches = [220, 220.5, 219.8, 220.2, 220.1, 219.9, 220.3];
  const steadyScore = calculateStability(steadyPitches);
  assert.ok(steadyScore >= 90, `Steady pitch should score high, got ${steadyScore}`);

  const wobblyPitches = [180, 240, 160, 260, 190, 230, 150];
  const wobblyScore = calculateStability(wobblyPitches);
  assert.ok(wobblyScore < steadyScore, 'Wobbly pitch should have lower stability score');
});

test('calculateTargetScore accurately scores feminization vs masculinization targets', () => {
  const femTarget = getDefaultTarget('feminization');
  const mascTarget = getDefaultTarget('masculinization');

  // Feminine voice sample: pitch 215 Hz, resonance 80, weight 35
  const femSample: any = {
    pitch: 215,
    note: 'A3',
    resonanceScore: 80,
    vocalWeight: 35,
  };

  const femScoreOnFem = calculateTargetScore(femSample, femTarget);
  assert.ok(femScoreOnFem.isInTarget, 'Feminine sample should be in feminine target');
  assert.ok(femScoreOnFem.overall > 85, 'Feminine sample should score high on feminine target');

  const femScoreOnMasc = calculateTargetScore(femSample, mascTarget);
  assert.equal(femScoreOnMasc.isInTarget, false, 'Feminine sample should NOT be in masculine target');
  assert.ok(femScoreOnMasc.overall < 50, 'Feminine sample should score low on masculine target');
});
