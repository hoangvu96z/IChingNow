import React, { useState, useMemo, useCallback } from 'react';
import TuViSelfGuidePanel from './TuViSelfGuidePanel.jsx';
import TuViLocalReport from './TuViLocalReport.jsx';
import SummaryPanel from './SummaryPanel.jsx';
import TuViPatternsPanel from './TuViPatternsPanel.jsx';
import TuViTimelineAndDailyPanel from './TuViTimelineAndDailyPanel.jsx';
import SaveToNoteNowButton from '../../../shared/src/components/SaveToNoteNowButton.jsx';
import { buildChartStarEvaluation } from '../utils/tuViStarRating.js';
import { buildTuViNoteNowPayload } from '../utils/tuviTimelineModel.js';

function RadarChart({ aspects = [], natalAspects = null, isDynamic = false }) {
  const size = 340;
  const cx = 170;
  const cy = 170;
  const maxR = 90;

  const count = aspects.length || 6;
  const angleStep = (2 * Math.PI) / count;

  // Concentric rings at 2.0, 3.0, 4.0, 5.0
  const ringLevels = [2.0, 3.0, 4.0, 5.0];
  const ringPolygons = ringLevels.map((lvl) => {
    const r = (lvl / 5.0) * maxR;
    const points = aspects
      .map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return { lvl, points };
  });

  // Axis lines and labels
  const axes = aspects.map((a, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = cx + maxR * Math.cos(angle);
    const y = cy + maxR * Math.sin(angle);
    const labelR = maxR + 24;
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);

    let textAnchor = 'middle';
    if (Math.cos(angle) > 0.3) textAnchor = 'start';
    else if (Math.cos(angle) < -0.3) textAnchor = 'end';

    let dy = '0.35em';
    if (Math.sin(angle) > 0.5) dy = '0.9em';
    else if (Math.sin(angle) < -0.5) dy = '-0.3em';

    return {
      id: a.id,
      label: a.shortName,
      stars: a.stars,
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      lx,
      ly,
      textAnchor,
      dy,
    };
  });

  // Natal baseline polygon points (when viewing Đại Hạn / Lưu Niên / Lưu Nguyệt)
  const natalPointsStr =
    isDynamic && Array.isArray(natalAspects) && natalAspects.length === aspects.length
      ? natalAspects
          .map((a, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const r = (Math.max(1, Math.min(5, a.stars)) / 5.0) * maxR;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  // Data polygon points
  const dataPoints = aspects.map((a, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (Math.max(1, Math.min(5, a.stars)) / 5.0) * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
  });
  const dataPointsStr = dataPoints.map((p) => p.str).join(' ');

  return (
    <div className="tuvi-radar-chart-container">
      <svg
        className="tuvi-radar-svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Biểu đồ lục giác 6 phương diện cuộc đời"
      >
        <defs>
          <linearGradient id="tuviRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.35" />
          </linearGradient>
          <filter id="tuviRadarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric rings */}
        {ringPolygons.map(({ lvl, points }) => (
          <polygon key={lvl} points={points} className="tuvi-radar-ring" />
        ))}

        {/* Ring level markers */}
        {ringLevels.map((lvl) => {
          const r = (lvl / 5.0) * maxR;
          return (
            <text key={lvl} x={cx + 4} y={cy - r + 3} className="tuvi-radar-level-text">
              {lvl}★
            </text>
          );
        })}

        {/* Axes */}
        {axes.map((ax) => (
          <g key={ax.id}>
            <line x1={ax.x1} y1={ax.y1} x2={ax.x2} y2={ax.y2} className="tuvi-radar-axis-line" />
            <text
              x={ax.lx}
              y={ax.ly}
              dy={ax.dy}
              textAnchor={ax.textAnchor}
              className="tuvi-radar-label"
            >
              {ax.label} ({ax.stars}★)
            </text>
          </g>
        ))}

        {/* Natal baseline polygon in dynamic mode */}
        {natalPointsStr && (
          <polygon
            points={natalPointsStr}
            className="tuvi-radar-natal-polygon"
          />
        )}

        {/* Data polygon */}
        <polygon
          points={dataPointsStr}
          className="tuvi-radar-data-polygon"
          fill="url(#tuviRadarGrad)"
          filter="url(#tuviRadarGlow)"
        />

        {/* Data points */}
        {dataPoints.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={4.5} className="tuvi-radar-dot" />
        ))}
      </svg>

      {isDynamic && (
        <div className="tuvi-radar-legend" aria-label="Chú giải biểu đồ lục giác">
          <span className="tuvi-radar-legend-item is-active-period">● Kỳ vận hạn đang chọn</span>
          <span className="tuvi-radar-legend-item is-natal-base">┈ Nền tảng Bản Mệnh gốc</span>
        </div>
      )}
    </div>
  );
}

export default function TuViOverviewDashboard({
  result,
  inputData,
  yunxianState,
  onYunxianChange,
  lifeEvents = [],
  onUpsertLifeEvent,
  onDeleteLifeEvent,
  isAuthenticated = false,
  initialTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [show12Palaces, setShow12Palaces] = useState(true);

  const evaluation = useMemo(() => {
    return buildChartStarEvaluation(result, inputData, yunxianState);
  }, [result, inputData, yunxianState]);

  const buildNotePayload = useCallback(
    () =>
      buildTuViNoteNowPayload({
        result,
        inputData,
        yunxianState,
        lifeEvents,
      }),
    [result, inputData, yunxianState, lifeEvents],
  );

  if (!result || !evaluation) {
    return null;
  }

  const { overall, aspects, natalAspects, palaceRatings, activeYunxian, quickTags } = evaluation;

  return (
    <section className="tuvi-overview-hub" aria-label="Trung tâm đánh giá và giải mã lá số">
      {/* ===== 4 TAB NAVIGATION ===== */}
      <div className="tuvi-hub-tabs" role="tablist" aria-label="Chế độ xem lá số">
        <button
          type="button"
          role="tab"
          id="tab-overview"
          aria-selected={activeTab === 'overview'}
          aria-controls="panel-overview"
          className={`tuvi-hub-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tuvi-tab-icon" aria-hidden="true">📊</span>
          <span>Đánh Giá Chung & Biểu Đồ</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-guide"
          aria-selected={activeTab === 'guide'}
          aria-controls="panel-guide"
          className={`tuvi-hub-tab ${activeTab === 'guide' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          <span className="tuvi-tab-icon" aria-hidden="true">🧭</span>
          <span>Hướng Dẫn Tự Xem (6 Bước)</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-report"
          aria-selected={activeTab === 'report'}
          aria-controls="panel-report"
          className={`tuvi-hub-tab ${activeTab === 'report' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <span className="tuvi-tab-icon" aria-hidden="true">📜</span>
          <span>Luận Đoán Tự Động (Chi Tiết)</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-deep"
          aria-selected={activeTab === 'deep'}
          aria-controls="panel-deep"
          className={`tuvi-hub-tab ${activeTab === 'deep' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('deep')}
        >
          <span className="tuvi-tab-icon" aria-hidden="true">✦</span>
          <span>Phân Tích Chuyên Sâu & Cổ Thư</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-timeline"
          aria-selected={activeTab === 'timeline'}
          aria-controls="panel-timeline"
          className={`tuvi-hub-tab ${activeTab === 'timeline' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <span className="tuvi-tab-icon" aria-hidden="true">📅</span>
          <span>Vận Hạn 10 Năm & Lịch Lưu Nhật</span>
        </button>
      </div>

      {/* Thanh hành động nhanh: Lưu NoteNow & Mở Quỹ Đạo 10 Năm / Lịch 30 Ngày */}
      <div className="tuvi-hub-quick-actions">
        <SaveToNoteNowButton
          buildPayload={buildNotePayload}
          isAuthenticated={isAuthenticated}
          compact
        />
        {activeTab !== 'timeline' && (
          <button
            type="button"
            className="tuvi-jump-timeline-btn"
            onClick={() => setActiveTab('timeline')}
          >
            <span aria-hidden="true">📈</span>
            <span>Xem Quỹ đạo 10 năm &amp; Lịch 30 ngày Lưu Nhật →</span>
          </button>
        )}
      </div>

      {/* ===== TAB CONTENT PANELS ===== */}
      {activeTab === 'overview' && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="tuvi-tab-content">
          {/* 1. Thẻ Tổng Điểm & Xếp Hạng Sao Lá Số */}
          <div className="tuvi-rating-hero">
            <div className="tuvi-hero-main-card">
              <div className="tuvi-hero-badge-row">
                <div className="tuvi-hero-header-stack">
                  <span className="tuvi-hero-header-label">📊 Đánh Giá Chung Tổng Thể Lá Số</span>
                  <span className="tuvi-hero-context-pill">
                    {overall.isDynamic ? `⚡ Đang tính theo: ${overall.contextLabel}` : '🏛️ Chế độ: Bản Mệnh Trọn Đời'}
                  </span>
                </div>
                <span className={`tuvi-tier-badge ${overall.badgeClass}`}>
                  {overall.tierLabel}
                </span>
              </div>

              <div className="tuvi-hero-score-row">
                <div className="tuvi-big-score-wrap">
                  <span className="tuvi-big-score">{overall.score}</span>
                  <span className="tuvi-big-score-max">/ 5.0 ⭐</span>
                </div>
                <div className="tuvi-hero-stars-display" aria-label={`${overall.stars} sao`}>
                  <div className="tuvi-stars-symbols">{overall.starsText}</div>
                  <div className="tuvi-stars-subtext">
                    Quy đổi: {overall.score100} / 100 điểm
                    {overall.isDynamic && (
                      <span
                        className={`tuvi-natal-delta-badge ${
                          overall.deltaScore > 0 ? 'is-up' : overall.deltaScore < 0 ? 'is-down' : 'is-flat'
                        }`}
                      >
                        {overall.deltaScore > 0
                          ? `▲ +${overall.deltaScore}★`
                          : overall.deltaScore < 0
                            ? `▼ ${overall.deltaScore}★`
                            : '═ 0.0★'}{' '}
                        so với Bản Mệnh ({overall.natalScore}★)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {quickTags && quickTags.length > 0 && (
                <div className="tuvi-quick-tags" aria-label="Đặc điểm quan trọng của lá số">
                  {quickTags.map((tag, idx) => (
                    <span key={idx} className="tuvi-quick-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2 Ô Tóm Tắt Siêu Ngắn Gọn */}
            <div className="tuvi-hero-insights-grid">
              <div className="tuvi-hero-box tuvi-strength-box">
                <div className="tuvi-hero-box-header">
                  <span className="tuvi-hero-box-icon" aria-hidden="true">🌟</span>
                  <strong>{overall.isDynamic ? `Điểm Mạnh Lớn Nhất (${activeYunxian?.modeLabel || 'Kỳ Hạn'})` : 'Điểm Mạnh Lớn Nhất'}</strong>
                </div>
                <ul className="tuvi-hero-list">
                  {overall.topStrengths.map((str, idx) => (
                    <li key={idx}>
                      <div className="tuvi-strength-item-header">
                        <span className="tuvi-strength-title">{str.icon} {str.name}</span>
                        <span className="tuvi-strength-stars">{str.starsText} ({str.stars}/5)</span>
                      </div>
                      {str.rotatedFocus && (
                        <div className="tuvi-strength-rotated-tag">Trọng điểm: {str.rotatedFocus}</div>
                      )}
                      <p className="tuvi-strength-desc">{str.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tuvi-hero-box tuvi-advice-box">
                <div className="tuvi-hero-box-header">
                  <span className="tuvi-hero-box-icon" aria-hidden="true">💡</span>
                  <strong>Lời Khuyên Trọng Tâm</strong>
                </div>
                <p className="tuvi-advice-text">{overall.coreAdvice}</p>
              </div>
            </div>
          </div>

          {/* 2. Khối Biểu Đồ Lục Giác SVG + 6 Thẻ Phương Diện Cuộc Đời */}
          <div className="tuvi-aspects-section">
            <div className="tuvi-section-header">
              <h3 className="tuvi-section-title">
                <span aria-hidden="true">🕸️</span> Biểu Đồ Lục Giác & 6 Phương Diện Cuộc Đời
              </h3>
              <p className="tuvi-section-desc">
                {overall.isDynamic
                  ? `Đang hiển thị biến chuyển 6 phương diện theo ${overall.contextLabel} (kết hợp cung xoay chiều, Tứ Hóa vận hạn & sao Lưu đối chiếu với nền tảng Bản Mệnh).`
                  : 'Cân đối tổng thể giữa Công Danh, Tài Lộc, Tình Duyên, Phúc Đức, Quý Nhân và Sức Khỏe theo Bản Mệnh gốc.'}
              </p>
            </div>

            <div className="tuvi-aspects-grid-wrap">
              {/* Cột trái: Biểu đồ Radar Lục Giác SVG */}
              <div className="tuvi-aspects-radar-col">
                <RadarChart
                  aspects={aspects}
                  natalAspects={natalAspects}
                  isDynamic={overall.isDynamic}
                />
              </div>

              {/* Cột phải: 6 Thẻ Phương Diện Cuộc Đời */}
              <div className="tuvi-aspects-cards-col">
                {aspects.map((aspect) => (
                  <div key={aspect.id} className="tuvi-aspect-card">
                    <div className="tuvi-aspect-card-top">
                      <div className="tuvi-aspect-title-wrap">
                        <span className="tuvi-aspect-icon" aria-hidden="true">{aspect.icon}</span>
                        <span className="tuvi-aspect-name">{aspect.name}</span>
                      </div>
                      <span className={`tuvi-tier-badge mini ${aspect.badgeClass}`}>
                        {aspect.tierLabel}
                      </span>
                    </div>

                    <div className="tuvi-aspect-rating-row">
                      <span className="tuvi-aspect-stars-text">{aspect.starsText}</span>
                      <span className="tuvi-aspect-score-label">
                        {aspect.stars} / 5.0 ⭐
                        {overall.isDynamic && aspect.deltaStars !== undefined && aspect.deltaStars !== 0 && (
                          <span
                            className={`tuvi-aspect-delta-inline ${aspect.deltaStars > 0 ? 'is-up' : 'is-down'}`}
                            title={`Bản Mệnh gốc: ${aspect.natalStars}/5.0 sao`}
                          >
                            {aspect.deltaStars > 0 ? ` ▲+${aspect.deltaStars}` : ` ▼${aspect.deltaStars}`}
                          </span>
                        )}
                      </span>
                    </div>

                    {overall.isDynamic && aspect.rotatedFocus && (
                      <div className="tuvi-aspect-rotated-focus">
                        📍 Ứng kỳ: {aspect.rotatedFocus}
                      </div>
                    )}

                    <div className="tuvi-aspect-bar-track" aria-hidden="true">
                      <div
                        className="tuvi-aspect-bar-fill"
                        style={{
                          width: `${(aspect.stars / 5) * 100}%`,
                          backgroundColor: aspect.tierColor,
                        }}
                      />
                    </div>

                    <p className="tuvi-aspect-comment">{aspect.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Thẻ Đánh Giá Nhanh Vận Hạn Đang Chọn */}
          {activeYunxian && (
            <div className="tuvi-yunxian-rating-card">
              <div className="tuvi-yunxian-card-header">
                <div className="tuvi-yunxian-title-wrap">
                  <span className="tuvi-yunxian-icon" aria-hidden="true">🎯</span>
                  <div>
                    <div className="tuvi-yunxian-mode-badge">{activeYunxian.modeLabel}</div>
                    <h4 className="tuvi-yunxian-title">{activeYunxian.title}</h4>
                  </div>
                </div>

                <div className="tuvi-yunxian-stars-wrap">
                  <span className="tuvi-yunxian-stars">{activeYunxian.starsText}</span>
                  <span className={`tuvi-tier-badge ${activeYunxian.badgeClass}`}>
                    {activeYunxian.tierLabel}
                  </span>
                </div>
              </div>

              <ul className="tuvi-yunxian-highlights">
                {activeYunxian.highlights.map((h, idx) => (
                  <li key={idx} className="tuvi-yunxian-highlight-item">
                    <span className="tuvi-highlight-bullet" aria-hidden="true">✦</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="tuvi-yunxian-hint">
                💡 Thay đổi chế độ xem (Bản Mệnh / Đại Hạn / Lưu Niên / Lưu Nguyệt) trên thanh điều hướng lá số để cập nhật ngay đánh giá thời vận tương ứng.
              </div>
            </div>
          )}

          {/* 4. Lưới Xếp Hạng Nhanh 12 Cung */}
          <div className="tuvi-12palaces-section">
            <div className="tuvi-12palaces-header">
              <div className="tuvi-12palaces-title-wrap">
                <h4 className="tuvi-12palaces-title">🏛️ Xếp Hạng 12 Cung Số</h4>
                <span className="tuvi-12palaces-sub">
                  {overall.isDynamic
                    ? `Đánh giá năng lượng 12 cung kèm vai trò xoay cung trong ${overall.contextLabel}`
                    : 'Đánh giá độ đắc hãm và năng lượng từng cung vị'}
                </span>
              </div>
              <button
                type="button"
                className="tuvi-toggle-12palaces-btn"
                onClick={() => setShow12Palaces((v) => !v)}
                aria-expanded={show12Palaces}
              >
                {show12Palaces ? '▲ Thu gọn' : '▼ Xem toàn bộ 12 cung'}
              </button>
            </div>

            {show12Palaces && (
              <div className="tuvi-12palaces-rating-grid">
                {palaceRatings.map((p) => (
                  <div key={p.chiIndex} className={`tuvi-palace-rating-card ${p.badgeClass}`}>
                    <div className="tuvi-palace-rating-top">
                      <div className="tuvi-palace-name-col">
                        <span className="tuvi-palace-rating-name">Cung {p.palaceName}</span>
                        <span className="tuvi-palace-chi-tag">({p.chiName})</span>
                        {p.rotatedRole && (
                          <span className="tuvi-palace-rotated-pill">{p.rotatedRole}</span>
                        )}
                      </div>
                      <span className={`tuvi-tier-badge mini ${p.badgeClass}`}>
                        {p.tierLabel}
                      </span>
                    </div>

                    <div className="tuvi-palace-rating-stars-line">
                      <span className="tuvi-palace-stars">{p.starsText}</span>
                      <span className="tuvi-palace-score-num">{p.stars}/5</span>
                    </div>

                    <p className="tuvi-palace-rating-summary">{p.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HƯỚNG DẪN TỰ XEM (6 BƯỚC) */}
      {activeTab === 'guide' && (
        <div id="panel-guide" role="tabpanel" aria-labelledby="tab-guide" className="tuvi-tab-content">
          <TuViSelfGuidePanel
            result={result}
            inputData={inputData}
            yunxianState={yunxianState}
          />
        </div>
      )}

      {/* TAB 3: LUẬN ĐOÁN TỰ ĐỘNG (CHI TIẾT) */}
      {activeTab === 'report' && (
        <div id="panel-report" role="tabpanel" aria-labelledby="tab-report" className="tuvi-tab-content">
          <TuViLocalReport result={result} />
          <SummaryPanel result={result} inputData={inputData} />
        </div>
      )}

      {/* TAB 4: PHÂN TÍCH CHUYÊN SÂU & CỔ THƯ */}
      {activeTab === 'deep' && (
        <div id="panel-deep" role="tabpanel" aria-labelledby="tab-deep" className="tuvi-tab-content">
          <TuViPatternsPanel result={result} inputData={inputData} />
        </div>
      )}

      {/* TAB 5: VẬN HẠN 10 NĂM & LỊCH LƯU NHẬT / LƯU THỜI */}
      {activeTab === 'timeline' && (
        <div id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline" className="tuvi-tab-content">
          <TuViTimelineAndDailyPanel
            result={result}
            inputData={inputData}
            yunxianState={yunxianState}
            onYunxianChange={onYunxianChange}
            lifeEvents={lifeEvents}
            onUpsertLifeEvent={onUpsertLifeEvent}
            onDeleteLifeEvent={onDeleteLifeEvent}
          />
        </div>
      )}
    </section>
  );
}
