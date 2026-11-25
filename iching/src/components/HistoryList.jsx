import React from 'react';
import { useLanguage } from '../context/useLanguage.js';
import { useAuth } from '../context/useAuth.js';
import { VERIFICATION_META, getVerificationForReading } from '../logic/verification.js';

function getVerificationBadgeLabel(status, meta, isEn) {
  if (!isEn) return meta.shortVi;
  if (status === 'accurate') return '✅ Accurate';
  if (status === 'partial') return '🌗 Partial';
  if (status === 'different') return '🔄 Different';
  return meta.labelEn || meta.shortVi;
}

export default function HistoryList({
  history = [],
  onSelect,
  onOpenManageModal,
  currentActiveData,
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const { isAuthenticated, login } = useAuth();

  const formatHistoryTitle = (item) => {
    const getHexName = (hex) => {
      if (!hex) return '';
      return language === 'en' ? t(`hex.name.${hex.id}`, hex.nameVi) : hex.nameVi;
    };

    const data = item.data;
    if (!data) return item.title;
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
      const safeStr = typeof isoString === 'string' ? isoString.replace(' ', 'T') : isoString;
      const d = new Date(safeStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const isCurrentActive = (item) => {
    if (!currentActiveData || !item.data) return false;
    return currentActiveData.createdAt === item.data.createdAt;
  };

  // 🔒 CASE 1: UNAUTHENTICATED (GUEST) USER
  if (!isAuthenticated) {
    return (
      <section className="card" style={{ padding: 20, opacity: 0.95 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>
          {t('history.title', '📜 Lịch sử gieo quẻ')}
        </div>
        <div className="iching-history-guest-box">
          <span style={{ fontSize: '1.5rem' }} aria-hidden="true">🔒</span>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.45,
            }}
          >
            {t(
              'history.guest_notice',
              isEn
                ? 'Please sign in to save and manage your reading history.'
                : 'Bạn cần phải đăng nhập để sử dụng tính năng lưu và quản lý lịch sử gieo quẻ.'
            )}
          </p>
          <button type="button" onClick={login} className="iching-history-guest-btn">
            🔑 {t('auth.login_now', isEn ? 'Sign in now' : 'Đăng nhập ngay')}
          </button>
        </div>
      </section>
    );
  }

  // Preview top 5 items
  const previewItems = history.slice(0, 5);

  return (
    <section className="card animate-in" style={{ padding: 20 }}>
      <div className="iching-history-list-header">
        <div className="section-title" style={{ margin: 0 }}>
          {t('history.title', '📜 Lịch sử gieo quẻ')}
          {history.length > 0 && (
            <span className="iching-history-list-count">({history.length})</span>
          )}
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onOpenManageModal}
            className="iching-history-manage-btn"
          >
            ⚙️ {t('history.manage_btn', isEn ? 'Manage' : 'Quản lý lịch sử')}
          </button>
        )}
      </div>

      {previewItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 10px',
            color: 'var(--color-ink-muted)',
            fontSize: '0.85rem',
            fontStyle: 'italic',
          }}
        >
          {t('history.empty', 'Chưa có quẻ nào được lưu')}
        </div>
      ) : (
        <div className="iching-history-preview-stack">
          {previewItems.map((item) => {
            const active = isCurrentActive(item);
            const isFavorited = item.data?.favorite === true;
            const isLucHao = item.type === 'luc-hao';
            const ver = item.verification || getVerificationForReading(item.id, item.data);

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item);
                  }
                }}
                className={`iching-history-preview-card ${isFavorited ? 'is-favorited' : ''} ${active ? 'is-active' : ''}`}
              >
                {/* Top row */}
                <div className="iching-history-card-meta" style={{ marginBottom: 2 }}>
                  <div className="iching-history-card-badges">
                    <span className={`iching-history-method-badge ${isLucHao ? 'is-luc-hao' : 'is-mai-hoa'}`}>
                      {isLucHao
                          ? `☯ ${t('history.luc_hao_badge', isEn ? 'Six Lines' : 'Lục Hào')}`
                          : `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}`}
                    </span>
                    {isFavorited && (
                      <span
                        className="iching-history-fav-badge"
                        title={isEn ? 'Favorite' : 'Yêu thích'}
                        aria-label={isEn ? 'Favorite' : 'Yêu thích'}
                      >
                        ★
                      </span>
                    )}
                    {ver && ver.status !== 'pending' && (() => {
                      const meta = VERIFICATION_META[ver.status];
                      if (!meta) return null;
                      return (
                        <span
                          className="iching-history-ver-badge"
                          style={{
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                          }}
                        >
                          {getVerificationBadgeLabel(ver.status, meta, isEn)}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="iching-history-time" style={{ fontSize: '0.72rem' }}>
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                {/* Hexagram title */}
                <div
                  className="iching-history-card-title"
                  style={{ fontSize: '0.86rem', marginBottom: 0 }}
                >
                  {formatHistoryTitle(item)}
                </div>

                {item._decryptionError && (
                  <div role="status" className="iching-history-decrypt-warn" style={{ marginBottom: 0 }}>
                    {isEn
                      ? '⚠ Unable to decrypt legacy data · read-only'
                      : '⚠ Không giải mã được dữ liệu cũ · chỉ đọc'}
                  </div>
                )}

                {/* Truncated question */}
                {item.question && (
                  <div className="iching-history-card-question" style={{ fontSize: '0.76rem' }}>
                    {item.question === '(Không có câu hỏi)'
                      ? t('history.no_question', '(No question)')
                      : item.question}
                  </div>
                )}
              </div>
            );
          })}

          {history.length > 5 && (
            <button
              type="button"
              onClick={onOpenManageModal}
              className="iching-history-view-all-btn"
            >
              {t(
                'history.view_more',
                isEn ? `View all ${history.length} readings ➔` : `Xem tất cả ${history.length} quẻ ➔`
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
