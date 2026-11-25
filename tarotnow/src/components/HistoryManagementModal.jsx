import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatReadingTimestamp, parseReadingTimestampMs } from '../utils/tarotAnalytics.js';
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
  onUpdateFavorite,
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [previewId, setPreviewId] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [spreadFilter, setSpreadFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [favoritePending, setFavoritePending] = useState(null);
  const [favoriteError, setFavoriteError] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm, dateFrom, dateTo, spreadFilter, favoritesOnly]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewId !== null) {
          setPreviewId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewId, onClose]);

  const isFavorite = (item) => Boolean(item.data?.isFavorite);

  const itemDate = (item) => {
    const ms = parseReadingTimestampMs(item);
    if (!ms) return '';
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const toggleFavorite = async (item) => {
    if (!onUpdateFavorite || favoritePending !== null || item?._decryptionError) return;
    setFavoritePending(item.id);
    setFavoriteError('');
    try {
      await onUpdateFavorite(item.id, { isFavorite: !isFavorite(item) });
    } catch {
      setFavoriteError(
        isEn ? 'Could not update favorite. Please try again.' : 'Không lưu được yêu thích. Vui lòng thử lại.'
      );
    } finally {
      setFavoritePending(null);
    }
  };

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

  const spreadOptions = useMemo(
    () => [...new Set(history.map(formatSpreadName))].sort((a, b) => a.localeCompare(b)),
    [history, formatSpreadName]
  );

  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase();
    return history
      .filter((item) => {
        const date = itemDate(item);
        return (
          (!term ||
            formatSpreadName(item).toLocaleLowerCase().includes(term) ||
            (item.question || '').toLocaleLowerCase().includes(term)) &&
          (!spreadFilter || formatSpreadName(item) === spreadFilter) &&
          (!favoritesOnly || isFavorite(item)) &&
          (!dateFrom || (date && date >= dateFrom)) &&
          (!dateTo || (date && date <= dateTo))
        );
      })
      .slice()
      .sort((a, b) => {
        if (sortOrder === 'name') return formatSpreadName(a).localeCompare(formatSpreadName(b));
        const aTime = parseReadingTimestampMs(a);
        const bTime = parseReadingTimestampMs(b);
        return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime;
      });
  }, [history, searchTerm, formatSpreadName, dateFrom, dateTo, spreadFilter, favoritesOnly, sortOrder]);

  if (!isOpen) return null;

  const activeFilterCount =
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (spreadFilter ? 1 : 0) +
    (sortOrder !== 'newest' ? 1 : 0);

  const hasAnyActiveFilter = Boolean(
    searchTerm.trim() || dateFrom || dateTo || spreadFilter || favoritesOnly || sortOrder !== 'newest'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setSpreadFilter('');
    setFavoritesOnly(false);
    setSortOrder('newest');
  };

  const isAllSelected =
    filteredHistory.length > 0 &&
    filteredHistory.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => new Set([...prev].filter((id) => !filteredHistory.some((item) => item.id === id))));
    } else {
      setSelectedIds((prev) => new Set([...prev, ...filteredHistory.map((item) => item.id)]));
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

  const handleRestoreItem = (item) => {
    if (!item || item._decryptionError) return;
    if (onSelect) onSelect(item);
    onClose();
  };

  return (
    <>
      {/* Live Preview & Outcome Reflection Detail Dialog */}
      {previewItem && (
        <div
          className="tarot-history-detail-backdrop"
          onClick={() => setPreviewId(null)}
          role="presentation"
        >
          <div
            className="tarot-history-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tarot-history-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div className="tarot-history-header">
              <div className="tarot-history-header-main">
                <span className="tarot-history-header-icon" aria-hidden="true">🔮</span>
                <div className="tarot-history-header-text">
                  <h4 id="tarot-history-detail-title" className="tarot-history-title">
                    {formatSpreadName(previewItem)}
                  </h4>
                  <span className="tarot-history-subtitle">
                    {formatReadingTimestamp(previewItem.timestamp || previewItem.createdAt, language)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="tarot-dialog-close-btn tarot-history-close"
                onClick={() => setPreviewId(null)}
                aria-label={isEn ? 'Close details' : 'Đóng chi tiết'}
              >
                ✕
              </button>
            </div>

            {/* Detail Content */}
            <div className="tarot-history-detail-body">
              {previewItem.question && (
                <div className="tarot-history-detail-question">
                  "{previewItem.question}"
                </div>
              )}

              {/* Cards list */}
              {previewItem.cards && previewItem.cards.length > 0 && (
                <div className="tarot-history-detail-cards-section">
                  <div className="tarot-history-detail-section-label">
                    {isEn ? 'Cards in Spread' : 'Các lá bài trong trải'} ({previewItem.cards.length})
                  </div>
                  <div className="tarot-history-card-badges">
                    {previewItem.cards.map((cHist, idx) => {
                      const card = tarotCards.find((tc) => tc.id === cHist.id);
                      const cardNameTrans = card ? card.name : cHist.name;
                      const isRev = cHist.orientation === 'reversed';
                      return (
                        <span
                          key={idx}
                          className={`tarot-history-card-chip is-detail${isRev ? ' is-reversed' : ''}`}
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
            <div className="tarot-history-detail-footer">
              <button
                type="button"
                className="tarot-history-action-btn"
                onClick={() => setPreviewId(null)}
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                className="tarot-history-action-btn is-primary"
                disabled={Boolean(previewItem._decryptionError)}
                onClick={() => handleRestoreItem(previewItem)}
              >
                <span aria-hidden="true">🔮</span>
                <span>{isEn ? 'Restore this reading' : 'Mở lại trải bài này'} ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main History Modal */}
      <div
        className="tarot-history-backdrop"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="tarot-history-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tarot-history-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="tarot-history-header">
            <div className="tarot-history-header-main">
              <span className="tarot-history-header-icon" aria-hidden="true">🎴</span>
              <div className="tarot-history-header-text">
                <div className="tarot-history-title-row">
                  <h3 id="tarot-history-modal-title" className="tarot-history-title">
                    {t('history.manage_title', 'Quản lý Lịch sử Trải Bài')}
                  </h3>
                  <span className="tarot-history-total-pill">
                    {history.length} {isEn ? 'readings' : 'trải bài'}
                  </span>
                </div>
                <span className="tarot-history-subtitle">
                  {t('history.total_count', `Tổng số: ${history.length} lần trải bài`)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="tarot-dialog-close-btn tarot-history-close"
              onClick={onClose}
              aria-label={isEn ? 'Close history manager' : 'Đóng quản lý lịch sử'}
            >
              ✕
            </button>
          </div>

          {/* Toolbar: Search + Filters + Bulk Actions */}
          <div className="tarot-history-toolbar">
            {/* Row 1: Search + Favorites toggle + Mobile filter toggle */}
            <div className="tarot-history-search-row">
              <div className="tarot-history-search-wrap">
                <span className="tarot-history-search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  className="tarot-history-search-input"
                  aria-label={isEn ? 'Search readings' : 'Tìm kiếm trải bài'}
                  placeholder={t(
                    'history.search_placeholder',
                    'Tìm kiếm theo tên bài hoặc câu hỏi...'
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="tarot-history-search-clear"
                    onClick={() => setSearchTerm('')}
                    aria-label={isEn ? 'Clear search' : 'Xóa từ khóa'}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`tarot-history-fav-toggle${favoritesOnly ? ' is-active' : ''}`}
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly((prev) => !prev)}
              >
                <span aria-hidden="true">{favoritesOnly ? '★' : '☆'}</span>
                <span>{isEn ? 'Favorites' : 'Yêu thích'}</span>
              </button>

              <button
                type="button"
                className={`tarot-history-filter-toggle-btn${showFiltersMobile ? ' is-active' : ''}`}
                aria-expanded={showFiltersMobile}
                onClick={() => setShowFiltersMobile((prev) => !prev)}
              >
                <span aria-hidden="true">🎛️</span>
                <span>{isEn ? 'Filter' : 'Lọc'}</span>
                {activeFilterCount > 0 && (
                  <span className="tarot-history-filter-badge">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Row 2: Date range, Spread, Sort, Clear filters, Count */}
            <div className={`tarot-history-filters${showFiltersMobile ? ' is-open-mobile' : ''}`}>
              <div className="tarot-history-filter-field">
                <label htmlFor="tarot-hist-date-from" className="tarot-history-filter-label">
                  {isEn ? 'From' : 'Từ ngày'}
                </label>
                <input
                  id="tarot-hist-date-from"
                  className="tarot-history-control"
                  aria-label={isEn ? 'From date' : 'Từ ngày'}
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="tarot-history-filter-field">
                <label htmlFor="tarot-hist-date-to" className="tarot-history-filter-label">
                  {isEn ? 'To' : 'Đến ngày'}
                </label>
                <input
                  id="tarot-hist-date-to"
                  className="tarot-history-control"
                  aria-label={isEn ? 'To date' : 'Đến ngày'}
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="tarot-history-filter-field">
                <label htmlFor="tarot-hist-spread" className="tarot-history-filter-label">
                  {isEn ? 'Spread' : 'Loại trải bài'}
                </label>
                <select
                  id="tarot-hist-spread"
                  className="tarot-history-control"
                  value={spreadFilter}
                  onChange={(e) => setSpreadFilter(e.target.value)}
                >
                  <option value="">{isEn ? 'All' : 'Tất cả'}</option>
                  {spreadOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tarot-history-filter-field">
                <label htmlFor="tarot-hist-sort" className="tarot-history-filter-label">
                  {isEn ? 'Sort' : 'Sắp xếp'}
                </label>
                <select
                  id="tarot-hist-sort"
                  className="tarot-history-control"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">{isEn ? 'Newest' : 'Mới nhất'}</option>
                  <option value="oldest">{isEn ? 'Oldest' : 'Cũ nhất'}</option>
                  <option value="name">{isEn ? 'Spread name' : 'Tên trải bài'}</option>
                </select>
              </div>

              <div className="tarot-history-filter-meta">
                {hasAnyActiveFilter && (
                  <button
                    type="button"
                    className="tarot-history-reset-btn"
                    onClick={handleResetFilters}
                  >
                    ✕ {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
                  </button>
                )}
                <span className="tarot-history-count-pill" aria-live="polite">
                  {filteredHistory.length} / {history.length}
                </span>
              </div>
            </div>

            {favoriteError && (
              <div role="alert" className="tarot-history-error-banner">
                {favoriteError}
              </div>
            )}

            {/* Bulk Action Toolbar */}
            <div className="tarot-history-bulk-bar">
              <label className="tarot-history-select-all">
                <input
                  type="checkbox"
                  className="tarot-history-checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  disabled={filteredHistory.length === 0}
                />
                <span>
                  {t('history.select_all', 'Chọn tất cả')} ({filteredHistory.length})
                  {selectedIds.size > 0 && ` · ${isEn ? 'Selected' : 'Đã chọn'} ${selectedIds.size}`}
                </span>
              </label>

              <div className="tarot-history-bulk-actions">
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    className="tarot-history-danger-btn"
                    onClick={handleDeleteSelected}
                  >
                    🗑️ {t('history.delete_selected', `Xóa (${selectedIds.size})`)}
                  </button>
                )}

                {history.length > 0 && (
                  <button
                    type="button"
                    className="tarot-history-danger-btn is-outline"
                    onClick={handleClearAll}
                  >
                    ⚠️ {t('history.clear_all', 'Xóa tất cả')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="tarot-history-list">
            {filteredHistory.length === 0 ? (
              <div className="tarot-history-empty">
                <div className="tarot-history-empty-icon" aria-hidden="true">
                  {hasAnyActiveFilter ? '🔭' : '🎴'}
                </div>
                <p className="tarot-history-empty-text">
                  {hasAnyActiveFilter
                    ? t('history.no_search_results', 'Không tìm thấy bài trải phù hợp')
                    : t('history.empty', 'Chưa có trải bài nào được lưu')}
                </p>
                {hasAnyActiveFilter && (
                  <button
                    type="button"
                    className="tarot-history-reset-btn"
                    onClick={handleResetFilters}
                  >
                    ✕ {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
                  </button>
                )}
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isChecked = selectedIds.has(item.id);
                const favorited = isFavorite(item);
                const spreadName = formatSpreadName(item);
                const isPhysical = Boolean(
                  item.physicalLogged ||
                    item.data?.physicalLogged ||
                    item.physicalDeck ||
                    item.data?.physicalDeck
                );
                const hasAiConversation = Boolean(item.data?.aiConversation?.initialInterpretation);

                // Check outcome reflection status badge
                const reflectionStatus =
                  item.verificationStatus || item.data?.verificationStatus || '';
                const statusMeta = REFLECTION_STATUSES.find((s) => s.id === reflectionStatus);

                return (
                  <div
                    key={item.id}
                    className={`tarot-history-card${isChecked ? ' is-checked' : ''}${
                      favorited ? ' is-favorite' : ''
                    }${item._decryptionError ? ' is-locked' : ''}`}
                  >
                    <div className="tarot-history-card-lead">
                      <input
                        type="checkbox"
                        className="tarot-history-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectOne(item.id)}
                        aria-label={
                          isEn ? `Select ${spreadName}` : `Chọn ${spreadName}`
                        }
                      />

                      <button
                        type="button"
                        className={`tarot-history-star-btn${favorited ? ' is-active' : ''}`}
                        disabled={favoritePending !== null || item._decryptionError}
                        onClick={() => toggleFavorite(item)}
                        aria-label={
                          favorited
                            ? isEn
                              ? 'Remove favorite'
                              : 'Bỏ yêu thích'
                            : isEn
                            ? 'Add favorite'
                            : 'Đánh dấu yêu thích'
                        }
                        aria-pressed={favorited}
                        title={
                          favorited
                            ? isEn
                              ? 'Remove favorite'
                              : 'Bỏ yêu thích'
                            : isEn
                            ? 'Add favorite'
                            : 'Đánh dấu yêu thích'
                        }
                      >
                        {favorited ? '★' : '☆'}
                      </button>
                    </div>

                    {/* Info Column */}
                    <div
                      className="tarot-history-card-body"
                      onClick={() => handleOpenDetail(item)}
                    >
                      <div className="tarot-history-card-top">
                        <div className="tarot-history-card-title-group">
                          <span className="tarot-history-card-spread">{spreadName}</span>

                          {isPhysical && (
                            <span
                              className="tarot-history-meta-pill is-physical"
                              title={isEn ? 'Physical deck reading' : 'Trải bài bằng bộ bài thật'}
                            >
                              🃏 {isEn ? 'Physical' : 'Bài thật'}
                            </span>
                          )}

                          {hasAiConversation && (
                            <span
                              className="tarot-history-meta-pill is-ai"
                              title={isEn ? 'Includes AI interpretation' : 'Có luận giải AI'}
                            >
                              ✨ AI
                            </span>
                          )}

                          {statusMeta && statusMeta.id !== 'pending' && (
                            <span className={`tarot-history-reflection-badge status-${statusMeta.id}`}>
                              {isEn ? statusMeta.labelEn : statusMeta.labelVi}
                            </span>
                          )}
                        </div>

                        <span className="tarot-history-card-time">
                          {formatReadingTimestamp(item.timestamp || item.createdAt, language)}
                        </span>
                      </div>

                      {item.question && (
                        <p className="tarot-history-card-question">"{item.question}"</p>
                      )}

                      {item._decryptionError && (
                        <div role="status" className="tarot-history-decrypt-warn">
                          ⚠ Không giải mã được dữ liệu cũ · chỉ đọc
                        </div>
                      )}

                      {/* Cards Badges */}
                      {item.cards && item.cards.length > 0 && (
                        <div className="tarot-history-card-badges">
                          {item.cards.map((cHist, idx) => {
                            const card = tarotCards.find((tc) => tc.id === cHist.id);
                            const cardNameTrans = card ? card.name : cHist.name;
                            const isRev = cHist.orientation === 'reversed';
                            return (
                              <span
                                key={idx}
                                className={`tarot-history-card-chip${isRev ? ' is-reversed' : ''}`}
                              >
                                {cardNameTrans} {isRev ? '↓' : '↑'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="tarot-history-card-actions">
                      <button
                        type="button"
                        className="tarot-history-action-btn"
                        disabled={Boolean(item._decryptionError)}
                        onClick={() => handleOpenDetail(item)}
                      >
                        <span aria-hidden="true">👁</span>
                        <span>{isEn ? 'Details' : 'Chi tiết'}</span>
                      </button>
                      <button
                        type="button"
                        className="tarot-history-action-btn is-primary"
                        disabled={Boolean(item._decryptionError)}
                        onClick={() => handleRestoreItem(item)}
                      >
                        <span aria-hidden="true">🔮</span>
                        <span>{isEn ? 'Restore' : 'Mở lại'} ➔</span>
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
