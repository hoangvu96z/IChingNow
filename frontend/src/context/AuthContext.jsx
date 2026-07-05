import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { username, tokens }
  const [token, setTokenState] = useState(() => localStorage.getItem('iching_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token value
  const setToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('iching_token', newToken);
      setTokenState(newToken);
    } else {
      localStorage.removeItem('iching_token');
      setTokenState(null);
      setUser(null);
    }
  };

  const logout = () => {
    setToken(null);
  };

  const fetchProfile = async (jwtToken) => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else {
        // Token expired/invalid
        logout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Đăng nhập không thành công.');
    }

    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Đăng ký không thành công.');
    }

    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const deductToken = (amount = 1) => {
    setUser(prev => prev ? { ...prev, tokens: Math.max(0, prev.tokens - amount) } : null);
  };

  const creditTokens = (amount) => {
    setUser(prev => prev ? { ...prev, tokens: prev.tokens + amount } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      deductToken,
      creditTokens
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
