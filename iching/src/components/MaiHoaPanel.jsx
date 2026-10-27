import React, { useState, useCallback } from 'react';
import { buildMaiHoaResult, generateSerialSuggestions, getLunarInfo } from '../logic/maiHoa.js';
import { useLanguage } from '../context/useLanguage.js';

// ─── Preview âm lịch + giờ địa chi ──────────────────────────────────────────
function LunarPreview({ dateStr, timeStr }) {
  const { t, language } = useLanguage();
  if (!dateStr) return null;
  const hour = timeStr ? parseInt(timeStr.split(':')[0], 10) : 0;
  const info = getLunarInfo(dateStr, hour);
  if (!info) return null;
  const { yearStemVi, yearChiName, yearChiNumber, monthNumber, dayNumber, hourBranchInfo, isLeapMonth } = info;

  const stemTrans = t(`stem.${yearStemVi}`, yearStemVi);
  const chiTrans = t(`branch.${yearChiName}`, yearChiName);
  const hourBranchTrans = hourBranchInfo ? t(`branch.${hourBranchInfo.nameVi.replace('Giờ ', '')}`, hourBranchInfo.nameVi) : '';

  return (
    <div className="maihoa-lunar-preview" style={{
      marginTop: 10,
      padding: '10px 14px',
      background: 'rgba(184,134,11,0.07)',
      borderRadius: 8,
      border: '1px solid rgba(184,134,11,0.2)',
      fontSize: '0.8125rem',
      lineHeight: 1.7,
    }}>
      <style>{`
        .maihoa-lunar-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px 16px;
        }
        .maihoa-lunar-calc-row {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid rgba(184,134,11,0.15);
          color: var(--color-ink-muted);
          font-size: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 4px 12px;
        }
        @media (max-width: 359px) {
          .maihoa-lunar-preview {
            padding: 8px 10px !important;
            font-size: 0.75rem !important;
          }
          .maihoa-lunar-grid {
            grid-template-columns: 1fr !important;
            gap: 2px 0 !important;
          }
          .maihoa-lunar-calc-row {
            flex-direction: column;
            gap: 2px !important;
            font-size: 0.72rem !important;
          }
        }
      `}</style>
      <div style={{ fontWeight: 700, color: 'var(--color-gold)', marginBottom: 4, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('maihoa.lunar_preview', 'Âm lịch quy đổi')}
      </div>
      <div className="maihoa-lunar-grid">
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>{t('maihoa.lunar_year', 'Năm')}: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{stemTrans} {chiTrans}</strong>
          <span style={{ color: 'var(--color-gold)', marginLeft: 4 }}>(# {yearChiNumber})</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>{t('maihoa.lunar_month', 'Tháng')}: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{monthNumber}</strong>
          {isLeapMonth && <span style={{ color: 'var(--color-vermillion)', marginLeft: 4 }}>{t('maihoa.lunar_leap', '(Nhuận)')}</span>}
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>{t('maihoa.lunar_day', 'Ngày')}: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{dayNumber}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>{t('maihoa.lunar_hour', 'Giờ')}: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{hourBranchTrans}</strong>
          <span style={{ color: 'var(--color-gold)', marginLeft: 4 }}>(# {hourBranchInfo?.chiNumber})</span>
        </div>
      </div>
      <div className="maihoa-lunar-calc-row">
        <span>
          {language === 'en' ? 'Upper' : 'Số thượng'} = {yearChiNumber}+{monthNumber}+{dayNumber} = <strong style={{ color: 'var(--color-jade)' }}>{yearChiNumber+monthNumber+dayNumber}</strong>
        </span>
        <span>
          {language === 'en' ? 'Lower' : 'Số hạ'} = {yearChiNumber+monthNumber+dayNumber} + {hourBranchInfo?.chiNumber} = <strong style={{ color: 'var(--color-jade)' }}>{yearChiNumber+monthNumber+dayNumber+hourBranchInfo?.chiNumber}</strong>
        </span>
      </div>
    </div>
  );
}

// ─── Serial digit preview ─────────────────────────────────────────────────────
function SerialPreview({ serial }) {
  const { t } = useLanguage();
  const cleaned = (serial || '').replace(/\D/g, '');
  if (cleaned.length < 2) return null;
  const mid    = Math.ceil(cleaned.length / 2);
  const first  = cleaned.slice(0, mid);
  const last   = cleaned.slice(mid);
  const sumFirst = first.split('').reduce((a, c) => a + parseInt(c), 0);
  const sumLast  = last.length > 0 ? last.split('').reduce((a, c) => a + parseInt(c), 0) : sumFirst;
  const sumAll   = sumFirst + sumLast;

  return (
    <div style={{
      marginTop: 10,
      padding: '10px 14px',
      background: 'rgba(184,134,11,0.07)',
      borderRadius: 8,
      border: '1px solid rgba(184,134,11,0.2)',
      fontSize: '0.8125rem',
      lineHeight: 1.8,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--color-gold)', marginBottom: 4, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('maihoa.serial_preview', 'Phân tích số')}
      </div>
      {/* Hiển thị 2 nửa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontFamily: "'Source Code Pro', monospace", fontSize: '1.1rem', letterSpacing: '0.1em' }}>
        <span style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 6, padding: '2px 10px', color: 'var(--color-vermillion)', fontWeight: 700 }}>{first}</span>
        {last && <>
          <span style={{ color: 'var(--color-ink-muted)' }}>|</span>
          <span style={{ background: 'rgba(26,107,74,0.12)', border: '1px solid rgba(26,107,74,0.3)', borderRadius: 6, padding: '2px 10px', color: 'var(--color-jade)', fontWeight: 700 }}>{last}</span>
        </>}
      </div>
      <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.8125rem' }}>
        <span>{t('maihoa.serial_upper', 'Số thượng')} = {first.split('').join('+')} = </span>
        <strong style={{ color: 'var(--color-vermillion)' }}>{sumFirst}</strong>
        {last && <>
          {'  ·  '}
          <span>{t('maihoa.serial_lower', 'Số hạ')} = {last.split('').join('+')} = </span>
          <strong style={{ color: 'var(--color-jade)' }}>{sumLast}</strong>
        </>}
        {'  ·  '}
        <span>{t('maihoa.serial_line', 'Số hào')} = </span>
        <strong style={{ color: 'var(--color-gold)' }}>{sumAll}</strong>
      </div>
    </div>
  );
}

// ─── Tờ tiền có số seri gợi ý (Banknote Card) ──────────────────────────────────
const SERIES_CODES = ['AA', 'VN', 'LK', 'QT', 'AB', 'KP', 'DL', 'MH'];

function BanknoteCard({ serial, index, onSelect }) {
  const series = SERIES_CODES[index % SERIES_CODES.length];
  const firstFour = serial.slice(0, 4);
  const lastFour = serial.slice(4);

  return (
    <button
      type="button"
      onClick={() => onSelect(serial)}
      title={`Chọn tờ tiền số seri: ${series} ${firstFour} ${lastFour}`}
      className="banknote-bill"
    >
      {/* Khung viền hoa văn an ninh kép bên trong */}
      <div className="banknote-inner-border" />

      {/* Dải chỉ kim tuyến bảo an (Security metallic strip) */}
      <div className="banknote-security-strip" />

      {/* Dấu mộc tròn đỏ mờ chìm (Watermark seal) */}
      <div className="banknote-watermark">
        <span>☯</span>
      </div>

      {/* Hàng trên: Series 2 chữ cái & Ký hiệu tiền tệ */}
      <div className="banknote-header">
        <div className="banknote-series">
          <span className="series-code">{series}</span>
          <span className="series-star">★</span>
        </div>
        <span className="banknote-currency">₫ VNĐ</span>
      </div>

      {/* Giữa tờ tiền: Số Seri màu đỏ dập nổi đặc trưng */}
      <div className="banknote-serial">
        <span>{firstFour}</span>
        <span className="serial-dot">·</span>
        <span>{lastFour}</span>
      </div>

      {/* Hàng dưới: Nhãn nhỏ Mai Hoa & nút chọn */}
      <div className="banknote-footer">
        <span className="banknote-tag">
          <span className="banknote-tag-full">MAI HOA #{index + 1}</span>
          <span className="banknote-tag-short">MH #{index + 1}</span>
        </span>
        <span className="banknote-action">CHỌN ↵</span>
      </div>
    </button>
  );
}

// ─── Số gợi ý ngẫu nhiên dạng tờ tiền (2 hàng x 4 tờ) ──────────────────────────
function SerialSuggestions({ suggestions, onSelect, onRefresh }) {
  const { t } = useLanguage();
  return (
    <div style={{ marginTop: 14 }}>
      <div className="banknote-header-row">
        <div className="banknote-header-left">
          <div className="banknote-header-primary">
            <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>💵</span>
            <span className="banknote-header-title">
              {t('maihoa.serial_tip', 'Gợi ý từ số hiện tại:')}
            </span>
          </div>
          <span className="banknote-header-sub">
            (8 tờ tiền ngẫu nhiên)
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="banknote-refresh-btn"
        >
          🔄 {t('history.clear_all', 'Làm mới').replace('Xóa tất cả', 'Làm mới').replace('Clear All', 'Refresh')}
        </button>
      </div>

      {/* Lưới 2 hàng mỗi hàng 4 tờ tiền */}
      <div className="banknote-grid">
        {suggestions.map((s, i) => (
          <BanknoteCard
            key={`${s}-${i}`}
            serial={s}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>

      <style>{`
        .banknote-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 8px;
        }

        .banknote-header-left {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 3px 6px;
          min-width: 0;
        }

        .banknote-header-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .banknote-header-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-ink);
          white-space: nowrap;
        }

        .banknote-header-sub {
          font-size: 0.725rem;
          color: var(--color-ink-muted);
          opacity: 0.85;
          white-space: nowrap;
        }

        .banknote-refresh-btn {
          flex-shrink: 0;
          background: rgba(184, 134, 11, 0.08);
          border: 1px solid rgba(184, 134, 11, 0.25);
          cursor: pointer;
          font-size: 0.775rem;
          color: var(--color-gold);
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .banknote-refresh-btn:hover {
          background: rgba(184, 134, 11, 0.18);
        }

        .banknote-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px 8px;
        }

        .banknote-bill {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 6px 8px;
          min-height: 66px;
          background: linear-gradient(135deg, #fefdfa 0%, #f6f1e5 50%, #eee6d4 100%);
          border: 1.5px solid rgba(184, 134, 11, 0.45);
          border-radius: 7px;
          box-shadow: 0 2px 5px rgba(44, 24, 16, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.7);
          cursor: pointer;
          text-align: left;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }

        .banknote-bill:hover {
          transform: translateY(-2px);
          border-color: var(--color-gold, #b8860b);
          box-shadow: 0 6px 14px rgba(184, 134, 11, 0.25), 0 2px 4px rgba(0, 0, 0, 0.08);
          background: linear-gradient(135deg, #ffffff 0%, #faf6ee 50%, #f2ebdb 100%);
        }

        .banknote-bill:active {
          transform: translateY(0) scale(0.98);
        }

        .banknote-inner-border {
          position: absolute;
          inset: 3px;
          border: 1px dashed rgba(184, 134, 11, 0.28);
          border-radius: 4px;
          pointer-events: none;
        }

        .banknote-security-strip {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 26%;
          width: 4px;
          background: linear-gradient(180deg, rgba(212,160,23,0.12) 0%, rgba(212,160,23,0.45) 50%, rgba(212,160,23,0.12) 100%);
          border-left: 0.5px solid rgba(184,134,11,0.2);
          border-right: 0.5px solid rgba(184,134,11,0.2);
          pointer-events: none;
        }

        .banknote-watermark {
          position: absolute;
          right: 4px;
          bottom: -4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(192, 57, 43, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(192, 57, 43, 0.22);
          font-size: 13px;
          font-weight: 800;
          pointer-events: none;
          transform: rotate(-12deg);
        }

        .banknote-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1;
        }

        .banknote-series {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .series-code {
          font-size: 0.625rem;
          font-weight: 800;
          color: var(--color-ink-muted, #6b4c3b);
          letter-spacing: 0.08em;
          font-family: 'Source Code Pro', monospace;
          line-height: 1;
        }

        .series-star {
          font-size: 0.5rem;
          color: rgba(184, 134, 11, 0.7);
        }

        .banknote-currency {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--color-gold, #b8860b);
          letter-spacing: 0.03em;
          line-height: 1;
          white-space: nowrap;
        }

        .banknote-serial {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 2px;
          font-family: 'Source Code Pro', 'Courier New', monospace;
          font-size: clamp(0.72rem, 1.25vw, 0.92rem);
          font-weight: 700;
          color: var(--color-vermillion, #c0392b);
          letter-spacing: 0.06em;
          text-shadow: 0 0.5px 1px rgba(192, 57, 43, 0.2);
          z-index: 1;
          margin: 1px 0;
          white-space: nowrap;
        }

        .serial-dot {
          font-size: 0.65rem;
          opacity: 0.45;
          margin: 0 1px;
        }

        .banknote-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
          z-index: 1;
        }

        .banknote-tag {
          font-size: 10px;
          color: #4a2e1b;
          background: rgba(255, 255, 255, 0.78);
          padding: 1px 4px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .banknote-tag-short {
          display: none;
        }
        .banknote-tag-full {
          display: inline;
        }

        .banknote-action {
          font-size: 10px;
          color: #0d5f38;
          background: rgba(26, 107, 74, 0.12);
          border: 0.5px solid rgba(26, 107, 74, 0.28);
          padding: 1px 5px;
          border-radius: 3px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          flex-shrink: 0;
        }

        [data-theme="dark"] .banknote-bill {
          background: linear-gradient(135deg, #251c14 0%, #1c140e 50%, #150f0a 100%);
          border-color: rgba(226, 181, 68, 0.35);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(226, 181, 68, 0.12);
        }
        [data-theme="dark"] .banknote-bill:hover {
          background: linear-gradient(135deg, #2d2218 0%, #231911 50%, #19120c 100%);
          border-color: var(--color-gold, #e2b544);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.6), 0 0 12px rgba(226, 181, 68, 0.2);
        }
        [data-theme="dark"] .banknote-tag {
          color: #f5ece0;
          background: rgba(45, 33, 24, 0.88);
          border: 0.5px solid rgba(226, 181, 68, 0.3);
        }
        [data-theme="dark"] .banknote-action {
          color: #4bc092;
          background: rgba(75, 192, 146, 0.15);
          border-color: rgba(75, 192, 146, 0.35);
        }

        .maihoa-serial-input::placeholder {
          font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
          letter-spacing: normal;
          font-size: 0.875rem;
        }

        @media (max-width: 520px) {
          .banknote-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .banknote-bill {
            padding: 5px 6px;
            min-height: 62px;
          }
          .banknote-inner-border {
            inset: 2px;
          }
          .banknote-serial {
            font-size: 0.85rem;
            letter-spacing: 0.04em;
          }
          .banknote-watermark {
            right: 2px;
            bottom: -6px;
            width: 24px;
            height: 24px;
            font-size: 11px;
            opacity: 0.15;
          }
          .banknote-security-strip {
            display: none;
          }
          .banknote-footer {
            gap: 2px;
            margin-top: 2px;
          }
          .banknote-tag {
            font-size: 11px;
            padding: 1px 1px;
          }
          .banknote-action {
            font-size: 11px;
            padding: 1px 2px;
          }
        }

        @media (max-width: 359px) {
          .banknote-tag-full {
            display: none;
          }
          .banknote-tag-short {
            display: inline;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Công thức giải thích ────────────────────────────────────────────────────
function FormulaBox({ mode }) {
  const { language } = useLanguage();
  const isTime = mode === 'time';
  return (
    <div className="maihoa-formula-box" style={{
      padding: '10px 14px',
      background: 'rgba(26,107,74,0.06)',
      borderRadius: 8,
      border: '1px solid rgba(26,107,74,0.2)',
      fontSize: '0.8125rem',
      color: 'var(--color-ink-muted)',
      lineHeight: 1.8,
    }}>
      <style>{`
        .maihoa-formula-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
        }
        .maihoa-formula-label {
          flex-shrink: 0;
        }
        .maihoa-formula-calc {
          text-align: right;
          white-space: nowrap;
        }
        @media (max-width: 520px) {
          .maihoa-formula-box {
            padding: 8px 10px !important;
            font-size: 0.74rem !important;
            line-height: 1.65 !important;
          }
        }
        @media (max-width: 359px) {
          .maihoa-formula-box {
            font-size: 0.7rem !important;
          }
          .maihoa-formula-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1px;
            margin-bottom: 4px;
          }
          .maihoa-formula-calc {
            text-align: left;
            padding-left: 8px;
          }
        }
      `}</style>
      <div style={{ fontWeight: 700, color: 'var(--color-jade)', marginBottom: 3 }}>
        {language === 'en' ? 'Formula' : 'Công thức'}
      </div>
      {isTime ? (
        language === 'en' ? (
          <>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Upper Trigram</span>
              <span className="maihoa-formula-calc">=&nbsp;(Year + Month + Day)&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Lower Trigram</span>
              <span className="maihoa-formula-calc">=&nbsp;(Year + Month + Day + Hour)&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Changing Line</span>
              <span className="maihoa-formula-calc">=&nbsp;(Year + Month + Day + Hour)&nbsp;mod&nbsp;6</span>
            </div>
          </>
        ) : (
          <>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Thượng quái</span>
              <span className="maihoa-formula-calc">=&nbsp;(Năm + Tháng + Ngày)&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Hạ quái</span>
              <span className="maihoa-formula-calc">=&nbsp;(Năm + Tháng + Ngày + Giờ)&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Hào động</span>
              <span className="maihoa-formula-calc">=&nbsp;(Năm + Tháng + Ngày + Giờ)&nbsp;mod&nbsp;6</span>
            </div>
          </>
        )
      ) : (
        language === 'en' ? (
          <>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Upper Trigram</span>
              <span className="maihoa-formula-calc">=&nbsp;Sum of first half&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Lower Trigram</span>
              <span className="maihoa-formula-calc">=&nbsp;Sum of second half&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Changing Line</span>
              <span className="maihoa-formula-calc">=&nbsp;Sum of all digits&nbsp;mod&nbsp;6</span>
            </div>
          </>
        ) : (
          <>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Thượng quái</span>
              <span className="maihoa-formula-calc">=&nbsp;Tổng nửa đầu&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Hạ quái</span>
              <span className="maihoa-formula-calc">=&nbsp;Tổng nửa sau&nbsp;mod&nbsp;8</span>
            </div>
            <div className="maihoa-formula-row">
              <span className="maihoa-formula-label">Hào động</span>
              <span className="maihoa-formula-calc">=&nbsp;Tổng tất cả chữ số&nbsp;mod&nbsp;6</span>
            </div>
          </>
        )
      )}
    </div>
  );
}

// ─── Panel thời gian ──────────────────────────────────────────────────────────
function TimeModePanel({ question, onResult, onReset }) {
  const { t } = useLanguage();
  const _now = new Date();
  const vnNow = new Date(_now.getTime() + (_now.getTimezoneOffset() * 60000) + (3600000 * 7));
  const pad   = n => String(n).padStart(2, '0');
  const today = `${vnNow.getFullYear()}-${pad(vnNow.getMonth()+1)}-${pad(vnNow.getDate())}`;
  const nowT  = `${pad(vnNow.getHours())}:${pad(vnNow.getMinutes())}`;

  const [dateStr, setDateStr] = useState(today);
  const [timeStr, setTimeStr] = useState(nowT);
  const [error,   setError]   = useState('');

  function fillNow() {
    const d = new Date();
    const vn = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (3600000 * 7));
    setDateStr(`${vn.getFullYear()}-${pad(vn.getMonth()+1)}-${pad(vn.getDate())}`);
    setTimeStr(`${pad(vn.getHours())}:${pad(vn.getMinutes())}`);
    onReset();
  }

  function handleCast() {
    setError('');
    if (!dateStr) { setError(t('maihoa.error_select_date', 'Vui lòng chọn ngày.')); return; }
    const result = buildMaiHoaResult({ subMode: 'time', dateStr, timeStr, question });
    if (!result) { setError(t('maihoa.error_lunar_calc', 'Không thể tính âm lịch. Hãy thử lại.')); return; }
    onResult(result);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Nút lấy giờ hiện tại */}
      <button
        onClick={fillNow}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'linear-gradient(135deg, rgba(184,134,11,0.12), rgba(184,134,11,0.06))',
          border: '1.5px solid rgba(184,134,11,0.35)',
          borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
          fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gold)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,134,11,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(184,134,11,0.12), rgba(184,134,11,0.06))'}
      >
        {t('maihoa.date_btn', '📅 Chọn ngày giờ hiện tại')}
      </button>

      {/* Ngày + Giờ */}
      <style>{`
        .maihoa-datetime-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 359px) {
          .maihoa-datetime-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
      <div className="maihoa-datetime-grid">
        <div>
          <label className="form-label">{t('form.moving_date_label', 'Ngày động tâm')}</label>
          <input type="date" className="form-input" value={dateStr}
            onChange={e => { setDateStr(e.target.value); onReset(); }} />
        </div>
        <div>
          <label className="form-label">{t('form.moving_time_label', 'Giờ động tâm')}</label>
          <input type="time" className="form-input" value={timeStr}
            onChange={e => { setTimeStr(e.target.value); onReset(); }} />
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '-8px', fontStyle: 'italic' }}>
        {t('maihoa.timezone_note', '* Note: The time of intent is defaulted to Indochina Time (UTC+7).')}
      </div>

      {/* Preview âm lịch */}
      <LunarPreview dateStr={dateStr} timeStr={timeStr} />

      <FormulaBox mode="time" />

      {error && <ErrorBox msg={error} />}

      <CastButton onClick={handleCast} disabled={!question?.trim()} />
      {!question?.trim() && <NeedQuestionHint />}
    </div>
  );
}

// ─── Panel số seri ────────────────────────────────────────────────────────────
function SerialModePanel({ question, onResult, onReset }) {
  const { t } = useLanguage();
  const [serial,      setSerial]      = useState('');
  const [suggestions, setSuggestions] = useState(() => generateSerialSuggestions());
  const [error,       setError]       = useState('');

  const refreshSuggestions = useCallback(() => setSuggestions(generateSerialSuggestions()), []);

  function handleInput(val) {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    setSerial(digits);
    onReset();
  }

  function handleCast() {
    setError('');
    const cleaned = serial.replace(/\D/g, '');
    if (cleaned.length < 2) { setError(t('maihoa.serial_format_err', 'Vui lòng nhập ít nhất 2 chữ số.')); return; }
    const result = buildMaiHoaResult({ subMode: 'serial', serial: cleaned, question });
    if (!result) { setError(t('maihoa.error_serial_calc', 'Lỗi tính toán. Kiểm tra lại số nhập.')); return; }
    onResult(result);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div>
        <label className="form-label">{t('maihoa.input_serial', 'Số lập quẻ (2–8 chữ số)')}</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            inputMode="numeric"
            className="form-input maihoa-serial-input"
            placeholder={t('maihoa.input_serial_placeholder', 'Nhập 2–8 chữ số')}
            value={serial}
            maxLength={8}
            onChange={e => handleInput(e.target.value)}
            style={{ fontFamily: "'Source Code Pro', monospace", letterSpacing: '0.12em', fontSize: '1.1rem', paddingRight: 60 }}
          />
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.75rem', color: serial.length >= 2 ? 'var(--color-jade)' : 'var(--color-ink-muted)',
            fontWeight: 600,
          }}>
            {serial.length}/8
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: 4 }}>
          {t('maihoa.input_serial_hint', 'Ví dụ: 123456, 19452026 (2–8 số)')}
        </div>
        <SerialPreview serial={serial} />
      </div>

      <SerialSuggestions
        suggestions={suggestions}
        onSelect={s => { setSerial(s); onReset(); }}
        onRefresh={refreshSuggestions}
      />

      <FormulaBox mode="serial" />

      {error && <ErrorBox msg={error} />}

      <CastButton onClick={handleCast} disabled={!question?.trim()} />
      {!question?.trim() && <NeedQuestionHint />}
    </div>
  );
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
function CastButton({ onClick, disabled }) {
  const { t } = useLanguage();
  return (
    <button className="btn-primary btn-cta" onClick={onClick} disabled={disabled} style={{ marginTop: 4 }}>
      {t('maihoa.calc_btn', '🌸 Lập quẻ Mai Hoa')}
    </button>
  );
}
function ErrorBox({ msg }) {
  return (
    <div style={{ padding: '8px 12px', background: 'rgba(192,57,43,0.08)', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--color-vermillion)', border: '1px solid rgba(192,57,43,0.2)' }}>
      ⚠ {msg}
    </div>
  );
}
function NeedQuestionHint() {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '8px 12px', background: 'rgba(192,57,43,0.08)', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--color-vermillion)', border: '1px solid rgba(192,57,43,0.2)' }}>
      {t('panel.need_question_warning', '⚠ Hãy nhập việc cần xem trước khi lập quẻ')}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MaiHoaPanel({ mode, question, onResult, onReset }) {
  const isTime = mode === 'mai-hoa-time';
  return isTime
    ? <TimeModePanel   question={question} onResult={onResult} onReset={onReset} />
    : <SerialModePanel question={question} onResult={onResult} onReset={onReset} />;
}
