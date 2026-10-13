import React, { useState, useEffect } from 'react';
import { notesApi } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Share2, X, Check, Copy, Eye, Pencil, Lock, Unlock,
  ShieldCheck, Trash2, Send, Loader2, AlertCircle, CheckCircle2,
  Link2, KeyRound,
} from 'lucide-react';

const APP_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : (import.meta.env.VITE_APP_URL || 'https://vunph.id.vn');

export default function NoteShareModal({ note, onClose, onUpdate, isLoggedIn }) {
  const { t } = useLanguage();
  const isGuest = !isLoggedIn;
  const [shareMode, setShareMode] = useState(note.shareMode || (isGuest ? 'edit' : 'none'));
  const [shareToken, setShareToken] = useState(note.shareToken || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePerm, setInvitePerm] = useState('view');
  const [sharedWith, setSharedWith] = useState(note.sharedWith || []);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState(null);
  // Password protection
  const [newPassword, setNewPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(!!note.sharePassword);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const shareLink = shareToken ? `${APP_BASE}/note/s/${shareToken}` : null;

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

  // Automatically enable edit share link for guests on modal open
  useEffect(() => {
    if (isGuest && (!note.shareToken || note.shareMode === 'none')) {
      applyShareMode('edit');
    }
  }, []);

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.getElementById('share-link-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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

  const handleSetPassword = async () => {
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await notesApi.setSharePassword(note.id, newPassword.trim() || null);
      const hasPw = !!newPassword.trim();
      setHasPassword(hasPw);
      setNewPassword('');
      setShowPasswordEdit(false);
      setPasswordMsg({
        type: 'success',
        text: hasPw ? t('share.password_success_set', 'Đã đặt mật khẩu thành công') : t('share.password_success_remove', 'Đã xóa mật khẩu'),
      });
      onUpdate?.({ sharePassword: newPassword.trim() || null });
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (e) {
      setPasswordMsg({ type: 'error', text: e.message });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="nn-overlay">
      <div
        className="nn-modal nn-modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Header */}
        <div className="nn-modal-header">
          <h2 className="nn-modal-title" id="share-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share2 size={18} strokeWidth={2.2} /> {t('share.title', 'Chia sẻ ghi chú')}
          </h2>
          <button
            className="nn-modal-close"
            onClick={onClose}
            aria-label={t('editor.btn_close', 'Đóng')}
            type="button"
            id="btn-share-modal-close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Share by link */}
        <div className="nn-share-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="nn-share-label" style={{ margin: 0, fontWeight: 600 }}>{t('share.link_section', 'Chia sẻ qua liên kết')}</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: shareMode !== 'none' ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {shareMode !== 'none' ? (
                <><CheckCircle2 size={13} strokeWidth={2.5} /> {t('share.status_on', 'Đang bật')}</>
              ) : (
                <><Lock size={13} strokeWidth={2} /> {t('share.status_off', 'Đang tắt')}</>
              )}
            </span>
          </div>

          {shareMode !== 'none' && shareLink ? (
            <div>
              {/* Link Input Row */}
              <div className="nn-share-link-row" style={{ marginBottom: 10 }}>
                <input
                  className="nn-share-link-input"
                  value={shareLink}
                  readOnly
                  onClick={(e) => e.target.select()}
                  aria-label={t('share.link_section', 'Link chia sẻ')}
                  id="share-link-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={copyLink}
                  type="button"
                  id="btn-copy-link"
                  style={{ flexShrink: 0, minWidth: 105, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {copied ? (
                    <><Check size={14} strokeWidth={2.5} /> {t('share.copied', 'Đã chép')}</>
                  ) : (
                    <><Copy size={14} strokeWidth={2} /> {t('share.copy', 'Sao chép')}</>
                  )}
                </button>
              </div>

              {/* Status info */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: 12,
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                {shareMode === 'edit' ? (
                  <>
                    <Pencil size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
                    <span>{t('share.perm_edit_tip', 'Quyền chỉnh sửa: Bất kỳ ai có liên kết này đều có thể xem và sửa nội dung trực tiếp.')}</span>
                  </>
                ) : (
                  <>
                    <Eye size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2, color: '#38bdf8' }} />
                    <span>{t('share.perm_view_tip', 'Chỉ xem: Bất kỳ ai có liên kết này chỉ có thể xem nội dung ghi chú.')}</span>
                  </>
                )}
              </div>

              {/* Mode switch */}
              {isGuest ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => applyShareMode('none')}
                    disabled={loading}
                    type="button"
                    id="btn-turn-off-share"
                  >
                    <Lock size={13} strokeWidth={2} /> {t('share.turn_off', 'Tắt chia sẻ')}
                  </button>
                </div>
              ) : (
                <div className="nn-share-mode-tabs" style={{ marginBottom: 0 }}>
                  <button
                    id="share-mode-view"
                    className={`nn-share-mode-tab${shareMode === 'view' ? ' active' : ''}`}
                    onClick={() => applyShareMode('view')}
                    disabled={loading}
                    type="button"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Eye size={13} strokeWidth={2} /> {t('share.tab_view', 'Chỉ xem')}
                  </button>
                  <button
                    id="share-mode-edit"
                    className={`nn-share-mode-tab${shareMode === 'edit' ? ' active' : ''}`}
                    onClick={() => applyShareMode('edit')}
                    disabled={loading}
                    type="button"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Pencil size={13} strokeWidth={2} /> {t('share.tab_edit', 'Cho phép sửa')}
                  </button>
                  <button
                    id="share-mode-none"
                    className="nn-share-mode-tab"
                    style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => applyShareMode('none')}
                    disabled={loading}
                    type="button"
                  >
                    <Lock size={13} strokeWidth={2} /> {t('share.tab_off', 'Tắt')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '18px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                {isGuest ? t('share.guest_desc', 'Liên kết chia sẻ cho phép người nhận chỉnh sửa ghi chú trực tiếp.') : t('share.user_desc', 'Tạo liên kết chia sẻ để gửi cho bất kỳ ai xem hoặc chỉnh sửa.')}
              </p>
              {isGuest ? (
                <button
                  className="btn btn-primary"
                  onClick={() => applyShareMode('edit')}
                  disabled={loading}
                  type="button"
                  id="btn-enable-guest-share"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {loading ? (
                    <><Loader2 size={14} className="nn-spin" /> {t('editor.btn_saving', 'Đang tạo…')}</>
                  ) : (
                    <><Link2 size={14} strokeWidth={2.2} /> {t('share.enable_guest_btn', 'Bật link chia sẻ (Sửa mặc định)')}</>
                  )}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => applyShareMode('view')}
                    disabled={loading}
                    type="button"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Eye size={14} strokeWidth={2} /> {t('share.create_view_link', 'Tạo link Chỉ xem')}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => applyShareMode('edit')}
                    disabled={loading}
                    type="button"
                  >
                    <Pencil size={14} strokeWidth={2} /> {t('share.create_edit_link', 'Tạo link Xem & Sửa')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Share with specific SSO users — only for logged-in */}
        {isLoggedIn && (
          <div className="nn-share-section">
            <span className="nn-share-label" style={{ fontWeight: 600 }}>{t('share.user_section', 'Chia sẻ cho người dùng cụ thể')}</span>

            <div className="nn-invite-row">
              <input
                className="nn-invite-input"
                type="email"
                placeholder={t('share.user_placeholder', 'Email tài khoản vInfi SSO...')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite(); }}
                id="invite-email-input"
                aria-label={t('share.user_section', 'Email người được mời')}
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
                aria-label={t('share.user_section', 'Quyền của người được mời')}
              >
                <option value="view">{t('share.perm_opt_view', 'Xem')}</option>
                <option value="edit">{t('share.perm_opt_edit', 'Sửa')}</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={handleSendInvite}
                disabled={loading || !inviteEmail.trim()}
                type="button"
                id="btn-send-invite"
                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {loading ? <Loader2 size={14} className="nn-spin" /> : <><Send size={14} strokeWidth={2} /> {t('share.send_invite', 'Gửi')}</>}
              </button>
            </div>

            {inviteSent && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} strokeWidth={2.5} /> {t('share.invite_sent', `Đã gửi lời mời tới ${inviteEmail || 'email'}`, { email: inviteEmail || 'email' })}
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
                      <div className="nn-shared-user-perm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {s.permission === 'edit' ? (
                          <><Pencil size={11} strokeWidth={2} /> {t('share.user_can_edit', 'Có thể sửa')}</>
                        ) : (
                          <><Eye size={11} strokeWidth={2} /> {t('share.user_view_only', 'Chỉ xem')}</>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleRemoveUser(s.userId)}
                      title={t('share.revoke_perm', 'Thu hồi quyền')}
                      aria-label={`${t('share.revoke_perm', 'Thu hồi quyền')} ${s.email || s.userId}`}
                      type="button"
                    >
                      <X size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: '8px 20px 12px', fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} strokeWidth={2} />
            {error}
          </div>
        )}

        {/* Password Protection Section */}
        {shareMode !== 'none' && (
          <div className="nn-share-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="nn-share-label" style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} strokeWidth={2.2} /> {t('share.password_title', 'Bảo vệ bằng mật khẩu')}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: hasPassword ? '#f59e0b' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {hasPassword ? (
                  <><Lock size={12} strokeWidth={2} /> {t('share.status_on', 'Đang bật')}</>
                ) : (
                  <><Unlock size={12} strokeWidth={2} /> {t('share.status_off', 'Chưa đặt')}</>
                )}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              {hasPassword
                ? t('share.password_desc_on', 'Người xem cần nhập mật khẩu để truy cập liên kết chia sẻ.')
                : t('share.password_desc_off', 'Thêm mật khẩu để bảo vệ link chia sẻ khỏi truy cập không mong muốn.')}
            </p>

            {!showPasswordEdit ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => { setShowPasswordEdit(true); setNewPassword(''); }}
                  type="button"
                  id="btn-edit-share-password"
                >
                  {hasPassword ? (
                    <><KeyRound size={13} strokeWidth={2} /> {t('share.password_change', 'Đổi mật khẩu')}</>
                  ) : (
                    <><Lock size={13} strokeWidth={2} /> {t('share.password_set', 'Đặt mật khẩu')}</>
                  )}
                </button>
                {hasPassword && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.82rem', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => { setNewPassword(''); handleSetPassword(); }}
                    disabled={savingPassword}
                    type="button"
                    id="btn-remove-share-password"
                  >
                    <Trash2 size={13} strokeWidth={2} /> {t('share.password_remove', 'Xoá mật khẩu')}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="password"
                  className="nn-share-link-input"
                  placeholder={t('share.password_placeholder', 'Nhập mật khẩu mới…')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSetPassword(); if (e.key === 'Escape') setShowPasswordEdit(false); }}
                  autoFocus
                  id="share-new-password-input"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSetPassword}
                  disabled={savingPassword}
                  type="button"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {savingPassword ? (
                    <Loader2 size={14} className="nn-spin" />
                  ) : (
                    <><Check size={14} strokeWidth={2.5} /> {t('share.password_save', 'Lưu')}</>
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowPasswordEdit(false)}
                  type="button"
                  style={{ flexShrink: 0 }}
                >
                  {t('share.password_cancel', 'Huỷ')}
                </button>
              </div>
            )}

            {passwordMsg && (
              <p style={{
                fontSize: '0.8rem',
                marginTop: 8,
                color: passwordMsg.type === 'error' ? '#f87171' : 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {passwordMsg.type === 'error' ? (
                  <AlertCircle size={13} strokeWidth={2} />
                ) : (
                  <Check size={13} strokeWidth={2.5} />
                )}
                {passwordMsg.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
