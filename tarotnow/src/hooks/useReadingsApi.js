import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import { useState, useCallback } from 'react';
import { decryptData } from '../utils/cryptoUtils';
import { deleteReadingItems } from '../../../shared/src/utils/readingDeletes.mjs';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });
const APP = 'tarot';

function getToken() {
  return localStorage.getItem('sso_token');
}

function authHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function useReadingsApi(isAuthenticated, userId) {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Helper giải mã đối tượng reading khi tải về từ server
  const decryptReadingObject = async (r) => {
    let decryptionError = false;
    let question = r.question;
    if (question && typeof question === 'string' && question.startsWith('enc_v1::')) {
      const dec = await decryptData(question, userId);
      if (dec === null) decryptionError = true;
      question = dec || r.title || '(Trải bài Tarot)';
    }

    let dataObj = r.data || {};
    if (dataObj.question && typeof dataObj.question === 'string' && dataObj.question.startsWith('enc_v1::')) {
      const dec = await decryptData(dataObj.question, userId);
      if (dec === null) decryptionError = true;
      else dataObj = { ...dataObj, question: dec };
    }
    if ((!question || String(question).startsWith('enc_v1::')) && typeof dataObj.question === 'string' && !dataObj.question.startsWith('enc_v1::')) {
      question = dataObj.question;
    }
    if (dataObj.aiConversation) {
      if (typeof dataObj.aiConversation === 'string' && dataObj.aiConversation.startsWith('enc_v1::')) {
        const decryptedAi = await decryptData(dataObj.aiConversation, userId);
        if (decryptedAi === null) decryptionError = true;
        else dataObj = { ...dataObj, aiConversation: decryptedAi };
      }
    }

    return {
      id: r.id,
      timestamp: r.createdAt,
      question: question || '',
      spread: r.type,
      title: r.title,
      cards: dataObj.cards || [],
      data: dataObj,
      _remoteId: r.id,
      ...(decryptionError ? { _decryptionError: true } : {}),
    };
  };

  // ─── Load lịch sử ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      setHistoryLoaded(true);
      return;
    }

    try {
      const res = await fetch(`${SSO_BASE}/readings?app=${APP}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load readings');
      const data = await res.json();

      const mapped = await Promise.all((data.readings || []).map(decryptReadingObject));
      setHistory(mapped);
    } catch (err) {
      console.error('loadHistory error:', err);
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [isAuthenticated, userId]);

  // ─── Lưu reading qua HTTPS; SSO backend mã hóa các trường nhạy cảm khi lưu ─
  const saveReading = useCallback(async (newEntry) => {
    if (!newEntry || !isAuthenticated) return null;

    const plainQuestion = newEntry.question || null;
    const dataToSave = { ...newEntry, question: plainQuestion };

    try {
      const res = await fetch(`${SSO_BASE}/readings`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          app: APP,
          type: newEntry.spread || 'custom',
          question: plainQuestion,
          title: newEntry.title || `Trải bài ${newEntry.spread || ''}`,
          data: dataToSave,
        }),
      });
      if (!res.ok) throw new Error('Failed to save reading');
      const data = await res.json();
      const saved = data.reading;
      const mappedItem = { ...newEntry, id: saved.id, _remoteId: saved.id };
      setHistory((prev) => [mappedItem, ...prev]);
      return mappedItem;
    } catch (err) {
      console.error('saveReading error:', err);
      throw err;
    }
  }, [isAuthenticated, userId]);

  // ─── Xoá 1 reading ─────────────────────────────────────────────────────────
  const deleteReading = useCallback(async (item) => {
    const { deletedItems, failedItems } = await deleteReadingItems([item], {
      isAuthenticated,
      deleteRemote: (remoteId) => fetch(`${SSO_BASE}/readings/${remoteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      }),
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
      deleteRemote: (remoteId) => fetch(`${SSO_BASE}/readings/${remoteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      }),
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
      const response = await fetch(`${SSO_BASE}/readings/all?app=${APP}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Không thể xóa lịch sử trên máy chủ. Lịch sử vẫn được giữ lại.');
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
      const res = await fetch(`${SSO_BASE}/readings/${readingId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: dataToPatch }),
      });
      if (!res.ok) throw new Error('Failed to update reading data');
      const responseData = await res.json();
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
  }, [history, isAuthenticated, userId]);

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
