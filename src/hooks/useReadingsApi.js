import { useState, useCallback } from 'react';

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
 * Hook quản lý lịch sử gieo quẻ qua API (khi đã đăng nhập)
 * Fallback localStorage khi chưa đăng nhập.
 */
export function useReadingsApi(isAuthenticated) {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // ─── Load lịch sử ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      // Fallback: đọc từ localStorage khi chưa login
      try {
        const saved = localStorage.getItem('iching_history');
        setHistory(saved ? JSON.parse(saved) : []);
      } catch {
        setHistory([]);
      }
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

      // Map API format → format cũ của App.jsx (giữ tương thích)
      const mapped = (data.readings || []).map((r) => ({
        id: r.id,
        timestamp: r.createdAt,
        question: r.question || '(Không có câu hỏi)',
        type: r.type,
        title: r.title,
        mode: r.data?.mode || r.type,
        data: r.data,
        _remoteId: r.id,
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('loadHistory error:', err);
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [isAuthenticated]);

  // ─── Lưu 1 reading mới ─────────────────────────────────────────────────────
  const saveReading = useCallback(async (newResult, type) => {
    if (!newResult) return;

    const title =
      type === 'luc-hao'
        ? `${newResult.primaryHexagram?.nameVi}${newResult.changedHexagram ? ' ➔ ' + newResult.changedHexagram.nameVi : ''}`
        : `${newResult.primaryHexagram?.nameVi} (Chủ) ➔ ${newResult.changedHexagram?.nameVi} (Biến)`;

    const newItem = {
      id: Date.now().toString(),
      timestamp: newResult.createdAt || new Date().toISOString(),
      question: newResult.question || '(Không có câu hỏi)',
      type,
      title,
      mode: newResult.mode || (type === 'mai-hoa' ? `mai-hoa-${newResult.subMode}` : 'quick'),
      data: newResult,
    };

    if (!isAuthenticated) {
      // Lưu localStorage khi chưa login
      setHistory((prev) => {
        const exists = prev.some((item) => item.data.createdAt === newResult.createdAt);
        if (exists) return prev;
        const updated = [newItem, ...prev].slice(0, 10);
        localStorage.setItem('iching_history', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // Gọi API khi đã login
    try {
      const res = await fetch(`${SSO_BASE}/readings`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          app: APP,
          type,
          question: newResult.question || null,
          title,
          data: newResult,
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
    } catch (err) {
      console.error('saveReading error:', err);
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

    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== item.id);
      if (!isAuthenticated) {
        localStorage.setItem('iching_history', JSON.stringify(updated));
      }
      return updated;
    });
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
    } else {
      localStorage.removeItem('iching_history');
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
    clearHistory,
  };
}
