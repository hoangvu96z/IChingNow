import React, { useState } from 'react';
import { castAllLines } from '../logic/castLines.js';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Panel gieo nhanh 6 hào — 1 nút CTA
 */
export default function QuickCastPanel({ onResult, disabled, algorithm = 'three-coin' }) {
  const { t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  async function handleCast() {
    if (isAnimating || disabled) return;
    setIsAnimating(true);

    // Delay nhỏ để có hiệu ứng
    await new Promise(r => setTimeout(r, 800));
    const lines = castAllLines(algorithm);
    setIsAnimating(false);
    onResult(lines);
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '24px 0',
    }}>
      {/* Mô phỏng 3 đồng xu */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`coin ${isAnimating ? 'spinning' : 'ngua'}`}
            style={{
              animationDelay: `${i * 0.1}s`,
              fontSize: '1.25rem',
            }}
          >
            {isAnimating ? '?' : '☰'}
          </div>
        ))}
      </div>

      <button
        onClick={handleCast}
        disabled={isAnimating || disabled}
        className="btn-primary btn-cta"
        style={{
          fontSize: '1.125rem',
          padding: '16px 40px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {isAnimating ? (
          <>
            <SpinIcon />
            {t('panel.casting', 'Đang gieo...')}
          </>
        ) : (
          t('panel.cast_quick_btn', '🪙 Gieo nhanh 6 hào')
        )}
      </button>

      {disabled && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', textAlign: 'center', margin: 0 }}>
          {t('panel.need_question_warning', 'Vui lòng nhập việc cần xem trước')}
        </p>
      )}

      <p style={{
        fontSize: '0.8125rem',
        color: 'var(--color-ink-muted)',
        textAlign: 'center',
        margin: 0,
        maxWidth: 280,
        lineHeight: 1.5,
      }}>
        {algorithm === 'yarrow-stalks'
          ? t('panel.alg_desc_yarrow', 'Hệ thống sẽ mô phỏng chia 49 cọng Cỏ Thi × 6 lần theo phương pháp cổ xưa của Chu Dịch.')
          : algorithm === 'equal-prob'
          ? t('panel.alg_desc_equal', 'Hệ thống sẽ gieo ngẫu nhiên 6 hào với cơ hội xuất hiện mỗi hào bằng nhau (25%).')
          : t('panel.alg_desc_three_coin', 'Hệ thống sẽ mô phỏng tung 3 đồng xu × 6 lần theo phương pháp kinh điển.')}
      </p>
    </div>
  );
}

function SpinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
      <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round"/>
    </svg>
  );
}
