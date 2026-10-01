import React, { useState } from 'react';
import { SPREADS } from '../utils/tarotLogic';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { id: 'all',          label: 'Tất cả',       labelEn: 'All',          icon: '✨' },
  { id: 'quick',        label: 'Nhanh',         labelEn: 'Quick',        icon: '⚡' },
  { id: 'classic',      label: 'Kinh điển',     labelEn: 'Classic',      icon: '🏛️' },
  { id: 'decision',     label: 'Quyết định',    labelEn: 'Decision',     icon: '🎯' },
  { id: 'relationship', label: 'Tình cảm',      labelEn: 'Love',         icon: '💑' },
  { id: 'career',       label: 'Sự nghiệp',     labelEn: 'Career',       icon: '💼' },
  { id: 'insight',      label: 'Nội tâm',       labelEn: 'Insight',      icon: '💡' },
  { id: 'custom',       label: 'Tùy chỉnh',     labelEn: 'Custom',       icon: '🎨' },
];

export default function SpreadSelector({ activeSpread, onSpreadChange, disabled }) {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  const currentSpread = SPREADS.find(s => s.id === activeSpread) || SPREADS[0];
  const filteredSpreads = activeCategory === 'all'
    ? SPREADS
    : SPREADS.filter(s => (s.category || 'classic') === activeCategory);

  const handleSelect = (spreadId) => {
    onSpreadChange(spreadId);
    setIsOpen(false);
  };

  return (
    <div className="spread-selector-wrapper" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(229,193,88,0.06)',
          border: `1px solid ${isOpen ? 'rgba(229,193,88,0.6)' : 'rgba(229,193,88,0.2)'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          transition: 'all 0.2s',
          textAlign: 'left',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>{currentSpread.icon || '🃏'}</span>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#e5c158', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSpread.name}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            {currentSpread.count} {language === 'en' ? 'card(s)' : 'lá'} · {currentSpread.positions.length > 0 ? currentSpread.positions.slice(0,2).join(' · ') + (currentSpread.positions.length > 2 ? '...' : '') : (language === 'en' ? 'Custom' : 'Tự chọn')}
          </div>
        </div>
        <span style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.4)',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
          flexShrink: 0,
        }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 99,
            background: 'rgba(18, 14, 35, 0.98)',
            border: '1px solid rgba(229,193,88,0.25)',
            borderRadius: '14px',
            boxShadow: '0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(229,193,88,0.08)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}>
            {/* Category tabs */}
            <div style={{
              display: 'flex',
              gap: '2px',
              overflowX: 'auto',
              padding: '12px 12px 8px',
              scrollbarWidth: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    flexShrink: 0,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.15s',
                    background: activeCategory === cat.id ? 'rgba(229,193,88,0.18)' : 'rgba(255,255,255,0.04)',
                    color: activeCategory === cat.id ? '#e5c158' : 'rgba(255,255,255,0.45)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon} {language === 'en' ? cat.labelEn : cat.label}
                </button>
              ))}
            </div>

            {/* Spread list */}
            <div style={{
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '8px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(229,193,88,0.2) transparent',
            }}>
              {filteredSpreads.map(spread => {
                const isActive = spread.id === activeSpread;
                return (
                  <button
                    key={spread.id}
                    type="button"
                    onClick={() => handleSelect(spread.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.15s',
                      background: isActive ? 'rgba(229,193,88,0.12)' : 'transparent',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(229,193,88,0.18)' : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                      border: isActive ? '1px solid rgba(229,193,88,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {spread.icon || '🃏'}
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isActive ? '#e5c158' : '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {spread.name}
                        </span>
                        <span style={{
                          flexShrink: 0,
                          fontSize: '10px',
                          background: 'rgba(229,193,88,0.1)',
                          color: '#e5c158',
                          border: '1px solid rgba(229,193,88,0.2)',
                          borderRadius: '10px',
                          padding: '1px 8px',
                          fontWeight: 600,
                        }}>
                          {spread.count} {language === 'en' ? 'card' : 'lá'}
                        </span>
                      </div>
                      {spread.description && (
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.38)',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {spread.description}
                        </div>
                      )}
                    </div>
                    {isActive && <span style={{ color: '#e5c158', fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
