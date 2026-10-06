import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useStreak } from '@shared/utils/useStreak.js';
import { drawTarotCards, getCardMeaning } from '../utils/tarotLogic';
import TarotLearnModal from './TarotLearnModal';

/**
 * DailyCardPull — Free daily card feature for TarotNow
 *
 * Each day, user can draw 1 free card. The card is deterministic per day
 * (seeded by date) but feels random on first pull. Once pulled, it stays
 * the same for the rest of the day.
 *
 * Features:
 * - Animated card reveal with flip effect
 * - Brief daily insight text
 * - Streak counter with fire emoji
 * - Shareable card image (text overlay for social)
 */
export default function DailyCardPull({ tarotCards }) {
  const { t, language } = useLanguage();
  const {
    streak,
    longestStreak,
    totalReadings,
    recordActivity,
    setDailyCard,
    getDailyCard,
  } = useStreak('tarot');

  const [dailyCard, setDailyCardState] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [learnCard, setLearnCard] = useState(null);

  // Check if already pulled today
  useEffect(() => {
    if (!tarotCards || tarotCards.length === 0) return;
    const existingCardId = getDailyCard();
    if (existingCardId != null) {
      const card = tarotCards.find(c => c.id === existingCardId);
      if (card) {
        // Deterministic orientation from date seed
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const orientationRng = ((seed * 16807) % 2147483647) / 2147483646;
        setDailyCardState({
          ...card,
          orientation: orientationRng > 0.7 ? 'reversed' : 'upright',
        });
        setIsRevealed(true);
        setShowInsight(true);
      }
    }
  }, [tarotCards, getDailyCard]);

  // Generate deterministic daily card
  const generateDailyCard = useCallback(() => {
    if (!tarotCards || tarotCards.length === 0) return;

    setIsFlipping(true);

    // Date-based seed for deterministic randomness
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Simple seeded random
    let state = seed % 2147483647;
    if (state <= 0) state += 2147483646;
    const rng = () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };

    // Pick a card
    const cardIndex = Math.floor(rng() * tarotCards.length);
    const card = tarotCards[cardIndex];
    const orientation = rng() > 0.7 ? 'reversed' : 'upright';

    const pulledCard = { ...card, orientation };

    // Delay for flip animation
    setTimeout(() => {
      setDailyCardState(pulledCard);
      setDailyCard(card.id);
      recordActivity();
      setIsRevealed(true);
      setIsFlipping(false);

      setTimeout(() => setShowInsight(true), 600);
    }, 800);
  }, [tarotCards, setDailyCard, recordActivity]);

  // Daily insight text based on card
  const dailyInsight = useMemo(() => {
    if (!dailyCard) return '';
    const meaning = getCardMeaning(dailyCard, 'general', dailyCard.orientation);
    return meaning;
  }, [dailyCard]);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (language === 'en') {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    }
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, [language]);

  const todayStr = useMemo(() => {
    const d = new Date();
    if (language === 'en') {
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return `${weekdays[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }, [language]);

  if (!tarotCards || tarotCards.length === 0) return null;

  return (
    <div className="daily-card-section">
      {/* Header with greeting & date */}
      <div className="daily-card-header">
        <div className="daily-greeting">
          <span className="daily-greeting-icon">✨</span>
          <div>
            <h2 className="daily-greeting-text">{greeting}</h2>
            <p className="daily-date-text">{todayStr}</p>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="daily-streak-badge">
          <div className="streak-flame-container">
            <span className="streak-flame">{streak > 0 ? '🔥' : '💫'}</span>
            <span className="streak-number">{streak}</span>
          </div>
          <div className="streak-label">
            {language === 'en' ? 'Day Streak' : 'Ngày liên tiếp'}
          </div>
          {longestStreak > 0 && (
            <div className="streak-best">
              🏆 {language === 'en' ? 'Best' : 'Kỷ lục'}: {longestStreak}
            </div>
          )}
        </div>
      </div>

      {/* Daily Card Area */}
      <div className="daily-card-stage">
        {!isRevealed && !isFlipping ? (
          /* Card back – tap to reveal */
          <button
            className="daily-card-back-btn"
            onClick={generateDailyCard}
            aria-label={language === 'en' ? 'Draw your daily card' : 'Rút lá bài hôm nay'}
          >
            <div className="daily-card-back">
              <div className="daily-card-back-pattern">
                <div className="daily-card-back-star">★</div>
                <div className="daily-card-back-circle"></div>
              </div>
              <p className="daily-card-tap-hint">
                {language === 'en' ? 'Tap to reveal your daily card' : 'Chạm để rút lá bài hôm nay'}
              </p>
            </div>
          </button>
        ) : isFlipping ? (
          /* Flip animation */
          <div className="daily-card-flipping">
            <div className="daily-card-back daily-card-flip-anim">
              <div className="daily-card-back-pattern">
                <div className="daily-card-back-star">★</div>
                <div className="daily-card-back-circle"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Revealed card */
          <div className={`daily-card-revealed ${showInsight ? 'show-insight' : ''}`}>
            <div
              className="daily-card-image-wrapper"
              onClick={() => setLearnCard(dailyCard)}
              title={language === 'en' ? 'Click to learn card details' : 'Chạm để xem giải nghĩa chi tiết lá bài'}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={import.meta.env.BASE_URL + dailyCard.image.replace(/^\//, '')}
                alt={dailyCard.name}
                className={`daily-card-image ${dailyCard.orientation === 'reversed' ? 'reversed' : ''}`}
              />
              <div className="daily-card-glow"></div>
            </div>

            <div className="daily-card-info">
              <span className={`daily-card-orientation ${dailyCard.orientation}`}>
                {dailyCard.orientation === 'reversed'
                  ? (language === 'en' ? '↕ Reversed' : '↕ Lá Ngược')
                  : (language === 'en' ? '↑ Upright' : '↑ Lá Xuôi')}
              </span>
              <h3
                className="daily-card-name"
                onClick={() => setLearnCard(dailyCard)}
                style={{ cursor: 'pointer' }}
                title={language === 'en' ? 'Click to learn' : 'Chạm để tra cứu'}
              >
                {dailyCard.name}
              </h3>
              <p className="daily-card-type">
                {dailyCard.arcana} Arcana{dailyCard.suit ? ` • ${dailyCard.suit}` : ''}
              </p>

              {/* Keywords */}
              <div className="daily-card-keywords">
                {(dailyCard.orientation === 'reversed'
                  ? dailyCard.reversedKeywords
                  : dailyCard.uprightKeywords
                )?.slice(0, 3).map((kw, i) => (
                  <span key={i} className="daily-keyword-tag">{kw}</span>
                ))}
              </div>

              {/* Daily insight */}
              {showInsight && dailyInsight && (
                <div className="daily-insight-box">
                  <h4 className="daily-insight-title">
                    {language === 'en' ? '🌅 Today\'s Message' : '🌅 Thông điệp hôm nay'}
                  </h4>
                  <p className="daily-insight-text">{dailyInsight}</p>
                </div>
              )}

              {/* CTA Tap-to-learn button */}
              <button
                type="button"
                onClick={() => setLearnCard(dailyCard)}
                style={{
                  marginTop: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'rgba(229, 193, 88, 0.12)',
                  border: '1px solid rgba(229, 193, 88, 0.35)',
                  color: 'var(--gold-color, #e5c158)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  transition: 'all 0.2s',
                }}
              >
                <span>🔍</span>
                <span>{language === 'en' ? 'Tap to Learn Card Meaning' : 'Tra cứu ý nghĩa lá bài'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tap-to-learn Modal for Daily Card */}
      <TarotLearnModal
        card={learnCard}
        onClose={() => setLearnCard(null)}
        language={language}
      />

      {/* Stats Bar */}
      {totalReadings > 0 && (
        <div className="daily-stats-bar">
          <div className="daily-stat">
            <span className="daily-stat-icon">🃏</span>
            <span className="daily-stat-value">{totalReadings}</span>
            <span className="daily-stat-label">
              {language === 'en' ? 'Total Readings' : 'Tổng lượt xem'}
            </span>
          </div>
          <div className="daily-stat">
            <span className="daily-stat-icon">🔥</span>
            <span className="daily-stat-value">{streak}</span>
            <span className="daily-stat-label">
              {language === 'en' ? 'Current Streak' : 'Streak hiện tại'}
            </span>
          </div>
          <div className="daily-stat">
            <span className="daily-stat-icon">🏆</span>
            <span className="daily-stat-value">{longestStreak}</span>
            <span className="daily-stat-label">
              {language === 'en' ? 'Best Streak' : 'Kỷ lục'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
