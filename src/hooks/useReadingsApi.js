import { useState, useCallback } from 'react';
import { encryptData, decryptData } from '../utils/cryptoUtils';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';
const APP = 'iching';

function getToken() {
  return localStorage.getItem('sso_token');
}

function authHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Hook quản lý lịch sử gieo quẻ qua API với Mã Hóa Client-Side (Zero-Knowledge E2EE)
 */
export function useReadingsApi(isAuthenticated) {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Helper giải mã đối tượng reading khi tải về từ server
  const decryptReadingObject = async (r) => {
    let question = r.question;
    if (question && typeof question === 'string' && question.startsWith('enc_v1::')) {
      question = await decryptData(question);
    }

    let dataObj = r.data || {};
    if (dataObj.question && typeof dataObj.question === 'string' && dataObj.question.startsWith('enc_v1::')) {
      dataObj = { ...dataObj, question: await decryptData(dataObj.question) };
    }
    if (dataObj.aiConversation) {
      if (typeof dataObj.aiConversation === 'string' && dataObj.aiConversation.startsWith('enc_v1::')) {
        const decryptedAi = await decryptData(dataObj.aiConversation);
        dataObj = { ...dataObj, aiConversation: decryptedAi };
      }
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
  }, [isAuthenticated]);

  // ─── Lưu 1 reading mới với mã hóa AES-GCM ──────────────────────────────────
  const saveReading = useCallback(async (newResult, type) => {
    if (!newResult || !isAuthenticated) return null;

    const plainQuestion = newResult.question || null;
    const encryptedQuestion = plainQuestion ? await encryptData(plainQuestion) : null;

    const dataToSave = {
      ...newResult,
      question: encryptedQuestion,
    };

    if (newResult.aiConversation) {
      dataToSave.aiConversation = await encryptData(newResult.aiConversation);
    }

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
      const res = await fetch(`${SSO_BASE}/readings`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          app: APP,
          type,
          question: encryptedQuestion,
          title,
          data: dataToSave,
        }),
      });
      if (!res.ok) throw new Error('Failed to save reading');
      const data = await res.json();
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
      return null;
    }
  }, [isAuthenticated]);

  // ─── Xoá 1 reading ─────────────────────────────────────────────────────────
  const deleteReading = useCallback(async (item) => {
    const remoteId = item._remoteId || item.id;

    if (isAuthenticated && item._remoteId) {
      try {
        await fetch(`${SSO_BASE}/readings/${remoteId}`, {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        });
      } catch (err) {
        console.error('deleteReading error:', err);
      }
    }

    setHistory((prev) => prev.filter((h) => h.id !== item.id));
  }, [isAuthenticated]);

  // ─── Xoá nhiều readings ───────────────────────────────────────────────────
  const deleteMultipleReadings = useCallback(async (itemsToDelete) => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;

    const idsToDelete = new Set(itemsToDelete.map((i) => i.id));

    if (isAuthenticated) {
      await Promise.allSettled(
        itemsToDelete.map((item) => {
          const remoteId = item._remoteId || item.id;
          if (!remoteId) return Promise.resolve();
          return fetch(`${SSO_BASE}/readings/${remoteId}`, {
            method: 'DELETE',
            headers: authHeaders(),
            credentials: 'include',
          });
        })
      );
    }

    setHistory((prev) => prev.filter((h) => !idsToDelete.has(h.id)));
  }, [isAuthenticated]);

  // ─── Xoá toàn bộ ───────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await fetch(`${SSO_BASE}/readings/all?app=${APP}`, {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        });
      } catch (err) {
        console.error('clearHistory error:', err);
      }
    }
    setHistory([]);
  }, [isAuthenticated]);

  // ─── Cập nhật data với mã hóa AI conversation ──────────────────────────────
  const updateReadingData = useCallback(async (readingId, partialData) => {
    if (!isAuthenticated || !readingId) return;

    const dataToPatch = { ...partialData };
    if (partialData.aiConversation) {
      dataToPatch.aiConversation = await encryptData(partialData.aiConversation);
    }

    try {
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
    }
  }, [isAuthenticated]);

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
