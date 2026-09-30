import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useStreak } from '@shared/utils/useStreak.js';

export default function DailyStreakBar({ onStartDailyCast, hasActiveResult }) {
  const { language } = useLanguage();
  const { streak, longestStreak, totalReadings, streakFreezeUsed } = useStreak('iching');

  const now = new Date();
  const hour = now.getHours();

  let greeting = '';
  let subGreeting = '';

  if (language === 'vi') {
    if (hour >= 5 && hour < 12) {
      greeting = 'Chào buổi sáng';
      subGreeting = 'Gieo quẻ đầu ngày để tâm tĩnh, trí sáng và vạn sự hanh thông.';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Chào buổi chiều';
      subGreeting = 'Lắng đọng tâm tư, xem chiều hướng diễn tiến của sự việc trong ngày.';
    } else {
      greeting = 'Chào buổi tối';
      subGreeting = 'Chiêm nghiệm sự việc đã qua, dự liệu hanh thông cho ngày kế tiếp.';
    }
  } else {
    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
      subGreeting = 'Cast a daily hexagram for clarity, wisdom, and smooth flow.';
    } else if (hour >= 12 && hour < 18) {
      greeting = 'Good Afternoon';
      subGreeting = 'Reflect calmly on your affairs and observe the shifting tides.';
    } else {
      greeting = 'Good Evening';
      subGreeting = 'Reflect on today’s changes and prepare your inner compass for tomorrow.';
    }
  }

  const handleDailyClick = () => {
    const defaultQuestion = language === 'vi' 
      ? 'Định hướng và vận trình ngày hôm nay' 
      : 'Guidance and energy for today';
    if (onStartDailyCast) {
      onStartDailyCast(defaultQuestion);
    }
  };

  return (
    <section className="iching-streak-bar card animate-in">
      <div className="iching-streak-content">
        <div className="iching-streak-main">
          <div className="iching-streak-greeting-group">
            <div className="iching-streak-badge-row">
              <span className="iching-streak-chip iching-streak-chip-flame">
                <span className="iching-flame-icon">🔥</span>
                <strong className="iching-streak-count">{streak}</strong>
                <span>{language === 'vi' ? 'ngày liên tiếp' : 'day streak'}</span>
              </span>

              {longestStreak > 0 && (
                <span className="iching-streak-chip" title={language === 'vi' ? 'Kỷ lục chuỗi dài nhất' : 'Longest streak record'}>
                  <span>🏆</span>
                  <span>{language === 'vi' ? `Kỷ lục: ${longestStreak} ngày` : `Best: ${longestStreak}d`}</span>
                </span>
              )}

              {totalReadings > 0 && (
                <span className="iching-streak-chip iching-streak-chip-count" title={language === 'vi' ? 'Tổng số lượt gieo quẻ' : 'Total hexagram readings'}>
                  <span>📿</span>
                  <span>{language === 'vi' ? `${totalReadings} lượt gieo` : `${totalReadings} casts`}</span>
                </span>
              )}

              {streakFreezeUsed && (
                <span className="iching-streak-chip iching-streak-chip-freeze" title={language === 'vi' ? 'Đã kích hoạt bảo vệ chuỗi 1 ngày' : '1-day streak freeze active'}>
                  <span>🛡️</span>
                  <span>{language === 'vi' ? 'Bảo vệ chuỗi' : 'Streak Freeze'}</span>
                </span>
              )}
            </div>

            <h2 className="iching-streak-greeting font-title">
              {greeting} · <span className="iching-streak-date">{now.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </h2>
            <p className="iching-streak-subgreeting">
              {subGreeting}
            </p>
          </div>
        </div>

        {!hasActiveResult && (
          <div className="iching-streak-action">
            <button
              type="button"
              className="iching-daily-cast-btn"
              onClick={handleDailyClick}
              title={language === 'vi' ? 'Tự động điền câu hỏi và bắt đầu gieo quẻ ngày' : 'Auto-fill question and cast your daily hexagram'}
            >
              <span className="iching-daily-cast-icon">☯</span>
              <span>{language === 'vi' ? 'Gieo quẻ hôm nay' : 'Daily Reading'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
