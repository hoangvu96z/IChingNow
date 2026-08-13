import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function HistoryList({
  history = [],
  onSelect,
  onOpenManageModal,
  currentActiveData,
}) {
  const { t, language } = useLanguage();
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
      const d = new Date(isoString);
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
        <div
          style={{
            background: 'rgba(184, 134, 11, 0.06)',
            border: '1px dashed rgba(184, 134, 11, 0.3)',
            borderRadius: 10,
            padding: '16px 14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--color-ink-muted, #7f8c8d)',
              lineHeight: 1.4,
            }}
          >
            {t(
              'history.guest_notice',
              'Bạn cần phải đăng nhập để sử dụng tính năng lưu và quản lý lịch sử gieo quẻ.'
            )}
          </p>
          <button
            onClick={login}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124,92,252,0.3)',
            }}
          >
            🔑 {t('auth.login_now', 'Đăng nhập ngay')}
          </button>
        </div>
      </section>
    );
  }

  // Preview top 5 items
  const previewItems = history.slice(0, 5);

  return (
    <section className="card animate-in" style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div className="section-title" style={{ margin: 0 }}>
          {t('history.title', '📜 Lịch sử gieo quẻ')}
          {history.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-ink-muted)',
                marginLeft: 6,
              }}
            >
              ({history.length})
            </span>
          )}
        </div>

        {history.length > 0 && (
          <button
            onClick={onOpenManageModal}
            style={{
              background: 'rgba(184, 134, 11, 0.08)',
              border: '1px solid rgba(184, 134, 11, 0.25)',
              color: 'var(--color-ink, #2c3e50)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.16)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.08)')
            }
          >
            ⚙️ {t('history.manage_btn', 'Quản lý lịch sử')}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {previewItems.map((item) => {
            const active = isCurrentActive(item);
            const isLucHao = item.type === 'luc-hao';
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: active
                    ? '1px solid var(--color-gold)'
                    : '1px solid rgba(184, 134, 11, 0.15)',
                  background: active
                    ? 'rgba(184, 134, 11, 0.08)'
                    : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(184, 134, 11, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.15)';
                  }
                }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: isLucHao
                        ? 'var(--color-vermillion)'
                        : 'var(--color-jade)',
                      background: isLucHao
                        ? 'rgba(192, 57, 43, 0.08)'
                        : 'rgba(26, 107, 74, 0.08)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isLucHao
                      ? `🪙 ${t('history.luc_hao_badge', 'Lục Hào')}`
                      : `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-ink-muted)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                {/* Hexagram title */}
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    fontFamily: "'Noto Serif', serif",
                  }}
                >
                  {formatHistoryTitle(item)}
                </div>

                {/* Truncated question */}
                {item.question && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-ink-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
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
              onClick={onOpenManageModal}
              style={{
                background: 'transparent',
                border: '1px dashed rgba(184, 134, 11, 0.3)',
                borderRadius: 8,
                padding: '8px',
                color: 'var(--color-gold, #b8860b)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {t('history.view_more', `Xem tất cả ${history.length} quẻ ➔`)}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
