/**
 * useStreak – Shared streak tracking hook for TuViNow / IChingNow / TarotNow
 *
 * Tracks daily engagement streaks per app. Persists to localStorage.
 * Supports streak freeze (1 missed day doesn't break streak).
 *
 * Usage:
 *   const { streak, longestStreak, totalReadings, recordActivity } = useStreak('tarot');
 */
import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'spirit_streak_';

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function loadData(appId) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + appId);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalReadings: 0,
    lastActiveDate: null,
    streakFreezeUsed: false,  // true if freeze was used for current gap
    dailyCardDate: null,      // date when daily card was drawn (for TarotNow)
    dailyCardId: null,        // card id of the daily card
  };
}

function saveData(appId, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + appId, JSON.stringify(data));
  } catch { /* quota exceeded – ignore */ }
}

/**
 * Recalculate streak based on current date vs last active date.
 * Called on mount and on activity.
 */
function recalcStreak(data) {
  const today = getToday();
  if (!data.lastActiveDate) return data;

  const gap = daysBetween(data.lastActiveDate, today);

  if (gap <= 0) {
    // Same day or future (clock skew) – no change
    return data;
  }
  if (gap === 1) {
    // Consecutive day – streak intact, reset freeze
    return { ...data, streakFreezeUsed: false };
  }
  if (gap === 2 && !data.streakFreezeUsed) {
    // Missed exactly 1 day – use streak freeze
    return { ...data, streakFreezeUsed: true };
  }
  // Gap too large → reset streak
  return { ...data, currentStreak: 0, streakFreezeUsed: false };
}

export function useStreak(appId) {
  const [data, setData] = useState(() => {
    const raw = loadData(appId);
    return recalcStreak(raw);
  });

  const recordActivity = useCallback(() => {
    setData(prev => {
      const today = getToday();
      // Already recorded today
      if (prev.lastActiveDate === today) {
        const updated = { ...prev, totalReadings: prev.totalReadings + 1 };
        saveData(appId, updated);
        return updated;
      }

      const gap = prev.lastActiveDate ? daysBetween(prev.lastActiveDate, today) : -1;
      let newStreak = prev.currentStreak;

      if (gap <= 0) {
        // Same day (shouldn't happen due to check above) or clock skew
        newStreak = prev.currentStreak;
      } else if (gap === 1) {
        // Consecutive day
        newStreak = prev.currentStreak + 1;
      } else if (gap === 2 && !prev.streakFreezeUsed) {
        // Missed 1 day – streak freeze
        newStreak = prev.currentStreak + 1;
      } else if (!prev.lastActiveDate) {
        // First ever activity
        newStreak = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const newLongest = Math.max(prev.longestStreak, newStreak);

      const updated = {
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongest,
        totalReadings: prev.totalReadings + 1,
        lastActiveDate: today,
        streakFreezeUsed: gap === 2 ? true : false,
      };
      saveData(appId, updated);
      return updated;
    });
  }, [appId]);

  const setDailyCard = useCallback((cardId) => {
    setData(prev => {
      const today = getToday();
      const updated = { ...prev, dailyCardDate: today, dailyCardId: cardId };
      saveData(appId, updated);
      return updated;
    });
  }, [appId]);

  const getDailyCard = useCallback(() => {
    const today = getToday();
    if (data.dailyCardDate === today && data.dailyCardId != null) {
      return data.dailyCardId;
    }
    return null;
  }, [data.dailyCardDate, data.dailyCardId]);

  return {
    streak: data.currentStreak,
    longestStreak: data.longestStreak,
    totalReadings: data.totalReadings,
    lastActiveDate: data.lastActiveDate,
    streakFreezeUsed: data.streakFreezeUsed,
    recordActivity,
    setDailyCard,
    getDailyCard,
  };
}
