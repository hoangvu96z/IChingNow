import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStreakActivity,
  hasStreakData,
  isStreakFreezePending,
  mergeStreakData,
  normalizeStreakData,
  recalculateStreak,
} from '../src/utils/streakState.mjs';

test('activity increments same-day count without changing the streak', () => {
  const result = applyStreakActivity({
    currentStreak: 4,
    longestStreak: 6,
    totalReadings: 11,
    lastActiveDate: '2026-10-22',
    streakFreezeUsed: false,
  }, '2026-10-22');

  assert.deepEqual(result, {
    currentStreak: 4,
    longestStreak: 6,
    totalReadings: 12,
    lastActiveDate: '2026-10-22',
    streakFreezeUsed: false,
    dailyCardDate: null,
    dailyCardId: null,
  });
});

test('first activity starts a one-day streak', () => {
  const result = applyStreakActivity({ totalReadings: 0 }, '2026-10-23');
  assert.equal(result.currentStreak, 1);
  assert.equal(result.longestStreak, 1);
  assert.equal(result.totalReadings, 1);
  assert.equal(result.lastActiveDate, '2026-10-23');
});

test('activity preserves one-day streak freeze and resets after a second missed day', () => {
  const frozen = applyStreakActivity({
    currentStreak: 4,
    longestStreak: 6,
    totalReadings: 11,
    lastActiveDate: '2026-10-20',
    streakFreezeUsed: false,
  }, '2026-10-22');
  assert.equal(frozen.currentStreak, 5);
  assert.equal(frozen.streakFreezeUsed, true);

  const broken = applyStreakActivity({ ...frozen, lastActiveDate: '2026-10-22' }, '2026-10-25');
  assert.equal(broken.currentStreak, 1);
  assert.equal(broken.longestStreak, 6);
  assert.equal(broken.streakFreezeUsed, false);
});

test('recalculation keeps a pending shield unconsumed until activity uses it', () => {
  const beforeActivity = recalculateStreak({
    currentStreak: 4,
    longestStreak: 6,
    totalReadings: 11,
    lastActiveDate: '2026-10-20',
    streakFreezeUsed: false,
  }, '2026-10-22');

  assert.equal(beforeActivity.currentStreak, 4);
  assert.equal(beforeActivity.streakFreezeUsed, false);
  assert.equal(isStreakFreezePending(beforeActivity, '2026-10-22'), true);

  const afterActivity = applyStreakActivity(beforeActivity, '2026-10-22');
  assert.equal(afterActivity.currentStreak, 5);
  assert.equal(afterActivity.streakFreezeUsed, true);
  assert.equal(isStreakFreezePending(afterActivity, '2026-10-22'), false);
});

test('a previously consumed shield cannot be consumed again after a missed day', () => {
  const reset = recalculateStreak({
    currentStreak: 5,
    longestStreak: 5,
    totalReadings: 12,
    lastActiveDate: '2026-10-20',
    streakFreezeUsed: true,
  }, '2026-10-22');
  const resumed = applyStreakActivity(reset, '2026-10-22');

  assert.equal(reset.currentStreak, 0);
  assert.equal(resumed.currentStreak, 1);
  assert.equal(resumed.streakFreezeUsed, false);
});

test('snapshot merge keeps local progress when server state is stale', () => {
  const merged = mergeStreakData({
    currentStreak: 8,
    longestStreak: 9,
    totalReadings: 40,
    lastActiveDate: '2026-10-22',
    streakFreezeUsed: true,
    dailyCardDate: '2026-10-22',
    dailyCardId: 'major-8',
  }, {
    currentStreak: 2,
    longestStreak: 12,
    totalReadings: 35,
    lastActiveDate: '2026-10-21',
    streakFreezeUsed: false,
    dailyCardDate: '2026-10-21',
    dailyCardId: 'cups-ace',
  });

  assert.equal(merged.currentStreak, 8);
  assert.equal(merged.longestStreak, 12);
  assert.equal(merged.totalReadings, 40);
  assert.equal(merged.lastActiveDate, '2026-10-22');
  assert.equal(merged.streakFreezeUsed, true);
  assert.equal(merged.dailyCardDate, '2026-10-22');
  assert.equal(merged.dailyCardId, 'major-8');
});

test('same-day merge is idempotent and preserves the canonical Tarot card id type', () => {
  const local = {
    currentStreak: 3,
    longestStreak: 7,
    totalReadings: 13,
    lastActiveDate: '2026-10-22',
    streakFreezeUsed: false,
    dailyCardDate: '2026-10-22',
    dailyCardId: 0,
  };
  const remote = { ...local, currentStreak: 4, dailyCardId: 'major-0' };
  const once = mergeStreakData(local, remote);
  const twice = mergeStreakData(once, remote);

  assert.deepEqual(twice, once);
  assert.equal(once.currentStreak, 4);
  assert.equal(once.dailyCardId, 'major-0');
});

test('normalization rejects invalid dates and caps malformed counters', () => {
  const normalized = normalizeStreakData({
    currentStreak: 1_000_001,
    longestStreak: -2,
    totalReadings: Number.NaN,
    lastActiveDate: '2026-02-30',
    streakFreezeUsed: true,
    dailyCardDate: 'not-a-date',
    dailyCardId: { injected: true },
  });

  assert.deepEqual(normalized, {
    currentStreak: 0,
    longestStreak: 0,
    totalReadings: 0,
    lastActiveDate: null,
    streakFreezeUsed: false,
    dailyCardDate: null,
    dailyCardId: null,
  });
  assert.equal(hasStreakData(normalized), false);
});

test('recalculation retains a pending shield without persisting it as consumed', () => {
  const pending = recalculateStreak({
    currentStreak: 4,
    lastActiveDate: '2026-10-20',
    streakFreezeUsed: false,
  }, '2026-10-22');
  assert.equal(pending.streakFreezeUsed, false);
  assert.equal(isStreakFreezePending(pending, '2026-10-22'), true);
  assert.equal(recalculateStreak({
    currentStreak: 4,
    lastActiveDate: '2026-10-20',
    streakFreezeUsed: true,
  }, '2026-10-22').currentStreak, 0);
});
