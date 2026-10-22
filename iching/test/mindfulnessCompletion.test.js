import assert from 'node:assert/strict';
import test from 'node:test';
import { createMindfulnessCountdown } from '../src/utils/mindfulnessCompletion.js';

function createFakeTimers() {
  let nextId = 0;
  const intervals = new Map();
  const timeouts = new Map();
  const intervalDelays = [];
  const timeoutDelays = [];

  return {
    intervalDelays,
    timeoutDelays,
    scheduleInterval(callback, delay) {
      const id = ++nextId;
      intervals.set(id, callback);
      intervalDelays.push(delay);
      return id;
    },
    cancelInterval(id) {
      intervals.delete(id);
    },
    scheduleTimeout(callback, delay) {
      const id = ++nextId;
      timeouts.set(id, callback);
      timeoutDelays.push(delay);
      return id;
    },
    cancelTimeout(id) {
      timeouts.delete(id);
    },
    tickIntervals() {
      for (const callback of [...intervals.values()]) callback();
    },
    runTimeouts() {
      const pending = [...timeouts.entries()];
      for (const [id, callback] of pending) {
        if (!timeouts.delete(id)) continue;
        callback();
      }
    },
    get pendingIntervals() {
      return intervals.size;
    },
    get pendingTimeouts() {
      return timeouts.size;
    },
  };
}

function makeCountdown(timers, onCompleteRef) {
  return createMindfulnessCountdown({
    onCompleteRef,
    scheduleInterval: timers.scheduleInterval,
    cancelInterval: timers.cancelInterval,
    scheduleTimeout: timers.scheduleTimeout,
    cancelTimeout: timers.cancelTimeout,
  });
}

test('delayed completion uses the latest callback', () => {
  const timers = createFakeTimers();
  let oldCalls = 0;
  let currentCalls = 0;
  const onCompleteRef = { current: () => { oldCalls += 1; } };
  const countdown = makeCountdown(timers, onCompleteRef);

  countdown.start();
  for (let second = 0; second < 10; second += 1) timers.tickIntervals();
  onCompleteRef.current = () => { currentCalls += 1; };
  timers.runTimeouts();

  assert.deepEqual(timers.intervalDelays, [1000]);
  assert.deepEqual(timers.timeoutDelays, [350]);
  assert.equal(oldCalls, 0);
  assert.equal(currentCalls, 1);
});

test('cancel on close or unmount prevents pending delayed completion', () => {
  const timers = createFakeTimers();
  let completeCalls = 0;
  const countdown = makeCountdown(timers, { current: () => { completeCalls += 1; } });

  countdown.start();
  for (let second = 0; second < 10; second += 1) timers.tickIntervals();
  assert.equal(timers.pendingTimeouts, 1);

  countdown.cancel();
  timers.runTimeouts();

  assert.equal(timers.pendingIntervals, 0);
  assert.equal(timers.pendingTimeouts, 0);
  assert.equal(completeCalls, 0);
});

test('skip before the last tick wins once and cancels the countdown', () => {
  const timers = createFakeTimers();
  let completeCalls = 0;
  const countdown = makeCountdown(timers, { current: () => { completeCalls += 1; } });

  countdown.start();
  for (let second = 0; second < 9; second += 1) timers.tickIntervals();
  countdown.skip();
  timers.tickIntervals();
  timers.runTimeouts();

  assert.equal(completeCalls, 1);
  assert.equal(timers.pendingIntervals, 0);
  assert.equal(timers.pendingTimeouts, 0);
});

test('skip during the completion delay fires the latest callback immediately once', () => {
  const timers = createFakeTimers();
  let oldCalls = 0;
  let currentCalls = 0;
  const onCompleteRef = { current: () => { oldCalls += 1; } };
  const countdown = makeCountdown(timers, onCompleteRef);

  countdown.start();
  for (let second = 0; second < 10; second += 1) timers.tickIntervals();
  assert.equal(timers.pendingTimeouts, 1);

  onCompleteRef.current = () => { currentCalls += 1; };
  countdown.skip();
  assert.equal(currentCalls, 1);
  assert.equal(oldCalls, 0);
  assert.equal(timers.pendingTimeouts, 0);

  timers.runTimeouts();

  assert.equal(currentCalls, 1);
  assert.equal(timers.pendingIntervals, 0);
  assert.equal(timers.pendingTimeouts, 0);
});
