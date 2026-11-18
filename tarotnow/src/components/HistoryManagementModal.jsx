import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatReadingTimestamp } from '../utils/tarotAnalytics.js';
import TarotReflectionCard from './TarotReflectionCard.jsx';
import { REFLECTION_STATUSES } from '../utils/readingMapping.js';

export default function HistoryManagementModal({
  isOpen,
  onClose,
  history = [],
  tarotCards = [],
  onSelect,
  onDeleteMultiple,
  onClearAll,
  onUpdateReflection,
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [previewId, setPreviewId] = useState(null);

  // Derive preview item live from history by id so edits never revert!
  const previewItem = useMemo(
    () => history.find((h) => String(h.id) === String(previewId)) || null,
    [history, previewId]
  );

  const formatSpreadName = useCallback((item) => {
    if (!item) return '';
    return item.spreadId
      ? t('spread.name.' + item.spreadId, item.spreadName)
      : item.spreadName === 'Tùy chỉnh' || item.spreadName === 'Custom'
      ? t('history.custom', 'Tùy chỉnh')
      : item.spreadName || 'Trải bài';
  }, [t]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter((item) => {
      const spreadName = formatSpreadName(item).toLowerCase();
      const question = (item.question || '').toLowerCase();
      return spreadName.includes(term) || question.includes(term);
    });
  }, [history, searchTerm, formatSpreadName]);

  if (!isOpen) return null;

  const isAllSelected =
    filteredHistory.length > 0 &&
    filteredHistory.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map((item) => item.id)));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmMsg = t(
      'history.confirm_delete_selected',
      `Bạn có chắc chắn muốn xóa ${count} trải bài đã chọn không?`
    );
    if (window.confirm(confirmMsg)) {
      const itemsToDelete = history.filter((h) => selectedIds.has(h.id));
      onDeleteMultiple(itemsToDelete);
      setSelectedIds(new Set());
      if (previewId && selectedIds.has(previewId)) {
        setPreviewId(null);
      }
    }
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    const confirmMsg = t(
      'history.confirm_clear',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trải bài không?'
    );
    if (window.confirm(confirmMsg)) {
      onClearAll();
      setSelectedIds(new Set());
      setPreviewId(null);
    }
  };

  const handleOpenDetail = (item) => {
    if (item?._decryptionError) return;
    setPreviewId(item.id);
  };

  return (
    <>
      {/* Live Preview & Outcome Reflection Detail Dialog */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(5, 3, 15, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setPreviewId(null)}
        >
          <div
            style={{
              background: 'var(--bg-panel, #150f2e)',
              border: '1px solid var(--border-gold)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
              overflow: 'hidden',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #090615 0%, #1a103c 100%)',
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    color: 'var(--gold-color)',
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  {formatSpreadName(previewItem)}
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {formatReadingTimestamp(previewItem.timestamp || previewItem.createdAt, language)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(229, 193, 88, 0.3)',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  color: 'var(--gold-color)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Detail Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {previewItem.question && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(229, 193, 88, 0.08)',
                    border: '1px solid rgba(229, 193, 88, 0.25)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  "{previewItem.question}"
                </div>
              )}

              {/* Cards list */}
              {previewItem.cards && previewItem.cards.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--gold-color)',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {isEn ? 'Cards in Spread' : 'Các lá bài trong trải'} ({previewItem.cards.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {previewItem.cards.map((cHist, idx) => {
                      const card = tarotCards.find((tc) => tc.id === cHist.id);
                      const cardNameTrans = card ? card.name : cHist.name;
                      const isRev = cHist.orientation === 'reversed';
                      return (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: isRev ? 'rgba(235, 94, 85, 0.12)' : 'rgba(229, 193, 88, 0.12)',
                            border: isRev ? '1px solid rgba(235, 94, 85, 0.3)' : '1px solid var(--border-gold)',
                            color: isRev ? 'var(--accent-red)' : 'var(--gold-color)',
                          }}
                        >
                          #{idx + 1} {cardNameTrans} {isRev ? '↓' : '↑'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Embedded TarotReflectionCard */}
              <TarotReflectionCard
                compact
                readingId={previewItem.id}
                reading={previewItem}
                onSaveReflection={onUpdateReflection}
                language={language}
              />
            </div>

            {/* Detail Footer Actions */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--border-gold)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                disabled={Boolean(previewItem._decryptionError)}
                onClick={() => {
                  if (onSelect) onSelect(previewItem);
                  onClose();
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--gold-color)',
                  background: 'linear-gradient(135deg, rgba(229,193,88,0.25), rgba(184,134,11,0.4))',
                  color: 'var(--gold-color)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: previewItem._decryptionError ? 'not-allowed' : 'pointer',
                  opacity: previewItem._decryptionError ? 0.5 : 1,
                }}
              >
                🔮 {isEn ? 'Restore this reading' : 'Mở lại trải bài này'} ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main History Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(5, 3, 15, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          boxSizing: 'border-box',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-gold)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 680,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
            color: 'var(--text-primary)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #090615 0%, #1a103c 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.25rem' }}>🎴</span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    color: '#e5c158',
                  }}
                >
                  {t('history.manage_title', 'Quản lý Lịch sử Trải Bài')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                  {t('history.total_count', `Tổng số: ${history.length} lần trải bài`)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(229,193,88,0.25)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: '#e5c158',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Toolbar: Search + Bulk Actions */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-gold)',
              background: 'rgba(229, 193, 88, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Search box */}
            <input
              type="text"
              placeholder={t(
                'history.search_placeholder',
                '🔍 Tìm kiếm theo tên bài hoặc câu hỏi...'
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-gold)',
                background: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Action toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--gold-color)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  disabled={filteredHistory.length === 0}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                {t('history.select_all', 'Chọn tất cả')} ({filteredHistory.length})
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--accent-red)',
                      background: 'rgba(235, 94, 85, 0.12)',
                      color: 'var(--accent-red)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    🗑️ {t('history.delete_selected', `Xóa (${selectedIds.size}) mục`)}
                  </button>
                )}

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(235, 94, 85, 0.4)',
                      background: 'transparent',
                      color: 'var(--accent-red)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⚠️ {t('history.clear_all', 'Xóa tất cả')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {filteredHistory.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                }}
              >
                {searchTerm
                  ? t('history.no_search_results', 'Không tìm thấy bài trải phù hợp')
                  : t('history.empty', 'Chưa có trải bài nào được lưu')}
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isChecked = selectedIds.has(item.id);
                const spreadName = formatSpreadName(item);

                // Check outcome reflection status badge
                const reflectionStatus =
                  item.verificationStatus || item.data?.verificationStatus || '';
                const statusMeta = REFLECTION_STATUSES.find((s) => s.id === reflectionStatus);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isChecked
                        ? '1px solid var(--gold-color)'
                        : '1px solid var(--border-gold)',
                      background: isChecked
                        ? 'rgba(229, 193, 88, 0.12)'
                        : 'var(--bg-color)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelectOne(item.id)}
                      style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
                    />

                    {/* Info Column */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        cursor: !item._decryptionError ? 'pointer' : 'default',
                      }}
                      onClick={() => handleOpenDetail(item)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: 'var(--gold-color)',
                              fontFamily: "'Cinzel', serif",
                            }}
                          >
                            {spreadName}
                          </span>
                          {statusMeta && statusMeta.id !== 'pending' && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: statusMeta.color,
                                background: statusMeta.bg,
                                border: `1px solid ${statusMeta.border}`,
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              {isEn ? statusMeta.labelEn : statusMeta.labelVi}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {formatReadingTimestamp(item.timestamp || item.createdAt, language)}
                        </span>
                      </div>

                      {item.question && (
                        <p
                          style={{
                            margin: '0 0 6px 0',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            fontStyle: 'italic',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          "{item.question}"
                        </p>
                      )}

                      {item._decryptionError && (
                        <div role="status" style={{ margin: '0 0 6px', color: 'var(--accent-red)', fontSize: '0.72rem', fontWeight: 600 }}>
                          ⚠ Không giải mã được dữ liệu cũ · chỉ đọc
                        </div>
                      )}

                      {/* Cards Badges */}
                      {item.cards && item.cards.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 4,
                          }}
                        >
                          {item.cards.map((cHist, idx) => {
                            const card = tarotCards.find((tc) => tc.id === cHist.id);
                            const cardNameTrans = card ? card.name : cHist.name;
                            return (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background:
                                    cHist.orientation === 'reversed'
                                      ? 'rgba(235, 94, 85, 0.12)'
                                      : 'rgba(229, 193, 88, 0.12)',
                                  border:
                                    cHist.orientation === 'reversed'
                                      ? '1px solid rgba(235, 94, 85, 0.3)'
                                      : '1px solid var(--border-gold)',
                                  color:
                                    cHist.orientation === 'reversed'
                                      ? 'var(--accent-red)'
                                      : 'var(--gold-color)',
                                }}
                              >
                                {cardNameTrans}{' '}
                                {cHist.orientation === 'reversed' ? '↓' : '↑'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
