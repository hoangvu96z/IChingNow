import { evidencePlainText } from '../logic/interpretationEvidence';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/useLanguage.js';
import OutcomeVerificationCard from './OutcomeVerificationCard.jsx';
import { VERIFICATION_META, getVerificationForReading } from '../logic/verification.js';

function getVerificationBadgeLabel(status, meta, isEn) {
  if (!isEn) return meta.shortVi;
  if (status === 'accurate') return '✅ Accurate';
  if (status === 'partial') return '🌗 Partial';
  if (status === 'different') return '🔄 Different';
  return meta.labelEn || meta.shortVi;
}

// ─── Detail Overlay Component (Module Scope to prevent remounting) ───────────
function DetailView({
  item,
  onClose,
  previewTab,
  setPreviewTab,
  formatHistoryTitle,
  formatTime,
  formatTimeShort,
  handleSelectItem,
  onUpdateVerification,
  language,
  t,
}) {
  const isEn = language === 'en';
  const conv = item?.data?.aiConversation;
  const hasAI = !!(conv?.initialInterpretation || (conv?.followUps && conv.followUps.length > 0));
  const followUpCount = conv?.followUps?.length || 0;
  const methodLabel = item.type === 'luc-hao'
      ? `☯ ${t('history.luc_hao_badge', isEn ? 'Six Lines' : 'Lục Hào')}`
      : `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}`;

  return (
    <div
      className="iching-detail-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="iching-detail-modal-title"
        className="iching-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="iching-detail-header">
          <div style={{ minWidth: 0 }}>
            <h3 id="iching-detail-modal-title" className="iching-detail-title">
              {formatHistoryTitle(item)}
            </h3>
            <div className="iching-detail-subtitle">
              {methodLabel} · {formatTime(item.timestamp)}
            </div>
          </div>
          <button
            type="button"
            className="iching-history-close"
            onClick={onClose}
            aria-label={isEn ? 'Close details' : 'Đóng chi tiết'}
          >
            ✕
          </button>
        </div>

        {item._decryptionError && (
          <div role="alert" className="iching-history-alert">
            {isEn
              ? 'Unable to decrypt legacy encrypted data. Kept read-only to protect original content; you can still delete this record.'
              : 'Không giải mã được dữ liệu mã hóa cũ. Bản ghi chỉ đọc để bảo vệ nội dung gốc; bạn vẫn có thể xóa bản ghi.'}
          </div>
        )}

        <div className="iching-detail-tabs" role="tablist">
          {[
            { key: 'info', label: isEn ? '📋 Reading Info' : '📋 Thông tin quẻ' },
            {
              key: 'ai',
              label: hasAI
                ? (isEn ? `💬 AI Conversation (${followUpCount})` : `💬 Hội thoại AI (${followUpCount} câu hỏi)`)
                : (isEn ? '💬 AI Conversation' : '💬 Hội thoại AI'),
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={previewTab === tab.key}
              onClick={() => setPreviewTab(tab.key)}
              className={`iching-detail-tab ${previewTab === tab.key ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="iching-detail-body">
          {previewTab === 'info' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {item.question && (
                <div className="iching-detail-question-box">
                  <div className="iching-detail-question-label">
                    {isEn ? 'Question / Matter' : 'Việc cần xem'}
                  </div>
                  <div className="iching-detail-question-text">
                    {item.question === '(Không có câu hỏi)'
                      ? t('history.no_question', '(Không có câu hỏi)')
                      : item.question}
                  </div>
                </div>
              )}
              <div className="iching-detail-meta-list">
                <div>
                  <strong>{isEn ? 'Time:' : 'Thời gian:'}</strong> {formatTime(item.timestamp)}
                </div>
                <div>
                  <strong>{isEn ? 'Method:' : 'Phương pháp:'}</strong>{' '}
                  {item.type === 'luc-hao'
                    ? t('history.luc_hao_badge', isEn ? 'Six Lines' : 'Lục Hào')
                    : t('history.mai_hoa_badge', 'Mai Hoa')}
                </div>
                {item.data?.caster && (
                  <div>
                    <strong>{isEn ? 'Caster:' : 'Người lập:'}</strong> {item.data.caster}
                  </div>
                )}
              </div>
              {!item._decryptionError && onUpdateVerification && (
                <OutcomeVerificationCard
                  compact
                  readingId={item.id}
                  result={item.data || item}
                  onSaveVerification={onUpdateVerification}
                />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!hasAI ? (
                <div className="iching-detail-ai-empty">
                  {isEn ? (
                    <>
                      🤖 No AI conversation has been saved for this reading yet.
                      <span style={{ fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
                        Open the reading and request an AI interpretation to save it here.
                      </span>
                    </>
                  ) : (
                    <>
                      🤖 Chưa có hội thoại AI nào được lưu cho quẻ này.
                      <span style={{ fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
                        Hãy mở lại quẻ và yêu cầu AI luận giải để lưu hội thoại.
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {conv.initialInterpretation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                        <span>{isEn ? '🤖 Initial AI Interpretation' : '🤖 Luận giải ban đầu của AI'}</span>
                        {conv.initialTimestamp && (
                          <span style={{ fontFamily: 'monospace', fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
                            🕐 {formatTimeShort(conv.initialTimestamp)}
                          </span>
                        )}
                      </div>
                      <div className="iching-detail-ai-box">
                        {evidencePlainText(conv.initialInterpretation).slice(0, 800)}
                        {evidencePlainText(conv.initialInterpretation).length > 800 ? '...' : ''}
                      </div>
                    </div>
                  )}
                  {conv.followUps && conv.followUps.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {isEn ? `💬 Follow-up Questions (${conv.followUps.length})` : `💬 Câu hỏi thêm (${conv.followUps.length})`}
                      </div>
                      {conv.followUps.map((fu, idx) => (
                        <div key={fu.id || idx} className="iching-detail-followup-item">
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-vermillion)', minWidth: 22 }}>Q{idx + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.83rem', color: 'var(--color-ink)', fontWeight: 600 }}>{fu.question}</div>
                              {fu.questionTimestamp && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                                  🕐 {formatTimeShort(fu.questionTimestamp)}
                                </div>
                              )}
                            </div>
                          </div>
                          {fu.answer && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingLeft: 22 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-jade)', minWidth: 22 }}>AI</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                                  {evidencePlainText(fu.answer).slice(0, 600)}
                                  {evidencePlainText(fu.answer).length > 600 ? '...' : ''}
                                </div>
                                {fu.answerTimestamp && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                                    🕐 {formatTimeShort(fu.answerTimestamp)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="iching-detail-footer">
          <button type="button" onClick={onClose} className="iching-detail-btn-close">
            {isEn ? 'Close' : 'Đóng'}
          </button>
          <button
            type="button"
            disabled={item._decryptionError}
            onClick={() => handleSelectItem(item)}
            className="iching-detail-btn-open"
          >
            {isEn ? '🔍 Open reading ➔' : '🔍 Mở lại quẻ này ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryManagementModal({
  isOpen,
  onClose,
  history = [],
  onSelect,
  onDeleteMultiple,
  onClearAll,
  onUpdateVerification,
  onUpdateFavorite,
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pendingFavorites, setPendingFavorites] = useState(new Set());
  const [previewItem, setPreviewItem] = useState(null);
  const [previewTab, setPreviewTab] = useState('info');
  const [actionError, setActionError] = useState('');

  const formatHistoryTitle = useCallback((item) => {
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
  }, [language, t]);

  const formatTime = (isoString) => {
    try {
      const safeStr = typeof isoString === 'string' ? isoString.replace(' ', 'T') : isoString;
      const d = new Date(safeStr);
      if (isNaN(d.getTime())) return isoString || '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch { return isoString || ''; }
  };

  const formatTimeShort = (isoString) => {
    try {
      const safeStr = typeof isoString === 'string' ? isoString.replace(' ', 'T') : isoString;
      const d = new Date(safeStr);
      if (isNaN(d.getTime())) return '';
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } catch { return ''; }
  };

  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase();
    const dateKey = (timestamp) => {
      const date = new Date(typeof timestamp === 'string' ? timestamp.replace(' ', 'T') : timestamp);
      if (Number.isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    return history.filter((item) => {
      const date = dateKey(item.timestamp);
      return (!term || `${formatHistoryTitle(item)} ${item.question || ''}`.toLocaleLowerCase().includes(term)) &&
        (typeFilter === 'all' || item.type === typeFilter) &&
        (!favoritesOnly || item.data?.favorite === true) &&
        (!dateFrom || (date && date >= dateFrom)) && (!dateTo || (date && date <= dateTo));
    }).sort((a, b) => {
      if (sortBy === 'title') return formatHistoryTitle(a).localeCompare(formatHistoryTitle(b), language);
      const time = (item) => new Date(typeof item.timestamp === 'string' ? item.timestamp.replace(' ', 'T') : item.timestamp).getTime() || 0;
      return sortBy === 'oldest' ? time(a) - time(b) : time(b) - time(a);
    });
  }, [history, searchTerm, formatHistoryTitle, dateFrom, dateTo, typeFilter, favoritesOnly, sortBy, language]);

  const handleToggleFavorite = async (item) => {
    if (!onUpdateFavorite || pendingFavorites.has(item.id)) return;
    setPendingFavorites(prev => new Set(prev).add(item.id));
    setActionError('');
    try {
      await onUpdateFavorite(item.id, !item.data?.favorite);
    } catch (error) {
      setActionError(
        error?.message || (isEn ? 'Unable to update favorite. Please try again.' : 'Không thể cập nhật yêu thích. Vui lòng thử lại.')
      );
    } finally {
      setPendingFavorites(prev => { const next = new Set(prev); next.delete(item.id); return next; });
    }
  };

  const activePreviewItem = useMemo(() => {
    if (!previewItem) return null;
    const found = history.find(
      (h) =>
        (previewItem.id && String(h.id) === String(previewItem.id)) ||
        (previewItem.data?.createdAt &&
          (h.data?.createdAt === previewItem.data.createdAt ||
            h.timestamp === previewItem.data.createdAt)) ||
        (previewItem.timestamp &&
          (h.timestamp === previewItem.timestamp ||
            h.data?.createdAt === previewItem.timestamp))
    );
    return found || previewItem;
  }, [history, previewItem]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activePreviewItem) setPreviewItem(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activePreviewItem, onClose]);

  const handleModalSaveVerification = useCallback(
    async (readingId, verificationObj, createdAtKey) => {
      if (!onUpdateVerification) return null;
      const normalized = await onUpdateVerification(readingId, verificationObj, createdAtKey);
      setPreviewItem((prev) => {
        if (!prev) return null;
        const matchesId = readingId && String(prev.id) === String(readingId);
        const matchesCreatedAt =
          createdAtKey &&
          (prev.data?.createdAt === createdAtKey ||
            prev.timestamp === createdAtKey ||
            prev.createdAt === createdAtKey);
        if (!matchesId && !matchesCreatedAt) return prev;
        return {
          ...prev,
          verification: normalized,
          data: prev.data ? { ...prev.data, verification: normalized } : prev.data,
        };
      });
      return normalized;
    },
    [onUpdateVerification]
  );

  if (!isOpen) return null;

  const activeFilterCount = [
    typeFilter !== 'all',
    Boolean(dateFrom),
    Boolean(dateTo),
    sortBy !== 'newest',
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    dateFrom ||
    dateTo ||
    typeFilter !== 'all' ||
    favoritesOnly ||
    sortBy !== 'newest'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
    setFavoritesOnly(false);
    setSortBy('newest');
  };

  const isAllSelected =
    filteredHistory.length > 0 &&
    filteredHistory.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredHistory.forEach(item => isAllSelected ? next.delete(item.id) : next.add(item.id));
      return next;
    });
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmMsg = t(
      'history.confirm_delete_selected',
      isEn
        ? `Are you sure you want to delete ${count} selected reading(s)?`
        : `Bạn có chắc chắn muốn xóa ${count} quẻ đã chọn không?`
    );
    if (window.confirm(confirmMsg)) {
      setActionError('');
      try {
        await onDeleteMultiple(history.filter((h) => selectedIds.has(h.id)));
        setSelectedIds(new Set());
        setPreviewItem(null);
      } catch (error) {
        if (Array.isArray(error?.failedIds)) setSelectedIds(new Set(error.failedIds));
        setActionError(
          error?.message ||
          (isEn
            ? 'Unable to delete selected readings. Remaining records were kept.'
            : 'Không thể xóa các bản ghi. Những bản ghi chưa xóa vẫn được giữ lại.')
        );
      }
    }
  };

  const handleClearAll = async () => {
    if (history.length === 0) return;
    const confirmMsg = t(
      'history.confirm_clear',
      isEn
        ? 'Are you sure you want to clear your entire casting history?'
        : 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử gieo quẻ không?'
    );
    if (window.confirm(confirmMsg)) {
      setActionError('');
      try {
        await onClearAll();
        setSelectedIds(new Set());
        setPreviewItem(null);
      } catch (error) {
        setActionError(
          error?.message ||
          (isEn
            ? 'Unable to clear history. Your records were kept.'
            : 'Không thể xóa lịch sử. Dữ liệu vẫn được giữ lại.')
        );
      }
    }
  };

  const handleSelectItem = (item) => {
    if (item?._decryptionError) {
      setActionError(
        isEn
          ? 'Cannot open this reading because legacy encrypted data could not be decrypted with the current account. Kept read-only.'
          : 'Không thể mở bản ghi này vì dữ liệu mã hóa cũ không giải mã được với tài khoản hiện tại. Bản ghi được giữ nguyên ở chế độ chỉ đọc.'
      );
      return;
    }
    setActionError('');
    onSelect(item);
    onClose();
  };

  const handlePreviewItem = (item, e) => {
    e.stopPropagation();
    setPreviewItem(item);
    setPreviewTab('info');
  };

  const countPillLabel = filteredHistory.length !== history.length
    ? `${filteredHistory.length} / ${history.length}`
    : `${history.length} ${isEn ? (history.length === 1 ? 'reading' : 'readings') : 'quẻ'}`;

  return (
    <>
      {activePreviewItem && (
        <DetailView
          item={activePreviewItem}
          onClose={() => setPreviewItem(null)}
          previewTab={previewTab}
          setPreviewTab={setPreviewTab}
          formatHistoryTitle={formatHistoryTitle}
          formatTime={formatTime}
          formatTimeShort={formatTimeShort}
          handleSelectItem={handleSelectItem}
          onUpdateVerification={handleModalSaveVerification}
          language={language}
          t={t}
        />
      )}

      <div className="iching-history-backdrop" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="iching-history-modal-title"
          className="iching-history-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="iching-history-header">
            <div className="iching-history-header-main">
              <span className="iching-history-header-icon" aria-hidden="true">📜</span>
              <div style={{ minWidth: 0 }}>
                <div className="iching-history-title-row">
                  <h3 id="iching-history-modal-title" className="iching-history-title">
                    {t('history.manage_title', isEn ? 'Reading History' : 'Quản lý Lịch sử Gieo Quẻ')}
                  </h3>
                  <span className="iching-history-count-pill">{countPillLabel}</span>
                </div>
                <div className="iching-history-subtitle">
                  {t(
                    'history.total_count',
                    isEn ? `Total: ${history.length} saved readings` : `Tổng số: ${history.length} quẻ`
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="iching-history-close"
              aria-label={isEn ? 'Close history modal' : 'Đóng quản lý lịch sử'}
            >
              ✕
            </button>
          </div>

          {actionError && (
            <div role="alert" className="iching-history-alert">
              {actionError}
            </div>
          )}

          <div className="iching-history-toolbar">
            <div className="iching-history-search-row">
              <div className="iching-history-search-wrap">
                <span className="iching-history-search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="iching-history-search-input"
                  placeholder={t(
                    'history.search_placeholder',
                    isEn ? 'Search by hexagram or question...' : 'Tìm kiếm theo tên quẻ hoặc câu hỏi...'
                  )}
                  aria-label={isEn ? 'Search reading history' : 'Tìm kiếm lịch sử gieo quẻ'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm.length > 0 && (
                  <button
                    type="button"
                    className="iching-history-search-clear"
                    onClick={() => setSearchTerm('')}
                    aria-label={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`iching-history-fav-pill ${favoritesOnly ? 'is-active' : ''}`}
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly((prev) => !prev)}
              >
                <span aria-hidden="true">★</span>
                <span>{isEn ? 'Favorites' : 'Yêu thích'}</span>
              </button>

              <button
                type="button"
                className={`iching-history-filter-toggle ${mobileFiltersOpen || activeFilterCount > 0 ? 'is-active' : ''}`}
                aria-expanded={mobileFiltersOpen}
                aria-controls="iching-history-filters-panel"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
              >
                <span aria-hidden="true">🎛️</span>
                <span>{isEn ? 'Filter' : 'Lọc'}</span>
                {activeFilterCount > 0 && (
                  <span className="iching-history-filter-badge">{activeFilterCount}</span>
                )}
              </button>
            </div>

            <div
              id="iching-history-filters-panel"
              className={`iching-history-filters ${mobileFiltersOpen ? 'is-open' : ''}`}
            >
              <div className="iching-history-filter-group">
                <span className="iching-history-filter-label">
                  {isEn ? 'Method' : 'Loại quẻ'}
                </span>
                <div
                  className="iching-history-segmented"
                  role="group"
                  aria-label={isEn ? 'Filter by reading method' : 'Lọc theo loại quẻ'}
                >
                  {[
                    { value: 'all', label: isEn ? 'All' : 'Tất cả' },
                    { value: 'luc-hao', label: `☯ ${t('history.luc_hao_badge', isEn ? 'Six Lines' : 'Lục Hào')}` },
                    { value: 'mai-hoa', label: `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}` },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={typeFilter === opt.value}
                      onClick={() => setTypeFilter(opt.value)}
                      className={`iching-history-seg-btn ${typeFilter === opt.value ? 'is-active' : ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="iching-history-filter-group">
                <span className="iching-history-filter-label">{isEn ? 'From' : 'Từ ngày'}</span>
                <input
                  type="date"
                  className="iching-history-control"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>

              <label className="iching-history-filter-group">
                <span className="iching-history-filter-label">{isEn ? 'To' : 'Đến ngày'}</span>
                <input
                  type="date"
                  className="iching-history-control"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>

              <label className="iching-history-filter-group">
                <span className="iching-history-filter-label">{isEn ? 'Sort' : 'Sắp xếp'}</span>
                <select
                  className="iching-history-control"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">{isEn ? 'Newest' : 'Mới nhất'}</option>
                  <option value="oldest">{isEn ? 'Oldest' : 'Cũ nhất'}</option>
                  <option value="title">{isEn ? 'Hexagram A–Z' : 'Tên quẻ A–Z'}</option>
                </select>
              </label>

              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                className={`iching-history-reset-btn ${hasActiveFilters ? 'is-active' : ''}`}
              >
                {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
              </button>
            </div>

            <div className="iching-history-bulk-bar">
              <label className="iching-history-select-all">
                <input
                  type="checkbox"
                  className="iching-history-checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  disabled={filteredHistory.length === 0}
                />
                <span>
                  {t('history.select_all', isEn ? 'Select all' : 'Chọn tất cả')} ({filteredHistory.length}) ·{' '}
                  {isEn ? `${selectedIds.size} selected` : `Đã chọn ${selectedIds.size}`}
                </span>
              </label>
              <div className="iching-history-bulk-actions">
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="iching-history-danger-btn is-solid"
                  >
                    🗑️ {t('history.delete_selected', isEn ? `Delete (${selectedIds.size})` : `Xóa (${selectedIds.size})`)}
                  </button>
                )}
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="iching-history-danger-btn"
                  >
                    ⚠️ {t('history.clear_all', isEn ? 'Clear all' : 'Xóa tất cả')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="iching-history-list">
            {filteredHistory.length === 0 ? (
              <div className="iching-history-empty">
                <span className="iching-history-empty-icon" aria-hidden="true">
                  {history.length ? '🔎' : '📜'}
                </span>
                <span>
                  {history.length
                    ? t('history.no_search_results', isEn ? 'No matching readings found' : 'Không tìm thấy quẻ phù hợp')
                    : t('history.empty', isEn ? 'No saved castings yet' : 'Chưa có quẻ nào trong lịch sử')}
                </span>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isChecked = selectedIds.has(item.id);
                const isFavorited = item.data?.favorite === true;
                const isLucHao = item.type === 'luc-hao';
                const hasAI = !!(item.data?.aiConversation?.initialInterpretation || (item.data?.aiConversation?.followUps?.length > 0));
                const followUpCount = item.data?.aiConversation?.followUps?.length || 0;
                const titleText = formatHistoryTitle(item);
                const ver = item.verification || getVerificationForReading(item.id, item.data);

                return (
                  <div
                    key={item.id}
                    className={`iching-history-card ${isFavorited ? 'is-favorited' : ''} ${isChecked ? 'is-checked' : ''}`}
                  >
                    <div className="iching-history-card-controls">
                      <input
                        type="checkbox"
                        className="iching-history-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectOne(item.id)}
                        aria-label={isEn ? `Select ${titleText}` : `Chọn ${titleText}`}
                      />

                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        disabled={pendingFavorites.has(item.id) || item._decryptionError || !onUpdateFavorite}
                        aria-label={
                          isFavorited
                            ? (isEn ? 'Remove from favorites' : 'Bỏ yêu thích')
                            : (isEn ? 'Add to favorites' : 'Đánh dấu yêu thích')
                        }
                        aria-pressed={isFavorited}
                        title={
                          item._decryptionError
                            ? (isEn ? 'Cannot update undecryptable record' : 'Không thể cập nhật bản ghi không giải mã được')
                            : isFavorited
                              ? (isEn ? 'Remove from favorites' : 'Bỏ yêu thích')
                              : (isEn ? 'Add to favorites' : 'Đánh dấu yêu thích')
                        }
                        className={`iching-history-star-btn ${isFavorited ? 'is-favorited' : ''}`}
                      >
                        {isFavorited ? '★' : '☆'}
                      </button>
                    </div>

                    <div className="iching-history-card-body" onClick={() => handleSelectItem(item)}>
                      <div className="iching-history-card-meta">
                        <div className="iching-history-card-badges">
                          <span className={`iching-history-method-badge ${isLucHao ? 'is-luc-hao' : 'is-mai-hoa'}`}>
                            {isLucHao
                                ? `☯ ${t('history.luc_hao_badge', isEn ? 'Six Lines' : 'Lục Hào')}`
                                : `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}`}
                          </span>
                          {hasAI && (
                            <span className="iching-history-ai-badge">
                              💬 AI{followUpCount > 0 ? ` +${followUpCount}` : ''}
                            </span>
                          )}
                          {ver && ver.status !== 'pending' && (() => {
                            const meta = VERIFICATION_META[ver.status];
                            if (!meta) return null;
                            return (
                              <span
                                className="iching-history-ver-badge"
                                style={{
                                  color: meta.color,
                                  background: meta.bg,
                                  border: `1px solid ${meta.border}`,
                                }}
                              >
                                {getVerificationBadgeLabel(ver.status, meta, isEn)}
                                {ver.actualDate ? ` (${ver.actualDate})` : ''}
                              </span>
                            );
                          })()}
                        </div>
                        <span className="iching-history-time">{formatTime(item.timestamp)}</span>
                      </div>

                      <div className="iching-history-card-title">{titleText}</div>

                      {item._decryptionError && (
                        <div role="status" className="iching-history-decrypt-warn">
                          {isEn
                            ? '⚠ Unable to decrypt legacy data · read-only'
                            : '⚠ Không giải mã được dữ liệu cũ · chỉ đọc'}
                        </div>
                      )}

                      {item.question && (
                        <div className="iching-history-card-question">
                          {item.question === '(Không có câu hỏi)'
                            ? t('history.no_question', '(Không có câu hỏi)')
                            : item.question}
                        </div>
                      )}
                    </div>

                    <div className="iching-history-card-actions">
                      <button
                        type="button"
                        onClick={(e) => handlePreviewItem(item, e)}
                        className="iching-history-btn-detail"
                      >
                        👁 {isEn ? 'Details' : 'Chi tiết'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className={`iching-history-btn-open ${item._decryptionError ? 'is-readonly' : ''}`}
                      >
                        {t('history.view_btn', isEn ? 'Open' : 'Xem quẻ')} ➔
                      </button>
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
