import React, { useState, useMemo, useEffect, useId } from 'react';
import { GIO_SINH_OPTIONS } from '../utils/lunarConverter';
import { DIA_CHI } from '../utils/tuViEngine';

export default function TuViHistoryModal({
  isOpen,
  onClose,
  history = [],
  loading = false,
  onSelect,
  onDelete,
  onDeleteAll,
  onRefresh,
  onFavorite,
}) {
  const titleId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favoritePending, setFavoritePending] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return history
      .filter((item) => {
        const values = [
          item.data?.inputData?.name,
          item.title,
          item.data?.result?.canChiNam,
          item.data?.result?.cucName,
        ];
        const date = new Date(item.createdAt);
        const localDay = Number.isNaN(date.getTime())
          ? ''
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return (
          (!term || values.some((value) => String(value || '').toLowerCase().includes(term))) &&
          (!dateFrom || (localDay && localDay >= dateFrom)) &&
          (!dateTo || (localDay && localDay <= dateTo)) &&
          (!favoritesOnly || item.data?.favorite === true)
        );
      })
      .sort((a, b) => {
        if (sort === 'name') {
          return (a.data?.inputData?.name || a.title || '').localeCompare(
            b.data?.inputData?.name || b.title || '',
            'vi'
          );
        }
        const delta = (new Date(a.createdAt).getTime() || 0) - (new Date(b.createdAt).getTime() || 0);
        return sort === 'oldest' ? delta : -delta;
      });
  }, [history, searchTerm, dateFrom, dateTo, favoritesOnly, sort]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || dateFrom || dateTo || favoritesOnly || sort !== 'newest'
  );
  const hasSecondaryFilters = Boolean(dateFrom || dateTo || sort !== 'newest');

  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setFavoritesOnly(false);
    setSort('newest');
  };

  const toggleFavorite = async (event, item) => {
    event.stopPropagation();
    if (!onFavorite || favoritePending !== null) return;
    setActionError('');
    setFavoritePending(item.id);
    try {
      await onFavorite(item.id, !item.data?.favorite);
    } catch (err) {
      setActionError(`Không lưu được yêu thích: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setFavoritePending(null);
    }
  };

  if (!isOpen) return null;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa lá số này khỏi lịch sử?')) return;
    setActionError('');
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      setActionError(`Xóa thất bại: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!history.length || isDeletingAll) return;
    const confirmMessage = `Bạn có chắc chắn muốn xóa toàn bộ ${history.length} lá số trong lịch sử không?\nThao tác này không thể hoàn tác.`;
    if (!window.confirm(confirmMessage)) return;
    setActionError('');
    setIsDeletingAll(true);
    try {
      if (onDeleteAll) {
        await onDeleteAll();
      }
    } catch (err) {
      setActionError(`Xóa toàn bộ thất bại: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="tv-history-backdrop"
      onClick={onClose}
    >
      <div
        className="tv-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tv-history-header">
          <div className="tv-history-title-wrap">
            <span className="tv-history-icon" aria-hidden="true">📜</span>
            <div className="tv-history-title-group">
              <h3 id={titleId} className="tv-history-title">
                Lịch sử lá số Tử Vi
              </h3>
              <p className="tv-history-subtitle">
                {history.length} lá số đã lưu trữ trong tài khoản của bạn
              </p>
            </div>
          </div>

          <div className="tv-history-header-actions">
            {onRefresh && (
              <button
                type="button"
                className="tv-history-refresh-btn"
                onClick={() => {
                  setActionError('');
                  onRefresh();
                }}
                disabled={loading || isDeletingAll}
                title="Làm mới lịch sử"
              >
                <span aria-hidden="true">🔄</span>
                <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
              </button>
            )}
            <button
              type="button"
              className="tv-history-close-btn"
              onClick={onClose}
              aria-label="Đóng lịch sử lá số"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Inline Error Banner */}
        {actionError && (
          <div className="tv-history-error" role="alert">
            <span>⚠️ {actionError}</span>
            <button
              type="button"
              className="tv-history-error-dismiss"
              onClick={() => setActionError('')}
              aria-label="Đóng thông báo lỗi"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="tv-history-toolbar">
          <div className="tv-history-search-row">
            <div className="tv-history-search-wrap">
              <span className="tv-history-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="tv-history-search-input"
                aria-label="Tìm kiếm lá số theo tên, Can Chi, Cục"
                placeholder="Tìm kiếm theo tên, Can Chi, Cục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="tv-history-search-clear"
                  onClick={() => setSearchTerm('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              className={`tv-history-fav-pill${favoritesOnly ? ' is-active' : ''}`}
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly((prev) => !prev)}
            >
              <span aria-hidden="true">{favoritesOnly ? '★' : '☆'}</span>
              <span>Yêu thích</span>
            </button>

            <button
              type="button"
              className={`tv-history-filter-toggle${filtersOpen || hasSecondaryFilters ? ' is-active' : ''}`}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <span aria-hidden="true">🎛️</span>
              <span>Lọc</span>
              {hasSecondaryFilters && <span className="tv-history-filter-dot" aria-hidden="true" />}
            </button>
          </div>

          <div className={`tv-history-filters${filtersOpen ? ' is-open' : ''}`}>
            <label className="tv-history-field">
              <span className="tv-history-field-label">Từ ngày</span>
              <input
                aria-label="Từ ngày"
                className="tv-history-control"
                type="date"
                max={dateTo || undefined}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>

            <label className="tv-history-field">
              <span className="tv-history-field-label">Đến ngày</span>
              <input
                aria-label="Đến ngày"
                className="tv-history-control"
                type="date"
                min={dateFrom || undefined}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>

            <label className="tv-history-field">
              <span className="tv-history-field-label">Sắp xếp</span>
              <select
                aria-label="Sắp xếp"
                className="tv-history-control tv-history-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name">Tên A–Z</option>
              </select>
            </label>

            <div className="tv-history-filters-meta">
              <button
                type="button"
                className="tv-history-reset-btn"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                Xóa bộ lọc
              </button>
              <span className="tv-history-count-badge">
                {filtered.length} / {history.length} lá số
              </span>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="tv-history-list">
          {loading && history.length === 0 ? (
            <div className="tv-history-state">
              <div className="tv-history-state-icon" aria-hidden="true">✦</div>
              <p>Đang tải lịch sử lá số...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="tv-history-empty">
              <div className="tv-history-empty-icon" aria-hidden="true">🔮</div>
              <div className="tv-history-empty-title">
                {history.length ? 'Không tìm thấy lá số phù hợp' : 'Chưa có lá số nào được lưu'}
              </div>
              <p className="tv-history-empty-desc">
                {history.length
                  ? 'Thử thay đổi từ khóa, khoảng ngày hoặc bỏ lọc yêu thích.'
                  : 'Lá số của bạn sẽ tự động lưu khi an lá số trong lúc đăng nhập tài khoản.'}
              </p>
              {history.length > 0 && hasActiveFilters && (
                <button
                  type="button"
                  className="tv-history-reset-btn"
                  onClick={resetFilters}
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => {
              const input = item.data?.inputData;
              const res = item.data?.result;
              const hasAi = !!item.data?.aiConversation;
              const isFavorite = item.data?.favorite === true;
              const name = input?.name || item.title || 'Lá số Tử Vi';
              const isMale = input?.gender === 1 || input?.gender === 'nam' || input?.gender === 'Nam';
              const isFemale = input?.gender === 0 || input?.gender === 'nu' || input?.gender === 'Nữ';
              const gender = isMale ? 'Nam' : isFemale ? 'Nữ' : '';

              let solarDate = '';
              if (input?.solarInput?.day && input?.solarInput?.month && input?.solarInput?.year) {
                const d = String(input.solarInput.day).padStart(2, '0');
                const m = String(input.solarInput.month).padStart(2, '0');
                solarDate = `${d}/${m}/${input.solarInput.year}`;
              } else if (input?.solarDateStr && input.solarDateStr !== '(Nhập âm lịch)') {
                solarDate = input.solarDateStr.replace(' (Dương lịch)', '').trim();
              } else if (input?.birthDay && input?.birthMonth && input?.birthYear) {
                const d = String(input.birthDay).padStart(2, '0');
                const m = String(input.birthMonth).padStart(2, '0');
                solarDate = `${d}/${m}/${input.birthYear}`;
              }

              let lunarDate = '';
              if (input?.lunarDay && input?.lunarMonth) {
                const ld = String(input.lunarDay).padStart(2, '0');
                const lm = String(input.lunarMonth).padStart(2, '0');
                const ly = input?.lunarYear ? `/${input.lunarYear}` : '';
                lunarDate = `ÂL: ${ld}/${lm}${ly}`;
              }

              let hourStr = '';
              if (input?.lunarHourIndex !== undefined) {
                const hourOpt = GIO_SINH_OPTIONS?.[input.lunarHourIndex];
                hourStr = hourOpt ? `Giờ ${hourOpt.label}` : `Giờ ${DIA_CHI?.[input.lunarHourIndex] || ''}`;
              } else if (input?.birthHour) {
                hourStr = `Giờ ${input.birthHour}`;
              }

              const birthParts = [];
              if (solarDate) birthParts.push(solarDate);
              if (lunarDate) birthParts.push(lunarDate);
              if (hourStr) birthParts.push(hourStr);
              const birthText = birthParts.join(' · ');
              const savedAt = formatDate(item.createdAt);

              return (
                <div
                  key={item.id}
                  className={`tv-history-card${isFavorite ? ' is-favorite' : ''}`}
                  onClick={() => onSelect(item)}
                >
                  <div className="tv-history-card-main">
                    <div className="tv-history-card-header">
                      <strong className="tv-history-card-name">{name}</strong>
                      {gender && (
                        <span className={`tv-history-badge-gender ${isMale ? 'is-male' : 'is-female'}`}>
                          {gender}
                        </span>
                      )}
                      {hasAi && (
                        <span className="tv-history-badge-ai">
                          <span aria-hidden="true">✦</span> Có luận giải AI
                        </span>
                      )}
                      {isFavorite && (
                        <span className="tv-history-badge-fav">
                          <span aria-hidden="true">★</span> Yêu thích
                        </span>
                      )}
                    </div>

                    {(birthText || res?.canChiNam || res?.cucName) && (
                      <div className="tv-history-pills">
                        {birthText && <span className="tv-history-pill">📅 {birthText}</span>}
                        {res?.canChiNam && <span className="tv-history-pill">✨ {res.canChiNam}</span>}
                        {res?.cucName && <span className="tv-history-pill">🔮 {res.cucName}</span>}
                      </div>
                    )}

                    {savedAt && (
                      <div className="tv-history-timestamp">
                        Lưu lúc: {savedAt}
                      </div>
                    )}
                  </div>

                  <div className="tv-history-card-actions">
                    {onFavorite && (
                      <button
                        type="button"
                        className={`tv-history-star-btn${isFavorite ? ' is-active' : ''}`}
                        onClick={(e) => toggleFavorite(e, item)}
                        disabled={favoritePending !== null}
                        aria-label={isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                        aria-pressed={isFavorite}
                        title={isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                      >
                        {isFavorite ? '★' : '☆'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="tv-history-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item);
                      }}
                    >
                      Xem lá số
                    </button>
                    <button
                      type="button"
                      className="tv-history-delete-btn"
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      aria-label={`Xóa lá số ${name}`}
                      title="Xóa lá số"
                    >
                      {deletingId === item.id ? (
                        '…'
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="tv-history-footer">
          <div className="tv-history-footer-left">
            {onDeleteAll && history.length > 0 && (
              <button
                type="button"
                className="tv-history-delete-all-btn"
                onClick={handleDeleteAll}
                disabled={isDeletingAll || loading}
                title="Xóa toàn bộ lịch sử lá số"
              >
                <span aria-hidden="true">🗑️</span>
                <span>{isDeletingAll ? 'Đang xóa toàn bộ...' : 'Xóa tất cả'}</span>
              </button>
            )}
            <span className="tv-history-footer-count">
              Hiển thị {filtered.length} / {history.length} lá số
            </span>
          </div>

          <button
            type="button"
            className="tv-history-close-footer-btn"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
