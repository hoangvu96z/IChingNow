const MAX_STREAK_VALUE = 1_000_000;
const MAX_TOTAL_READINGS = 2_000_000_000;

export const EMPTY_STREAK_DATA = Object.freeze({
  currentStreak: 0,
  longestStreak: 0,
  totalReadings: 0,
  lastActiveDate: null,
  streakFreezeUsed: false,
  dailyCardDate: null,
  dailyCardId: null,
});

export function getTodayDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(`${dateStr1}T00:00:00`);
  const d2 = new Date(`${dateStr2}T00:00:00`);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function safeCounter(value, maximum = MAX_STREAK_VALUE) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

function validDailyCardId(value) {
  return (typeof value === 'string' && value.length <= 128)
    || (typeof value === 'number' && Number.isFinite(value));
}

export function normalizeStreakData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...EMPTY_STREAK_DATA };
  }

  const lastActiveDate = isDateOnly(value.lastActiveDate) ? value.lastActiveDate : null;
  const dailyCardDate = isDateOnly(value.dailyCardDate) ? value.dailyCardDate : null;
  const currentStreak = lastActiveDate ? safeCounter(value.currentStreak) : 0;

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, safeCounter(value.longestStreak)),
    totalReadings: safeCounter(value.totalReadings, MAX_TOTAL_READINGS),
    lastActiveDate,
    streakFreezeUsed: Boolean(lastActiveDate && value.streakFreezeUsed === true),
    dailyCardDate,
    dailyCardId: dailyCardDate && validDailyCardId(value.dailyCardId) ? value.dailyCardId : null,
  };
}

/** Merge snapshots without letting an older server copy erase local progress. */
export function mergeStreakData(localValue, remoteValue) {
  const local = normalizeStreakData(localValue);
  const remote = normalizeStreakData(remoteValue);
  const localDate = local.lastActiveDate;
  const remoteDate = remote.lastActiveDate;
  let currentStreak = 0;
  let streakFreezeUsed = false;
  let lastActiveDate = null;

  if (localDate && remoteDate) {
    if (localDate > remoteDate) {
      ({ currentStreak, streakFreezeUsed, lastActiveDate } = local);
    } else if (remoteDate > localDate) {
      ({ currentStreak, streakFreezeUsed, lastActiveDate } = remote);
    } else {
      lastActiveDate = localDate;
      currentStreak = Math.max(local.currentStreak, remote.currentStreak);
      streakFreezeUsed = local.streakFreezeUsed || remote.streakFreezeUsed;
    }
  } else if (localDate) {
    ({ currentStreak, streakFreezeUsed, lastActiveDate } = local);
  } else if (remoteDate) {
    ({ currentStreak, streakFreezeUsed, lastActiveDate } = remote);
  }

  let dailyCardDate = null;
  let dailyCardId = null;
  if (local.dailyCardDate && remote.dailyCardDate) {
    if (local.dailyCardDate > remote.dailyCardDate) {
      ({ dailyCardDate, dailyCardId } = local);
    } else if (remote.dailyCardDate > local.dailyCardDate) {
      ({ dailyCardDate, dailyCardId } = remote);
    } else {
      dailyCardDate = local.dailyCardDate;
      // Keep the first server-selected card on a date; otherwise preserve local.
      dailyCardId = remote.dailyCardId ?? local.dailyCardId;
    }
  } else if (local.dailyCardDate) {
    ({ dailyCardDate, dailyCardId } = local);
  } else if (remote.dailyCardDate) {
    ({ dailyCardDate, dailyCardId } = remote);
  }

  return {
    currentStreak,
    longestStreak: Math.max(local.longestStreak, remote.longestStreak, currentStreak),
    totalReadings: Math.max(local.totalReadings, remote.totalReadings),
    lastActiveDate,
    streakFreezeUsed: Boolean(lastActiveDate && streakFreezeUsed),
    dailyCardDate,
    dailyCardId,
  };
}

export function recalculateStreak(value, today = getTodayDate()) {
  const data = normalizeStreakData(value);
  if (!data.lastActiveDate) return data;

  const gap = daysBetween(data.lastActiveDate, today);
  if (gap <= 0) return data;
  if (gap === 1) return { ...data, streakFreezeUsed: false };
  if (gap === 2 && !data.streakFreezeUsed) {
    // Keep the persisted flag as "consumed" state. The hook derives a visible
    // pending shield for this gap; the flag is consumed with today's activity.
    return data;
  }
  return { ...data, currentStreak: 0, streakFreezeUsed: false };
}

export function applyStreakActivity(value, today = getTodayDate()) {
  const previous = normalizeStreakData(value);
  if (previous.lastActiveDate === today) {
    return { ...previous, totalReadings: safeCounter(previous.totalReadings + 1, MAX_TOTAL_READINGS) };
  }

  const gap = previous.lastActiveDate ? daysBetween(previous.lastActiveDate, today) : -1;
  let currentStreak = previous.currentStreak;

  if (!previous.lastActiveDate) {
    currentStreak = 1;
  } else if (gap <= 0) {
    currentStreak = previous.currentStreak;
  } else if (gap === 1) {
    currentStreak = previous.currentStreak + 1;
  } else if (gap === 2 && !previous.streakFreezeUsed && previous.currentStreak > 0) {
    currentStreak = previous.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  currentStreak = safeCounter(currentStreak);
  return {
    ...previous,
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    totalReadings: safeCounter(previous.totalReadings + 1, MAX_TOTAL_READINGS),
    lastActiveDate: today,
    streakFreezeUsed: gap === 2 && previous.currentStreak > 0 && !previous.streakFreezeUsed,
  };
}

/** True while the single missed-day shield is protecting a streak, before use. */
export function isStreakFreezePending(value, today = getTodayDate()) {
  const data = normalizeStreakData(value);
  return Boolean(
    data.currentStreak > 0
      && data.lastActiveDate
      && !data.streakFreezeUsed
      && daysBetween(data.lastActiveDate, today) === 2,
  );
}

export function hasStreakData(value) {
  const data = normalizeStreakData(value);
  return data.totalReadings > 0
    || data.currentStreak > 0
    || data.longestStreak > 0
    || Boolean(data.lastActiveDate)
    || Boolean(data.dailyCardDate && data.dailyCardId != null);
}

export function sameStreakData(first, second) {
  const a = normalizeStreakData(first);
  const b = normalizeStreakData(second);
  return Object.keys(a).every((key) => a[key] === b[key]);
}
