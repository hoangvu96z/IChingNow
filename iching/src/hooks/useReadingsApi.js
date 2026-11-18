import { useCallback, useRef } from 'react';
import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { decryptData } from '../utils/cryptoUtils.js';
import {
  createReadingsApi,
  createReadingsApiRequest,
} from '../../../shared/src/utils/readingsApi.mjs';
import { useReadingsHistory } from '../../../shared/src/hooks/useReadingsHistory.js';
import {
  normalizeVerification,
  saveLocalVerification,
} from '../logic/verification.js';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'iching';
const readingsApi = createReadingsApi({
  app: APP,
  request: createReadingsApiRequest(SSO_BASE),
});

import {
  mapLoadedIChingReading,
  buildIChingSaveReading,
} from '../logic/readingsMapping.js';

export { mapLoadedIChingReading, buildIChingSaveReading };

/**
 * Hook quản lý lịch sử gieo quẻ & Nghiệm Lý (Outcome Verification).
 */
export function useReadingsApi(isAuthenticated, userId) {
  const base = useReadingsHistory(isAuthenticated, userId, {
    readingsApi,
    decryptData,
    encryptedQuestionFallback: '(Lần lập quẻ)',
    emptyQuestionFallback: '(Không có câu hỏi)',
    mapLoadedReading: mapLoadedIChingReading,
    buildSaveReading: buildIChingSaveReading,
  });

  const { history, setHistory, updateReadingData, saveReading: baseSaveReading } = base;

  const inFlightSaveRef = useRef(null);
  const historyRef = useRef(history);
  historyRef.current = history;

  const saveReading = useCallback(
    async (...args) => {
      const [resultData] = args;
      const createdAt = resultData?.createdAt || null;
      const savePromise = (async () => {
        return await baseSaveReading(...args);
      })();
      inFlightSaveRef.current = { createdAt, promise: savePromise, resolvedId: null };
      try {
        const saved = await savePromise;
        if (inFlightSaveRef.current?.promise === savePromise) {
          inFlightSaveRef.current.resolvedId = saved?.id || null;
        }
        return saved;
      } finally {
        setTimeout(() => {
          if (inFlightSaveRef.current?.promise === savePromise) {
            inFlightSaveRef.current = null;
          }
        }, 1000);
      }
    },
    [baseSaveReading]
  );

  const updateVerification = useCallback(
    async (readingId, verificationObj, createdAtKey = null) => {
      const normalized = normalizeVerification(verificationObj);

      let resolvedId = readingId;
      if (!resolvedId && inFlightSaveRef.current) {
        if (!createdAtKey || inFlightSaveRef.current.createdAt === createdAtKey) {
          if (inFlightSaveRef.current.resolvedId) {
            resolvedId = inFlightSaveRef.current.resolvedId;
          } else if (inFlightSaveRef.current.promise) {
            try {
              const saved = await inFlightSaveRef.current.promise;
              if (saved?.id) {
                resolvedId = saved.id;
              }
            } catch {
              // Ignore in-flight save failure; fallback to history lookup
            }
          }
        }
      }

      if (!resolvedId && createdAtKey) {
        const found = historyRef.current?.find(
          (item) =>
            (item.createdAt === createdAtKey ||
              item.timestamp === createdAtKey ||
              item.data?.createdAt === createdAtKey) &&
            item.id &&
            !String(item.id).startsWith('local')
        );
        if (found?.id) {
          resolvedId = found.id;
        }
      }

      // Luôn lưu dự phòng vào localStorage để hoạt động mượt cả khi khách / chưa đồng bộ
      if (resolvedId) saveLocalVerification(String(resolvedId), normalized);
      if (readingId && String(readingId) !== String(resolvedId)) {
        saveLocalVerification(String(readingId), normalized);
      }
      if (createdAtKey) saveLocalVerification(String(createdAtKey), normalized);

      // Cập nhật ngay trong state lịch sử trên giao diện
      setHistory((prev) =>
        prev.map((item) => {
          const matchesId =
            (resolvedId && String(item.id) === String(resolvedId)) ||
            (readingId && String(item.id) === String(readingId));
          const matchesCreatedAt =
            createdAtKey &&
            (item.data?.createdAt === createdAtKey ||
              item.timestamp === createdAtKey ||
              item.createdAt === createdAtKey);
          if (!matchesId && !matchesCreatedAt) return item;
          return {
            ...item,
            verification: normalized,
            data: item.data ? { ...item.data, verification: normalized } : item.data,
          };
        })
      );

      // Đồng bộ lên backend qua readingsApi.update nếu đã đăng nhập & có resolvedId
      if (isAuthenticated && resolvedId) {
        await updateReadingData(resolvedId, { verification: normalized });
      }

      return normalized;
    },
    [isAuthenticated, setHistory, updateReadingData]
  );

  return {
    ...base,
    saveReading,
    updateVerification,
  };
}
