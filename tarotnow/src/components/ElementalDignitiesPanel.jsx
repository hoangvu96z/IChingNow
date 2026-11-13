import React, { useMemo } from 'react';
import {
  ELEMENT_METADATA,
  computeElementalDignities,
  computeArchetypeClusters,
} from '../utils/tarotLogic.js';

const ELEMENT_ORDER = ['Fire', 'Water', 'Air', 'Earth'];

export default function ElementalDignitiesPanel({
  cards = [],
  positions = [],
  perspective = 'general',
  language = 'vi',
}) {
  const isEn = language === 'en';

  const dignities = useMemo(
    () => computeElementalDignities(cards, positions, { language, perspective }),
    [cards, positions, language, perspective]
  );

  const clusters = useMemo(
    () => computeArchetypeClusters(cards, language),
    [cards, language]
  );

  if (!Array.isArray(cards) || cards.length === 0) return null;

  return (
    <details className="dignities-disclosure" open>
      <summary className="dignities-summary-trigger">
        <span className="dignities-summary-title">
          <span aria-hidden="true">🔬</span>
          <span>
            {isEn
              ? 'Elemental Dignities & Spread Structure'
              : 'Tương Tác Nguyên Tố & Cấu Trúc Trải Bài (Elemental Dignities)'}
          </span>
        </span>
        <span className="dignities-summary-pill">
          {dignities.dominantElement && ELEMENT_METADATA[dignities.dominantElement]
            ? `${ELEMENT_METADATA[dignities.dominantElement].icon} ${
                isEn
                  ? ELEMENT_METADATA[dignities.dominantElement].en
                  : ELEMENT_METADATA[dignities.dominantElement].shortVi
              }`
            : isEn
              ? 'Hermetic'
              : 'Ngũ/Tứ đại'}
        </span>
      </summary>

      <div className="dignities-body">
        {dignities.summaryText && (
          <p className="dignities-lead-text">{dignities.summaryText}</p>
        )}

        {/* 1. Elemental Balance Grid */}
        <div className="dignities-element-grid">
          {ELEMENT_ORDER.map((elemKey) => {
            const meta = ELEMENT_METADATA[elemKey];
            const count = dignities.counts[elemKey] || 0;
            const pct = dignities.percentages[elemKey] || 0;
            const isZero = count === 0;
            return (
              <div
                key={elemKey}
                className={`dignities-element-chip elem-${elemKey.toLowerCase()}${isZero ? ' is-missing' : ''}`}
              >
                <div className="dignities-element-chip-top">
                  <span aria-hidden="true">{meta.icon}</span>
                  <strong>{isEn ? meta.en : meta.shortVi}</strong>
                  <span className="dignities-element-pct">{pct}%</span>
                </div>
                <div className="dignities-element-bar" aria-hidden="true">
                  <div
                    className="dignities-element-bar-fill"
                    style={{ inlineSize: `${Math.max(pct, isZero ? 0 : 8)}%` }}
                  />
                </div>
                <span className="dignities-element-count">
                  {count} {isEn ? (count === 1 ? 'card' : 'cards') : 'lá'}
                </span>
              </div>
            );
          })}
        </div>

        {/* 2. Pairwise Adjacent Elemental Dignities */}
        {dignities.pairs.length > 0 && (
          <div className="dignities-subsection">
            <div className="dignities-subtitle">
              <span aria-hidden="true">⚡</span>
              <span>
                {isEn
                  ? 'Adjacent Card Elemental Interactions'
                  : 'Tương tác nguyên tố giữa các vị trí liền kề'}
              </span>
            </div>
            <div className="dignities-pair-list">
              {dignities.pairs.map((pair) => (
                <div
                  key={`${pair.fromIndex}-${pair.toIndex}`}
                  className={`dignities-pair-card dignity-${pair.type}`}
                >
                  <div className="dignities-pair-header">
                    <span className="dignities-pair-cards">
                      <strong>
                        {pair.leftIcon} {pair.leftCard.name}
                      </strong>{' '}
                      <span className="dignities-pos-tag">({pair.leftPosition})</span>
                      <span className="dignities-arrow" aria-hidden="true"> ↔ </span>
                      <strong>
                        {pair.rightIcon} {pair.rightCard.name}
                      </strong>{' '}
                      <span className="dignities-pos-tag">({pair.rightPosition})</span>
                    </span>
                    <span className={`dignities-relation-badge badge-${pair.type}`}>
                      {pair.badge}
                    </span>
                  </div>
                  <p className="dignities-pair-desc">{pair.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Golden Dawn 3-Card Flanking Triads */}
        {dignities.triads.length > 0 && (
          <div className="dignities-subsection">
            <div className="dignities-subtitle">
              <span aria-hidden="true">🔺</span>
              <span>
                {isEn
                  ? 'Golden Dawn 3-Card Flanking Triads'
                  : 'Tam cung kẹp giữa (Golden Dawn Flanking Triads)'}
              </span>
            </div>
            <div className="dignities-pair-list">
              {dignities.triads.map((triad) => (
                <div
                  key={`triad-${triad.centerIndex}`}
                  className={`dignities-triad-card triad-${triad.status}`}
                >
                  <div className="dignities-pair-header">
                    <strong>
                      {triad.centerCard.name}{' '}
                      <span className="dignities-pos-tag">({triad.centerPosition})</span>
                    </strong>
                    <span className={`dignities-relation-badge triad-badge-${triad.status}`}>
                      {triad.label}
                    </span>
                  </div>
                  <p className="dignities-pair-desc">{triad.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Missing Elements & Archetype / Numerology Clusters */}
        {(dignities.missingInsights.length > 0 || clusters.highlights.length > 0) && (
          <div className="dignities-subsection">
            <div className="dignities-subtitle">
              <span aria-hidden="true">🔢</span>
              <span>
                {isEn
                  ? 'Missing Elements & Numerological / Archetype Clusters'
                  : 'Nguyên tố khuyết & Cụm Số học / Hình mẫu'}
              </span>
            </div>
            <ul className="dignities-cluster-list">
              {cards.length >= 2 &&
                dignities.missingInsights.slice(0, 2).map((m) => (
                  <li key={m.element} className="dignities-cluster-item is-missing-note">
                    <span aria-hidden="true">{m.icon}</span>
                    <span>{m.message}</span>
                  </li>
                ))}
              {clusters.highlights.map((hl, idx) => (
                <li key={idx} className="dignities-cluster-item">
                  <span aria-hidden="true">✦</span>
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
