import { useState, useCallback, useEffect } from 'react';
import { getSsoApiBase } from '../utils/ssoConfig.mjs';

const SSO_BASE = getSsoApiBase({
  DEV: import.meta.env.DEV,
  VITE_SSO_URL: import.meta.env.VITE_SSO_URL,
});

const PLAN_APPS = {
  ichingnow: {
    quotaError: 'Hết lượt hỏi AI',
    bonusError: 'Không thể xin thêm câu',
  },
  tarotnow: {
    quotaError: 'Hết lượt hỏi AI',
    bonusError: 'Không thể xin thêm câu',
  },
  tuvinow: {
    quotaError: 'Hết lượt sử dụng',
    bonusError: 'Không thể xin thêm lượt',
  },
};

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('sso_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function usePlanForApp(isAuthenticated, app) {
  const appCopy = PLAN_APPS[app];
  if (!appCopy) throw new Error(`Unsupported plan app: ${app}`);

  const [quota, setQuota] = useState(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);

  const fetchQuota = useCallback(async () => {
    setIsLoadingQuota(true);
    try {
      if (!isAuthenticated) {
        const configRes = await fetch(`${SSO_BASE}/plans/config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          const freePlan = configData.plans?.find((plan) => plan.name === 'free');
          if (freePlan?.overrideFreeToPremium) {
            setQuota({
              plan: 'premium',
              planLabel: 'Gói Premium (Đặc quyền Admin)',
              remaining: 180,
              canAsk: true,
              canBonus: true,
              isOverride: true,
            });
            return;
          }
          if (freePlan?.overrideFreeToLite) {
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

      const res = await fetch(`${SSO_BASE}/plans/my-quota?app=${app}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) setQuota(await res.json());
    } catch (error) {
      console.error('Failed to fetch quota', error);
    } finally {
      setIsLoadingQuota(false);
    }
  }, [app, isAuthenticated]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const consumeQuota = useCallback(async () => {
    try {
      const res = await fetch(`${SSO_BASE}/plans/consume`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ app }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuota(data.quota);
        return { ok: true };
      }
      return {
        ok: false,
        error: data.message || appCopy.quotaError,
        plan: data.plan,
        canBonus: data.canBonus,
      };
    } catch {
      return { ok: false, error: 'Lỗi kết nối' };
    }
  }, [app, appCopy]);

  const requestBonus = useCallback(async () => {
    try {
      const res = await fetch(`${SSO_BASE}/plans/bonus`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ app }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuota(data.quota);
        return { ok: true, bonusAdded: data.bonusAdded };
      }
      return { ok: false, error: data.message || appCopy.bonusError };
    } catch {
      return { ok: false, error: 'Lỗi kết nối' };
    }
  }, [app, appCopy]);

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
    } catch {
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
