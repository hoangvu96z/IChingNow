import {
  getSsoApiBase,
  getSsoLoginUrl,
  takeSsoCodeFromUrl,
  createSsoCodeExchangeCoordinator,
  fetchSsoSession,
  isSessionRejected,
  ssoFetch,
  clearSsoBearerToken,
} from '../utils/ssoConfig.mjs';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Dev: VITE_SSO_URL trống → dùng relative path qua vite proxy (/sso/*)
// Prod: VITE_SSO_URL=https://sso.vunph.click → gọi thẳng tới SSO server
const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });

const AuthContext = createContext(null);

// ─── Toast component cho thông báo hết phiên ─────────────────────────────────
function SessionExpiredToast({ visible, onClose, onLogin }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      // Trigger enter animation
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? '0' : '-120%'})`,
        zIndex: 99999,
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2040 100%)',
        border: '1px solid rgba(255, 170, 80, 0.4)',
        borderRadius: '16px',
        padding: '16px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,170,80,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        maxWidth: '440px',
        width: 'calc(100vw - 32px)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <span style={{ fontSize: '24px', flexShrink: 0 }}>⏳</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#ffd6a5', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
          Phiên đăng nhập đã hết hạn
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
          Vui lòng đăng nhập lại để tiếp tục sử dụng.
        </div>
      </div>
      <button
        onClick={onLogin}
        style={{
          background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.target.style.opacity = '1')}
      >
        Đăng nhập
      </button>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  );
}

// Safe localStorage wrapper để chống crash khi chạy trên Private Browsing chặn storage
const safeStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, val) => {
    try { localStorage.setItem(key, val); } catch {}
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch {}
  }
};
// Remove bearer tokens left by older app versions; current bearer state is tab-scoped.
safeStorage.removeItem('sso_token');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  // Track nếu user đã từng đăng nhập thành công (để phân biệt với lần đầu vào app)
  const hadSession = useRef(safeStorage.getItem('sso_session_seen') === '1');

  const authRequest = useRef(0);
  const codeExchange = useRef(null);
  if (!codeExchange.current) codeExchange.current = createSsoCodeExchangeCoordinator();

  const fetchUser = useCallback(async () => {
    const requestId = ++authRequest.current;
    let exchangePromise = null;
    try {
      // 1. Exchange the short-lived OAuth code after removing it from the URL.
      const codeFromUrl = takeSsoCodeFromUrl();
      exchangePromise = codeExchange.current.getOrStart(SSO_BASE, codeFromUrl);
      if (exchangePromise) {
        await exchangePromise;
        if (requestId !== authRequest.current) return;
        // Xóa flag logout vì user đang đăng nhập lại
        safeStorage.removeItem('sso_logged_out');
        // The exchange sets the tab bearer and first-party cookie; /sso/me confirms it.
        const session = await fetchSsoSession(SSO_BASE);
        if (requestId !== authRequest.current) return;
        hadSession.current = !!session.user;
        if (session.user) safeStorage.setItem('sso_session_seen', '1');
        // Ẩn toast nếu đang hiện
        setSessionExpired(false);
        setUser(session.user || null);
        codeExchange.current.complete();
        return;
      }

      if (safeStorage.getItem('sso_logged_out')) {
        setUser(null);
        return;
      }

      // 2. Resolve the current user from the tab bearer or first-party cookie session.
      const data = await fetchSsoSession(SSO_BASE);
      if (requestId !== authRequest.current) return;

      if (data.user) {
        // Xóa flag logout khi xác thực thành công
        safeStorage.removeItem('sso_logged_out');
        setUser(data.user);
        hadSession.current = true;
        safeStorage.setItem('sso_session_seen', '1');
        setSessionExpired(false);
      } else {
        // A missing SSO session is a normal first visit unless this tab had one.
        const wasLoggedIn = hadSession.current;
        setUser(null);

        if (wasLoggedIn) {
          safeStorage.removeItem('sso_session_seen');
          // Only show expiry feedback after this tab previously had a session.
          setSessionExpired(true);
          hadSession.current = false;
        }
      }
    } catch (error) {
      if (requestId !== authRequest.current) return;
      // Only an explicit authentication rejection expires the session.
      if (isSessionRejected(error)) {
        const wasLoggedIn = hadSession.current;
        safeStorage.removeItem('sso_session_seen');
        setUser(null);
        setSessionExpired(wasLoggedIn);
        hadSession.current = false;
      }
    } finally {
      if (exchangePromise) codeExchange.current.finish(exchangePromise);
      if (requestId === authRequest.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Lắng nghe sự thay đổi trạng thái SSO từ các tab khác
    const handleStorage = (e) => {
      if (e.key === 'vInfiSSO-state' || e.key === 'sso_logged_out') {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload?.type === 'logout') {
            // Tab khác đã logout → xóa local state, không gọi lại /sso/me
            ++authRequest.current;
            codeExchange.current.cancel();
            clearSsoBearerToken();
            safeStorage.setItem('sso_logged_out', '1');
            safeStorage.removeItem('sso_session_seen');
            setUser(null);
            hadSession.current = false;
            return;
          }
        } catch {}
        fetchUser();
      }
    };

    // Khi tab lấy lại focus, kiểm tra lại session (nhưng không re-auth nếu đã logout)
    const handleFocus = () => {
      const loggedOut = safeStorage.getItem('sso_logged_out');
      if (loggedOut) {
        ++authRequest.current;
        codeExchange.current.cancel();
        clearSsoBearerToken();
        setUser(null);
        return;
      }
      fetchUser();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUser]);

  const login = () => {
    // Ẩn toast khi user chủ động đăng nhập
    setSessionExpired(false);
    // Điều hướng sang trang đăng nhập SSO kèm theo URL trả về (redirect)
    window.location.href = getSsoLoginUrl({ VITE_SSO_URL: import.meta.env.VITE_SSO_URL }, window.location.href);
  };

  const logout = async () => {
    ++authRequest.current;
    codeExchange.current.cancel();
    try {
      // Revoke the active SSO session and clear this app's local state.
      await ssoFetch(`${SSO_BASE}/sso/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      clearSsoBearerToken();
      // Always clear local state regardless of API result
      // Đặt flag để ngăn tự đăng nhập lại khi SSO page reload
      safeStorage.setItem('sso_logged_out', '1');
      safeStorage.removeItem('sso_session_seen');
      safeStorage.setItem('vInfiSSO-state', JSON.stringify({ type: 'logout', t: Date.now() }));
      setUser(null);
      hadSession.current = false;
      // Không hiện toast khi user chủ động logout
      setSessionExpired(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetch: fetchUser,
      }}
    >
      {children}
      <SessionExpiredToast
        visible={sessionExpired}
        onClose={() => setSessionExpired(false)}
        onLogin={login}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
