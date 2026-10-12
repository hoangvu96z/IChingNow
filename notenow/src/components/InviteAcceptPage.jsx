import React, { useState, useEffect } from 'react';
import { notesApi, ssoApi } from '../api.js';

export default function InviteAcceptPage({ token, user, onAccepted }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) {
      setStatus('needs-login');
    } else {
      setStatus('ready');
    }
  }, [user]);

  const handleAccept = async () => {
    setStatus('loading');
    try {
      const res = await notesApi.acceptInvite(token);
      setStatus('success');
      setTimeout(() => onAccepted?.(res.noteId), 1500);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message);
    }
  };

  const loginUrl = ssoApi.getLoginUrl();

  return (
    <div className="nn-invite-page">
      <div className="nn-invite-card">
        {status === 'loading' && (
          <>
            <div className="nn-invite-icon">⏳</div>
            <h1 className="nn-invite-title">Đang xử lý…</h1>
          </>
        )}

        {status === 'needs-login' && (
          <>
            <div className="nn-invite-icon">🔐</div>
            <h1 className="nn-invite-title">Đăng nhập để chấp nhận</h1>
            <p className="nn-invite-text">
              Bạn cần đăng nhập vào tài khoản vInfi SSO có email khớp với lời mời để chấp nhận.
            </p>
            <a
              href={loginUrl}
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center' }}
              id="btn-invite-login"
            >
              🔐 Đăng nhập vInfi SSO
            </a>
          </>
        )}

        {status === 'ready' && (
          <>
            <div className="nn-invite-icon">📝</div>
            <h1 className="nn-invite-title">Lời mời chia sẻ ghi chú</h1>
            <p className="nn-invite-text">
              Bạn được mời xem / chỉnh sửa một ghi chú trên NoteNow.
            </p>
            <div className="nn-invite-note-box">
              📬 Nhấn chấp nhận để xem ghi chú được chia sẻ
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center' }}
              onClick={handleAccept}
              type="button"
              id="btn-accept-invite"
            >
              ✓ Chấp nhận lời mời
            </button>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="nn-invite-icon">🎉</div>
            <h1 className="nn-invite-title">Đã chấp nhận!</h1>
            <p className="nn-invite-text">
              Ghi chú đã được thêm vào board của bạn. Đang chuyển hướng…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="nn-invite-icon">❌</div>
            <h1 className="nn-invite-title">Không thể chấp nhận</h1>
            <p className="nn-invite-text">{errorMsg || 'Lời mời không hợp lệ hoặc đã hết hạn.'}</p>
            <a
              href={import.meta.env.BASE_URL || '/note/'}
              className="btn btn-ghost w-full"
              style={{ justifyContent: 'center' }}
              id="btn-go-home"
            >
              ← Về trang chính
            </a>
          </>
        )}
      </div>
    </div>
  );
}
