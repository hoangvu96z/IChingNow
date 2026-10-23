import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { useState, useCallback } from 'react';
import { decryptData } from '../utils/cryptoUtils';
import { deleteReadingItems } from '../../../shared/src/utils/readingDeletes.mjs';
import { decryptLegacyReadingFields } from '../../../shared/src/utils/decryptLegacyReadingFields.mjs';
import {
  createReadingsApi,
  createReadingsApiRequest,
} from '../../../shared/src/utils/readingsApi.mjs';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'iching';
const readingsApi = createReadingsApi({
  app: APP,
  request: createReadingsApiRequest(SSO_BASE),
});

/**
 * Hook quản lý lịch sử gieo quẻ. Các bản ghi mới được mã hóa lưu trữ ở phía máy chủ;
 * decryptData chỉ giữ tương thích với các bản ghi enc_v1 cũ.
 */
export function useReadingsApi(isAuthenticated, userId) {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Helper giải mã đối tượng reading khi tải về từ server
  const decryptReadingObject = useCallback(async (r) => {
    const topLevel = await decryptLegacyReadingFields(
      { question: r.question },
      ['question'],
      userId,
      decryptData,
    );
    const nested = await decryptLegacyReadingFields(
      r.data || {},
      ['question', 'aiConversation'],
      userId,
      decryptData,
    );
    let decryptionError = topLevel.decryptionError || nested.decryptionError;
    let question = topLevel.data.question;
    let dataObj = nested.data;
    if (
      typeof r.question === 'string' &&
      r.question.startsWith('enc_v1::') &&
      (topLevel.decryptionError || !question)
    ) {
      question = r.title || '(Lần lập quẻ)';
    }
    if ((!question || String(question).startsWith('enc_v1::')) && typeof dataObj.question === 'string' && !dataObj.question.startsWith('enc_v1::')) {
      question = dataObj.question;
    }

    return {
      id: r.id,
      timestamp: r.createdAt,
      question: question || '(Không có câu hỏi)',
      type: r.type,
      title: r.title,
      mode: dataObj.mode || r.type,
      data: dataObj,
      _remoteId: r.id,
      ...(decryptionError ? { _decryptionError: true } : {}),
    };
  }, [userId]);

  // ─── Load lịch sử ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      setHistoryLoaded(true);
      return;
    }

    try {
      const data = await readingsApi.list();

      const mapped = await Promise.all((data.readings || []).map(decryptReadingObject));
      setHistory(mapped);
    } catch (err) {
      console.error('loadHistory error:', err);
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [isAuthenticated, decryptReadingObject]);

  // ─── Lưu reading qua HTTPS; SSO backend mã hóa các trường nhạy cảm khi lưu ─
  const saveReading = useCallback(async (newResult, type) => {
    if (!newResult || !isAuthenticated) return null;

    const plainQuestion = newResult.question || null;
    const dataToSave = { ...newResult, question: plainQuestion };

    const title =
      type === 'luc-hao'
        ? `${newResult.primaryHexagram?.nameVi}${newResult.changedHexagram ? ' ➔ ' + newResult.changedHexagram.nameVi : ''}`
        : `${newResult.primaryHexagram?.nameVi} (Chủ) ➔ ${newResult.changedHexagram?.nameVi} (Biến)`;

    const newItem = {
      id: Date.now().toString(),
      timestamp: newResult.createdAt || new Date().toISOString(),
      question: plainQuestion || '(Không có câu hỏi)',
      type,
      title,
      mode: newResult.mode || (type === 'mai-hoa' ? `mai-hoa-${newResult.subMode}` : 'quick'),
      data: newResult,
    };

    try {
      const data = await readingsApi.create({
          app: APP,
          type,
          question: plainQuestion,
          title,
          data: dataToSave,
      });
      const saved = data.reading;
      const mappedItem = {
        ...newItem,
        id: saved.id,
        _remoteId: saved.id,
      };
      setHistory((prev) => {
        const exists = prev.some((item) => item.data?.createdAt === newResult.createdAt);
        if (exists) return prev;
        return [mappedItem, ...prev];
      });
      return mappedItem;
    } catch (err) {
      console.error('saveReading error:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // ─── Xoá 1 reading ─────────────────────────────────────────────────────────
  const deleteReading = useCallback(async (item) => {
    const { deletedItems, failedItems } = await deleteReadingItems([item], {
      isAuthenticated,
      deleteRemote: (remoteId) => readingsApi.delete(remoteId),
    });
    if (deletedItems.length) {
      setHistory((prev) => prev.filter((h) => h.id !== item.id));
    }
    if (failedItems.length) {
      throw new Error('Không thể xóa bản ghi trên máy chủ. Bản ghi được giữ lại để thử lại.');
    }
  }, [isAuthenticated]);

  // ─── Xoá nhiều readings ───────────────────────────────────────────────────
  const deleteMultipleReadings = useCallback(async (itemsToDelete) => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;

    const { deletedItems, failedItems } = await deleteReadingItems(itemsToDelete, {
      isAuthenticated,
      deleteRemote: (remoteId) => readingsApi.delete(remoteId),
    });
    const deletedIds = new Set(deletedItems.map((item) => item.id));
    if (deletedIds.size) setHistory((prev) => prev.filter((item) => !deletedIds.has(item.id)));
    if (failedItems.length) {
      const error = new Error(`Không thể xóa ${failedItems.length} bản ghi trên máy chủ. Những bản ghi đó được giữ lại để thử lại.`);
      error.failedIds = failedItems.map(({ item }) => item.id);
      throw error;
    }
  }, [isAuthenticated]);

  // ─── Xoá toàn bộ ───────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    if (isAuthenticated) {
      await readingsApi.clear();
    }
    setHistory([]);
  }, [isAuthenticated]);

  // ─── Backend giữ title/question hiện có và mã hóa lại sau khi merge data ───
  const updateReadingData = useCallback(async (readingId, partialData) => {
    if (!isAuthenticated || !readingId) return;

    const dataToPatch = { ...partialData };
    try {
      const existing = history.find(item => item.id === readingId || item._remoteId === readingId);
      if (existing?._decryptionError) {
        throw new Error('Không thể giải mã dữ liệu đã lưu; bản ghi cũ được giữ nguyên và chưa có nội dung mới nào được ghi đè.');
      }
      const responseData = await readingsApi.update(readingId, dataToPatch);
      
      setHistory((prev) =>
        prev.map((item) =>
          item.id === readingId
            ? { ...item, data: { ...item.data, ...partialData } }
            : item
        )
      );
      return responseData.reading;
    } catch (err) {
      console.error('updateReadingData error:', err);
      throw err;
    }
  }, [history, isAuthenticated]);

  return {
    history,
    setHistory,
    historyLoaded,
    loadHistory,
    saveReading,
    deleteReading,
    deleteMultipleReadings,
    clearHistory,
    updateReadingData,
  };
}
