import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ssoRequest } from '../services/ssoApi';
import { decryptData } from '../utils/cryptoUtils';
import {
  buildCompatibility,
  compatibilityEvidence,
  compatibilityPrompt,
  compatibilityText,
  computeYearlyCompatibilityForecast,
  upgradeRestoredCompatibilityPair,
  WEIGHTS,
} from '../utils/compatibility';
import { getMonthsInYear, getYearCanChi, getYearOptions } from '../utils/lunarConverter';
import {
  loadSavedProfiles,
  profileToHopHonPerson,
  consumeHopHonProfilesHandoff,
} from '../utils/tuviProfiles';
import LasoChart from './LasoChart';
import TuViAiPanel from './TuViAiPanel';
import TuViEvidenceProvider from './TuViEvidenceProvider';
import './HopHonPage.css';

const HISTORY_APP = 'tuvi-hop-hon';

const emptyPerson = (gioiTinh) => ({
  hoTen: '',
  ngay: '',
  thang: '',
  nam: '',
  gio: '',
  gioiTinh,
  isLunar: false,
  isLeap: false,
});

const CANH_GIO_ITEMS = [
  { chiIndex: 0, chi: 'Tý', range: '23h–01h', representativeHour: 0 },
  { chiIndex: 1, chi: 'Sửu', range: '01h–03h', representativeHour: 2 },
  { chiIndex: 2, chi: 'Dần', range: '03h–05h', representativeHour: 4 },
  { chiIndex: 3, chi: 'Mão', range: '05h–07h', representativeHour: 6 },
  { chiIndex: 4, chi: 'Thìn', range: '07h–09h', representativeHour: 8 },
  { chiIndex: 5, chi: 'Tỵ', range: '09h–11h', representativeHour: 10 },
  { chiIndex: 6, chi: 'Ngọ', range: '11h–13h', representativeHour: 12 },
  { chiIndex: 7, chi: 'Mùi', range: '13h–15h', representativeHour: 14 },
  { chiIndex: 8, chi: 'Thân', range: '15h–17h', representativeHour: 16 },
  { chiIndex: 9, chi: 'Dậu', range: '17h–19h', representativeHour: 18 },
  { chiIndex: 10, chi: 'Tuất', range: '19h–21h', representativeHour: 20 },
  { chiIndex: 11, chi: 'Hợi', range: '21h–23h', representativeHour: 22 },
];

const CARD_ORDER = ['tamHop', 'phiTinh', 'tinhCach', 'nguHanhDaoHoa'];

const CARD_ICONS = {
  tamHop: '☯️',
  phiTinh: '✨',
  tinhCach: '⚖️',
  nguHanhDaoHoa: '🔥',
  nguHanh: '🔥',
  phuThe: '💍',
  tuHoa: '✨',
  daoHoa: '🌸',
};

const TIER_META = {
  thuong_dang: { badge: '✨ Thượng Đẳng Hợp Hôn', cls: 'tier-thuong-dang' },
  trung_thuong: { badge: '🌟 Trung Thượng Hòa Hợp', cls: 'tier-trung-thuong' },
  trung_binh: { badge: '⚖️ Trung Bình Tương Dung', cls: 'tier-trung-binh' },
  can_hoa_giai: { badge: '🧭 Cần Thấu Hiểu & Hóa Giải', cls: 'tier-can-hoa-giai' },
};

const REPORT_TABS = [
  { id: 'overview', icon: '📊', label: 'Tổng Quan & 4 Trụ Cột', shortLabel: 'Tổng quan' },
  { id: 'charts', icon: '🗺️', label: 'Hai Lá Số & Đối Chiếu Cung', shortLabel: '2 Lá số' },
  { id: 'tamHop', icon: '☯️', label: 'Tam Hợp & Tính Cách', shortLabel: 'Tam hợp' },
  { id: 'phiTinh', icon: '✨', label: 'Phi Tinh Tứ Hóa 2 Chiều', shortLabel: 'Phi tinh' },
  { id: 'forecast', icon: '🌸', label: 'Tình Duyên & Vận Hạn 1–10 Năm', shortLabel: 'Dự báo' },
  { id: 'all', icon: '📑', label: 'Xem Liền Mạch', shortLabel: 'Tất cả' },
];

const EMOTIONAL_TRAITS = [
  { key: 'nongNay', icon: '🔥', label: 'Nóng nảy · Bộc trực' },
  { key: 'hayGhen', icon: '💜', label: 'Hay ghen · Nhạy cảm' },
  { key: 'tuAiCao', icon: '👑', label: 'Tự ái · Cái tôi cao' },
  { key: 'apDat', icon: '⚡', label: 'Chủ quan · Áp đặt' },
  { key: 'khacKhau', icon: '💬', label: 'Khắc khẩu · Tranh luận' },
];

const KEY_AUX_STARS = new Set([
  'Tả Phụ', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt', 'Lộc Tồn', 'Thiên Mã',
  'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ',
  'Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp',
  'Đào Hoa', 'Hồng Loan', 'Thiên Hỷ', 'Cô Thần', 'Quả Tú', 'Thiên Hình', 'Thiên Riêu',
]);

function toText(val, fallback = '—') {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    const joined = val.map((item) => toText(item, '')).filter(Boolean).join(', ');
    return joined || fallback;
  }
  if (typeof val === 'object') {
    return val.label || val.title || val.name || val.summary || val.detail || val.text || fallback;
  }
  return fallback;
}

function toStringList(val) {
  if (!val) return [];
  if (typeof val === 'string') return val.trim() ? [val.trim()] : [];
  if (Array.isArray(val)) {
    return val.map((item) => toText(item, '')).filter(Boolean);
  }
  return [];
}

function formatDelta(delta) {
  if (delta === undefined || delta === null || delta === '') return null;
  if (typeof delta === 'number') {
    if (delta === 0) return '0';
    return delta > 0 ? `+${delta}` : `${delta}`;
  }
  return String(delta).trim();
}

function getSiHuaClass(siHua) {
  const s = String(siHua || '').toLowerCase();
  if (s.includes('lộc') || s.includes('loc')) return 'sihua-loc';
  if (s.includes('quyền') || s.includes('quyen')) return 'sihua-quyen';
  if (s.includes('khoa')) return 'sihua-khoa';
  if (s.includes('kỵ') || s.includes('ky')) return 'sihua-ky';
  return 'sihua-neutral';
}

function findPalace(result, baseName) {
  return result?.palates?.find((p) => p.chucNang?.replace(' <THÂN>', '').trim() === baseName) || null;
}

function formatPalaceSummary(palace, includeAux = false) {
  if (!palace) return '—';
  const pos = palace.canName && palace.chiName ? `${palace.canName} ${palace.chiName}` : palace.chiName || '';
  const main = palace.chinhTinh?.length ? palace.chinhTinh.join(', ') : 'Vô Chính Diệu';
  const tags = [];
  if (palace.isTuan) tags.push('Tuần');
  if (palace.isTriet) tags.push('Triệt');
  if (!includeAux) {
    return `${pos ? `[${pos}] ` : ''}${main}${tags.length ? ` · (${tags.join(', ')})` : ''}`;
  }
  const aux = (palace.phuTinh || []).filter((s) => KEY_AUX_STARS.has(s));
  const auxStr = aux.length ? ` · Phụ tinh: ${aux.slice(0, 7).join(', ')}` : '';
  return `${pos ? `[${pos}] ` : ''}${main}${auxStr}${tags.length ? ` · (${tags.join(', ')})` : ''}`;
}

function extractChartProfile(sideData) {
  const result = sideData?.result || {};
  const person = sideData?.person || {};
  const input = sideData?.inputData || {};

  const menhPalace = findPalace(result, 'Mệnh');
  const thanPalace = result?.palates?.find((p) => p.chucNang?.includes('<THÂN>')) || null;
  const phuThePalace = findPalace(result, 'Phu Thê');
  const phucDucPalace = findPalace(result, 'Phúc Đức');
  const dienTrachPalace = findPalace(result, 'Điền Trạch');
  const tuTucPalace = findPalace(result, 'Tử Tức');

  let laiNhanText = '—';
  if (person.laiNhanCung) {
    if (typeof person.laiNhanCung === 'string') {
      laiNhanText = person.laiNhanCung;
    } else if (typeof person.laiNhanCung === 'object') {
      const pName = person.laiNhanCung.palaceName || person.laiNhanCung.chucNang || '';
      const pPos = person.laiNhanCung.canName && person.laiNhanCung.chiName
        ? `${person.laiNhanCung.canName} ${person.laiNhanCung.chiName}`
        : person.laiNhanCung.chiName || '';
      laiNhanText = [pName, pPos ? `[${pPos}]` : ''].filter(Boolean).join(' ') || '—';
    }
  } else if (result.canChiNam && Array.isArray(result.palates)) {
    const yearStem = result.canChiNam.split(' ')[0];
    const laiPalace = result.palates.find((p) => p.canName === yearStem && p.chiIndex !== 0 && p.chiIndex !== 1)
      || result.palates.find((p) => p.canName === yearStem);
    if (laiPalace) {
      laiNhanText = `${laiPalace.chucNang.replace(' <THÂN>', '')} [${laiPalace.canName} ${laiPalace.chiName}]`;
    }
  }

  const canhGio = Number.isInteger(input.lunarHourIndex) ? CANH_GIO_ITEMS[input.lunarHourIndex] : null;
  const birthNote = input.lunarDay && input.lunarMonth && input.lunarYear
    ? `Âm lịch: ${input.lunarDay}/${input.lunarMonth}${input.isLeap ? ' (nhuận)' : ''}/${input.lunarYear}${canhGio ? ` · Giờ ${canhGio.chi}` : ''}`
    : '';

  return {
    canChiInfo: `${result.canChiNam || person.canChiNam || '—'} · ${result.amDuongNamNu || person.gioiTinh || ''}${birthNote ? ` (${birthNote})` : ''}`,
    napAm: person.napAm || result.banMenhNapAm || '—',
    cuc: person.cucName || result.cucName || '—',
    chuMenhThan: `Chủ Mệnh: ${result.chuMenh || '—'} · Chủ Thân: ${result.chuThan || '—'}`,
    laiNhan: laiNhanText,
    menh: formatPalaceSummary(menhPalace, false),
    than: thanPalace
      ? `Thân cư ${thanPalace.chucNang.replace(' <THÂN>', '')} · ${formatPalaceSummary(thanPalace, false)}`
      : '—',
    phuThe: formatPalaceSummary(phuThePalace, true),
    phucDuc: formatPalaceSummary(phucDucPalace, true),
    dienTu: `Điền: ${formatPalaceSummary(dienTrachPalace, false)} | Tử: ${formatPalaceSummary(tuTucPalace, false)}`,
  };
}

function ScoreRing({ score, size = 176, strokeWidth = 7 }) {
  const gradId = useId();
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 90);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="hh-score-wrapper">
      <div className="hh-score-glow" aria-hidden="true" />
      <svg className="hh-score-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-gold)" />
            <stop offset="100%" stopColor="var(--accent-gold-bright)" />
          </linearGradient>
        </defs>
        <circle className="hh-score-ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="hh-score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            stroke: `url(#${gradId})`,
            strokeDasharray: circumference,
            strokeDashoffset: animated ? offset : circumference,
          }}
        />
      </svg>
      <div className="hh-score">
        <strong>{safeScore}</strong>
        <span>/ 100 điểm</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, max = 100, tone = 'gold', label }) {
  const safeVal = Math.max(0, Math.min(max, Number(value) || 0));
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((safeVal / max) * 100), 80);
    return () => clearTimeout(t);
  }, [safeVal, max]);
  return (
    <div
      className={`hh-progress hh-progress-${tone}`}
      role="progressbar"
      aria-valuenow={safeVal}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || `${safeVal}/${max}`}
    >
      <div className="hh-progress-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

function PersonForm({ label, value, onChange, side, savedProfiles = [] }) {
  const formId = useId();
  const isLunar = Boolean(value.isLunar);
  const isLeap = Boolean(value.isLeap);
  const currentYear = new Date().getFullYear();

  const matchedProfileId = useMemo(() => {
    if (!savedProfiles.length || !value.hoTen) return '';
    const match = savedProfiles.find((p) => {
      const mapped = profileToHopHonPerson(p);
      return (
        mapped.hoTen === value.hoTen &&
        Number(mapped.ngay) === Number(value.ngay) &&
        Number(mapped.thang) === Number(value.thang) &&
        Number(mapped.nam) === Number(value.nam) &&
        Number(mapped.gio) === Number(value.gio) &&
        mapped.gioiTinh === value.gioiTinh &&
        Boolean(mapped.isLunar) === Boolean(value.isLunar)
      );
    });
    return match ? match.id : '';
  }, [savedProfiles, value]);

  const handleSelectSavedProfile = (e) => {
    const profileId = e.target.value;
    if (!profileId) return;
    const found = savedProfiles.find((p) => p.id === profileId);
    if (found) {
      onChange(profileToHopHonPerson(found));
    }
  };

  const set = (key, data) => onChange({ ...value, [key]: data });

  const setCalendarMode = (nextLunar) => {
    const clampedDay = nextLunar && Number(value.ngay) > 30 ? 30 : value.ngay;
    onChange({
      ...value,
      isLunar: nextLunar,
      isLeap: nextLunar ? Boolean(value.isLeap) : false,
      ngay: clampedDay,
    });
  };

  const dateValue = !isLunar && value.nam && value.thang && value.ngay
    ? `${String(value.nam).padStart(4, '0')}-${String(value.thang).padStart(2, '0')}-${String(value.ngay).padStart(2, '0')}`
    : '';

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) {
      onChange({ ...value, ngay: '', thang: '', nam: '' });
      return;
    }
    const [y, m, d] = val.split('-').map(Number);
    onChange({ ...value, nam: y, thang: m, ngay: d });
  };

  const yearOptions = useMemo(() => {
    const base = getYearOptions().filter((opt) => opt.value <= currentYear);
    if (value.nam && !base.some((opt) => opt.value === Number(value.nam))) {
      return [...base, { value: Number(value.nam), label: `${value.nam}` }].sort((a, b) => b.value - a.value);
    }
    return base;
  }, [currentYear, value.nam]);

  const monthOptions = useMemo(() => getMonthsInYear(), []);
  const lunarDayOptions = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  let canChiYear = '';
  if (isLunar && value.nam) {
    canChiYear = getYearCanChi(Number(value.nam));
  } else if (!isLunar && value.nam && value.thang && value.ngay) {
    canChiYear = getYearCanChi(value.nam, value.thang, value.ngay);
  }

  const hourNum = value.gio !== '' && value.gio !== null && value.gio !== undefined ? Number(value.gio) : null;
  const activeChiIndex = hourNum !== null && Number.isInteger(hourNum) && hourNum >= 0 && hourNum <= 23
    ? Math.floor((hourNum + 1) / 2) % 12
    : '';
  const canhGioInfo = activeChiIndex !== '' ? CANH_GIO_ITEMS[activeChiIndex] : null;

  const personIcon = value.gioiTinh === 'Nữ' ? '👩' : value.gioiTinh === 'Nam' ? '👨' : side === 'A' ? '👨' : '👩';

  return (
    <fieldset className={`hh-person hh-person-${side === 'A' ? 'a' : 'b'}`}>
      <legend className="hh-sr-only">{label}</legend>
      <div className="hh-person-heading" aria-hidden="true">
        <span className="hh-person-icon">{personIcon}</span>
        <span>{label}</span>
      </div>

      {savedProfiles.length > 0 && (
        <div className="hh-field hh-profile-picker-field">
          <label htmlFor={`${formId}-saved-profile`}>📒 Chọn từ Danh bạ Đương số</label>
          <select
            id={`${formId}-saved-profile`}
            className="hh-profile-picker-select"
            value={matchedProfileId}
            onChange={handleSelectSavedProfile}
          >
            <option value="">— Chọn nhanh hồ sơ đã lưu ({savedProfiles.length}) —</option>
            {savedProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isDefaultSelf ? '⭐ ' : ''}
                {p.name} ({p.gender === 0 ? 'Nữ' : 'Nam'} · {p.day}/{p.month}/{p.year}{' '}
                {p.calendarType === 'lunar' ? 'ÂL' : 'DL'} · Giờ {p.hourBranch})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="hh-field">
        <label htmlFor={`${formId}-name`}>Họ và tên <span aria-hidden="true">*</span></label>
        <input
          id={`${formId}-name`}
          name={`hoTen-${side}`}
          required
          maxLength={100}
          autoComplete="name"
          placeholder="Nhập họ và tên..."
          value={value.hoTen}
          onChange={(e) => set('hoTen', e.target.value)}
        />
      </div>

      <div className="hh-calendar-bar">
        <span className="hh-calendar-label">Lịch ngày sinh:</span>
        <div className="hh-pill-toggle hh-pill-toggle-2" role="group" aria-label={`Hệ lịch ngày sinh ${label}`}>
          <button
            type="button"
            className={!isLunar ? 'is-active' : ''}
            aria-pressed={!isLunar}
            onClick={() => setCalendarMode(false)}
          >
            ☀️ Dương lịch
          </button>
          <button
            type="button"
            className={isLunar ? 'is-active' : ''}
            aria-pressed={isLunar}
            onClick={() => setCalendarMode(true)}
          >
            🌙 Âm lịch
          </button>
        </div>
      </div>

      {!isLunar ? (
        <div className="hh-field">
          <div className="hh-label-row">
            <label htmlFor={`${formId}-solar`}>Ngày sinh Dương lịch <span aria-hidden="true">*</span></label>
            {canChiYear && <span className="hh-can-chi">✦ Năm {canChiYear}</span>}
          </div>
          <input
            id={`${formId}-solar`}
            name={`solarDate-${side}`}
            type="date"
            required
            min="1900-01-01"
            max={`${currentYear}-12-31`}
            value={dateValue}
            onChange={handleDateChange}
            onClick={(e) => {
              try { e.target.showPicker?.(); } catch { }
            }}
          />
          {dateValue && (
            <div className="hh-date-readout">
              Ngày {String(value.ngay).padStart(2, '0')} / Tháng {String(value.thang).padStart(2, '0')} / Năm {value.nam} (Dương lịch)
            </div>
          )}
        </div>
      ) : (
        <div className="hh-field">
          <div className="hh-label-row">
            <span className="hh-field-heading">Ngày · Tháng · Năm Âm lịch <span aria-hidden="true">*</span></span>
            {canChiYear && <span className="hh-can-chi">✦ Năm {canChiYear}</span>}
          </div>
          <div className="hh-lunar-grid">
            <div>
              <label htmlFor={`${formId}-lday`} className="hh-sub-label">Ngày</label>
              <select
                id={`${formId}-lday`}
                name={`lunarDay-${side}`}
                required
                value={value.ngay}
                onChange={(e) => set('ngay', e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Ngày</option>
                {lunarDayOptions.map((d) => (
                  <option key={d} value={d}>Ngày {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-lmonth`} className="hh-sub-label">Tháng</label>
              <select
                id={`${formId}-lmonth`}
                name={`lunarMonth-${side}`}
                required
                value={value.thang}
                onChange={(e) => set('thang', e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Tháng</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-lyear`} className="hh-sub-label">Năm</label>
              <select
                id={`${formId}-lyear`}
                name={`lunarYear-${side}`}
                required
                value={value.nam}
                onChange={(e) => set('nam', e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Năm</option>
                {yearOptions.map((y) => (
                  <option key={y.value} value={y.value}>{y.value} · {getYearCanChi(y.value)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hh-leap-row">
            <input
              id={`${formId}-leap`}
              name={`isLeap-${side}`}
              type="checkbox"
              checked={isLeap}
              onChange={(e) => set('isLeap', e.target.checked)}
            />
            <label htmlFor={`${formId}-leap`}>Tháng nhuận (nếu sinh vào tháng nhuận Âm lịch)</label>
          </div>
        </div>
      )}

      <div className="hh-hour-block">
        <div className="hh-label-row">
          <label htmlFor={`${formId}-hour`}>Giờ sinh (0–23h hoặc Canh giờ) <span aria-hidden="true">*</span></label>
          {canhGioInfo && (
            <span className="hh-can-chi">✦ Giờ {canhGioInfo.chi} ({canhGioInfo.range})</span>
          )}
        </div>
        <div className="hh-two">
          <input
            id={`${formId}-hour`}
            name={`gio-${side}`}
            type="number"
            inputMode="numeric"
            required
            min="0"
            max="23"
            placeholder="Nhập giờ 0–23"
            value={value.gio}
            onChange={(e) => set('gio', e.target.value === '' ? '' : Number(e.target.value))}
          />
          <select
            id={`${formId}-canh-gio`}
            name={`canhGio-${side}`}
            aria-label={`Chọn nhanh canh giờ Địa Chi ${label}`}
            value={activeChiIndex}
            onChange={(e) => {
              if (e.target.value === '') {
                set('gio', '');
                return;
              }
              const item = CANH_GIO_ITEMS[Number(e.target.value)];
              if (item) set('gio', item.representativeHour);
            }}
          >
            <option value="">Chọn canh giờ…</option>
            {CANH_GIO_ITEMS.map((item) => (
              <option key={item.chiIndex} value={item.chiIndex}>
                Giờ {item.chi} ({item.range})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hh-field">
        <label htmlFor={`${formId}-gender`}>Giới tính</label>
        <select
          id={`${formId}-gender`}
          name={`gioiTinh-${side}`}
          value={value.gioiTinh}
          onChange={(e) => set('gioiTinh', e.target.value)}
        >
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      </div>

      <p className="hh-muted hh-person-footnote">
        {isLunar
          ? 'Đã bật chế độ nhập trực tiếp ngày Âm lịch. Lá số giữ nguyên ngày tháng Âm lịch khi an sao.'
          : 'Tự động quy đổi ngày Dương lịch sang Âm lịch và giờ Địa Chi chuẩn Tử Vi Đẩu Số.'}
      </p>
    </fieldset>
  );
}

function OverviewTab({ pair, a, personAName, personBName }) {
  const orderedCards = useMemo(() => {
    const cardsObj = a?.cards || {};
    const v2Present = CARD_ORDER.filter((k) => cardsObj[k]);
    if (v2Present.length > 0) {
      return v2Present.map((k) => [k, cardsObj[k]]);
    }
    return Object.entries(cardsObj);
  }, [a]);

  const strengths = toStringList(a?.strengths);
  const challenges = Array.isArray(a?.challenges) ? a.challenges : [];

  const quotesA = (pair?.chong?.person?.phuTheStars || [])
    .map((s) => pair?.hemingKnowledge?.STAR_IN_FUQI_GU?.[s])
    .filter(Boolean)
    .slice(0, 2);
  const quotesB = (pair?.vo?.person?.phuTheStars || [])
    .map((s) => pair?.hemingKnowledge?.STAR_IN_FUQI_GU?.[s])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div className="hh-stack">
      <div className="hh-grid hh-pillars-grid">
        {orderedCards.map(([key, card]) => {
          const weightPct = Math.round(((card.weight ?? a?.weights?.[key] ?? WEIGHTS?.[key] ?? 0.25) * 100));
          const factors = Array.isArray(card.factors) ? card.factors : [];
          return (
            <section className="hh-card hh-pillar-card" key={key}>
              <header>
                <h3>
                  <span className="hh-card-icon" aria-hidden="true">{CARD_ICONS[key] || '📋'}</span>
                  <span>{card.title}</span>
                </h3>
                <strong>
                  {card.score}
                  <small>/100</small>
                </strong>
              </header>
              <ProgressBar value={card.score} label={`${card.title}: ${card.score}/100`} />
              <div className="hh-weight">
                ⚖️ Trọng số {weightPct}%{card.provisional ? ' · Điểm mặc định' : ''}
              </div>
              <p className="hh-pillar-detail">{card.detail}</p>

              {factors.length > 0 && (
                <details className="hh-factors-details" open={factors.length <= 6}>
                  <summary>Chi tiết cộng trừ điểm ({factors.length})</summary>
                  <ul className="hh-factors-list">
                    {factors.map((f, idx) => {
                      const dText = formatDelta(f.delta);
                      const kind = f.kind || (typeof f.delta === 'number' ? (f.delta > 0 ? 'good' : f.delta < 0 ? 'warn' : 'neutral') : 'neutral');
                      return (
                        <li key={idx} className={`hh-factor-item hh-factor-${kind}`}>
                          <span className="hh-factor-label">{toText(f.label)}</span>
                          {dText && <span className={`hh-factor-pill hh-pill-${kind}`}>{dText}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}
            </section>
          );
        })}
      </div>

      {(strengths.length > 0 || challenges.length > 0) && (
        <div className="hh-grid hh-synthesis-grid">
          <section className="hh-card hh-synthesis-card hh-synthesis-good">
            <header>
              <h3><span className="hh-card-icon" aria-hidden="true">🌟</span>Điểm Gắn Kết &amp; Tương Trợ</h3>
            </header>
            {strengths.length > 0 ? (
              <ul className="hh-check-list">
                {strengths.map((item, idx) => (
                  <li key={idx}>
                    <span className="hh-bullet-icon" aria-hidden="true">✦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hh-muted">Hai lá số giữ mức bình ổn tự nhiên, thuận lợi xây dựng sự gắn bó qua sẻ chia thực tế.</p>
            )}
          </section>

          <section className="hh-card hh-synthesis-card hh-synthesis-remedy">
            <header>
              <h3><span className="hh-card-icon" aria-hidden="true">🧭</span>Điểm Dễ Bất Đồng &amp; Cách Dung Hòa</h3>
            </header>
            {challenges.length > 0 ? (
              <div className="hh-challenge-list">
                {challenges.map((ch, idx) => {
                  const issue = typeof ch === 'string' ? ch : toText(ch?.issue, '');
                  const remedy = typeof ch === 'object' ? toText(ch?.remedy, '') : '';
                  return (
                    <div key={idx} className="hh-challenge-item">
                      {issue && (
                        <div className="hh-challenge-issue">
                          <strong>⚠️ Lưu ý:</strong> {issue}
                        </div>
                      )}
                      {remedy && (
                        <div className="hh-challenge-remedy">
                          <strong>💡 Cách dung hòa:</strong> {remedy}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="hh-muted">Ít xung đột gay gắt về mặt tinh diệu; chỉ cần giữ thói quen lắng nghe và tôn trọng khoảng riêng của nhau.</p>
            )}
          </section>
        </div>
      )}

      {pair?.hemingKnowledge && (
        <section className="hh-card hh-heming-card">
          <header>
            <h3><span className="hh-card-icon" aria-hidden="true">📜</span>Lời Giảng Hôn Nhân Thiên Kỷ Nghê Hải Hạ</h3>
          </header>
          <p className="hh-heming-methodology">
            {pair.hemingKnowledge.HEMING_METHODOLOGY?.principles?.[0] ||
              'Theo Thiên Kỷ Nghê Hải Hạ: Xem hôn nhân không chỉ nhìn cung Phu Thê mà phải liên tham cung Phúc Đức, quan sát sự tôn trọng và bao dung giữa hai bản mệnh.'}
          </p>
          {(quotesA.length > 0 || quotesB.length > 0) && (
            <div className="hh-fuqi-quotes-grid">
              {quotesA.map((q, idx) => (
                <div key={`a-${idx}`} className="hh-fuqi-quote-box">
                  <strong>{personAName} · Phu Thê {q.star}</strong>
                  <p>“{q.quote}”</p>
                  <div className="hh-quote-advice">💡 {q.advice}</div>
                </div>
              ))}
              {quotesB.map((q, idx) => (
                <div key={`b-${idx}`} className="hh-fuqi-quote-box hh-fuqi-quote-b">
                  <strong>{personBName} · Phu Thê {q.star}</strong>
                  <p>“{q.quote}”</p>
                  <div className="hh-quote-advice">💡 {q.advice}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function DualChartsTab({ pair, personAName, personBName }) {
  const captionId = useId();
  const [chartView, setChartView] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 900px)')?.matches) {
      return 'a';
    }
    return 'side';
  });
  const profileA = useMemo(() => extractChartProfile(pair?.chong), [pair]);
  const profileB = useMemo(() => extractChartProfile(pair?.vo), [pair]);

  const rows = [
    { label: 'Năm sinh · Âm Dương', a: profileA.canChiInfo, b: profileB.canChiInfo },
    { label: 'Bản Mệnh Nạp Âm', a: profileA.napAm, b: profileB.napAm },
    { label: 'Ngũ Hành Cục', a: profileA.cuc, b: profileB.cuc },
    { label: 'Chủ Mệnh · Chủ Thân', a: profileA.chuMenhThan, b: profileB.chuMenhThan },
    { label: 'Lai Nhân Cung', a: profileA.laiNhan, b: profileB.laiNhan },
    { label: 'Cung Mệnh', a: profileA.menh, b: profileB.menh },
    { label: 'Cung Thân', a: profileA.than, b: profileB.than },
    { label: 'Cung Phu Thê', a: profileA.phuThe, b: profileB.phuThe },
    { label: 'Cung Phúc Đức', a: profileA.phucDuc, b: profileB.phucDuc },
    { label: 'Điền Trạch & Tử Tức', a: profileA.dienTu, b: profileB.dienTu },
  ];

  return (
    <div className="hh-stack">
      <section className="hh-card">
        <header>
          <h3><span className="hh-card-icon" aria-hidden="true">⚖️</span>Bảng Đối Chiếu 10 Trục Cốt Lõi Hai Lá Số</h3>
        </header>
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
          className="hh-table-wrapper"
        >
          <table
            className="hh-compare-table"
            style={{
              '--col-a': `"${personAName.replace(/"/g, "'")}"`,
              '--col-b': `"${personBName.replace(/"/g, "'")}"`,
            }}
          >
            <caption id={captionId} className="hh-sr-only">
              Đối chiếu các cung trọng yếu giữa {personAName} và {personBName}
            </caption>
            <thead>
              <tr>
                <th scope="col">Hạng mục đối chiếu</th>
                <th scope="col" className="hh-col-person-a">👨 {personAName}</th>
                <th scope="col" className="hh-col-person-b">👩 {personBName}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.a}</td>
                  <td>{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hh-card hh-laso-section">
        <div className="hh-laso-toolbar">
          <div>
            <h3><span className="hh-card-icon" aria-hidden="true">🗺️</span>Bàn Số Tử Vi Đẩu Số Tương Tác</h3>
            <p className="hh-muted">Chạm vào từng cung trên lá số để xem Tam Phương Tứ Chính, Phi Tinh Tứ Hóa và Đại Hạn.</p>
          </div>
          <div className="hh-pill-toggle hh-pill-toggle-charts" role="group" aria-label="Chế độ hiển thị hai lá số">
            <button
              type="button"
              className={`hh-only-wide${chartView === 'side' ? ' is-active' : ''}`}
              aria-pressed={chartView === 'side'}
              onClick={() => setChartView('side')}
            >
              Song song 2 lá số
            </button>
            <button
              type="button"
              className={chartView === 'a' ? 'is-active' : ''}
              aria-pressed={chartView === 'a'}
              onClick={() => setChartView('a')}
            >
              <span className="hh-btn-ellipsis">👨 {personAName}</span>
            </button>
            <button
              type="button"
              className={chartView === 'b' ? 'is-active' : ''}
              aria-pressed={chartView === 'b'}
              onClick={() => setChartView('b')}
            >
              <span className="hh-btn-ellipsis">👩 {personBName}</span>
            </button>
            <button
              type="button"
              className={chartView === 'stack' ? 'is-active' : ''}
              aria-pressed={chartView === 'stack'}
              onClick={() => setChartView('stack')}
            >
              Xếp dọc cả 2
            </button>
          </div>
        </div>

        <div className={`hh-dual-charts hh-dual-${chartView}`}>
          {(chartView === 'side' || chartView === 'stack' || chartView === 'a') && pair?.chong?.result && (
            <div className="hh-chart-pane">
              <div className="hh-chart-pane-header hh-pane-a">
                <strong>Bên A · {personAName}</strong>
                <span>{profileA.napAm} · {profileA.cuc}</span>
              </div>
              <div className="hh-laso-embed">
                <LasoChart result={pair.chong.result} inputData={pair.chong.inputData} />
              </div>
            </div>
          )}

          {(chartView === 'side' || chartView === 'stack' || chartView === 'b') && pair?.vo?.result && (
            <div className="hh-chart-pane">
              <div className="hh-chart-pane-header hh-pane-b">
                <strong>Bên B · {personBName}</strong>
                <span>{profileB.napAm} · {profileB.cuc}</span>
              </div>
              <div className="hh-laso-embed">
                <LasoChart result={pair.vo.result} inputData={pair.vo.inputData} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TamHopTinhCachTab({ pair, a, personAName, personBName }) {
  const th = a?.tamHopDetail;
  const tc = a?.tinhCachDetail;

  const crossCards = [
    {
      key: 'a2b',
      title: `Mệnh ${personAName} ➔ Phu Thê ${personBName}`,
      data: th?.aMenhToBPhuThe,
      fromLabel: `Tam hợp Mệnh ${personAName}`,
      fromVal: th?.aMenhToBPhuThe?.aMenhGroup,
      toLabel: `Tam hợp Phu Thê ${personBName}`,
      toVal: th?.aMenhToBPhuThe?.bPhuTheGroup,
    },
    {
      key: 'b2a',
      title: `Mệnh ${personBName} ➔ Phu Thê ${personAName}`,
      data: th?.bMenhToAPhuThe,
      fromLabel: `Tam hợp Mệnh ${personBName}`,
      fromVal: th?.bMenhToAPhuThe?.bMenhGroup,
      toLabel: `Tam hợp Phu Thê ${personAName}`,
      toVal: th?.bMenhToAPhuThe?.aPhuTheGroup,
    },
  ];

  const ptComp = th?.phuTheComparison;
  const pdFound = th?.phucDucFoundation;

  const tempA = tc?.personA || pair?.chong?.person?.temperament || null;
  const tempB = tc?.personB || pair?.vo?.person?.temperament || null;
  const frictionWarnings = toStringList(tc?.frictionWarnings);
  const harmonyTips = toStringList(tc?.harmonyTips);

  return (
    <div className="hh-stack">
      <section className="hh-card">
        <header>
          <h3><span className="hh-card-icon" aria-hidden="true">☯️</span>Hợp Bàn Tam Hợp · Đối Chiếu Thái Cực Mệnh ⇄ Phu Thê</h3>
          {a?.cards?.tamHop?.score != null && (
            <strong>{a.cards.tamHop.score}<small>/100</small></strong>
          )}
        </header>
        <p className="hh-muted">
          Theo pháp Hợp Hôn Dương Dịch Đức: Khi cách cục Tam Hợp cung Mệnh của người này đồng điệu với cung Phu Thê của người kia, hai người tự nhiên ứng hợp hình mẫu bạn đời tiềm thức của nhau.
        </p>

        {th ? (
          <>
            <div className="hh-grid hh-cross-grid">
              {crossCards.map((c) => (
                <div key={c.key} className="hh-subcard hh-cross-card">
                  <div className="hh-cross-head">
                    <h4>{c.title}</h4>
                    <div className="hh-cross-badges">
                      {c.data?.matchLevel && <span className="hh-badge hh-badge-gold">{toText(c.data.matchLevel)}</span>}
                      {c.data?.score != null && <span className="hh-badge hh-badge-outline">{c.data.score}/100</span>}
                    </div>
                  </div>
                  {(c.fromVal || c.toVal) && (
                    <div className="hh-group-bridge">
                      <div className="hh-bridge-node">
                        <small>{c.fromLabel}</small>
                        <strong>{toText(c.fromVal)}</strong>
                      </div>
                      <span className="hh-bridge-arrow" aria-hidden="true">⇄</span>
                      <div className="hh-bridge-node">
                        <small>{c.toLabel}</small>
                        <strong>{toText(c.toVal)}</strong>
                      </div>
                    </div>
                  )}
                  <p>{toText(c.data?.summary, 'Đang tham chiếu cấu trúc chính tinh Mệnh – Phu Thê.')}</p>
                </div>
              ))}
            </div>

            {(ptComp || pdFound) && (
              <div className="hh-grid hh-cross-grid">
                {ptComp && (
                  <div className="hh-subcard">
                    <h4>💍 Đối Sánh Cát Tinh &amp; Sát Tinh Cung Phu Thê</h4>
                    {ptComp.summary && <p>{ptComp.summary}</p>}
                    <div className="hh-star-compare">
                      <div>
                        <small className="hh-partner-tag">{personAName}</small>
                        <div className="hh-chip-row">
                          {toStringList(ptComp.aCatTinh).map((s) => <span key={`ac-${s}`} className="hh-chip hh-chip-good">✦ {s}</span>)}
                          {toStringList(ptComp.aSatTinh).map((s) => <span key={`as-${s}`} className="hh-chip hh-chip-warn">⚡ {s}</span>)}
                          {toStringList(ptComp.aCatTinh).length === 0 && toStringList(ptComp.aSatTinh).length === 0 && (
                            <span className="hh-muted">{toText(ptComp.aStars, 'Chính tinh thuần tịnh')}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <small className="hh-partner-tag">{personBName}</small>
                        <div className="hh-chip-row">
                          {toStringList(ptComp.bCatTinh).map((s) => <span key={`bc-${s}`} className="hh-chip hh-chip-good">✦ {s}</span>)}
                          {toStringList(ptComp.bSatTinh).map((s) => <span key={`bs-${s}`} className="hh-chip hh-chip-warn">⚡ {s}</span>)}
                          {toStringList(ptComp.bCatTinh).length === 0 && toStringList(ptComp.bSatTinh).length === 0 && (
                            <span className="hh-muted">{toText(ptComp.bStars, 'Chính tinh thuần tịnh')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {pdFound && (
                  <div className="hh-subcard">
                    <div className="hh-cross-head">
                      <h4>🪷 Nền Tảng Cung Phúc Đức (Hậu Vận Gia Đạo)</h4>
                      {pdFound.score != null && <span className="hh-badge hh-badge-gold">{pdFound.score}/100</span>}
                    </div>
                    <p>{toText(pdFound.summary)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="hh-pillar-detail">{a?.cards?.phuThe?.detail || 'Đối chiếu cấu trúc sao cung Phu Thê từ hai lá số.'}</p>
        )}
      </section>

      <section className="hh-card">
        <header>
          <h3><span className="hh-card-icon" aria-hidden="true">⚖️</span>Bù Trừ Tính Cách Cương – Nhu &amp; 5 Chỉ Số Cảm Xúc</h3>
          {tc?.complementarityType && (
            <span className="hh-badge hh-badge-purple">{toText(tc.complementarityType)}</span>
          )}
        </header>

        {tc ? (
          <>
            {tc.summary && <p className="hh-pillar-detail">{tc.summary}</p>}

            <div className="hh-grid hh-cross-grid">
              {[
                { key: 'a', name: personAName, data: tempA, accent: 'a' },
                { key: 'b', name: personBName, data: tempB, accent: 'b' },
              ].map((item) => {
                const yang = Math.max(0, Math.min(100, Number(item.data?.yangScore ?? 50)));
                const yin = Math.max(0, Math.min(100, Number(item.data?.yinScore ?? 100 - yang)));
                const notes = toStringList(item.data?.traitNotes);
                return (
                  <div key={item.key} className={`hh-subcard hh-temp-card hh-temp-${item.accent}`}>
                    <div className="hh-cross-head">
                      <h4>{item.name}</h4>
                      <span className="hh-badge hh-badge-outline">{toText(item.data?.label || item.data?.mode, 'Cân bằng')}</span>
                    </div>
                    <div className="hh-yin-yang-labels">
                      <span>☀️ Khí Cương (Dương): <strong>{yang}%</strong></span>
                      <span>🌙 Khí Nhu (Âm): <strong>{yin}%</strong></span>
                    </div>
                    <div className="hh-yin-yang-bar" role="img" aria-label={`${item.name}: Cương ${yang}%, Nhu ${yin}%`}>
                      <div className="hh-yang-seg" style={{ width: `${yang}%` }} />
                      <div className="hh-yin-seg" style={{ width: `${yin}%` }} />
                    </div>
                    {notes.length > 0 && (
                      <ul className="hh-mini-notes">
                        {notes.map((n, idx) => <li key={idx}>{n}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {(tempA?.traits || tempB?.traits) && (
              <div className="hh-subcard hh-emotions-box">
                <h4>🌡️ Đối Sánh 5 Chỉ Số Phản Ứng Cảm Xúc Trong Đời Sống Chung</h4>
                <div className="hh-emotions-legend">
                  <span className="hh-legend-a">● {personAName}</span>
                  <span className="hh-legend-b">● {personBName}</span>
                </div>
                <div className="hh-emotions-list">
                  {EMOTIONAL_TRAITS.map((tr) => {
                    const valA = Math.max(0, Math.min(100, Number(tempA?.traits?.[tr.key] ?? 0)));
                    const valB = Math.max(0, Math.min(100, Number(tempB?.traits?.[tr.key] ?? 0)));
                    return (
                      <div key={tr.key} className="hh-emotion-row">
                        <div className="hh-emotion-title">
                          <span>{tr.icon} {tr.label}</span>
                          <small>{personAName}: <strong>{valA}</strong> · {personBName}: <strong>{valB}</strong></small>
                        </div>
                        <div className="hh-emotion-bars">
                          <div className="hh-dual-meter">
                            <span className="hh-meter-tag">A</span>
                            <div className="hh-meter-track">
                              <div className="hh-meter-fill hh-meter-a" style={{ width: `${valA}%` }} />
                            </div>
                          </div>
                          <div className="hh-dual-meter">
                            <span className="hh-meter-tag">B</span>
                            <div className="hh-meter-track">
                              <div className="hh-meter-fill hh-meter-b" style={{ width: `${valB}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(frictionWarnings.length > 0 || harmonyTips.length > 0) && (
              <div className="hh-grid hh-cross-grid">
                {frictionWarnings.length > 0 && (
                  <div className="hh-subcard hh-warn-box">
                    <h4>⚡ Tình Huống Dễ Va Chạm</h4>
                    <ul className="hh-check-list">
                      {frictionWarnings.map((w, idx) => (
                        <li key={idx}><span aria-hidden="true">•</span><span>{w}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {harmonyTips.length > 0 && (
                  <div className="hh-subcard hh-tip-box">
                    <h4>🕊️ Bí Quyết Giữ Hòa Khí</h4>
                    <ul className="hh-check-list">
                      {harmonyTips.map((tip, idx) => (
                        <li key={idx}><span aria-hidden="true">✦</span><span>{tip}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="hh-muted">Chưa có dữ liệu phân tích Cương – Nhu chi tiết trên phiên bản hồ sơ cũ.</p>
        )}
      </section>
    </div>
  );
}

function FlightList({ flights, filterKey, emptyMessage }) {
  const filtered = useMemo(() => {
    if (!Array.isArray(flights)) return [];
    if (filterKey === 'all') return flights;
    return flights.filter((f) => {
      const k = String(f.emitterKey || f.emitterLabel || '').toLowerCase();
      if (filterKey === 'birth') return k.includes('year') || k.includes('nam') || k.includes('năm') || k.includes('sinh');
      if (filterKey === 'menh') return k.includes('menh') || k.includes('mệnh');
      if (filterKey === 'phuthe') return k.includes('phu') || k.includes('thê') || k.includes('the') || k.includes('fuqi');
      return true;
    });
  }, [flights, filterKey]);

  if (filtered.length === 0) {
    return <p className="hh-muted">{emptyMessage}</p>;
  }

  return (
    <div className="hh-flight-list">
      {filtered.map((f, idx) => {
        const siHuaLabel = f.siHua?.startsWith('Hóa') ? f.siHua : f.siHua ? `Hóa ${f.siHua}` : 'Tứ Hóa';
        const deltaStr = formatDelta(f.scoreDelta);
        return (
          <div key={idx} className={`hh-flight-card ${f.isAuspicious ? 'is-auspicious' : 'is-challenging'}`}>
            <div className="hh-flight-top">
              <span className="hh-emitter-tag">
                {toText(f.emitterLabel, 'Nguồn Can')}
                {f.stemName && !String(f.emitterLabel || '').includes(`(${f.stemName})`) ? ` (${f.stemName})` : ''}
              </span>
              <span className={`hh-sihua-badge ${getSiHuaClass(siHuaLabel)}`}>{siHuaLabel}</span>
              {deltaStr && (
                <span className={`hh-factor-pill ${f.isAuspicious ? 'hh-pill-good' : 'hh-pill-warn'}`}>
                  {deltaStr}
                </span>
              )}
            </div>
            <div className="hh-flight-route">
              <strong>{toText(f.starName, 'Sao')}</strong>
              <span aria-hidden="true">➔</span>
              <span>
                Cung <strong>{toText(f.targetPalace)}</strong>
                {f.targetChiName ? ` (${f.targetChiName})` : ''}
              </span>
            </div>
            {f.meaning && <p className="hh-flight-meaning">{f.meaning}</p>}
          </div>
        );
      })}
    </div>
  );
}

function PhiTinhTab({ pair, a, personAName, personBName }) {
  const [emitterFilter, setEmitterFilter] = useState('all');
  const pt = a?.phiTinhDetail;
  const aToB = pt?.aToBFlights || [];
  const bToA = pt?.bToAFlights || [];
  const internalA = pt?.internalFlows?.personA || [];
  const internalB = pt?.internalFlows?.personB || [];

  return (
    <div className="hh-stack">
      <section className="hh-card">
        <header>
          <h3><span className="hh-card-icon" aria-hidden="true">✨</span>Phi Tinh Tứ Hóa 2 Chiều (Bắc Phái · Hà Lạc)</h3>
          {a?.cards?.phiTinh?.score != null && (
            <strong>{a.cards.phiTinh.score}<small>/100</small></strong>
          )}
        </header>

        {pt?.whoSupportsWhom && (
          <div className="hh-insight-banner">
            <span className="hh-insight-icon" aria-hidden="true">💫</span>
            <div>
              <strong>Tổng kết chiều tương trợ khí số:</strong>
              <p>{pt.whoSupportsWhom}</p>
            </div>
          </div>
        )}

        {(aToB.length > 0 || bToA.length > 0) ? (
          <>
            <div className="hh-filter-bar">
              <span className="hh-calendar-label">Lọc theo cung phát (Can phi hóa):</span>
              <div className="hh-pill-toggle hh-pill-toggle-grid" role="group" aria-label="Lọc nguồn Can phi Tứ Hóa">
                {[
                  { id: 'all', label: 'Tất cả nguồn' },
                  { id: 'birth', label: 'Can Năm Sinh' },
                  { id: 'menh', label: 'Can Cung Mệnh' },
                  { id: 'phuthe', label: 'Can Cung Phu Thê' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={emitterFilter === opt.id ? 'is-active' : ''}
                    aria-pressed={emitterFilter === opt.id}
                    onClick={() => setEmitterFilter(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hh-grid hh-flights-grid">
              <div className="hh-subcard">
                <h4 className="hh-dir-heading hh-dir-a">
                  <span>👨 {personAName}</span>
                  <span aria-hidden="true">➔</span>
                  <span>Lá số {personBName}</span>
                </h4>
                <FlightList
                  flights={aToB}
                  filterKey={emitterFilter}
                  emptyMessage="Không có đường phi hóa trọng yếu thuộc bộ lọc này."
                />
              </div>

              <div className="hh-subcard">
                <h4 className="hh-dir-heading hh-dir-b">
                  <span>👩 {personBName}</span>
                  <span aria-hidden="true">➔</span>
                  <span>Lá số {personAName}</span>
                </h4>
                <FlightList
                  flights={bToA}
                  filterKey={emitterFilter}
                  emptyMessage="Không có đường phi hóa trọng yếu thuộc bộ lọc này."
                />
              </div>
            </div>
          </>
        ) : pair?.synastry?.highlights?.length > 0 ? (
          <div className="hh-synastry-list">
            {pair.synastry.highlights.map((h, i) => (
              <div key={i} className={`hh-synastry-item ${h.isAuspicious ? 'auspicious' : 'challenging'}`}>
                <span className="hh-synastry-badge">{h.isAuspicious ? '🌟 Cát Tường' : '⚠️ Dung Hòa'}</span>
                <span className="hh-synastry-text">{h.summary}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="hh-muted">Không phát hiện xung chiếu Tứ Hóa bất thường giữa hai lá số.</p>
        )}
      </section>

      {(internalA.length > 0 || internalB.length > 0) && (
        <section className="hh-card">
          <header>
            <h3><span className="hh-card-icon" aria-hidden="true">🌀</span>Dòng Khí Nội Tại Cung Phu Thê (Tự Hóa &amp; Chuyển Kỵ)</h3>
          </header>
          <p className="hh-muted">
            Khảo sát Tự Hóa Xuất (Ly Tâm), Hướng Tâm Tự Hóa và cấu trúc Tứ Hóa nội tại trong bản cung Phu Thê của mỗi người.
          </p>
          <div className="hh-grid hh-cross-grid">
            {[
              { key: 'a', name: personAName, list: internalA },
              { key: 'b', name: personBName, list: internalB },
            ].map((side) => (
              <div key={side.key} className="hh-subcard">
                <h4>{side.name} · Nội Khí Cung Phu Thê</h4>
                {side.list.length > 0 ? (
                  <div className="hh-internal-list">
                    {side.list.map((flow, idx) => (
                      <div key={idx} className={`hh-internal-item ${flow.isAuspicious ? 'is-good' : 'is-warn'}`}>
                        <div className="hh-internal-head">
                          <span className={`hh-chip ${flow.isAuspicious ? 'hh-chip-good' : 'hh-chip-warn'}`}>
                            {flow.isAuspicious ? '✦ Thuận khí' : '⚠️ Lưu tâm'}
                          </span>
                          <strong>{toText(flow.label || flow.type)}</strong>
                        </div>
                        {flow.detail && <p>{flow.detail}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="hh-muted">Khí cung Phu Thê ổn định, không xuất hiện Tự Hóa xung động mạnh.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function IndividualAndForecastTab({ pair, personAName, personBName }) {
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(() => pair?.initialForecast?.startYear || currentYear);
  const [yearsCount, setYearsCount] = useState(5);
  const startYearSelectId = useId();

  const yearChoices = useMemo(() => {
    const arr = [];
    for (let y = currentYear - 1; y <= currentYear + 5; y++) {
      arr.push(y);
    }
    return arr;
  }, [currentYear]);

  const forecast = useMemo(() => {
    if (typeof computeYearlyCompatibilityForecast === 'function') {
      try {
        return computeYearlyCompatibilityForecast(pair, { startYear, yearsCount });
      } catch {
        return pair?.initialForecast || null;
      }
    }
    return pair?.initialForecast || null;
  }, [pair, startYear, yearsCount]);

  const profA = pair?.individualProfiles?.chong || pair?.chong?.person?.individualLoveProfile || null;
  const profB = pair?.individualProfiles?.vo || pair?.vo?.person?.individualLoveProfile || null;

  const sharedYears = Array.isArray(forecast?.sharedHighlightYears) ? forecast.sharedHighlightYears : [];
  const forecastYears = Array.isArray(forecast?.years) ? forecast.years : [];

  return (
    <div className="hh-stack">
      {(profA || profB) && (
        <section className="hh-card">
          <header>
            <h3><span className="hh-card-icon" aria-hidden="true">🌸</span>Luận Giải Tình Duyên &amp; Hôn Nhân Riêng Từng Người</h3>
          </header>
          <div className="hh-grid hh-profiles-grid">
            {[
              { key: 'a', name: personAName, prof: profA, cls: 'hh-prof-a' },
              { key: 'b', name: personBName, prof: profB, cls: 'hh-prof-b' },
            ].map((item) => {
              const p = item.prof;
              if (!p) return null;
              const sihuaNotes = toStringList(p.internalSihuaNotes);
              const strengths = toStringList(p.strengths);
              const cautions = toStringList(p.cautions);
              const decades = Array.isArray(p.activeMarriageDecades) ? p.activeMarriageDecades : [];
              return (
                <article key={item.key} className={`hh-subcard hh-profile-card ${item.cls}`}>
                  <div className="hh-profile-header">
                    <h4>{item.name}</h4>
                    {p.archetypeTitle && <span className="hh-badge hh-badge-gold">{p.archetypeTitle}</span>}
                  </div>

                  {p.spousePortrait && (
                    <div className="hh-profile-block">
                      <strong>👤 Chân dung người phối ngẫu duyên định:</strong>
                      <p>{p.spousePortrait}</p>
                    </div>
                  )}

                  {p.phuTheAnalysis && (
                    <div className="hh-profile-block">
                      <strong>💍 Luận giải Cung Phu Thê:</strong>
                      <p>{p.phuTheAnalysis}</p>
                    </div>
                  )}

                  {p.phucDucAnalysis && (
                    <div className="hh-profile-block">
                      <strong>🪷 Gốc Phúc Đức &amp; gia đạo:</strong>
                      <p>{p.phucDucAnalysis}</p>
                    </div>
                  )}

                  {sihuaNotes.length > 0 && (
                    <div className="hh-profile-block">
                      <strong>✨ Khí số Tứ Hóa tình duyên:</strong>
                      <ul className="hh-mini-notes">
                        {sihuaNotes.map((note, i) => <li key={i}>{note}</li>)}
                      </ul>
                    </div>
                  )}

                  {(strengths.length > 0 || cautions.length > 0) && (
                    <div className="hh-profile-tags-wrap">
                      {strengths.map((s, i) => <span key={`s-${i}`} className="hh-chip hh-chip-good">✦ {s}</span>)}
                      {cautions.map((c, i) => <span key={`c-${i}`} className="hh-chip hh-chip-warn">⚠️ {c}</span>)}
                    </div>
                  )}

                  {decades.length > 0 && (
                    <div className="hh-profile-block">
                      <strong>⏳ Các Đại Hạn Hôn Nhân Trọng Điểm:</strong>
                      <div className="hh-decades-list">
                        {decades.map((d, i) => (
                          <div key={i} className="hh-decade-item">
                            <span className="hh-decade-range">
                              {String(toText(d.range)).includes('tuổi') ? toText(d.range) : `${toText(d.range)} tuổi`}
                            </span>
                            <span className="hh-decade-palace">
                              {toText(d.palaceName)}{d.chiName ? ` (${d.chiName})` : ''}
                            </span>
                            {d.note && <p>{d.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="hh-card">
        <div className="hh-forecast-header">
          <div>
            <h3><span className="hh-card-icon" aria-hidden="true">📅</span>Dự Báo Diễn Biến Tình Duyên Theo Lưu Niên ({yearsCount} Năm)</h3>
            <p className="hh-muted">Đối chiếu Đại Hạn, Tiểu Hạn, Lưu Niên Phu Thê và tín hiệu Đào – Hồng – Hỷ – Lộc – Kỵ của cả hai lá số theo từng năm.</p>
          </div>
          <div className="hh-forecast-controls">
            <div className="hh-start-year-ctrl">
              <label htmlFor={startYearSelectId}>Năm bắt đầu:</label>
              <select
                id={startYearSelectId}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
              >
                {yearChoices.map((y) => (
                  <option key={y} value={y}>
                    {y} ({getYearCanChi(y)}){y === currentYear ? ' · Nay' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="hh-pill-toggle hh-pill-toggle-4-compact" role="group" aria-label="Số năm dự báo tình duyên">
              {[1, 3, 5, 10].map((span) => (
                <button
                  key={span}
                  type="button"
                  className={yearsCount === span ? 'is-active' : ''}
                  aria-pressed={yearsCount === span}
                  onClick={() => setYearsCount(span)}
                >
                  {span} năm
                </button>
              ))}
            </div>
          </div>
        </div>

        {sharedYears.length > 0 && (
          <div className="hh-highlight-years-banner" role="note">
            <span className="hh-highlight-icon" aria-hidden="true">🎉</span>
            <div>
              <strong>Năm Đồng Điệu Hỷ Tín: {sharedYears.map((y) => `${y} (${getYearCanChi(y)})`).join(' · ')}</strong>
              <p>Cả hai lá số cùng mở vận Đào Hồng Hỷ hoặc Cát Hóa hội chiếu cung tình duyên — rất thuận lợi cho hỷ sự, cầu hôn, cưới hỏi hoặc đón tin vui gia đạo.</p>
            </div>
          </div>
        )}

        {forecastYears.length > 0 ? (
          <div className="hh-timeline">
            {forecastYears.map((yr) => {
              const statusCls = `hh-year-${yr.status || 'binh_on'}`;
              const signalsA = toStringList(yr.personA?.signals);
              const signalsB = toStringList(yr.personB?.signals);
              return (
                <article
                  key={yr.year}
                  className={`hh-year-card ${statusCls}${yr.isSharedHighlight ? ' is-shared-highlight' : ''}`}
                >
                  <div className="hh-year-top">
                    <div className="hh-year-title">
                      <strong>Năm {yr.year} · {yr.canChi || getYearCanChi(yr.year)}</strong>
                      {yr.isSharedHighlight && <span className="hh-sparkle-tag">🎊 Đồng Điệu Hỷ Tín</span>}
                    </div>
                    <div className="hh-year-meta">
                      <span className={`hh-status-pill ${statusCls}`}>{toText(yr.statusLabel, 'Bình Ổn')}</span>
                      <strong className="hh-year-score">{yr.combinedScore ?? 70}<small>/100</small></strong>
                    </div>
                  </div>

                  <ProgressBar
                    value={yr.combinedScore ?? 70}
                    label={`Điểm hòa hợp năm ${yr.year}: ${yr.combinedScore ?? 70}/100`}
                  />

                  <div className="hh-year-partners">
                    {[
                      { key: 'a', name: personAName, p: yr.personA, signals: signalsA },
                      { key: 'b', name: personBName, p: yr.personB, signals: signalsB },
                    ].map((side) => (
                      <div key={side.key} className="hh-year-partner-box">
                        <div className="hh-year-partner-head">
                          <strong>{side.name}{side.p?.age ? ` · ${side.p.age} tuổi` : ''}</strong>
                          {side.p?.romanceScore != null && (
                            <span className="hh-mini-score">Duyên năm: {side.p.romanceScore}/100</span>
                          )}
                        </div>
                        <div className="hh-year-palaces">
                          {side.p?.daXianLabel && <span>Đại hạn: {side.p.daXianLabel}</span>}
                          {side.p?.tieuHanPalace && <span>Tiểu hạn: {side.p.tieuHanPalace}</span>}
                          {side.p?.lnPhuThePalace && <span>LN Phu Thê: {side.p.lnPhuThePalace}</span>}
                        </div>
                        {side.signals.length > 0 && (
                          <div className="hh-chip-row">
                            {side.signals.map((sig, i) => (
                              <span key={i} className="hh-chip hh-chip-neutral">{sig}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {yr.advice && (
                    <div className="hh-year-advice">
                      <strong>💡 Lời khuyên ứng xử năm {yr.year}:</strong> {yr.advice}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="hh-muted">Đang cập nhật dữ liệu dự báo lưu niên cho hai lá số.</p>
        )}
      </section>
    </div>
  );
}

export function PairSession({ initial, onStored, initialActiveTab = 'overview' }) {
  const [rawPair] = useState(initial.pair);
  const pair = useMemo(
    () => (typeof upgradeRestoredCompatibilityPair === 'function' ? upgradeRestoredCompatibilityPair(rawPair) : rawPair),
    [rawPair]
  );

  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const tabRefs = useRef({});
  const tablistRef = useRef(null);
  const tabsAnchorRef = useRef(null);
  const tabIdPrefix = useId();

  const id = useRef(initial.id);
  const latest = useRef(initial.conversation || null);
  const pending = useRef(Promise.resolve());
  const active = useRef(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);

  const catalog = useMemo(() => compatibilityEvidence(pair), [pair]);

  const persist = (conversation) => {
    latest.current = conversation;
    const operation = pending.current.catch(() => { }).then(async () => {
      if (!active.current) throw new Error('Phiên hợp hôn đã đóng.');
      setSaveStatus('Đang tự lưu hồ sơ và hội thoại…');
      const payload = { pair: initial.pair, conversation };
      if (!active.current) throw new Error('Phiên hợp hôn đã đóng.');
      const { reading } = await ssoRequest(id.current ? `/readings/${id.current}` : '/readings', {
        method: id.current ? 'PATCH' : 'POST',
        body: id.current
          ? { data: { payload } }
          : { app: HISTORY_APP, type: 'tuvi-hop-hon', title: 'Hồ sơ hợp hôn', data: { payload } },
      });
      if (!reading?.id) throw new Error('Máy chủ chưa xác nhận lưu hồ sơ.');
      id.current = reading.id;
      if (active.current) {
        setSaveStatus('Đã tự lưu hồ sơ và hội thoại');
        setSaveFailed(false);
        onStored();
      }
    });
    pending.current = operation;
    return operation.catch((error) => {
      if (active.current) {
        setSaveStatus(`Chưa lưu được: ${error.message}`);
        setSaveFailed(true);
      }
      throw error;
    });
  };

  useEffect(() => {
    active.current = true;
    if (!initial.id) persist(latest.current).catch(() => { });
    const retry = () => {
      if (active.current) persist(latest.current).catch(() => { });
    };
    window.addEventListener('online', retry);
    return () => {
      active.current = false;
      window.removeEventListener('online', retry);
    };
  }, []);

  const a = pair?.assessment || {};
  const personAName = a.husbandName || pair?.chong?.person?.hoTen || 'Bên A';
  const personBName = a.wifeName || pair?.vo?.person?.hoTen || 'Bên B';
  const personALabel = a.personALabel || (pair?.chong?.person?.gioiTinh === 'Nữ' ? 'Bên A · Nữ' : 'Bên A · Nam');
  const personBLabel = a.personBLabel || (pair?.vo?.person?.gioiTinh === 'Nam' ? 'Bên B · Nam' : 'Bên B · Nữ');

  const aCanChi = pair?.chong?.person?.canChiNam || pair?.chong?.result?.canChiNam || '';
  const bCanChi = pair?.vo?.person?.canChiNam || pair?.vo?.result?.canChiNam || '';
  const aNapAm = a.elements?.husbandNapAm || pair?.chong?.person?.napAm || pair?.chong?.result?.banMenhNapAm || a.elements?.husbandElement || '—';
  const bNapAm = a.elements?.wifeNapAm || pair?.vo?.person?.napAm || pair?.vo?.result?.banMenhNapAm || a.elements?.wifeElement || '—';

  const derivedTierKey = a.tier
    || (a.totalScore >= 82 ? 'thuong_dang' : a.totalScore >= 70 ? 'trung_thuong' : a.totalScore >= 55 ? 'trung_binh' : 'can_hoa_giai');
  const tierMeta = TIER_META[derivedTierKey] || TIER_META.trung_binh;

  useEffect(() => {
    const scroller = tablistRef.current;
    if (
      !scroller ||
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      (typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'scroll()'))
    ) {
      return undefined;
    }
    const first = scroller.firstElementChild;
    const last = scroller.lastElementChild;
    if (!first || !last) return undefined;
    // rootMargin: without it, sub-pixel widths can leave an edge child a fraction of a pixel short of fully visible
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, intersectionRatio } of entries) {
          scroller.classList.toggle(
            target === first ? 'more-start' : 'more-end',
            intersectionRatio < 1,
          );
        }
      },
      { root: scroller, threshold: 1, rootMargin: '1px' },
    );
    observer.observe(first);
    observer.observe(last);
    return () => observer.disconnect();
  }, []);

  const selectTab = (nextId, focusTarget = false) => {
    setActiveTab(nextId);
    const btn = tabRefs.current[nextId];
    if (btn) {
      if (focusTarget) btn.focus();
      try {
        btn.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      } catch {
        const list = tablistRef.current;
        if (list) {
          const targetLeft = btn.offsetLeft - (list.clientWidth - btn.offsetWidth) / 2;
          list.scrollTo?.({ left: Math.max(0, targetLeft), behavior: 'smooth' });
        }
      }
    }
    if (typeof window !== 'undefined' && tabsAnchorRef.current) {
      const rect = tabsAnchorRef.current.getBoundingClientRect();
      if (rect.top < 56) {
        tabsAnchorRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  };

  const handleTabKeyDown = (e, index) => {
    const count = REPORT_TABS.length;
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (index + 1) % count;
    else if (e.key === 'ArrowLeft') nextIdx = (index - 1 + count) % count;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = count - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      selectTab(REPORT_TABS[nextIdx].id, true);
    }
  };

  const isTabVisible = (tabId) => activeTab === 'all' || activeTab === tabId;

  return (
    <TuViEvidenceProvider evidenceCatalog={catalog}>
      <section className="hh-result" aria-labelledby="hh-result-title">
        <p className="hh-eyebrow">LUẬN GIẢI HỢP HÔN TỬ VI ĐẨU SỐ</p>
        <h2 id="hh-result-title">
          {personAName} <span>&amp;</span> {personBName}
        </h2>

        <div className="hh-hero-badges">
          <span className="hh-partner-pill hh-partner-pill-a">
            {personALabel}{aCanChi ? ` · ${aCanChi}` : ''} · {aNapAm}
          </span>
          <span className="hh-partner-pill hh-partner-pill-b">
            {personBLabel}{bCanChi ? ` · ${bCanChi}` : ''} · {bNapAm}
          </span>
        </div>

        <ScoreRing score={a.totalScore} />

        <div className={`hh-tier-badge ${tierMeta.cls}`}>
          {a.ratingText || tierMeta.badge}
        </div>

        <p className="hh-rating-summary">
          {a.ratingSummary || 'Tổng hòa 4 trụ cột Hợp Bàn Tam Hợp, Phi Tinh Tứ Hóa 2 chiều, Bù Trừ Cương – Nhu và Nạp Âm Duyên Hỷ Tín.'}
        </p>

        <div className="hh-elements-bar">
          <div className="hh-element-endpoint hh-endpoint-a">
            <strong>{aNapAm}</strong>
            <small>{personAName}{aCanChi ? ` (${aCanChi})` : ''}</small>
          </div>

          <div className="hh-element-relations">
            <div className="hh-rel-chip">
              <small>Ngũ Hành Nạp Âm</small>
              <strong>{toText(a.elements?.interaction, 'Cân bằng tự nhiên')}</strong>
            </div>
            {a.elements?.thienCanRelation && (
              <div className="hh-rel-chip">
                <small>Thiên Can Năm Sinh</small>
                <strong>{toText(a.elements.thienCanRelation)}</strong>
              </div>
            )}
            {a.elements?.diaChiRelation && (
              <div className="hh-rel-chip">
                <small>Địa Chi Năm Sinh</small>
                <strong>{toText(a.elements.diaChiRelation)}</strong>
              </div>
            )}
          </div>

          <div className="hh-element-endpoint hh-endpoint-b">
            <strong>{bNapAm}</strong>
            <small>{personBName}{bCanChi ? ` (${bCanChi})` : ''}</small>
          </div>
        </div>
      </section>

      <div ref={tabsAnchorRef} className="hh-tabs-anchor" />
      <div className="hh-tabs-region">
        <div className="hh-tabs-sticky">
          <div
            ref={tablistRef}
            className="hh-tablist"
            role="tablist"
            aria-label="Các chuyên mục luận giải Hợp Hôn"
          >
            {REPORT_TABS.map((tab, idx) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  id={`${tabIdPrefix}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={tab.label}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(tab.id, false)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  <span className="hh-tab-icon" aria-hidden="true">{tab.icon}</span>
                  <span className="hh-tab-label hh-tab-label-full">{tab.label}</span>
                  <span className="hh-tab-label hh-tab-label-short" aria-hidden="true">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hh-tabpanels">
          <div
            role="tabpanel"
            aria-labelledby={`${tabIdPrefix}-tab-${activeTab === 'all' ? 'all' : 'overview'}`}
            hidden={!isTabVisible('overview')}
          >
            {isTabVisible('overview') && (
              <div className="hh-tabpanel-inner">
                <OverviewTab pair={pair} a={a} personAName={personAName} personBName={personBName} />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            aria-labelledby={`${tabIdPrefix}-tab-${activeTab === 'all' ? 'all' : 'charts'}`}
            hidden={!isTabVisible('charts')}
          >
            {isTabVisible('charts') && (
              <div className="hh-tabpanel-inner">
                <DualChartsTab pair={pair} personAName={personAName} personBName={personBName} />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            aria-labelledby={`${tabIdPrefix}-tab-${activeTab === 'all' ? 'all' : 'tamHop'}`}
            hidden={!isTabVisible('tamHop')}
          >
            {isTabVisible('tamHop') && (
              <div className="hh-tabpanel-inner">
                <TamHopTinhCachTab pair={pair} a={a} personAName={personAName} personBName={personBName} />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            aria-labelledby={`${tabIdPrefix}-tab-${activeTab === 'all' ? 'all' : 'phiTinh'}`}
            hidden={!isTabVisible('phiTinh')}
          >
            {isTabVisible('phiTinh') && (
              <div className="hh-tabpanel-inner">
                <PhiTinhTab pair={pair} a={a} personAName={personAName} personBName={personBName} />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            aria-labelledby={`${tabIdPrefix}-tab-${activeTab === 'all' ? 'all' : 'forecast'}`}
            hidden={!isTabVisible('forecast')}
          >
            {isTabVisible('forecast') && (
              <div className="hh-tabpanel-inner">
                <IndividualAndForecastTab pair={pair} personAName={personAName} personBName={personBName} />
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="hh-card hh-methodology-footer">
        <h3>📖 Cách đọc kết quả &amp; Dữ kiện gốc hai lá số</h3>
        <p>
          Điểm tổng hợp trước làm tròn: <strong>{a.rawScore ?? a.totalScore}/100</strong>. Mô hình chấm điểm kết hợp 4 trụ cột cổ học tinh hoa:{' '}
          <strong>35% Hợp Bàn Tam Hợp</strong> (Mệnh ⇄ Phu Thê &amp; Phúc Đức),{' '}
          <strong>30% Phi Tinh Tứ Hóa 2 chiều</strong> (Can Năm Sinh, Mệnh, Phu Thê),{' '}
          <strong>20% Bù Trừ Tính Cách Cương – Nhu</strong> và{' '}
          <strong>15% Nạp Âm · Thiên Can Địa Chi &amp; Duyên Hỷ Tín</strong>.
        </p>
        <p>
          Mệnh lý chỉ ra điểm thuận tự nhiên và những khúc quanh dễ va chạm để hai người chủ động thấu hiểu, nhường nhịn và vun bồi hạnh phúc thực tế — sự chân thành và đồng hành mỗi ngày luôn là gốc rễ bền vững nhất của hôn nhân.
        </p>
        <details>
          <summary>Xem toàn văn dữ kiện gốc hai lá số</summary>
          <pre className="hh-data">{compatibilityText(pair)}</pre>
        </details>
      </section>

      <div className="hh-save" role="status">
        <span>{saveStatus}</span>
        {saveFailed && (
          <button type="button" onClick={() => persist(latest.current).catch(() => { })}>
            Thử lại
          </button>
        )}
      </div>

      <TuViAiPanel
        result={pair.chong.result}
        inputData={pair.chong.inputData}
        initialConversation={initial.conversation}
        onSave={persist}
        readingContext={{
          title: 'Luận giải Hợp hôn bằng AI',
          label: `${personAName} & ${personBName}`,
          exportText: compatibilityText(pair),
          buildPrompt: (topic, question) => compatibilityPrompt(pair, topic, question),
        }}
      />
    </TuViEvidenceProvider>
  );
}

function AuthenticatedPage({ userId }) {
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState(() => loadSavedProfiles());
  const [payload, setPayload] = useState(() => {
    const handoff = consumeHopHonProfilesHandoff();
    if (handoff?.chong && handoff?.vo) {
      return { chong: handoff.chong, vo: handoff.vo };
    }
    return { chong: emptyPerson('Nam'), vo: emptyPerson('Nữ') };
  });
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyFavorites, setHistoryFavorites] = useState(false);
  const [historySort, setHistorySort] = useState('newest');
  const [favoritePending, setFavoritePending] = useState(null);
  const resolveCoupleNames = (row) => {
    const pair = row?.restored?.pair;
    const a = pair?.assessment;
    const husband = a?.husbandName || pair?.chong?.person?.hoTen || pair?.payload?.chong?.hoTen || pair?.chong?.inputData?.name || '';
    const wife = a?.wifeName || pair?.vo?.person?.hoTen || pair?.payload?.vo?.hoTen || pair?.vo?.inputData?.name || '';
    return { husband, wife };
  };

  const visibleHistory = useMemo(() => history.filter(row => {
    const { husband, wife } = resolveCoupleNames(row);
    const names = `${husband} ${wife}`.toLowerCase();
    const date = new Date(row.createdAt);
    const day = Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return names.includes(historySearch.trim().toLowerCase()) && (!historyFrom || (day && day >= historyFrom)) &&
      (!historyTo || (day && day <= historyTo)) && (!historyFavorites || row.data?.favorite === true);
  }).sort((a, b) => {
    if (historySort === 'name') return resolveCoupleNames(a).husband.localeCompare(resolveCoupleNames(b).husband, 'vi');
    const delta = (new Date(a.createdAt).getTime() || 0) - (new Date(b.createdAt).getTime() || 0);
    return historySort === 'oldest' ? delta : -delta;
  }), [history, historySearch, historyFrom, historyTo, historyFavorites, historySort]);

  const hasHistoryFilters = Boolean(
    historySearch.trim() || historyFrom || historyTo || historyFavorites || historySort !== 'newest'
  );

  function resetHistoryFilters() {
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryFavorites(false);
    setHistorySort('newest');
  }

  async function toggleFavorite(row) {
    if (favoritePending !== null) return;
    setFavoritePending(row.id);
    setHistoryError('');
    try {
      const favorite = !row.data?.favorite;
      await ssoRequest(`/readings/${encodeURIComponent(row.id)}`, { method: 'PATCH', body: { data: { favorite } } });
      setHistory(previous => previous.map(item => item.id === row.id ? { ...item, data: { ...item.data, favorite } } : item));
    } catch (e) { setHistoryError(`Không lưu được yêu thích: ${e.message}`); }
    finally { setFavoritePending(null); }
  }

  const active = useRef(false);
  const sequence = useRef(0);
  const submitting = useRef(false);

  async function checkAccess() {
    setError('');
    setAccess(null);
    try {
      const quota = await ssoRequest('/plans/my-quota?app=tuvinow');
      if (active.current) setAccess(quota.canAsk === true);
    } catch (e) {
      if (active.current) setError(e.message);
    }
  }

  async function loadHistory() {
    const seq = ++sequence.current;
    if (active.current) setHistoryLoading(true);
    try {
      const { readings = [] } = await ssoRequest(`/readings?app=${HISTORY_APP}`);
      const rows = await Promise.all(
        readings
          .filter((r) => r.type === 'tuvi-hop-hon')
          .map(async (r) => ({ ...r, restored: await decryptData(r.data?.payload, userId) }))
      );
      if (active.current && seq === sequence.current) {
        setHistory(rows);
        setHistoryError('');
      }
    } catch (e) {
      if (active.current && seq === sequence.current) setHistoryError(e.message);
    } finally {
      if (active.current && seq === sequence.current) setHistoryLoading(false);
    }
  }

  useEffect(() => {
    active.current = true;
    checkAccess();
    loadHistory();
    const syncProfilesAndHandoff = () => {
      setSavedProfiles(loadSavedProfiles());
      const handoff = consumeHopHonProfilesHandoff();
      if (handoff?.chong && handoff?.vo) {
        setSession(null);
        setPayload({ chong: handoff.chong, vo: handoff.vo });
      }
    };
    window.addEventListener('focus', syncProfilesAndHandoff);
    window.addEventListener('hashchange', syncProfilesAndHandoff);
    return () => {
      active.current = false;
      sequence.current++;
      window.removeEventListener('focus', syncProfilesAndHandoff);
      window.removeEventListener('hashchange', syncProfilesAndHandoff);
    };
  }, []);

  function swapSides() {
    setPayload((prev) => ({
      chong: { ...prev.vo },
      vo: { ...prev.chong },
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const quota = await ssoRequest('/plans/my-quota?app=tuvinow');
      if (!active.current) return;
      if (quota.canAsk !== true) {
        setAccess(false);
        throw new Error('Tài khoản chưa có quyền/lượt TuViNow để sử dụng Hợp hôn.');
      }
      const pair = buildCompatibility(payload);
      setSession({ key: crypto.randomUUID(), pair });
    } catch (e) {
      if (active.current) setError(e.message);
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  }

  if (access !== true) {
    return (
      <section className="hh-card hh-gate">
        <h2>Quyền sử dụng Hợp hôn</h2>
        <p role="status">
          {error ||
            (access === false
              ? 'Tài khoản cần có lượt TuViNow khả dụng. Kiểm tra gói hoặc liên hệ quản trị viên để được cấp quyền.'
              : 'Đang kiểm tra quyền sử dụng…')}
        </p>
        {(error || access === false) && (
          <button type="button" onClick={checkAccess}>
            Kiểm tra lại
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      <header className="hh-hero">
        <div className="hh-hearts" aria-hidden="true">
          <span>♡</span><span>♡</span><span>♡</span><span>♡</span><span>♡</span>
        </div>
        <div className="hh-hero-icon"><span aria-hidden="true">💕</span></div>
        <h1>Hợp Hôn · Tử Vi Đẩu Số</h1>
        <p>Đối chiếu chuyên sâu Hợp Bàn Tam Hợp, Phi Tinh Tứ Hóa 2 chiều, Bù Trừ Cương – Nhu và Vận Hạn Tình Duyên.</p>
      </header>

      <details className="hh-guide">
        <summary>📋 Hướng dẫn &amp; phương pháp luận Hợp Hôn 4 trụ cột</summary>
        <div className="hh-guide-body">
          <ol className="hh-pillars-intro">
            <li>
              <strong>1. Hợp Bàn Tam Hợp (35%)</strong> — Đối chiếu Thái Cực Mệnh ⇄ Phu Thê 2 chiều và nền tảng cung Phúc Đức theo pháp Dương Dịch Đức.
            </li>
            <li>
              <strong>2. Hợp Bàn Phi Tinh Tứ Hóa (30%)</strong> — Khảo sát Lộc · Quyền · Khoa · Kỵ phi chiếu 2 chiều từ Can Năm Sinh, Cung Mệnh, Cung Phu Thê và dòng khí Tự Hóa nội tại (Hà Lạc / Bắc Phái).
            </li>
            <li>
              <strong>3. Bù Trừ Tính Cách Cương – Nhu (20%)</strong> — Đo lường cân bằng Âm Dương và 5 chỉ số phản ứng cảm xúc dễ va chạm trong đời sống hôn nhân.
            </li>
            <li>
              <strong>4. Nạp Âm · Thiên Can Địa Chi &amp; Duyên Hỷ Tín (15%)</strong> — Đối chiếu tương sinh/tương khắc Nạp Âm đắc cách, Ngũ Hợp Thiên Can, Tam Hợp/Lục Hợp Địa Chi và bộ sao Đào – Hồng – Hỷ.
            </li>
          </ol>
          <p className="hh-muted">
            Hỗ trợ nhập cả Dương lịch hoặc Âm lịch trực tiếp cho từng người. Xem toàn bộ báo cáo Hợp Hôn 5 chuyên mục không trừ lượt AI; mỗi câu hỏi chuyên sâu với Trợ lý AI sử dụng 1 lượt TuViNow.
          </p>
        </div>
      </details>

      {!session ? (
        <form onSubmit={submit} className="hh-form">
          <div className="hh-form-toolbar">
            <span className="hh-muted">Nhập thông tin ngày giờ sinh của hai người để lập bàn Hợp Hôn:</span>
            <button type="button" className="hh-swap-btn" onClick={swapSides}>
              ⇄ Đổi vị trí Bên A / Bên B
            </button>
          </div>

          <div className="hh-grid">
            <PersonForm
              label="Bên A · Chồng / Nam"
              side="A"
              value={payload.chong}
              onChange={(chong) => setPayload((p) => ({ ...p, chong }))}
              savedProfiles={savedProfiles}
            />
            <PersonForm
              label="Bên B · Vợ / Nữ"
              side="B"
              value={payload.vo}
              onChange={(vo) => setPayload((p) => ({ ...p, vo }))}
              savedProfiles={savedProfiles}
            />
          </div>

          <div className="hh-divider"><span aria-hidden="true">♡</span></div>

          <button type="submit" className="hh-primary" disabled={busy}>
            {busy ? '✨ Đang lập hai lá số & đối chiếu…' : '💕 Luận Giải Hợp Hôn Toàn Diện'}
          </button>
        </form>
      ) : (
        <>
          <div className="hh-session-topbar">
            <button type="button" className="hh-back" onClick={() => setSession(null)}>
              ← Đổi thông tin hai người
            </button>
          </div>
          <PairSession key={session.key} initial={session} onStored={loadHistory} />
        </>
      )}

      {error && <p className="hh-alert" role="alert">{error}</p>}

      <details className="hh-history">
        <summary>📂 Lịch sử Hợp hôn ({history.length})</summary>
        <div className="hh-history-body">
          {historyError && (
            <div className="hh-history-alert" role="alert">
              <span>⚠️ {historyError}</span>
              <button
                type="button"
                className="hh-history-alert-close"
                onClick={() => setHistoryError('')}
                aria-label="Đóng thông báo lỗi"
              >
                ✕
              </button>
            </div>
          )}

          <div className="hh-history-filters">
            <div className="hh-history-toolbar-top">
              <div className="hh-history-search">
                <span className="hh-history-search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  aria-label="Tìm theo tên"
                  placeholder="Tìm theo tên cặp đôi..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
                {historySearch && (
                  <button
                    type="button"
                    className="hh-history-search-clear"
                    onClick={() => setHistorySearch('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                    title="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`hh-history-fav-btn${historyFavorites ? ' is-active' : ''}`}
                aria-pressed={historyFavorites}
                onClick={() => setHistoryFavorites((prev) => !prev)}
              >
                <span aria-hidden="true">{historyFavorites ? '★' : '☆'}</span>
                <span>Yêu thích</span>
              </button>

              <span className="hh-history-count">
                {visibleHistory.length} / {history.length} hồ sơ
              </span>

              <button
                type="button"
                className="hh-history-refresh-btn"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                <span aria-hidden="true">🔄</span>
                <span>{historyLoading ? 'Đang tải…' : 'Làm mới'}</span>
              </button>
            </div>

            <div className="hh-history-toolbar-controls">
              <label className="hh-history-field">
                <span>Từ ngày</span>
                <input
                  type="date"
                  max={historyTo || undefined}
                  value={historyFrom}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                />
              </label>

              <label className="hh-history-field">
                <span>Đến ngày</span>
                <input
                  type="date"
                  min={historyFrom || undefined}
                  value={historyTo}
                  onChange={(e) => setHistoryTo(e.target.value)}
                />
              </label>

              <label className="hh-history-field">
                <span>Sắp xếp</span>
                <select value={historySort} onChange={(e) => setHistorySort(e.target.value)}>
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name">Tên A–Z</option>
                </select>
              </label>

              <button
                type="button"
                className="hh-history-reset-btn"
                onClick={resetHistoryFilters}
                disabled={!hasHistoryFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {visibleHistory.length === 0 ? (
            <div className="hh-history-empty">
              <p>
                {history.length === 0
                  ? 'Chưa có hồ sơ Hợp hôn nào được lưu.'
                  : 'Không có hồ sơ phù hợp với bộ lọc hiện tại.'}
              </p>
              {history.length > 0 && hasHistoryFilters && (
                <button
                  type="button"
                  className="hh-history-reset-btn"
                  onClick={resetHistoryFilters}
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="hh-history-list">
              {visibleHistory.map((row) => {
                const assessment = row.restored?.pair?.assessment;
                const { husband, wife } = resolveCoupleNames(row);
                const coupleLabel = (husband || wife)
                  ? `${husband || 'Bên A'} & ${wife || 'Bên B'}`
                  : null;
                const isFavorite = row.data?.favorite === true;
                const totalScore = assessment?.totalScore;
                const hasAi = Boolean(row.restored?.conversation?.initialInterpretation);
                const derivedTierKey = assessment?.tier
                  || (totalScore >= 82 ? 'thuong_dang' : totalScore >= 70 ? 'trung_thuong' : totalScore >= 55 ? 'trung_binh' : 'can_hoa_giai');
                const tierMeta = TIER_META[derivedTierKey] || TIER_META.trung_binh;
                const createdDate = row.createdAt ? new Date(row.createdAt) : null;
                const formattedDate = createdDate && !Number.isNaN(createdDate.getTime())
                  ? createdDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : '';

                return (
                  <div key={row.id} className={`hh-history-card${isFavorite ? ' is-favorite' : ''}`}>
                    <button
                      type="button"
                      className="hh-history-row"
                      onClick={() => {
                        const restored = row.restored;
                        if (
                          !restored?.pair?.assessment ||
                          !restored?.pair?.chong?.result?.palates ||
                          !restored?.pair?.vo?.result?.palates
                        ) {
                          setError('Hồ sơ này không đọc được dữ liệu.');
                          return;
                        }
                        if (restored.pair.payload) {
                          setPayload({
                            chong: { ...emptyPerson('Nam'), ...restored.pair.payload.chong },
                            vo: { ...emptyPerson('Nữ'), ...restored.pair.payload.vo },
                          });
                        }
                        setSession({ ...restored, id: row.id, key: crypto.randomUUID() });
                        setError('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <span className="hh-history-row-main">
                        <span className="hh-history-couple">
                          {coupleLabel || 'Hồ sơ chưa đọc được'}
                        </span>
                        <span className="hh-history-meta">
                          {totalScore != null && (
                            <span className={`hh-history-score-pill ${tierMeta.cls}`}>
                              {totalScore}/100 · {tierMeta.badge}
                            </span>
                          )}
                          {hasAi && (
                            <span className="hh-history-ai-pill">
                              <span aria-hidden="true">✦</span> Có luận giải AI
                            </span>
                          )}
                          {formattedDate && (
                            <span className="hh-history-date">📅 {formattedDate}</span>
                          )}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`hh-history-star${isFavorite ? ' is-active' : ''}`}
                      disabled={favoritePending !== null}
                      onClick={() => toggleFavorite(row)}
                      aria-label={isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                      aria-pressed={isFavorite}
                      title={isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>
    </>
  );
}

export default function HopHonPage() {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  return (
    <div className="hop-hon">
      {isLoading ? (
        <p role="status">Đang kiểm tra đăng nhập…</p>
      ) : !isAuthenticated ? (
        <section className="hh-card hh-gate">
          <h1>Hợp Hôn · Tử Vi Đẩu Số</h1>
          <p>Đăng nhập để lập hai lá số đối chiếu Hợp Hôn 4 trụ cột và kiểm tra quyền sử dụng.</p>
          <button type="button" className="hh-primary" onClick={login}>
            Đăng nhập
          </button>
        </section>
      ) : (
        <AuthenticatedPage key={user.id} userId={user.id} />
      )}
    </div>
  );
}
