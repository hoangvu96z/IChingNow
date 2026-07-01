import React, { useState, useCallback } from 'react';
import { buildMaiHoaResult, generateSerialSuggestions, getLunarInfo, getHourBranchInfo } from '../logic/maiHoa.js';

// ─── Preview âm lịch + giờ địa chi ──────────────────────────────────────────
function LunarPreview({ dateStr, timeStr }) {
  if (!dateStr) return null;
  const hour = timeStr ? parseInt(timeStr.split(':')[0], 10) : 0;
  const info = getLunarInfo(dateStr, hour);
  if (!info) return null;
  const { yearStemVi, yearChiName, yearChiNumber, monthNumber, dayNumber, hourBranchInfo, isLeapMonth } = info;

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
        Âm lịch quy đổi
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>Năm: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{yearStemVi} {yearChiName}</strong>
          <span style={{ color: 'var(--color-gold)', marginLeft: 4 }}>(số {yearChiNumber})</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>Tháng: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{monthNumber}</strong>
          {isLeapMonth && <span style={{ color: 'var(--color-vermillion)', marginLeft: 4 }}>(Nhuận)</span>}
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>Ngày: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{dayNumber}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-ink-muted)' }}>Giờ: </span>
          <strong style={{ color: 'var(--color-ink)' }}>{hourBranchInfo.nameVi}</strong>
          <span style={{ color: 'var(--color-gold)', marginLeft: 4 }}>(số {hourBranchInfo.chiNumber})</span>
        </div>
      </div>
      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(184,134,11,0.15)', color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>
        Số thượng = {yearChiNumber}+{monthNumber}+{dayNumber} = <strong style={{ color: 'var(--color-jade)' }}>{yearChiNumber+monthNumber+dayNumber}</strong>
        &nbsp;&nbsp;
        Số hạ = +{hourBranchInfo.chiNumber} = <strong style={{ color: 'var(--color-jade)' }}>{yearChiNumber+monthNumber+dayNumber+hourBranchInfo.chiNumber}</strong>
      </div>
    </div>
  );
}

// ─── Serial digit preview ─────────────────────────────────────────────────────
function SerialPreview({ serial }) {
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
        Phân tích số
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
        <span>Số thượng = {first.split('').join('+')} = </span>
        <strong style={{ color: 'var(--color-vermillion)' }}>{sumFirst}</strong>
        {last && <>
          {'  ·  '}
          <span>Số hạ = {last.split('').join('+')} = </span>
          <strong style={{ color: 'var(--color-jade)' }}>{sumLast}</strong>
        </>}
        {'  ·  '}
        <span>Số hào = </span>
        <strong style={{ color: 'var(--color-gold)' }}>{sumAll}</strong>
      </div>
    </div>
  );
}

// ─── Số gợi ý ngẫu nhiên ──────────────────────────────────────────────────────
function SerialSuggestions({ suggestions, onSelect, onRefresh }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>Số gợi ý ngẫu nhiên</span>
        <button
          onClick={onRefresh}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-gold)', fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}
        >
          🔄 Làm mới
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            style={{
              background: 'rgba(184,134,11,0.08)',
              border: '1.5px solid rgba(184,134,11,0.3)',
              borderRadius: 6,
              padding: '5px 10px',
              cursor: 'pointer',
              fontFamily: "'Source Code Pro', monospace",
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-gold)',
              letterSpacing: '0.08em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,134,11,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,134,11,0.08)'; }}
          >
            {s.slice(0,4)} {s.slice(4)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Công thức giải thích ────────────────────────────────────────────────────
function FormulaBox({ mode }) {
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
      <div style={{ fontWeight: 700, color: 'var(--color-jade)', marginBottom: 3 }}>Công thức</div>
      {isTime ? (
        <>
          Thượng quái = (Năm + Tháng + Ngày) mod 8<br />
          Hạ quái = (Năm + Tháng + Ngày + Giờ) mod 8<br />
          Hào động = (Năm + Tháng + Ngày + Giờ) mod 6
        </>
      ) : (
        <>
          Thượng quái = Tổng nửa đầu mod 8<br />
          Hạ quái = Tổng nửa sau mod 8<br />
          Hào động = Tổng tất cả chữ số mod 6
        </>
      )}
    </div>
  );
}

// ─── Panel thời gian ──────────────────────────────────────────────────────────
function TimeModePanel({ question, onResult, onReset }) {
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
    if (!dateStr) { setError('Vui lòng chọn ngày.'); return; }
    const result = buildMaiHoaResult({ subMode: 'time', dateStr, timeStr, question });
    if (!result) { setError('Không thể tính âm lịch. Hãy thử lại.'); return; }
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
        ⚡ Lấy ngày giờ hiện tại
      </button>

      {/* Ngày + Giờ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="form-label">Ngày động tâm</label>
          <input type="date" className="form-input" value={dateStr}
            onChange={e => { setDateStr(e.target.value); onReset(); }} />
        </div>
        <div>
          <label className="form-label">Giờ động tâm</label>
          <input type="time" className="form-input" value={timeStr}
            onChange={e => { setTimeStr(e.target.value); onReset(); }} />
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '-8px', fontStyle: 'italic' }}>
        * Lưu ý: Giờ động tâm được lấy mặc định theo giờ Việt Nam (UTC+7).
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
    if (cleaned.length < 2) { setError('Vui lòng nhập ít nhất 2 chữ số.'); return; }
    const result = buildMaiHoaResult({ subMode: 'serial', serial: cleaned, question });
    if (!result) { setError('Lỗi tính toán. Kiểm tra lại số nhập.'); return; }
    onResult(result);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div>
        <label className="form-label">Số lập quẻ (2–8 chữ số)</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            inputMode="numeric"
            className="form-input"
            placeholder="Nhập 2–8 chữ số (VD: 123456 hoặc 19452026)"
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
  return (
    <button className="btn-primary btn-cta" onClick={onClick} disabled={disabled} style={{ marginTop: 4 }}>
      🌸 Lập quẻ Mai Hoa
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
  return (
    <div style={{ padding: '8px 12px', background: 'rgba(192,57,43,0.08)', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--color-vermillion)', border: '1px solid rgba(192,57,43,0.2)' }}>
      ⚠ Hãy nhập việc cần xem trước khi lập quẻ
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
