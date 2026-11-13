import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { attachDialogLightDismiss } from '../../../shared/src/utils/pwaInstall.mjs';
import { ELEMENT_METADATA } from '../utils/tarotLogic.js';
import { computeTarotReadingInsights } from '../utils/tarotAnalytics.js';

const WINDOW_OPTIONS = [
  { id: 30, labelVi: '30 ngày', labelEn: '30 Days' },
  { id: 90, labelVi: '90 ngày', labelEn: '90 Days' },
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All Time' },
];

const ELEMENT_ORDER = ['Fire', 'Water', 'Air', 'Earth'];

export default function PersonalTarotInsightsModal({
  isOpen,
  onClose,
  history = [],
  tarotCards = [],
  language = 'vi',
}) {
  const isEn = language === 'en';
  const dialogRef = useRef(null);
  const titleId = useId();
  const [windowFilter, setWindowFilter] = useState('all');

  // Wire native <dialog closedby="any"> light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const detach = attachDialogLightDismiss(dialog);
    const handleClose = () => {
      dialog.returnValue = '';
      if (onClose) onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => {
      detach();
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // Imperatively open/close via showModal()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const insights = useMemo(
    () =>
      computeTarotReadingInsights(history, {
        windowDays: windowFilter === 'all' ? null : windowFilter,
        deck: tarotCards,
        language,
      }),
    [history, windowFilter, tarotCards, language]
  );

  const baseUrl = import.meta.env.BASE_URL || '/';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      closedby="any"
      className="tarot-native-dialog insights-dialog"
    >
      <div className="tarot-dialog-inner">
        <div className="tarot-dialog-header">
          <div style={{ minInlineSize: 0 }}>
            <h3 id={titleId} className="tarot-dialog-title">
              📊 {isEn ? 'Personal Tarot Reading Insights' : 'Thống Kê Trải Bài Cá Nhân'}
            </h3>
            <p className="tarot-dialog-subtitle">
              {isEn
                ? 'Discover your recurring Stalker Cards, elemental energy balance, and reflection themes.'
                : 'Khám phá Lá bài bám đuổi (Stalker Cards), phân bổ tứ đại nguyên tố và xu hướng chủ đề của bạn.'}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            className="tarot-dialog-close-btn"
            onClick={() => dialogRef.current?.close()}
            aria-label={isEn ? 'Close personal insights' : 'Đóng bảng thống kê bài cá nhân'}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Time Window Filter */}
        <div className="insights-window-bar" role="group" aria-label={isEn ? 'Time range' : 'Khoảng thời gian'}>
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              className={`picker-filter-pill${windowFilter === opt.id ? ' active' : ''}`}
              onClick={() => setWindowFilter(opt.id)}
            >
              {isEn ? opt.labelEn : opt.labelVi}
            </button>
          ))}
        </div>

        <div className="insights-scroll-body">
          {!insights.hasEnoughData ? (
            <div className="insights-empty-state">
              <div className="insights-empty-icon" aria-hidden="true">
                🔮
              </div>
              <h4 className="insights-empty-title">
                {isEn
                  ? 'At least 2 saved readings needed for pattern insights'
                  : 'Cần tối thiểu 2 trải bài trong kỳ để phân tích quy luật'}
              </h4>
              <p className="insights-empty-desc">
                {isEn
                  ? `You currently have ${insights.totalReadings} saved reading(s) in this time window. Draw online or log your physical deck spreads to unlock Stalker Card & Elemental trends!`
                  : `Hiện có ${insights.totalReadings} trải bài được lưu trong khoảng thời gian này. Hãy thực hiện thêm trải bài trực tuyến hoặc nhập bài ngoài đời để mở khóa thống kê Stalker Cards và cân bằng Nguyên tố!`}
              </p>
            </div>
          ) : (
            <div className="insights-sections-stack">
              {/* Top KPI Metrics */}
              <div className="insights-kpi-grid">
                <div className="insights-kpi-card">
                  <span className="insights-kpi-label">
                    {isEn ? 'Readings / Cards' : 'Số trải bài / Tổng lá'}
                  </span>
                  <strong className="insights-kpi-value">
                    {insights.totalReadings} · {insights.totalCardsDrawn}{' '}
                    <small>{isEn ? 'cards' : 'lá'}</small>
                  </strong>
                </div>

                <div className="insights-kpi-card">
                  <span className="insights-kpi-label">
                    {isEn ? 'Major vs Minor' : 'Ẩn Chính / Ẩn Phụ'}
                  </span>
                  <strong className="insights-kpi-value">
                    {insights.majorRatePercent}% / {insights.minorRatePercent}%
                  </strong>
                </div>

                <div className="insights-kpi-card">
                  <span className="insights-kpi-label">
                    {isEn ? 'Reversal Rate' : 'Tỷ lệ lá Ngược'}
                  </span>
                  <strong className="insights-kpi-value">
                    {insights.reversalRatePercent}%{' '}
                    <small>
                      ({insights.reversedCount}↓ / {insights.uprightCount}↑)
                    </small>
                  </strong>
                </div>
              </div>

              {/* Stalker Cards Section */}
              <section className="insights-panel-box">
                <h4 className="insights-section-heading">
                  <span aria-hidden="true">👁️</span>
                  <span>
                    {isEn
                      ? 'Stalker Cards (Most Recurring Archetypes)'
                      : 'Stalker Cards — Lá bài lặp lại nhiều nhất'}
                  </span>
                </h4>
                <div className="stalker-cards-list">
                  {insights.stalkerCards.map((sc) => {
                    const elemMeta = sc.element ? ELEMENT_METADATA[sc.element] : null;
                    return (
                      <div key={sc.id} className="stalker-card-row">
                        {sc.image ? (
                          <img
                            src={baseUrl + sc.image.replace(/^\//, '')}
                            alt={sc.name}
                            className="stalker-card-thumb"
                          />
                        ) : (
                          <div className="stalker-card-thumb stalker-card-placeholder" aria-hidden="true">
                            🃏
                          </div>
                        )}
                        <div className="stalker-card-info">
                          <div className="stalker-card-title-line">
                            <strong>{sc.name}</strong>
                            <span className="stalker-count-badge">
                              {sc.count} {isEn ? 'times' : 'lần'}
                            </span>
                            <span className="stalker-ori-breakdown">
                              {sc.uprightCount}↑ {isEn ? 'Upright' : 'Xuôi'} · {sc.reversedCount}↓{' '}
                              {isEn ? 'Reversed' : 'Ngược'}
                            </span>
                            {elemMeta && (
                              <span className="stalker-elem-pill">
                                <span aria-hidden="true">{elemMeta.icon}</span>{' '}
                                {isEn ? elemMeta.en : elemMeta.shortVi}
                              </span>
                            )}
                          </div>
                          <p className="stalker-reflection-text">{sc.reflectionPrompt}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Elemental Distribution */}
              <section className="insights-panel-box">
                <h4 className="insights-section-heading">
                  <span aria-hidden="true">🔥</span>
                  <span>
                    {isEn
                      ? 'Elemental Distribution Across Readings'
                      : 'Phân bổ Tứ đại Nguyên tố (Fire · Water · Air · Earth)'}
                  </span>
                </h4>
                <div className="dignities-element-grid">
                  {ELEMENT_ORDER.map((elemKey) => {
                    const meta = ELEMENT_METADATA[elemKey];
                    const cnt = insights.elementalDistribution.counts[elemKey] || 0;
                    const pct = insights.elementalDistribution.percentages[elemKey] || 0;
                    return (
                      <div
                        key={elemKey}
                        className={`dignities-element-chip elem-${elemKey.toLowerCase()}${cnt === 0 ? ' is-missing' : ''}`}
                      >
                        <div className="dignities-element-chip-top">
                          <span aria-hidden="true">{meta.icon}</span>
                          <strong>{isEn ? meta.en : meta.shortVi}</strong>
                          <span className="dignities-element-pct">{pct}%</span>
                        </div>
                        <div className="dignities-element-bar" aria-hidden="true">
                          <div
                            className="dignities-element-bar-fill"
                            style={{ inlineSize: `${Math.max(pct, cnt === 0 ? 0 : 6)}%` }}
                          />
                        </div>
                        <span className="dignities-element-count">
                          {cnt} {isEn ? 'cards' : 'lá'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Topic Breakdown */}
              {insights.topicBreakdown.length > 0 && (
                <section className="insights-panel-box">
                  <h4 className="insights-section-heading">
                    <span aria-hidden="true">🧭</span>
                    <span>
                      {isEn ? 'Reading Topics Breakdown' : 'Chủ đề trải bài thường gặp'}
                    </span>
                  </h4>
                  <div className="insights-topic-list">
                    {insights.topicBreakdown.map((tp) => (
                      <div key={tp.key} className="insights-topic-pill">
                        <span aria-hidden="true">{tp.icon}</span>
                        <span>{tp.label}</span>
                        <strong>
                          {tp.count} ({tp.percent}%)
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
