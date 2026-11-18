import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import PalateCard from './PalateCard';
import { GIO_SINH_OPTIONS } from '../utils/lunarConverter';
import TuViGlossaryModal from './TuViGlossaryModal';
import { useTuViEvidence } from '../context/tuViEvidenceState';
import {
  computeZiweiMeta,
  getTamPhuongTuChinh,
  buildYunxianOverlay,
  getDaXianPalaceNames,
  THIEN_CAN,
  DIA_CHI,
} from '../utils/tuViZiweiModule.js';

// Tọa độ điểm neo 12 Địa Chi trên khung lưới 4×4 (viewBox 0 0 400 400, tâm Thiên Bàn 100..300)
const PALACE_ANCHOR_POINTS = {
  0: { x: 250, y: 300 },  // Tý (hàng 4, cột 3)
  1: { x: 150, y: 300 },  // Sửu (hàng 4, cột 2)
  2: { x: 100, y: 300 },  // Dần (hàng 4, cột 1)
  3: { x: 100, y: 250 },  // Mão (hàng 3, cột 1)
  4: { x: 100, y: 150 },  // Thìn (hàng 2, cột 1)
  5: { x: 100, y: 100 },  // Tỵ (hàng 1, cột 1)
  6: { x: 150, y: 100 },  // Ngọ (hàng 1, cột 2)
  7: { x: 250, y: 100 },  // Mùi (hàng 1, cột 3)
  8: { x: 300, y: 100 },  // Thân (hàng 1, cột 4)
  9: { x: 300, y: 150 },  // Dậu (hàng 2, cột 4)
  10: { x: 300, y: 250 }, // Tuất (hàng 3, cột 4)
  11: { x: 300, y: 300 }, // Hợi (hàng 4, cột 4)
};

const MOBILE_STAGE_WIDTH = 920;

export default function LasoChart({
  result,
  inputData,
  initialYunxianMode,
  yunxianState: externalYunxianState,
  onYunxianChange,
}) {
  const chartRef = useRef(null);
  const viewportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'png' | 'pdf' | null
  const [exportMessage, setExportMessage] = useState(null);
  const [selectedLearnTerm, setSelectedLearnTerm] = useState(null);

  // 📱 Chế độ hiển thị khung 12 cung trên Mobile: 'fit' (thu vừa màn hình như SVG/ảnh tương tác) | 'zoom' (phóng to kéo ngang)
  const [mobileViewMode, setMobileViewMode] = useState('fit');
  const [viewportWidth, setViewportWidth] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return undefined;
    const vpEl = viewportRef.current;
    const chEl = chartRef.current;
    if (!vpEl && !chEl) return undefined;

    const updateMetrics = () => {
      if (viewportRef.current) {
        setViewportWidth(viewportRef.current.clientWidth || 0);
      }
      if (chartRef.current) {
        setStageHeight(chartRef.current.offsetHeight || 0);
      }
    };

    updateMetrics();
    const ro = new ResizeObserver(updateMetrics);
    if (vpEl) ro.observe(vpEl);
    if (chEl) ro.observe(chEl);
    window.addEventListener('resize', updateMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [result, isExporting, mobileViewMode]);

  // 🏛️ Điều hướng Vận Hạn Động (TimeNav)
  const initialMode = initialYunxianMode || (result?.viewYear ? 'liunian' : 'mingpan');
  const [internalMode, setInternalMode] = useState(initialMode);
  const [internalSelectedDaXian, setInternalSelectedDaXian] = useState(null);
  const [internalViewYear, setInternalViewYear] = useState(() => {
    return result?.viewYear ? Number(result.viewYear) : new Date().getFullYear();
  });
  const [internalLunarMonth, setInternalLunarMonth] = useState(1);

  const yunxianMode = externalYunxianState?.mode !== undefined ? externalYunxianState.mode : internalMode;
  const selectedDaXianChiIndex = externalYunxianState?.daXianChiIndex !== undefined ? externalYunxianState.daXianChiIndex : internalSelectedDaXian;
  const activeViewYear = externalYunxianState?.viewYear !== undefined && externalYunxianState?.viewYear !== null ? Number(externalYunxianState.viewYear) : internalViewYear;
  const selectedLunarMonth = externalYunxianState?.lunarMonth !== undefined ? externalYunxianState.lunarMonth : internalLunarMonth;

  const updateYunxian = useCallback((updates) => {
    if (updates.mode !== undefined) setInternalMode(updates.mode);
    if (updates.daXianChiIndex !== undefined) setInternalSelectedDaXian(updates.daXianChiIndex);
    if (updates.viewYear !== undefined) setInternalViewYear(updates.viewYear);
    if (updates.lunarMonth !== undefined) setInternalLunarMonth(updates.lunarMonth);

    if (onYunxianChange) {
      onYunxianChange({
        mode: updates.mode !== undefined ? updates.mode : yunxianMode,
        daXianChiIndex: updates.daXianChiIndex !== undefined ? updates.daXianChiIndex : selectedDaXianChiIndex,
        viewYear: updates.viewYear !== undefined ? updates.viewYear : activeViewYear,
        lunarMonth: updates.lunarMonth !== undefined ? updates.lunarMonth : selectedLunarMonth,
      });
    }
  }, [onYunxianChange, yunxianMode, selectedDaXianChiIndex, activeViewYear, selectedLunarMonth]);

  // 🎯 Interactive Tam Phương Tứ Chính (Palace Selection)
  const [selectedPalaceChi, setSelectedPalaceChi] = useState(null);
  const evidence = useTuViEvidence();

  // Reset mọi trạng thái chọn cung / tra cứu / căn cứ trước khi xuất PNG hoặc PDF
  const resetChartSelectionForExport = useCallback(() => {
    setSelectedPalaceChi(null);
    setSelectedLearnTerm(null);
    evidence?.clear?.();
  }, [evidence]);

  const {
    palates = [],
    amDuongNamNu,
    canChiNam,
    banMenhNapAm,
    cucName,
    chuMenh,
    chuThan,
    menhCung,
    thanCung,
    tuanCung,
    trietCung,
    isThuan,
  } = result || {};

  const hourLabel = GIO_SINH_OPTIONS[inputData?.lunarHourIndex]?.label || '';

  // 🔮 Compute Complete ZiWei Meta
  const ziweiMeta = useMemo(() => {
    if (!result || !result.palates) return null;
    return computeZiweiMeta(result, inputData, inputData?.schoolConfig);
  }, [result, inputData]);

  // 🪐 Dynamic Overlay for selected mode, year, month
  const dynamicOverlay = useMemo(() => {
    if (!result || !result.palates) return null;
    return buildYunxianOverlay(result, {
      mode: yunxianMode,
      daXianChiIndex: selectedDaXianChiIndex,
      viewYear: activeViewYear,
      lunarMonth: selectedLunarMonth,
      schoolConfig: inputData?.schoolConfig,
      birthYear: inputData?.lunarYear,
    });
  }, [result, yunxianMode, selectedDaXianChiIndex, activeViewYear, selectedLunarMonth, inputData]);

  // 📐 Tam Phương Tứ Chính cho cung đang chọn (tự động tắt hoàn toàn khi xuất PNG/PDF)
  const sanFangInfo = useMemo(() => {
    if (isExporting || selectedPalaceChi === null || selectedPalaceChi === undefined) return null;
    return getTamPhuongTuChinh(selectedPalaceChi);
  }, [isExporting, selectedPalaceChi]);

  const svgSanFang = useMemo(() => {
    if (isExporting || !sanFangInfo) return null;
    return { ...sanFangInfo, isExplicit: true };
  }, [isExporting, sanFangInfo]);

  const isCompactViewport = !isExporting && viewportWidth > 0 && viewportWidth < MOBILE_STAGE_WIDTH;
  const mobileScale = useMemo(() => {
    if (!isCompactViewport) return 1;
    if (mobileViewMode === 'zoom') {
      return Math.min(1, Math.max(0.66, viewportWidth / 600));
    }
    return Math.min(1, Math.max(0.32, (viewportWidth - 2) / MOBILE_STAGE_WIDTH));
  }, [isCompactViewport, mobileViewMode, viewportWidth]);

  // Can Chi & Tuổi Âm của activeViewYear
  const activeYearCanChi = useMemo(() => {
    if (!activeViewYear) return '';
    const stem = THIEN_CAN[((activeViewYear - 4) % 10 + 10) % 10];
    const branch = DIA_CHI[((activeViewYear - 4) % 12 + 12) % 12];
    return `${stem} ${branch}`;
  }, [activeViewYear]);

  const activeTuoiAm = useMemo(() => {
    if (!inputData?.lunarYear || !activeViewYear) return null;
    return activeViewYear - inputData.lunarYear + 1;
  }, [activeViewYear, inputData?.lunarYear]);

  // Active Decade Object
  const currentActiveDaXian = useMemo(() => {
    if (selectedDaXianChiIndex !== null) {
      return ziweiMeta?.daXianList?.find((d) => d.chiIndex === selectedDaXianChiIndex) || null;
    }
    return ziweiMeta?.activeDaXian || ziweiMeta?.daXianList?.[0] || null;
  }, [selectedDaXianChiIndex, ziweiMeta]);

  // Palace map for rotated names
  const rotatedPalaceMap = useMemo(() => {
    if (yunxianMode === 'daxian' && currentActiveDaXian) {
      return getDaXianPalaceNames(currentActiveDaXian.chiIndex);
    }
    if (yunxianMode === 'liunian' && dynamicOverlay?.luuNienPalaceMap) {
      return dynamicOverlay.luuNienPalaceMap;
    }
    if (yunxianMode === 'liuyue' && dynamicOverlay?.luuNguyetPalaceMap) {
      return dynamicOverlay.luuNguyetPalaceMap;
    }
    return {};
  }, [yunxianMode, currentActiveDaXian, dynamicOverlay]);

  // Active Sihua per palace
  const activeSihuaByPalace = useMemo(() => {
    const map = {};
    if (!dynamicOverlay?.sihuaLayers) return map;

    const layer =
      yunxianMode === 'daxian'
        ? dynamicOverlay.sihuaLayers.daXian
        : yunxianMode === 'liunian'
        ? dynamicOverlay.sihuaLayers.liuNian
        : yunxianMode === 'liuyue'
        ? dynamicOverlay.sihuaLayers.liuYue
        : null;

    if (!layer || !layer.transforms) return map;

    const prefix =
      yunxianMode === 'daxian' ? 'ĐH' : yunxianMode === 'liunian' ? 'LN' : 'LNg';

    const trans = layer.transforms;
    const types = [
      { key: 'Hóa Lộc', label: `${prefix}.Lộc` },
      { key: 'Hóa Quyền', label: `${prefix}.Quyền` },
      { key: 'Hóa Khoa', label: `${prefix}.Khoa` },
      { key: 'Hóa Kỵ', label: `${prefix}.Kỵ` },
    ];

    for (const t of types) {
      const starName = trans[t.key];
      if (!starName) continue;
      // Tìm cung chứa sao này
      const targetPalace = palates.find((p) => {
        const major = (p.chinhTinh || []).map((s) => s.split('(')[0].trim());
        const minor = (p.phuTinh || []).map((s) => s.split('(')[0].trim());
        return major.includes(starName) || minor.includes(starName);
      });
      if (targetPalace) {
        if (!map[targetPalace.chiIndex]) map[targetPalace.chiIndex] = [];
        map[targetPalace.chiIndex].push({
          type: t.key,
          starName,
          label: t.label,
        });
      }
    }

    return map;
  }, [dynamicOverlay, yunxianMode, palates]);

  // Phi tinh của cung đang chọn
  const selectedPalaceFlying = useMemo(() => {
    if (isExporting || selectedPalaceChi === null || selectedPalaceChi === undefined) return null;
    return ziweiMeta?.flyingSihua?.palaces?.[selectedPalaceChi] || null;
  }, [isExporting, selectedPalaceChi, ziweiMeta]);

  // Selected Palace object
  const selectedPalaceObj = useMemo(() => {
    if (isExporting || selectedPalaceChi === null || selectedPalaceChi === undefined) return null;
    return palates.find((p) => p.chiIndex === selectedPalaceChi) || null;
  }, [isExporting, selectedPalaceChi, palates]);

  const handlePalaceSelect = (chiIndex) => {
    setSelectedPalaceChi((prev) => (prev === chiIndex ? null : chiIndex));
  };

  const getCleanFileName = (ext) => {
    const raw = (inputData?.name || 'la-so-tu-vi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let modeSuffix = '';
    if (yunxianMode === 'daxian' && currentActiveDaXian) {
      const range = (currentActiveDaXian.startAge !== undefined && currentActiveDaXian.endAge !== undefined)
        ? `${currentActiveDaXian.startAge}-${currentActiveDaXian.endAge}`
        : currentActiveDaXian.label.replace(/[^0-9-]+/g, '') || 'daxian';
      modeSuffix = `-dai-han-${range}`;
    } else if (yunxianMode === 'liunian' && activeViewYear) {
      modeSuffix = `-luu-nien-${activeViewYear}`;
    } else if (yunxianMode === 'liuyue' && selectedLunarMonth) {
      modeSuffix = `-luu-nguyet-t${selectedLunarMonth}-${activeViewYear}`;
    }

    return `${raw || 'la-so-tu-vi'}${modeSuffix}.${ext}`;
  };

  const handleExportPNG = useCallback(async () => {
    if (!chartRef.current || isExporting) return;
    try {
      resetChartSelectionForExport();
      setIsExporting(true);
      setExportType('png');
      setExportMessage('Đang kết xuất ảnh chất lượng cao...');

      await new Promise((r) => setTimeout(r, 150));

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const bgColor = isDark ? '#0a0a14' : '#f7f5f0';

      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: bgColor,
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.download = getCleanFileName('png');
      link.href = dataUrl;
      link.click();
      setExportMessage('Xuất ảnh PNG thành công!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('Export PNG failed:', err);
      setExportMessage('Lỗi khi xuất ảnh. Vui lòng thử lại!');
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  }, [inputData, isExporting, resetChartSelectionForExport]);

  const handleExportPDF = useCallback(async () => {
    if (!chartRef.current || isExporting) return;
    try {
      resetChartSelectionForExport();
      setIsExporting(true);
      setExportType('pdf');
      setExportMessage('Đang chuẩn bị trang in PDF...');

      await new Promise((r) => setTimeout(r, 150));

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const bgColor = isDark ? '#0a0a14' : '#f7f5f0';

      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: bgColor,
        skipFonts: true,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      let renderWidth = availableWidth;
      let renderHeight = (img.height * renderWidth) / img.width;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = (img.width * renderHeight) / img.height;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight);
      pdf.save(getCleanFileName('pdf'));
      setExportMessage('Xuất PDF thành công!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('Export PDF failed:', err);
      setExportMessage('Lỗi khi xuất PDF. Vui lòng thử lại!');
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  }, [inputData, isExporting, resetChartSelectionForExport]);

  if (!result || !result.palates) return null;

  return (
    <div className="chart-container fade-in">
      {/* Top Action Bar */}
      <div className="chart-actions-bar">
        <div className="chart-actions-title">
          <span>🔮 Lá Số Tử Vi — {inputData?.name || 'Bản Mệnh'}</span>
          {yunxianMode === 'daxian' && currentActiveDaXian ? (
            <span className="chart-year-label">
              Đại Hạn {currentActiveDaXian.label} ({currentActiveDaXian.fullLabel || currentActiveDaXian.chiName})
            </span>
          ) : yunxianMode === 'liunian' && activeViewYear ? (
            <span className="chart-year-label">
              Lưu Niên {activeViewYear} · {activeYearCanChi}{activeTuoiAm ? ` (${activeTuoiAm} Tuổi)` : ''}
            </span>
          ) : yunxianMode === 'liuyue' ? (
            <span className="chart-year-label">
              Lưu Nguyệt Tháng {selectedLunarMonth} · Năm {activeViewYear} ({activeYearCanChi})
            </span>
          ) : result.viewYearCanChi ? (
            <span className="chart-year-label">
              Lưu Niên {result.viewYear || ''} · {result.viewYearCanChi}
            </span>
          ) : null}
        </div>
        <div className="chart-actions-buttons">
          {exportMessage && <span className="export-status-msg">{exportMessage}</span>}
          <button
            className="btn-export"
            onClick={handleExportPNG}
            disabled={isExporting}
            type="button"
            title="Xuất lá số ra file hình ảnh PNG chất lượng cao"
            id="btn-export-png"
          >
            {exportType === 'png' ? <>⏳ Đang tạo ảnh...</> : <>📸 Xuất Ảnh PNG</>}
          </button>
          <button
            className="btn-export"
            onClick={handleExportPDF}
            disabled={isExporting}
            type="button"
            title="Xuất lá số ra tài liệu PDF khổ A4 ngang"
            id="btn-export-pdf"
          >
            {exportType === 'pdf' ? <>⏳ Đang tạo PDF...</> : <>📄 Xuất File PDF</>}
          </button>
        </div>
      </div>

      {/* Tap-to-learn hint banner */}
      <div className="tuvi-tap-to-learn-banner">
        <span aria-hidden="true">💡</span>
        <span>
          <strong>Tra cứu nhanh (Tap-to-learn):</strong> Chạm vào bất kỳ <strong>sao</strong>,{' '}
          <strong>tên cung</strong>, hoặc <strong>Tuần / Triệt</strong> trên lá số để xem giải nghĩa
          chi tiết. Chạm vào <strong>khung cung</strong> để soi <strong>Tam Phương Tứ Chính</strong> &{' '}
          <strong>Phi Tinh Tứ Hóa</strong>.
        </span>
      </div>

      {/* 🧭 Thanh Điều Hướng Vận Hạn Động (TimeNav) */}
      <div className="tuvi-timenav" role="navigation" aria-label="Thanh điều hướng vận hạn động">
        <div className="timenav-tabs">
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'mingpan' ? 'is-active' : ''}`}
            onClick={() => updateYunxian({ mode: 'mingpan' })}
          >
            🏛️ Bản Mệnh
          </button>
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'daxian' ? 'is-active' : ''}`}
            onClick={() => {
              const targetDaXian = (selectedDaXianChiIndex === null && ziweiMeta?.daXianList?.[0])
                ? ziweiMeta.daXianList[0].chiIndex
                : selectedDaXianChiIndex;
              updateYunxian({ mode: 'daxian', daXianChiIndex: targetDaXian });
            }}
          >
            🪐 Đại Hạn (10 Năm)
          </button>
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'liunian' ? 'is-active' : ''}`}
            onClick={() => updateYunxian({ mode: 'liunian' })}
          >
            📅 Lưu Niên (1 Năm)
          </button>
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'liuyue' ? 'is-active' : ''}`}
            onClick={() => updateYunxian({ mode: 'liuyue' })}
          >
            🌙 Lưu Nguyệt (Tháng)
          </button>
        </div>

        {/* Sub-navigation controls */}
        {yunxianMode === 'daxian' && (
          <div className="timenav-subnav daxian-subnav">
            <div className="daxian-chips-label">
              <span>Chọn Kỳ Đại Hạn:</span>
            </div>
            <div className="daxian-chips">
              {(ziweiMeta?.daXianList || []).map((dx) => {
                const isActive = (currentActiveDaXian?.chiIndex === dx.chiIndex);
                return (
                  <button
                    key={dx.chiIndex}
                    type="button"
                    className={`daxian-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => updateYunxian({ daXianChiIndex: dx.chiIndex })}
                    title={dx.fullLabel}
                  >
                    {dx.label}
                  </button>
                );
              })}
            </div>
            {dynamicOverlay?.sihuaLayers?.daXian?.transforms && (
              <div className="timenav-sihua-strip">
                <span className="sihua-strip-title">Đại Hạn Tứ Hóa:</span>
                <span className="sihua-strip-item loc">ĐH.Lộc: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Lộc']}</span>
                <span className="sihua-strip-item quyen">ĐH.Quyền: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Quyền']}</span>
                <span className="sihua-strip-item khoa">ĐH.Khoa: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Khoa']}</span>
                <span className="sihua-strip-item ky">ĐH.Kỵ: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Kỵ']}</span>
              </div>
            )}
          </div>
        )}

        {yunxianMode === 'liunian' && (
          <div className="timenav-subnav liunian-subnav">
            <div className="year-stepper">
              <button
                type="button"
                className="year-step-btn"
                onClick={() => updateYunxian({ viewYear: activeViewYear - 1 })}
                title="Xem năm trước"
              >
                ‹ Năm {activeViewYear - 1}
              </button>
              <div className="year-stepper-current">
                <span className="year-number">Năm {activeViewYear}</span>
                <span className="year-canchi">({activeYearCanChi}{activeTuoiAm ? ` · ${activeTuoiAm} Tuổi` : ''})</span>
              </div>
              <button
                type="button"
                className="year-step-btn"
                onClick={() => updateYunxian({ viewYear: activeViewYear + 1 })}
                title="Xem năm kế tiếp"
              >
                Năm {activeViewYear + 1} ›
              </button>
            </div>
            {dynamicOverlay?.sihuaLayers?.liuNian?.transforms && (
              <div className="timenav-sihua-strip">
                <span className="sihua-strip-title">Lưu Niên Tứ Hóa:</span>
                <span className="sihua-strip-item loc">LN.Lộc: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Lộc']}</span>
                <span className="sihua-strip-item quyen">LN.Quyền: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Quyền']}</span>
                <span className="sihua-strip-item khoa">LN.Khoa: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Khoa']}</span>
                <span className="sihua-strip-item ky">LN.Kỵ: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Kỵ']}</span>
              </div>
            )}
          </div>
        )}

        {yunxianMode === 'liuyue' && (
          <div className="timenav-subnav liuyue-subnav">
            <div className="liuyue-chips">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`liuyue-chip ${selectedLunarMonth === m ? 'is-active' : ''}`}
                  onClick={() => updateYunxian({ lunarMonth: m })}
                >
                  Tháng {m}
                </button>
              ))}
            </div>
            {dynamicOverlay?.sihuaLayers?.liuYue?.transforms && (
              <div className="timenav-sihua-strip">
                <span className="sihua-strip-title">Lưu Nguyệt Tứ Hóa:</span>
                <span className="sihua-strip-item loc">LNg.Lộc: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Lộc']}</span>
                <span className="sihua-strip-item quyen">LNg.Quyền: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Quyền']}</span>
                <span className="sihua-strip-item khoa">LNg.Khoa: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Khoa']}</span>
                <span className="sihua-strip-item ky">LNg.Kỵ: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Kỵ']}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile 4×4 Interactive View Mode Switcher */}
      <div className="chart-mobile-viewbar" aria-label="Tùy chỉnh hiển thị khung 12 cung trên di động">
        <span className="chart-mobile-viewbar-label">📱 Khung 12 cung (4×4):</span>
        <div className="chart-mobile-viewbar-btns">
          <button
            type="button"
            className={`chart-mobile-view-btn ${mobileViewMode === 'fit' ? 'is-active' : ''}`}
            onClick={() => setMobileViewMode('fit')}
          >
            📐 Vừa màn hình (Tương tác)
          </button>
          <button
            type="button"
            className={`chart-mobile-view-btn ${mobileViewMode === 'zoom' ? 'is-active' : ''}`}
            onClick={() => setMobileViewMode('zoom')}
          >
            🔍 Phóng to đọc rõ
          </button>
        </div>
      </div>

      {/* Responsive Interactive 4×4 Viewport */}
      <div
        ref={viewportRef}
        className={`chart-scale-viewport${isCompactViewport ? ` is-scaled mode-${mobileViewMode}` : ''}`}
        style={
          isCompactViewport && stageHeight > 0
            ? {
                height: `${Math.ceil(stageHeight * mobileScale) + 6}px`,
              }
            : undefined
        }
      >
        {/* Captured Export Wrapper */}
        <div
          ref={chartRef}
          className={`chart-export-wrapper${isExporting ? ' is-exporting' : ''}${isCompactViewport ? ' is-mobile-stage' : ''}`}
          data-exporting={isExporting ? 'true' : undefined}
          id="tuvi-chart-capture"
          style={
            isCompactViewport
              ? {
                  width: `${MOBILE_STAGE_WIDTH}px`,
                  minWidth: `${MOBILE_STAGE_WIDTH}px`,
                  maxWidth: `${MOBILE_STAGE_WIDTH}px`,
                  transform: `scale(${mobileScale})`,
                  transformOrigin: 'top left',
                }
              : undefined
          }
        >
        {/* Banner Vận Hạn Đang Xem khi Xuất Ảnh / PDF */}
        <div className="chart-export-yunxian-banner">
          <div className="export-banner-main">
            <span className="export-banner-icon">
              {yunxianMode === 'daxian' ? '🪐' : yunxianMode === 'liunian' ? '📅' : yunxianMode === 'liuyue' ? '🌙' : '🏛️'}
            </span>
            <div className="export-banner-info">
              <span className="export-banner-mode">
                {yunxianMode === 'daxian' && currentActiveDaXian
                  ? `Đại Hạn: ${currentActiveDaXian.label} (${currentActiveDaXian.fullLabel || currentActiveDaXian.chiName})`
                  : yunxianMode === 'liunian'
                  ? `Lưu Niên: Năm ${activeViewYear} (${activeYearCanChi}${activeTuoiAm ? ` · ${activeTuoiAm} Tuổi` : ''})`
                  : yunxianMode === 'liuyue'
                  ? `Lưu Nguyệt: Tháng ${selectedLunarMonth} Âm Lịch (Năm ${activeViewYear} · ${activeYearCanChi})`
                  : `Chế Độ: Lá Số Bản Mệnh · ${canChiNam} (${banMenhNapAm})`}
              </span>
              <span className="export-banner-sub">
                {inputData?.name ? `Đương số: ${inputData.name} · ` : ''}
                Mệnh: {menhCung} · Thân: {thanCung} · Cục: {cucName}
              </span>
            </div>
          </div>
          {/* Active Tứ Hóa Strip in Export Banner */}
          {yunxianMode === 'daxian' && dynamicOverlay?.sihuaLayers?.daXian?.transforms && (
            <div className="export-banner-sihua">
              <span className="export-sihua-title">Đại Hạn Tứ Hóa:</span>
              <span className="export-sihua-item loc">ĐH.Lộc: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Lộc']}</span>
              <span className="export-sihua-item quyen">ĐH.Quyền: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Quyền']}</span>
              <span className="export-sihua-item khoa">ĐH.Khoa: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Khoa']}</span>
              <span className="export-sihua-item ky">ĐH.Kỵ: {dynamicOverlay.sihuaLayers.daXian.transforms['Hóa Kỵ']}</span>
            </div>
          )}
          {yunxianMode === 'liunian' && dynamicOverlay?.sihuaLayers?.liuNian?.transforms && (
            <div className="export-banner-sihua">
              <span className="export-sihua-title">Lưu Niên Tứ Hóa:</span>
              <span className="export-sihua-item loc">LN.Lộc: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Lộc']}</span>
              <span className="export-sihua-item quyen">LN.Quyền: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Quyền']}</span>
              <span className="export-sihua-item khoa">LN.Khoa: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Khoa']}</span>
              <span className="export-sihua-item ky">LN.Kỵ: {dynamicOverlay.sihuaLayers.liuNian.transforms['Hóa Kỵ']}</span>
            </div>
          )}
          {yunxianMode === 'liuyue' && dynamicOverlay?.sihuaLayers?.liuYue?.transforms && (
            <div className="export-banner-sihua">
              <span className="export-sihua-title">Lưu Nguyệt Tứ Hóa:</span>
              <span className="export-sihua-item loc">LNg.Lộc: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Lộc']}</span>
              <span className="export-sihua-item quyen">LNg.Quyền: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Quyền']}</span>
              <span className="export-sihua-item khoa">LNg.Khoa: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Khoa']}</span>
              <span className="export-sihua-item ky">LNg.Kỵ: {dynamicOverlay.sihuaLayers.liuYue.transforms['Hóa Kỵ']}</span>
            </div>
          )}
        </div>
        <div className="chart-grid">
          {/* Render 12 palace cards */}
          {palates.map((palace, i) => {
            let sanFangRole = null;
            if (sanFangInfo) {
              if (palace.chiIndex === sanFangInfo.target) sanFangRole = 'ban-cung';
              else if (palace.chiIndex === sanFangInfo.xungChieu) sanFangRole = 'xung-chieu';
              else if (sanFangInfo.tamHop.includes(palace.chiIndex)) sanFangRole = 'tam-hop';
              else if (sanFangInfo.giapCung.includes(palace.chiIndex)) sanFangRole = 'giap-cung';
            }

            const isLaiNhan = ziweiMeta?.laiNhanCung?.chiIndex === palace.chiIndex;
            const selfSihua = ziweiMeta?.flyingSihua?.palaces?.[palace.chiIndex]?.selfSihua || [];
            const tuHoaList = selfSihua.map((s) => `Tự Hóa ${s.siHua.replace('Hóa ', '')}`);
            const isVoChinhDieu = !palace.chinhTinh || palace.chinhTinh.length === 0;
            const borrowedInfo = ziweiMeta?.emptyPalaceBorrowing?.[palace.chiIndex];
            const schoolBrightnessMap = ziweiMeta?.schoolStarBrightnessMap?.[palace.chiIndex];
            const rotatedPalaceName = rotatedPalaceMap[palace.chiIndex] || null;
            const activeYunxianSihua = activeSihuaByPalace[palace.chiIndex] || [];
            const boshiStar = ziweiMeta?.shierShen?.boshi?.[palace.chiIndex] || null;
            const jiangQianStar = ziweiMeta?.shierShen?.jiangQian?.[palace.chiIndex] || null;

            return (
              <PalateCard
                key={i}
                palace={palace}
                onSelectTerm={setSelectedLearnTerm}
                onSelectPalace={handlePalaceSelect}
                sanFangRole={sanFangRole}
                isLaiNhan={isLaiNhan}
                tuHoaList={tuHoaList}
                isVoChinhDieu={isVoChinhDieu}
                borrowedInfo={borrowedInfo}
                schoolBrightnessMap={schoolBrightnessMap}
                rotatedPalaceName={rotatedPalaceName}
                activeYunxianSihua={activeYunxianSihua}
                boshiStar={boshiStar}
                jiangQianStar={jiangQianStar}
              />
            );
          })}

          {/* Center Info Panel */}
          <div className="chart-center">
            {/* Interactive SVG Tam Phương Tứ Chính Overlay (ẩn hoàn toàn khi xuất ảnh/PDF) */}
            {!isExporting && svgSanFang && PALACE_ANCHOR_POINTS[svgSanFang.target] && (
              <svg
                className={`chart-sanfang-svg ${svgSanFang.isExplicit ? 'is-explicit' : 'is-default'}`}
                viewBox="100 100 200 200"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Tam Hợp Triangle — dùng inline fill="none" để tránh lỗi đen khối khi tuần tự hóa SVG */}
                {svgSanFang.tamHop?.length === 2 &&
                  PALACE_ANCHOR_POINTS[svgSanFang.tamHop[0]] &&
                  PALACE_ANCHOR_POINTS[svgSanFang.tamHop[1]] && (
                    <polygon
                      points={[
                        `${PALACE_ANCHOR_POINTS[svgSanFang.target].x},${PALACE_ANCHOR_POINTS[svgSanFang.target].y}`,
                        `${PALACE_ANCHOR_POINTS[svgSanFang.tamHop[0]].x},${PALACE_ANCHOR_POINTS[svgSanFang.tamHop[0]].y}`,
                        `${PALACE_ANCHOR_POINTS[svgSanFang.tamHop[1]].x},${PALACE_ANCHOR_POINTS[svgSanFang.tamHop[1]].y}`,
                      ].join(' ')}
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="1.3"
                      strokeDasharray="4 3"
                      className="sanfang-svg-triangle"
                    />
                  )}
                {/* Xung Chiếu Line */}
                {PALACE_ANCHOR_POINTS[svgSanFang.xungChieu] && (
                  <line
                    x1={PALACE_ANCHOR_POINTS[svgSanFang.target].x}
                    y1={PALACE_ANCHOR_POINTS[svgSanFang.target].y}
                    x2={PALACE_ANCHOR_POINTS[svgSanFang.xungChieu].x}
                    y2={PALACE_ANCHOR_POINTS[svgSanFang.xungChieu].y}
                    stroke="#dc2626"
                    strokeWidth="1.4"
                    strokeDasharray="5 3"
                    className="sanfang-svg-xung"
                  />
                )}
                {/* Target Palace Anchor Dot */}
                <circle
                  cx={PALACE_ANCHOR_POINTS[svgSanFang.target].x}
                  cy={PALACE_ANCHOR_POINTS[svgSanFang.target].y}
                  r="4.5"
                  fill="#d97706"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="sanfang-svg-dot target"
                />
              </svg>
            )}
            {!isExporting && selectedPalaceChi !== null && selectedPalaceObj ? (
              /* Selected Palace Deep Inspection View */
              <div className="center-selected-panel">
                <div className="selected-palace-header">
                  <div className="selected-palace-title">
                    <span>Soi Chiếu Cung {selectedPalaceObj.chucNang.replace(' <THÂN>', '')}</span>
                    <span className="selected-palace-canchi">({selectedPalaceObj.canName} {selectedPalaceObj.chiName})</span>
                  </div>
                  <button
                    type="button"
                    className="btn-clear-selection"
                    onClick={() => setSelectedPalaceChi(null)}
                    title="Trở về thông tin bản mệnh"
                  >
                    ✕ Đóng
                  </button>
                </div>

                {/* Tam Phương Tứ Chính Breakdown */}
                {sanFangInfo && (
                  <div className="sanfang-breakdown">
                    <div className="sanfang-row">
                      <span className="sf-badge tag-xung-chieu">Xung Chiếu:</span>
                      <span>Cung {sanFangInfo.xungChieuName}</span>
                    </div>
                    <div className="sanfang-row">
                      <span className="sf-badge tag-tam-hop">Tam Hợp:</span>
                      <span>Cung {sanFangInfo.tamHopNames.join(', ')}</span>
                    </div>
                    <div className="sanfang-row">
                      <span className="sf-badge tag-giap-cung">Giáp Cung:</span>
                      <span>Cung {sanFangInfo.giapCungNames.join(', ')}</span>
                    </div>
                  </div>
                )}

                {/* Phi Tinh Tứ Hóa of Selected Palace */}
                {selectedPalaceFlying?.transforms && (
                  <div className="flying-sihua-box">
                    <div className="flying-title">
                      ✦ Can {selectedPalaceFlying.stemName} Phi Tinh Tứ Hóa:
                    </div>
                    <div className="flying-grid">
                      <div className="flying-cell loc">
                        <strong>Hóa Lộc:</strong> {selectedPalaceFlying.transforms['Hóa Lộc']}
                        {selectedPalaceFlying.flyingFlights?.[0]?.targetPalace && (
                          <span className="flying-target"> → {selectedPalaceFlying.flyingFlights[0].targetPalace}</span>
                        )}
                      </div>
                      <div className="flying-cell quyen">
                        <strong>Hóa Quyền:</strong> {selectedPalaceFlying.transforms['Hóa Quyền']}
                        {selectedPalaceFlying.flyingFlights?.[1]?.targetPalace && (
                          <span className="flying-target"> → {selectedPalaceFlying.flyingFlights[1].targetPalace}</span>
                        )}
                      </div>
                      <div className="flying-cell khoa">
                        <strong>Hóa Khoa:</strong> {selectedPalaceFlying.transforms['Hóa Khoa']}
                        {selectedPalaceFlying.flyingFlights?.[2]?.targetPalace && (
                          <span className="flying-target"> → {selectedPalaceFlying.flyingFlights[2].targetPalace}</span>
                        )}
                      </div>
                      <div className="flying-cell ky">
                        <strong>Hóa Kỵ:</strong> {selectedPalaceFlying.transforms['Hóa Kỵ']}
                        {selectedPalaceFlying.flyingFlights?.[3]?.targetPalace && (
                          <span className="flying-target"> → {selectedPalaceFlying.flyingFlights[3].targetPalace}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vô Chính Diệu Borrowing Note */}
                {selectedPalaceObj.chinhTinh.length === 0 && (
                  <div className="center-vcd-note">
                    ✧ Vô Chính Diệu mượn sao cung {sanFangInfo?.xungChieuName} xung chiếu (Lực chiếu ~70%)
                  </div>
                )}

                {/* Lai Nhân Cung & Tứ Trụ info in selection mode */}
                <div className="center-divider" />
                {ziweiMeta?.laiNhanCung && (
                  <div className="center-info-row mini">
                    <span className="label">Lai Nhân Cung:</span>
                    <span className="value">Cung {ziweiMeta.laiNhanCung.chucNang} ({ziweiMeta.laiNhanCung.canName} {ziweiMeta.laiNhanCung.chiName})</span>
                  </div>
                )}
                {ziweiMeta?.fourPillarsInfo?.fourPillars && (
                  <div className="center-info-row mini">
                    <span className="label">Tứ Trụ:</span>
                    <span className="value">{ziweiMeta.fourPillarsInfo.fourPillars.join(' · ')}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Standard Natal Center Overview */
              <>
                {result.canLuongStr && (
                  <div className="center-info-row">
                    <span className="label">Cân lượng:</span>
                    <span className="value">{result.canLuongStr}</span>
                  </div>
                )}
                {yunxianMode === 'daxian' && currentActiveDaXian ? (
                  <div className="center-info-row yunxian-active-row">
                    <span className="label">Đại hạn:</span>
                    <span className="value">
                      {currentActiveDaXian.label} ({currentActiveDaXian.canName} {currentActiveDaXian.chiName})
                    </span>
                  </div>
                ) : yunxianMode === 'liunian' ? (
                  <>
                    <div className="center-info-row yunxian-active-row">
                      <span className="label">Lưu niên:</span>
                      <span className="value">
                        {activeViewYear} {activeYearCanChi}{activeTuoiAm ? ` · ${activeTuoiAm} tuổi` : ''}
                      </span>
                    </div>
                    {(dynamicOverlay?.tieuHanCungName || result.tieuHanCung) && (
                      <div className="center-info-row">
                        <span className="label">Tiểu hạn:</span>
                        <span className="value">{dynamicOverlay?.tieuHanCungName || result.tieuHanCung}</span>
                      </div>
                    )}
                  </>
                ) : yunxianMode === 'liuyue' ? (
                  <div className="center-info-row yunxian-active-row">
                    <span className="label">Lưu nguyệt:</span>
                    <span className="value">
                      Tháng {selectedLunarMonth} Âm lịch (Năm {activeViewYear})
                    </span>
                  </div>
                ) : (
                  <>
                    {result.tuoiAm != null && (
                      <div className="center-info-row">
                        <span className="label">Tuổi âm:</span>
                        <span className="value">
                          {result.tuoiAm} · Tiểu hạn {result.tieuHanCung}
                        </span>
                      </div>
                    )}
                    {result.viewYearCanChi && (
                      <div className="center-info-row">
                        <span className="label">Lưu niên:</span>
                        <span className="value">
                          {result.viewYear || ''} {result.viewYearCanChi}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="center-name">{inputData?.name || 'Lá Số Tử Vi'}</div>

                <div className="center-info-row">
                  <span className="label">Sinh:</span>
                  <span className="value">
                    {!inputData?.isLunar && inputData?.solarInput
                      ? `${inputData.solarInput.day}/${inputData.solarInput.month}/${inputData.solarInput.year}`
                      : inputData?.isLunar
                      ? '(Nhập âm lịch)'
                      : ''}
                  </span>
                  <span className="label">|</span>
                  <span className="value">{hourLabel}</span>
                </div>

                <div className="center-info-row">
                  <span className="label">Âm lịch:</span>
                  <span className="value">
                    {inputData?.lunarDay}/{inputData?.lunarMonth}/{inputData?.lunarYear}
                    {inputData?.isLeap ? ' (nhuận)' : ''}
                  </span>
                </div>

                <div className="center-divider" />

                <div className="center-info-row">
                  <span className="value">{amDuongNamNu}</span>
                  <span className="label">|</span>
                  <span className="value">{isThuan ? 'Thuận lý' : 'Nghịch lý'}</span>
                </div>

                <div className="center-info-row">
                  <span className="label">Năm:</span>
                  <span className="value">{canChiNam}</span>
                </div>

                <div className="center-info-row">
                  <span className="label">Nạp Âm:</span>
                  <span className="value">{banMenhNapAm}</span>
                </div>

                <div className="center-info-row">
                  <span className="label">Cục:</span>
                  <span className="value cuc-highlight">{cucName}</span>
                </div>

                <div className="center-divider" />

                <div className="center-info-row">
                  <span
                    className="label"
                    onClick={() => setSelectedLearnTerm('Cung Mệnh')}
                    style={{ cursor: 'pointer' }}
                    title="Tra cứu Cung Mệnh"
                  >
                    Mệnh:
                  </span>
                  <span
                    className="value menh-highlight"
                    onClick={() => setSelectedLearnTerm('Cung Mệnh')}
                    style={{ cursor: 'pointer' }}
                    title="Tra cứu Cung Mệnh"
                  >
                    {menhCung}
                  </span>
                  <span
                    className="label"
                    onClick={() => setSelectedLearnTerm('Thân')}
                    style={{ cursor: 'pointer' }}
                    title="Tra cứu Cung Thân"
                  >
                    Thân:
                  </span>
                  <span
                    className="value than-highlight"
                    onClick={() => setSelectedLearnTerm('Thân')}
                    style={{ cursor: 'pointer' }}
                    title="Tra cứu Cung Thân"
                  >
                    {thanCung}
                  </span>
                </div>

                <div className="center-info-row">
                  <span className="label">Chủ Mệnh:</span>
                  <span
                    className="value"
                    onClick={() => setSelectedLearnTerm(chuMenh)}
                    style={{ cursor: 'pointer' }}
                    title={`Tra cứu sao Chủ Mệnh ${chuMenh}`}
                  >
                    {chuMenh}
                  </span>
                </div>
                <div className="center-info-row">
                  <span className="label">Chủ Thân:</span>
                  <span
                    className="value"
                    onClick={() => setSelectedLearnTerm(chuThan)}
                    style={{ cursor: 'pointer' }}
                    title={`Tra cứu sao Chủ Thân ${chuThan}`}
                  >
                    {chuThan}
                  </span>
                </div>

                {ziweiMeta?.laiNhanCung && (
                  <div className="center-info-row">
                    <span
                      className="label"
                      onClick={() => setSelectedLearnTerm('Lai Nhân Cung')}
                      style={{ cursor: 'pointer' }}
                      title="Tra cứu Lai Nhân Cung"
                    >
                      Lai Nhân:
                    </span>
                    <span
                      className="value"
                      onClick={() => setSelectedLearnTerm('Lai Nhân Cung')}
                      style={{ cursor: 'pointer' }}
                      title="Tra cứu Lai Nhân Cung"
                    >
                      Cung {ziweiMeta.laiNhanCung.chucNang} ({ziweiMeta.laiNhanCung.canName} {ziweiMeta.laiNhanCung.chiName})
                    </span>
                  </div>
                )}

                {ziweiMeta?.fourPillarsInfo?.fourPillars && (
                  <div className="center-info-row mini">
                    <span className="label">Tứ Trụ:</span>
                    <span className="value" title="Bát Tự Tứ Trụ">
                      {ziweiMeta.fourPillarsInfo.fourPillars.join(' · ')}
                    </span>
                  </div>
                )}

                <div className="center-divider" />

                <div className="center-info-row">
                  <span
                    className="center-badge badge-tuan"
                    onClick={() => setSelectedLearnTerm('Tuần')}
                    style={{ cursor: 'pointer' }}
                    title="Tra cứu Tuần Không"
                  >
                    Tuần: {tuanCung.join(', ')}
                  </span>
                  <span
                    className="center-badge badge-triet"
                    onClick={() => setSelectedLearnTerm('Triệt')}
                    style={{ cursor: 'pointer' }}
                    title="Tra cứu Triệt Lộ"
                  >
                    Triệt: {trietCung.join(', ')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Tap-to-learn Glossary Bottom Sheet Modal */}
      <TuViGlossaryModal
        term={selectedLearnTerm}
        onClose={() => setSelectedLearnTerm(null)}
      />
    </div>
  );
}
