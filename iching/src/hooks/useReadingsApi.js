import { useCallback } from 'react';
import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { decryptData } from '../utils/cryptoUtils';
import {
  createReadingsApi,
  createReadingsApiRequest,
} from '../../../shared/src/utils/readingsApi.mjs';
import { useReadingsHistory } from '../../../shared/src/hooks/useReadingsHistory.js';
import {
  normalizeVerification,
  loadLocalVerifications,
  saveLocalVerification,
} from '../logic/verification.js';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'iching';
const readingsApi = createReadingsApi({
  app: APP,
  request: createReadingsApiRequest(SSO_BASE),
});

function mapLoadedIChingReading(r, dataObj) {
  const localMap = loadLocalVerifications();
  const verification =
    dataObj?.verification ||
    localMap[String(r.id)] ||
    (dataObj?.createdAt ? localMap[dataObj.createdAt] : null) ||
    null;

  return {
    type: r.type,
    title: r.title,
    mode: dataObj.mode || r.type,
    ...(verification ? { verification: normalizeVerification(verification) } : {}),
  };
}

function buildIChingSaveReading(newResult, type) {
  const plainQuestion = newResult.question || null;
  const dataToSave = { ...newResult, question: plainQuestion };

  const title =
    type === 'luc-hao'
      ? `${newResult.primaryHexagram?.nameVi}${newResult.changedHexagram ? ' ➔ ' + newResult.changedHexagram.nameVi : ''}`
      : `${newResult.primaryHexagram?.nameVi} (Chủ) ➔ ${newResult.changedHexagram?.nameVi} (Biến)`;

  const localItem = {
    id: Date.now().toString(),
    timestamp: newResult.createdAt || new Date().toISOString(),
    question: plainQuestion || '(Không có câu hỏi)',
    type,
    title,
    mode: newResult.mode || (type === 'mai-hoa' ? `mai-hoa-${newResult.subMode}` : 'quick'),
    ...(newResult.verification ? { verification: normalizeVerification(newResult.verification) } : {}),
    data: newResult,
  };

  return {
    payload: {
      app: APP,
      type,
      question: plainQuestion,
      title,
      data: dataToSave,
    },
    localItem,
    shouldSkipInsert: (prev) =>
      prev.some((item) => item.data?.createdAt === newResult.createdAt),
  };
}

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

  const { setHistory, updateReadingData } = base;

  const updateVerification = useCallback(
    async (readingId, verificationObj, createdAtKey = null) => {
      const normalized = normalizeVerification(verificationObj);

      // Luôn lưu dự phòng vào localStorage để hoạt động mượt cả khi khách / chưa đồng bộ
      if (readingId) saveLocalVerification(String(readingId), normalized);
      if (createdAtKey) saveLocalVerification(String(createdAtKey), normalized);

      // Cập nhật ngay trong state lịch sử trên giao diện
      setHistory((prev) =>
        prev.map((item) => {
          const matchesId = readingId && String(item.id) === String(readingId);
          const matchesCreatedAt =
            createdAtKey && item.data?.createdAt && item.data.createdAt === createdAtKey;
          if (!matchesId && !matchesCreatedAt) return item;
          return {
            ...item,
            verification: normalized,
            data: item.data ? { ...item.data, verification: normalized } : item.data,
          };
        })
      );

      // Đồng bộ lên backend qua readingsApi.update nếu đã đăng nhập & có readingId
      if (isAuthenticated && readingId) {
        await updateReadingData(readingId, { verification: normalized });
      }

      return normalized;
    },
    [isAuthenticated, setHistory, updateReadingData]
  );

  return {
    ...base,
    updateVerification,
  };
}
