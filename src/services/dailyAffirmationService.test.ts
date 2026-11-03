import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DailyAffirmationService, AFFIRMATIONS_CATALOG } from './dailyAffirmationService.ts';

// Polyfill localStorage for node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size,
  } as Storage;
}

describe('DailyAffirmationService', () => {
  let service: DailyAffirmationService;

  beforeEach(() => {
    localStorage.clear();
    service = new DailyAffirmationService();
  });

  test('catalog contains distinct affirmations and physiological tips', () => {
    assert.ok(AFFIRMATIONS_CATALOG.length >= 15, 'Should have rich affirmations catalog');
    for (const item of AFFIRMATIONS_CATALOG) {
      assert.ok(item.id, 'Item must have an id');
      assert.ok(item.quote.length > 10, 'Quote must be meaningful');
      assert.ok(item.tipTitle.length > 3, 'Tip title must be present');
      assert.ok(item.tipContent.length > 20, 'Tip content must be informative');
      assert.ok(item.actionableCue.length > 5, 'Actionable cue must be present');
    }
  });

  test('filters correctly by vocal track', () => {
    const femList = service.getAffirmationsForTrack('feminization');
    const mascList = service.getAffirmationsForTrack('masculinization');

    assert.ok(femList.length > 0);
    assert.ok(mascList.length > 0);

    // Fem list should only contain feminization or universal
    for (const item of femList) {
      assert.ok(item.track === 'feminization' || item.track === 'universal');
    }

    // Masc list should only contain masculinization or universal
    for (const item of mascList) {
      assert.ok(item.track === 'masculinization' || item.track === 'universal');
    }
  });

  test('first login detection works properly', () => {
    // Initially has not seen today
    assert.strictEqual(service.hasSeenToday(), false);

    // Mark as seen
    service.markSeenToday();
    assert.strictEqual(service.hasSeenToday(), true);
  });

  test('deterministic daily affirmation based on date', () => {
    const aff1 = service.getTodayAffirmation('feminization');
    const aff2 = service.getTodayAffirmation('feminization');
    assert.strictEqual(aff1.id, aff2.id, 'Should be deterministic on the same date');
  });

  test('favorites toggle and persistence', () => {
    const testId = 'fem-01';
    assert.strictEqual(service.isFavorite(testId), false);

    const added = service.toggleFavorite(testId);
    assert.strictEqual(added, true);
    assert.strictEqual(service.isFavorite(testId), true);

    const favs = service.getFavoriteAffirmations();
    assert.strictEqual(favs.length, 1);
    assert.strictEqual(favs[0].id, testId);

    const removed = service.toggleFavorite(testId);
    assert.strictEqual(removed, false);
    assert.strictEqual(service.isFavorite(testId), false);
  });

  test('bonus XP claim only allowed once per day', () => {
    assert.strictEqual(service.hasClaimedBonusToday(), false);
    const result1 = service.claimDailyBonus();
    assert.strictEqual(result1.success, true);
    assert.strictEqual(result1.xpAwarded, 10);
    assert.strictEqual(service.hasClaimedBonusToday(), true);

    // Second attempt should fail
    const result2 = service.claimDailyBonus();
    assert.strictEqual(result2.success, false);
    assert.strictEqual(result2.xpAwarded, 0);
  });

  test('time greeting returns appropriate text', () => {
    const greeting = service.getTimeGreeting();
    assert.ok(typeof greeting === 'string');
    assert.ok(greeting.length > 0);
  });
});
