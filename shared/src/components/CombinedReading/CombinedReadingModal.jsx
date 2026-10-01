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
import { useCombinedReading, TOPIC_LABELS, TOPIC_CUNG_MAP, summarizeRelevantPalaces } from './useCombinedReading.js';

// ─── Mini BirthInputForm (dùng khi không có lá số sẵn) ─────────────────
function QuickBirthForm({ onSubmit, language }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState(0);   // 0 = chưa chọn
  const [day, setDay] = useState(0);        // 0 = chưa chọn
  const [gender, setGender] = useState('nam');
  const isVi = language !== 'en';

  const MONTHS_VI = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = isVi ? MONTHS_VI : MONTHS_EN;

  // Số ngày theo tháng (dùng năm hiện tại nếu chưa nhập năm)
  const daysInMonth = (m, y) => {
    if (!m) return 31;
    const yr = parseInt(y) || 2000;
    return new Date(yr, m, 0).getDate();
  };
  const totalDays = daysInMonth(month, year);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const canSubmit = year.length === 4 && month > 0 && day > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      birthInfo: {
        year: parseInt(year),
        month,
        day,
        gender,
        name: name.trim() || (isVi ? 'Người hỏi' : 'Querent'),
      }
    });
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
          ? 'AI sẽ đối chiếu bản mệnh cơ bản — không cần chính xác âm lịch.'
          : 'AI will reference your basic natal element — solar date is fine.'}
      </p>

      {/* ── Năm sinh ── */}
      <div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isVi ? 'Năm sinh' : 'Birth Year'}
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
          ? `${isVi ? 'Xác nhận' : 'Confirm'} — ${day}/${month}/${year} · ${gender === 'nam' ? '♂' : '♀'}`
          : (isVi ? 'Chọn đủ năm · tháng · ngày để tiếp tục' : 'Select year · month · day to continue')}
      </button>
    </form>
  );
}

// ─── Mini Hexagram Display ──────────────────────────────────────────────
function HexLines({ lines }) {
  if (!lines || lines.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '3px', alignItems: 'center' }}>
      {lines.map((line, i) => {
        const isYang = line === 7 || line === 9;
        const isMoving = line === 6 || line === 9;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isYang ? (
              <div style={{ width: '40px', height: '5px', background: isMoving ? '#e5c158' : 'rgba(229,193,88,0.7)', borderRadius: '2px' }} />
            ) : (
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '17px', height: '5px', background: isMoving ? '#e5c158' : 'rgba(229,193,88,0.5)', borderRadius: '2px' }} />
                <div style={{ width: '17px', height: '5px', background: isMoving ? '#e5c158' : 'rgba(229,193,88,0.5)', borderRadius: '2px' }} />
              </div>
            )}
            {isMoving && <span style={{ fontSize: '10px', color: '#e5c158' }}>●</span>}
          </div>
        );
      })}
    </div>
  );
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
    hexResult, isCasting, castHexagram,
    aiResponse, isLoadingAi, aiError,
    queryAi,
  } = useCombinedReading({ apiBaseUrl, apiKey, model: aiModel });

  // Local birth info (khi không có chartResult từ TuViNow)
  const [localBirthInfo, setLocalBirthInfo] = useState(null);
  const hasChart = !!chartResult;
  const birthInfoReady = hasChart || !!localBirthInfo;

  // Step 1: topic, Step 2: birth info (if needed), Step 3: question+cast, Step 4: AI result
  const [step, setStep] = useState(1);

  // Pre-fill câu hỏi từ caller (ví dụ: result.question từ IChingNow)
  useEffect(() => {
    if (isOpen && initialQuestion && !question) {
      setQuestion(initialQuestion);
    }
    if (!isOpen) {
      setStep(1);
      setLocalBirthInfo(null);
      // Không reset question — để giữ lại khi mở lại
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicSelect = (t) => {
    setTopic(t);
    if (hasChart) {
      setStep(3); // Đã có lá số → bỏ qua step 2
    } else {
      setStep(2); // Cần nhập ngày sinh
    }
  };

  const handleBirthSubmit = ({ birthInfo }) => {
    setLocalBirthInfo(birthInfo);
    setStep(3);
  };

  const handleCastAndAsk = () => {
    if (!hexResult) {
      castHexagram();
    }
    setStep(4);
    const effectiveBirthInfo = inputData ? {
      yearCan: inputData.yearCan || '',
      yearChi: inputData.yearChi || '',
      menh: chartResult?.nguHanh || '',
      cuc: chartResult?.cuc || '',
      name: inputData.name || '',
    } : localBirthInfo;

    setTimeout(() => {
      queryAi({
        chartResult: chartResult || null,
        birthInfo: effectiveBirthInfo,
        language,
      });
    }, 900);
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
            const labels = hasChart
              ? ['Chủ đề', 'Câu hỏi & Quẻ', 'Luận giải AI']
              : ['Chủ đề', 'Ngày sinh', 'Câu hỏi & Quẻ', 'Luận giải AI'];
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
                  {labels[idx]}
                </span>
                {idx < labels.length - 1 && (
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
                ? 'Để có lá số chính xác nhất, hãy lập lá số trên TuViNow rồi bấm "Hỏi Kinh Dịch" từ đó. Hoặc nhập nhanh ngày sinh âm lịch bên dưới.'
                : 'For best accuracy, create your chart on TuViNow then tap "Ask I Ching" from there. Or enter your lunar birth date below.'}
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

        {/* ── STEP 3: Câu hỏi + Gieo quẻ ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isVi ? '2. Câu hỏi & Gieo quẻ Kinh Dịch' : '2. Your Question & I Ching Cast'}
            </h3>

            {/* Tử Vi context preview */}
            {relevantPalaces && relevantPalaces.length > 0 && (
              <div style={{
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '12px',
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.8)', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🔭 {isVi ? 'Tử Vi — Cung liên quan' : 'Zi Wei — Relevant Palaces'}
                </div>
                {relevantPalaces.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'rgba(139,92,246,0.7)', flexShrink: 0, fontWeight: 600 }}>
                      {p.isMenh ? '⭐ ' : ''}{p.name}:
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {p.stars || (isVi ? '(chưa có sao chiếu)' : '(no stars)')}
                    </span>
                  </div>
                ))}
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
                  minHeight: '80px',
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

            {/* Hexagram cast */}
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
                          <HexLines lines={hexResult.changedLines || hexResult.lines} />
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
              {isVi ? '🔮 Luận giải kết hợp AI' : '🔮 Combined AI Reading'}
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
