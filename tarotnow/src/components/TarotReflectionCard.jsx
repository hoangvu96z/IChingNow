import React, { useState, useEffect, useRef } from 'react';
import { REFLECTION_STATUSES } from '../utils/readingMapping.js';

export default function TarotReflectionCard({
  readingId,
  reading,
  onSaveReflection,
  language = 'vi',
  compact = false,
}) {
  const isEn = language === 'en';

  const initialStatus =
    reading?.verificationStatus ||
    reading?.data?.verificationStatus ||
    'pending';

  const initialNote =
    reading?.reflectionNote ||
    reading?.data?.reflectionNote ||
    '';

  const initialUpdatedAt =
    reading?.reflectionUpdatedAt ||
    reading?.data?.reflectionUpdatedAt ||
    null;

  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const resolvedReadingId = readingId || reading?.id || null;
  const readingTsKey = reading?.createdAt || reading?.timestamp || null;
  const isDirtyRef = useRef(false);
  const prevKeyRef = useRef({ id: resolvedReadingId, ts: readingTsKey });

  // Sync state whenever reading props update
  useEffect(() => {
    const prev = prevKeyRef.current;
    const sameReadingIdAssigned = Boolean(
      readingTsKey &&
      prev.ts === readingTsKey &&
      !prev.id &&
      resolvedReadingId
    );
    const switchingReading =
      prev.ts !== readingTsKey ||
      Boolean(prev.id && resolvedReadingId && String(prev.id) !== String(resolvedReadingId));
    prevKeyRef.current = { id: resolvedReadingId, ts: readingTsKey };

    if (sameReadingIdAssigned && isDirtyRef.current) {
      return;
    }

    setStatus(reading?.verificationStatus || reading?.data?.verificationStatus || 'pending');
    setNote(reading?.reflectionNote || reading?.data?.reflectionNote || '');
    isDirtyRef.current = false;
    if (switchingReading) {
      setSavedNotice('');
      setErrorMsg('');
    }
  }, [
    resolvedReadingId,
    readingTsKey,
    reading?.verificationStatus,
    reading?.data?.verificationStatus,
    reading?.reflectionNote,
    reading?.data?.reflectionNote,
  ]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!onSaveReflection || saving) return;

    setSaving(true);
    setSavedNotice('');
    setErrorMsg('');

    try {
      const updatedAt = new Date().toISOString();
      const targetId = readingId || reading?.id;
      await onSaveReflection(targetId, {
        verificationStatus: status,
        reflectionNote: note.trim(),
        reflectionUpdatedAt: updatedAt,
      });
      isDirtyRef.current = false;
      setSavedNotice(isEn ? '✓ Đã lưu chiêm nghiệm' : '✓ Đã lưu chiêm nghiệm');
      setTimeout(() => setSavedNotice(''), 4000);
    } catch (err) {
      setErrorMsg(
        err?.message ||
          (isEn ? 'Failed to save reflection' : 'Không thể lưu chiêm nghiệm')
      );
    } finally {
      setSaving(false);
    }
  };

  const currentUpdated = reading?.reflectionUpdatedAt || reading?.data?.reflectionUpdatedAt || initialUpdatedAt;

  return (
    <section className={`tarot-reflection-card${compact ? ' compact' : ''}`}>
      <div className="reflection-card-header">
        <h4 className="reflection-card-title">
          <span aria-hidden="true">📝</span>
          <span>{isEn ? 'Reading Reflection & Outcome Verification' : 'Chiêm Nghiệm & Đối Chứng Trải Bài'}</span>
        </h4>
        {currentUpdated && (
          <span className="reflection-card-updated">
            {isEn ? 'Updated: ' : 'Cập nhật: '}
            {new Date(currentUpdated).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
          </span>
        )}
      </div>

      {/* Verification Status Pills */}
      <div className="reflection-status-group" role="radiogroup" aria-label={isEn ? 'Outcome status' : 'Trạng thái nghiệm lý'}>
        {REFLECTION_STATUSES.map((st) => {
          const isSelected = status === st.id;
          return (
            <button
              key={st.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`reflection-status-btn${isSelected ? ' active' : ''}`}
              style={{
                background: isSelected ? st.bg : undefined,
                color: isSelected ? st.color : undefined,
                borderColor: isSelected ? st.border : undefined,
              }}
              onClick={() => {
                isDirtyRef.current = true;
                setStatus(st.id);
                setSavedNotice('');
              }}
            >
              {isEn ? st.labelEn : st.labelVi}
            </button>
          );
        })}
      </div>

      {/* Reflection Note Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          className="reflection-textarea"
          value={note}
          maxLength={1000}
          rows={compact ? 3 : 4}
          placeholder={
            isEn
              ? 'Record real-life outcomes and observations: did events resonate with the cards? How did the spread guide your mindset & actions? (Max 1000 chars)...'
              : 'Ghi chép diễn biến thực tế: sự việc diễn ra thế nào so với trải bài? Bạn đã áp dụng lời khuyên ra sao để điều hướng cuộc sống? (Tối đa 1000 ký tự)...'
          }
          onChange={(e) => {
            isDirtyRef.current = true;
            setNote(e.target.value);
            setSavedNotice('');
          }}
          aria-label={isEn ? 'Outcome reflection notes' : 'Ghi chú chiêm nghiệm thực tế'}
        />
      </div>

      {/* Footer: Character Count, Action Buttons, and Status Feedback */}
      <div className="reflection-footer">
        <span className="reflection-char-count">{note.length} / 1000</span>

        <div className="reflection-actions">
          {savedNotice && (
            <span role="status" className="reflection-saved-badge">
              {savedNotice}
            </span>
          )}
          {errorMsg && (
            <span role="alert" className="reflection-error-badge">
              {errorMsg}
            </span>
          )}

          <button
            type="button"
            className="reflection-save-btn"
            disabled={saving}
            onClick={handleSave}
          >
            <span aria-hidden="true">{saving ? '⏳' : '💾'}</span>
            <span>
              {saving
                ? isEn
                  ? 'Saving...'
                  : 'Đang lưu...'
                : isEn
                  ? 'Save reflection'
                  : 'Lưu chiêm nghiệm'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
