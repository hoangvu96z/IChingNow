import { useState, useCallback } from 'react';
import { encryptData, decryptData } from '../utils/cryptoUtils';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';
const APP = 'tuvi';

function getToken() {
  return localStorage.getItem('sso_token');
}

function authHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function useReadingsApi(isAuthenticated, userId = 'default_user') {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const decryptReadingObject = async (r) => {
    let question = r.question;
    if (question && typeof question === 'string' && question.startsWith('enc_v1::')) {
      const dec = await decryptData(question, userId);
      question = dec || r.title || '(Lá số Tử Vi)';
    }

    let dataObj = r.data || {};
    if (dataObj.question && typeof dataObj.question === 'string' && dataObj.question.startsWith('enc_v1::')) {
      const dec = await decryptData(dataObj.question, userId);
      dataObj = { ...dataObj, question: dec || r.title || '(Lá số Tử Vi)' };
    }

    return {
      id: r.id,
      timestamp: r.createdAt,
      question: question || '',
      type: r.type,
      title: r.title,
      data: dataObj,
      _remoteId: r.id,
    };
  };

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

  const saveReading = useCallback(async (newEntry) => {
    if (!newEntry || !isAuthenticated) return null;

    const plainQuestion = newEntry.question || null;
    const encryptedQuestion = plainQuestion ? await encryptData(plainQuestion, userId) : null;

    const dataToSave = { ...newEntry, question: encryptedQuestion };

    try {
      const res = await fetch(`${SSO_BASE}/readings`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          app: APP,
          type: newEntry.type || 'tuvi-laso',
          question: encryptedQuestion,
          title: newEntry.title || 'Lá số Tử Vi',
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
      return null;
    }
  }, [isAuthenticated, userId]);

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

  return {
    history,
    setHistory,
    historyLoaded,
    loadHistory,
    saveReading,
    deleteReading,
    deleteMultipleReadings,
    clearHistory,
  };
}
