import test from 'node:test';
import assert from 'node:assert/strict';
import { LeaderboardService, generateRandomAlias } from './leaderboardService';

test('generateRandomAlias produces non-empty formatted alias with hash tag', () => {
  const alias = generateRandomAlias();
  assert.ok(alias.length > 5);
  assert.ok(alias.includes('#'), 'Alias must contain hash tag identifier');
});

test('Leaderboard excludes user entry when opted out', () => {
  const service = new LeaderboardService();
  service.saveSettings({ isOptedIn: false });

  const result = service.getEntries('focusTime', 'all', {
    focusMinutes: 100,
    streakDays: 5,
    track: 'feminization',
    level: 2,
  });

  assert.equal(result.userRank, null, 'User rank should be null when opted out');
  assert.equal(result.entries.some((e) => e.isCurrentUser), false);
});

test('Leaderboard includes and correctly ranks user entry when opted in', () => {
  const service = new LeaderboardService();
  service.saveSettings({ isOptedIn: true, userAlias: 'TestVoice#123' });

  // Give user high focus time (300 mins) -> should be rank 1
  const result = service.getEntries('focusTime', 'all', {
    focusMinutes: 300,
    streakDays: 20,
    track: 'feminization',
    level: 5,
  });

  assert.equal(result.userRank, 1, 'Top focus time should be rank 1');
  assert.equal(result.entries[0].isCurrentUser, true);
  assert.ok(result.entries[0].alias.includes('TestVoice#123'));
});

test('Leaderboard filters by track correctly', () => {
  const service = new LeaderboardService();
  service.saveSettings({ isOptedIn: true });

  const mascOnly = service.getEntries('streak', 'masculinization', {
    focusMinutes: 50,
    streakDays: 3,
    track: 'masculinization',
    level: 2,
  });

  assert.ok(mascOnly.entries.length > 0);
  for (const entry of mascOnly.entries) {
    assert.equal(entry.track, 'masculinization');
  }
});
