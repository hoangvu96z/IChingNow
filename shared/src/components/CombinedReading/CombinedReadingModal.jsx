/**
 * CombinedReadingModal
 * Modal kết hợp Tử Vi + Kinh Dịch — dùng được từ cả IChingNow và TuViNow
 *
 * Props:
 *   isOpen            — boolean
 *   onClose           — fn()
 *   chartResult       — object | null  (từ TuViNow anLaSoTuVi, hoặc null nếu chưa có)
 *   inputData         — object | null  (birth input từ TuViNow)
 *   sourceApp         — 'iching' | 'tuvi'
 *   language          — 'vi' | 'en'
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  useCombinedReading,
  TOPIC_LABELS,
  TOPIC_CUNG_MAP,
  summarizeRelevantPalaces,
  getBirthCanChiAndMenh,
  normalizeHexResult,
} from './useCombinedReading.js';

const STORAGE_KEY = 'ichingnow_user_birth';

// ─── Mini BirthInputForm (dùng khi không có lá số sẵn) ─────────────────
function QuickBirthForm({ onSubmit, language }) {
  const isVi = language !== 'en';

  const [name, setName] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.name || '';
    } catch { return ''; }
  });
  const [year, setYear] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.year ? String(saved.year) : '';
    } catch { return ''; }
  });
  const [month, setMonth] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.month ? Number(saved.month) : 0;
    } catch { return 0; }
  });
  const [day, setDay] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.day ? Number(saved.day) : 0;
    } catch { return 0; }
  });
  const [gender, setGender] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.gender || 'nam';
    } catch { return 'nam'; }
  });

  const MONTHS_VI = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = isVi ? MONTHS_VI : MONTHS_EN;

  const daysInMonth = (m, y) => {
    if (!m) return 31;
    const yr = parseInt(y, 10) || 2000;
    return new Date(yr, m, 0).getDate();
  };
  const totalDays = daysInMonth(month, year);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const canSubmit = year.length === 4 && month > 0 && day > 0;
  const canChiMenh = year.length === 4 ? getBirthCanChiAndMenh(year) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const canChiInfo = getBirthCanChiAndMenh(year);
    const birthInfo = {
      year: parseInt(year, 10),
      month,
      day,
      gender,
      name: name.trim() || (isVi ? 'Người hỏi' : 'Querent'),
      yearCan: canChiInfo?.yearCan || '',
      yearChi: canChiInfo?.yearChi || '',
      canChi: canChiInfo?.canChi || '',
      menh: canChiInfo?.menh || '',
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(birthInfo));
    } catch { /* ignore storage errors */ }
    onSubmit({ birthInfo });
  };

  const chipBase = {
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.55)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '6px 4px',
    textAlign: 'center',
    transition: 'all 0.15s',
    lineHeight: 1,
  };
  const chipActive = {
    ...chipBase,
    background: 'rgba(124,58,237,0.25)',
    border: '1px solid rgba(124,58,237,0.6)',
    color: '#c4b5fd',
    fontWeight: 700,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        {isVi
          ? 'Nhập ngày sinh để hệ thống đối chiếu bản mệnh và các cung liên quan trên lá số Tử Vi.'
          : 'Enter your birth date so AI can reference your natal chart and relevant palaces.'}
      </p>

      {/* ── Năm sinh ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isVi ? 'Năm sinh' : 'Birth Year'}
          </div>
          {year.length === 4 && canChiMenh && (
            <div style={{ fontSize: '12px', color: '#c4b5fd', fontWeight: 600 }}>
              ✨ Năm {canChiMenh.canChi} {canChiMenh.menh ? `· Mệnh ${canChiMenh.menh}` : ''}
            </div>
          )}
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="1990"
          value={year}
          onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${year.length === 4 ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.15)'}`,
            color: '#fff',
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '6px',
            padding: '4px 0 8px',
            outline: 'none',
            boxSizing: 'border-box',
            caretColor: '#a78bfa',
          }}
          required
        />
      </div>

      {/* ── Tháng ── */}
      <div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isVi ? 'Tháng' : 'Month'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
          {months.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setMonth(i + 1); if (day > daysInMonth(i + 1, year)) setDay(0); }}
              style={month === i + 1 ? chipActive : chipBase}
              onMouseEnter={e => { if (month !== i + 1) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { if (month !== i + 1) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ngày ── */}
      {month > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isVi ? 'Ngày' : 'Day'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
            {days.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                style={day === d ? { ...chipActive, fontSize: '11px' } : { ...chipBase, fontSize: '11px' }}
                onMouseEnter={e => { if (day !== d) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (day !== d) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Giới tính + Tên ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'end' }}>
        {/* Giới tính — button group */}
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isVi ? 'Giới tính' : 'Gender'}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { val: 'nam', icon: '♂', label: isVi ? 'Nam' : 'Male' },
              { val: 'nu',  icon: '♀', label: isVi ? 'Nữ'  : 'Female' },
            ].map(({ val, icon, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setGender(val)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${gender === val ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  background: gender === val ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                  color: gender === val ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tên */}
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isVi ? 'Tên (tuỳ chọn)' : 'Name (optional)'}
          </div>
          <input
            type="text"
            placeholder={isVi ? 'Nguyễn Văn A' : 'Your name'}
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              padding: '10px 14px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        </div>
      </div>

      {/* ── CTA ── */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          background: canSubmit
            ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
            : 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: '12px',
          color: canSubmit ? '#fff' : 'rgba(255,255,255,0.25)',
          padding: '13px',
          fontSize: '14px',
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          boxShadow: canSubmit ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
          letterSpacing: '0.3px',
        }}
      >
        {canSubmit
          ? `${isVi ? 'Xác nhận' : 'Confirm'} — ${day}/${month}/${year} · ${gender === 'nam' ? '♂' : '♀'}${canChiMenh ? ` (${canChiMenh.canChi})` : ''}`
          : (isVi ? 'Chọn đủ năm · tháng · ngày để tiếp tục' : 'Select year · month · day to continue')}
      </button>
    </form>
  );
}

// ─── Mini Hexagram Display ──────────────────────────────────────────────
function HexLines({ lines }) {
  if (!lines || lines.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', alignItems: 'center' }}>
      {lines.map((line, i) => {
        const isYang = typeof line === 'object' ? line.yinYang === 'yang' : (line === 7 || line === 9);
        const isMoving = typeof line === 'object' ? !!line.moving : (line === 6 || line === 9);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isYang ? (
              <div style={{
                width: '42px',
                height: '5px',
                background: isMoving ? '#ef4444' : '#e5c158',
                borderRadius: '2px',
                boxShadow: isMoving ? '0 0 8px rgba(239,68,68,0.6)' : 'none',
              }} />
            ) : (
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{
                  width: '19px',
                  height: '5px',
                  background: isMoving ? '#ef4444' : '#e5c158',
                  borderRadius: '2px',
                  boxShadow: isMoving ? '0 0 8px rgba(239,68,68,0.6)' : 'none',
                }} />
                <div style={{
                  width: '19px',
                  height: '5px',
                  background: isMoving ? '#ef4444' : '#e5c158',
                  borderRadius: '2px',
                  boxShadow: isMoving ? '0 0 8px rgba(239,68,68,0.6)' : 'none',
                }} />
              </div>
            )}
            {isMoving && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>●</span>}
          </div>
        );
      })}
    </div>
  );
}

function resolveChangedLines(hexResult) {
  if (!hexResult) return [];
  if (hexResult.changedLines && hexResult.changedLines.length === 6) {
    return hexResult.changedLines;
  }
  if (!hexResult.lines) return [];
  return hexResult.lines.map(line => {
    if (typeof line === 'object') {
      if (line.moving) {
        return { ...line, yinYang: line.yinYang === 'yang' ? 'yin' : 'yang', moving: false };
      }
      return { ...line, moving: false };
    }
    if (line === 6) return 7;
    if (line === 9) return 8;
    return line;
  });
}

// ─── Markdown renderer (đơn giản) ──────────────────────────────────────
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', fontFamily: "'Inter', sans-serif" }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#e5c158', margin: '16px 0 8px', fontSize: '15px', fontFamily: "'Cinzel', serif" }}>{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} style={{ color: '#e5c158', margin: '16px 0 8px', fontSize: '16px', fontFamily: "'Cinzel', serif" }}>{line.slice(2)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, color: '#f3e5ab', margin: '8px 0' }}>{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} style={{ marginLeft: '16px', marginBottom: '4px', color: 'rgba(255,255,255,0.8)' }}>{line.slice(2)}</li>;
        if (line.trim() === '') return <div key={i} style={{ height: '8px' }} />;
        // Inline bold: **...**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={{ margin: '4px 0' }}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#f3e5ab' }}>{part}</strong> : part)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────
export default function CombinedReadingModal({
  isOpen,
  onClose,
  chartResult = null,
  inputData = null,
  initialQuestion = '',
  initialHexResult = null,
  sourceApp = 'iching',
  language = 'vi',
}) {
  const isVi = language !== 'en';
  const apiBaseUrl = import.meta.env.VITE_AI_BASE_URL || 'http://43.128.116.69:20128/v1';
  const apiKey = import.meta.env.VITE_AI_API_KEY || '';
  const aiModel = import.meta.env.VITE_AI_MODEL || 'combo1';

  const {
    topic, setTopic,
    question, setQuestion,
    hexResult, setHexResult, isCasting, castHexagram,
    aiResponse, isLoadingAi, aiError,
    queryAi,
  } = useCombinedReading({ apiBaseUrl, apiKey, model: aiModel });

  // Local birth info (khi không có chartResult từ TuViNow)
  const [localBirthInfo, setLocalBirthInfo] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return (saved.year && saved.month && saved.day) ? saved : null;
    } catch {
      return null;
    }
  });

  const hasChart = !!chartResult;
  const isFromIChing = sourceApp === 'iching' || !!initialHexResult;
  const hasPrecastHex = !!initialHexResult || (isFromIChing && !!hexResult);

  // Step 1: topic, Step 2: birth info (if needed), Step 3: question+review hex, Step 4: AI result
  const [step, setStep] = useState(1);

  // Pre-fill question và hexResult khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (initialQuestion && !question) {
        setQuestion(initialQuestion);
      }
      if (initialHexResult) {
        const normalized = normalizeHexResult(initialHexResult);
        if (normalized) {
          setHexResult(normalized);
        }
      }
    } else {
      setStep(1);
      if (!initialHexResult) {
        setHexResult(null);
      }
    }
  }, [isOpen, initialQuestion, initialHexResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicSelect = (t) => {
    setTopic(t);
    if (hasChart) {
      // Đã có lá số sẵn (từ TuViNow) → bỏ qua bước nhập ngày sinh
      setStep(3);
    } else {
      // Chưa có lá số (từ IChingNow) → sang bước nhập ngày sinh
      setStep(2);
    }
  };

  const handleBirthSubmit = ({ birthInfo }) => {
    setLocalBirthInfo(birthInfo);
    setStep(3);
  };

  const effectiveBirthInfo = inputData ? {
    yearCan: inputData.yearCan || '',
    yearChi: inputData.yearChi || '',
    canChi: (inputData.yearCan && inputData.yearChi) ? `${inputData.yearCan} ${inputData.yearChi}` : '',
    menh: chartResult?.nguHanh || '',
    cuc: chartResult?.cuc || '',
    name: inputData.name || '',
    gender: inputData.gender || '',
    day: inputData.day || '',
    month: inputData.month || '',
    year: inputData.year || '',
  } : localBirthInfo;

  const handleCastAndAsk = () => {
    // Chỉ tự gieo quẻ nếu quẻ hoàn toàn chưa có
    if (!hexResult) {
      castHexagram();
    }
    setStep(4);

    setTimeout(() => {
      queryAi({
        chartResult: chartResult || null,
        birthInfo: effectiveBirthInfo,
        language,
      });
    }, 400);
  };

  if (!isOpen) return null;

  const relevantPalaces = chartResult ? summarizeRelevantPalaces(chartResult, topic) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(5,3,15,0.85)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9001,
        width: 'min(680px, 96vw)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(160deg, rgba(18,12,40,0.98) 0%, rgba(10,8,25,0.98) 100%)',
        border: '1px solid rgba(229,193,88,0.3)',
        borderRadius: '20px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,193,88,0.08), inset 0 1px 0 rgba(229,193,88,0.1)',
        padding: '28px 28px 32px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(229,193,88,0.2) transparent',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>🔮</span>
              <h2 style={{
                margin: 0,
                fontFamily: "'Cinzel', serif",
                fontSize: '18px',
                background: 'linear-gradient(135deg, #e5c158, #f3e5ab)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {isVi ? 'Kết hợp Tử Vi & Kinh Dịch' : 'Zi Wei + I Ching Combined'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>
              {isVi
                ? 'Lá số Tử Vi định hướng nền tảng · Kinh Dịch phán định thời điểm · AI tổng hợp'
                : 'Natal chart reveals foundation · I Ching divines the moment · AI synthesizes both'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)',
            width: '32px', height: '32px',
            cursor: 'pointer', fontSize: '16px', flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[1, hasChart ? null : 2, 3, 4].filter(Boolean).map((s, idx) => {
            let label = '';
            if (hasChart) {
              const labelsTuVi = isVi
                ? ['Chủ đề', 'Hỏi & Gieo quẻ', 'Luận giải AI']
                : ['Topic', 'Ask & Cast', 'AI Reading'];
              label = labelsTuVi[idx];
            } else {
              const labelsIChing = isVi
                ? ['Chủ đề', 'Ngày sinh', hasPrecastHex ? 'Xác nhận & Quẻ' : 'Hỏi & Quẻ', 'Luận giải AI']
                : ['Topic', 'Birth Info', hasPrecastHex ? 'Confirm & Hex' : 'Ask & Hex', 'AI Reading'];
              label = labelsIChing[idx];
            }
            const actualStep = hasChart ? [1, 3, 4][idx] : s;
            const isActive = step === actualStep;
            const isDone = step > actualStep;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isDone ? 'rgba(229,193,88,0.3)' : isActive ? 'rgba(229,193,88,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isDone || isActive ? 'rgba(229,193,88,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: isDone || isActive ? '#e5c158' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                {idx < (hasChart ? 2 : 3) && (
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Chọn chủ đề ── */}
        {step === 1 && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isVi ? '1. Bạn muốn hỏi về điều gì?' : '1. What topic do you seek guidance on?'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(TOPIC_LABELS).map(([key, labels]) => (
                <button
                  key={key}
                  onClick={() => handleTopicSelect(key)}
                  style={{
                    background: topic === key ? 'rgba(229,193,88,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${topic === key ? 'rgba(229,193,88,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,193,88,0.1)'; e.currentTarget.style.borderColor = 'rgba(229,193,88,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = topic === key ? 'rgba(229,193,88,0.14)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = topic === key ? 'rgba(229,193,88,0.5)' : 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{labels.vi.split(' ')[0]}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: topic === key ? '#e5c158' : '#fff' }}>
                    {isVi ? labels.vi.slice(labels.vi.indexOf(' ') + 1) : labels.en.slice(labels.en.indexOf(' ') + 1)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                    {isVi ? `Cung: ${(TOPIC_CUNG_MAP[key] || []).join(', ')}` : `Palaces: ${(TOPIC_CUNG_MAP[key] || []).join(', ')}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Nhập ngày sinh (nếu không có lá số) ── */}
        {step === 2 && !hasChart && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isVi ? '2. Thông tin lá số Tử Vi' : '2. Your Natal Chart Info'}
            </h3>
            {/* Source app note */}
            <div style={{
              background: 'rgba(229,193,88,0.07)',
              border: '1px solid rgba(229,193,88,0.2)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              💡 {isVi
                ? 'Để có lá số chi tiết đầy đủ 12 cung, hãy lập lá số trên TuViNow rồi bấm "Hỏi Kinh Dịch". Hoặc nhập ngày sinh để AI đối chiếu bản mệnh cơ bản.'
                : 'For full 12 palaces, create your chart on TuViNow and tap "Ask I Ching". Or enter birth date below for natal baseline.'}
            </div>
            <QuickBirthForm onSubmit={handleBirthSubmit} language={language} />
            <button onClick={() => setStep(3)} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)',
              fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              marginTop: '12px', textDecoration: 'underline',
            }}>
              {isVi ? 'Bỏ qua, tiếp tục không có lá số' : 'Skip, continue without natal chart'}
            </button>
          </div>
        )}

        {/* ── STEP 3: Câu hỏi + Quẻ ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
                {hasPrecastHex
                  ? (isVi ? `${hasChart ? '2' : '3'}. Xác nhận câu hỏi & Quẻ Kinh Dịch` : `${hasChart ? '2' : '3'}. Confirm Question & Hexagram`)
                  : (isVi ? `${hasChart ? '2' : '3'}. Câu hỏi & Gieo quẻ Kinh Dịch` : `${hasChart ? '2' : '3'}. Question & Cast Hexagram`)}
              </h3>
              {hasPrecastHex && (
                <span style={{
                  fontSize: '11px',
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  color: '#86efac',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}>
                  ✓ {isVi ? 'Đã lấy quẻ từ Kinh Dịch' : 'Hexagram loaded'}
                </span>
              )}
            </div>

            {/* Tử Vi context preview */}
            {(effectiveBirthInfo || relevantPalaces) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(79,70,229,0.06) 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔭 {isVi ? 'Tử Vi — Thông tin bản mệnh' : 'Zi Wei Natal Context'}
                  </div>
                  {effectiveBirthInfo?.canChi && (
                    <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', padding: '2px 8px', borderRadius: '12px', color: '#ddd6fe' }}>
                      Năm {effectiveBirthInfo.canChi} {effectiveBirthInfo.menh ? `· Mệnh ${effectiveBirthInfo.menh}` : ''}
                    </span>
                  )}
                </div>
                {effectiveBirthInfo?.day && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    👤 {effectiveBirthInfo.name && effectiveBirthInfo.name !== 'Người hỏi' ? `${effectiveBirthInfo.name} · ` : ''}
                    {isVi ? 'Sinh ngày' : 'Born:'} {effectiveBirthInfo.day}/{effectiveBirthInfo.month}/{effectiveBirthInfo.year} · {effectiveBirthInfo.gender === 'nam' ? '♂ Nam' : '♀ Nữ'}
                  </div>
                )}
                {relevantPalaces && relevantPalaces.length > 0 && (
                  <div style={{ marginTop: '2px', borderTop: '1px solid rgba(139,92,246,0.15)', paddingTop: '8px' }}>
                    {relevantPalaces.map((p, i) => (
                      <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>
                        <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{p.isMenh ? '⭐ ' : ''}{p.name}: </span>
                        {p.stars || (isVi ? '(chưa có sao chiếu)' : '(no stars)')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Question input */}
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
                {isVi ? '✏️ Câu hỏi cụ thể của bạn' : '✏️ Your specific question'}
              </label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={isVi
                  ? 'Ví dụ: Công việc hiện tại của tôi có nên tiếp tục hay đổi sang lĩnh vực khác?'
                  : 'E.g.: Should I stay in my current job or change fields?'}
                style={{
                  width: '100%',
                  minHeight: '76px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(229,193,88,0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Hexagram display: Quẻ đã có từ IChingNow vs Gieo quẻ từ TuViNow */}
            {hasPrecastHex && hexResult ? (
              /* TH1: Đã có quẻ từ IChingNow — Hiển thị nguyên vẹn, KHÔNG bắt gieo lại */
              <div style={{
                background: 'rgba(229,193,88,0.05)',
                border: '1px solid rgba(229,193,88,0.3)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <HexLines lines={hexResult.lines} />
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5c158', marginTop: '6px' }}>
                        {hexResult.primary?.name}
                      </div>
                      {hexResult.primary?.chineseName && (
                        <div style={{ fontSize: '10px', color: 'rgba(229,193,88,0.6)' }}>
                          {hexResult.primary.chineseName}
                        </div>
                      )}
                    </div>
                    {hexResult.changed && (
                      <>
                        <div style={{ color: 'rgba(229,193,88,0.4)', fontSize: '20px' }}>→</div>
                        <div style={{ textAlign: 'center' }}>
                          <HexLines lines={resolveChangedLines(hexResult)} />
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5c158', marginTop: '6px' }}>
                            {hexResult.changed?.name}
                          </div>
                          {hexResult.changed?.chineseName && (
                            <div style={{ fontSize: '10px', color: 'rgba(229,193,88,0.6)' }}>
                              {hexResult.changed.chineseName}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ flexGrow: 1, borderLeft: '1px solid rgba(229,193,88,0.15)', paddingLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f3e5ab' }}>
                      {hexResult.primary?.name}
                      {hexResult.changed ? ` → ${hexResult.changed.name}` : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                    {hexResult.movingLines?.length > 0 ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        ⚡ {isVi ? `Động hào ${hexResult.movingLines.join(', ')}` : `Moving lines ${hexResult.movingLines.join(', ')}`}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {isVi ? 'Quẻ thuần tĩnh (không có hào động)' : 'Static hexagram'}
                      </span>
                    )}
                    {hexResult.raw?.palaceName && (
                      <div style={{ color: 'rgba(229,193,88,0.8)', marginTop: '2px' }}>
                        🏛️ Cung {hexResult.raw.palaceName} ({hexResult.raw.palaceElement})
                        {hexResult.raw.theHao ? ` · Hào Thế: ${hexResult.raw.theHao} · Hào Ứng: ${hexResult.raw.ungHao}` : ''}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>
                    💡 {isVi ? 'Quẻ đã lập sẵn từ Kinh Dịch, sẵn sàng kết hợp cùng lá số Tử Vi.' : 'Pre-cast hexagram ready for synthesis.'}
                  </div>
                </div>
              </div>
            ) : (
              /* TH2: Chưa có quẻ (từ TuViNow) — Cho gieo 3 xu */
              <div style={{
                background: 'rgba(229,193,88,0.04)',
                border: '1px solid rgba(229,193,88,0.15)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}>
                <div style={{ flexShrink: 0 }}>
                  {hexResult ? (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <HexLines lines={hexResult.lines} />
                        <div style={{ fontSize: '11px', color: '#e5c158', marginTop: '6px' }}>{hexResult.primary?.name}</div>
                      </div>
                      {hexResult.changed && (
                        <>
                          <div style={{ color: 'rgba(229,193,88,0.3)', fontSize: '18px' }}>→</div>
                          <div style={{ textAlign: 'center' }}>
                            <HexLines lines={resolveChangedLines(hexResult)} />
                            <div style={{ fontSize: '11px', color: 'rgba(229,193,88,0.6)', marginTop: '6px' }}>{hexResult.changed?.name}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '48px', height: '64px',
                      border: '1px dashed rgba(229,193,88,0.2)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', opacity: 0.4,
                    }}>☯</div>
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  {hexResult ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5c158' }}>
                        {isVi ? 'Quẻ đã gieo' : 'Hexagram Cast'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {hexResult.primary?.name} {hexResult.primary?.chineseName && `(${hexResult.primary.chineseName})`}
                        {hexResult.changed && ` → ${hexResult.changed.name}`}
                      </div>
                      <button onClick={castHexagram} style={{
                        background: 'transparent', border: 'none', color: 'rgba(229,193,88,0.5)',
                        fontSize: '11px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        marginTop: '6px', padding: 0, textDecoration: 'underline',
                      }}>
                        {isVi ? 'Gieo lại' : 'Recast'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                        {isVi ? 'Gieo 3 xu để hỏi Kinh Dịch' : 'Cast 3 coins to consult I Ching'}
                      </div>
                      <button
                        onClick={castHexagram}
                        disabled={isCasting}
                        style={{
                          background: 'rgba(229,193,88,0.12)',
                          border: '1px solid rgba(229,193,88,0.3)',
                          borderRadius: '8px',
                          color: '#e5c158',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          cursor: isCasting ? 'not-allowed' : 'pointer',
                          opacity: isCasting ? 0.6 : 1,
                        }}
                      >
                        {isCasting ? '🎲 ...' : `🎲 ${isVi ? 'Gieo quẻ' : 'Cast Hexagram'}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleCastAndAsk}
              disabled={!question.trim() || isLoadingAi}
              style={{
                background: question.trim()
                  ? 'linear-gradient(135deg, rgba(229,193,88,0.3), rgba(229,193,88,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${question.trim() ? 'rgba(229,193,88,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                color: question.trim() ? '#e5c158' : 'rgba(255,255,255,0.3)',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.5px',
                cursor: question.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {isLoadingAi
                ? (isVi ? '⏳ Đang tổng hợp luận giải...' : '⏳ Synthesizing reading...')
                : (isVi ? '🔮 Luận giải kết hợp AI' : '🔮 Combined AI Reading')}
            </button>
          </div>
        )}

        {/* ── STEP 4: AI Result ── */}
        {step === 4 && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isVi ? '3. Luận giải tổng hợp' : '3. Combined Reading'}
            </h3>

            {/* Summary bar */}
            <div style={{
              display: 'flex', gap: '12px', marginBottom: '20px',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              fontSize: '12px',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isVi ? 'Chủ đề:' : 'Topic:'}
                <span style={{ color: '#e5c158', marginLeft: '4px' }}>
                  {TOPIC_LABELS[topic]?.[isVi ? 'vi' : 'en']}
                </span>
              </div>
              {hexResult?.primary && (
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isVi ? 'Quẻ:' : 'Hex:'}
                  <span style={{ color: 'rgba(229,193,88,0.7)', marginLeft: '4px' }}>
                    {hexResult.primary.name}
                    {hexResult.changed && ` → ${hexResult.changed.name}`}
                  </span>
                </div>
              )}
            </div>

            {isLoadingAi && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}>
                <div style={{ fontSize: '36px', animation: 'spin 3s linear infinite' }}>☯️</div>
                <p style={{ color: 'rgba(229,193,88,0.7)', fontFamily: "'Cinzel', serif", fontSize: '13px', margin: 0 }}>
                  {isVi ? 'Đang tổng hợp Tử Vi & Kinh Dịch...' : 'Synthesizing Zi Wei & I Ching...'}
                </p>
                {aiResponse && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '16px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    <SimpleMarkdown text={aiResponse} />
                  </div>
                )}
              </div>
            )}

            {aiError && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '14px',
                color: '#f87171',
                fontSize: '13px',
              }}>
                ⚠️ {aiError}
              </div>
            )}

            {!isLoadingAi && aiResponse && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(229,193,88,0.12)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <SimpleMarkdown text={aiResponse} />
              </div>
            )}

            {!isLoadingAi && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setStep(3)} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  padding: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  ← {isVi ? 'Đổi câu hỏi' : 'Change question'}
                </button>
                <button onClick={() => { setStep(1); }} style={{
                  flex: 1,
                  background: 'rgba(229,193,88,0.08)',
                  border: '1px solid rgba(229,193,88,0.25)',
                  borderRadius: '10px',
                  color: '#e5c158',
                  padding: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  🔄 {isVi ? 'Hỏi chủ đề khác' : 'New topic'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
