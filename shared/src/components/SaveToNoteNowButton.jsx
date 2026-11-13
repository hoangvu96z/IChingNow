import React, { useState, useCallback } from 'react';
import { getSsoApiBase } from '../utils/ssoConfig.mjs';
import { saveReadingToNoteNow } from '../utils/saveToNoteNow.mjs';

export default function SaveToNoteNowButton({
  buildPayload,
  isAuthenticated = false,
  ssoBase,
  language = 'vi',
  className = '',
  style = {},
  compact = false,
}) {
  const [saving, setSaving] = useState(false);
  const [savedResult, setSavedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isEn = language === 'en';

  const handleSave = useCallback(async () => {
    if (saving || typeof buildPayload !== 'function') return;
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = buildPayload();
      if (!payload) {
        setSaving(false);
        return;
      }
      const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
      const resolvedSsoBase = ssoBase !== undefined ? ssoBase : getSsoApiBase(env);
      const result = await saveReadingToNoteNow({
        ...payload,
        isAuthenticated,
        ssoBase: resolvedSsoBase,
        env,
      });
      setSavedResult(result);
    } catch (err) {
      setErrorMsg(
        err?.message ||
          (isEn ? 'Could not save to NoteNow.' : 'Không thể lưu sang NoteNow.'),
      );
    } finally {
      setSaving(false);
    }
  }, [buildPayload, isAuthenticated, isEn, saving, ssoBase]);

  return (
    <div
      className={`save-to-notenow-wrap ${className}`.trim()}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        minInlineSize: 0,
        ...style,
      }}
    >
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        aria-label={
          isEn
            ? 'Save reading and action checklist to NoteNow'
            : 'Lưu kết quả và checklist nghiệm lý sang NoteNow'
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          minBlockSize: '36px',
          minInlineSize: '36px',
          padding: compact ? '6px 12px' : '8px 14px',
          borderRadius: '999px',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          background: savedResult
            ? 'rgba(16, 185, 129, 0.18)'
            : 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          fontSize: compact ? '0.82rem' : '0.875rem',
          fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
          transition: 'background 0.18s ease, border-color 0.18s ease',
          lineHeight: 1.25,
        }}
      >
        <span aria-hidden="true">{savedResult ? '✓' : '📝'}</span>
        <span>
          {saving
            ? isEn
              ? 'Saving...'
              : 'Đang lưu...'
            : savedResult
              ? isEn
                ? 'Saved to NoteNow'
                : 'Đã lưu NoteNow'
              : isEn
                ? 'Save to NoteNow'
                : 'Lưu sang NoteNow'}
        </span>
      </button>

      {savedResult?.openUrl && (
        <a
          href={savedResult.openUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            minBlockSize: '32px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#059669',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textDecoration: 'none',
          }}
        >
          <span>{isEn ? 'Open NoteNow' : 'Mở NoteNow'}</span>
          <span aria-hidden="true">↗</span>
        </a>
      )}

      {errorMsg && (
        <span
          role="status"
          style={{
            fontSize: '0.78rem',
            color: '#ef4444',
          }}
        >
          {errorMsg}
        </span>
      )}
    </div>
  );
}
