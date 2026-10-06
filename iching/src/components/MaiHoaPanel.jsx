import React, { useState, useCallback } from 'react';
import { buildMaiHoaResult, generateSerialSuggestions, getLunarInfo } from '../logic/maiHoa.js';
import { useLanguage } from '../context/LanguageContext.jsx';

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
    <div style={{
      marginTop: 10,
      padding: '10px 14px',
      background: 'rgba(184,134,11,0.07)',
      borderRadius: 8,
      border: '1px solid rgba(184,134,11,0.2)',
      fontSize: '0.8125rem',
      lineHeight: 1.7,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--color-gold)', marginBottom: 4, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('maihoa.lunar_preview', 'Âm lịch quy đổi')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
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
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(184,134,11,0.15)', color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>
        {language === 'en' ? 'Upper' : 'Số thượng'} = {yearChiNumber}+{monthNumber}+{dayNumber} = <strong style={{ color: 'var(--color-jade)' }}>{yearChiNumber+monthNumber+dayNumber}</strong>
        &nbsp;&nbsp;
        {language === 'en' ? 'Lower' : 'Số hạ'} = +{hourBranchInfo?.chiNumber} = <strong style={{ color: 'var(--color-jade)' }}>{yearChiNumber+monthNumber+dayNumber+hourBranchInfo?.chiNumber}</strong>
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
        <span className="banknote-tag">MAI HOA #{index + 1}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1rem' }}>💵</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            {t('maihoa.serial_tip', 'Gợi ý từ số hiện tại:')}
          </span>
          <span style={{ fontSize: '0.725rem', color: 'var(--color-ink-muted)', opacity: 0.85 }}>
            (8 tờ tiền ngẫu nhiên)
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="banknote-refresh-btn"
          style={{
            background: 'rgba(184, 134, 11, 0.08)',
            border: '1px solid rgba(184, 134, 11, 0.25)',
            cursor: 'pointer',
            fontSize: '0.775rem',
            color: 'var(--color-gold)',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184, 134, 11, 0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184, 134, 11, 0.08)'; }}
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
          z-index: 1;
        }

        .banknote-tag {
          font-size: 0.5rem;
          color: var(--color-ink-muted, #8c6d58);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 600;
          line-height: 1;
          opacity: 0.85;
        }

        .banknote-action {
          font-size: 0.55rem;
          color: var(--color-jade, #1a6b4a);
          font-weight: 700;
          line-height: 1;
        }

        @media (max-width: 480px) {
          .banknote-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px 4px;
          }
          .banknote-bill {
            padding: 4px 4px;
            min-height: 58px;
          }
          .banknote-tag {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Công thức giải thích ────────────────────────────────────────────────────
function FormulaBox({ mode }) {
  const { t, language } = useLanguage();
  const isTime = mode === 'time';
  return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(26,107,74,0.06)',
      borderRadius: 8,
      border: '1px solid rgba(26,107,74,0.2)',
      fontSize: '0.8125rem',
      color: 'var(--color-ink-muted)',
      lineHeight: 1.8,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--color-jade)', marginBottom: 3 }}>
        {language === 'en' ? 'Formula' : 'Công thức'}
      </div>
      {isTime ? (
        language === 'en' ? (
          <>
            Upper Trigram = (Year + Month + Day) mod 8<br />
            Lower Trigram = (Year + Month + Day + Hour) mod 8<br />
            Changing Line = (Year + Month + Day + Hour) mod 6
          </>
        ) : (
          <>
            Thượng quái = (Năm + Tháng + Ngày) mod 8<br />
            Hạ quái = (Năm + Tháng + Ngày + Giờ) mod 8<br />
            Hào động = (Năm + Tháng + Ngày + Giờ) mod 6
          </>
        )
      ) : (
        language === 'en' ? (
          <>
            Upper Trigram = Sum of first half mod 8<br />
            Lower Trigram = Sum of second half mod 8<br />
            Changing Line = Sum of all digits mod 6
          </>
        ) : (
          <>
            Thượng quái = Tổng nửa đầu mod 8<br />
            Hạ quái = Tổng nửa sau mod 8<br />
            Hào động = Tổng tất cả chữ số mod 6
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
            className="form-input"
            placeholder={t('maihoa.input_serial_placeholder', 'Nhập 2–8 chữ số (VD: 123456 hoặc 19452026)')}
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
