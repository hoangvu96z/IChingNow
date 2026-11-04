import React, { useRef, useState, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import PalateCard from './PalateCard';
import { GIO_SINH_OPTIONS } from '../utils/lunarConverter';
import TuViGlossaryModal from './TuViGlossaryModal';
import {
  computeZiweiMeta,
  getTamPhuongTuChinh,
  buildYunxianOverlay,
  getDaXianPalaceNames,
  THIEN_CAN,
  DIA_CHI,
} from '../utils/tuViZiweiModule.js';

export default function LasoChart({ result, inputData, initialYunxianMode }) {
  const chartRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'png' | 'pdf' | null
  const [exportMessage, setExportMessage] = useState(null);
  const [selectedLearnTerm, setSelectedLearnTerm] = useState(null);

  // 🏛️ Điều hướng Vận Hạn Động (TimeNav)
  const initialMode = initialYunxianMode || (result?.viewYear ? 'liunian' : 'mingpan');
  const [yunxianMode, setYunxianMode] = useState(initialMode);
  const [selectedDaXianChiIndex, setSelectedDaXianChiIndex] = useState(null);
  const [activeViewYear, setActiveViewYear] = useState(() => {
    return result?.viewYear ? Number(result.viewYear) : new Date().getFullYear();
  });
  const [selectedLunarMonth, setSelectedLunarMonth] = useState(1);

  // 🎯 Interactive Tam Phương Tứ Chính (Palace Selection)
  const [selectedPalaceChi, setSelectedPalaceChi] = useState(null);

  if (!result || !result.palates) return null;

  const {
    palates,
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
  } = result;

  const hourLabel = GIO_SINH_OPTIONS[inputData?.lunarHourIndex]?.label || '';

  // 🔮 Compute Complete ZiWei Meta
  const ziweiMeta = useMemo(() => {
    return computeZiweiMeta(result, inputData, inputData?.schoolConfig);
  }, [result, inputData]);

  // 🪐 Dynamic Overlay for selected mode, year, month
  const dynamicOverlay = useMemo(() => {
    return buildYunxianOverlay(result, {
      mode: yunxianMode,
      daXianChiIndex: selectedDaXianChiIndex,
      viewYear: activeViewYear,
      lunarMonth: selectedLunarMonth,
      schoolConfig: inputData?.schoolConfig,
      birthYear: inputData?.lunarYear,
    });
  }, [result, yunxianMode, selectedDaXianChiIndex, activeViewYear, selectedLunarMonth, inputData]);

  // 📐 Tam Phương Tứ Chính for selected palace
  const sanFangInfo = useMemo(() => {
    if (selectedPalaceChi === null || selectedPalaceChi === undefined) return null;
    return getTamPhuongTuChinh(selectedPalaceChi);
  }, [selectedPalaceChi]);

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
    if (selectedPalaceChi === null || selectedPalaceChi === undefined) return null;
    return ziweiMeta?.flyingSihua?.palaces?.[selectedPalaceChi] || null;
  }, [selectedPalaceChi, ziweiMeta]);

  // Selected Palace object
  const selectedPalaceObj = useMemo(() => {
    if (selectedPalaceChi === null || selectedPalaceChi === undefined) return null;
    return palates.find((p) => p.chiIndex === selectedPalaceChi) || null;
  }, [selectedPalaceChi, palates]);

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
    return `${raw || 'la-so-tu-vi'}.${ext}`;
  };

  const handleExportPNG = useCallback(async () => {
    if (!chartRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setExportType('png');
      setExportMessage('Đang kết xuất ảnh chất lượng cao...');

      await new Promise((r) => setTimeout(r, 120));

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
  }, [inputData, isExporting]);

  const handleExportPDF = useCallback(async () => {
    if (!chartRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setExportType('pdf');
      setExportMessage('Đang chuẩn bị trang in PDF...');

      await new Promise((r) => setTimeout(r, 120));

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
  }, [inputData, isExporting]);

  return (
    <div className="chart-container fade-in">
      {/* Top Action Bar */}
      <div className="chart-actions-bar">
        <div className="chart-actions-title">
          <span>🔮 Lá Số Tử Vi — {inputData?.name || 'Bản Mệnh'}</span>
          {result.viewYearCanChi && (
            <span className="chart-year-label">
              Lưu Niên {result.viewYear || ''} · {result.viewYearCanChi}
            </span>
          )}
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
            onClick={() => setYunxianMode('mingpan')}
          >
            🏛️ Bản Mệnh
          </button>
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'daxian' ? 'is-active' : ''}`}
            onClick={() => {
              setYunxianMode('daxian');
              if (selectedDaXianChiIndex === null && ziweiMeta?.daXianList?.[0]) {
                setSelectedDaXianChiIndex(ziweiMeta.daXianList[0].chiIndex);
              }
            }}
          >
            🪐 Đại Hạn (10 Năm)
          </button>
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'liunian' ? 'is-active' : ''}`}
            onClick={() => setYunxianMode('liunian')}
          >
            📅 Lưu Niên (1 Năm)
          </button>
          <button
            type="button"
            className={`timenav-tab ${yunxianMode === 'liuyue' ? 'is-active' : ''}`}
            onClick={() => setYunxianMode('liuyue')}
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
                    onClick={() => setSelectedDaXianChiIndex(dx.chiIndex)}
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
                onClick={() => setActiveViewYear((y) => y - 1)}
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
                onClick={() => setActiveViewYear((y) => y + 1)}
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
                  onClick={() => setSelectedLunarMonth(m)}
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

      {/* Captured Export Wrapper */}
      <div
        ref={chartRef}
        className={`chart-export-wrapper${isExporting ? ' is-exporting' : ''}`}
        data-exporting={isExporting ? 'true' : undefined}
        id="tuvi-chart-capture"
      >
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
            {selectedPalaceChi !== null && selectedPalaceObj ? (
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

      {/* Tap-to-learn Glossary Bottom Sheet Modal */}
      <TuViGlossaryModal
        term={selectedLearnTerm}
        onClose={() => setSelectedLearnTerm(null)}
      />
    </div>
  );
}
