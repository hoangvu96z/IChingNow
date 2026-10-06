import React, { useState, useEffect } from 'react';
import { getMeaningField } from '../utils/tarotLogic';

const SUIT_ELEMENTS = {
  Wands: { elementVi: 'Lửa (Hành Động, Đam Mê)', elementEn: 'Fire (Action, Passion)', icon: '🔥', color: '#ff6b4a' },
  Cups: { elementVi: 'Nước (Cảm Xúc, Trực Giác)', elementEn: 'Water (Emotion, Intuition)', icon: '💧', color: '#4aa3ff' },
  Swords: { elementVi: 'Khí (Trí Tuệ, Thử Thách)', elementEn: 'Air (Intellect, Challenge)', icon: '💨', color: '#9fc2e6' },
  Pentacles: { elementVi: 'Đất (Vật Chất, Thịnh Vượng)', elementEn: 'Earth (Material, Wealth)', icon: '🪙', color: '#e5c158' },
};

/**
 * TarotLearnModal — Tap-to-learn popup chi tiết cho lá bài Tarot
 * Cho phép chuyển đổi Xuôi/Ngược và xem giải nghĩa theo 4 khía cạnh: Tổng quan, Tình cảm, Sự nghiệp, Tài chính.
 */
export default function TarotLearnModal({ card, onClose, language = 'vi' }) {
  const [currentOrientation, setCurrentOrientation] = useState(card?.orientation || 'upright');
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'love' | 'career' | 'money'

  useEffect(() => {
    if (card?.orientation) {
      setCurrentOrientation(card.orientation);
    }
  }, [card]);

  useEffect(() => {
    if (!card) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  const isEn = language === 'en';
  const isReversed = currentOrientation === 'reversed';
  const elementInfo = card.suit ? SUIT_ELEMENTS[card.suit] : null;

  // Lấy giải nghĩa theo từng lĩnh vực từ card.meanings hoặc helper
  const generalMeaning = isReversed
    ? (card.meanings?.general_reversed || card.reversedKeywords?.join(', ') || '')
    : (card.meanings?.general_upright || card.uprightKeywords?.join(', ') || '');

  const loveMeaning = getMeaningField(card, 'love', currentOrientation) ||
    (isEn ? 'Focus on balance and emotional honesty in romantic affairs.' : 'Tập trung vào sự chân thành và thấu hiểu cảm xúc trong tình cảm.');

  const careerMeaning = getMeaningField(card, 'career', currentOrientation) ||
    (isEn ? 'Look for opportunities to grow and demonstrate leadership.' : 'Tìm kiếm cơ hội bứt phá và giữ vững lập trường công việc.');

  const moneyMeaning = getMeaningField(card, 'money', currentOrientation) ||
    (isEn ? 'Manage resources prudently and avoid impulsive expenses.' : 'Quản lý tài chính cẩn trọng, đề phòng chi tiêu bộc phát.');

  const activeMeaningText = activeTab === 'general' ? generalMeaning
    : activeTab === 'love' ? loveMeaning
    : activeTab === 'career' ? careerMeaning
    : moneyMeaning;

  const keywords = isReversed ? (card.reversedKeywords || []) : (card.uprightKeywords || []);

  const tabs = [
    { id: 'general', label: isEn ? '📖 Overview' : '📖 Tổng quan' },
    { id: 'love',    label: isEn ? '❤️ Love' : '❤️ Tình cảm' },
    { id: 'career',  label: isEn ? '💼 Career' : '💼 Sự nghiệp' },
    { id: 'money',   label: isEn ? '💰 Finance' : '💰 Tài chính' },
  ];

  return (
    <div
      role="presentation"
      className="card-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(7, 4, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'tarotFadeIn 0.2s ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={card.name}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(165deg, #17132e 0%, #0d0a1a 100%)',
          border: '1px solid rgba(229, 193, 88, 0.45)',
          borderRadius: 20,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(229, 193, 88, 0.15)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) 1fr',
          animation: 'tarotZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="tarot-learn-modal-grid"
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? 'Close' : 'Đóng'}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
        >
          ×
        </button>

        {/* Cột trái: Hình ảnh lá bài + nút toggle xuôi/ngược */}
        <div style={{
          padding: '24px 20px',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid rgba(229, 193, 88, 0.15)',
          gap: 14,
        }}>
          <div style={{
            position: 'relative',
            width: 170,
            height: 290,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(229, 193, 88, 0.2)',
            border: '1.5px solid rgba(229, 193, 88, 0.5)',
            transition: 'transform 0.4s ease',
            transform: isReversed ? 'rotate(180deg)' : 'none',
          }}>
            <img
              src={import.meta.env.BASE_URL + card.image.replace(/^\//, '')}
              alt={card.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Toggle Xuôi / Ngược để học bài */}
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.4)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
          }}>
            <button
              type="button"
              onClick={() => setCurrentOrientation('upright')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 7,
                border: 'none',
                background: !isReversed ? 'rgba(229, 193, 88, 0.85)' : 'transparent',
                color: !isReversed ? '#120d24' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ↑ {isEn ? 'Upright' : 'Lá Xuôi'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentOrientation('reversed')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 7,
                border: 'none',
                background: isReversed ? 'rgba(240, 98, 146, 0.85)' : 'transparent',
                color: isReversed ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ↕ {isEn ? 'Reversed' : 'Lá Ngược'}
            </button>
          </div>
        </div>

        {/* Cột phải: Thông tin học bài */}
        <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header Info */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              color: 'rgba(229, 193, 88, 0.9)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
            }}>
              <span>{card.arcana} Arcana</span>
              {card.suit && <span>• {card.suit}</span>}
              {elementInfo && <span>• {elementInfo.icon} {isEn ? elementInfo.elementEn : elementInfo.elementVi}</span>}
            </div>

            <h2 style={{
              margin: 0,
              fontFamily: "'Playfair Display', serif, Georgia",
              fontSize: '1.65rem',
              color: '#fff',
              letterSpacing: '0.02em',
            }}>
              {card.name}
            </h2>
          </div>

          {/* Badge trạng thái */}
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 700,
              background: isReversed ? 'rgba(240, 98, 146, 0.15)' : 'rgba(229, 193, 88, 0.15)',
              border: `1px solid ${isReversed ? 'rgba(240, 98, 146, 0.4)' : 'rgba(229, 193, 88, 0.4)'}`,
              color: isReversed ? '#f48fb1' : '#e5c158',
            }}>
              {isReversed ? '↕ ' + (isEn ? 'Reversed Position' : 'Chiều Ngược') : '↑ ' + (isEn ? 'Upright Position' : 'Chiều Xuôi')}
            </span>
          </div>

          {/* Keywords tags */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
              {isEn ? 'Keywords' : 'Từ khóa trọng tâm'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2dff0',
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Meaning Tabs */}
          <div>
            <div style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: 10,
              overflowX: 'auto',
            }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--gold-color, #e5c158)' : '2px solid transparent',
                      color: isActive ? 'var(--gold-color, #e5c158)' : 'rgba(255, 255, 255, 0.6)',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content of active tab */}
            <div style={{
              fontSize: '0.9rem',
              lineHeight: 1.65,
              color: 'rgba(240, 235, 255, 0.92)',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              minHeight: 70,
            }}>
              {activeMeaningText}
            </div>
          </div>

          {/* Tarot Advice Box */}
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(229, 193, 88, 0.08)',
            border: '1px solid rgba(229, 193, 88, 0.25)',
            fontSize: '0.825rem',
            lineHeight: 1.5,
            color: '#f0e6d2',
          }}>
            💡 <strong style={{ color: 'var(--gold-color, #e5c158)' }}>
              {isEn ? 'Deck Trivia & Archetype:' : 'Đặc tính & Điển mẫu:'}
            </strong>{' '}
            {isEn
              ? `Card #${card.number} of Rider-Waite 78 cards. Symbolizes the journey of soul evolution.`
              : `Lá bài số ${card.number} trong bộ Rider-Waite 78 lá. Tượng trưng cho chặng đường chuyển hóa nhận thức.`}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tarotFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tarotZoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 600px) {
          .tarot-learn-modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
