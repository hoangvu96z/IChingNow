import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  VERIFICATION_STATUSES,
  VERIFICATION_META,
  getVerificationForReading,
} from '../logic/verification.js';
import { getCanChiFromDate } from '../logic/solarLunar.js';

/**
 * Thẻ Nhật Ký Nghiệm Lý (Outcome Verification) — đối chiếu kết quả thực tế & Ứng Kỳ.
 */
export default function OutcomeVerificationCard({
  readingId,
  result,
  onSaveVerification,
  compact = false,
}) {
  const existing = useMemo(
    () => getVerificationForReading(readingId, result),
    [readingId, result]
  );

  const [status, setStatus] = useState(existing?.status || 'pending');
  const [actualDate, setActualDate] = useState(existing?.actualDate || '');
  const [note, setNote] = useState(existing?.note || '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [saveError, setSaveError] = useState('');

  const createdAt = result?.createdAt;
  const embeddedVerification = result?.verification;
  const isDirtyRef = useRef(false);
  const prevIdentityRef = useRef({ readingId, createdAt });

  useEffect(() => {
    const prev = prevIdentityRef.current;
    const sameCastIdAssigned = Boolean(
      createdAt &&
      prev.createdAt === createdAt &&
      !prev.readingId &&
      readingId
    );
    const switchingReading =
      prev.createdAt !== createdAt ||
      Boolean(prev.readingId && readingId && String(prev.readingId) !== String(readingId));
    prevIdentityRef.current = { readingId, createdAt };

    if (sameCastIdAssigned && isDirtyRef.current) {
      return;
    }

    const cur = getVerificationForReading(readingId, {
      createdAt,
      verification: embeddedVerification,
    });
    setStatus(cur?.status || 'pending');
    setActualDate(cur?.actualDate || '');
    setNote(cur?.note || '');
    isDirtyRef.current = false;
    if (switchingReading) {
      setSavedNotice('');
      setSaveError('');
    }
  }, [readingId, createdAt, embeddedVerification]);

  const actualCanChi = useMemo(() => {
    if (!actualDate || !/^\d{4}-\d{2}-\d{2}$/.test(actualDate)) return null;
    return getCanChiFromDate(actualDate, '12:00');
  }, [actualDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSaveVerification) return;
    setSaving(true);
    setSavedNotice('');
    setSaveError('');
    try {
      await onSaveVerification(
        readingId,
        { status, actualDate, note },
        result?.createdAt || null
      );
      isDirtyRef.current = false;
      setSavedNotice('✓ Đã lưu nghiệm lý thành công');
    } catch (err) {
      setSaveError(err?.message || 'Đã lưu cục bộ (chưa thể đồng bộ máy chủ)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={compact ? '' : 'card animate-in'}
      style={{
        padding: compact ? 14 : 20,
        borderRadius: compact ? 10 : undefined,
        border: compact ? '1px solid rgba(184, 134, 11, 0.28)' : undefined,
        background: compact ? 'rgba(184, 134, 11, 0.04)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minInlineSize: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div className="section-title" style={{ margin: 0, fontSize: compact ? '0.92rem' : undefined }}>
          📝 Nhật Ký Nghiệm Lý (Đối Chiếu Thực Tế)
        </div>
        {existing?.updatedAt && (
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: VERIFICATION_META[status]?.bg,
              color: VERIFICATION_META[status]?.color,
              border: `1px solid ${VERIFICATION_META[status]?.border}`,
            }}
          >
            {VERIFICATION_META[status]?.labelVi}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 4 Trạng thái Nghiệm Lý */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
            Kết quả thực tế so với lời đoán:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VERIFICATION_STATUSES.map((key) => {
              const meta = VERIFICATION_META[key];
              const active = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  className="iching-touch-control"
                  onClick={() => {
                    isDirtyRef.current = true;
                    setStatus(key);
                    setSavedNotice('');
                    setSaveError('');
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: active ? 800 : 600,
                    background: active ? meta.bg : 'var(--color-paper)',
                    color: active ? meta.color : 'var(--color-ink)',
                    border: active
                      ? `1.5px solid ${meta.color}`
                      : '1px solid rgba(184, 134, 11, 0.25)',
                  }}
                >
                  {meta.labelVi}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ngày ứng nghiệm thực tế */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 10,
            alignItems: 'end',
          }}
        >
          <div>
            <label
              htmlFor={`verify-date-${readingId || 'active'}`}
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-ink-muted)', display: 'block', marginBottom: 4 }}
            >
              📅 Ngày ứng nghiệm thực tế:
            </label>
            <input
              id={`verify-date-${readingId || 'active'}`}
              type="date"
              className="form-input iching-touch-control"
              value={actualDate}
              onChange={(e) => {
                isDirtyRef.current = true;
                setActualDate(e.target.value);
                setSavedNotice('');
                setSaveError('');
              }}
              style={{ width: '100%' }}
            />
          </div>

          {actualCanChi && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(184, 134, 11, 0.08)',
                border: '1px dashed rgba(184, 134, 11, 0.3)',
                fontSize: '0.78rem',
                color: 'var(--color-ink)',
              }}
            >
              Can Chi ngày ứng: <strong>{actualCanChi.ngay}</strong> (Tháng {actualCanChi.thang})
            </div>
          )}
        </div>

        {/* Ghi chú diễn biến thực tế */}
        <div>
          <label
            htmlFor={`verify-note-${readingId || 'active'}`}
            style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-ink-muted)', display: 'block', marginBottom: 4 }}
          >
            ✍️ Ghi chú thực tế diễn ra &amp; bài học rút ra:
          </label>
          <textarea
            id={`verify-note-${readingId || 'active'}`}
            className="form-input"
            rows={compact ? 2 : 3}
            placeholder="Ghi lại diễn biến thực tế, ứng vào hào nào / ngày Chi nào để đúc kết kinh nghiệm..."
            value={note}
            onChange={(e) => {
              isDirtyRef.current = true;
              setNote(e.target.value);
              setSavedNotice('');
              setSaveError('');
            }}
            style={{ width: '100%', resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: '0.78rem', minInlineSize: 0 }}>
            {savedNotice && (
              <span role="status" style={{ color: 'var(--color-jade, #1a6b4a)', fontWeight: 700 }}>
                {savedNotice}
              </span>
            )}
            {saveError && (
              <span role="alert" style={{ color: 'var(--color-vermillion)', fontWeight: 600 }}>
                {saveError}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary iching-touch-control"
            style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            {saving ? 'Đang lưu...' : '💾 Lưu Nghiệm Lý'}
          </button>
        </div>
      </form>
    </section>
  );
}
