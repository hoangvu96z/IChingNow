import React, { useState, useMemo } from 'react';
import { getBirthCanChiAndMenh, GIO_SINH_OPTIONS, getHourIndexFromTimeStr } from './useCombinedReading.js';

export const STORAGE_KEY = 'ichingnow_user_birth';

// ─── Mini BirthInputForm (dùng khi không có lá số sẵn) ─────────────────
export default function QuickBirthForm({ onSubmit, language, initialData }) {
  const isVi = language !== 'en';

  const [inputMode, setInputMode] = useState('picker'); // 'picker' | 'dropdown'

  const [name, setName] = useState(() => {
    if (initialData?.name) return initialData.name;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.name || '';
    } catch { return ''; }
  });
  const [year, setYear] = useState(() => {
    if (initialData?.year) return Number(initialData.year);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.year ? Number(saved.year) : 1996;
    } catch { return 1996; }
  });
  const [month, setMonth] = useState(() => {
    if (initialData?.month) return Number(initialData.month);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.month ? Number(saved.month) : 6;
    } catch { return 6; }
  });
  const [day, setDay] = useState(() => {
    if (initialData?.day) return Number(initialData.day);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.day ? Number(saved.day) : 15;
    } catch { return 15; }
  });
  const [hourIndex, setHourIndex] = useState(() => {
    if (initialData?.hourIndex !== undefined && initialData?.hourIndex !== null) return Number(initialData.hourIndex);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return (saved.hourIndex !== undefined && saved.hourIndex !== null) ? Number(saved.hourIndex) : 6; // Mặc định Giờ Ngọ (11:00-13:00)
    } catch { return 6; }
  });
  const [gender, setGender] = useState(() => {
    if (initialData?.gender) return initialData.gender;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved.gender || 'nam';
    } catch { return 'nam'; }
  });

  const [exactTime, setExactTime] = useState(() => {
    const opt = GIO_SINH_OPTIONS[hourIndex] || GIO_SINH_OPTIONS[6];
    return `${String(opt.startHour).padStart(2, '0')}:00`;
  });

  const handleTimeChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    setExactTime(val);
    const matchedIdx = getHourIndexFromTimeStr(val);
    setHourIndex(matchedIdx);
  };

  const handleHourSelectChange = (e) => {
    const idx = Number(e.target.value);
    setHourIndex(idx);
    const opt = GIO_SINH_OPTIONS[idx] || GIO_SINH_OPTIONS[6];
    setExactTime(`${String(opt.startHour).padStart(2, '0')}:00`);
  };

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i), [currentYear]);

  const daysInMonth = (m, y) => {
    if (!m) return 31;
    return new Date(y || 2000, m, 0).getDate();
  };
  const totalDays = daysInMonth(month, year);
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);

  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDatepickerChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (y && m && d) {
        setYear(y);
        setMonth(m);
        setDay(d);
      }
    }
  };

  const canChiMenh = getBirthCanChiAndMenh(year, month, day);
  const currentHourOpt = GIO_SINH_OPTIONS[hourIndex] || GIO_SINH_OPTIONS[6];

  const handleSubmit = (e) => {
    e.preventDefault();
    const canChiInfo = getBirthCanChiAndMenh(year, month, day);
    const hourOpt = GIO_SINH_OPTIONS[hourIndex] || GIO_SINH_OPTIONS[6];
    const birthInfo = {
      year,
      month,
      day,
      ...(canChiInfo?.lunarYear ? {
        lunarYear: canChiInfo.lunarYear,
        lunarMonth: canChiInfo.lunarMonth,
        lunarDay: canChiInfo.lunarDay,
      } : {}),
      hourIndex,
      hourLabel: hourOpt.label,
      hourName: hourOpt.name,
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

  const selectStyle = {
    width: '100%',
    padding: '11px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(229,193,88,0.25)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    cursor: 'pointer',
    colorScheme: 'dark',
    boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          {isVi ? 'Ngày tháng năm sinh (Dương lịch)' : 'Date of Birth (Solar)'}
        </span>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <button
            type="button"
            onClick={() => setInputMode('picker')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: inputMode === 'picker' ? 'rgba(124,58,237,0.7)' : 'transparent',
              color: inputMode === 'picker' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            📅 {isVi ? 'Datepicker (Lịch)' : 'Datepicker'}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('dropdown')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: inputMode === 'dropdown' ? 'rgba(124,58,237,0.7)' : 'transparent',
              color: inputMode === 'dropdown' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            📋 {isVi ? 'Dropdown' : 'Dropdown list'}
          </button>
        </div>
      </div>

      {/* Input container */}
      {inputMode === 'picker' ? (
        <div>
          <input
            type="date"
            value={isoDate}
            min="1920-01-01"
            max={`${currentYear}-12-31`}
            onChange={handleDatepickerChange}
            onClick={(e) => {
              try { e.target.showPicker?.(); } catch {}
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(229,193,88,0.3)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '15px',
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
              cursor: 'pointer',
              colorScheme: 'dark',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>
              {isVi ? 'Ngày' : 'Day'}
            </label>
            <select
              value={day}
              onChange={e => setDay(Number(e.target.value))}
              style={selectStyle}
            >
              {days.map(d => (
                <option key={d} value={d} style={{ background: '#181135', color: '#fff' }}>
                  {isVi ? `Ngày ${d}` : d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>
              {isVi ? 'Tháng' : 'Month'}
            </label>
            <select
              value={month}
              onChange={e => {
                const newM = Number(e.target.value);
                setMonth(newM);
                const maxD = daysInMonth(newM, year);
                if (day > maxD) setDay(maxD);
              }}
              style={selectStyle}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} style={{ background: '#181135', color: '#fff' }}>
                  {isVi ? `Tháng ${m}` : `Month ${m}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>
              {isVi ? 'Năm' : 'Year'}
            </label>
            <select
              value={year}
              onChange={e => {
                const newY = Number(e.target.value);
                setYear(newY);
                const maxD = daysInMonth(month, newY);
                if (day > maxD) setDay(maxD);
              }}
              style={selectStyle}
            >
              {years.map(y => (
                <option key={y} value={y} style={{ background: '#181135', color: '#fff' }}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Real-time Can Chi & Bản Mệnh & Giờ */}
      {canChiMenh && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(124,58,237,0.14)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#ddd6fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>✨</span>
            <span>{isVi ? `Năm ${canChiMenh.canChi} (${canChiMenh.lunarYear ?? year})` : `${canChiMenh.canChi} (${canChiMenh.lunarYear ?? year})`}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>· Giờ {currentHourOpt.name}</span>
          </div>
          {canChiMenh.menh && (
            <span style={{ fontWeight: 600, color: '#f3e5ab' }}>
              {isVi ? `Mệnh ${canChiMenh.menh}` : `Element: ${canChiMenh.menh}`}
            </span>
          )}
        </div>
      )}

      {/* Giờ sinh (12 Canh giờ + Timepicker) + Giới tính */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '12px', alignItems: 'end' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isVi ? 'Giờ sinh (12 Canh giờ)' : 'Birth Hour (12 Branches)'}
            </label>
            <span style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: 600 }}>
              ⏰ {exactTime}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={hourIndex}
              onChange={handleHourSelectChange}
              style={{ ...selectStyle, flex: 1 }}
            >
              {GIO_SINH_OPTIONS.map(g => (
                <option key={g.value} value={g.value} style={{ background: '#181135', color: '#fff' }}>
                  {isVi ? `Giờ ${g.label}` : g.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={exactTime}
              onChange={handleTimeChange}
              title={isVi ? 'Nhập giờ sinh chính xác' : 'Enter exact birth time'}
              style={{
                width: '92px',
                padding: '11px 8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(229,193,88,0.25)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
                colorScheme: 'dark',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            💡 {isVi ? 'Cần giờ sinh để xác định Cung Mệnh & Thân' : 'Determines Life & Body palaces'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '11px 10px',
                  borderRadius: '10px',
                  border: `1px solid ${gender === val ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.1)'}`,
                  background: gender === val ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                  color: gender === val ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ height: '16px' }} />
        </div>
      </div>

      {/* Họ tên */}
      <div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isVi ? 'Họ tên (tuỳ chọn)' : 'Name (optional)'}
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
            fontSize: '13px',
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

      {/* CTA Button */}
      <button
        type="submit"
        style={{
          marginTop: '6px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          padding: '13px',
          fontSize: '14px',
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          letterSpacing: '0.3px',
        }}
      >
        {isVi ? 'Xác nhận' : 'Confirm'} — {day}/{month}/{year} · Giờ {currentHourOpt.name} · {gender === 'nam' ? '♂ Nam' : '♀ Nữ'}{canChiMenh ? ` (${canChiMenh.canChi})` : ''}
      </button>
    </form>
  );
}
