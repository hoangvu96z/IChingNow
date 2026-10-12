import React, { useState } from 'react';
import { notesApi } from '../api.js';

const SSO_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_SSO_URL || 'https://sso.vunph.click').replace(/\/$/, '');

const APP_BASE = import.meta.env.VITE_APP_URL || (
  import.meta.env.DEV ? `http://localhost:5177` : 'https://vunph.id.vn'
);

export default function NoteShareModal({ note, onClose, onUpdate, isLoggedIn }) {
  const [shareMode, setShareMode] = useState(note.shareMode || 'none');
  const [shareToken, setShareToken] = useState(note.shareToken || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePerm, setInvitePerm] = useState('view');
  const [sharedWith, setSharedWith] = useState(note.sharedWith || []);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState(null);

  const shareLink = shareToken ? `${APP_BASE}/note/s/${shareToken}` : null;
  const isGuest = !isLoggedIn;

  const applyShareMode = async (mode) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await notesApi.updateShare(note.id, mode);
      setShareMode(mode);
      setShareToken(updated.shareToken || '');
      onUpdate?.({ shareMode: mode, shareToken: updated.shareToken });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    setError(null);
    setInviteSent(false);
    try {
      await notesApi.sendInvite(note.id, inviteEmail.trim(), invitePerm);
      setInviteSent(true);
      setInviteEmail('');
      setTimeout(() => setInviteSent(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      await notesApi.removeSharedUser(note.id, userId);
      setSharedWith((prev) => prev.filter((s) => s.userId !== userId));
      onUpdate?.({ sharedWith: sharedWith.filter((s) => s.userId !== userId) });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nn-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="nn-modal nn-modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Header */}
        <div className="nn-modal-header">
          <h2 className="nn-modal-title" id="share-modal-title">🔗 Chia sẻ ghi chú</h2>
          <button
            className="nn-modal-close"
            onClick={onClose}
            aria-label="Đóng"
            type="button"
            id="btn-share-modal-close"
          >
            ✕
          </button>
        </div>

        {/* Share by link */}
        <div className="nn-share-section">
          <span className="nn-share-label">Chia sẻ qua link</span>

          {isGuest ? (
            // Guest notes: always edit mode by default
            <div>
              <div className="nn-share-mode-tabs">
                <button
                  id="share-mode-none"
                  className={`nn-share-mode-tab${shareMode === 'none' ? ' active' : ''}`}
                  onClick={() => applyShareMode('none')}
                  disabled={loading}
                  type="button"
                >
                  🔒 Tắt
                </button>
                <button
                  id="share-mode-edit"
                  className={`nn-share-mode-tab${shareMode === 'edit' ? ' active' : ''}`}
                  onClick={() => applyShareMode('edit')}
                  disabled={loading}
                  type="button"
                >
                  ✏️ Ai có link đều sửa được
                </button>
              </div>
              {shareMode === 'edit' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  ℹ️ Với note khách, link chia sẻ cho phép chỉnh sửa mặc định
                </p>
              )}
            </div>
          ) : (
            // Logged-in user: choose view/edit
            <div className="nn-share-mode-tabs">
              <button
                id="share-mode-none"
                className={`nn-share-mode-tab${shareMode === 'none' ? ' active' : ''}`}
                onClick={() => applyShareMode('none')}
                disabled={loading}
                type="button"
              >
                🔒 Riêng tư
              </button>
              <button
                id="share-mode-view"
                className={`nn-share-mode-tab${shareMode === 'view' ? ' active' : ''}`}
                onClick={() => applyShareMode('view')}
                disabled={loading}
                type="button"
              >
                👁️ Xem
              </button>
              <button
                id="share-mode-edit"
                className={`nn-share-mode-tab${shareMode === 'edit' ? ' active' : ''}`}
                onClick={() => applyShareMode('edit')}
                disabled={loading}
                type="button"
              >
                ✏️ Sửa
              </button>
            </div>
          )}

          {shareMode !== 'none' && shareLink && (
            <div className="nn-share-link-row">
              <input
                className="nn-share-link-input"
                value={shareLink}
                readOnly
                onClick={(e) => e.target.select()}
                aria-label="Link chia sẻ"
                id="share-link-input"
              />
              <button
                className={`btn btn-primary`}
                onClick={copyLink}
                type="button"
                id="btn-copy-link"
                style={{ flexShrink: 0 }}
              >
                {copied ? '✓ Đã chép' : '📋 Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Share with specific SSO users — only for logged-in */}
        {isLoggedIn && (
          <div className="nn-share-section">
            <span className="nn-share-label">Chia sẻ cho người dùng cụ thể</span>

            <div className="nn-invite-row">
              <input
                className="nn-invite-input"
                type="email"
                placeholder="Email tài khoản vInfi SSO..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite(); }}
                id="invite-email-input"
                aria-label="Email người được mời"
              />
              <select
                value={invitePerm}
                onChange={(e) => setInvitePerm(e.target.value)}
                style={{
                  padding: '0 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  height: 38,
                  cursor: 'pointer',
                }}
                id="invite-perm-select"
                aria-label="Quyền của người được mời"
              >
                <option value="view">Xem</option>
                <option value="edit">Sửa</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={handleSendInvite}
                disabled={loading || !inviteEmail.trim()}
                type="button"
                id="btn-send-invite"
                style={{ flexShrink: 0 }}
              >
                {loading ? '⏳' : 'Gửi'}
              </button>
            </div>

            {inviteSent && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 6 }}>
                ✓ Đã gửi lời mời tới {inviteEmail || 'email'}
              </p>
            )}

            {/* List shared users */}
            {sharedWith.length > 0 && (
              <div className="nn-shared-users" style={{ marginTop: 12 }}>
                {sharedWith.map((s) => (
                  <div key={s.userId} className="nn-shared-user">
                    <div className="nn-shared-user-avatar">
                      {s.email ? s.email[0].toUpperCase() : '?'}
                    </div>
                    <div className="nn-shared-user-info">
                      <div className="nn-shared-user-email">{s.email || s.userId}</div>
                      <div className="nn-shared-user-perm">
                        {s.permission === 'edit' ? '✏️ Có thể sửa' : '👁️ Chỉ xem'}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleRemoveUser(s.userId)}
                      title="Thu hồi quyền"
                      aria-label={`Thu hồi quyền của ${s.email || s.userId}`}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: '8px 20px 12px', fontSize: '0.8rem', color: '#f87171' }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}
