import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Màn hình chọn phương pháp gieo quẻ — 4 lựa chọn xếp gọn trên 1 hàng ngang.
 */
export default function MethodPicker({ onPick, questionEmpty = false }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header chuẩn giống các card khác */}
      <div>
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
                'Vui lòng nhập việc cần xem ở bên trên trước khi chọn.'
              )
            : t(
                'picker.desc_ready',
                'Chọn 1 trong 4 phương pháp gieo quẻ dưới đây để bắt đầu.'
              )}
        </div>
      </div>

      {/* 4 Card gọn gàng nằm trên 1 hàng */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
        }}
        className="method-picker-4row"
      >
        {methods.map((m) => (
          <MethodCard
            key={m.mode}
            method={m}
            disabled={questionEmpty}
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
        @media (max-width: 900px) {
          .method-picker-4row {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 540px) {
          .method-picker-4row {
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
        opacity: disabled ? 0.55 : 1,
        transform: hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:
          hovered && !disabled
            ? '0 6px 18px rgba(44,24,16,0.1)'
            : '0 1px 3px rgba(44,24,16,0.04)',
        transition: 'all 0.2s ease',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        minHeight: 130,
      }}
    >
      {/* Top badges: Type badge + Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
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
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{method.icon}</span>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Noto Serif', serif",
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--color-ink)',
          lineHeight: 1.25,
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
