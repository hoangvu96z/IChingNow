import React, { useState, useMemo } from 'react';
import { solarToLunar, GIO_SINH_OPTIONS, getMonthsInYear, getDaysInMonth, getYearOptions } from '../utils/lunarConverter';

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

  const yearOptions = useMemo(() => getYearOptions(), []);
  const monthOptions = useMemo(() => getMonthsInYear(), []);
  const dayOptions = useMemo(() => getDaysInMonth(isLunar), [isLunar]);

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
      let lunarData;
      if (isLunar) {
        // User nhập trực tiếp âm lịch
        const yearCanIndex = (year - 4) % 10;
        const yearChiIndex = (year - 4) % 12;
        lunarData = {
          lunarYear: year,
          lunarMonth: month,
          lunarDay: day,
          yearCanIndex: yearCanIndex < 0 ? yearCanIndex + 10 : yearCanIndex,
          yearChiIndex: yearChiIndex < 0 ? yearChiIndex + 12 : yearChiIndex,
          isLeap: false,
          solarDateStr: '(Nhập âm lịch)',
          lunarDateStr: `${month}/${day}/${year} (Âm lịch)`,
        };
      } else {
        // Convert dương lịch → âm lịch
        lunarData = solarToLunar(year, month, day);
      }

      const annualYear = viewYear === '' ? undefined : Number(viewYear);
      if (annualYear !== undefined && (!Number.isInteger(annualYear) || annualYear < 1900 || annualYear > 2100)) {
        throw new Error('Năm xem phải là số nguyên từ 1900 đến 2100.');
      }
      onSubmit({
        name: trimmedName,
        ...lunarData,
        lunarHourIndex: hourIndex,
        gender,
        isLunar,
        solarInput: { day, month, year },
        ...(annualYear === undefined ? {} : {
          viewYear: annualYear,
          viewYearCanIndex: (annualYear - 4) % 10,
          viewYearChiIndex: (annualYear - 4) % 12,
        }),
      });
    } catch (error) {
      setFormError(error.message || 'Không thể lập lá số từ thông tin này.');
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <div className="form-container">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2 className="form-title">🔮 Lập Lá Số Tử Vi</h2>
        <p className="form-subtitle">Nhập thông tin ngày giờ sinh để an lá số Tử Vi Đẩu Số</p>

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
          <label className="form-label" htmlFor="view-year">Năm xem lưu niên <span className="text-muted">(không bắt buộc)</span></label>
          <input id="view-year" className="form-input" type="number" min="1900" max="2100" step="1"
            value={viewYear} onChange={event => setViewYear(event.target.value)} placeholder="Để trống nếu chỉ xem lá số gốc" />
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
      </form>
    </div>
  );
}
