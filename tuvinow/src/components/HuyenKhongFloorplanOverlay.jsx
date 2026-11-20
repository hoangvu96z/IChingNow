import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { SON_24, OCTAGON_PALACE_RING, normalizeDegree } from '../utils/huyenKhongEngine.js';

const OVERLAY_SIZE = 700;
const OCX = OVERLAY_SIZE / 2;
const OCY = OVERLAY_SIZE / 2;

const PALACE_SECTOR_ANGLES = {
  1: 0,
  8: 45,
  3: 90,
  4: 135,
  9: 180,
  2: 225,
  7: 270,
  6: 315,
};

function polarPt(cx, cy, r, svgDeg) {
  const rad = (svgDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function sectorPath(cx, cy, rInner, rOuter, startSvgDeg, endSvgDeg) {
  const p1 = polarPt(cx, cy, rOuter, startSvgDeg);
  const p2 = polarPt(cx, cy, rOuter, endSvgDeg);
  const p3 = polarPt(cx, cy, rInner, endSvgDeg);
  const p4 = polarPt(cx, cy, rInner, startSvgDeg);
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 0 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function uprightRot(svgDeg) {
  const norm = ((svgDeg % 360) + 360) % 360;
  let rot = (norm + 90) % 360;
  if (rot > 90 && rot < 270) rot -= 180;
  return rot;
}

/**
 * Công cụ áp lớp Tinh bàn lên ảnh mặt bằng nhà (xử lý hoàn toàn cục bộ trên trình duyệt).
 */
export default function HuyenKhongFloorplanOverlay({ chart }) {
  const fileInputId = useId();
  const northInputId = useId();
  const scaleInputId = useId();
  const opacityInputId = useId();

  const [imageUrl, setImageUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState({ name: '', width: 0, height: 0 });
  const [overlayMode, setOverlayMode] = useState('compact'); // 'compact' | 'full'
  const [northAngle, setNorthAngle] = useState(() => {
    const deg = chart?.directionInfo?.degree ?? 90;
    return Math.round(normalizeDegree(360 - deg) * 10) / 10;
  });
  const [centerPos, setCenterPos] = useState({ xPct: 50, yPct: 50 });
  const [scalePct, setScalePct] = useState(88);
  const [opacityPct, setOpacityPct] = useState(84);
  const [useBacking, setUseBacking] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const stageRef = useRef(null);
  const overlaySvgRef = useRef(null);
  const dragActiveRef = useRef(false);
  const objectUrlRef = useRef(null);

  const loadImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatusMsg('Vui lòng chọn tệp ảnh hợp lệ (JPG, PNG hoặc WebP).');
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = nextUrl;
      setImageUrl(nextUrl);
      setImageMeta({
        name: file.name || 'mat-bang.png',
        width: img.naturalWidth || 1200,
        height: img.naturalHeight || 900,
      });
      setCenterPos({ xPct: 50, yPct: 50 });
      setStatusMsg(`Đã nạp ảnh "${file.name || 'mặt bằng'}" (chỉ hiển thị cục bộ trên máy).`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      setStatusMsg('Không đọc được tệp ảnh này.');
    };
    img.src = nextUrl;
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    if (!navigator.clipboard?.read) {
      setStatusMsg('Trình duyệt không hỗ trợ đọc ảnh trực tiếp từ clipboard — hãy dùng Ctrl/Cmd+V hoặc chọn file.');
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          loadImageFile(new File([blob], 'clipboard-floorplan.png', { type: imgType }));
          return;
        }
      }
      setStatusMsg('Không tìm thấy ảnh trong clipboard.');
    } catch {
      setStatusMsg('Chưa được cấp quyền đọc clipboard — hãy kéo thả ảnh hoặc bấm chọn file.');
    }
  }, [loadImageFile]);

  const handleContainerPaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          loadImageFile(file);
          break;
        }
      }
    }
  }, [loadImageFile]);

  const updateCenterFromPointer = useCallback((clientX, clientY) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const xPct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    setCenterPos({
      xPct: Math.round(xPct * 10) / 10,
      yPct: Math.round(yPct * 10) / 10,
    });
  }, []);

  const handlePointerDown = (e) => {
    if (!imageUrl) return;
    dragActiveRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateCenterFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!dragActiveRef.current) return;
    updateCenterFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    dragActiveRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleExportFloorplanPng = useCallback(async () => {
    if (!imageUrl || !overlaySvgRef.current || isExporting) return;
    setIsExporting(true);
    setStatusMsg('Đang xuất ảnh mặt bằng đã áp Tinh bàn...');
    try {
      const bgImg = new Image();
      bgImg.src = imageUrl;
      await new Promise((resolve, reject) => {
        if (bgImg.complete) resolve();
        else {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
        }
      });

      const canvas = document.createElement('canvas');
      const w = bgImg.naturalWidth || 1200;
      const h = bgImg.naturalHeight || 900;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bgImg, 0, 0, w, h);

      const svgClone = overlaySvgRef.current.cloneNode(true);
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const svgStr = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      try {
        const svgImg = new Image();
        svgImg.src = svgUrl;
        await new Promise((resolve, reject) => {
          svgImg.onload = resolve;
          svgImg.onerror = reject;
        });

        const baseDim = Math.min(w, h);
        const drawSize = baseDim * (scalePct / 100);
        const cx = w * (centerPos.xPct / 100);
        const cy = h * (centerPos.yPct / 100);

        ctx.save();
        ctx.globalAlpha = opacityPct / 100;
        ctx.drawImage(svgImg, cx - drawSize / 2, cy - drawSize / 2, drawSize, drawSize);
        ctx.restore();
      } finally {
        URL.revokeObjectURL(svgUrl);
      }

      const outUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tinh-ban-mat-bang-van-${chart?.van || 9}.png`;
      link.href = outUrl;
      link.click();
      setStatusMsg('Đã tải ảnh mặt bằng đã áp Tinh bàn.');
    } catch (err) {
      console.error('Floorplan PNG export error:', err);
      setStatusMsg('Không thể xuất ảnh mặt bằng. Hãy thử ảnh JPG/PNG kích thước vừa phải.');
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, isExporting, scalePct, centerPos, opacityPct, chart?.van]);

  if (!chart || !chart.directionInfo) return null;

  const { huong, toa, degree } = chart.directionInfo;
  // On floorplans looking top-down: compass 0° North points UP (-90° SVG) when northAngle=0
  const mapSvgDeg = (compassDeg) => compassDeg - 90 + northAngle;

  return (
    <section
      className="hk-card hk-floorplan-section"
      aria-labelledby="hk-floorplan-heading"
      onPaste={handleContainerPaste}
    >
      <div className="hk-section-head">
        <div className="hk-section-title-row">
          <span className="hk-step-badge" aria-hidden="true">4</span>
          <div>
            <h2 id="hk-floorplan-heading">Áp Tinh bàn lên Mặt bằng nhà (Tùy chọn)</h2>
            <p className="hk-section-sub">
              Nạp ảnh mặt bằng kiến trúc (JPG/PNG) để áp lớp Tinh bàn Rút gọn (24 Sơn) hoặc Đầy đủ (8 phương vị Cửu cung).
              Mặc định khớp theo hướng đã nhập — xử lý hoàn toàn cục bộ trên máy, không gửi ảnh lên máy chủ.
            </p>
          </div>
        </div>
      </div>

      <div className="hk-floorplan-toolbar">
        <div className="hk-file-actions">
          <label htmlFor={fileInputId} className="hk-btn hk-btn-primary">
            <span aria-hidden="true">📐</span> Chọn ảnh mặt bằng…
          </label>
          <input
            id={fileInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hk-sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadImageFile(file);
              e.target.value = '';
            }}
          />
          <button type="button" className="hk-btn hk-btn-secondary" onClick={handlePasteFromClipboard}>
            <span aria-hidden="true">📋</span> Dán ảnh
          </button>
          {imageUrl && (
            <>
              <button
                type="button"
                className="hk-btn hk-btn-secondary"
                onClick={handleExportFloorplanPng}
                disabled={isExporting}
              >
                <span aria-hidden="true">🖼</span> {isExporting ? 'Đang xuất…' : 'Xuất ảnh đã áp'}
              </button>
              <button
                type="button"
                className="hk-btn hk-btn-ghost"
                onClick={() => {
                  if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                  objectUrlRef.current = null;
                  setImageUrl(null);
                  setImageMeta({ name: '', width: 0, height: 0 });
                  setStatusMsg('Đã gỡ ảnh mặt bằng.');
                }}
              >
                Xóa ảnh
              </button>
            </>
          )}
        </div>

        <div className="hk-overlay-mode-group" role="group" aria-label="Chế độ lớp phủ Tinh bàn">
          <button
            type="button"
            className={`hk-chip-btn ${overlayMode === 'compact' ? 'is-active' : ''}`}
            aria-pressed={overlayMode === 'compact'}
            onClick={() => setOverlayMode('compact')}
          >
            Rút gọn (24 Sơn)
          </button>
          <button
            type="button"
            className={`hk-chip-btn ${overlayMode === 'full' ? 'is-active' : ''}`}
            aria-pressed={overlayMode === 'full'}
            onClick={() => setOverlayMode('full')}
          >
            Đầy đủ (8 Cung sao)
          </button>
        </div>
      </div>

      {statusMsg && (
        <p className="hk-status-msg" role="status" aria-live="polite">
          {statusMsg}
        </p>
      )}

      {!imageUrl ? (
        <div
          className="hk-floorplan-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer?.files?.[0];
            if (file) loadImageFile(file);
          }}
        >
          <span className="hk-drop-icon" aria-hidden="true">🏠</span>
          <p className="hk-drop-title">Kéo thả ảnh mặt bằng vào đây, dán từ clipboard (Ctrl/Cmd+V), hoặc bấm &ldquo;Chọn ảnh mặt bằng…&rdquo;</p>
          <p className="hk-drop-note">Hỗ trợ JPG, PNG, WebP. Ảnh chỉ lưu tạm trong bộ nhớ trình duyệt của bạn.</p>
        </div>
      ) : (
        <div className="hk-floorplan-workspace">
          <div className="hk-floorplan-controls">
            <div className="hk-control-row">
              <label htmlFor={northInputId}>
                Góc Bắc bản vẽ: <strong>{northAngle}°</strong>
              </label>
              <input
                id={northInputId}
                type="range"
                min="0"
                max="359"
                step="0.5"
                value={northAngle}
                onChange={(e) => setNorthAngle(Number(e.target.value))}
              />
              <div className="hk-mini-btn-row">
                <button
                  type="button"
                  className="hk-btn hk-btn-xs"
                  onClick={() => setNorthAngle(0)}
                >
                  Bắc hướng lên (0°)
                </button>
                <button
                  type="button"
                  className="hk-btn hk-btn-xs"
                  onClick={() => setNorthAngle(Math.round(normalizeDegree(360 - degree) * 10) / 10)}
                >
                  Hướng {huong.ten} lên trên
                </button>
                <button
                  type="button"
                  className="hk-btn hk-btn-xs"
                  onClick={() => setNorthAngle((prev) => normalizeDegree(prev + 90))}
                >
                  Xoay +90°
                </button>
              </div>
            </div>

            <div className="hk-control-row">
              <label htmlFor={scaleInputId}>
                Kích thước vòng la bàn: <strong>{scalePct}%</strong>
              </label>
              <input
                id={scaleInputId}
                type="range"
                min="40"
                max="150"
                value={scalePct}
                onChange={(e) => setScalePct(Number(e.target.value))}
              />
            </div>

            <div className="hk-control-row">
              <label htmlFor={opacityInputId}>
                Độ đậm lớp phủ: <strong>{opacityPct}%</strong>
              </label>
              <input
                id={opacityInputId}
                type="range"
                min="25"
                max="100"
                value={opacityPct}
                onChange={(e) => setOpacityPct(Number(e.target.value))}
              />
            </div>

            <div className="hk-control-inline">
              <label className="hk-checkbox-label">
                <input
                  type="checkbox"
                  checked={useBacking}
                  onChange={(e) => setUseBacking(e.target.checked)}
                />
                <span>Nền mờ sau chữ &amp; số sao cho dễ đọc</span>
              </label>
              <button
                type="button"
                className="hk-btn hk-btn-xs"
                onClick={() => setCenterPos({ xPct: 50, yPct: 50 })}
              >
                Đưa tâm về giữa ({centerPos.xPct}%, {centerPos.yPct}%)
              </button>
            </div>
            <p className="hk-hint-text">
              Mẹo: Nhấp hoặc kéo trực tiếp trên ảnh mặt bằng để đặt tâm Thái Cực đúng trọng tâm ngôi nhà.
              {imageMeta.name ? ` (${imageMeta.name} · ${imageMeta.width}×${imageMeta.height}px)` : ''}
            </p>
          </div>

          <div
            ref={stageRef}
            className="hk-floorplan-stage"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img
              src={imageUrl}
              alt="Ảnh mặt bằng nhà để áp lớp Tinh bàn"
              className="hk-floorplan-img"
              draggable={false}
            />

            <svg
              ref={overlaySvgRef}
              className="hk-floorplan-svg"
              viewBox={`0 0 ${OVERLAY_SIZE} ${OVERLAY_SIZE}`}
              style={{
                left: `${centerPos.xPct}%`,
                top: `${centerPos.yPct}%`,
                width:
                  imageMeta.width > imageMeta.height && imageMeta.width > 0
                    ? `${((scalePct * imageMeta.height) / imageMeta.width).toFixed(2)}%`
                    : `${scalePct}%`,
                opacity: opacityPct / 100,
              }}
              aria-hidden="true"
            >
              {/* Subtle translucent backing disc when toggled */}
              {useBacking && (
                <circle
                  cx={OCX}
                  cy={OCY}
                  r={324}
                  fill="rgba(255, 255, 255, 0.24)"
                  stroke="rgba(180, 83, 9, 0.7)"
                  strokeWidth="2"
                />
              )}

              {/* 8 Palace radial dividers */}
              {OCTAGON_PALACE_RING.map((cung) => {
                const startCompass = PALACE_SECTOR_ANGLES[cung] - 22.5;
                const svgDeg = mapSvgDeg(startCompass);
                const p1 = polarPt(OCX, OCY, 60, svgDeg);
                const p2 = polarPt(OCX, OCY, 322, svgDeg);
                return (
                  <line
                    key={`div-${cung}`}
                    x1={p1.x.toFixed(1)}
                    y1={p1.y.toFixed(1)}
                    x2={p2.x.toFixed(1)}
                    y2={p2.y.toFixed(1)}
                    stroke="rgba(180, 83, 9, 0.75)"
                    strokeWidth="1.5"
                    strokeDasharray={overlayMode === 'compact' ? '5 4' : undefined}
                  />
                );
              })}

              {/* 24 Mountain wedges */}
              {SON_24.map((m) => {
                const startSvg = mapSvgDeg(m.centerDeg - 7.5);
                const endSvg = mapSvgDeg(m.centerDeg + 7.5);
                const midSvg = mapSvgDeg(m.centerDeg);
                const isH = m.index === huong.index;
                const isT = m.index === toa.index;
                const fill = isH
                  ? 'rgba(29, 78, 216, 0.88)'
                  : isT
                    ? 'rgba(153, 27, 27, 0.88)'
                    : useBacking
                      ? 'rgba(255, 255, 255, 0.86)'
                      : 'rgba(255, 255, 255, 0.56)';
                const txtColor = isH || isT ? '#ffffff' : '#111827';
                const labelPos = polarPt(OCX, OCY, 294, midSvg);
                const degPos = polarPt(OCX, OCY, 332, midSvg);
                const rot = uprightRot(midSvg);

                return (
                  <g key={`ov-${m.ten}`}>
                    <path
                      d={sectorPath(OCX, OCY, 266, 318, startSvg, endSvg)}
                      fill={fill}
                      stroke="#92400e"
                      strokeWidth="1"
                    />
                    <text
                      x={labelPos.x.toFixed(1)}
                      y={labelPos.y.toFixed(1)}
                      transform={`rotate(${rot.toFixed(1)} ${labelPos.x.toFixed(1)} ${labelPos.y.toFixed(1)})`}
                      fill={txtColor}
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {m.ten}
                    </text>
                    <text
                      x={degPos.x.toFixed(1)}
                      y={degPos.y.toFixed(1)}
                      transform={`rotate(${rot.toFixed(1)} ${degPos.x.toFixed(1)} ${degPos.y.toFixed(1)})`}
                      fill={isH ? '#1d4ed8' : isT ? '#991b1b' : '#1f2937'}
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {m.centerDeg}°
                    </text>
                  </g>
                );
              })}

              {/* Hướng-Tọa axis line */}
              {(() => {
                const pH = polarPt(OCX, OCY, 266, mapSvgDeg(degree));
                const pT = polarPt(OCX, OCY, 266, mapSvgDeg(degree + 180));
                return (
                  <line
                    x1={pT.x.toFixed(1)}
                    y1={pT.y.toFixed(1)}
                    x2={pH.x.toFixed(1)}
                    y2={pH.y.toFixed(1)}
                    stroke="#1d4ed8"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                );
              })()}

              {/* Full mode: 8 Palace Stars + Center */}
              {overlayMode === 'full' && (
                <>
                  {OCTAGON_PALACE_RING.map((cung) => {
                    const p = chart.palacesByCung[cung];
                    const midSvg = mapSvgDeg(PALACE_SECTOR_ANGLES[cung]);
                    const pos = polarPt(OCX, OCY, 180, midSvg);
                    return (
                      <g key={`sec-${cung}`} transform={`translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`}>
                        <rect
                          x="-49"
                          y="-27"
                          width="98"
                          height="54"
                          rx="10"
                          fill={p.isHuongPalace ? 'rgba(219, 234, 254, 0.94)' : p.isToaPalace ? 'rgba(254, 226, 226, 0.94)' : 'rgba(255, 255, 255, 0.92)'}
                          stroke={p.isHuongPalace ? '#1d4ed8' : p.isToaPalace ? '#991b1b' : '#b45309'}
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="-12"
                          fill="#111827"
                          fontSize="10.5"
                          fontWeight="700"
                          fontFamily="Inter, sans-serif"
                          textAnchor="middle"
                        >
                          {p.name}{p.isHuongPalace ? ' (H)' : p.isToaPalace ? ' (T)' : ''}
                        </text>
                        <text
                          x="0"
                          y="7"
                          fill="#111827"
                          fontSize="15"
                          fontWeight="800"
                          fontFamily="Inter, sans-serif"
                          textAnchor="middle"
                        >
                          {`${p.sonStar} · ${p.vanStar} · ${p.huongStar}`}
                        </text>
                        <text
                          x="0"
                          y="20"
                          fill={p.rating === 'cat' ? '#166534' : p.rating === 'hung' ? '#991b1b' : '#92400e'}
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="Inter, sans-serif"
                          textAnchor="middle"
                        >
                          {p.pair?.shortTag || ''}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Center Thái Cực & Center Palace */}
              <circle cx={OCX} cy={OCY} r={overlayMode === 'full' ? 56 : 20} fill="rgba(255, 251, 235, 0.92)" stroke="#92400e" strokeWidth="2" />
              <line x1={OCX - 14} y1={OCY} x2={OCX + 14} y2={OCY} stroke="#b91c1c" strokeWidth="2" />
              <line x1={OCX} y1={OCY - 14} x2={OCX} y2={OCY + 14} stroke="#b91c1c" strokeWidth="2" />
              {overlayMode === 'full' && (
                <>
                  <text
                    x={OCX}
                    y={OCY - 22}
                    fill="#92400e"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    textAnchor="middle"
                  >
                    Trung Cung
                  </text>
                  <text
                    x={OCX}
                    y={OCY + 28}
                    fill="#111827"
                    fontSize="13.5"
                    fontWeight="800"
                    fontFamily="Inter, sans-serif"
                    textAnchor="middle"
                  >
                    {`${chart.palacesByCung[5].sonStar} · ${chart.palacesByCung[5].vanStar} · ${chart.palacesByCung[5].huongStar}`}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      )}
    </section>
  );
}
