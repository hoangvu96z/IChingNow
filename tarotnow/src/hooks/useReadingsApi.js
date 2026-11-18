import { useCallback, useEffect } from 'react';
import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { decryptData } from '../utils/cryptoUtils.js';
import {
  createReadingsApi,
  createReadingsApiRequest,
} from '../../../shared/src/utils/readingsApi.mjs';
import { useReadingsHistory } from '../../../shared/src/hooks/useReadingsHistory.js';
import {
  TAROT_LOCAL_REFLECTIONS_KEY,
  TAROT_GUEST_READINGS_KEY,
  loadLocalTarotReflections,
  saveLocalTarotReflection,
  loadGuestTarotReadings,
  saveGuestTarotReadings,
  mapLoadedTarotReading,
  buildTarotSaveReading,
} from '../utils/readingMapping.js';

export {
  TAROT_LOCAL_REFLECTIONS_KEY,
  TAROT_GUEST_READINGS_KEY,
  loadLocalTarotReflections,
  saveLocalTarotReflection,
  loadGuestTarotReadings,
  saveGuestTarotReadings,
  mapLoadedTarotReading,
  buildTarotSaveReading,
};

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'tarot';
const readingsApi = createReadingsApi({
  app: APP,
  request: createReadingsApiRequest(SSO_BASE),
});

export function useReadingsApi(isAuthenticated, userId, { inFlightSaveRef } = {}) {
  const base = useReadingsHistory(isAuthenticated, userId, {
    readingsApi,
    decryptData,
    encryptedQuestionFallback: '(Trải bài Tarot)',
    emptyQuestionFallback: '',
    mapLoadedReading: mapLoadedTarotReading,
    buildSaveReading: (entry) => buildTarotSaveReading(entry, APP),
  });

  const {
    setHistory,
    saveReading: baseSaveReading,
    deleteMultipleReadings: baseDeleteMultipleReadings,
    clearHistory: baseClearHistory,
    updateReadingData,
  } = base;

  // On mount or when isAuthenticated changes, if unauthenticated, load guest readings
  useEffect(() => {
    if (!isAuthenticated) {
      const guestItems = loadGuestTarotReadings();
      setHistory(guestItems);
    }
  }, [isAuthenticated, setHistory]);

  // Guest-aware saveReading
  const saveReading = useCallback(async (...args) => {
    const [newEntry] = args;
    if (!newEntry) return null;

    if (isAuthenticated) {
      return baseSaveReading(...args);
    }

    // Guest fallback
    const guestItem = {
      ...newEntry,
      id: newEntry.id || Date.now().toString(),
      createdAt: newEntry.createdAt || new Date().toISOString(),
      timestamp: newEntry.timestamp || new Date().toISOString(),
      data: newEntry,
    };
    setHistory((prev) => {
      const next = [guestItem, ...prev.filter((p) => p.id !== guestItem.id)];
      saveGuestTarotReadings(next);
      return next;
    });
    return guestItem;
  }, [isAuthenticated, baseSaveReading, setHistory]);

  const deleteMultipleReadings = useCallback(async (itemsToDelete) => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;
    if (isAuthenticated) {
      return baseDeleteMultipleReadings(itemsToDelete);
    }
    const ids = new Set(itemsToDelete.map((i) => i.id));
    setHistory((prev) => {
      const next = prev.filter((i) => !ids.has(i.id));
      saveGuestTarotReadings(next);
      return next;
    });
  }, [isAuthenticated, baseDeleteMultipleReadings, setHistory]);

  const clearHistory = useCallback(async () => {
    if (isAuthenticated) {
      await baseClearHistory();
    } else {
      saveGuestTarotReadings([]);
      setHistory([]);
    }
  }, [isAuthenticated, baseClearHistory, setHistory]);

  const updateReadingReflection = useCallback(async (readingId, { reflectionNote, verificationStatus, reflectionUpdatedAt }) => {
    const note = typeof reflectionNote === 'string' ? reflectionNote.trim() : '';
    const status = typeof verificationStatus === 'string' ? verificationStatus.trim() : 'pending';
    const updatedAt = reflectionUpdatedAt || new Date().toISOString();
    const partialData = {
      reflectionNote: note,
      verificationStatus: status,
      reflectionUpdatedAt: updatedAt,
    };

    let targetId = readingId;

    // Await any in-flight save reading promise if active
    if (inFlightSaveRef?.current) {
      try {
        const inFlightResult = await inFlightSaveRef.current;
        if (inFlightResult?.id) {
          targetId = inFlightResult.id;
        }
      } catch {
        // proceed with targetId
      }
    }

    // Save to local reflections map
    if (targetId) {
      saveLocalTarotReflection(String(targetId), partialData);
    }
    if (readingId && readingId !== targetId) {
      saveLocalTarotReflection(String(readingId), partialData);
    }

    // Update history state
    setHistory((prev) => {
      const next = prev.map((item) => {
        const isMatch =
          (targetId && String(item.id) === String(targetId)) ||
          (targetId && String(item._remoteId) === String(targetId)) ||
          (readingId && String(item.id) === String(readingId)) ||
          (item.createdAt && (item.createdAt === targetId || item.createdAt === readingId));

        if (!isMatch) return item;

        return {
          ...item,
          ...partialData,
          data: item.data ? { ...item.data, ...partialData } : partialData,
        };
      });

      if (!isAuthenticated) {
        saveGuestTarotReadings(next);
      }
      return next;
    });

    // Sync to backend via PATCH /readings/:id if authenticated
    if (isAuthenticated && targetId) {
      await updateReadingData(targetId, partialData);
    }

    return { id: targetId, ...partialData };
  }, [inFlightSaveRef, isAuthenticated, setHistory, updateReadingData]);

  return {
    ...base,
    saveReading,
    deleteMultipleReadings,
    clearHistory,
    updateReadingReflection,
  };
}
