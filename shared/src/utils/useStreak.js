/**
 * useStreak – Shared streak tracking for TuViNow / IChingNow / TarotNow.
 *
 * Streaks stay local-first. Authenticated snapshots are additionally synced
 * through vInfiSSO; guest data is never uploaded to an account. Account-scoped
 * local keys prevent progress from one SSO user being sent to another.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSsoApiBase, ssoFetch } from './ssoConfig.mjs';
import {
  EMPTY_STREAK_DATA,
  applyStreakActivity,
  getTodayDate,
  hasStreakData,
  isStreakFreezePending,
  mergeStreakData,
  normalizeStreakData,
  recalculateStreak,
  sameStreakData,
} from './streakState.mjs';
import {
  applyBufferedDailyCard,
  createActivityEvent,
  createIdentityPendingActivityBuffer,
  createPendingEventQueue,
  dispatchLocalStreakUpdate,
  mergeAccountSnapshot,
  replayBufferedActivities,
  resolvePendingStreakActionScope,
  resolveStreakIdentity,
  subscribeLocalStreakUpdates,
  subscribeToReconnect,
} from './streakSync.mjs';

const STORAGE_PREFIX = 'spirit_streak_';
const SSO_BASE = getSsoApiBase({
  DEV: import.meta.env.DEV,
  VITE_SSO_URL: import.meta.env.VITE_SSO_URL,
});
const pendingActivityQueue = createPendingEventQueue({ apiBase: SSO_BASE });
const identityPendingActivities = createIdentityPendingActivityBuffer();

function loadInitialData(appId) {
  const replayed = replayBufferedActivities(
    loadData(appId),
    identityPendingActivities.read(appId),
  ).data;
  return applyBufferedDailyCard(recalculateStreak(replayed), identityPendingActivities.readDailyCard(appId));
}

function getStorageKey(appId, ownerId = null) {
  return ownerId
    ? `${STORAGE_PREFIX}${appId}_user_${encodeURIComponent(ownerId)}`
    : `${STORAGE_PREFIX}${appId}`;
}

function loadData(appId, ownerId = null) {
  try {
    const raw = localStorage.getItem(getStorageKey(appId, ownerId));
    return raw ? normalizeStreakData(JSON.parse(raw)) : { ...EMPTY_STREAK_DATA };
  } catch {
    return { ...EMPTY_STREAK_DATA };
  }
}

function saveData(appId, data, ownerId = null, broadcast = true) {
  try {
    localStorage.setItem(getStorageKey(appId, ownerId), JSON.stringify(data));
  } catch {
    // Keep the in-memory state usable when storage is unavailable or full.
  }

  if (broadcast && typeof window !== 'undefined') {
    dispatchLocalStreakUpdate(window, { appId, ownerId, data });
  }
}

async function readRemoteStreak(appId) {
  const response = await ssoFetch(`${SSO_BASE}/streaks/${encodeURIComponent(appId)}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const error = new Error(`Streak sync returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function writeRemoteStreak(appId, ownerId, data, signal) {
  return ssoFetch(`${SSO_BASE}/streaks/${encodeURIComponent(appId)}`, {
    method: 'PUT',
    credentials: 'include',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId, ...data }),
  });
}

function createEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function useStreak(appId) {
  const [data, setData] = useState(() => loadInitialData(appId));
  const dataRef = useRef(data);
  const ownerIdRef = useRef(null);
  const identityResolutionRef = useRef('pending');
  const confirmedTotalReadingsRef = useRef(0);
  const requestIdRef = useRef(0);

  const commitData = useCallback((nextData, nextOwnerId = ownerIdRef.current, broadcast = true) => {
    const normalized = normalizeStreakData(nextData);
    dataRef.current = normalized;
    setData(normalized);
    saveData(appId, normalized, nextOwnerId, broadcast);
  }, [appId]);

  const refreshRemote = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const response = await readRemoteStreak(appId);
      if (requestId !== requestIdRef.current) return;
      const identity = resolveStreakIdentity(200, response?.ownerId);
      if (identity.state !== 'authenticated') return;

      const nextOwnerId = identity.ownerId;
      const ownerChanged = ownerIdRef.current !== nextOwnerId;
      const resolvingPendingIdentity = identityResolutionRef.current === 'pending';
      if (resolvingPendingIdentity && !identityPendingActivities.bind(appId, nextOwnerId)) {
        // Do not replay unowned actions unless their resolved owner is durable.
        return;
      }
      const accountLocal = loadData(appId, nextOwnerId);
      const current = ownerChanged || resolvingPendingIdentity ? accountLocal : dataRef.current;
      const remoteTotal = Number(response.streak?.totalReadings) || 0;
      confirmedTotalReadingsRef.current = ownerChanged
        ? remoteTotal
        : Math.max(confirmedTotalReadingsRef.current, remoteTotal);
      let merged = recalculateStreak(mergeAccountSnapshot({
        activeOwnerId: ownerIdRef.current,
        nextOwnerId,
        currentData: resolvingPendingIdentity ? accountLocal : dataRef.current,
        accountLocalData: accountLocal,
        remoteData: response.streak,
      }));

      const bufferedActivities = identityPendingActivities.read(appId, nextOwnerId);
      const existingQueuedIds = new Set(pendingActivityQueue.read(appId, nextOwnerId)
        .map((event) => event.eventId));
      const activitiesToReplay = bufferedActivities.filter((activity) =>
        !existingQueuedIds.has(activity.eventId));
      const replayed = replayBufferedActivities(merged, activitiesToReplay, nextOwnerId);
      merged = applyBufferedDailyCard(
        replayed.data,
        identityPendingActivities.readDailyCard(appId, nextOwnerId),
      );
      replayed.events.forEach((event) => pendingActivityQueue.enqueue(appId, nextOwnerId, event));

      ownerIdRef.current = nextOwnerId;
      identityResolutionRef.current = 'authenticated';
      if (ownerChanged) {
        commitData(merged, nextOwnerId);
      } else if (resolvingPendingIdentity || bufferedActivities.length > 0) {
        commitData(merged, nextOwnerId);
      } else if (!sameStreakData(current, merged)) {
        commitData(merged, nextOwnerId);
      }
      identityPendingActivities.markProcessed(
        appId,
        nextOwnerId,
        bufferedActivities.map((activity) => activity.eventId),
        true,
      );
      identityPendingActivities.clear(appId, nextOwnerId);

      await pendingActivityQueue.flush(appId, nextOwnerId, (payload) => {
        if (ownerIdRef.current !== nextOwnerId) return;
        const eventMerge = mergeStreakData(dataRef.current, payload.streak);
        confirmedTotalReadingsRef.current = Math.max(
          confirmedTotalReadingsRef.current,
          Number(payload.streak.totalReadings) || 0,
        );
        if (!sameStreakData(dataRef.current, eventMerge)) {
          commitData(eventMerge, nextOwnerId);
        }
      });

      if (ownerIdRef.current !== nextOwnerId) return;
      const reconciled = dataRef.current;
      if (!hasStreakData(reconciled)) return;
      const pendingCount = pendingActivityQueue.read(appId, nextOwnerId).length;
      const safeSnapshot = {
        ...reconciled,
        totalReadings: Math.max(
          confirmedTotalReadingsRef.current,
          reconciled.totalReadings - pendingCount,
        ),
      };
      const saved = await writeRemoteStreak(appId, nextOwnerId, safeSnapshot);
      if (!saved.ok || ownerIdRef.current !== nextOwnerId) return;
      const savedPayload = await saved.json();
      if (savedPayload?.ownerId !== nextOwnerId) return;
      confirmedTotalReadingsRef.current = Math.max(
        confirmedTotalReadingsRef.current,
        Number(savedPayload.streak?.totalReadings) || 0,
      );
      const finalMerge = mergeStreakData(dataRef.current, savedPayload.streak);
      if (!sameStreakData(dataRef.current, finalMerge)) {
        commitData(finalMerge, nextOwnerId);
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (error?.status === 401 || error?.status === 403) {
        const identity = resolveStreakIdentity(error.status);
        const resolvingPendingIdentity = identityResolutionRef.current === 'pending';
        const bufferedActivities = identityPendingActivities.readGuest(appId);
        ownerIdRef.current = null;
        identityResolutionRef.current = identity.state;
        confirmedTotalReadingsRef.current = 0;
        if (resolvingPendingIdentity || bufferedActivities.length > 0) {
          const replayed = replayBufferedActivities(loadData(appId), bufferedActivities);
          commitData(applyBufferedDailyCard(
            replayed.data,
            identityPendingActivities.readGuestDailyCard(appId),
          ), null);
        } else {
          commitData(recalculateStreak(loadData(appId)), null);
        }
        identityPendingActivities.markProcessed(
          appId,
          null,
          bufferedActivities.map((activity) => activity.eventId),
          true,
        );
        identityPendingActivities.clear(appId, null);
      }
      // Offline/API failures keep local progress and are retried on focus.
    }
  }, [appId, commitData]);

  useEffect(() => {
    refreshRemote();
    const beginIdentityResolution = () => {
      identityResolutionRef.current = 'pending';
      refreshRemote();
    };
    const handleFocus = () => beginIdentityResolution();
    const handleAuthStorage = (event) => {
      if (event.key === 'vInfiSSO-state' || event.key === 'sso_logged_out') {
        beginIdentityResolution();
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleAuthStorage);
    return () => {
      ++requestIdRef.current;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleAuthStorage);
    };
  }, [appId, refreshRemote]);

  useEffect(() => {
    return subscribeLocalStreakUpdates(window, {
      appId,
      getOwnerId: () => ownerIdRef.current,
      getCurrentData: () => dataRef.current,
      onMerged: (merged) => {
        if (sameStreakData(dataRef.current, merged)) return;
        dataRef.current = merged;
        setData(merged);
        saveData(appId, merged, ownerIdRef.current, false);
      },
    });
  }, [appId]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== getStorageKey(appId, ownerIdRef.current) || !event.newValue) return;
      try {
        const merged = mergeStreakData(dataRef.current, JSON.parse(event.newValue));
        if (sameStreakData(dataRef.current, merged)) return;
        dataRef.current = merged;
        setData(merged);
      } catch {
        // Ignore invalid external storage values; the current state is intact.
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [appId]);

  useEffect(() => {
    const handleOnline = () => {
      identityResolutionRef.current = 'pending';
      refreshRemote();
    };
    return subscribeToReconnect(window, handleOnline);
  }, [appId, refreshRemote]);

  const recordActivity = useCallback(() => {
    const previous = normalizeStreakData(dataRef.current);
    const activityDate = getTodayDate();
    const accountId = ownerIdRef.current;
    if (identityResolutionRef.current === 'pending') {
      const scope = resolvePendingStreakActionScope(accountId);
      if (scope.kind === 'unresolved') {
        identityPendingActivities.append(appId, {
          eventId: createEventId(),
          activityDate,
          createdAt: Date.now(),
        });
      } else {
        const event = createActivityEvent({
          ownerId: scope.ownerId,
          eventId: createEventId(),
          activityDate,
          snapshot: previous,
        });
        if (event) pendingActivityQueue.enqueue(appId, scope.ownerId, event);
      }
      const optimistic = applyStreakActivity(
        recalculateStreak(previous, activityDate),
        activityDate,
      );
      if (scope.kind === 'account') commitData(optimistic, scope.ownerId);
      else {
        dataRef.current = optimistic;
        setData(optimistic);
      }
      return;
    }
    const event = createActivityEvent({
      ownerId: accountId,
      eventId: createEventId(),
      activityDate,
      snapshot: previous,
    });
    if (event) pendingActivityQueue.enqueue(appId, accountId, event);
    commitData(applyStreakActivity(previous, activityDate), accountId);
    if (event) {
      pendingActivityQueue.flush(appId, accountId, (payload) => {
        if (ownerIdRef.current !== accountId || payload?.ownerId !== accountId) return;
        confirmedTotalReadingsRef.current = Math.max(
          confirmedTotalReadingsRef.current,
          Number(payload.streak?.totalReadings) || 0,
        );
        const merged = mergeStreakData(dataRef.current, payload.streak);
        if (!sameStreakData(dataRef.current, merged)) commitData(merged, accountId);
      });
    }
  }, [appId, commitData]);

  const setDailyCard = useCallback((cardId) => {
    if (!((typeof cardId === 'string' && cardId.length <= 128)
      || (typeof cardId === 'number' && Number.isFinite(cardId)))) return;
    const today = getTodayDate();
    const nextData = {
      ...dataRef.current,
      dailyCardDate: today,
      dailyCardId: cardId,
    };
    if (identityResolutionRef.current === 'pending') {
      const scope = resolvePendingStreakActionScope(ownerIdRef.current);
      if (scope.kind === 'account') commitData(nextData, scope.ownerId);
      else {
        identityPendingActivities.setDailyCard(appId, today, cardId);
        dataRef.current = nextData;
        setData(nextData);
      }
      return;
    }
    const accountId = ownerIdRef.current;
    commitData(nextData, accountId);
    if (accountId) {
      const pendingCount = pendingActivityQueue.read(appId, accountId).length;
      const safeSnapshot = {
        ...nextData,
        totalReadings: Math.max(
          confirmedTotalReadingsRef.current,
          nextData.totalReadings - pendingCount,
        ),
      };
      writeRemoteStreak(appId, accountId, safeSnapshot)
        .then(async (response) => {
          if (!response.ok || ownerIdRef.current !== accountId) return;
          const payload = await response.json();
          if (payload?.ownerId !== accountId) return;
          confirmedTotalReadingsRef.current = Math.max(
            confirmedTotalReadingsRef.current,
            Number(payload.streak?.totalReadings) || 0,
          );
          const merged = mergeStreakData(dataRef.current, payload.streak);
          if (!sameStreakData(dataRef.current, merged)) commitData(merged, accountId);
        })
        .catch(() => {});
    }
  }, [appId, commitData]);

  const getDailyCard = useCallback(() => {
    const today = getTodayDate();
    if (dataRef.current.dailyCardDate === today && dataRef.current.dailyCardId != null) {
      return dataRef.current.dailyCardId;
    }
    return null;
  }, [data.dailyCardDate, data.dailyCardId]);

  return {
    streak: data.currentStreak,
    longestStreak: data.longestStreak,
    totalReadings: data.totalReadings,
    lastActiveDate: data.lastActiveDate,
    // Report the shield while it is protecting a pending gap; persisted state
    // remains false until activity consumes it.
    streakFreezeUsed: data.streakFreezeUsed || isStreakFreezePending(data),
    recordActivity,
    setDailyCard,
    getDailyCard,
  };
}
