import React, { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import PalateCard from './PalateCard';
import { GIO_SINH_OPTIONS } from '../utils/lunarConverter';

/**
 * LasoChart — renders the full 4×4 TuVi chart grid with center info panel
 * and provides client-side Export to PNG / PDF.
 */
export default function LasoChart({ result, inputData }) {
  const chartRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'png' | 'pdf' | null
  const [exportMessage, setExportMessage] = useState(null);

  if (!result || !result.palates) return null;

  const { palates, amDuongNamNu, canChiNam, banMenhNapAm, cucName, chuMenh, chuThan,
          menhCung, thanCung, tuanCung, trietCung, isThuan } = result;
  
  const hourLabel = GIO_SINH_OPTIONS[inputData?.lunarHourIndex]?.label || '';

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

      // Small delay to ensure all assets/styles are painted
      await new Promise(r => setTimeout(r, 120));

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const bgColor = isDark ? '#0a0a14' : '#f7f5f0';

      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // 2.5x pixel ratio for crystal-clear sharp text
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

      await new Promise(r => setTimeout(r, 120));

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

      // Fit nicely inside A4 landscape with 8mm margin
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
          {result.viewYearCanChi && <span className="chart-year-label">Lưu niên {result.viewYear || ''} · {result.viewYearCanChi}</span>}
        </div>
        <div className="chart-actions-buttons">
          {exportMessage && (
            <span className="export-status-msg">{exportMessage}</span>
          )}
          <button
            className="btn-export"
            onClick={handleExportPNG}
            disabled={isExporting}
            type="button"
            title="Xuất lá số ra file hình ảnh PNG chất lượng cao"
            id="btn-export-png"
          >
            {exportType === 'png' ? (
              <>⏳ Đang tạo ảnh...</>
            ) : (
              <>📸 Xuất ảnh PNG</>
            )}
          </button>
          <button
            className="btn-export"
            onClick={handleExportPDF}
            disabled={isExporting}
            type="button"
            title="Xuất lá số ra tài liệu PDF khổ A4 ngang"
            id="btn-export-pdf"
          >
            {exportType === 'pdf' ? (
              <>⏳ Đang tạo PDF...</>
            ) : (
              <>📄 Xuất file PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Captured Export Wrapper */}
      <div ref={chartRef} className="chart-export-wrapper" id="tuvi-chart-capture">
        <div className="chart-grid">
          {/* Render 12 palace cards */}
          {palates.map((palace, i) => (
            <PalateCard key={i} palace={palace} />
          ))}

          {/* Center Info Panel */}
          <div className="chart-center">
            {result.viewYearCanChi && <div className="center-info-row"><span className="label">Lưu niên:</span><span className="value">{result.viewYear || ''} {result.viewYearCanChi}</span></div>}
            <div className="center-name">
              {inputData?.name || 'Lá Số Tử Vi'}
            </div>
            
            <div className="center-info-row">
              <span className="label">Sinh:</span>
              <span className="value">
                {inputData?.solarInput ? `${inputData.solarInput.day}/${inputData.solarInput.month}/${inputData.solarInput.year}` : ''}
              </span>
              <span className="label">|</span>
              <span className="value">{hourLabel}</span>
            </div>

            <div className="center-info-row">
              <span className="label">Âm lịch:</span>
              <span className="value">{inputData?.lunarDay}/{inputData?.lunarMonth}/{inputData?.lunarYear}</span>
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
              <span className="label">Mệnh:</span>
              <span className="value menh-highlight">{menhCung}</span>
              <span className="label">Thân:</span>
              <span className="value than-highlight">{thanCung}</span>
            </div>

            <div className="center-info-row">
              <span className="label">Chủ Mệnh:</span>
              <span className="value">{chuMenh}</span>
            </div>
            <div className="center-info-row">
              <span className="label">Chủ Thân:</span>
              <span className="value">{chuThan}</span>
            </div>

            <div className="center-divider" />

            <div className="center-info-row">
              <span className="center-badge badge-tuan">Tuần: {tuanCung.join(', ')}</span>
              <span className="center-badge badge-triet">Triệt: {trietCung.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
