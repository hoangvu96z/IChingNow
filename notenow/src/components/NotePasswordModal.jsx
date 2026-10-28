import React, { useState, useEffect } from 'react';
import { notesApi } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Lock, Unlock, KeyRound, X, Trash2, Loader2, AlertCircle, ShieldCheck,
} from 'lucide-react';

/**
 * NotePasswordModal
 * - mode = 'unlock': Prompt user to enter the note's password before opening/editing/deleting.
 * - mode = 'manage': Set a password (if unlocked), or change/remove existing password.
 */
export default function NotePasswordModal({
  note,
  mode = 'manage',
  onClose,
  onUnlocked,
  onPasswordChanged,
}) {
  const { t } = useLanguage();
  const hasPassword = Boolean(note?.hasPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await notesApi.verifyNotePassword(note.id, currentPassword.trim());
      onUnlocked?.(currentPassword.trim());
    } catch (err) {
      setError(err.message || t('note_pw.wrong_password', 'Mật khẩu không đúng. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetOrChangeSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError(t('note_pw.empty_error', 'Vui lòng nhập mật khẩu mới'));
      return;
    }
    if (hasPassword && !currentPassword.trim()) {
      setError(t('note_pw.current_required', 'Vui lòng nhập mật khẩu hiện tại'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await notesApi.setNotePassword(
        note.id,
        newPassword.trim(),
        hasPassword ? currentPassword.trim() : null,
      );
      onPasswordChanged?.({
        hasPassword: true,
        unlockedPassword: newPassword.trim(),
        updated,
      });
      onClose?.();
    } catch (err) {
      setError(err.message || t('note_pw.save_error', 'Không thể lưu mật khẩu'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    if (hasPassword && !currentPassword.trim()) {
      setError(t('note_pw.current_required_remove', 'Nhập mật khẩu hiện tại để gỡ khoá'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await notesApi.setNotePassword(
        note.id,
        null,
        currentPassword.trim() || null,
      );
      onPasswordChanged?.({
        hasPassword: false,
        unlockedPassword: null,
        updated,
      });
      onClose?.();
    } catch (err) {
      setError(err.message || t('note_pw.wrong_password', 'Mật khẩu hiện tại không đúng'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="nn-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="nn-modal nn-modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-password-modal-title"
      >
        <div className="nn-modal-header">
          <h2
            className="nn-modal-title"
            id="note-password-modal-title"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {mode === 'unlock' ? (
              <>
                <Lock size={18} strokeWidth={2.2} style={{ color: 'var(--accent)' }} />
                {t('note_pw.unlock_title', 'Mở khoá ghi chú')}
              </>
            ) : (
              <>
                <ShieldCheck size={18} strokeWidth={2.2} style={{ color: 'var(--accent)' }} />
                {hasPassword
                  ? t('note_pw.manage_title_locked', 'Quản lý mật khẩu ghi chú')
                  : t('note_pw.manage_title_new', 'Đặt mật khẩu cho ghi chú')}
              </>
            )}
          </h2>
          <button
            className="nn-modal-close"
            onClick={onClose}
            aria-label={t('editor.btn_close', 'Đóng')}
            type="button"
            id="btn-note-password-close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="nn-share-section" style={{ borderBottom: 'none' }}>
          {mode === 'unlock' ? (
            <form onSubmit={handleUnlockSubmit}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                {t(
                  'note_pw.unlock_desc',
                  'Ghi chú này đã được khoá bằng mật khẩu. Vui lòng nhập mật khẩu để xem hoặc chỉnh sửa.',
                )}
              </p>

              <input
                type="password"
                className="nn-share-link-input"
                placeholder={t('note_pw.enter_placeholder', 'Nhập mật khẩu ghi chú…')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoFocus
                id="note-unlock-password-input"
                style={{ width: '100%', marginBottom: 12 }}
              />

              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#f87171',
                    fontSize: '0.82rem',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle size={14} strokeWidth={2} />
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                  id="btn-note-unlock-cancel"
                >
                  {t('share.password_cancel', 'Huỷ')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !currentPassword.trim()}
                  id="btn-note-unlock-submit"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="nn-spin" />
                      {t('share_gate.checking', 'Đang kiểm tra…')}
                    </>
                  ) : (
                    <>
                      <Unlock size={14} strokeWidth={2.2} />
                      {t('share_gate.unlock', 'Mở khoá')}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSetOrChangeSubmit}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                {hasPassword
                  ? t(
                      'note_pw.manage_desc_locked',
                      'Ghi chú đang được bảo vệ bằng mật khẩu ngay trên bảng của bạn. Nhập mật khẩu hiện tại để đổi hoặc gỡ khoá.',
                    )
                  : t(
                      'note_pw.manage_desc_new',
                      'Đặt mật khẩu để ẩn nội dung ghi chú trên bảng và yêu cầu mật khẩu khi mở hoặc xoá.',
                    )}
              </p>

              {hasPassword && (
                <div style={{ marginBottom: 12 }}>
                  <label
                    htmlFor="note-current-password-input"
                    style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}
                  >
                    {t('note_pw.current_label', 'Mật khẩu hiện tại')}
                  </label>
                  <input
                    type="password"
                    className="nn-share-link-input"
                    placeholder={t('note_pw.current_placeholder', 'Nhập mật khẩu hiện tại…')}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoFocus
                    id="note-current-password-input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="note-new-password-input"
                  style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}
                >
                  {hasPassword
                    ? t('note_pw.new_label_change', 'Mật khẩu mới (nếu muốn đổi)')
                    : t('note_pw.new_label_set', 'Mật khẩu bảo vệ ghi chú')}
                </label>
                <input
                  type="password"
                  className="nn-share-link-input"
                  placeholder={t('note_pw.new_placeholder', 'Nhập mật khẩu mới…')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus={!hasPassword}
                  id="note-new-password-input"
                  style={{ width: '100%' }}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#f87171',
                    fontSize: '0.82rem',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertCircle size={14} strokeWidth={2} />
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {hasPassword ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleRemovePassword}
                    disabled={loading}
                    id="btn-note-remove-password"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    {t('note_pw.btn_remove', 'Gỡ mật khẩu')}
                  </button>
                ) : (
                  <span />
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onClose}
                    id="btn-note-password-cancel"
                  >
                    {t('share.password_cancel', 'Huỷ')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !newPassword.trim()}
                    id="btn-note-password-save"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {loading ? (
                      <Loader2 size={14} className="nn-spin" />
                    ) : (
                      <>
                        <KeyRound size={14} strokeWidth={2.2} />
                        {hasPassword
                          ? t('note_pw.btn_update', 'Đổi mật khẩu')
                          : t('note_pw.btn_set', 'Đặt mật khẩu')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
