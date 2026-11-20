import React, { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import { toPng } from 'html-to-image';
import {
  SON_24,
  PERIOD_RANGES,
  ELEMENT_CLASS_MAP,
  normalizeDegree,
  lapTinhBanHuyenKhong,
  computeBatTrachFromBirth,
  getAnnualCenterStar,
  getMonthlyCenterStar,
  getCanChiYear,
} from '../utils/huyenKhongEngine.js';
import { CUU_CUNG_META, CUU_TINH_INFO } from '../data/huyenKhong81.js';
import HuyenKhongCompassChart from './HuyenKhongCompassChart.jsx';
import HuyenKhongFloorplanOverlay from './HuyenKhongFloorplanOverlay.jsx';
import './HuyenKhongPage.css';

const RATING_LABELS = {
  cat: '✦ Cát',
  binh: '◐ Bình',
  hung: '⚠ Hung',
};

const QUICK_PRESETS = [
  {
    id: 'v9-mao',
    label: 'Vận 9 · Hướng Mão 90° (Mẫu chuẩn)',
    namXay: 2024,
    doHuong: 90,
    cheDo: 'ha_quai',
  },
  {
    id: 'v9-ngo',
    label: 'Vận 9 · Hướng Ngọ 180°',
    namXay: 2024,
    doHuong: 180,
    cheDo: 'ha_quai',
  },
  {
    id: 'v8-khon',
    label: 'Vận 8 · Tọa Cấn Hướng Khôn 225°',
    namXay: 2010,
    doHuong: 225,
    cheDo: 'ha_quai',
  },
  {
    id: 'v8-suu',
    label: 'Vận 8 · Tọa Mùi Hướng Sửu 30°',
    namXay: 2010,
    doHuong: 30,
    cheDo: 'ha_quai',
  },
  {
    id: 'v9-kiem',
    label: 'Kiêm hướng · Thế Quái 95.5°',
    namXay: 2024,
    doHuong: 95.5,
    cheDo: 'the_quai',
  },
];

const LUNAR_MONTHS = [
  { month: 1, label: 'Tháng 1 (Dần)' },
  { month: 2, label: 'Tháng 2 (Mão)' },
  { month: 3, label: 'Tháng 3 (Thìn)' },
  { month: 4, label: 'Tháng 4 (Tỵ)' },
  { month: 5, label: 'Tháng 5 (Ngọ)' },
  { month: 6, label: 'Tháng 6 (Mùi)' },
  { month: 7, label: 'Tháng 7 (Thân)' },
  { month: 8, label: 'Tháng 8 (Dậu)' },
  { month: 9, label: 'Tháng 9 (Tuất)' },
  { month: 10, label: 'Tháng 10 (Hợi)' },
  { month: 11, label: 'Tháng 11 (Tý)' },
  { month: 12, label: 'Tháng 12 (Sửu)' },
];

const PALACE_GROUPS = [1, 8, 3, 4, 9, 2, 7, 6].map((cung) => ({
  cung,
  label: `${CUU_CUNG_META[cung].name} · ${CUU_CUNG_META[cung].trigram}`,
  mountains: SON_24.filter((s) => s.cung === cung),
}));

const ORDERED_PALACES = [4, 9, 2, 3, 5, 7, 8, 1, 6];

/**
 * Trang công cụ Lập Tinh bàn Cửu cung — Huyền Không Phi Tinh.
 */
export default function HuyenKhongPage({ savedProfiles = [] }) {
  const formHeadingId = useId();
  const namXayId = useId();
  const vanSelectId = useId();
  const doHuongId = useId();
  const sonSelectId = useId();
  const namXemId = useId();
  const thangXemId = useId();
  const batTrachYearId = useId();
  const batTrachGenderId = useId();
  const printTitleId = useId();

  const [namXay, setNamXay] = useState(2024);
  const [doHuong, setDoHuong] = useState(90);
  const [cheDo, setCheDo] = useState('ha_quai'); // 'ha_quai' | 'the_quai' | 'auto'
  const [includeAnnual, setIncludeAnnual] = useState(true);
  const [namXem, setNamXem] = useState(2026);
  const [includeMonthly, setIncludeMonthly] = useState(false);
  const [thangXem, setThangXem] = useState(1);
  const [orientationMode, setOrientationMode] = useState('standard'); // 'standard' | 'facing_top'
  const [ratingFilter, setRatingFilter] = useState('all');

  const [batTrachYear, setBatTrachYear] = useState(1990);
  const [batTrachGender, setBatTrachGender] = useState('nam');

  const [exportMessage, setExportMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const chartExportRef = useRef(null);
  const printChartRef = useRef(null);
  const printDialogRef = useRef(null);

  const chart = useMemo(
    () =>
      lapTinhBanHuyenKhong({
        namXay,
        doHuong,
        cheDo,
        namXem,
        thangXem,
        includeAnnual,
        includeMonthly,
      }),
    [namXay, doHuong, cheDo, namXem, thangXem, includeAnnual, includeMonthly]
  );

  const [selectedCung, setSelectedCung] = useState(() => chart.directionInfo.huong.cung);

  const handleDegreeUpdate = useCallback((rawDeg) => {
    const clean = Math.round(normalizeDegree(rawDeg) * 10) / 10;
    setDoHuong(clean);
    const nextChart = lapTinhBanHuyenKhong({
      namXay,
      doHuong: clean,
      cheDo,
      namXem,
      thangXem,
      includeAnnual,
      includeMonthly,
    });
    setSelectedCung(nextChart.directionInfo.huong.cung);
  }, [namXay, cheDo, namXem, thangXem, includeAnnual, includeMonthly]);

  const applyPreset = (preset) => {
    setNamXay(preset.namXay);
    setDoHuong(preset.doHuong);
    setCheDo(preset.cheDo);
    const nextChart = lapTinhBanHuyenKhong({
      namXay: preset.namXay,
      doHuong: preset.doHuong,
      cheDo: preset.cheDo,
      namXem,
      thangXem,
      includeAnnual,
      includeMonthly,
    });
    setSelectedCung(nextChart.directionInfo.huong.cung);
  };

  useEffect(() => {
    const dialog = printDialogRef.current;
    if (!dialog) return;
    if (isPrintOpen && !dialog.open && typeof dialog.showModal === 'function') {
      try {
        dialog.showModal();
      } catch {
        // Ignore in SSR/non-interactive DOM
      }
    } else if (!isPrintOpen && dialog.open) {
      dialog.close();
    }
  }, [isPrintOpen]);

  const captureChartPng = useCallback(async (targetNode) => {
    const node = targetNode || chartExportRef.current;
    if (!node) return null;
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark';
    return toPng(node, {
      cacheBust: true,
      pixelRatio: 2.5,
      backgroundColor: isDark ? '#121324' : '#ffffff',
      skipFonts: true,
    });
  }, []);

  const getExportSlug = () => {
    const h = chart.directionInfo.huong.ten
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
    return `tinh-ban-van-${chart.van}-${h}-${Math.round(chart.directionInfo.degree)}do`;
  };

  const handleDownloadPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportMessage('Đang tạo ảnh PNG Tinh bàn…');
    try {
      const dataUrl = await captureChartPng(chartExportRef.current);
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `${getExportSlug()}.png`;
      link.href = dataUrl;
      link.click();
      setExportMessage('Đã tải ảnh PNG Tinh bàn thành công.');
    } catch (err) {
      console.error('Export PNG failed:', err);
      setExportMessage('Không thể tạo ảnh PNG. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportMessage('Đang sao chép ảnh vào clipboard…');
    try {
      const dataUrl = await captureChartPng(chartExportRef.current);
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setExportMessage('Đã chép ảnh Tinh bàn vào clipboard.');
      } else {
        const link = document.createElement('a');
        link.download = `${getExportSlug()}.png`;
        link.href = dataUrl;
        link.click();
        setExportMessage('Trình duyệt không hỗ trợ chép ảnh trực tiếp — đã tải ảnh PNG thay thế.');
      }
    } catch {
      setExportMessage('Không chép được vào clipboard. Hãy dùng nút Xuất ảnh PNG.');
    } finally {
      setIsExporting(false);
    }
  };

  const supportsFilePicker =
    typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';

  const handleSaveToFolder = async () => {
    if (!supportsFilePicker || isExporting) return;
    setIsExporting(true);
    setExportMessage('Đang chọn nơi lưu tệp PNG…');
    try {
      const dataUrl = await captureChartPng(chartExportRef.current);
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const handle = await window.showSaveFilePicker({
        suggestedName: `${getExportSlug()}.png`,
        types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      setExportMessage('Đã lưu ảnh Tinh bàn vào thư mục đã chọn.');
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setExportMessage('Không lưu được tệp vào thư mục. Hãy dùng nút Xuất ảnh PNG.');
      } else {
        setExportMessage('');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportMessage('Đang tạo bản PDF…');
    try {
      const [{ jsPDF }, dataUrl] = await Promise.all([
        import('jspdf'),
        captureChartPng(printChartRef.current || chartExportRef.current),
      ]);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFontSize(14);
      doc.text(`Tinh ban Cuu cung Huyen Khong - Van ${chart.van}`, 14, 16);
      doc.setFontSize(10);
      doc.text(
        `${chart.effectiveModeLabel} | Huong ${chart.directionInfo.huong.ten} (${chart.directionInfo.degree} deg) - Toa ${chart.directionInfo.toa.ten}`,
        14,
        23
      );
      if (dataUrl) {
        doc.addImage(dataUrl, 'PNG', 18, 28, 174, 174);
      }
      let y = 210;
      doc.setFontSize(11);
      doc.text('Tom tat 9 cung (Son | Van | Huong):', 14, y);
      y += 6;
      doc.setFontSize(9);
      for (const cung of ORDERED_PALACES) {
        const p = chart.palacesByCung[cung];
        const line = `${p.name} (${p.trigram}): [${p.sonStar} | ${p.vanStar} | ${p.huongStar}] - ${p.pair?.shortTag || ''}`;
        doc.text(line, 14, y);
        y += 6;
      }
      doc.save(`${getExportSlug()}.pdf`);
      setExportMessage('Đã xuất file PDF thành công.');
    } catch (err) {
      console.error('Export PDF failed:', err);
      setExportMessage('Không tạo được PDF. Hãy bấm nút In để lưu PDF từ trình duyệt.');
    } finally {
      setIsExporting(false);
    }
  };

  const { directionInfo, van, effectiveModeLabel, trace, patterns } = chart;
  const { huong, toa } = directionInfo;
  const selectedPalace = chart.palacesByCung[selectedCung] || chart.palacesByCung[huong.cung];

  const batTrach = useMemo(
    () => computeBatTrachFromBirth(batTrachYear, batTrachGender),
    [batTrachYear, batTrachGender]
  );

  const filteredPalaces = useMemo(() => {
    const all = ORDERED_PALACES.map((c) => chart.palacesByCung[c]);
    if (ratingFilter === 'all') return all;
    return all.filter((p) => p.rating === ratingFilter);
  }, [chart.palacesByCung, ratingFilter]);

  const annualCanChi = getCanChiYear(namXem);
  const annualCenter = getAnnualCenterStar(namXem);
  const monthlyCenter = getMonthlyCenterStar(namXem, thangXem);

  return (
    <div className="hk-page">
      {/* Page Hero */}
      <header className="hk-hero">
        <div className="hk-hero-badge">Phong thủy Lý Khí · Tam Nguyên Cửu Vận</div>
        <h1>Tinh bàn Cửu cung · Huyền Không Phi Tinh</h1>
        <p className="hk-hero-lead">
          Công cụ tính toán phân bố năng lượng không gian – thời gian của nhà ở theo trường phái{' '}
          <strong>Thẩm Thị Huyền Không Học</strong> (Hạ quái &amp; Thế quái, Vòng 24 Sơn, Lưu Niên – Lưu Nguyệt và 81 tổ hợp sao).
          Độc lập với Mệnh lý Tử Vi Đẩu Số.
        </p>
      </header>

      {/* Section 1: Input Form */}
      <section className="hk-card hk-form-section" aria-labelledby={formHeadingId}>
        <div className="hk-section-head">
          <div className="hk-section-title-row">
            <span className="hk-step-badge" aria-hidden="true">1</span>
            <div>
              <h2 id={formHeadingId}>Thiết lập thông số lập Tinh bàn</h2>
              <p className="hk-section-sub">
                Nhập năm xây dựng (hoặc nhập trạch) và độ số la bàn của hướng nhà (hoặc chọn trực tiếp 1 trong 24 Sơn).
              </p>
            </div>
          </div>
        </div>

        <form className="hk-form" onSubmit={(e) => e.preventDefault()} aria-labelledby={formHeadingId}>
          <div className="hk-form-grid">
            {/* Period & Year */}
            <div className="hk-field-group">
              <div className="hk-field-row">
                <div className="hk-field">
                  <label htmlFor={namXayId}>Năm xây dựng / nhập trạch</label>
                  <input
                    id={namXayId}
                    name="namXay"
                    type="number"
                    inputMode="numeric"
                    min={1864}
                    max={2103}
                    value={namXay}
                    onChange={(e) => {
                      const val = Math.trunc(Number(e.target.value));
                      if (Number.isFinite(val)) setNamXay(Math.max(1864, Math.min(2103, val)));
                    }}
                  />
                  <span className="hk-field-hint">
                    Quy đổi: <strong>{chart.periodInfo?.label || `Vận ${van}`}</strong>
                  </span>
                </div>

                <div className="hk-field">
                  <label htmlFor={vanSelectId}>Hoặc chọn nhanh Vận (1–9)</label>
                  <select
                    id={vanSelectId}
                    name="vanSelect"
                    value={van}
                    onChange={(e) => {
                      const targetVan = Number(e.target.value);
                      const period = PERIOD_RANGES.find((p) => p.van === targetVan);
                      if (period) setNamXay(period.start);
                    }}
                  >
                    {PERIOD_RANGES.map((p) => (
                      <option key={p.van} value={p.van}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hk-quick-chips" role="group" aria-label="Chọn nhanh vận gần đây">
                {[7, 8, 9].map((v) => {
                  const p = PERIOD_RANGES.find((item) => item.van === v);
                  return (
                    <button
                      key={v}
                      type="button"
                      className={`hk-chip-btn ${van === v ? 'is-active' : ''}`}
                      onClick={() => setNamXay(p.start)}
                    >
                      Vận {v} ({p.start}–{p.end})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compass Degree & 24 Mountains */}
            <div className="hk-field-group">
              <div className="hk-field-row">
                <div className="hk-field">
                  <label htmlFor={doHuongId}>Độ số hướng nhà (0° – 359.9°)</label>
                  <div className="hk-degree-input-wrap">
                    <input
                      id={doHuongId}
                      name="doHuong"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={359.9}
                      step={0.5}
                      value={doHuong}
                      onChange={(e) => handleDegreeUpdate(e.target.value)}
                    />
                    <div className="hk-nudge-group" role="group" aria-label="Tinh chỉnh độ số">
                      {[-1, -0.5, +0.5, +1].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="hk-nudge-btn"
                          onClick={() => handleDegreeUpdate(doHuong + delta)}
                        >
                          {delta > 0 ? `+${delta}°` : `${delta}°`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hk-field">
                  <label htmlFor={sonSelectId}>Hoặc chọn tâm 24 Sơn</label>
                  <select
                    id={sonSelectId}
                    name="sonSelect"
                    value={huong.centerDeg}
                    onChange={(e) => handleDegreeUpdate(Number(e.target.value))}
                  >
                    {PALACE_GROUPS.map((grp) => (
                      <optgroup key={grp.cung} label={grp.label}>
                        {grp.mountains.map((m) => (
                          <option key={m.ten} value={m.centerDeg}>
                            {`${m.ten} (${m.centerDeg}° · ${m.nguyenLong} Nguyên Long · ${m.polarityLabel})`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hk-slider-row">
                <input
                  type="range"
                  aria-label="Thanh kéo độ số la bàn hướng nhà"
                  min={0}
                  max={359.5}
                  step={0.5}
                  value={doHuong}
                  onChange={(e) => handleDegreeUpdate(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Live Direction Strip */}
          <div className={`hk-direction-banner status-${directionInfo.kongWangStatus}`}>
            <div className="hk-dir-main">
              <span className="hk-dir-pill is-huong">
                Hướng {huong.ten} ({directionInfo.degree}°) · {huong.directionName} ({huong.trigram}) · {huong.nguyenLong} Nguyên Long ({huong.polarityLabel})
              </span>
              <span className="hk-dir-pill is-toa">
                Tọa {toa.ten} ({directionInfo.toaDegree}°) · {toa.directionName} ({toa.trigram})
              </span>
            </div>
            <div className="hk-dir-status">
              <span className="hk-status-badge">{directionInfo.statusLabel}</span>
              <span className="hk-status-note">{directionInfo.statusNote}</span>
            </div>
          </div>

          {/* Mode & Temporal Fieldsets */}
          <div className="hk-fieldsets-row">
            <fieldset className="hk-fieldset">
              <legend>Chế độ lập bàn</legend>
              <div className="hk-radio-row">
                {[
                  { value: 'ha_quai', label: 'Hạ quái (Mặc định)' },
                  { value: 'the_quai', label: 'Thế quái (Kiêm hướng)' },
                  { value: 'auto', label: 'Tự động theo độ kiêm (≥ 4.5°)' },
                ].map((opt) => (
                  <label key={opt.value} className="hk-radio-label">
                    <input
                      type="radio"
                      name="cheDo"
                      value={opt.value}
                      checked={cheDo === opt.value}
                      onChange={(e) => setCheDo(e.target.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="hk-fieldset">
              <legend>Lưu Niên &amp; Lưu Nguyệt (Tùy chọn)</legend>
              <div className="hk-temporal-controls">
                <label className="hk-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeAnnual}
                    onChange={(e) => setIncludeAnnual(e.target.checked)}
                  />
                  <span>Lưu Niên + Thần Sát</span>
                </label>

                <div className="hk-inline-control">
                  <label htmlFor={namXemId}>Năm xem:</label>
                  <input
                    id={namXemId}
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={2100}
                    value={namXem}
                    onChange={(e) => {
                      const val = Math.trunc(Number(e.target.value));
                      if (Number.isFinite(val)) setNamXem(Math.max(1900, Math.min(2100, val)));
                    }}
                  />
                  <span className="hk-inline-meta">
                    ({annualCanChi.label} · Trung cung {annualCenter})
                  </span>
                </div>

                <label className="hk-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeMonthly}
                    onChange={(e) => setIncludeMonthly(e.target.checked)}
                  />
                  <span>Lưu Nguyệt</span>
                </label>

                {includeMonthly && (
                  <div className="hk-inline-control">
                    <label htmlFor={thangXemId}>Tháng Âm:</label>
                    <select
                      id={thangXemId}
                      value={thangXem}
                      onChange={(e) => setThangXem(Number(e.target.value))}
                    >
                      {LUNAR_MONTHS.map((m) => (
                        <option key={m.month} value={m.month}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <span className="hk-inline-meta">(Trung cung {monthlyCenter})</span>
                  </div>
                )}
              </div>
            </fieldset>
          </div>

          {/* Quick Samples */}
          <div className="hk-presets-bar">
            <span className="hk-presets-label">Mẫu kiểm chứng nhanh:</span>
            <div className="hk-presets-list">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="hk-preset-btn"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>

      {/* Section 2: Chart + Inspector */}
      <section className="hk-card hk-chart-section" aria-labelledby="hk-chart-heading">
        <div className="hk-section-head">
          <div className="hk-section-title-row">
            <span className="hk-step-badge" aria-hidden="true">2</span>
            <div>
              <h2 id="hk-chart-heading">
                Tinh bàn Cửu cung — Vòng 24 Sơn (Vận {van})
              </h2>
              <div className="hk-chart-pills">
                <span className="hk-pill is-mode">{effectiveModeLabel}</span>
                <span className="hk-pill is-axis">
                  Hướng {huong.ten} ({directionInfo.degree}°) · Tọa {toa.ten}
                </span>
                {patterns[0] && (
                  <span className={`hk-pill tone-${patterns[0].tone}`}>{patterns[0].name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="hk-orientation-switch" role="group" aria-label="Góc xoay vòng 24 Sơn">
            <button
              type="button"
              className={`hk-chip-btn ${orientationMode === 'standard' ? 'is-active' : ''}`}
              aria-pressed={orientationMode === 'standard'}
              onClick={() => setOrientationMode('standard')}
            >
              Nam trên (Chuẩn)
            </button>
            <button
              type="button"
              className={`hk-chip-btn ${orientationMode === 'facing_top' ? 'is-active' : ''}`}
              aria-pressed={orientationMode === 'facing_top'}
              onClick={() => setOrientationMode('facing_top')}
            >
              Hướng {huong.ten} lên trên
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="hk-toolbar">
          <button
            type="button"
            className="hk-btn hk-btn-primary"
            onClick={handleDownloadPng}
            disabled={isExporting}
          >
            <span aria-hidden="true">🖼</span> Xuất ảnh PNG
          </button>
          <button
            type="button"
            className="hk-btn hk-btn-secondary"
            onClick={() => setIsPrintOpen(true)}
          >
            <span aria-hidden="true">🖨</span> Xem trước bản in
          </button>
          <button
            type="button"
            className="hk-btn hk-btn-secondary"
            onClick={handleCopyPng}
            disabled={isExporting}
          >
            <span aria-hidden="true">📋</span> Chép ảnh
          </button>
          {supportsFilePicker && (
            <button
              type="button"
              className="hk-btn hk-btn-secondary"
              onClick={handleSaveToFolder}
              disabled={isExporting}
            >
              <span aria-hidden="true">📁</span> Chọn thư mục lưu
            </button>
          )}
          {exportMessage && (
            <span className="hk-export-status" role="status" aria-live="polite">
              {exportMessage}
            </span>
          )}
        </div>

        {/* Collapsible reading guide & trace (NO heading tags inside summary) */}
        <div className="hk-disclosures">
          <details className="hk-details">
            <summary>Ghi chú cách đọc Tinh bàn (bấm để xem)</summary>
            <div className="hk-details-body">
              <ul>
                <li>
                  <strong>Bố cục chuẩn Phong thủy:</strong> Hướng <strong>Nam</strong> ở trên cùng,{' '}
                  <strong>Bắc</strong> ở dưới, <strong>Đông</strong> bên trái, <strong>Tây</strong> bên phải.
                </li>
                <li>
                  <strong>3 con số trong mỗi cung [Sơn | Vận | Hướng]:</strong> Số góc <strong>trái trên</strong> là{' '}
                  <em>Sơn tinh</em> (nhân đinh, sức khỏe, quý nhân); số <strong>giữa</strong> cỡ lớn là{' '}
                  <em>Vận tinh</em> (năng lượng nền Vận {van}); số góc <strong>phải trên</strong> là{' '}
                  <em>Hướng tinh</em> (tài lộc, công việc, minh đường).
                </li>
                <li>
                  <strong>Màu nổi bật:</strong> Vòng 24 Sơn tô <span className="hk-inline-swatch is-huong">Xanh dương</span> cho{' '}
                  Sơn Hướng và <span className="hk-inline-swatch is-toa">Đỏ thẫm</span> cho Sơn Tọa. Nhấp trực tiếp vào ô cung bất kỳ hoặc vào một sơn trên vòng tròn để xem luận giải hoặc đổi hướng.
                </li>
                {includeAnnual && (
                  <li>
                    <strong>Lưu Niên / Lưu Nguyệt:</strong> Nhãn <code>LN</code> là sao năm {namXem} ({annualCanChi.label});{' '}
                    {includeMonthly ? <code>LT</code> : 'khi bật Lưu Nguyệt'} là sao tháng Âm lịch. Lưu ý đặc biệt khi{' '}
                    <code>5</code> (Ngũ Hoàng) hoặc <code>2</code> (Nhị Hắc) bay tới kèm Thái Tuế / Tuế Phá / Tam Sát.
                  </li>
                )}
              </ul>
            </div>
          </details>

          <details className="hk-details">
            <summary>
              Chi tiết thuật toán phi tinh &amp; Cách cục toàn bàn ({patterns.length} nhận diện)
            </summary>
            <div className="hk-details-body">
              <div className="hk-trace-grid">
                <div className="hk-trace-item">
                  <strong>1. Vận bàn:</strong> Vận {trace.vanTrungCung} nhập Trung cung, bay <strong>Thuận (+1)</strong> theo Lượng Thiên Xích.
                </div>
                <div className="hk-trace-item">
                  <strong>2. Sơn bàn (Tọa {toa.ten}):</strong> Sao Vận bàn tại cung {CUU_CUNG_META[toa.cung].name} là{' '}
                  <strong>{trace.saoSonGoc}</strong>
                  {trace.sonTheInfo.changed ? ` → Thế thành sao ${trace.saoSonNhapTrung}` : ''}
                  {' · '}Tọa thuộc {toa.nguyenLong} Nguyên Long ({toa.polarityLabel}) → bay{' '}
                  <strong>{trace.chieuSon > 0 ? 'Thuận (+1)' : 'Nghịch (-1)'}</strong>.
                </div>
                <div className="hk-trace-item">
                  <strong>3. Hướng bàn (Hướng {huong.ten}):</strong> Sao Vận bàn tại cung {CUU_CUNG_META[huong.cung].name} là{' '}
                  <strong>{trace.saoHuongGoc}</strong>
                  {trace.huongTheInfo.changed ? ` → Thế thành sao ${trace.saoHuongNhapTrung}` : ''}
                  {' · '}Hướng thuộc {huong.nguyenLong} Nguyên Long ({huong.polarityLabel}) → bay{' '}
                  <strong>{trace.chieuHuong > 0 ? 'Thuận (+1)' : 'Nghịch (-1)'}</strong>.
                </div>
              </div>
              {patterns.length > 0 && (
                <ul className="hk-patterns-list">
                  {patterns.map((pt) => (
                    <li key={pt.id} className={`hk-pattern-item tone-${pt.tone}`}>
                      <strong>{pt.name}:</strong> {pt.summary}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </div>

        {/* Main Workspace: Chart on Left + Selected Palace Inspector on Right */}
        <div className="hk-workspace">
          <div ref={chartExportRef} className="hk-chart-export-canvas">
            <div className="hk-export-caption">
              <strong>Tinh bàn Huyền Không · Vận {van}</strong>
              <span>
                {effectiveModeLabel} · Hướng {huong.ten} ({directionInfo.degree}°) – Tọa {toa.ten}
                {includeAnnual ? ` · Lưu niên ${namXem} (${annualCanChi.label})` : ''}
                {includeMonthly ? ` · Tháng ${thangXem}` : ''}
              </span>
            </div>

            <HuyenKhongCompassChart
              chart={chart}
              selectedCung={selectedCung}
              onSelectCung={setSelectedCung}
              onSelectDegree={handleDegreeUpdate}
              orientationMode={orientationMode}
            />
          </div>

          <aside className="hk-inspector" aria-live="polite" aria-label="Chi tiết cung đang chọn">
            <div className="hk-inspector-header">
              <div>
                <div className="hk-inspector-kicker">
                  Cung đang xem · {selectedPalace.trigram} ({selectedPalace.element})
                  {selectedPalace.isHuongPalace && ' · Phương HƯỚNG'}
                  {selectedPalace.isToaPalace && ' · Phương TỌA'}
                </div>
                <h3 className="hk-inspector-title">
                  {selectedPalace.name} — [{selectedPalace.sonStar} | {selectedPalace.vanStar} | {selectedPalace.huongStar}]
                </h3>
              </div>
              <span className={`hk-rating-pill tone-${selectedPalace.rating}`}>
                {RATING_LABELS[selectedPalace.rating]}
              </span>
            </div>

            <div className="hk-palace-switcher" role="group" aria-label="Chuyển nhanh cung xem chi tiết">
              {ORDERED_PALACES.map((c) => {
                const p = chart.palacesByCung[c];
                return (
                  <button
                    key={c}
                    type="button"
                    className={`hk-palace-jump ${selectedCung === c ? 'is-active' : ''}`}
                    onClick={() => setSelectedCung(c)}
                  >
                    {p.shortName}
                    {p.isHuongPalace ? ' (H)' : p.isToaPalace ? ' (T)' : ''}
                  </button>
                );
              })}
            </div>

            <div className="hk-star-breakdown">
              <div className="hk-star-box">
                <span className="hk-star-box-label">Sơn tinh (Nhân đinh)</span>
                <strong className="hk-star-box-num">{selectedPalace.sonStar}</strong>
                <span>{selectedPalace.sonStarInfo.shortName} ({selectedPalace.sonStarInfo.element})</span>
                <span className={`hk-qi-tag tone-${selectedPalace.sonState.tone}`}>
                  {selectedPalace.sonState.label}
                </span>
              </div>

              <div className="hk-star-box is-van">
                <span className="hk-star-box-label">Vận tinh (Nền Vận {van})</span>
                <strong className="hk-star-box-num">{selectedPalace.vanStar}</strong>
                <span>{selectedPalace.vanStarInfo.shortName} ({selectedPalace.vanStarInfo.element})</span>
                <span className="hk-qi-tag tone-binh">Trung tâm cung</span>
              </div>

              <div className="hk-star-box">
                <span className="hk-star-box-label">Hướng tinh (Tài lộc)</span>
                <strong className="hk-star-box-num">{selectedPalace.huongStar}</strong>
                <span>{selectedPalace.huongStarInfo.shortName} ({selectedPalace.huongStarInfo.element})</span>
                <span className={`hk-qi-tag tone-${selectedPalace.huongState.tone}`}>
                  {selectedPalace.huongState.label}
                </span>
              </div>
            </div>

            {selectedPalace.pair && (
              <div className="hk-pair-detail">
                <h4>{selectedPalace.pair.title}</h4>
                <p>{selectedPalace.pair.meaning}</p>
                <div className="hk-pair-subgrid">
                  <div className="hk-pair-block">
                    <strong>Khi đương vận / sinh khí:</strong>
                    <p>{selectedPalace.pair.whenProsperous}</p>
                  </div>
                  <div className="hk-pair-block">
                    <strong>Lưu ý khi thất vận / gặp sát:</strong>
                    <p>{selectedPalace.pair.whenDeclining}</p>
                  </div>
                </div>
                <div className="hk-advice-box">
                  <strong>Gợi ý bài trí &amp; điều hòa Ngũ Hành:</strong>
                  <p>{selectedPalace.pair.layoutAdvice}</p>
                </div>
              </div>
            )}

            {(selectedPalace.specialTags.length > 0 ||
              selectedPalace.afflictions.length > 0 ||
              selectedPalace.annualStar !== null ||
              selectedPalace.monthlyStar !== null) && (
              <div className="hk-temporal-detail">
                <h4>Lớp Vận hạn &amp; Cách cục tại cung {selectedPalace.name}</h4>
                <div className="hk-tag-cloud">
                  {selectedPalace.specialTags.map((st) => (
                    <span key={st.type} className={`hk-mini-tag tone-${st.tone}`}>
                      {st.label}
                    </span>
                  ))}
                  {selectedPalace.annualStar !== null && (
                    <span className={`hk-mini-tag ${selectedPalace.annualStar === 5 || selectedPalace.annualStar === 2 ? 'tone-hung' : 'tone-binh'}`}>
                      Lưu niên {namXem}: Sao {selectedPalace.annualStar} ({selectedPalace.annualStarInfo.shortName})
                    </span>
                  )}
                  {selectedPalace.monthlyStar !== null && (
                    <span className={`hk-mini-tag ${selectedPalace.monthlyStar === 5 || selectedPalace.monthlyStar === 2 ? 'tone-hung' : 'tone-binh'}`}>
                      Tháng {thangXem}: Sao {selectedPalace.monthlyStar} ({selectedPalace.monthlyStarInfo.shortName})
                    </span>
                  )}
                  {selectedPalace.afflictions.map((aff, i) => (
                    <span key={`${aff.type}-${i}`} className={`hk-mini-tag tone-${aff.severity}`}>
                      {aff.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Section 3: 9-Palace Summary & Lookups */}
      <section className="hk-card hk-summary-section" aria-labelledby="hk-summary-heading">
        <div className="hk-section-head">
          <div className="hk-section-title-row">
            <span className="hk-step-badge" aria-hidden="true">3</span>
            <div>
              <h2 id="hk-summary-heading">Tổng hợp Luận giải 9 Cung &amp; Bảng Tra Cứu</h2>
              <p className="hk-section-sub">
                Quét nhanh khu vực cát/hung trong nhà để bố trí cửa chính, phòng ngủ, bếp và bàn làm việc.
              </p>
            </div>
          </div>

          <div className="hk-filter-group" role="group" aria-label="Lọc cung theo cát hung">
            {[
              { id: 'all', label: 'Tất cả (9)' },
              { id: 'cat', label: 'Cát' },
              { id: 'binh', label: 'Bình' },
              { id: 'hung', label: 'Hung' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`hk-chip-btn ${ratingFilter === f.id ? 'is-active' : ''}`}
                aria-pressed={ratingFilter === f.id}
                onClick={() => setRatingFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hk-cards-grid">
          {filteredPalaces.map((p) => (
            <button
              key={p.cung}
              type="button"
              className={`hk-summary-card ${selectedCung === p.cung ? 'is-selected' : ''}`}
              onClick={() => setSelectedCung(p.cung)}
            >
              <div className="hk-summary-card-head">
                <span className="hk-summary-card-title">
                  {p.name} ({p.trigram})
                  {p.isHuongPalace && ' · HƯỚNG'}
                  {p.isToaPalace && ' · TỌA'}
                </span>
                <span className={`hk-rating-pill tone-${p.rating}`}>{RATING_LABELS[p.rating]}</span>
              </div>
              <div className="hk-summary-triple">
                <span>Sơn <strong>{p.sonStar}</strong></span>
                <span>Vận <strong>{p.vanStar}</strong></span>
                <span>Hướng <strong>{p.huongStar}</strong></span>
              </div>
              <div className="hk-summary-pair-title">{p.pair?.title}</div>
              <p className="hk-summary-pair-advice">{p.pair?.layoutAdvice}</p>
            </button>
          ))}
        </div>

        {/* Lookup Disclosures */}
        <div className="hk-disclosures hk-lookup-disclosures">
          <details className="hk-details">
            <summary>Bảng tra cứu ý nghĩa Cửu Tinh (1 → 9) trong Vận {van}</summary>
            <div className="hk-details-body">
              <div className="hk-stars-ref-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                  const s = CUU_TINH_INFO[num];
                  const elemClass = ELEMENT_CLASS_MAP[s.element] || 'tho';
                  return (
                    <div key={num} className={`hk-star-ref-card hk-elem-${elemClass}`}>
                      <div className="hk-star-ref-head">
                        <strong>
                          {num}. {s.name}
                        </strong>
                        <span>{s.element} · {s.trigram}</span>
                      </div>
                      <p><strong>Đắc vận:</strong> {s.prosperousDesc}</p>
                      <p><strong>Thất vận:</strong> {s.decliningDesc}</p>
                      <p><strong>Điều hòa:</strong> {s.remedy}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </details>

          <details className="hk-details">
            <summary>Đối chiếu nhanh Bát Trạch theo tuổi chủ nhà (Tùy chọn)</summary>
            <div className="hk-details-body">
              <p className="hk-bat-trach-note">
                Lưu ý: <strong>Bát Trạch</strong> tính quái mệnh theo năm sinh gia chủ (tham khảo phương vị hợp/kỵ cá nhân),
                khác với <strong>Huyền Không Phi Tinh</strong> vốn xét vượng suy không gian – thời gian của ngôi nhà.
              </p>
              <div className="hk-bat-trach-form">
                {Array.isArray(savedProfiles) && savedProfiles.length > 0 && (
                  <div className="hk-inline-control">
                    <span>Chọn nhanh từ hồ sơ TuViNow:</span>
                    {savedProfiles.slice(0, 5).map((prof) => (
                      <button
                        key={prof.id}
                        type="button"
                        className="hk-btn hk-btn-xs"
                        onClick={() => {
                          setBatTrachYear(prof.year || 1990);
                          setBatTrachGender(prof.gender === 0 ? 'nu' : 'nam');
                        }}
                      >
                        {prof.name} ({prof.year})
                      </button>
                    ))}
                  </div>
                )}

                <div className="hk-field-row hk-bt-inputs">
                  <div className="hk-field">
                    <label htmlFor={batTrachYearId}>Năm sinh Âm lịch chủ nhà</label>
                    <input
                      id={batTrachYearId}
                      type="number"
                      inputMode="numeric"
                      min={1900}
                      max={2099}
                      value={batTrachYear}
                      onChange={(e) => {
                        const y = Math.trunc(Number(e.target.value));
                        if (Number.isFinite(y)) setBatTrachYear(Math.max(1900, Math.min(2099, y)));
                      }}
                    />
                  </div>
                  <div className="hk-field">
                    <label htmlFor={batTrachGenderId}>Giới tính</label>
                    <select
                      id={batTrachGenderId}
                      value={batTrachGender}
                      onChange={(e) => setBatTrachGender(e.target.value)}
                    >
                      <option value="nam">Nam</option>
                      <option value="nu">Nữ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="hk-bt-result">
                <div className="hk-bt-summary">
                  <strong>
                    Tuổi {batTrach.canChi.label} ({batTrach.birthYear} · {batTrach.genderLabel}):
                  </strong>{' '}
                  Cung Phi <strong>{batTrach.trigram}</strong> ({batTrach.element}) ·{' '}
                  <span className="hk-pill is-mode">{batTrach.group}</span> · Đối chiếu hướng nhà{' '}
                  <strong>{huong.directionName}</strong>:{' '}
                  <span
                    className={`hk-rating-pill ${batTrach.byCung[huong.cung]?.good ? 'tone-cat' : 'tone-hung'}`}
                  >
                    {batTrach.byCung[huong.cung]?.name} ({batTrach.byCung[huong.cung]?.label})
                  </span>
                </div>
                <div className="hk-bt-dirs">
                  {batTrach.directions.map((d) => (
                    <div
                      key={d.cung}
                      className={`hk-bt-dir-chip ${d.good ? 'tone-cat' : 'tone-hung'} ${d.cung === huong.cung ? 'is-house-facing' : ''}`}
                    >
                      <span>{d.directionName}</span>
                      <strong>{d.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Section 4: Floorplan Overlay */}
      <HuyenKhongFloorplanOverlay chart={chart} />

      {/* Native <dialog> Print Preview */}
      <dialog
        ref={printDialogRef}
        closedby="any"
        aria-labelledby={printTitleId}
        className="tv-native-dialog hk-print-dialog"
        onClose={() => setIsPrintOpen(false)}
      >
        <div className="tv-dialog-shell">
          <header className="tv-dialog-header hk-print-modal-head">
            <div className="tv-dialog-title-group">
              <h2 id={printTitleId} className="tv-dialog-title">
                Xem trước bản in — Tinh bàn Cửu cung (Vận {van})
              </h2>
              <p className="tv-dialog-subtitle">
                {effectiveModeLabel} · Hướng {huong.ten} ({directionInfo.degree}°) – Tọa {toa.ten}
              </p>
            </div>
            <div className="hk-print-modal-actions">
              <button
                type="button"
                className="hk-btn hk-btn-primary"
                onClick={() => window.print()}
              >
                <span aria-hidden="true">🖨</span> In / Lưu PDF trình duyệt
              </button>
              <button
                type="button"
                className="hk-btn hk-btn-secondary"
                onClick={handleExportPdf}
                disabled={isExporting}
              >
                <span aria-hidden="true">📄</span> Tải PDF
              </button>
              <button
                type="button"
                className="tv-dialog-close-btn"
                onClick={() => setIsPrintOpen(false)}
                aria-label="Đóng bản xem trước"
              >
                ✕
              </button>
            </div>
          </header>

          <div className="hk-print-body">
            <div ref={printChartRef} className="hk-print-chart-wrap">
              <HuyenKhongCompassChart
                chart={chart}
                selectedCung={selectedCung}
                onSelectCung={setSelectedCung}
                orientationMode={orientationMode}
                forceUnified
              />
            </div>

            <div className="hk-print-table-wrap">
              <h3>Bảng tổng hợp 9 cung [Sơn | Vận | Hướng]</h3>
              <table className="hk-print-table">
                <thead>
                  <tr>
                    <th>Cung</th>
                    <th>Sơn | Vận | Hướng</th>
                    <th>Đánh giá</th>
                    <th>Tổ hợp sao &amp; Gợi ý</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDERED_PALACES.map((c) => {
                    const p = chart.palacesByCung[c];
                    return (
                      <tr key={c}>
                        <td>
                          {p.name} ({p.trigram})
                          {p.isHuongPalace ? ' [Hướng]' : p.isToaPalace ? ' [Tọa]' : ''}
                        </td>
                        <td>{`${p.sonStar} | ${p.vanStar} | ${p.huongStar}`}</td>
                        <td>{RATING_LABELS[p.rating]}</td>
                        <td>
                          <strong>{p.pair?.title}</strong> — {p.pair?.layoutAdvice}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
