import { useState, useCallback, useEffect, useRef } from 'react';
import { decryptData } from '../utils/cryptoUtils';
import { ssoRequest } from '../services/ssoApi';

// Readings use 'tuvi'; quota uses 'tuvinow', matching the existing SSO contract.
export function useReadingsApi(isAuthenticated, userId) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const loadHistory = useCallback(async () => {
    const current = ++generation.current;
    setHistory([]);
    setError('');
    if (!isAuthenticated || !userId) return;
    setLoading(true);
    try {
      const { readings = [] } = await ssoRequest('/readings?app=tuvi');
      const rows = await Promise.all(readings.map(async reading => {
        const data = { ...reading.data };
        let decryptionError = false;
        for (const key of ['inputData', 'aiConversation', 'question']) {
          if (typeof data[key] === 'string' && data[key].startsWith('enc_v1::')) {
            const decrypted = await decryptData(data[key], userId);
            if (decrypted === null) decryptionError = true;
            else data[key] = decrypted;
          }
        }
        return { ...reading, data, ...(decryptionError ? { _decryptionError: true } : {}) };
      }));
      if (generation.current === current) setHistory(rows);
    } catch (err) {
      if (generation.current === current) setError(err.message);
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, [isAuthenticated, userId]);
  useEffect(() => { loadHistory(); return () => { generation.current++; }; }, [loadHistory]);

  const persistReading = useCallback(async (id, data) => {
    if (!isAuthenticated || !userId) throw new Error('Vui lòng đăng nhập để lưu lá số');
    if (id && history.some(row => String(row.id) === String(id) && row._decryptionError)) {
      throw new Error('Không thể giải mã dữ liệu đã lưu; bản ghi cũ được giữ nguyên và chưa có nội dung mới nào được ghi đè.');
    }
    const current = generation.current;
    const { reading } = await ssoRequest(id ? `/readings/${id}` : '/readings', {
      method: id ? 'PATCH' : 'POST',
      body: id
        ? { data }
        : { app: 'tuvi', type: 'tuvi-laso', title: 'Lá số Tử Vi', question: 'Lá số Tử Vi', data },
    });
    if (!reading?.id) throw new Error('Máy chủ chưa xác nhận đã lưu lá số');
    if (generation.current === current && reading) {
      setHistory(previous => [{ ...reading, data }, ...previous.filter(row => row.id !== reading.id)]);
    }
    return reading?.id;
  }, [history, isAuthenticated, userId]);
  const deleteReading = async (id) => {
    const current = generation.current;
    await ssoRequest(`/readings/${id}`, { method: 'DELETE' });
    if (generation.current === current) setHistory(previous => previous.filter(row => row.id !== id));
  };
  const deleteAllReadings = async () => {
    const current = generation.current;
    await ssoRequest('/readings/all?app=tuvi', { method: 'DELETE' });
    if (generation.current === current) setHistory([]);
  };
  return { history, error, loading, loadHistory, persistReading, deleteReading, deleteAllReadings };
}

