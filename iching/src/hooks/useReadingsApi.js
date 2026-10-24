import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { decryptData } from '../utils/cryptoUtils';
import {
  createReadingsApi,
  createReadingsApiRequest,
} from '../../../shared/src/utils/readingsApi.mjs';
import { useReadingsHistory } from '../../../shared/src/hooks/useReadingsHistory.js';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'iching';
const readingsApi = createReadingsApi({
  app: APP,
  request: createReadingsApiRequest(SSO_BASE),
});

function mapLoadedIChingReading(r, dataObj) {
  return {
    type: r.type,
    title: r.title,
    mode: dataObj.mode || r.type,
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
 * Hook quản lý lịch sử gieo quẻ. Các bản ghi mới được mã hóa lưu trữ ở phía máy chủ;
 * decryptData chỉ giữ tương thích với các bản ghi enc_v1 cũ.
 */
export function useReadingsApi(isAuthenticated, userId) {
  return useReadingsHistory(isAuthenticated, userId, {
    readingsApi,
    decryptData,
    encryptedQuestionFallback: '(Lần lập quẻ)',
    emptyQuestionFallback: '(Không có câu hỏi)',
    mapLoadedReading: mapLoadedIChingReading,
    buildSaveReading: buildIChingSaveReading,
  });
}
