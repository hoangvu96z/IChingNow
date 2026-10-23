import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBufferedDailyCard,
  createActivityEvent,
  createIdentityPendingActivityBuffer,
  createPendingEventQueue,
  dispatchLocalStreakUpdate,
  mergeAccountSnapshot,
  replayBufferedActivities,
  resolveStreakIdentity,
  resolvePendingStreakActionScope,
  subscribeLocalStreakUpdates,
  subscribeToReconnect,
} from '../src/utils/streakSync.mjs';

const accountA = 'user-a';
const accountB = 'user-b';

function streak(overrides = {}) {
  return {
    currentStreak: 3,
    longestStreak: 5,
    totalReadings: 9,
    lastActiveDate: '2026-10-22',
    streakFreezeUsed: false,
    dailyCardDate: '2026-10-22',
    dailyCardId: 'major-8',
    ...overrides,
  };
}

function event(overrides = {}) {
  return createActivityEvent({
    ownerId: accountA,
    eventId: '00000000-0000-4000-8000-000000000001',
    activityDate: '2026-10-23',
    snapshot: streak(),
    createdAt: 1,
    ...overrides,
  });
}

class MemoryStorage {
  values = new Map();
  failRemove = false;
  failSetFor = null;

  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.failSetFor === key) throw new Error('storage write failed');
    this.values.set(key, String(value));
  }
  removeItem(key) {
    if (this.failRemove) throw new Error('storage removal failed');
    this.values.delete(key);
  }
}

function response(payload, ok = true) {
  return { ok, json: async () => payload };
}

test('account changes select the next account cache instead of reusing prior state', () => {
  const selected = mergeAccountSnapshot({
    activeOwnerId: accountA,
    nextOwnerId: accountB,
    currentData: streak({ currentStreak: 12, totalReadings: 40 }),
    accountLocalData: streak({ currentStreak: 4, totalReadings: 10 }),
    remoteData: streak({ currentStreak: 2, totalReadings: 8 }),
  });

  assert.equal(selected.currentStreak, 4);
  assert.equal(selected.totalReadings, 10);
});

test('guest activity is never placed in the authenticated upload queue', async () => {
  const storage = new MemoryStorage();
  const fetchImpl = async () => { throw new Error('must not upload guest activity'); };
  const queue = createPendingEventQueue({ apiBase: '/api', getStorage: () => storage, fetchImpl });
  const guestEvent = createActivityEvent({
    ownerId: null,
    eventId: '00000000-0000-4000-8000-000000000002',
    activityDate: '2026-10-23',
    snapshot: streak(),
  });

  assert.equal(guestEvent, null);
  assert.equal(queue.enqueue('iching', null, guestEvent), false);
  await queue.flush('iching', null);
  assert.equal(storage.length, 0);
});

test('failed activity stays queued and retry preserves its idempotency UUID', async () => {
  const storage = new MemoryStorage();
  const bodies = [];
  let fail = true;
  const queue = createPendingEventQueue({
    apiBase: '/api',
    getStorage: () => storage,
    fetchImpl: async (_url, init) => {
      bodies.push(JSON.parse(init.body));
      if (fail) throw new Error('offline');
      return response({ ownerId: accountA, streak: streak({ totalReadings: 10 }) });
    },
  });
  const pending = event();
  assert.equal(queue.enqueue('iching', accountA, pending), true);

  await queue.flush('iching', accountA);
  assert.equal(queue.read('iching', accountA).length, 1);
  fail = false;
  await queue.flush('iching', accountA);

  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].eventId, pending.eventId);
  assert.equal(bodies[1].eventId, pending.eventId);
  assert.equal(queue.read('iching', accountA).length, 0);
});

test('flush drains an event queued during an in-flight successful batch', async () => {
  const storage = new MemoryStorage();
  let releaseFirst;
  let markStarted;
  const firstStarted = new Promise((resolve) => { markStarted = resolve; });
  const requests = [];
  const queue = createPendingEventQueue({
    apiBase: '/api',
    getStorage: () => storage,
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      requests.push(body.eventId);
      if (requests.length === 1) {
        markStarted();
        await new Promise((resolve) => { releaseFirst = resolve; });
      }
      return response({ ownerId: accountA, streak: streak() });
    },
  });
  const first = event();
  const second = event({
    eventId: '00000000-0000-4000-8000-000000000003',
    createdAt: 2,
  });
  queue.enqueue('iching', accountA, first);
  const inFlight = queue.flush('iching', accountA);
  await firstStarted;
  queue.enqueue('iching', accountA, second);
  const requestedDrain = queue.flush('iching', accountA);
  releaseFirst();
  await Promise.all([inFlight, requestedDrain]);

  assert.deepEqual(requests, [first.eventId, second.eventId]);
  assert.equal(queue.read('iching', accountA).length, 0);
});

test('network failure exits without a hot retry loop and leaves the event queued', async () => {
  const storage = new MemoryStorage();
  let requestCount = 0;
  const queue = createPendingEventQueue({
    apiBase: '/api',
    getStorage: () => storage,
    fetchImpl: async () => {
      requestCount += 1;
      throw new Error('offline');
    },
  });
  queue.enqueue('iching', accountA, event());

  await queue.flush('iching', accountA);
  assert.equal(requestCount, 1);
  assert.equal(queue.read('iching', accountA).length, 1);
});

test('an event requested during a failed batch waits for a later retry without looping', async () => {
  const storage = new MemoryStorage();
  let releaseFirst;
  let markStarted;
  const firstStarted = new Promise((resolve) => { markStarted = resolve; });
  let requestCount = 0;
  let failFirst = true;
  const queue = createPendingEventQueue({
    apiBase: '/api',
    getStorage: () => storage,
    fetchImpl: async (_url, init) => {
      requestCount += 1;
      JSON.parse(init.body);
      if (failFirst) {
        markStarted();
        await new Promise((resolve) => { releaseFirst = resolve; });
        return response({}, false);
      }
      return response({ ownerId: accountA, streak: streak() });
    },
  });
  queue.enqueue('iching', accountA, event());
  const firstFlush = queue.flush('iching', accountA);
  await firstStarted;
  queue.enqueue('iching', accountA, event({
    eventId: '00000000-0000-4000-8000-000000000015',
    createdAt: 6,
  }));
  const concurrentFlush = queue.flush('iching', accountA);
  releaseFirst();
  await Promise.all([firstFlush, concurrentFlush]);

  assert.equal(requestCount, 1);
  assert.equal(queue.read('iching', accountA).length, 2);
  failFirst = false;
  await queue.flush('iching', accountA);
  assert.equal(requestCount, 3);
  assert.equal(queue.read('iching', accountA).length, 0);
});

test('same-tab hook instances receive updates only for the same app and owner', () => {
  const target = new EventTarget();
  const received = [];
  const subscribe = (appId, ownerId) => subscribeLocalStreakUpdates(target, {
    appId,
    getOwnerId: () => ownerId,
    getCurrentData: () => streak({ totalReadings: 9 }),
    onMerged: (merged) => received.push({ appId, ownerId, merged }),
  });
  const unsubscribe = [
    subscribe('iching', accountA),
    subscribe('iching', accountB),
    subscribe('tarot', accountA),
  ];

  dispatchLocalStreakUpdate(target, {
    appId: 'iching',
    ownerId: accountA,
    data: streak({ currentStreak: 6, totalReadings: 12 }),
  });

  assert.equal(received.length, 1);
  assert.equal(received[0].merged.currentStreak, 6);
  assert.equal(received[0].merged.totalReadings, 12);
  unsubscribe.forEach((unsubscribeOne) => unsubscribeOne());
});

test('auth-pending activity stores only action metadata and replays on account state', () => {
  const storage = new MemoryStorage();
  const buffer = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  const pending = {
    eventId: '00000000-0000-4000-8000-000000000011',
    activityDate: '2026-10-23',
    createdAt: 3,
  };
  assert.equal(buffer.append('iching', pending), true);
  assert.deepEqual(buffer.read('iching'), [{ ...pending, ownerId: null }]);
  assert.deepEqual(
    JSON.parse(storage.getItem('spirit_streak_identity_pending_iching')),
    [{ ...pending, ownerId: null }],
  );

  const account = replayBufferedActivities(streak({
    currentStreak: 2,
    totalReadings: 5,
    lastActiveDate: '2026-10-22',
  }), buffer.read('iching'), accountB);

  assert.equal(account.data.currentStreak, 3);
  assert.equal(account.data.totalReadings, 6);
  assert.equal(account.events.length, 1);
  assert.equal(account.events[0].ownerId, accountB);
  assert.equal(account.events[0].snapshot.currentStreak, 2);
  assert.equal(account.events[0].snapshot.totalReadings, 5);
  buffer.clear('iching');
  assert.equal(buffer.read('iching').length, 0);
});

test('pending activity binds to owner A and cannot replay for owner B after a failed clear', () => {
  const storage = new MemoryStorage();
  const buffer = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  const pending = {
    eventId: '00000000-0000-4000-8000-000000000031',
    activityDate: '2026-10-23',
    createdAt: 31,
  };
  assert.equal(buffer.append('iching', pending), true);
  assert.equal(buffer.bind('iching', accountA), true);
  const ownerAReplay = replayBufferedActivities(streak(), buffer.read('iching', accountA), accountA);
  assert.deepEqual(ownerAReplay.events.map((item) => item.ownerId), [accountA]);
  assert.deepEqual(buffer.read('iching', accountB), []);
  assert.deepEqual(replayBufferedActivities(streak(), buffer.read('iching', accountB), accountB).events, []);

  assert.equal(buffer.markProcessed('iching', accountA, [pending.eventId]), true);
  storage.failRemove = true;
  assert.equal(buffer.clear('iching', accountA), false);
  assert.deepEqual(buffer.read('iching', accountA), []);
  assert.deepEqual(buffer.read('iching', accountB), []);

  const afterReload = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  assert.deepEqual(afterReload.read('iching', accountA), []);
  assert.deepEqual(afterReload.read('iching', accountB), []);
});

test('unresolved persisted actions remain guest-only after reload', () => {
  const storage = new MemoryStorage();
  const firstTab = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  const pending = {
    eventId: '00000000-0000-4000-8000-000000000032',
    activityDate: '2026-10-23',
    createdAt: 32,
  };
  assert.equal(firstTab.append('iching', pending), true);

  const afterReload = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  assert.deepEqual(afterReload.read('iching', accountB), []);
  assert.equal(afterReload.bind('iching', accountB), true);
  assert.deepEqual(afterReload.read('iching', accountB), []);
});

test('persisted unresolved actions replay as guest after reload but never bind to an account', () => {
  const storage = new MemoryStorage();
  const firstTab = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  const pending = {
    eventId: '00000000-0000-4000-8000-000000000034',
    activityDate: '2026-10-23',
    createdAt: 34,
  };
  assert.equal(firstTab.append('iching', pending), true);
  assert.equal(firstTab.setDailyCard('iching', '2026-10-23', 'major-8'), true);

  const afterReload = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  assert.deepEqual(afterReload.read('iching', accountB), []);
  assert.equal(afterReload.readDailyCard('iching', accountB), null);
  assert.equal(afterReload.bind('iching', accountB), true);
  assert.deepEqual(afterReload.read('iching', accountB), []);
  assert.equal(afterReload.readDailyCard('iching', accountB), null);
  assert.equal(resolveStreakIdentity(200, accountB).state, 'authenticated');
  const authenticated = replayBufferedActivities(streak({ totalReadings: 4 }),
    afterReload.read('iching', accountB), accountB);
  const accountQueue = createPendingEventQueue({ apiBase: '/api', getStorage: () => storage });
  assert.equal(authenticated.data.totalReadings, 4);
  assert.deepEqual(authenticated.events, []);
  assert.equal(accountQueue.read('iching', accountB).length, 0);

  const guestIdentity = resolveStreakIdentity(401);
  const guest = replayBufferedActivities(streak({
    currentStreak: 2,
    totalReadings: 5,
    lastActiveDate: '2026-10-22',
  }), afterReload.readGuest('iching'), guestIdentity.ownerId);
  const guestWithCard = applyBufferedDailyCard(
    guest.data,
    afterReload.readGuestDailyCard('iching'),
  );
  assert.equal(guestIdentity.state, 'guest');
  assert.equal(guestWithCard.currentStreak, 3);
  assert.equal(guestWithCard.totalReadings, 6);
  assert.equal(guestWithCard.dailyCardId, 'major-8');
  assert.deepEqual(guest.events, []);
  assert.equal(afterReload.markProcessed('iching', null, [pending.eventId], true), true);
  assert.equal(afterReload.clear('iching', null), true);

  const reloadedAgain = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  assert.deepEqual(reloadedAgain.readGuest('iching'), []);
});

test('pending actions with known owner A stay scoped to A while identity may resolve to B', () => {
  const storage = new MemoryStorage();
  const queue = createPendingEventQueue({ apiBase: '/api', getStorage: () => storage });
  const identityBuffer = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  const scope = resolvePendingStreakActionScope(accountA);
  assert.deepEqual(scope, { kind: 'account', ownerId: accountA });
  const pendingEvent = createActivityEvent({
    ownerId: scope.ownerId,
    eventId: '00000000-0000-4000-8000-000000000035',
    activityDate: '2026-10-23',
    snapshot: streak(),
  });
  assert.equal(queue.enqueue('iching', scope.ownerId, pendingEvent), true);

  const dailyScope = resolvePendingStreakActionScope(accountA);
  assert.equal(dailyScope.ownerId, accountA);
  assert.deepEqual(identityBuffer.read('iching', accountB), []);
  assert.deepEqual(identityBuffer.read('iching'), []);
  assert.equal(queue.read('iching', accountA).length, 1);
  assert.equal(queue.read('iching', accountB).length, 0);

  const accountBState = mergeAccountSnapshot({
    activeOwnerId: accountA,
    nextOwnerId: accountB,
    currentData: streak({ currentStreak: 10, totalReadings: 90 }),
    accountLocalData: streak({ currentStreak: 2, totalReadings: 4 }),
    remoteData: streak({ currentStreak: 1, totalReadings: 3 }),
  });
  assert.equal(accountBState.totalReadings, 4);
});

test('failed owner binding cannot be adopted by a later account after reload', () => {
  const storage = new MemoryStorage();
  const firstTab = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  const pending = {
    eventId: '00000000-0000-4000-8000-000000000033',
    activityDate: '2026-10-23',
    createdAt: 33,
  };
  assert.equal(firstTab.append('iching', pending), true);
  storage.failSetFor = 'spirit_streak_identity_pending_iching';
  assert.equal(firstTab.bind('iching', accountA), false);
  storage.failSetFor = null;
  assert.equal(firstTab.bind('iching', accountA), false);
  assert.deepEqual(firstTab.read('iching', accountA), []);

  const afterReload = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  assert.deepEqual(afterReload.read('iching', accountB), []);
  assert.equal(afterReload.bind('iching', accountB), true);
  assert.deepEqual(afterReload.read('iching', accountB), []);
});

test('401 and 403 resolve pending activity as local guest data without upload', () => {
  for (const status of [401, 403]) {
    const identity = resolveStreakIdentity(status);
    const guest = replayBufferedActivities(streak({
      currentStreak: 8,
      totalReadings: 30,
      lastActiveDate: '2026-10-22',
    }), [{
      eventId: `00000000-0000-4000-8000-00000000001${status === 401 ? '2' : '3'}`,
      activityDate: '2026-10-23',
      createdAt: 4,
    }], identity.ownerId);

    assert.equal(identity.state, 'guest');
    assert.equal(guest.data.currentStreak, 9);
    assert.equal(guest.data.totalReadings, 31);
    assert.deepEqual(guest.events, []);
  }
  assert.deepEqual(resolveStreakIdentity(503), { state: 'pending', ownerId: null });
});

test('legacy guest snapshot is not used as the baseline for an authenticated replay', () => {
  const legacyGuest = streak({ currentStreak: 99, totalReadings: 900 });
  const accountLocal = streak({
    currentStreak: 2,
    longestStreak: 3,
    totalReadings: 4,
    lastActiveDate: '2026-10-22',
  });
  const action = [{
    eventId: '00000000-0000-4000-8000-000000000014',
    activityDate: '2026-10-23',
    createdAt: 5,
  }];
  const authenticated = replayBufferedActivities(accountLocal, action, accountB);

  assert.notEqual(authenticated.data.totalReadings, legacyGuest.totalReadings + 1);
  assert.equal(authenticated.data.totalReadings, 5);
  assert.equal(authenticated.events[0].snapshot.totalReadings, 4);
  assert.equal(authenticated.events[0].snapshot.currentStreak, 2);
});

test('pending Tarot daily-card action survives identity resolution without importing guest state', () => {
  const storage = new MemoryStorage();
  const buffer = createIdentityPendingActivityBuffer({ getStorage: () => storage });
  buffer.setDailyCard('tarot', '2026-10-23', 'major-1');
  const accountLocal = streak({ dailyCardDate: null, dailyCardId: null });
  const resolved = applyBufferedDailyCard(accountLocal, buffer.readDailyCard('tarot'));

  assert.equal(resolved.dailyCardDate, '2026-10-23');
  assert.equal(resolved.dailyCardId, 'major-1');
  assert.equal(accountLocal.dailyCardId, null);
  buffer.clear('tarot');
  assert.equal(buffer.readDailyCard('tarot'), null);
});

test('connectivity returning triggers the registered remote-refresh callback', () => {
  const target = new EventTarget();
  let refreshCount = 0;
  const unsubscribe = subscribeToReconnect(target, () => { refreshCount += 1; });

  target.dispatchEvent(new Event('online'));
  assert.equal(refreshCount, 1);
  unsubscribe();
  target.dispatchEvent(new Event('online'));
  assert.equal(refreshCount, 1);
});
