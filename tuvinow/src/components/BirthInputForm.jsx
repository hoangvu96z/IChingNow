import React, { useState, useMemo, useEffect } from 'react';
import { solarToLunar, validateLunarDate, validateSolarDate, getYearCanChi, GIO_SINH_OPTIONS, getMonthsInYear, getDaysInMonth, getYearOptions, getViewYearOptions } from '../utils/lunarConverter';

export function buildBirthInputPayload({
  name,
  day,
  month,
  year,
  hourIndex = 0,
  gender = 1,
  isLunar = false,
  viewYear = '',
}) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    throw new Error('Vui lòng nhập họ tên trước khi lập lá số!');
  }

  let lunarData;
  if (isLunar) {
    if (!validateLunarDate(year, month, day)) {
      throw new Error('Ngày âm lịch không tồn tại trong tháng đã chọn.');
    }
    const yearCanIndex = ((year - 4) % 10 + 10) % 10;
    const yearChiIndex = ((year - 4) % 12 + 12) % 12;
    const [yearCanName, yearChiName] = getYearCanChi(year).split(' ');
    lunarData = {
      lunarYear: year,
      lunarMonth: month,
      lunarDay: day,
      yearCanIndex,
      yearChiIndex,
      yearCanName,
      yearChiName,
      isLeap: false,
      solarDateStr: '(Nhập âm lịch)',
      lunarDateStr: `${month}/${day}/${year} (Âm lịch)`,
    };
  } else {
    if (!validateSolarDate(year, month, day)) {
      throw new Error('Ngày dương lịch không tồn tại trong tháng đã chọn.');
    }
    lunarData = solarToLunar(year, month, day);
  }

  const annualYear = viewYear === '' || viewYear === undefined || viewYear === null ? undefined : Number(viewYear);
  if (annualYear !== undefined && (!Number.isInteger(annualYear) || annualYear < 1900 || annualYear > 2100)) {
    throw new Error('Năm xem phải là số nguyên từ 1900 đến 2100.');
  }
  if (annualYear !== undefined && annualYear < lunarData.lunarYear) {
    throw new Error(`Năm xem lưu niên (${annualYear}) không thể trước năm sinh âm lịch (${lunarData.lunarYear}).`);
  }

  return {
    name: trimmedName,
    ...lunarData,
    lunarHourIndex: hourIndex,
    gender,
    isLunar,
    solarInput: isLunar ? null : { day, month, year },
    ...(annualYear === undefined ? {} : {
      viewYear: annualYear,
      viewYearCanIndex: ((annualYear - 4) % 10 + 10) % 10,
      viewYearChiIndex: ((annualYear - 4) % 12 + 12) % 12,
    }),
  };
}

export default function BirthInputForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [day, setDay] = useState(15);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(1990);
  const [hourIndex, setHourIndex] = useState(0);
  const [gender, setGender] = useState(1); // 1 = Nam, 0 = Nữ
  const [isLunar, setIsLunar] = useState(false);
  const [viewYear, setViewYear] = useState('');
  const [formError, setFormError] = useState('');

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(() => getYearOptions(), []);
  const viewYearOptions = useMemo(() => getViewYearOptions(1920, 30), []);
  const monthOptions = useMemo(() => getMonthsInYear(), []);
  const dayOptions = useMemo(() => getDaysInMonth(isLunar, year, month), [isLunar, year, month]);

  useEffect(() => {
    const isValid = isLunar ? validateLunarDate(year, month, day) : validateSolarDate(year, month, day);
    if (isValid) return;
    const lastValidDay = dayOptions.at(-1)?.value;
    if (lastValidDay) setDay(lastValidDay);
  }, [day, dayOptions, isLunar, month, year]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (nameError && val.trim()) {
      setNameError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Vui lòng nhập họ tên trước khi lập lá số!');
      const inputEl = document.getElementById('input-name');
      if (inputEl) inputEl.focus();
      return;
    }

    setFormError('');
    try {
      const payload = buildBirthInputPayload({
        name: trimmedName,
        day,
        month,
        year,
        hourIndex,
        gender,
        isLunar,
        viewYear,
      });
      onSubmit(payload);
    } catch (error) {
      setFormError(error.message || 'Không thể lập lá số từ thông tin này.');
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <div className="form-container">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2 className="form-title">🔮 Lập Lá Số Tử Vi</h2>
        <p className="form-subtitle">Nhập thông tin ngày giờ sinh để an lá số Tử Vi Đẩu{'\u00A0'}Số</p>

        {/* Họ Tên */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-name">
            Họ Tên <span style={{ color: '#e53e3e', fontWeight: 700 }}>*</span>
          </label>
          <input
            type="text"
            className={`form-input ${nameError ? 'input-error' : ''}`}
            placeholder="Nhập họ tên (bắt buộc)..."
            value={name}
            onChange={handleNameChange}
            id="input-name"
            autoComplete="name"
          />
          {nameError && (
            <div style={{
              color: '#e53e3e',
              fontSize: '0.78rem',
              marginTop: 5,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 500,
            }}>
              <span>⚠️</span> {nameError}
            </div>
          )}
        </div>

        {/* Calendar Toggle */}
        <div className="toggle-container">
          <span
            className={`toggle-label ${!isLunar ? 'active' : ''}`}
            onClick={() => setIsLunar(false)}
          >
            ☀️ Dương lịch
          </span>
          <div
            className={`toggle-switch ${isLunar ? 'active' : ''}`}
            onClick={() => setIsLunar(!isLunar)}
            role="switch"
            aria-checked={isLunar}
            id="toggle-calendar"
          />
          <span
            className={`toggle-label ${isLunar ? 'active' : ''}`}
            onClick={() => setIsLunar(true)}
          >
            🌙 Âm lịch
          </span>
        </div>

        {/* Ngày Sinh */}
        <div className="form-group">
          <label className="form-label">
            Ngày sinh {isLunar ? '(Âm lịch)' : '(Dương lịch)'}
          </label>
          <div className="form-row form-row-3">
            <select
              className="form-select"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              id="select-day"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  Ngày {d.label}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              id="select-month"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              id="select-year"
            >
              {yearOptions.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Giờ Sinh */}
        <div className="form-group">
          <label className="form-label">Giờ sinh (12 Canh giờ)</label>
          <select
            className="form-select"
            value={hourIndex}
            onChange={(e) => setHourIndex(Number(e.target.value))}
            id="select-hour"
          >
            {GIO_SINH_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Giới Tính */}
        <div className="form-group">
          <label className="form-label">Giới tính</label>
          <div className="radio-group">
            <div
              className={`radio-option ${gender === 1 ? 'selected' : ''}`}
              onClick={() => setGender(1)}
              role="radio"
              aria-checked={gender === 1}
              id="radio-nam"
            >
              <span className="radio-dot" />
              <span>♂ Nam</span>
            </div>
            <div
              className={`radio-option ${gender === 0 ? 'selected' : ''}`}
              onClick={() => setGender(0)}
              role="radio"
              aria-checked={gender === 0}
              id="radio-nu"
            >
              <span className="radio-dot" />
              <span>♀ Nữ</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
            <label className="form-label" htmlFor="view-year" style={{ margin: 0 }}>
              Năm xem lưu niên <span className="text-muted">(không bắt buộc)</span>
            </label>
            <div className="quick-year-chips">
              <button
                type="button"
                className={`quick-year-chip ${viewYear === String(currentYear) ? 'is-active' : ''}`}
                onClick={() => setViewYear(String(currentYear))}
              >
                Năm nay ({currentYear})
              </button>
              <button
                type="button"
                className={`quick-year-chip ${viewYear === String(currentYear + 1) ? 'is-active' : ''}`}
                onClick={() => setViewYear(String(currentYear + 1))}
              >
                Năm sau ({currentYear + 1})
              </button>
              {viewYear !== '' && (
                <button
                  type="button"
                  className="quick-year-clear-btn"
                  onClick={() => setViewYear('')}
                  title="Bỏ chọn năm lưu niên"
                >
                  ✕ Bỏ
                </button>
              )}
            </div>
          </div>
          <select
            id="view-year"
            className="form-select"
            value={viewYear}
            onChange={(event) => setViewYear(event.target.value)}
          >
            <option value="">-- Giữ nguyên lá số gốc --</option>
            {viewYearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {formError && <p role="alert" className="form-error">{formError}</p>}
        <button
          type="submit"
          className="btn-submit"
          id="btn-lap-la-so"
          disabled={!isFormValid}
          title={!isFormValid ? 'Vui lòng nhập họ tên để lập lá số' : 'Lập lá số Tử Vi'}
        >
          ✦ Lập Lá Số ✦
        </button>
        {!isFormValid && (
          <p className="btn-submit-hint" aria-live="polite">
            Nhập họ tên ở trên để kích hoạt nút Lập Lá Số
          </p>
        )}
      </form>
    </div>
  );
}
