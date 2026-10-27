import React, { useState, useMemo } from 'react';
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
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter((item) => {
      const name = (item.data?.inputData?.name || item.title || '').toLowerCase();
      const canChi = (item.data?.result?.canChiNam || '').toLowerCase();
      const cuc = (item.data?.result?.cucName || '').toLowerCase();
      return name.includes(term) || canChi.includes(term) || cuc.includes(term);
    });
  }, [history, searchTerm]);

  if (!isOpen) return null;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa lá số này khỏi lịch sử?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      alert(`Xóa thất bại: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!history.length || isDeletingAll) return;
    const confirmMessage = `Bạn có chắc chắn muốn xóa toàn bộ ${history.length} lá số trong lịch sử không?\nThao tác này không thể hoàn tác.`;
    if (!window.confirm(confirmMessage)) return;
    setIsDeletingAll(true);
    try {
      if (onDeleteAll) {
        await onDeleteAll();
      }
    } catch (err) {
      alert(`Xóa toàn bộ thất bại: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="tv-history-modal"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📜</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                Lịch sử lá số Tử Vi
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {history.length} lá số đã lưu trữ trong tài khoản của bạn
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onDeleteAll && history.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll || loading}
                title="Xóa tất cả lá số đã lưu"
                style={{
                  background: 'var(--badge-triet-bg)',
                  border: '1px solid var(--badge-triet-border)',
                  borderRadius: '8px',
                  color: 'var(--badge-triet-color)',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: (isDeletingAll || loading) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDeletingAll ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
              >
                🗑️ {isDeletingAll ? 'Đang xóa...' : 'Xóa tất cả'}
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading || isDeletingAll}
                title="Làm mới lịch sử"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  cursor: (loading || isDeletingAll) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🔄 {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, Can Chi, Cục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* List Content */}
        <div
          style={{
            padding: '16px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {loading && history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✦</div>
              Đang tải lịch sử lá số...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔮</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
                {searchTerm ? 'Không tìm thấy lá số phù hợp' : 'Chưa có lá số nào được lưu'}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', maxWidth: '340px', marginInline: 'auto' }}>
                {searchTerm
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Lá số của bạn sẽ tự động lưu khi an lá số trong lúc đăng nhập tài khoản.'}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const input = item.data?.inputData;
              const res = item.data?.result;
              const hasAi = !!item.data?.aiConversation;
              const name = input?.name || item.title || 'Lá số Tử Vi';
              const isMale = input?.gender === 1 || input?.gender === 'nam' || input?.gender === 'Nam';
              const isFemale = input?.gender === 0 || input?.gender === 'nu' || input?.gender === 'Nữ';
              const gender = isMale ? 'Nam' : isFemale ? 'Nữ' : '';

              // Format date & time cleanly with fallbacks
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

              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(155, 89, 182, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(155, 89, 182, 0.35)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--accent-gold)' }}>{name}</strong>
                      {gender && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isMale ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 114, 182, 0.15)',
                            color: isMale ? 'var(--element-thuy)' : 'var(--element-hoa)',
                            fontWeight: 600,
                          }}
                        >
                          {gender}
                        </span>
                      )}
                      {hasAi && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(109, 213, 176, 0.18)',
                            color: 'var(--element-moc)',
                            border: '1px solid rgba(109, 213, 176, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 600,
                          }}
                        >
                          ✦ Có luận giải AI
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {birthText && <span>📅 {birthText}</span>}
                      {res?.canChiNam && <span>✨ {res.canChiNam}</span>}
                      {res?.cucName && <span>🔮 {res.cucName}</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Lưu lúc: {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #7c5cfc 0%, #9b59b6 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(124, 92, 252, 0.3)',
                      }}
                    >
                      Xem lá số
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      title="Xóa lá số"
                      style={{
                        background: 'var(--badge-triet-bg)',
                        color: 'var(--badge-triet-color)',
                        border: '1px solid var(--badge-triet-border)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.8rem',
                        cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deletingId === item.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
          }}
        >
          <div>
            {onDeleteAll && history.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll || loading}
                title="Xóa toàn bộ lịch sử lá số"
                style={{
                  background: 'var(--badge-triet-bg)',
                  color: 'var(--badge-triet-color)',
                  border: '1px solid var(--badge-triet-border)',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: (isDeletingAll || loading) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  opacity: isDeletingAll ? 0.6 : 1,
                }}
              >
                <span>🗑️</span>
                <span>{isDeletingAll ? 'Đang xóa toàn bộ...' : 'Xóa tất cả'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '7px 18px',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
