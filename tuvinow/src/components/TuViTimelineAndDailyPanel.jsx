import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import { attachDialogLightDismiss } from '../../../shared/src/utils/pwaInstall.mjs';
import { RECTIFIER_EVENT_TYPES, RECTIFIER_EVENT_MAP } from '../utils/birthRectifier.js';
import {
  TIMELINE_SERIES,
  buildTenYearTimelineModel,
  buildThirtyDayLiuRiCalendar,
} from '../utils/tuviTimelineModel.js';

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function TimelineSvgChart({
  years = [],
  visibleSeries = ['overall', 'career', 'wealth'],
  selectedYear,
  onSelectYear,
}) {
  const width = 680;
  const height = 228;
  const padLeft = 38;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xAt = (idx) =>
    years.length <= 1
      ? padLeft + plotW / 2
      : padLeft + (idx / (years.length - 1)) * plotW;

  // Rating scale: 1.5 -> 5.0 stars
  const yAt = (stars) => {
    const clamped = Math.max(1.5, Math.min(5.0, Number(stars) || 3.0));
    const ratio = (clamped - 1.5) / 3.5;
    return padTop + plotH - ratio * plotH;
  };

  const activeSeriesConfigs = TIMELINE_SERIES.filter((s) => visibleSeries.includes(s.id));
  const gridLevels = [2.0, 3.0, 4.0, 5.0];

  return (
    <div className="tv-timeline-svg-wrap">
      <svg
        className="tv-timeline-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Biểu đồ quỹ đạo vận hạn 10 năm Lưu Niên"
      >
        {gridLevels.map((lvl) => {
          const y = yAt(lvl);
          return (
            <g key={lvl}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                className="tv-tl-grid-line"
              />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" className="tv-tl-axis-label">
                {lvl.toFixed(1)}★
              </text>
            </g>
          );
        })}

        {/* Vertical highlight on selected year */}
        {years.map((item, idx) => {
          const x = xAt(idx);
          const isSelected = item.year === selectedYear;
          return (
            <g key={`col-${item.year}`}>
              {isSelected && (
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotH}
                  className="tv-tl-selected-guide"
                />
              )}
              <text
                x={x}
                y={height - 16}
                textAnchor="middle"
                className={`tv-tl-year-label ${isSelected ? 'is-selected' : ''}`}
              >
                {item.year}
              </text>
              <text
                x={x}
                y={height - 4}
                textAnchor="middle"
                className="tv-tl-age-label"
              >
                {item.age}t
              </text>
              {item.pinnedEvents.length > 0 && (
                <text x={x} y={14} textAnchor="middle" className="tv-tl-pin-marker">
                  📌
                </text>
              )}
            </g>
          );
        })}

        {/* Series polylines & dots */}
        {activeSeriesConfigs.map((serie) => {
          const points = years
            .map((yr, idx) => `${xAt(idx).toFixed(1)},${yAt(yr.ratings[serie.id]).toFixed(1)}`)
            .join(' ');
          return (
            <g key={serie.id}>
              <polyline
                fill="none"
                stroke={serie.color}
                strokeWidth={serie.id === 'overall' ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {years.map((yr, idx) => {
                const cx = xAt(idx);
                const cy = yAt(yr.ratings[serie.id]);
                const isSel = yr.year === selectedYear;
                return (
                  <circle
                    key={`${serie.id}-${yr.year}`}
                    cx={cx}
                    cy={cy}
                    r={isSel ? 5.5 : serie.id === 'overall' ? 4 : 3}
                    fill={serie.color}
                    stroke="var(--bg-card)"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectYear && onSelectYear(yr.year)}
                  >
                    <title>
                      {`${yr.year} (${yr.canChi}) · ${serie.label}: ${yr.ratings[serie.id]}/5.0★ (${yr.scores100[serie.id]}/100)`}
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function TuViTimelineAndDailyPanel({
  result,
  inputData,
  yunxianState,
  onYunxianChange,
  lifeEvents = [],
  onUpsertLifeEvent,
  onDeleteLifeEvent,
}) {
  const currentYear = new Date().getFullYear();
  const [windowMode, setWindowMode] = useState('daxian');
  const [selectedDaXianChi, setSelectedDaXianChi] = useState(
    yunxianState?.daXianChiIndex ?? null,
  );
  const [visibleSeries, setVisibleSeries] = useState(['overall', 'career', 'wealth']);
  const [selectedYear, setSelectedYear] = useState(
    Number(yunxianState?.viewYear || result?.viewYear || currentYear),
  );

  // Life Event Pinning Modal
  const pinDialogRef = useRef(null);
  const pinTitleId = useId();
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [pinYear, setPinYear] = useState(selectedYear);
  const [pinType, setPinType] = useState('career_up');
  const [pinNote, setPinNote] = useState('');

  // 30-day Lưu Nhật Calendar State
  const [dayOffsetBlocks, setDayOffsetBlocks] = useState(0); // 0 = từ hôm nay, -1 = -30 ngày, +1 = +30 ngày
  const [selectedIsoDate, setSelectedIsoDate] = useState('');

  useEffect(() => {
    if (!pinDialogRef.current) return undefined;
    return attachDialogLightDismiss(pinDialogRef.current);
  }, []);

  useEffect(() => {
    const d = pinDialogRef.current;
    if (!d) return;
    if (isPinOpen) {
      if (!d.open && typeof d.showModal === 'function') {
        try { d.showModal(); } catch {}
      }
    } else if (d.open && typeof d.close === 'function') {
      d.close();
    }
  }, [isPinOpen]);

  const timeline = useMemo(
    () =>
      buildTenYearTimelineModel(result, inputData, {
        windowMode,
        daXianChiIndex: selectedDaXianChi,
        referenceYear: currentYear,
        lifeEvents,
      }),
    [result, inputData, windowMode, selectedDaXianChi, currentYear, lifeEvents],
  );

  // Keep selectedYear within current 10-year window when window changes
  useEffect(() => {
    if (!timeline?.years?.length) return;
    const exists = timeline.years.some((item) => item.year === selectedYear);
    if (!exists) {
      const hasCurrent = timeline.years.find((item) => item.year === currentYear);
      setSelectedYear(hasCurrent ? hasCurrent.year : timeline.years[0].year);
    }
  }, [timeline, selectedYear, currentYear]);

  const calendarStartDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffsetBlocks * 30, 12, 0, 0);
  }, [dayOffsetBlocks]);

  const dailyCalendar = useMemo(
    () =>
      buildThirtyDayLiuRiCalendar(result, inputData, {
        startDate: calendarStartDate,
        daysCount: 30,
      }),
    [result, inputData, calendarStartDate],
  );

  useEffect(() => {
    if (!dailyCalendar?.days?.length) return;
    if (!selectedIsoDate || !dailyCalendar.days.some((d) => d.isoDate === selectedIsoDate)) {
      setSelectedIsoDate(dailyCalendar.days[0].isoDate);
    }
  }, [dailyCalendar, selectedIsoDate]);

  if (!timeline || !dailyCalendar) return null;

  const activeYearData =
    timeline.years.find((item) => item.year === selectedYear) || timeline.years[0];
  const activeDayData =
    dailyCalendar.days.find((d) => d.isoDate === selectedIsoDate) || dailyCalendar.days[0];

  const toggleSeries = (id) => {
    setVisibleSeries((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleYearClick = (year) => {
    setSelectedYear(year);
  };

  const handleSyncYearToChart = (year) => {
    setSelectedYear(year);
    if (onYunxianChange) {
      onYunxianChange({
        mode: 'liunian',
        viewYear: year,
      });
    }
  };

  const openPinModalForYear = (year, existingEv = null) => {
    if (existingEv) {
      setEditingEventId(existingEv.id);
      setPinYear(existingEv.year);
      setPinType(existingEv.eventType || 'career_up');
      setPinNote(existingEv.note || '');
    } else {
      setEditingEventId(null);
      setPinYear(year || selectedYear);
      setPinType('career_up');
      setPinNote('');
    }
    setIsPinOpen(true);
  };

  const handleSavePinEvent = (e) => {
    e.preventDefault();
    if (!onUpsertLifeEvent) return;
    const meta = RECTIFIER_EVENT_MAP[pinType];
    onUpsertLifeEvent({
      ...(editingEventId ? { id: editingEventId } : {}),
      year: Number(pinYear),
      eventType: pinType,
      label: meta?.label || pinType,
      note: pinNote.trim(),
    });
    setIsPinOpen(false);
  };

  return (
    <div className="tv-timeline-daily-root">
      {/* ================= PHẦN 1: QUỸ ĐẠO 10 NĂM LƯU NIÊN ================= */}
      <section className="tv-td-card" aria-label="Quỹ đạo vận hạn 10 năm Lưu Niên">
        <div className="tv-td-header">
          <div className="tv-td-title-block">
            <h3>
              <span aria-hidden="true">📈</span> Quỹ Đạo 10 Năm Lưu Niên &amp; Nghiệm Lý Thực Tế
            </h3>
            <p>{timeline.windowTitle}</p>
          </div>

          <div className="tv-td-controls">
            <div className="tv-td-mode-pills" role="group" aria-label="Chế độ khung 10 năm">
              <button
                type="button"
                className={windowMode === 'daxian' ? 'is-active' : ''}
                aria-pressed={windowMode === 'daxian'}
                onClick={() => setWindowMode('daxian')}
              >
                Theo Đại Hạn
              </button>
              <button
                type="button"
                className={windowMode === 'rolling' ? 'is-active' : ''}
                aria-pressed={windowMode === 'rolling'}
                onClick={() => setWindowMode('rolling')}
              >
                Quanh hiện tại ({currentYear - 2}–{currentYear + 7})
              </button>
            </div>

            {windowMode === 'daxian' && timeline.daXianList.length > 0 && (
              <select
                className="tv-td-daxian-select"
                aria-label="Chọn Đại Hạn 10 năm"
                value={timeline.activeDaXian?.chiIndex ?? ''}
                onChange={(e) => setSelectedDaXianChi(Number(e.target.value))}
              >
                {timeline.daXianList.map((dx) => (
                  <option key={dx.chiIndex} value={dx.chiIndex}>
                    ĐH {dx.startAge}–{dx.endAge}t · Cung {dx.palaceName} ({dx.startYear}–{dx.endYear})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Peak vs Defensive Summary Pills */}
        <div className="tv-td-highlights-strip">
          {timeline.peakYear && (
            <div className="tv-td-peak-pill is-peak">
              <span aria-hidden="true">🚀</span>
              <div>
                <strong>Đỉnh mở rộng: Năm {timeline.peakYear.year} ({timeline.peakYear.canChi})</strong>
                <span>{timeline.peakYear.ratings.overall}/5.0★ · Thuận lợi bứt phá sự nghiệp &amp; tài lộc</span>
              </div>
            </div>
          )}
          {timeline.defensiveYear && (
            <div className="tv-td-peak-pill is-defensive">
              <span aria-hidden="true">🛡️</span>
              <div>
                <strong>Năm giữ nhịp / phòng thủ: Năm {timeline.defensiveYear.year} ({timeline.defensiveYear.canChi})</strong>
                <span>{timeline.defensiveYear.ratings.overall}/5.0★ · Ưu tiên quản trị rủi ro &amp; giữ sức</span>
              </div>
            </div>
          )}
        </div>

        {/* Series Filter Toggles */}
        <div className="tv-td-series-bar" role="group" aria-label="Bật tắt đường chỉ số vận hạn">
          {TIMELINE_SERIES.map((s) => {
            const on = visibleSeries.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                className={`tv-td-series-chip ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleSeries(s.id)}
              >
                <span
                  className="tv-td-series-dot"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Responsive Multi-series SVG Chart */}
        <TimelineSvgChart
          years={timeline.years}
          visibleSeries={visibleSeries}
          selectedYear={activeYearData?.year}
          onSelectYear={handleYearClick}
        />

        {/* Clickable Year Pills */}
        <div className="tv-td-year-pills" role="group" aria-label="Chọn năm Lưu Niên để xem chi tiết">
          {timeline.years.map((item) => {
            const isSel = item.year === activeYearData?.year;
            return (
              <button
                key={item.year}
                type="button"
                className={`tv-td-year-pill ${isSel ? 'is-selected' : ''} posture-${item.posture}`}
                aria-pressed={isSel}
                onClick={() => handleYearClick(item.year)}
              >
                <strong>
                  {item.year} {item.pinnedEvents.length > 0 ? '📌' : ''}
                </strong>
                <span>{item.canChi} · {item.ratings.overall}★</span>
              </button>
            );
          })}
        </div>

        {/* Selected Year Detail + Pinned Life Events */}
        {activeYearData && (
          <div className="tv-td-year-detail">
            <div className="tv-td-year-detail-head">
              <div>
                <div className="tv-td-posture-badge">{activeYearData.postureLabel}</div>
                <h4>
                  Năm {activeYearData.year} ({activeYearData.canChi} · {activeYearData.age} tuổi âm) — Lưu Thái Tuế nhập cung{' '}
                  {activeYearData.luuNienPalaceName}
                </h4>
                <p>{activeYearData.postureSummary}</p>
              </div>

              <div className="tv-td-year-cta-group">
                {onYunxianChange && (
                  <button
                    type="button"
                    className="tv-td-sync-btn"
                    onClick={() => handleSyncYearToChart(activeYearData.year)}
                  >
                    🔍 Áp năm {activeYearData.year} lên Lá số
                  </button>
                )}
                {onUpsertLifeEvent && (
                  <button
                    type="button"
                    className="tv-td-pin-btn"
                    onClick={() => openPinModalForYear(activeYearData.year)}
                  >
                    📌 Ghim mốc sự kiện thực tế
                  </button>
                )}
              </div>
            </div>

            <div className="tv-td-metrics-mini-grid">
              {TIMELINE_SERIES.map((s) => (
                <div key={s.id} className="tv-td-metric-box">
                  <span>{s.label}</span>
                  <strong style={{ color: s.color }}>
                    {activeYearData.ratings[s.id]}★ ({activeYearData.scores100[s.id]}đ)
                  </strong>
                </div>
              ))}
            </div>

            <div className="tv-td-sihua-strip">
              <span>
                <strong>LN.Hóa Lộc:</strong> {activeYearData.sihua.Loc.star} → {activeYearData.sihua.Loc.palaceName}
              </span>
              <span>
                <strong>LN.Hóa Quyền:</strong> {activeYearData.sihua.Quyen.star} → {activeYearData.sihua.Quyen.palaceName}
              </span>
              <span>
                <strong>LN.Hóa Khoa:</strong> {activeYearData.sihua.Khoa.star} → {activeYearData.sihua.Khoa.palaceName}
              </span>
              <span>
                <strong>LN.Hóa Kỵ:</strong> {activeYearData.sihua.Ky.star} → {activeYearData.sihua.Ky.palaceName}
              </span>
            </div>

            {/* Pinned Life Events on this Year or All Pinned Events */}
            {lifeEvents.length > 0 && (
              <div className="tv-td-pinned-events-box">
                <div className="tv-td-pinned-title">
                  📌 Mốc sự kiện thực tế đã ghim để nghiệm lý &amp; hiệu chuẩn AI ({lifeEvents.length})
                </div>
                <div className="tv-td-pinned-list">
                  {lifeEvents.map((ev) => {
                    const meta = RECTIFIER_EVENT_MAP[ev.eventType];
                    const isThisYear = Number(ev.year) === activeYearData.year;
                    return (
                      <div
                        key={ev.id}
                        className={`tv-td-pinned-item ${isThisYear ? 'is-active-year' : ''}`}
                      >
                        <div className="tv-td-pinned-main">
                          <span aria-hidden="true">{meta?.icon || '📌'}</span>
                          <strong>Năm {ev.year}:</strong>
                          <span>{meta?.label || ev.label || ev.eventType}</span>
                          {ev.note && <em>— {ev.note}</em>}
                        </div>
                        <div className="tv-td-pinned-tools">
                          {onUpsertLifeEvent && (
                            <button
                              type="button"
                              onClick={() => openPinModalForYear(ev.year, ev)}
                              aria-label={`Sửa sự kiện năm ${ev.year}`}
                            >
                              Sửa
                            </button>
                          )}
                          {onDeleteLifeEvent && (
                            <button
                              type="button"
                              className="is-del"
                              onClick={() => onDeleteLifeEvent(ev.id)}
                              aria-label={`Xóa sự kiện năm ${ev.year}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= PHẦN 2: LỊCH 30 NGÀY LƯU NHẬT & 12 CANH GIỜ LƯU THỜI ================= */}
      <section className="tv-td-card" aria-label="Lịch 30 ngày Lưu Nhật và 12 canh giờ Lưu Thời cá nhân hóa">
        <div className="tv-td-header">
          <div className="tv-td-title-block">
            <h3>
              <span aria-hidden="true">🗓️</span> Lịch 30 Ngày Lưu Nhật &amp; Lưu Thời Cá Nhân Hóa
            </h3>
            <p>
              Tính theo Tứ Hóa Lưu Nhật &amp; Lưu Thời chiếu trực tiếp vào 12 cung lá số của riêng{' '}
              <strong>{inputData?.name || 'bạn'}</strong>
            </p>
          </div>

          <div className="tv-td-cal-nav">
            <button
              type="button"
              onClick={() => setDayOffsetBlocks((v) => v - 1)}
              aria-label="Xem 30 ngày trước"
            >
              ← Trước
            </button>
            <button
              type="button"
              onClick={() => setDayOffsetBlocks(0)}
              disabled={dayOffsetBlocks === 0}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setDayOffsetBlocks((v) => v + 1)}
              aria-label="Xem 30 ngày tiếp theo"
            >
              Tiếp →
            </button>
          </div>
        </div>

        <div className="tv-td-cal-summary-bar">
          <span className="tv-cal-stat is-cat">🟢 {dailyCalendar.summary.catCount} ngày Cát lợi</span>
          <span className="tv-cal-stat is-binh">🟡 {dailyCalendar.summary.binhCount} ngày Bình hòa</span>
          <span className="tv-cal-stat is-caution">🔴 {dailyCalendar.summary.cautionCount} ngày Cẩn trọng</span>
        </div>

        <div className="tv-td-calendar-grid" role="group" aria-label="Lưới 30 ngày vận hạn Lưu Nhật">
          {dailyCalendar.days.map((day) => {
            const isSel = day.isoDate === activeDayData?.isoDate;
            return (
              <button
                key={day.isoDate}
                type="button"
                className={`tv-cal-day-cell status-${day.status} ${isSel ? 'is-selected' : ''}`}
                aria-pressed={isSel}
                onClick={() => setSelectedIsoDate(day.isoDate)}
              >
                <div className="tv-cal-day-top">
                  <span className="tv-cal-weekday">{WEEKDAY_LABELS[day.weekday]}</span>
                  <span className={`tv-cal-dot status-${day.status}`}>{day.shortBadge}</span>
                </div>
                <div className="tv-cal-solar-num">
                  {day.solarDay}/{day.solarMonth}
                </div>
                <div className="tv-cal-lunar-meta">ÂL {day.lunarLabel}</div>
                <div className="tv-cal-canchi">{day.dayCanChi}</div>
              </button>
            );
          })}
        </div>

        {/* Chi tiết ngày đang chọn + 12 Canh Giờ Lưu Thời */}
        {activeDayData && (
          <div className="tv-cal-day-detail">
            <div className="tv-cal-detail-header">
              <div>
                <span className={`tv-cal-status-pill status-${activeDayData.status}`}>
                  {activeDayData.statusLabel}
                </span>
                <h4>
                  Ngày {activeDayData.solarDay}/{activeDayData.solarMonth}/{activeDayData.solarYear} (Dương) · Âm lịch{' '}
                  {activeDayData.lunarDay}/{activeDayData.lunarMonth}/{activeDayData.lunarYear} · Ngày{' '}
                  {activeDayData.dayCanChi}
                </h4>
                <p className="tv-cal-palace-sub">
                  Địa Chi ngày ứng động cung <strong>{activeDayData.dayBranchPalaceName}</strong> · Lưu Nhật Lộc tại{' '}
                  <strong>{activeDayData.sihua.Loc.palaceName}</strong> · Lưu Nhật Kỵ tại{' '}
                  <strong>{activeDayData.sihua.Ky.palaceName}</strong>
                </p>
              </div>
            </div>

            <div className="tv-cal-guidance-grid">
              <div className="tv-cal-guidance-box is-good">
                <h5>✅ Hoạt động thuận lợi trong ngày</h5>
                <ul>
                  {activeDayData.bestActivities.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="tv-cal-guidance-box is-avoid">
                <h5>⚠️ Điểm cần lưu tâm / hạn chế</h5>
                <ul>
                  {activeDayData.avoidActivities.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="tv-liushi-section">
              <div className="tv-liushi-head">
                <h5>⏱️ Chọn Giờ Tốt Trong Ngày (12 Canh Giờ Lưu Thời — Tứ Hóa Theo Giờ)</h5>
                {activeDayData.favorableHourLabels.length > 0 && (
                  <span className="tv-liushi-best-summary">
                    Khung giờ sáng nhất: {activeDayData.favorableHourLabels.join(' · ')}
                  </span>
                )}
              </div>

              <div className="tv-liushi-grid">
                {activeDayData.hours.map((hr) => (
                  <div key={hr.branchIndex} className={`tv-liushi-card status-${hr.status}`}>
                    <div className="tv-liushi-top">
                      <strong>Giờ {hr.branchName}</strong>
                      <span className={`tv-liushi-badge status-${hr.status}`}>{hr.statusLabel}</span>
                    </div>
                    <div className="tv-liushi-time">
                      {hr.timeRange} · {hr.canChiHour}
                    </div>
                    <div className="tv-liushi-sihua">
                      <span>✦ {hr.locSummary}</span>
                      <span>⚠ {hr.kySummary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Native <dialog> Ghim / Sửa mốc sự kiện thực tế */}
      <dialog
        ref={pinDialogRef}
        aria-labelledby={pinTitleId}
        closedby="any"
        className="tv-native-dialog tv-profile-dialog"
        onClose={() => {
          if (pinDialogRef.current) pinDialogRef.current.returnValue = '';
          setIsPinOpen(false);
        }}
      >
        <div className="tv-dialog-shell tv-dialog-compact">
          <header className="tv-dialog-header">
            <h2 id={pinTitleId} className="tv-dialog-title">
              <span aria-hidden="true">📌</span>{' '}
              {editingEventId ? 'Cập nhật Mốc Sự Kiện Thực Tế' : 'Ghim Mốc Sự Kiện Để Nghiệm Lý'}
            </h2>
            <button
              type="button"
              className="tv-dialog-close-btn"
              onClick={() => pinDialogRef.current?.close()}
              aria-label="Đóng hộp thoại ghim sự kiện"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <form className="tv-dialog-body tv-prof-modal-form" onSubmit={handleSavePinEvent}>
            <p className="tv-rect-hint">
              Mốc sự kiện thực tế sẽ hiển thị trên biểu đồ 10 năm và có thể gửi kèm vào AI để luận giải bám sát cuộc đời thực của bạn:
            </p>

            <div className="tv-prof-form-field">
              <label htmlFor={`${pinTitleId}-year`}>Năm xảy ra sự kiện</label>
              <input
                id={`${pinTitleId}-year`}
                type="number"
                required
                min="1920"
                max="2100"
                value={pinYear}
                onChange={(e) => setPinYear(e.target.value)}
              />
            </div>

            <div className="tv-prof-form-field">
              <label htmlFor={`${pinTitleId}-type`}>Nhóm sự kiện</label>
              <select
                id={`${pinTitleId}-type`}
                value={pinType}
                onChange={(e) => setPinType(e.target.value)}
              >
                {RECTIFIER_EVENT_TYPES.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.icon} {ev.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tv-prof-form-field">
              <label htmlFor={`${pinTitleId}-note`}>Mô tả thực tế (giúp nghiệm lý rõ hơn)</label>
              <input
                id={`${pinTitleId}-note`}
                type="text"
                maxLength={240}
                value={pinNote}
                onChange={(e) => setPinNote(e.target.value)}
                placeholder="VD: Kết hôn cuối năm, chuyển sang công ty mới, mua căn hộ đầu tiên..."
              />
            </div>

            <div className="tv-dialog-footer-actions">
              <button
                type="button"
                className="tv-btn-secondary"
                onClick={() => pinDialogRef.current?.close()}
              >
                Hủy
              </button>
              <button type="submit" className="tv-btn-primary">
                📌 Lưu mốc sự kiện
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
