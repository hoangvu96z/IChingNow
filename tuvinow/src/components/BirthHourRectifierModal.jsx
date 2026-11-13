import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import { attachDialogLightDismiss } from '../../../shared/src/utils/pwaInstall.mjs';
import {
  SHICHEN_LABELS,
  RECTIFIER_EVENT_TYPES,
  evaluateBirthRectification,
} from '../utils/birthRectifier.js';

export default function BirthHourRectifierModal({
  isOpen,
  onClose,
  baseInput,
  initialEvents = [],
  onApplyCandidate,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const eventYearId = useId();
  const eventTypeId = useId();
  const eventNoteId = useId();

  const defaultPreset = Number(baseInput?.hourIndex) === 0 ? 'zi_boundary' : 'adjacent';
  const [preset, setPreset] = useState(defaultPreset);
  const [customHours, setCustomHours] = useState(() => {
    const h = Number(baseInput?.hourIndex) || 0;
    return [((h + 11) % 12), h, ((h + 1) % 12)];
  });
  const [includeLateZiNextDay, setIncludeLateZiNextDay] = useState(true);
  const [selectedTraitIds, setSelectedTraitIds] = useState([]);
  const [pastEvents, setPastEvents] = useState(() =>
    Array.isArray(initialEvents) ? initialEvents.slice(0, 5) : [],
  );

  const currentYear = new Date().getFullYear();
  const [draftYear, setDraftYear] = useState(String(Math.max(1990, currentYear - 2)));
  const [draftType, setDraftType] = useState('career_up');
  const [draftNote, setDraftNote] = useState('');
  const [eventError, setEventError] = useState('');

  // Wire native <dialog> light-dismiss fallback for browsers without native closedBy
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    return attachDialogLightDismiss(dialog);
  }, []);

  // Open / close imperatively via showModal() / close()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open && typeof dialog.showModal === 'function') {
        try {
          dialog.showModal();
        } catch {
          // Ignore if detached in non-DOM test environment
        }
      }
    } else if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    }
  }, [isOpen]);

  // Sync preset when user opens modal with hourIndex === 0
  useEffect(() => {
    if (isOpen) {
      const h = Number(baseInput?.hourIndex) || 0;
      setPreset(h === 0 ? 'zi_boundary' : 'adjacent');
      setCustomHours([((h + 11) % 12), h, ((h + 1) % 12)]);
    }
  }, [isOpen, baseInput?.hourIndex]);

  const handleNativeClose = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = '';
    }
    if (onClose) onClose();
  };

  const toggleCustomHour = (idx) => {
    setCustomHours((prev) => {
      if (prev.includes(idx)) {
        if (prev.length <= 2) return prev; // Keep at least 2 candidates
        return prev.filter((item) => item !== idx);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), idx];
      }
      return [...prev, idx];
    });
  };

  const toggleTrait = (traitId) => {
    setSelectedTraitIds((prev) =>
      prev.includes(traitId) ? prev.filter((id) => id !== traitId) : [...prev, traitId],
    );
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    const y = Number(draftYear);
    const minBirthYear = Number(baseInput?.year || 1900) - 1;
    if (!Number.isInteger(y) || y < minBirthYear || y > currentYear + 1) {
      setEventError(`Vui lòng nhập năm sự kiện hợp lệ (${minBirthYear}–${currentYear}).`);
      return;
    }
    if (pastEvents.length >= 5) {
      setEventError('Tối đa 5 mốc sự kiện thực tế cho mỗi lần khảo chứng.');
      return;
    }
    setEventError('');
    const meta = RECTIFIER_EVENT_TYPES.find((item) => item.id === draftType);
    setPastEvents((prev) => [
      ...prev,
      {
        id: `rect_ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        year: y,
        eventType: draftType,
        label: meta?.label || draftType,
        note: draftNote.trim(),
      },
    ]);
    setDraftNote('');
  };

  const handleRemoveEvent = (id) => {
    setPastEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const evaluation = useMemo(() => {
    try {
      return evaluateBirthRectification({
        baseInput,
        preset,
        customHourIndices: customHours,
        includeLateZiNextDay,
        selectedTraitIds,
        pastEvents,
      });
    } catch (err) {
      return { error: err.message, candidates: [], ranked: [], topCandidate: null };
    }
  }, [baseInput, preset, customHours, includeLateZiNextDay, selectedTraitIds, pastEvents]);

  const handleApply = (candidate) => {
    if (onApplyCandidate) {
      onApplyCandidate(candidate, pastEvents);
    }
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      closedby="any"
      className="tv-native-dialog tv-rectifier-dialog"
      onClose={handleNativeClose}
    >
      <div className="tv-dialog-shell">
        <header className="tv-dialog-header">
          <div className="tv-dialog-title-group">
            <h2 id={titleId} className="tv-dialog-title">
              <span aria-hidden="true">🧭</span> Khảo Chứng &amp; Định Giờ Sinh Chuẩn
            </h2>
            <p className="tv-dialog-subtitle">
              Đối chiếu thực chứng Tính khí · Gia đạo · Vận hạn quá khứ giữa các canh giờ nghi vấn (không hộp đen).
            </p>
          </div>
          <button
            type="button"
            className="tv-dialog-close-btn"
            onClick={() => dialogRef.current?.close()}
            aria-label="Đóng bảng khảo chứng giờ sinh"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="tv-dialog-body">
          {/* Bước 1: Chọn phạm vi canh giờ cần đối chiếu */}
          <section className="tv-rect-section" aria-label="Chọn phạm vi canh giờ nghi vấn">
            <div className="tv-rect-step-head">
              <span className="tv-rect-step-badge">Bước 1</span>
              <h3>Chọn nhóm canh giờ cần so sánh</h3>
            </div>

            <div className="tv-rect-preset-row" role="group" aria-label="Chế độ chọn canh giờ ứng viên">
              <button
                type="button"
                className={`tv-rect-preset-btn ${preset === 'adjacent' ? 'is-active' : ''}`}
                aria-pressed={preset === 'adjacent'}
                onClick={() => setPreset('adjacent')}
              >
                ⏱️ Sát ranh giới (Canh trước · Đang chọn · Canh sau)
              </button>
              <button
                type="button"
                className={`tv-rect-preset-btn ${preset === 'zi_boundary' ? 'is-active' : ''}`}
                aria-pressed={preset === 'zi_boundary'}
                onClick={() => setPreset('zi_boundary')}
              >
                🌙 Phân định Giờ Tý Sớm / Tý Đêm (23:00–00:59)
              </button>
              <button
                type="button"
                className={`tv-rect-preset-btn ${preset === 'custom' ? 'is-active' : ''}`}
                aria-pressed={preset === 'custom'}
                onClick={() => setPreset('custom')}
              >
                🎛️ Tự chọn 2–4 canh giờ bất kỳ
              </button>
            </div>

            {preset === 'custom' && (
              <div className="tv-rect-custom-picker">
                <p className="tv-rect-hint">Chọn từ 2 đến 4 canh giờ trong khoảng nghi vấn (ví dụ: 5h–9h sáng → chọn Mão &amp; Thìn):</p>
                <div className="tv-rect-shichen-grid">
                  {SHICHEN_LABELS.map((item) => {
                    const active = customHours.includes(item.index);
                    return (
                      <button
                        key={item.index}
                        type="button"
                        className={`tv-rect-shichen-chip ${active ? 'is-selected' : ''}`}
                        aria-pressed={active}
                        onClick={() => toggleCustomHour(item.index)}
                      >
                        <strong>Giờ {item.branch}</strong>
                        <span>{item.shortRange}</span>
                      </button>
                    );
                  })}
                </div>
                {customHours.includes(0) && (
                  <label className="tv-rect-checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeLateZiNextDay}
                      onChange={(e) => setIncludeLateZiNextDay(e.target.checked)}
                    />
                    <span>Tách riêng phương án Giờ Tý Đêm (23:00–23:59) chuyển sang ngày kế tiếp</span>
                  </label>
                )}
              </div>
            )}
          </section>

          {/* Bước 2: Đối chiếu đặc điểm thực tế trên từng lá số ứng viên */}
          <section className="tv-rect-section" aria-label="Đối chiếu đặc điểm tính khí và gia cảnh">
            <div className="tv-rect-step-head">
              <span className="tv-rect-step-badge">Bước 2</span>
              <h3>Tích chọn những đặc điểm ĐÚNG với thực tế của đương số</h3>
            </div>
            <p className="tv-rect-hint">
              Mỗi lá số bên dưới trích xuất trực tiếp từ sao tọa thủ cung Mệnh · Thân · Tật Ách · Phụ Mẫu · Huynh Đệ. Tích vào ô bạn thấy ứng nghiệm rõ nhất:
            </p>

            {evaluation.error ? (
              <div role="alert" className="tv-rect-error">
                ⚠️ {evaluation.error}
              </div>
            ) : (
              <div className="tv-rect-candidates-traits-grid">
                {evaluation.candidates.map((cand) => (
                  <div key={cand.id} className="tv-rect-trait-card">
                    <div className="tv-rect-trait-card-head">
                      <div>
                        <h4>{cand.label}</h4>
                        <span className="tv-rect-meta-line">
                          {cand.menhSummary} · {cand.thanSummary} · {cand.cucSummary}
                        </span>
                      </div>
                      {cand.matchedTraitCount > 0 && (
                        <span className="tv-rect-match-count">
                          ✓ {cand.matchedTraitCount} dấu hiệu
                        </span>
                      )}
                    </div>

                    <div className="tv-rect-trait-group-label">Tính khí · Diện mạo · Cơ địa</div>
                    <div className="tv-rect-trait-list">
                      {cand.traits.menhThanTat.map((trait) => {
                        const checked = selectedTraitIds.includes(trait.id);
                        return (
                          <label key={trait.id} className={`tv-rect-trait-item ${checked ? 'is-checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTrait(trait.id)}
                            />
                            <div className="tv-rect-trait-text">
                              <strong>{trait.title}</strong>
                              <span>{trait.description}</span>
                              <small>Căn cứ sao: {trait.evidence}</small>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="tv-rect-trait-group-label">Gia cảnh Cha Mẹ &amp; Anh Chị Em</div>
                    <div className="tv-rect-trait-list">
                      {cand.traits.family.map((trait) => {
                        const checked = selectedTraitIds.includes(trait.id);
                        return (
                          <label key={trait.id} className={`tv-rect-trait-item ${checked ? 'is-checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTrait(trait.id)}
                            />
                            <div className="tv-rect-trait-text">
                              <strong>{trait.title}</strong>
                              <span>{trait.description}</span>
                              <small>Căn cứ sao: {trait.evidence}</small>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bước 3: Kiểm chứng bằng các mốc sự kiện quá khứ */}
          <section className="tv-rect-section" aria-label="Kiểm chứng các mốc sự kiện quá khứ">
            <div className="tv-rect-step-head">
              <span className="tv-rect-step-badge">Bước 3</span>
              <h3>Thêm 1–5 năm biến cố / cột mốc đã xảy ra để Backtest Lưu Niên</h3>
            </div>
            <p className="tv-rect-hint">
              Hệ thống kiểm tra Lưu Thái Tuế, Tiểu Hạn, Đại Hạn và Lưu Niên Tứ Hóa của từng lá số vào đúng năm đó để tìm lá số ứng kỳ chuẩn nhất:
            </p>

            <form className="tv-rect-event-form" onSubmit={handleAddEvent}>
              <div className="tv-rect-event-field tv-rect-year-col">
                <label htmlFor={eventYearId}>Năm dương/âm</label>
                <input
                  id={eventYearId}
                  type="number"
                  min="1920"
                  max={currentYear + 1}
                  value={draftYear}
                  onChange={(e) => setDraftYear(e.target.value)}
                  placeholder="VD: 2022"
                />
              </div>

              <div className="tv-rect-event-field tv-rect-type-col">
                <label htmlFor={eventTypeId}>Loại biến cố / sự kiện thực tế</label>
                <select
                  id={eventTypeId}
                  value={draftType}
                  onChange={(e) => setDraftType(e.target.value)}
                >
                  {RECTIFIER_EVENT_TYPES.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.icon} {ev.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tv-rect-event-field tv-rect-note-col">
                <label htmlFor={eventNoteId}>Ghi chú ngắn (tùy chọn)</label>
                <input
                  id={eventNoteId}
                  type="text"
                  maxLength={120}
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="VD: Cưới tháng 10, thăng chức..."
                />
              </div>

              <div className="tv-rect-event-action">
                <button type="submit" className="tv-rect-add-event-btn">
                  + Thêm mốc
                </button>
              </div>
            </form>

            {eventError && (
              <p role="alert" className="tv-rect-inline-error">
                ⚠️ {eventError}
              </p>
            )}

            {pastEvents.length > 0 && (
              <div className="tv-rect-events-chips" aria-label="Danh sách mốc sự kiện đã nhập">
                {pastEvents.map((ev) => {
                  const meta = RECTIFIER_EVENT_TYPES.find((item) => item.id === ev.eventType);
                  return (
                    <span key={ev.id} className="tv-rect-event-chip">
                      <span>
                        <strong aria-hidden="true">{meta?.icon || '📌'}</strong>{' '}
                        <strong>{ev.year}:</strong> {meta?.label || ev.label}
                        {ev.note ? ` (${ev.note})` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(ev.id)}
                        aria-label={`Xóa mốc năm ${ev.year}`}
                      >
                        <span aria-hidden="true">✕</span>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {/* Kết quả xếp hạng ứng viên */}
          {!evaluation.error && evaluation.ranked.length > 0 && (
            <section className="tv-rect-section tv-rect-results-section" aria-label="Bảng xếp hạng lá số ứng viên">
              <div className="tv-rect-step-head">
                <span className="tv-rect-step-badge is-gold">Kết quả</span>
                <h3>Xếp hạng độ khớp nghiệm lý giữa các giờ sinh</h3>
              </div>

              <div className="tv-rect-ranked-list">
                {evaluation.ranked.map((cand, index) => {
                  const isTop = index === 0 && evaluation.hasUserSignals;
                  return (
                    <article
                      key={cand.id}
                      className={`tv-rect-ranked-card ${isTop ? 'is-top-match' : ''}`}
                    >
                      <div className="tv-rect-ranked-top">
                        <div className="tv-rect-ranked-heading">
                          <div className="tv-rect-rank-badges">
                            <span className="tv-rect-rank-num">Hạng #{index + 1}</span>
                            {isTop && (
                              <span className="tv-rect-recommended-pill">
                                ★ Khớp thực chứng cao nhất
                              </span>
                            )}
                            <span className="tv-rect-conf-pill">{cand.confidenceLabel}</span>
                          </div>
                          <h4>{cand.label}</h4>
                          <p className="tv-rect-ranked-meta">
                            {cand.menhSummary} · {cand.thanSummary} · {cand.cucSummary}
                            {cand.dayOffset !== 0 && (
                              <strong> · Đã cộng {cand.dayOffset > 0 ? `+${cand.dayOffset}` : cand.dayOffset} ngày (ÂL {cand.engineInput.lunarDay}/{cand.engineInput.lunarMonth}/{cand.engineInput.lunarYear})</strong>
                            )}
                          </p>
                        </div>

                        <div className="tv-rect-score-box">
                          <div className="tv-rect-score-val">{cand.matchScore}%</div>
                          <div className="tv-rect-score-lbl">Độ khớp nghiệm lý</div>
                        </div>
                      </div>

                      <ul className="tv-rect-evidence-list">
                        {cand.evidenceBullets.slice(0, 5).map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>

                      <div className="tv-rect-ranked-footer">
                        <button
                          type="button"
                          className="tv-rect-apply-btn"
                          onClick={() => handleApply(cand)}
                        >
                          ✓ Áp dụng giờ sinh này &amp; Lập lá số
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </dialog>
  );
}
