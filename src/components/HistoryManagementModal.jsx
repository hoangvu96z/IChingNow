import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function HistoryManagementModal({
  isOpen,
  onClose,
  history = [],
  onSelect,
  onDeleteMultiple,
  onClearAll,
}) {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Format title helper
  const formatHistoryTitle = (item) => {
    const getHexName = (hex) => {
      if (!hex) return '';
      return language === 'en' ? t(`hex.name.${hex.id}`, hex.nameVi) : hex.nameVi;
    };

    const data = item.data;
    if (!data) return item.title || '';
    const primaryName = getHexName(data.primaryHexagram);
    const changedName = getHexName(data.changedHexagram);

    if (item.type === 'luc-hao') {
      return `${primaryName}${changedName ? ' ➔ ' + changedName : ''}`;
    } else {
      const chuLabel = language === 'en' ? 'Primary' : 'Chủ';
      const bienLabel = language === 'en' ? 'Changed' : 'Biến';
      return `${primaryName} (${chuLabel}) ➔ ${changedName} (${bienLabel})`;
    }
  };

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return isoString || '';
    }
  };

  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter((item) => {
      const title = formatHistoryTitle(item).toLowerCase();
      const question = (item.question || '').toLowerCase();
      return title.includes(term) || question.includes(term);
    });
  }, [history, searchTerm, language]);

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
      `Bạn có chắc chắn muốn xóa ${count} quẻ đã chọn không?`
    );
    if (window.confirm(confirmMsg)) {
      const itemsToDelete = history.filter((h) => selectedIds.has(h.id));
      onDeleteMultiple(itemsToDelete);
      setSelectedIds(new Set());
    }
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    const confirmMsg = t(
      'history.confirm_clear',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử gieo quẻ không?'
    );
    if (window.confirm(confirmMsg)) {
      onClearAll();
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (item) => {
    onSelect(item);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-paper-card, #fdfbf7)',
          border: '1px solid var(--color-gold, #b8860b)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          fontFamily: "'Be Vietnam Pro', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1a0a06 0%, #3d1a10 100%)',
            color: '#f5d78e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>📜</span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontFamily: "'Noto Serif', serif",
                  fontWeight: 700,
                }}
              >
                {t('history.manage_title', 'Quản lý Lịch sử Gieo Quẻ')}
              </h3>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {t('history.total_count', `Tổng số: ${history.length} quẻ`)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#f5d78e',
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
            borderBottom: '1px solid rgba(184, 134, 11, 0.15)',
            background: 'rgba(184, 134, 11, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Search box */}
          <input
            type="text"
            placeholder={t('history.search_placeholder', '🔍 Tìm kiếm theo tên quẻ hoặc câu hỏi...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(184, 134, 11, 0.3)',
              background: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Action buttons */}
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
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #c0392b',
                    background: 'rgba(192, 57, 43, 0.1)',
                    color: '#c0392b',
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
                  onClick={handleClearAll}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(192, 57, 43, 0.4)',
                    background: 'transparent',
                    color: '#c0392b',
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
                color: 'var(--color-ink-muted, #7f8c8d)',
                fontStyle: 'italic',
                fontSize: '0.9rem',
              }}
            >
              {searchTerm
                ? t('history.no_search_results', 'Không tìm thấy quẻ phù hợp')
                : t('history.empty', 'Chưa có quẻ nào trong lịch sử')}
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isChecked = selectedIds.has(item.id);
              const isLucHao = item.type === 'luc-hao';
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
                      ? '1px solid var(--color-gold, #b8860b)'
                      : '1px solid rgba(184, 134, 11, 0.15)',
                    background: isChecked
                      ? 'rgba(184, 134, 11, 0.1)'
                      : '#fff',
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
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: isLucHao ? '#c0392b' : '#1a6b4a',
                          background: isLucHao
                            ? 'rgba(192, 57, 43, 0.1)'
                            : 'rgba(26, 107, 74, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        {isLucHao
                          ? `🪙 ${t('history.luc_hao_badge', 'Lục Hào')}`
                          : `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}`}
                      </span>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#7f8c8d',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        fontFamily: "'Noto Serif', serif",
                        color: 'var(--color-ink, #2c3e50)',
                        marginBottom: 2,
                      }}
                    >
                      {formatHistoryTitle(item)}
                    </div>

                    {item.question && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#7f8c8d',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.question === '(Không có câu hỏi)'
                          ? t('history.no_question', '(Không có câu hỏi)')
                          : item.question}
                      </div>
                    )}
                  </div>

                  {/* View action button */}
                  <button
                    onClick={() => handleSelectItem(item)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(184, 134, 11, 0.3)',
                      background: 'rgba(184, 134, 11, 0.08)',
                      color: 'var(--color-ink, #2c3e50)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {t('history.view_btn', 'Xem quẻ')} ➔
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
