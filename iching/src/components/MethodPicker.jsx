import React from 'react';
import { useLanguage } from '../context/useLanguage.js';

/**
 * Màn hình chọn phương pháp gieo quẻ — 6 lựa chọn cân đối (3×2 desktop, 2×3 tablet, 1×6 mobile).
 */
export default function MethodPicker({ onPick, onOpenAtlas, questionEmpty = false }) {
  const { t } = useLanguage();

  const methods = [
    {
      mode: 'quick',
      badge: t('picker.luc_hao', 'LỤC HÀO'),
      badgeColor: 'var(--color-vermillion)',
      badgeBg: 'rgba(192,57,43,0.1)',
      icon: '⚡',
      title: t('method.quick.title', 'Gieo nhanh'),
      desc: t('method.quick.desc', 'Mô phỏng 6 hào trong 1 lần bấm'),
      meta: t('method.quick.meta', '1 lần — 6 hào'),
      gradient: 'linear-gradient(135deg, rgba(192,57,43,0.08), rgba(192,57,43,0.02))',
      border: 'rgba(192,57,43,0.25)',
      hoverBg: 'linear-gradient(135deg, rgba(192,57,43,0.18), rgba(192,57,43,0.05))',
      hoverBorder: 'var(--color-vermillion)',
    },
    {
      mode: 'manual-step',
      badge: t('picker.luc_hao', 'LỤC HÀO'),
      badgeColor: 'var(--color-vermillion)',
      badgeBg: 'rgba(192,57,43,0.1)',
      icon: '🪙',
      title: t('method.manual.title', 'Gieo từng hào'),
      desc: t('method.manual.desc', 'Tự gieo từng bước theo 6 hào'),
      meta: t('method.manual.meta', '6 bước thủ công'),
      gradient: 'linear-gradient(135deg, rgba(184,134,11,0.10), rgba(184,134,11,0.02))',
      border: 'rgba(184,134,11,0.30)',
      hoverBg: 'linear-gradient(135deg, rgba(184,134,11,0.22), rgba(184,134,11,0.05))',
      hoverBorder: 'var(--color-gold)',
    },
    {
      mode: 'mouse-entropy',
      badge: t('picker.luc_hao', 'LỤC HÀO'),
      badgeColor: '#1a6b4a',
      badgeBg: 'rgba(26,107,74,0.12)',
      icon: '🖱️',
      title: t('method.mouse.title', 'Chuột ngẫu nhiên'),
      desc: t('method.mouse.desc', 'Di chuột tạo entropy — random thật từ tay bạn'),
      meta: t('method.mouse.meta', '6 hào · entropy thật'),
      gradient: 'linear-gradient(135deg, rgba(26,107,74,0.08), rgba(26,107,74,0.02))',
      border: 'rgba(26,107,74,0.25)',
      hoverBg: 'linear-gradient(135deg, rgba(26,107,74,0.20), rgba(26,107,74,0.04))',
      hoverBorder: 'var(--color-jade)',
    },
    {
      mode: 'manual-input',
      badge: t('picker.luc_hao', 'LỤC HÀO'),
      badgeColor: 'var(--color-vermillion)',
      badgeBg: 'rgba(192,57,43,0.12)',
      icon: '📜',
      title: t('method.manual_input.title', 'Nhập Quẻ Thực Tế / Sổ Tay'),
      desc: t(
        'method.manual_input.desc',
        'Nhập quẻ gieo bằng xu thật ngoài đời hoặc quẻ trong sách cổ (6/7/8/9 hoặc Thượng/Hạ Quái)'
      ),
      meta: t('method.manual_input.meta', '6/7/8/9 · Thượng/Hạ'),
      gradient: 'linear-gradient(135deg, rgba(184,134,11,0.12), rgba(192,57,43,0.03))',
      border: 'rgba(184,134,11,0.35)',
      hoverBg: 'linear-gradient(135deg, rgba(184,134,11,0.24), rgba(192,57,43,0.08))',
      hoverBorder: 'var(--color-gold)',
      isNew: true,
      allowWithoutQuestion: true,
    },
    {
      mode: 'mai-hoa-time',
      badge: t('picker.mai_hoa', 'MAI HOA'),
      badgeColor: 'var(--color-jade)',
      badgeBg: 'rgba(26,107,74,0.1)',
      icon: '🕐',
      title: t('method.mai_hoa_time.title', 'Ngày giờ động tâm'),
      desc: t('method.mai_hoa_time.desc', 'Tính quái & động theo giờ Âm lịch'),
      meta: t('method.mai_hoa_time.meta', 'Theo Âm lịch'),
      gradient: 'linear-gradient(135deg, rgba(26,107,74,0.10), rgba(26,107,74,0.02))',
      border: 'rgba(26,107,74,0.30)',
      hoverBg: 'linear-gradient(135deg, rgba(26,107,74,0.22), rgba(26,107,74,0.05))',
      hoverBorder: 'var(--color-jade)',
    },
    {
      mode: 'mai-hoa-serial',
      badge: t('picker.mai_hoa', 'MAI HOA'),
      badgeColor: 'var(--color-jade)',
      badgeBg: 'rgba(26,107,74,0.1)',
      icon: '💵',
      title: t('method.mai_hoa_serial.title', 'Số seri tiền'),
      desc: t('method.mai_hoa_serial.desc', 'Tính quái theo 2–8 chữ số bất kỳ'),
      meta: t('method.mai_hoa_serial.meta', '2–8 chữ số'),
      gradient: 'linear-gradient(135deg, rgba(184,134,11,0.10), rgba(184,134,11,0.02))',
      border: 'rgba(184,134,11,0.30)',
      hoverBg: 'linear-gradient(135deg, rgba(184,134,11,0.22), rgba(184,134,11,0.05))',
      hoverBorder: 'var(--color-gold)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minInlineSize: 0 }}>
      {/* Header chuẩn + nút mở Từ Điển 64 Quẻ */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div style={{ minInlineSize: 0 }}>
          <div className="section-title" style={{ marginBottom: 6 }}>
            {t('picker.title', 'Chọn phương pháp gieo quẻ')}
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.4,
            }}
          >
            {questionEmpty
              ? t(
                  'picker.desc_empty',
                  'Vui lòng nhập việc cần xem ở bên trên (hoặc chọn Nhập Quẻ Thực Tế / Sổ Tay để nghiên cứu quẻ).'
                )
              : t(
                  'picker.desc_ready',
                  'Chọn 1 trong 6 phương pháp gieo hoặc nhập quẻ dưới đây để bắt đầu.'
                )}
          </div>
        </div>

        {onOpenAtlas && (
          <button
            type="button"
            className="btn-ghost iching-touch-control"
            onClick={onOpenAtlas}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 700,
              border: '1px solid rgba(184,134,11,0.35)',
              background: 'rgba(184,134,11,0.07)',
              color: 'var(--color-ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <span aria-hidden="true">📖</span> Tra cứu 64 Quẻ
          </button>
        )}
      </div>

      {/* 6 Card gọn gàng 3×2 / 2×3 / 1×6 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
        }}
        className="method-picker-6grid"
      >
        {methods.map((m) => (
          <MethodCard
            key={m.mode}
            method={m}
            disabled={questionEmpty && !m.allowWithoutQuestion}
            onClick={() => onPick(m.mode)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div
        style={{
          marginTop: 2,
          padding: '8px 12px',
          background: 'rgba(184,134,11,0.05)',
          border: '1px dashed rgba(184,134,11,0.2)',
          borderRadius: 8,
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        {t(
          'picker.hint',
          '💡 Mỗi phương pháp cho ra quẻ chủ + quẻ biến nếu có hào động. Bạn có thể đổi phương pháp sau khi gieo xong.'
        )}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .method-picker-6grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 480px) {
          .method-picker-6grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function MethodCard({ method, disabled, onClick }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type="button"
      className="iching-touch-control"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        gap: 8,
        padding: '14px 12px',
        borderRadius: 12,
        border: `1.5px solid ${
          hovered && !disabled ? method.hoverBorder : method.border
        }`,
        background: hovered && !disabled ? method.hoverBg : method.gradient,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.82 : 1,
        transform: hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:
          hovered && !disabled
            ? '0 6px 18px rgba(44,24,16,0.1)'
            : '0 1px 3px rgba(44,24,16,0.04)',
        transition: 'all 0.2s ease',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        minHeight: 132,
        minInlineSize: 0,
      }}
    >
      {/* Top badges: Type badge + NEW indicator + Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: method.badgeBg,
              color: method.badgeColor,
              letterSpacing: '0.05em',
            }}
          >
            {method.badge}
          </span>
          {method.isNew && (
            <span
              style={{
                fontSize: '0.55rem',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 3,
                background: 'rgba(26,107,74,0.15)',
                color: '#1a6b4a',
                letterSpacing: '0.08em',
                border: '1px solid rgba(26,107,74,0.3)',
              }}
            >
              NEW
            </span>
          )}
        </div>
        <span aria-hidden="true" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
          {method.icon}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Noto Serif', serif",
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-ink)',
          lineHeight: 1.25,
          minInlineSize: 0,
        }}
      >
        {method.title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--color-ink-muted)',
          lineHeight: 1.4,
          flex: 1,
          minInlineSize: 0,
        }}
      >
        {method.desc}
      </div>

      {/* Action hint */}
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color:
            hovered && !disabled ? method.hoverBorder : 'var(--color-ink-muted)',
          transition: 'color 0.2s',
          marginTop: 2,
        }}
      >
        {disabled
          ? t('picker.need_question', '🔒 Cần nhập việc')
          : hovered
          ? t('picker.select_action', 'Chọn →')
          : t('picker.select_default', 'Bấm để chọn')}
      </div>
    </button>
  );
}
