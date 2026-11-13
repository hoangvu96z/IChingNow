import React, { useState, useMemo } from 'react';
import {
  lineValueToLine,
  trigramsToLineValues,
  lineValuesToTrigrams,
  buildHexagram,
} from '../logic/buildHexagram.js';
import { TRIGRAM_LIST, getHexagramUnicode } from '../logic/hexagramAtlas.js';
import { getCanChiFromDate } from '../logic/solarLunar.js';

const LINE_OPTIONS = [
  { val: 7, short: '7 · Thiếu Dương', symbol: '━━━', desc: 'Dương tĩnh', moving: false },
  { val: 8, short: '8 · Thiếu Âm', symbol: '━  ━', desc: 'Âm tĩnh', moving: false },
  { val: 9, short: '9 · Lão Dương ○', symbol: '━━━ ○', desc: 'Dương động → Âm', moving: true },
  { val: 6, short: '6 · Lão Âm ✕', symbol: '━ ✕ ━', desc: 'Âm động → Dương', moving: true },
];

const POS_NAMES = {
  1: 'Hào 1 (Sơ — Dưới cùng)',
  2: 'Hào 2 (Nhị)',
  3: 'Hào 3 (Tam)',
  4: 'Hào 4 (Tứ)',
  5: 'Hào 5 (Ngũ)',
  6: 'Hào 6 (Thượng — Trên cùng)',
};

/**
 * Nhập Quẻ Thực Tế / Sổ Tay (Real-Coin / Classical Book Hexagram Input)
 * Đồng bộ 2 chiều giữa:
 *   - Tab 1: Chọn từng hào 6 / 7 / 8 / 9 (từ Hào 1 dưới lên Hào 6 trên, hiển thị chuẩn Hào 6 trên → Hào 1 dưới)
 *   - Tab 2: Chọn Thượng Quái × Hạ Quái + đánh dấu Hào Động (1..6)
 * Hỗ trợ tùy chỉnh Ngày & Giờ lập quẻ (kèm xem trước Can Chi + Tuần Không trực tiếp).
 */
export default function ManualHexagramInput({
  formData,
  initialLineValues = null,
  onComplete,
  onCancel,
}) {
  const [subTab, setSubTab] = useState('lines'); // 'lines' | 'trigrams'
  const [lineValues, setLineValues] = useState(() =>
    Array.isArray(initialLineValues) && initialLineValues.length === 6
      ? [...initialLineValues]
      : [7, 7, 7, 7, 7, 7]
  );
  const [customDate, setCustomDate] = useState(() => formData?.castDate || '');
  const [customTime, setCustomTime] = useState(() => formData?.castTime || '12:00');
  const [localQuestion, setLocalQuestion] = useState(() => formData?.question || '');

  // Đồng bộ sang Thượng / Hạ Quái + Hào Động
  const { lowerBits, upperBits, movingIndices } = useMemo(
    () => lineValuesToTrigrams(lineValues),
    [lineValues]
  );

  // Xem trước trực tiếp Quẻ Chủ → Quẻ Biến & Can Chi
  const livePreview = useMemo(() => {
    return buildHexagram(
      lineValues,
      {
        ...formData,
        question: localQuestion || formData?.question || 'Nghiên cứu / Nhập quẻ thực tế',
        castDate: customDate || formData?.castDate,
        castTime: customTime || formData?.castTime,
      },
      'manual-input'
    );
  }, [lineValues, formData, localQuestion, customDate, customTime]);

  const liveCanChi = useMemo(() => {
    const d = customDate || formData?.castDate;
    const tm = customTime || formData?.castTime || '12:00';
    return d ? getCanChiFromDate(d, tm) : null;
  }, [customDate, customTime, formData?.castDate, formData?.castTime]);

  const handleSetLineValue = (lineIndex1Based, newVal) => {
    setLineValues((prev) => {
      const next = [...prev];
      next[lineIndex1Based - 1] = newVal;
      return next;
    });
  };

  const handleChangeUpper = (newUpperBits) => {
    setLineValues(trigramsToLineValues(newUpperBits, lowerBits, movingIndices));
  };

  const handleChangeLower = (newLowerBits) => {
    setLineValues(trigramsToLineValues(upperBits, newLowerBits, movingIndices));
  };

  const handleToggleMoving = (lineNo) => {
    const set = new Set(movingIndices);
    if (set.has(lineNo)) set.delete(lineNo);
    else set.add(lineNo);
    setLineValues(trigramsToLineValues(upperBits, lowerBits, [...set]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const lines = lineValues.map((v, i) => lineValueToLine(v, i + 1));
    onComplete(lines, {
      castDate: customDate || formData?.castDate,
      castTime: customTime || formData?.castTime,
      question: (localQuestion || formData?.question || 'Nghiên cứu quẻ thực tế / sổ tay').trim(),
    });
  };

  // Hiển thị từ Hào 6 (trên cùng) xuống Hào 1 (dưới cùng) chuẩn đồ hình Kinh Dịch
  const displayOrder = [6, 5, 4, 3, 2, 1];

  return (
    <form
      onSubmit={handleSubmit}
      className="card animate-in"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minInlineSize: 0 }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(184,134,11,0.2)',
          paddingBottom: 12,
        }}
      >
        <div style={{ minInlineSize: 0 }}>
          <div className="section-title" style={{ marginBottom: 4 }}>
            📜 Nhập Quẻ Thực Tế / Sổ Tay Nghiên Cứu
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', lineHeight: 1.45 }}>
            Nhập quẻ bạn vừa gieo bằng 3 đồng xu thật ngoài đời hoặc quẻ lưu trong sách cổ để lập bàn Lục Hào &amp; tính Ứng Kỳ.
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            className="btn-ghost iching-touch-control"
            onClick={onCancel}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            ← Đổi phương pháp
          </button>
        )}
      </div>

      {/* Nếu chưa nhập câu hỏi ở trên, cho phép nhập nhanh tại đây */}
      {!formData?.question?.trim() && (
        <div>
          <label
            htmlFor="manual-question-input"
            className="form-label"
            style={{ fontSize: '0.8rem', marginBottom: 4, display: 'block' }}
          >
            📝 Câu hỏi / Ghi chú ca nghiệm lý (tùy chọn):
          </label>
          <input
            id="manual-question-input"
            type="text"
            className="form-input iching-touch-control"
            placeholder="Ví dụ: Hỏi việc ký hợp đồng tháng này / Ca quẻ Tăng San Bốc Dịch..."
            value={localQuestion}
            onChange={(e) => setLocalQuestion(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Sub-tabs switcher */}
      <div
        role="tablist"
        aria-label="Cách nhập quẻ thủ công"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'lines'}
          className="iching-touch-control"
          onClick={() => setSubTab('lines')}
          style={{
            flex: '1 1 200px',
            padding: '9px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            background: subTab === 'lines' ? 'var(--color-gold, #8a6104)' : 'rgba(184,134,11,0.08)',
            color: subTab === 'lines' ? 'var(--color-on-gold, #fff)' : 'var(--color-ink)',
            border:
              subTab === 'lines'
                ? '1px solid var(--color-gold, #8a6104)'
                : '1px solid rgba(184,134,11,0.3)',
            borderBottom:
              subTab === 'lines' ? '3px solid var(--color-vermillion, #c0392b)' : undefined,
          }}
        >
          🪙 Nhập theo 6 Hào (Số 6 · 7 · 8 · 9)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'trigrams'}
          className="iching-touch-control"
          onClick={() => setSubTab('trigrams')}
          style={{
            flex: '1 1 200px',
            padding: '9px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            background:
              subTab === 'trigrams' ? 'var(--color-gold, #8a6104)' : 'rgba(184,134,11,0.08)',
            color: subTab === 'trigrams' ? 'var(--color-on-gold, #fff)' : 'var(--color-ink)',
            border:
              subTab === 'trigrams'
                ? '1px solid var(--color-gold, #8a6104)'
                : '1px solid rgba(184,134,11,0.3)',
            borderBottom:
              subTab === 'trigrams' ? '3px solid var(--color-vermillion, #c0392b)' : undefined,
          }}
        >
          ☯️ Chọn Thượng × Hạ Quái + Hào Động
        </button>
      </div>

      {/* Sub-tab 1: Chọn từng hào 6/7/8/9 */}
      {subTab === 'lines' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
            💡 Thứ tự hiển thị từ <strong>Hào 6 (trên cùng)</strong> xuống{' '}
            <strong>Hào 1 (dưới cùng)</strong> đúng như trên bàn quẻ. Quy ước 3 đồng xu (Ngửa=3, Sấp=2 hoặc Sấp=3, Ngửa=2 theo cổ pháp):{' '}
            <strong>7</strong> = Dương tĩnh, <strong>8</strong> = Âm tĩnh, <strong>9</strong> = Lão Dương động, <strong>6</strong> = Lão Âm động.
          </div>

          {displayOrder.map((lineNo) => {
            const currentVal = lineValues[lineNo - 1];
            return (
              <div
                key={lineNo}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background:
                    currentVal === 6 || currentVal === 9
                      ? 'rgba(192, 57, 43, 0.06)'
                      : 'rgba(184, 134, 11, 0.04)',
                  border:
                    currentVal === 6 || currentVal === 9
                      ? '1px solid rgba(192, 57, 43, 0.3)'
                      : '1px solid rgba(184, 134, 11, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-ink)' }}>
                    {POS_NAMES[lineNo]}
                  </span>
                  {(currentVal === 6 || currentVal === 9) && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--color-vermillion)',
                        padding: '1px 8px',
                        borderRadius: 999,
                        background: 'rgba(192, 57, 43, 0.1)',
                      }}
                    >
                      🔥 Hào động
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
                    gap: 6,
                  }}
                >
                  {LINE_OPTIONS.map((opt) => {
                    const selected = currentVal === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        aria-pressed={selected}
                        className="iching-touch-control"
                        onClick={() => handleSetLineValue(lineNo, opt.val)}
                        style={{
                          padding: '7px 8px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontWeight: selected ? 800 : 600,
                          fontSize: '0.78rem',
                          background: selected
                            ? opt.moving
                              ? 'var(--color-vermillion, #c0392b)'
                              : 'var(--color-gold, #8a6104)'
                            : 'var(--color-paper)',
                          color: selected ? '#ffffff' : 'var(--color-ink)',
                          border: selected
                            ? '1.5px solid transparent'
                            : '1px solid rgba(184,134,11,0.28)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {opt.symbol}
                        </span>
                        <span>{opt.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-tab 2: Chọn Thượng Quái × Hạ Quái + Hào Động */}
      {subTab === 'trigrams' && (
        <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label
                htmlFor="manual-upper-trigram"
                className="form-label"
                style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 5, display: 'block' }}
              >
                ☁️ Thượng Quái (Ngoại Quái — Hào 4, 5, 6):
              </label>
              <select
                id="manual-upper-trigram"
                className="form-input iching-touch-control"
                value={upperBits}
                onChange={(e) => handleChangeUpper(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem' }}
              >
                {TRIGRAM_LIST.map((tri) => (
                  <option key={tri.bits} value={tri.bits}>
                    {tri.glyph} {tri.nameVi} — {tri.nature} ({tri.element})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="manual-lower-trigram"
                className="form-label"
                style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 5, display: 'block' }}
              >
                ⛰️ Hạ Quái (Nội Quái — Hào 1, 2, 3):
              </label>
              <select
                id="manual-lower-trigram"
                className="form-input iching-touch-control"
                value={lowerBits}
                onChange={(e) => handleChangeLower(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem' }}
              >
                {TRIGRAM_LIST.map((tri) => (
                  <option key={tri.bits} value={tri.bits}>
                    {tri.glyph} {tri.nameVi} — {tri.nature} ({tri.element})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chọn Hào Động 1..6 */}
          <div>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-ink)',
                marginBottom: 6,
              }}
            >
              🔥 Đánh dấu Hào Động (có thể chọn 0, 1 hoặc nhiều hào):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((no) => {
                const checked = movingIndices.includes(no);
                return (
                  <button
                    key={no}
                    type="button"
                    aria-pressed={checked}
                    className="iching-touch-control"
                    onClick={() => handleToggleMoving(no)}
                    style={{
                      padding: '7px 13px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      background: checked
                        ? 'var(--color-vermillion, #c0392b)'
                        : 'rgba(184,134,11,0.08)',
                      color: checked ? '#fff' : 'var(--color-ink)',
                      border: checked
                        ? '1px solid var(--color-vermillion, #c0392b)'
                        : '1px solid rgba(184,134,11,0.3)',
                    }}
                  >
                    {checked ? '☑' : '☐'} Hào {no}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tùy chỉnh Ngày & Giờ lập quẻ (hữu ích cho sổ tay nghiên cứu ca cổ) */}
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          background: 'rgba(184,134,11,0.05)',
          border: '1px dashed rgba(184,134,11,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-ink)' }}>
          🗓️ Thời điểm gieo quẻ (Nhật thần &amp; Nguyệt kiến quyết định Vượng/Suy):
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 10,
          }}
        >
          <div>
            <label
              htmlFor="manual-cast-date"
              style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', display: 'block', marginBottom: 3 }}
            >
              Ngày Dương lịch
            </label>
            <input
              id="manual-cast-date"
              type="date"
              className="form-input iching-touch-control"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label
              htmlFor="manual-cast-time"
              style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', display: 'block', marginBottom: 3 }}
            >
              Giờ lập quẻ
            </label>
            <input
              id="manual-cast-time"
              type="time"
              className="form-input iching-touch-control"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {liveCanChi && (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', lineHeight: 1.45 }}>
            🧭 <strong>Can Chi tương ứng:</strong> Năm {liveCanChi.nam} · Tháng{' '}
            <strong>{liveCanChi.thang}</strong> · Ngày <strong>{liveCanChi.ngay}</strong> · Giờ{' '}
            {liveCanChi.gio} · Tuần Không:{' '}
            <strong>{(liveCanChi.khongVong || []).join(', ') || '-'}</strong>
          </div>
        )}
      </div>

      {/* Live Preview Quẻ Chủ → Quẻ Biến */}
      {livePreview?.primaryHexagram && (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: 'var(--color-paper)',
            border: '1px solid rgba(184,134,11,0.35)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, minInlineSize: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.9rem', lineHeight: 1 }} aria-hidden="true">
                {getHexagramUnicode(livePreview.primaryHexagram.id)}
              </span>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                  QUẺ CHỦ (#{livePreview.primaryHexagram.id} · Cung {livePreview.palaceName}-{livePreview.palaceElement})
                </div>
                <div
                  style={{
                    fontFamily: "'Noto Serif', serif",
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    color: 'var(--color-vermillion)',
                  }}
                >
                  {livePreview.primaryHexagram.nameVi} ({livePreview.primaryHexagram.nameZh})
                </div>
              </div>
            </div>

            {livePreview.changedHexagram && (
              <>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-gold)' }} aria-hidden="true">
                  →
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.9rem', lineHeight: 1 }} aria-hidden="true">
                    {getHexagramUnicode(livePreview.changedHexagram.id)}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', fontWeight: 700 }}>
                      QUẺ BIẾN (#{livePreview.changedHexagram.id} · Động hào {livePreview.movingLines.join(', ')})
                    </div>
                    <div
                      style={{
                        fontFamily: "'Noto Serif', serif",
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        color: 'var(--color-jade)',
                      }}
                    >
                      {livePreview.changedHexagram.nameVi} ({livePreview.changedHexagram.nameZh})
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary iching-touch-control"
            style={{
              padding: '10px 14px',
              fontWeight: 800,
              fontSize: '0.88rem',
              flex: '1 1 200px',
              maxInlineSize: '100%',
              minInlineSize: 0,
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            🔮 Lập Bàn Lục Hào &amp; Luận Giải
          </button>
        </div>
      )}
    </form>
  );
}
