import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Dev: VITE_SSO_URL trống → dùng relative path qua vite proxy (/sso/*)
// Prod: VITE_SSO_URL=https://sso.vunph.click → gọi thẳng tới SSO server
const SSO_BASE = import.meta.env.VITE_SSO_URL || '';

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  // Track nếu user đã từng đăng nhập thành công (để phân biệt với lần đầu vào app)
  const hadToken = useRef(!!localStorage.getItem('sso_token'));

  const fetchUser = useCallback(async () => {
    try {
      // 1. Tách sso_token từ URL query string nếu vừa redirect từ SSO về
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('sso_token');

      if (tokenFromUrl) {
        localStorage.setItem('sso_token', tokenFromUrl);
        // Xóa sso_token khỏi thanh địa chỉ URL mà không reload trang
        urlParams.delete('sso_token');
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        // Xóa flag logout vì user đang đăng nhập lại
        localStorage.removeItem('sso_logged_out');
        hadToken.current = true;
        // Ẩn toast nếu đang hiện
        setSessionExpired(false);
      }

      // 2. Đọc token từ localStorage
      const storedToken = localStorage.getItem('sso_token');
      const headers = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch(`${SSO_BASE}/sso/me`, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();

      if (data.user) {
        // Xóa flag logout khi xác thực thành công
        localStorage.removeItem('sso_logged_out');
        setUser(data.user);
        hadToken.current = true;
        setSessionExpired(false);
        if (data.token) {
          localStorage.setItem('sso_token', data.token);
        }
      } else {
        // User null → kiểm tra xem trước đó có token không (= token hết hạn)
        const wasLoggedIn = hadToken.current || !!storedToken;
        localStorage.removeItem('sso_token');
        setUser(null);

        if (wasLoggedIn) {
          // Chỉ hiện toast khi user đã từng đăng nhập → token hết hạn
          setSessionExpired(true);
          hadToken.current = false;
        }
      }
    } catch {
      // Lỗi network hoặc server → nếu có token cũ thì coi như expired
      const storedToken = localStorage.getItem('sso_token');
      if (storedToken || hadToken.current) {
        localStorage.removeItem('sso_token');
        setSessionExpired(true);
        hadToken.current = false;
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Lắng nghe sự thay đổi trạng thái SSO từ các tab khác
    const handleStorage = (e) => {
      if (e.key === 'vInfiSSO-state') {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload?.type === 'logout') {
            // Tab khác đã logout → xóa local state, không gọi lại /sso/me
            localStorage.removeItem('sso_token');
            localStorage.setItem('sso_logged_out', '1');
            setUser(null);
            hadToken.current = false;
            return;
          }
        } catch {}
        fetchUser();
      }
    };

    // Khi tab lấy lại focus, kiểm tra lại session (nhưng không re-auth nếu đã logout)
    const handleFocus = () => {
      const loggedOut = localStorage.getItem('sso_logged_out');
      if (loggedOut) {
        localStorage.removeItem('sso_token');
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
    const url = new URL(window.location.href);
    url.searchParams.delete('sso_token');
    const returnUrl = encodeURIComponent(url.toString());
    window.location.href = `${SSO_BASE}/ui/sso?redirect=${returnUrl}`;
  };

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('sso_token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

      // Call SSO logout API to invalidate server-side session/cookie (xóa ALL sessions của user)
      await fetch(`${SSO_BASE}/sso/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      // Always clear local state regardless of API result
      localStorage.removeItem('sso_token');
      // Đặt flag để ngăn tự đăng nhập lại khi SSO page reload
      localStorage.setItem('sso_logged_out', '1');
      localStorage.setItem('vInfiSSO-state', JSON.stringify({ type: 'logout', t: Date.now() }));
      setUser(null);
      hadToken.current = false;
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

