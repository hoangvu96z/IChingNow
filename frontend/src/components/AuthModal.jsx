import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function AuthModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      setLoading(false);
      return;
    }

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
        setLoading(false);
        return;
      }
    }

    try {
      if (activeTab === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(26, 10, 6, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="card animate-in" style={{
        background: 'var(--color-paper)',
        border: '2.5px solid var(--color-gold)',
        maxWidth: 400,
        width: '100%',
        padding: '24px 20px',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            fontWeight: 'bold',
            padding: '2px 8px'
          }}
        >
          ×
        </button>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(184, 134, 11, 0.25)', marginBottom: 20 }}>
          <button 
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              fontSize: '1.05rem',
              fontWeight: activeTab === 'login' ? 700 : 500,
              color: activeTab === 'login' ? 'var(--color-vermillion)' : 'var(--color-ink-muted)',
              borderBottom: activeTab === 'login' ? '3px solid var(--color-vermillion)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Đăng Nhập
          </button>
          <button 
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              fontSize: '1.05rem',
              fontWeight: activeTab === 'register' ? 700 : 500,
              color: activeTab === 'register' ? 'var(--color-vermillion)' : 'var(--color-ink-muted)',
              borderBottom: activeTab === 'register' ? '3px solid var(--color-vermillion)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Đăng Ký
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{
              background: 'rgba(192, 57, 43, 0.09)',
              border: '1px solid rgba(192, 57, 43, 0.3)',
              borderRadius: 6,
              color: 'var(--color-vermillion)',
              padding: '8px 12px',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          {activeTab === 'register' && (
            <div style={{
              background: 'rgba(26, 107, 74, 0.08)',
              border: '1px solid rgba(26, 107, 74, 0.25)',
              borderRadius: 6,
              color: 'var(--color-jade)',
              padding: '8px 12px',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}>
              🎁 Tạo tài khoản mới nhận ngay **3 Tokens** luận giải miễn phí!
            </div>
          )}

          <div>
            <label className="form-label">Tên đăng nhập</label>
            <input 
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              required
            />
          </div>

          <div>
            <label className="form-label">Mật khẩu</label>
            <input 
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="form-label">Nhập lại mật khẩu</label>
              <input 
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận lại mật khẩu..."
                required
              />
            </div>
          )}

          <button 
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 10, width: '100%' }}
          >
            {loading 
              ? 'Vui lòng chờ...' 
              : activeTab === 'login' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}
