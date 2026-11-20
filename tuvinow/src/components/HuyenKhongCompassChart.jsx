import React from 'react';
import { SON_24, ELEMENT_CLASS_MAP } from '../utils/huyenKhongEngine.js';

const SVG_SIZE = 760;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const R_OUTER = 374;
const R_TICK_INNER = 346;
const R_SON_OUTER = 340;
const R_SON_INNER = 278;
const R_SON_LABEL = 309;
const R_DEG_LABEL = 353;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx, cy, r, svgDeg) {
  const rad = degToRad(svgDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function createSectorPath(cx, cy, rInner, rOuter, startSvgDeg, endSvgDeg) {
  const p1 = polarToCartesian(cx, cy, rOuter, startSvgDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endSvgDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endSvgDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startSvgDeg);
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 0 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function getUprightTextRotation(svgDeg) {
  const norm = ((svgDeg % 360) + 360) % 360;
  let rot = (norm + 90) % 360;
  if (rot > 90 && rot < 270) {
    rot -= 180;
  }
  return rot;
}

function getStarToneClass(star, van) {
  if (star === van) return 'is-vuong';
  if (star === (van % 9) + 1) return 'is-sinh';
  if (star === 5 || star === 2) return 'is-hung-star';
  return 'is-neutral';
}

function renderTicks(rotationDelta) {
  const ticks = [];
  for (let d = 0; d < 360; d += 5) {
    const isMajorCenter = d % 15 === 0;
    const isMedium = !isMajorCenter && d % 5 === 0;
    const svgDeg = d + 90 + rotationDelta;
    const rOuter = R_OUTER;
    const rInner = isMajorCenter ? R_TICK_INNER + 4 : isMedium ? R_TICK_INNER + 12 : R_TICK_INNER + 16;
    const p1 = polarToCartesian(CX, CY, rOuter, svgDeg);
    const p2 = polarToCartesian(CX, CY, rInner, svgDeg);
    ticks.push(
      <line
        key={`t-${d}`}
        x1={p1.x.toFixed(2)}
        y1={p1.y.toFixed(2)}
        x2={p2.x.toFixed(2)}
        y2={p2.y.toFixed(2)}
        className={isMajorCenter ? 'hk-tick-major' : 'hk-tick-minor'}
      />
    );
  }
  // Trigram boundary ticks (22.5, 67.5, ... every 45 deg)
  for (let b = 22.5; b < 360; b += 45) {
    const svgDeg = b + 90 + rotationDelta;
    const p1 = polarToCartesian(CX, CY, R_OUTER, svgDeg);
    const p2 = polarToCartesian(CX, CY, R_SON_INNER - 4, svgDeg);
    ticks.push(
      <line
        key={`b-${b}`}
        x1={p1.x.toFixed(2)}
        y1={p1.y.toFixed(2)}
        x2={p2.x.toFixed(2)}
        y2={p2.y.toFixed(2)}
        className="hk-trigram-divider"
      />
    );
  }
  return ticks;
}

function PalaceGrid({ chart, selectedCung, onSelectCung }) {
  const { grid, van, includeAnnual, includeMonthly } = chart;

  return (
    <div className="hk-grid" role="group" aria-label="Ma trận Cửu cung 3 nhân 3">
      {grid.flat().map((cell) => {
        const isSelected = selectedCung === cell.cung;
        const pairTone = cell.rating || 'binh';
        const elemClass = ELEMENT_CLASS_MAP[cell.element] || 'tho';

        // Prioritize concise tags so grid cells never clip or clutter
        const badges = [];
        if (cell.pair?.shortTag) {
          badges.push({
            id: `pair-${cell.cung}`,
            label: cell.pair.shortTag,
            tone: pairTone,
          });
        }
        for (const st of cell.specialTags.slice(0, 2)) {
          badges.push({
            id: `${st.type}-${cell.cung}`,
            label: st.label,
            tone: st.tone,
          });
        }
        for (const aff of cell.afflictions.slice(0, 2)) {
          badges.push({
            id: `${aff.type}-${aff.shortLabel}-${cell.cung}`,
            label: aff.shortLabel,
            tone: aff.severity === 'hung' ? 'hung' : 'warn',
          });
        }

        const visibleBadges = badges.slice(0, 3);
        const hiddenCount = Math.max(0, badges.length - visibleBadges.length);

        const roleTag = cell.isHuongPalace
          ? 'HƯỚNG'
          : cell.isToaPalace
            ? 'TỌA'
            : null;

        const ariaParts = [
          `Cung ${cell.name} (${cell.trigram})`,
          roleTag ? `Phương ${roleTag}` : null,
          `Sơn tinh ${cell.sonStar}, Vận tinh ${cell.vanStar}, Hướng tinh ${cell.huongStar}`,
          cell.pair?.title || '',
        ].filter(Boolean);

        return (
          <button
            key={cell.cung}
            type="button"
            className={[
              'hk-cell',
              `hk-elem-${elemClass}`,
              cell.isTrung ? 'is-trung' : '',
              cell.isHuongPalace ? 'is-huong' : '',
              cell.isToaPalace ? 'is-toa' : '',
              isSelected ? 'is-selected' : '',
            ].filter(Boolean).join(' ')}
            aria-pressed={isSelected}
            aria-label={ariaParts.join(' · ')}
            onClick={() => onSelectCung(cell.cung)}
          >
            <div className="hk-cell-top">
              <span
                className={`hk-star-corner hk-star-son ${getStarToneClass(cell.sonStar, van)}`}
                title={`Sơn tinh ${cell.sonStar} (${cell.sonStarInfo.name})`}
              >
                {cell.sonStar}
              </span>

              {roleTag ? (
                <span className={`hk-role-pill ${cell.isHuongPalace ? 'is-huong' : 'is-toa'}`}>
                  {roleTag}
                </span>
              ) : (
                <span className="hk-cell-cung-num" aria-hidden="true">
                  {cell.trigram}
                </span>
              )}

              <span
                className={`hk-star-corner hk-star-huong ${getStarToneClass(cell.huongStar, van)}`}
                title={`Hướng tinh ${cell.huongStar} (${cell.huongStarInfo.name})`}
              >
                {cell.huongStar}
              </span>
            </div>

            <div className="hk-cell-center">
              <span
                className={`hk-star-van ${cell.vanStar === van ? 'is-vuong' : ''}`}
                title={`Vận tinh ${cell.vanStar} (${cell.vanStarInfo.name})`}
              >
                {cell.vanStar}
              </span>
              <span className="hk-cell-dir-name">{cell.name}</span>

              {(includeAnnual || includeMonthly) && (
                <div className="hk-temporal-row">
                  {includeAnnual && cell.annualStar !== null && (
                    <span
                      className={`hk-temp-pill ${cell.annualStar === 5 || cell.annualStar === 2 ? 'is-alert' : ''}`}
                      title={`Lưu niên năm ${chart.annual.year}: sao ${cell.annualStar} (${cell.annualStarInfo?.shortName})`}
                    >
                      LN {cell.annualStar}
                    </span>
                  )}
                  {includeMonthly && cell.monthlyStar !== null && (
                    <span
                      className={`hk-temp-pill is-month ${cell.monthlyStar === 5 || cell.monthlyStar === 2 ? 'is-alert' : ''}`}
                      title={`Lưu nguyệt tháng ${chart.monthly.lunarMonth}: sao ${cell.monthlyStar} (${cell.monthlyStarInfo?.shortName})`}
                    >
                      LT {cell.monthlyStar}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="hk-cell-tags">
              {visibleBadges.map((b) => (
                <span key={b.id} className={`hk-mini-tag tone-${b.tone}`}>
                  {b.label}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="hk-mini-tag tone-more">+{hiddenCount}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tinh bàn Cửu cung kết hợp Vòng la bàn 24 Sơn SVG tương tác.
 */
export default function HuyenKhongCompassChart({
  chart,
  selectedCung,
  onSelectCung,
  onSelectDegree,
  orientationMode = 'standard',
  forceUnified = false,
}) {
  if (!chart || !chart.directionInfo) return null;

  const { directionInfo } = chart;
  const { huong, toa, degree } = directionInfo;
  const rotationDelta = orientationMode === 'facing_top' ? 180 - degree : 0;

  // Needle points on outer scale for exact degree
  const huongSvgDeg = degree + 90 + rotationDelta;
  const toaSvgDeg = degree + 270 + rotationDelta;
  const huongTip = polarToCartesian(CX, CY, R_OUTER - 1, huongSvgDeg);
  const huongBase1 = polarToCartesian(CX, CY, R_OUTER - 10, huongSvgDeg - 1.9);
  const huongBase2 = polarToCartesian(CX, CY, R_OUTER - 10, huongSvgDeg + 1.9);
  const toaMarker = polarToCartesian(CX, CY, R_OUTER - 5, toaSvgDeg);

  return (
    <div className={`hk-compass-stage ${forceUnified ? 'is-force-unified' : ''}`}>
      <div className="hk-compass-composite">
        <svg
          className="hk-compass-svg"
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          role="img"
          aria-label={`La bàn 24 Sơn Huyền Không: Hướng ${huong.ten} ${degree} độ, Tọa ${toa.ten}`}
        >
          {/* Outer rings */}
          <circle cx={CX} cy={CY} r={R_OUTER} className="hk-ring-outer" />
          <circle cx={CX} cy={CY} r={R_SON_OUTER} className="hk-ring-divider" />
          <circle cx={CX} cy={CY} r={R_SON_INNER} className="hk-ring-inner" />

          {/* Degree ticks */}
          <g aria-hidden="true">{renderTicks(rotationDelta)}</g>

          {/* 24 Mountain wedges */}
          <g>
            {SON_24.map((m) => {
              const startSvg = m.centerDeg - 7.5 + 90 + rotationDelta;
              const endSvg = m.centerDeg + 7.5 + 90 + rotationDelta;
              const centerSvg = m.centerDeg + 90 + rotationDelta;
              const isHuong = m.index === huong.index;
              const isToa = m.index === toa.index;
              const trigramGroupAlt = Math.floor(((m.index + 1) % 24) / 3) % 2 === 1;

              const labelPos = polarToCartesian(CX, CY, R_SON_LABEL, centerSvg);
              const nlPos = polarToCartesian(CX, CY, R_SON_INNER + 11, centerSvg);
              const degPos = polarToCartesian(CX, CY, R_DEG_LABEL, centerSvg);
              const textRot = getUprightTextRotation(centerSvg);

              const wedgeClass = [
                'hk-son-wedge',
                trigramGroupAlt ? 'is-alt' : '',
                isHuong ? 'is-huong' : '',
                isToa ? 'is-toa' : '',
                onSelectDegree ? 'is-clickable' : '',
              ].filter(Boolean).join(' ');

              return (
                <g
                  key={m.ten}
                  className={wedgeClass}
                  onClick={onSelectDegree ? () => onSelectDegree(m.centerDeg) : undefined}
                >
                  <title>{`${m.ten} (${m.centerDeg}° · Cung ${m.directionName}/${m.trigram} · ${m.nguyenLong} Nguyên Long · ${m.polarityLabel})`}</title>
                  <path d={createSectorPath(CX, CY, R_SON_INNER, R_SON_OUTER, startSvg, endSvg)} />
                  <text
                    x={labelPos.x.toFixed(2)}
                    y={labelPos.y.toFixed(2)}
                    transform={`rotate(${textRot.toFixed(2)} ${labelPos.x.toFixed(2)} ${labelPos.y.toFixed(2)})`}
                    className={`hk-son-text ${isHuong || isToa ? 'is-active' : ''}`}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {m.ten}
                  </text>
                  <text
                    x={nlPos.x.toFixed(2)}
                    y={nlPos.y.toFixed(2)}
                    transform={`rotate(${textRot.toFixed(2)} ${nlPos.x.toFixed(2)} ${nlPos.y.toFixed(2)})`}
                    className={`hk-nl-text ${isHuong || isToa ? 'is-active' : ''}`}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {m.nguyenLong[0]}
                  </text>
                  <text
                    x={degPos.x.toFixed(2)}
                    y={degPos.y.toFixed(2)}
                    transform={`rotate(${textRot.toFixed(2)} ${degPos.x.toFixed(2)} ${degPos.y.toFixed(2)})`}
                    className={`hk-deg-text ${isHuong ? 'is-huong-deg' : isToa ? 'is-toa-deg' : ''}`}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {m.centerDeg}°
                  </text>
                </g>
              );
            })}
          </g>

          {/* Exact degree pointer (Hướng arrow + Tọa dot) */}
          <g aria-hidden="true">
            <polygon
              points={`${huongTip.x.toFixed(2)},${huongTip.y.toFixed(2)} ${huongBase1.x.toFixed(2)},${huongBase1.y.toFixed(2)} ${huongBase2.x.toFixed(2)},${huongBase2.y.toFixed(2)}`}
              className="hk-pointer-huong"
            />
            <circle
              cx={toaMarker.x.toFixed(2)}
              cy={toaMarker.y.toFixed(2)}
              r="5.5"
              className="hk-pointer-toa"
            />
          </g>
        </svg>

        <div className="hk-grid-overlay">
          <PalaceGrid
            chart={chart}
            selectedCung={selectedCung}
            onSelectCung={onSelectCung}
          />
        </div>
      </div>

      {!forceUnified && (
        <div className="hk-mobile-grid-wrap">
          <PalaceGrid
            chart={chart}
            selectedCung={selectedCung}
            onSelectCung={onSelectCung}
          />
        </div>
      )}
    </div>
  );
}
