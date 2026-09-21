import { useState, useCallback, useEffect, useRef } from 'react';
import { encryptData, decryptData } from '../utils/cryptoUtils';
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
        for (const key of ['inputData', 'aiConversation']) {
          if (data[key]) data[key] = await decryptData(data[key], userId);
        }
        return { ...reading, data };
      }));
      if (generation.current === current) setHistory(rows);
    } catch (err) {
      if (generation.current === current) setError(err.message);
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, [isAuthenticated, userId]);
  useEffect(() => { loadHistory(); return () => { generation.current++; }; }, [loadHistory]);

  const persistReading = async (id, data) => {
    if (!isAuthenticated || !userId) throw new Error('Vui lòng đăng nhập để lưu lá số');
    const current = generation.current;
    const encrypted = { ...data };
    for (const key of ['inputData', 'aiConversation']) {
      if (data[key]) {
        encrypted[key] = await encryptData(data[key], userId);
        if (typeof encrypted[key] !== 'string' || !encrypted[key].startsWith('enc_v1::')) throw new Error('Không mã hóa được dữ liệu. Lá số chưa được lưu.');
      }
    }
    const { reading } = await ssoRequest(id ? `/readings/${id}` : '/readings', {
      method: id ? 'PATCH' : 'POST',
      body: id ? { data: encrypted } : { app: 'tuvi', type: 'tuvi-laso', title: 'Lá số Tử Vi', data: encrypted },
    });
    if (generation.current === current) setHistory(previous => [{ ...reading, data }, ...previous.filter(row => row.id !== reading.id)]);
    return reading.id;
  };
  const deleteReading = async (id) => {
    const current = generation.current;
    await ssoRequest(`/readings/${id}`, { method: 'DELETE' });
    if (generation.current === current) setHistory(previous => previous.filter(row => row.id !== id));
  };
  return { history, error, loading, loadHistory, persistReading, deleteReading };
}
