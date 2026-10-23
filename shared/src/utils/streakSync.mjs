import {
  applyStreakActivity,
  isDateOnly,
  mergeStreakData,
  recalculateStreak,
} from './streakState.mjs';

export const LOCAL_UPDATE_EVENT = 'spirit-streak:update';
const EVENTS_PREFIX = 'spirit_streak_events_';
const IDENTITY_PENDING_PREFIX = 'spirit_streak_identity_pending_';
const IDENTITY_PENDING_DAILY_PREFIX = 'spirit_streak_identity_daily_';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function eventPrefix(appId, ownerId) {
  return `${EVENTS_PREFIX}${appId}_user_${encodeURIComponent(ownerId)}_`;
}

function validPendingEvent(event, ownerId) {
  return event
    && typeof event.eventId === 'string'
    && UUID_PATTERN.test(event.eventId)
    && isDateOnly(event.activityDate)
    && Number.isFinite(event.createdAt)
    && event.ownerId === ownerId
    && event.snapshot
    && typeof event.snapshot === 'object';
}

/** Guests have no owner, so their local activity cannot become an account event. */
export function createActivityEvent({ ownerId, eventId, activityDate, snapshot, createdAt = Date.now() }) {
  if (typeof ownerId !== 'string' || !ownerId) return null;
  return { ownerId, eventId, activityDate, snapshot, createdAt };
}

/** Choose account-local state after login; an old account's in-memory state is never reused. */
export function mergeAccountSnapshot({
  activeOwnerId,
  nextOwnerId,
  currentData,
  accountLocalData,
  remoteData,
}) {
  const base = activeOwnerId === nextOwnerId ? currentData : accountLocalData;
  return mergeStreakData(base, remoteData);
}

export function resolveStreakIdentity(status, ownerId) {
  if ((status === 401 || status === 403)) return { state: 'guest', ownerId: null };
  if (status >= 200 && status < 300 && typeof ownerId === 'string' && ownerId) {
    return { state: 'authenticated', ownerId };
  }
  return { state: 'pending', ownerId: null };
}

/** When refresh is pending, keep actions under a known owner or leave them unresolved. */
export function resolvePendingStreakActionScope(ownerId) {
  return typeof ownerId === 'string' && ownerId
    ? { kind: 'account', ownerId }
    : { kind: 'unresolved', ownerId: null };
}

function isBufferedActivity(value) {
  return value
    && typeof value.eventId === 'string'
    && UUID_PATTERN.test(value.eventId)
    && isDateOnly(value.activityDate)
    && Number.isFinite(value.createdAt)
    && (value.ownerId == null || (typeof value.ownerId === 'string' && value.ownerId.length > 0));
}

/** Store only newly recorded dates while the first session check is unresolved. */
export function createIdentityPendingActivityBuffer({
  getStorage = () => globalThis.localStorage,
} = {}) {
  const memory = new Map();
  const pendingDailyCards = new Map();
  const freshActivityIds = new Map();
  const freshDailyCardKeys = new Set();
  const quarantinedApps = new Set();
  const keyFor = (appId) => `${IDENTITY_PENDING_PREFIX}${appId}`;
  const dailyKeyFor = (appId) => `${IDENTITY_PENDING_DAILY_PREFIX}${appId}`;

  function freshIdsFor(appId) {
    const key = keyFor(appId);
    let ids = freshActivityIds.get(key);
    if (!ids) {
      ids = new Set();
      freshActivityIds.set(key, ids);
    }
    return ids;
  }

  function quarantineFresh(appId) {
    freshIdsFor(appId).clear();
    freshDailyCardKeys.delete(dailyKeyFor(appId));
    quarantinedApps.add(appId);
  }

  function readAll(appId) {
    const key = keyFor(appId);
    let stored = [];
    try {
      const raw = getStorage().getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) stored = parsed.filter(isBufferedActivity);
      }
    } catch {
      // Continue with in-memory activity if browser storage is unavailable.
    }
    const cached = memory.get(key) || [];
    return [...new Map([...stored, ...cached]
      .filter(isBufferedActivity)
      .map((activity) => [activity.eventId, activity])).values()]
      .sort((first, second) => first.activityDate.localeCompare(second.activityDate)
        || first.createdAt - second.createdAt);
  }

  function read(appId, ownerId = null) {
    if (quarantinedApps.has(appId)) return [];
    const freshIds = freshIdsFor(appId);
    return readAll(appId).filter((activity) => !activity.processed
      && ((ownerId != null && activity.ownerId === ownerId)
        || (activity.ownerId == null && freshIds.has(activity.eventId))));
  }

  function readGuest(appId) {
    if (quarantinedApps.has(appId)) return [];
    return readAll(appId).filter((activity) => !activity.processed && activity.ownerId == null);
  }

  function persist(appId, activities) {
    const key = keyFor(appId);
    memory.set(key, activities);
    try {
      const storage = getStorage();
      storage.setItem(key, JSON.stringify(activities));
      const saved = JSON.parse(storage.getItem(key) || '[]');
      const byId = new Map(saved.filter(isBufferedActivity)
        .map((activity) => [activity.eventId, activity]));
      return activities.every((activity) => {
        const savedActivity = byId.get(activity.eventId);
        return savedActivity?.ownerId === activity.ownerId
          && Boolean(savedActivity?.processed) === Boolean(activity.processed);
      });
    } catch {
      return false;
    }
  }

  function append(appId, activity) {
    if (!isBufferedActivity(activity)) return false;
    const activities = new Map(readAll(appId).map((item) => [item.eventId, item]));
    activities.set(activity.eventId, { ...activity, ownerId: null });
    const persisted = persist(appId, [...activities.values()]);
    freshIdsFor(appId).add(activity.eventId);
    return persisted;
  }

  function bind(appId, ownerId) {
    if (typeof ownerId !== 'string' || !ownerId) return false;
    if (quarantinedApps.has(appId)) return false;
    const allActivities = readAll(appId);
    const pendingCard = readDailyCard(appId);
    const freshIds = freshIdsFor(appId);
    const bindableIds = new Set(allActivities
      .filter((activity) => activity.ownerId == null && freshIds.has(activity.eventId))
      .map((activity) => activity.eventId));
    const bindDailyCard = Boolean(pendingCard && pendingCard.ownerId == null
      && freshDailyCardKeys.has(dailyKeyFor(appId)));
    const needsBinding = bindableIds.size > 0 || bindDailyCard;
    if (!needsBinding) return true;

    const activities = allActivities.map((activity) => bindableIds.has(activity.eventId)
      ? { ...activity, ownerId }
      : activity);
    if (!persist(appId, activities)) {
      quarantineFresh(appId);
      return false;
    }
    bindableIds.forEach((eventId) => freshIds.delete(eventId));

    if (bindDailyCard) {
      const boundCard = { ...pendingCard, ownerId };
      pendingDailyCards.set(dailyKeyFor(appId), boundCard);
      try {
        const storage = getStorage();
        const dailyKey = dailyKeyFor(appId);
        storage.setItem(dailyKey, JSON.stringify(boundCard));
        const saved = JSON.parse(storage.getItem(dailyKey) || 'null');
        if (saved?.ownerId !== ownerId) {
          pendingDailyCards.set(dailyKey, boundCard);
          quarantineFresh(appId);
          return false;
        }
        pendingDailyCards.set(dailyKey, boundCard);
        freshDailyCardKeys.delete(dailyKey);
      } catch {
        quarantineFresh(appId);
        return false;
      }
    }
    return true;
  }

  function clear(appId, ownerId = null) {
    const key = keyFor(appId);
    const dailyKey = dailyKeyFor(appId);
    const allActivities = readAll(appId);
    const removedActivities = allActivities.filter((activity) => activity.ownerId === ownerId);
    const remaining = allActivities.filter((activity) => activity.ownerId !== ownerId);
    if (remaining.length > 0) {
      if (!persist(appId, remaining)) return false;
    } else {
      memory.set(key, []);
      try {
        const storage = getStorage();
        storage.removeItem(key);
        if (storage.getItem(key) !== null) return false;
      } catch {
        return false;
      }
    }
    const freshIds = freshIdsFor(appId);
    removedActivities.forEach((activity) => freshIds.delete(activity.eventId));

    const dailyCard = ownerId == null
      ? readGuestDailyCard(appId)
      : readDailyCard(appId, ownerId);
    if (dailyCard) {
      pendingDailyCards.delete(dailyKey);
      try {
        const storage = getStorage();
        storage.removeItem(dailyKey);
        if (storage.getItem(dailyKey) !== null) return false;
      } catch {
        return false;
      }
    }
    return true;
  }

  function markProcessed(appId, ownerId, eventIds = [], includeDailyCard = false) {
    const ids = new Set(eventIds);
    const allActivities = readAll(appId);
    const hasUnprocessed = allActivities.some((activity) =>
      activity.ownerId === ownerId && ids.has(activity.eventId) && !activity.processed);
    const activities = allActivities.map((activity) =>
      activity.ownerId === ownerId && ids.has(activity.eventId)
        ? { ...activity, processed: true }
        : activity);
    if (hasUnprocessed && !persist(appId, activities)) return false;
    if (ownerId == null) ids.forEach((eventId) => freshIdsFor(appId).delete(eventId));

    if (includeDailyCard) {
      const dailyKey = dailyKeyFor(appId);
      const dailyCard = ownerId == null
        ? readGuestDailyCard(appId)
        : readDailyCard(appId, ownerId);
      if (dailyCard && !dailyCard.processed) {
        const processedCard = { ...dailyCard, processed: true };
        pendingDailyCards.set(dailyKey, processedCard);
        try {
          const storage = getStorage();
          storage.setItem(dailyKey, JSON.stringify(processedCard));
          const saved = JSON.parse(storage.getItem(dailyKey) || 'null');
          if (!saved?.processed || saved.ownerId !== ownerId) return false;
        } catch {
          return false;
        }
      }
    }
    return true;
  }

  function setDailyCard(appId, dailyCardDate, dailyCardId) {
    if (!isDateOnly(dailyCardDate)
      || !((typeof dailyCardId === 'string' && dailyCardId.length <= 128)
        || (typeof dailyCardId === 'number' && Number.isFinite(dailyCardId)))) return false;
    const dailyKey = dailyKeyFor(appId);
    const value = { dailyCardDate, dailyCardId, ownerId: null };
    pendingDailyCards.set(dailyKey, value);
    freshDailyCardKeys.add(dailyKey);
    try {
      const storage = getStorage();
      storage.setItem(dailyKey, JSON.stringify(value));
      const saved = JSON.parse(storage.getItem(dailyKey) || 'null');
      return saved?.dailyCardDate === dailyCardDate && saved?.dailyCardId === dailyCardId;
    } catch {
      return false;
    }
  }

  function readDailyCard(appId, ownerId = null) {
    return readDailyCardValue(appId, ownerId, false);
  }

  function readGuestDailyCard(appId) {
    return readDailyCardValue(appId, null, true);
  }

  function readDailyCardValue(appId, ownerId, allowPersistedGuest) {
    if (quarantinedApps.has(appId)) return null;
    const dailyKey = dailyKeyFor(appId);
    let value = pendingDailyCards.get(dailyKey);
    try {
      const raw = getStorage().getItem(dailyKey);
      if (raw) {
        const stored = JSON.parse(raw);
        if (!value || (value.ownerId == null && !value.processed)) value = stored;
      }
    } catch {
      // The memory copy remains available when browser storage is unavailable.
    }
    const valid = isDateOnly(value?.dailyCardDate)
      && ((typeof value.dailyCardId === 'string' && value.dailyCardId.length <= 128)
        || (typeof value.dailyCardId === 'number' && Number.isFinite(value.dailyCardId)))
      && (value.ownerId == null || typeof value.ownerId === 'string');
    return valid && !value.processed
      && ((ownerId != null && value.ownerId === ownerId)
        || (value.ownerId == null && (allowPersistedGuest || freshDailyCardKeys.has(dailyKey))))
      ? value
      : null;
  }

  return {
    append,
    bind,
    clear,
    markProcessed,
    read,
    readDailyCard,
    readGuest,
    readGuestDailyCard,
    setDailyCard,
  };
}

/** Replay only the buffered actions on the selected identity's own baseline. */
export function replayBufferedActivities(value, activities, ownerId = null) {
  let data = value;
  const events = [];
  const ordered = [...activities].filter(isBufferedActivity)
    .sort((first, second) => first.activityDate.localeCompare(second.activityDate)
      || first.createdAt - second.createdAt);

  for (const activity of ordered) {
    const before = recalculateStreak(data, activity.activityDate);
    const event = createActivityEvent({
      ownerId,
      eventId: activity.eventId,
      activityDate: activity.activityDate,
      snapshot: before,
      createdAt: activity.createdAt,
    });
    if (event) events.push(event);
    data = applyStreakActivity(before, activity.activityDate);
  }
  return { data, events };
}

export function applyBufferedDailyCard(value, pendingCard) {
  if (!pendingCard || !isDateOnly(pendingCard.dailyCardDate)) return value;
  const validId = (typeof pendingCard.dailyCardId === 'string'
      && pendingCard.dailyCardId.length <= 128)
    || (typeof pendingCard.dailyCardId === 'number' && Number.isFinite(pendingCard.dailyCardId));
  if (!validId) return value;
  return {
    ...value,
    dailyCardDate: pendingCard.dailyCardDate,
    dailyCardId: pendingCard.dailyCardId,
  };
}

export function dispatchLocalStreakUpdate(target, detail) {
  if (!target?.dispatchEvent) return;
  const event = new Event(LOCAL_UPDATE_EVENT);
  Object.defineProperty(event, 'detail', { value: detail });
  target.dispatchEvent(event);
}

export function subscribeToReconnect(target, callback) {
  target.addEventListener('online', callback);
  return () => target.removeEventListener('online', callback);
}

/** Subscribe one hook instance to same-tab updates from other instances. */
export function subscribeLocalStreakUpdates(target, {
  appId,
  getOwnerId,
  getCurrentData,
  onMerged,
}) {
  const handleUpdate = (event) => {
    const detail = event.detail;
    if (detail?.appId !== appId || detail.ownerId !== getOwnerId()) return;
    const merged = mergeStreakData(getCurrentData(), detail.data);
    onMerged(merged);
  };
  target.addEventListener(LOCAL_UPDATE_EVENT, handleUpdate);
  return () => target.removeEventListener(LOCAL_UPDATE_EVENT, handleUpdate);
}

/** Durable per-event queue. Retries retain the original UUID for server idempotency. */
export function createPendingEventQueue({
  apiBase,
  getStorage = () => globalThis.localStorage,
  fetchImpl = (...args) => globalThis.fetch(...args),
}) {
  const pendingFlushes = new Map();
  const pendingEventCache = new Map();

  function read(appId, ownerId) {
    const prefix = eventPrefix(appId, ownerId);
    const stored = [];
    try {
      const storage = getStorage();
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith(prefix)) continue;
        const raw = storage.getItem(key);
        if (!raw) continue;
        try {
          stored.push(JSON.parse(raw));
        } catch {
          // Ignore a malformed queue item without blocking later events.
        }
      }
    } catch {
      // The in-memory queue remains available when browser storage is unavailable.
    }

    const cached = pendingEventCache.get(prefix) || new Map();
    return [...new Map([...stored, ...cached.values()]
      .filter((event) => validPendingEvent(event, ownerId))
      .map((event) => [event.eventId, event])).values()]
      .sort((first, second) => first.activityDate.localeCompare(second.activityDate)
        || first.createdAt - second.createdAt);
  }

  function enqueue(appId, ownerId, event) {
    if (!validPendingEvent(event, ownerId)) return false;
    const prefix = eventPrefix(appId, ownerId);
    const events = pendingEventCache.get(prefix) || new Map();
    events.set(event.eventId, event);
    pendingEventCache.set(prefix, events);
    try {
      getStorage().setItem(`${prefix}${event.eventId}`, JSON.stringify(event));
    } catch {
      // The in-memory queue can retry while the page stays open.
    }
    return true;
  }

  function remove(appId, ownerId, eventId) {
    const prefix = eventPrefix(appId, ownerId);
    const events = pendingEventCache.get(prefix);
    events?.delete(eventId);
    if (events?.size === 0) pendingEventCache.delete(prefix);
    try {
      getStorage().removeItem(`${prefix}${eventId}`);
    } catch {
      // A stale stored copy is harmless: the server keeps the event UUID unique.
    }
  }

  function flush(appId, ownerId, onRemote = () => {}) {
    const flushKey = `${appId}:${ownerId}`;
    const existing = pendingFlushes.get(flushKey);
    if (existing) {
      existing.requested = true;
      existing.callbacks.add(onRemote);
      return existing.promise;
    }

    const state = { requested: true, callbacks: new Set([onRemote]), promise: null };
    state.promise = (async () => {
      // Drain newly enqueued events after a successful batch. Any transport
      // failure exits immediately; focus/online will retry without a hot loop.
      while (state.requested) {
        state.requested = false;
        for (const event of read(appId, ownerId)) {
          let response;
          try {
            response = await fetchImpl(`${apiBase}/streaks/${encodeURIComponent(appId)}/activity`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event),
            });
          } catch {
            return;
          }
          if (!response.ok) return;

          let payload;
          try {
            payload = await response.json();
          } catch {
            return;
          }
          if (payload?.ownerId !== ownerId || !payload.streak) return;

          for (const callback of state.callbacks) callback(payload);
          remove(appId, ownerId, event.eventId);
        }
      }
    })().finally(() => pendingFlushes.delete(flushKey));
    pendingFlushes.set(flushKey, state);
    return state.promise;
  }

  return { enqueue, read, flush };
}
