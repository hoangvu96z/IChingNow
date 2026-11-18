import React, { useState, useMemo, useEffect } from 'react';
import { LunarMonth, LunarYear } from 'lunar-javascript';
import {
  solarToLunar,
  validateSolarDate,
  getYearCanChi,
  GIO_SINH_OPTIONS,
  getMonthsInYear,
  getDaysInMonth,
  getYearOptions,
  getViewYearOptions,
} from '../utils/lunarConverter';
import {
  VN_LOCATIONS,
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  formatTrueSolarClock,
  formatSignedMinutes,
  DEFAULT_SCHOOL_CONFIG,
  SCHOOL_OPTIONS,
  FAMOUS_CHARTS,
} from '../utils/tuViZiweiModule.js';
import { isValidLunarDateWithLeap } from '../utils/tuviProfiles.js';
import BirthHourRectifierModal from './BirthHourRectifierModal.jsx';

export function buildBirthInputPayload({
  name,
  day,
  month,
  year,
  hourIndex = 0,
  gender = 1,
  isLunar = false,
  calendarType,
  isLeapMonth = false,
  isLeap = false,
  viewYear = '',
  schoolConfig,
  clockHour,
  clockMinute,
  longitude,
  locationName,
  applyTrueSolar,
}) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    throw new Error('Vui lòng nhập họ tên trước khi lập lá số!');
  }

  const resolvedCalendarType =
    calendarType === 'lunar' || calendarType === 'solar'
      ? calendarType
      : isLunar
      ? 'lunar'
      : 'solar';
  const effectiveIsLunar = resolvedCalendarType === 'lunar';
  const effectiveIsLeap = effectiveIsLunar ? Boolean(isLeapMonth || isLeap) : false;

  let effectiveHourIndex = hourIndex;
  let effectiveDay = day;
  let effectiveMonth = month;
  let effectiveYear = year;

  if (
    applyTrueSolar &&
    !effectiveIsLunar &&
    clockHour !== undefined &&
    clockMinute !== undefined &&
    clockHour !== '' &&
    clockMinute !== ''
  ) {
    try {
      const calc = calculateTrueSolarTime({
        year: Number(year),
        month: Number(month),
        day: Number(day),
        clockHour: Number(clockHour),
        clockMinute: Number(clockMinute),
        longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : undefined,
      });
      if (calc) {
        effectiveHourIndex = calc.branch;
        const dayOffset = resolveZiweiDayOffset(calc, schoolConfig?.lateZishi || 'next-day');
        if (dayOffset !== 0) {
          const date = new Date(year, month - 1, day + dayOffset);
          effectiveYear = date.getFullYear();
          effectiveMonth = date.getMonth() + 1;
          effectiveDay = date.getDate();
        }
      }
    } catch {
      // Ignore calculation error and fallback
    }
  }

  let lunarData;
  if (effectiveIsLunar) {
    if (!isValidLunarDateWithLeap(effectiveYear, effectiveMonth, effectiveDay, effectiveIsLeap)) {
      throw new Error('Ngày âm lịch không tồn tại trong tháng đã chọn.');
    }
    const yearCanIndex = ((effectiveYear - 4) % 10 + 10) % 10;
    const yearChiIndex = ((effectiveYear - 4) % 12 + 12) % 12;
    const [yearCanName, yearChiName] = getYearCanChi(effectiveYear).split(' ');
    lunarData = {
      lunarYear: effectiveYear,
      lunarMonth: effectiveMonth,
      lunarDay: effectiveDay,
      yearCanIndex,
      yearChiIndex,
      yearCanName,
      yearChiName,
      isLeap: effectiveIsLeap,
      isLeapMonth: effectiveIsLeap,
      solarDateStr: '(Nhập âm lịch)',
      lunarDateStr: effectiveIsLeap
        ? `${effectiveMonth}/${effectiveDay}/${effectiveYear} (Âm lịch - Nhuận)`
        : `${effectiveMonth}/${effectiveDay}/${effectiveYear} (Âm lịch)`,
    };
  } else {
    if (!validateSolarDate(effectiveYear, effectiveMonth, effectiveDay)) {
      throw new Error('Ngày dương lịch không tồn tại trong tháng đã chọn.');
    }
    lunarData = solarToLunar(effectiveYear, effectiveMonth, effectiveDay);
  }

  const annualYear = viewYear === '' || viewYear === undefined || viewYear === null ? undefined : Number(viewYear);
  if (annualYear !== undefined && (!Number.isInteger(annualYear) || annualYear < 1900 || annualYear > 2100)) {
    throw new Error('Năm xem phải là số nguyên từ 1900 đến 2100.');
  }
  if (annualYear !== undefined && annualYear < lunarData.lunarYear) {
    throw new Error(`Năm xem lưu niên (${annualYear}) không thể trước năm sinh âm lịch (${lunarData.lunarYear}).`);
  }

  const extra = {};
  if (schoolConfig) extra.schoolConfig = schoolConfig;
  if (clockHour !== undefined && clockHour !== '') extra.clockHour = clockHour;
  if (clockMinute !== undefined && clockMinute !== '') extra.clockMinute = clockMinute;
  if (longitude !== undefined && longitude !== '') extra.longitude = longitude;
  if (locationName) extra.locationName = locationName;
  if (applyTrueSolar !== undefined) extra.applyTrueSolar = applyTrueSolar;

  return {
    name: trimmedName,
    ...lunarData,
    lunarHourIndex: effectiveHourIndex,
    gender,
    calendarType: resolvedCalendarType,
    isLunar: effectiveIsLunar,
    isLeap: effectiveIsLunar ? effectiveIsLeap : Boolean(lunarData.isLeap),
    isLeapMonth: effectiveIsLunar ? effectiveIsLeap : false,
    solarInput: effectiveIsLunar ? null : { day: effectiveDay, month: effectiveMonth, year: effectiveYear },
    ...(annualYear === undefined ? {} : {
      viewYear: annualYear,
      viewYearCanIndex: ((annualYear - 4) % 10 + 10) % 10,
      viewYearChiIndex: ((annualYear - 4) % 12 + 12) % 12,
    }),
    ...extra,
  };
}

function resolveSeedFormValues(seed) {
  if (!seed) return null;
  const isLunar = seed.calendarType
    ? seed.calendarType === 'lunar'
    : Boolean(seed.isLunar);
  const day = isLunar
    ? Number(seed.day ?? seed.lunarDay ?? 15)
    : Number(seed.day ?? seed.solarInput?.day ?? 15);
  const month = isLunar
    ? Number(seed.month ?? seed.lunarMonth ?? 1)
    : Number(seed.month ?? seed.solarInput?.month ?? 1);
  const year = isLunar
    ? Number(seed.year ?? seed.lunarYear ?? 1990)
    : Number(seed.year ?? seed.solarInput?.year ?? 1990);
  const hourIndex = Number(seed.hourValue ?? seed.hourIndex ?? seed.lunarHourIndex ?? 0);
  const gender = seed.gender === 0 ? 0 : 1;
  const isLeapMonth = isLunar ? Boolean(seed.isLeap || seed.isLeapMonth) : false;
  return {
    id: seed.id || seed.profileId || undefined,
    name: seed.name || '',
    day,
    month,
    year,
    hourIndex,
    gender,
    isLunar,
    isLeapMonth,
    lifeEvents: Array.isArray(seed.lifeEvents) ? seed.lifeEvents : [],
  };
}

export default function BirthInputForm({
  onSubmit,
  initialShowTrueSolar = false,
  initialShowSchoolConfig = false,
  presetProfile = null,
  initialValues = null,
  onDraftChange,
}) {
  const seedValues = useMemo(
    () => resolveSeedFormValues(initialValues || presetProfile),
    [initialValues, presetProfile],
  );

  const [name, setName] = useState(() => seedValues?.name || '');
  const [nameError, setNameError] = useState('');
  const [day, setDay] = useState(() => seedValues?.day || 15);
  const [month, setMonth] = useState(() => seedValues?.month || 1);
  const [year, setYear] = useState(() => seedValues?.year || 1990);
  const [hourIndex, setHourIndex] = useState(() => seedValues?.hourIndex ?? 0);
  const [gender, setGender] = useState(() => (seedValues?.gender === 0 ? 0 : 1)); // 1 = Nam, 0 = Nữ
  const [isLunar, setIsLunar] = useState(() => Boolean(seedValues?.isLunar));
  const [isLeapMonth, setIsLeapMonth] = useState(() => Boolean(seedValues?.isLeapMonth));
  const [viewYear, setViewYear] = useState('');
  const [formError, setFormError] = useState('');
  const [showRectifierModal, setShowRectifierModal] = useState(false);
  const [rectifiedEvents, setRectifiedEvents] = useState(() => seedValues?.lifeEvents || []);

  // ☀️ Chân Thái Dương Thời State
  const [showTrueSolar, setShowTrueSolar] = useState(initialShowTrueSolar);
  const [locationId, setLocationId] = useState('vn-ha-noi');
  const [clockHour, setClockHour] = useState('12');
  const [clockMinute, setClockMinute] = useState('00');
  const [customLongitude, setCustomLongitude] = useState('105.8542');
  const [locationName, setLocationName] = useState('Hà Nội');
  const [applyTrueSolar, setApplyTrueSolar] = useState(false);

  // ⚙️ Cấu Hình Trường Phái State
  const [showSchoolConfig, setShowSchoolConfig] = useState(initialShowSchoolConfig);
  const [schoolConfig, setSchoolConfig] = useState({ ...DEFAULT_SCHOOL_CONFIG });

  const calendarType = isLunar ? 'lunar' : 'solar';
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(() => getYearOptions(), []);
  const viewYearOptions = useMemo(() => getViewYearOptions(1920, 30), []);
  const monthOptions = useMemo(() => getMonthsInYear(), []);

  const yearLeapMonthNumber = useMemo(() => {
    if (!isLunar || !Number.isInteger(year)) return 0;
    try {
      return Number(LunarYear.fromYear(year)?.getLeapMonth?.() || 0);
    } catch {
      return 0;
    }
  }, [isLunar, year]);

  const dayOptions = useMemo(() => {
    if (isLunar && isLeapMonth && Number.isInteger(year) && Number.isInteger(month)) {
      try {
        const leapObj = LunarMonth.fromYm(year, -Math.abs(month));
        if (leapObj && typeof leapObj.getDayCount === 'function') {
          const count = leapObj.getDayCount();
          return Array.from({ length: count }, (_, idx) => ({
            value: idx + 1,
            label: `${idx + 1}`,
          }));
        }
      } catch {
        // Fallback to standard getDaysInMonth below
      }
    }
    return getDaysInMonth(isLunar, year, month);
  }, [isLunar, isLeapMonth, year, month]);

  // Group locations by region
  const locationsByRegion = useMemo(() => {
    const groups = {};
    for (const loc of VN_LOCATIONS) {
      const reg = loc.region || 'Khác';
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(loc);
    }
    return groups;
  }, []);

  useEffect(() => {
    const isValid = isLunar
      ? isValidLunarDateWithLeap(year, month, day, isLeapMonth)
      : validateSolarDate(year, month, day);
    if (isValid) return;
    const lastValidDay = dayOptions.at(-1)?.value;
    if (lastValidDay) setDay(lastValidDay);
  }, [day, dayOptions, isLunar, isLeapMonth, month, year]);

  useEffect(() => {
    if (!seedValues) return;
    setName(seedValues.name || '');
    setNameError('');
    setDay(seedValues.day || 15);
    setMonth(seedValues.month || 1);
    setYear(seedValues.year || 1990);
    setHourIndex(seedValues.hourIndex ?? 0);
    setGender(seedValues.gender === 0 ? 0 : 1);
    setIsLunar(Boolean(seedValues.isLunar));
    setIsLeapMonth(Boolean(seedValues.isLeapMonth));
    setRectifiedEvents(Array.isArray(seedValues.lifeEvents) ? seedValues.lifeEvents : []);
    setFormError('');
  }, [seedValues]);

  const matchedSeedProfileId = useMemo(() => {
    if (!seedValues?.id) return undefined;
    const sameIdentity =
      (name.trim() || 'Đương số').toLowerCase() === (seedValues.name.trim() || 'Đương số').toLowerCase() &&
      Boolean(isLunar) === Boolean(seedValues.isLunar) &&
      (isLunar ? Boolean(isLeapMonth) : false) === (seedValues.isLunar ? Boolean(seedValues.isLeapMonth) : false) &&
      day === seedValues.day &&
      month === seedValues.month &&
      year === seedValues.year &&
      hourIndex === seedValues.hourIndex &&
      gender === seedValues.gender;
    return sameIdentity ? seedValues.id : undefined;
  }, [seedValues, name, isLunar, isLeapMonth, day, month, year, hourIndex, gender]);

  useEffect(() => {
    if (!onDraftChange) return;
    const effectiveLeap = calendarType === 'lunar' ? Boolean(isLeapMonth) : false;
    onDraftChange({
      profileId: matchedSeedProfileId,
      name: name.trim() || 'Đương số',
      day,
      month,
      year,
      lunarDay: day,
      lunarMonth: month,
      lunarYear: year,
      solarInput: isLunar ? null : { day, month, year },
      lunarHourIndex: hourIndex,
      hourIndex,
      gender,
      calendarType,
      isLunar,
      isLeap: effectiveLeap,
      isLeapMonth: effectiveLeap,
      lifeEvents: rectifiedEvents,
    });
  }, [
    name,
    day,
    month,
    year,
    hourIndex,
    gender,
    calendarType,
    isLunar,
    isLeapMonth,
    rectifiedEvents,
    matchedSeedProfileId,
    onDraftChange,
  ]);

  const handleApplyRectifiedCandidate = (candidate, pastEvents = []) => {
    if (!candidate?.formPatch) return;
    const effectiveName = name.trim() || candidate.formPatch.name || 'Đương số';
    const nextIsLunar = Boolean(candidate.formPatch.isLunar);
    const nextIsLeap = nextIsLunar ? Boolean(candidate.formPatch.isLeapMonth || candidate.formPatch.isLeap) : false;

    setName(effectiveName);
    setNameError('');
    setDay(candidate.formPatch.day);
    setMonth(candidate.formPatch.month);
    setYear(candidate.formPatch.year);
    setHourIndex(candidate.formPatch.hourIndex);
    setGender(candidate.formPatch.gender);
    setIsLunar(nextIsLunar);
    setIsLeapMonth(nextIsLeap);
    setApplyTrueSolar(false);
    setRectifiedEvents(pastEvents);
    setShowRectifierModal(false);
    setFormError('');

    try {
      const payload = buildBirthInputPayload({
        name: effectiveName,
        day: candidate.formPatch.day,
        month: candidate.formPatch.month,
        year: candidate.formPatch.year,
        hourIndex: candidate.formPatch.hourIndex,
        gender: candidate.formPatch.gender,
        calendarType: nextIsLunar ? 'lunar' : 'solar',
        isLunar: nextIsLunar,
        isLeap: nextIsLeap,
        isLeapMonth: nextIsLeap,
        viewYear,
        schoolConfig,
      });
      onSubmit({
        ...payload,
        ...(Array.isArray(pastEvents) && pastEvents.length > 0 ? { lifeEvents: pastEvents } : {}),
      });
    } catch (err) {
      setFormError(err.message || 'Không thể lập lá số từ giờ sinh đã chọn.');
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (nameError && val.trim()) {
      setNameError('');
    }
  };

  // Chọn lá số mẫu / danh nhân
  const handleSelectFamousChart = (chart) => {
    setName(chart.name);
    setNameError('');
    setIsLunar(false);
    setIsLeapMonth(false);
    setYear(chart.solarYear);
    setMonth(chart.solarMonth);
    setDay(chart.solarDay);
    setHourIndex(chart.hourIndex);
    setGender(chart.gender);
    setViewYear('');
    setFormError('');
  };

  // Thay đổi địa điểm nơi sinh
  const handleLocationChange = (e) => {
    const id = e.target.value;
    setLocationId(id);
    if (id === 'custom') {
      setLocationName('Tùy chỉnh');
      return;
    }
    const found = VN_LOCATIONS.find((l) => l.id === id);
    if (found) {
      setCustomLongitude(String(found.longitude));
      setLocationName(found.name);
    }
  };

  // Tính live preview Chân Thái Dương Thời
  const solarCalculation = useMemo(() => {
    if (isLunar || !year || !month || !day) return null;
    const h = Number(clockHour);
    const m = Number(clockMinute);
    if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) return null;
    const lon = customLongitude !== '' && Number.isFinite(Number(customLongitude)) ? Number(customLongitude) : 105.8542;
    try {
      return calculateTrueSolarTime({
        year: Number(year),
        month: Number(month),
        day: Number(day),
        clockHour: h,
        clockMinute: m,
        longitude: lon,
      });
    } catch {
      return null;
    }
  }, [isLunar, year, month, day, clockHour, clockMinute, customLongitude]);

  const handleApplySolarToForm = () => {
    if (solarCalculation) {
      setHourIndex(solarCalculation.branch);
      setApplyTrueSolar(true);
    }
  };

  const handleSchoolConfigChange = (key, value) => {
    setSchoolConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      const effectiveLeap = calendarType === 'lunar' ? Boolean(isLeapMonth) : false;
      const payload = buildBirthInputPayload({
        name: trimmedName,
        day,
        month,
        year,
        hourIndex,
        gender,
        calendarType,
        isLunar,
        isLeap: effectiveLeap,
        isLeapMonth: effectiveLeap,
        viewYear,
        schoolConfig,
        clockHour: showTrueSolar ? clockHour : undefined,
        clockMinute: showTrueSolar ? clockMinute : undefined,
        longitude: showTrueSolar ? customLongitude : undefined,
        locationName: showTrueSolar ? locationName : undefined,
        applyTrueSolar: showTrueSolar ? applyTrueSolar : false,
      });
      onSubmit({
        ...payload,
        ...(matchedSeedProfileId ? { profileId: matchedSeedProfileId } : {}),
        ...(rectifiedEvents.length > 0 ? { lifeEvents: rectifiedEvents } : {}),
      });
    } catch (error) {
      setFormError(error.message || 'Không thể lập lá số từ thông tin này.');
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <div className="form-container">
      {/* Chọn Nhanh Lá Số Mẫu / Danh Nhân */}
      <div className="famous-charts-strip" aria-label="Chọn nhanh lá số mẫu hoặc danh nhân">
        <div className="famous-charts-label">
          <span>🌟 Chọn Nhanh Lá Số Mẫu / Danh Nhân:</span>
        </div>
        <div className="famous-charts-scroll">
          {FAMOUS_CHARTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="famous-chart-chip"
              onClick={() => handleSelectFamousChart(c)}
              title={`${c.subtitle} · ${c.solarDay}/${c.solarMonth}/${c.solarYear}`}
            >
              <span className="famous-chart-name">{c.name}</span>
              <span className="famous-chart-sub">({c.category})</span>
            </button>
          ))}
        </div>
      </div>

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
            <div
              style={{
                color: '#e53e3e',
                fontSize: '0.78rem',
                marginTop: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 500,
              }}
            >
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
            ☀️ Dương Lịch
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
            🌙 Âm Lịch
          </span>
        </div>

        {/* Ngày Sinh */}
        <div className="form-group">
          <label className="form-label">
            Ngày sinh {isLunar ? '(Âm Lịch)' : '(Dương Lịch)'}
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

          {calendarType === 'lunar' && (
            <div className="tv-leap-month-toggle-row">
              <label
                htmlFor="input-leap-month"
                className={`tv-leap-month-label ${isLeapMonth ? 'is-checked' : ''}`}
              >
                <input
                  id="input-leap-month"
                  type="checkbox"
                  checked={isLeapMonth}
                  onChange={(e) => setIsLeapMonth(e.target.checked)}
                />
                <span>Tháng nhuận (Âm lịch)</span>
              </label>
              {yearLeapMonthNumber > 0 && (
                <span className="tv-leap-month-hint">
                  Năm {year} nhuận Tháng {yearLeapMonthNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Giờ Sinh */}
        <div className="form-group">
          <div className="birth-hour-label-row">
            <label className="form-label" htmlFor="select-hour" style={{ margin: 0 }}>
              Giờ sinh (12 Canh Giờ)
            </label>
            <button
              type="button"
              className="btn-open-rectifier"
              onClick={() => setShowRectifierModal(true)}
            >
              <span aria-hidden="true">🧭</span> Không chắc giờ sinh? Khảo &amp; Định giờ chuẩn
            </button>
          </div>
          {applyTrueSolar && solarCalculation && (
            <div style={{ marginBottom: 6 }}>
              <span className="solar-applied-pill">
                ☀️ Đang áp dụng Chân Thái Dương: Canh {solarCalculation.branchName}
              </span>
            </div>
          )}
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

        {/* Năm Xem Lưu Niên */}
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

        {/* ☀️ Collapsible Section: Chân Thái Dương Thời */}
        <div className="collapsible-form-section">
          <button
            type="button"
            className="collapsible-header"
            onClick={() => setShowTrueSolar((prev) => !prev)}
            aria-expanded={showTrueSolar}
          >
            <span>☀️ Hiệu Chỉnh Giờ Mặt Trời Thật (Chân Thái Dương Thời)</span>
            <span className="collapsible-arrow">{showTrueSolar ? '▲' : '▼'}</span>
          </button>

          {showTrueSolar && (
            <div className="collapsible-content">
              <p className="collapsible-tip">
                Hiệu chỉnh dựa trên Kinh độ nơi sinh và Phương trình thời gian (Equation of Time) theo chuẩn thiên văn học.
              </p>

              <div className="form-group">
                <label className="form-label">Tỉnh / Thành phố nơi sinh</label>
                <select
                  className="form-select"
                  value={locationId}
                  onChange={handleLocationChange}
                >
                  {Object.entries(locationsByRegion).map(([region, locs]) => (
                    <optgroup key={region} label={region}>
                      {locs.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.longitude}°E)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="custom">-- Tùy chỉnh kinh độ riêng --</option>
                </select>
              </div>

              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Giờ đồng hồ (0–23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="form-input"
                    value={clockHour}
                    onChange={(e) => setClockHour(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phút đồng hồ (0–59)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="form-input"
                    value={clockMinute}
                    onChange={(e) => setClockMinute(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kinh độ (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={customLongitude}
                    onChange={(e) => {
                      setCustomLongitude(e.target.value);
                      setLocationId('custom');
                    }}
                  />
                </div>
              </div>

              {solarCalculation && (
                <div className="solar-preview-card">
                  <div className="solar-preview-header">
                    <strong>Kết Quả Tính Toán Chân Thái Dương</strong>
                    <span className="solar-clock-badge">
                      {formatTrueSolarClock(solarCalculation)}
                    </span>
                  </div>
                  <div className="solar-preview-grid">
                    <div>
                      <span className="label">Lệch kinh độ:</span>{' '}
                      <strong>{formatSignedMinutes(solarCalculation.longitudeCorrectionMinutes)} phút</strong>
                    </div>
                    <div>
                      <span className="label">Phương trình thời gian (EoT):</span>{' '}
                      <strong>{formatSignedMinutes(solarCalculation.equationOfTimeMinutes)} phút</strong>
                    </div>
                    <div>
                      <span className="label">Tổng hiệu chỉnh:</span>{' '}
                      <strong>{formatSignedMinutes(solarCalculation.totalCorrectionMinutes)} phút</strong>
                    </div>
                    <div>
                      <span className="label">Canh giờ quy đổi:</span>{' '}
                      <strong className="gold">Giờ {solarCalculation.branchName}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-apply-solar"
                      onClick={handleApplySolarToForm}
                    >
                      ✓ Áp Dụng Giờ {solarCalculation.branchName} Vào Giờ Sinh
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={applyTrueSolar}
                        onChange={(e) => setApplyTrueSolar(e.target.checked)}
                      />
                      <span>Tự động áp dụng Chân Thái Dương khi lập lá số</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ⚙️ Collapsible Section: Cấu Hình Trường Phái & Lịch Pháp */}
        <div className="collapsible-form-section">
          <button
            type="button"
            className="collapsible-header"
            onClick={() => setShowSchoolConfig((prev) => !prev)}
            aria-expanded={showSchoolConfig}
          >
            <span>⚙️ Cấu Hình Trường Phái & Lịch Pháp</span>
            <span className="collapsible-arrow">{showSchoolConfig ? '▲' : '▼'}</span>
          </button>

          {showSchoolConfig && (
            <div className="collapsible-content">
              {/* Phân đoạn Giờ Tý */}
              <div className="form-group">
                <label className="form-label">Phân Đoạn Giờ Tý Sớm / Muộn (23:00–00:00)</label>
                <select
                  className="form-select"
                  value={schoolConfig.lateZishi}
                  onChange={(e) => handleSchoolConfigChange('lateZishi', e.target.value)}
                >
                  {SCHOOL_OPTIONS.lateZishi.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chính sách Tháng Nhuận */}
              <div className="form-group">
                <label className="form-label">Chính Sách Tháng Nhuận</label>
                <select
                  className="form-select"
                  value={schoolConfig.leapMonth}
                  onChange={(e) => handleSchoolConfigChange('leapMonth', e.target.value)}
                >
                  {SCHOOL_OPTIONS.leapMonth.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trường phái Độ sáng sao */}
              <div className="form-group">
                <label className="form-label">Trường Phái Độ Sáng Sao (Miếu / Vượng / Đắc / Hãm)</label>
                <select
                  className="form-select"
                  value={schoolConfig.brightnessSchool}
                  onChange={(e) => handleSchoolConfigChange('brightnessSchool', e.target.value)}
                >
                  {SCHOOL_OPTIONS.brightnessSchool.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tứ Hóa Can Canh */}
              <div className="form-group">
                <label className="form-label">Trường Phái Tứ Hóa Can Canh</label>
                <select
                  className="form-select"
                  value={schoolConfig.gengYearSihua}
                  onChange={(e) => handleSchoolConfigChange('gengYearSihua', e.target.value)}
                >
                  {SCHOOL_OPTIONS.gengYearSihua.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
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
            Nhập họ tên để lập lá số Tử Vi.
          </p>
        )}
      </form>

      <BirthHourRectifierModal
        isOpen={showRectifierModal}
        onClose={() => setShowRectifierModal(false)}
        baseInput={{
          name: name.trim() || 'Đương số',
          day,
          month,
          year,
          hourIndex,
          gender,
          calendarType,
          isLunar,
          isLeap: calendarType === 'lunar' ? Boolean(isLeapMonth) : false,
          isLeapMonth: calendarType === 'lunar' ? Boolean(isLeapMonth) : false,
          schoolConfig,
        }}
        initialEvents={rectifiedEvents}
        onApplyCandidate={handleApplyRectifiedCandidate}
      />
    </div>
  );
}
