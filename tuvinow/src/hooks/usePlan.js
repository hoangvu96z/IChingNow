import { useState, useCallback, useEffect } from 'react';

// In dev, use relative paths (Vite proxy → sso.vunph.click). In prod use full SSO URL.
const SSO_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_SSO_URL || '').replace(/\/$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('sso_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePlan(isAuthenticated) {
  const [quota, setQuota] = useState(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  const fetchQuota = useCallback(async () => {
    setIsLoadingQuota(true);
    try {
      if (!isAuthenticated) {
        // Fetch public config to see if Admin enabled Free override
        const configRes = await fetch(`${SSO_BASE}/plans/config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          const freeP = configData.plans?.find(p => p.name === 'free');
          if (freeP?.overrideFreeToPremium) {
            setQuota({
              plan: 'premium',
              planLabel: 'Gói Premium (Đặc quyền Admin)',
              remaining: 180,
              canAsk: true,
              canBonus: true,
              isOverride: true,
            });
            return;
          } else if (freeP?.overrideFreeToLite) {
            setQuota({
              plan: 'lite',
              planLabel: 'Gói Lite (Đặc quyền Admin)',
              remaining: 5,
              canAsk: true,
              canBonus: false,
              isOverride: true,
            });
            return;
          }
        }
        setQuota(null);
        return;
      }

      const res = await fetch(`${SSO_BASE}/plans/my-quota?app=tuvinow`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch (e) {
      console.error('Failed to fetch quota', e);
    } finally {
      setIsLoadingQuota(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const consumeQuota = useCallback(async () => {
    try {
      const res = await fetch(`${SSO_BASE}/plans/consume`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ app: 'tuvinow' }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuota(data.quota);
        return { ok: true };
      }
      return {
        ok: false,
        error: data.message || 'Hết lượt sử dụng',
        plan: data.plan,
        canBonus: data.canBonus,
      };
    } catch (e) {
      return { ok: false, error: 'Lỗi kết nối' };
    }
  }, []);

  const requestBonus = useCallback(async () => {
    try {
      const res = await fetch(`${SSO_BASE}/plans/bonus`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ app: 'tuvinow' }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuota(data.quota);
        return { ok: true, bonusAdded: data.bonusAdded };
      }
      return { ok: false, error: data.message || 'Không thể xin thêm lượt' };
    } catch (e) {
      return { ok: false, error: 'Lỗi kết nối' };
    }
  }, []);

  const applyCoupon = useCallback(async (code) => {
    try {
      const res = await fetch(`${SSO_BASE}/plans/apply-coupon`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchQuota();
        return { ok: true, message: data.message };
      }
      return { ok: false, error: data.message || 'Mã không hợp lệ' };
    } catch (e) {
      return { ok: false, error: 'Lỗi kết nối' };
    }
  }, [fetchQuota]);

  return {
    quota,
    isLoadingQuota,
    canAsk: quota?.canAsk ?? true,
    remaining: quota?.remaining ?? '?',
    plan: quota?.plan ?? 'free',
    planLabel: quota?.planLabel ?? 'Gói Miễn Phí',
    canBonus: quota?.canBonus ?? false,
    expiresAt: quota?.expiresAt ?? null,
    daysRemaining: quota?.daysRemaining ?? null,
    isExpiringSoon: quota?.isExpiringSoon ?? false,
    isOverride: quota?.isOverride ?? false,
    fetchQuota,
    consumeQuota,
    requestBonus,
    applyCoupon,
  };
}
