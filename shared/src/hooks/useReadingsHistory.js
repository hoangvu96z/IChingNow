import { useState, useCallback } from 'react';
import { deleteReadingItems } from '../utils/readingDeletes.mjs';
import { decryptLegacyReadingFields } from '../utils/decryptLegacyReadingFields.mjs';
import { decryptData as defaultDecryptData } from '../utils/legacyReadingCrypto.js';

export async function decryptReadingRecord(
  r,
  {
    userId,
    decryptData = defaultDecryptData,
    encryptedQuestionFallback,
    emptyQuestionFallback = '',
    mapLoadedReading,
  },
) {
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
  const decryptionError = topLevel.decryptionError || nested.decryptionError;
  let question = topLevel.data.question;
  const dataObj = nested.data;
  if (
    typeof r.question === 'string' &&
    r.question.startsWith('enc_v1::') &&
    (topLevel.decryptionError || !question)
  ) {
    question = r.title || encryptedQuestionFallback;
  }
  if (
    (!question || String(question).startsWith('enc_v1::')) &&
    typeof dataObj.question === 'string' &&
    !dataObj.question.startsWith('enc_v1::')
  ) {
    question = dataObj.question;
  }

  const resolvedQuestion = question || emptyQuestionFallback;
  const mappedFields = mapLoadedReading
    ? mapLoadedReading(r, dataObj, resolvedQuestion)
    : {};

  return {
    id: r.id,
    timestamp: r.createdAt,
    question: resolvedQuestion,
    title: r.title,
    ...mappedFields,
    data: dataObj,
    _remoteId: r.id,
    ...(decryptionError ? { _decryptionError: true } : {}),
  };
}

export function useReadingsHistory(
  isAuthenticated,
  userId,
  {
    readingsApi,
    decryptData = defaultDecryptData,
    encryptedQuestionFallback,
    emptyQuestionFallback = '',
    mapLoadedReading,
    buildSaveReading,
  },
) {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const decryptReadingObject = useCallback(
    (r) =>
      decryptReadingRecord(r, {
        userId,
        decryptData,
        encryptedQuestionFallback,
        emptyQuestionFallback,
        mapLoadedReading,
      }),
    [
      userId,
      decryptData,
      encryptedQuestionFallback,
      emptyQuestionFallback,
      mapLoadedReading,
    ],
  );

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
  }, [isAuthenticated, readingsApi, decryptReadingObject]);

  // ─── Lưu reading qua HTTPS; SSO backend mã hóa các trường nhạy cảm khi lưu ─
  const saveReading = useCallback(async (...args) => {
    const [firstArg] = args;
    if (!firstArg || !isAuthenticated) return null;

    const { payload, localItem, shouldSkipInsert } = buildSaveReading(...args);

    try {
      const data = await readingsApi.create(payload);
      const saved = data.reading;
      const mappedItem = {
        ...localItem,
        id: saved.id,
        _remoteId: saved.id,
      };
      setHistory((prev) => {
        if (shouldSkipInsert?.(prev, mappedItem)) return prev;
        return [mappedItem, ...prev];
      });
      return mappedItem;
    } catch (err) {
      console.error('saveReading error:', err);
      throw err;
    }
  }, [isAuthenticated, readingsApi, buildSaveReading]);

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
  }, [isAuthenticated, readingsApi]);

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
  }, [isAuthenticated, readingsApi]);

  // ─── Xoá toàn bộ ───────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    if (isAuthenticated) {
      await readingsApi.clear();
    }
    setHistory([]);
  }, [isAuthenticated, readingsApi]);

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
  }, [history, isAuthenticated, readingsApi]);

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
