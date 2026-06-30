import React from 'react';

/**
 * Màn hình chọn phương pháp gieo quẻ — thay thế cho panel kết quả rỗng.
 *
 * 4 card được nhóm theo 2 dòng:
 *   LỤC HÀO  → Gieo nhanh      | Gieo từng hào
 *   MAI HOA   → Ngày giờ động tâm | Số seri tiền
 *
 * Props:
 *   - onPick(mode): callback khi user chọn 1 card
 *   - questionEmpty (bool): disable các card nếu chưa nhập "việc cần xem"
 */
export default function MethodPicker({ onPick, questionEmpty = false }) {
  const groups = [
    {
      label: 'LỤC HÀO',
      subtitle: 'Phương pháp kinh điển — gieo 3 đồng xu × 6 lần',
      accent: 'vermillion',
      methods: [
        {
          mode:  'quick',
          icon:  '⚡',
          title: 'Gieo nhanh',
          desc:  'Hệ thống tự mô phỏng 6 hào trong 1 lần bấm',
          meta:  '1 lần — 6 hào',
          gradient: 'linear-gradient(135deg, rgba(192,57,43,0.08), rgba(192,57,43,0.02))',
          border:    'rgba(192,57,43,0.25)',
          hoverBg:   'linear-gradient(135deg, rgba(192,57,43,0.18), rgba(192,57,43,0.05))',
          hoverBorder: 'var(--color-vermillion)',
        },
        {
          mode:  'manual-step',
          icon:  '🪙',
          title: 'Gieo từng hào',
          desc:  'Bấm từng bước — tự gieo thật theo nhịp 6 hào',
          meta:  '6 bước thủ công',
          gradient: 'linear-gradient(135deg, rgba(184,134,11,0.10), rgba(184,134,11,0.02))',
          border:    'rgba(184,134,11,0.30)',
          hoverBg:   'linear-gradient(135deg, rgba(184,134,11,0.22), rgba(184,134,11,0.05))',
          hoverBorder: 'var(--color-gold)',
        },
      ],
    },
    {
      label: 'MAI HOA',
      subtitle: 'Phương pháp Kỳ Môn — tính quẻ theo số hoặc thời điểm',
      accent: 'jade',
      methods: [
        {
          mode:  'mai-hoa-time',
          icon:  '🕐',
          title: 'Ngày giờ động tâm',
          desc:  'Dùng thời điểm động tâm để tính thượng hạ quái + hào động',
          meta:  'Theo Âm lịch',
          gradient: 'linear-gradient(135deg, rgba(26,107,74,0.10), rgba(26,107,74,0.02))',
          border:    'rgba(26,107,74,0.30)',
          hoverBg:   'linear-gradient(135deg, rgba(26,107,74,0.22), rgba(26,107,74,0.05))',
          hoverBorder: 'var(--color-jade)',
        },
        {
          mode:  'mai-hoa-serial',
          icon:  '💵',
          title: 'Số seri tiền',
          desc:  'Lấy 2–8 chữ số bất kỳ (số seri, biển số, v.v.) làm đầu vào',
          meta:  '2–8 chữ số',
          gradient: 'linear-gradient(135deg, rgba(184,134,11,0.10), rgba(184,134,11,0.02))',
          border:    'rgba(184,134,11,0.30)',
          hoverBg:   'linear-gradient(135deg, rgba(184,134,11,0.22), rgba(184,134,11,0.05))',
          hoverBorder: 'var(--color-gold)',
        },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tiêu đề chào */}
      <div style={{
        textAlign: 'center',
        padding: '8px 4px 4px',
      }}>
        <div style={{
          fontFamily: "'Noto Serif', serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-ink)',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}>
          Chọn phương pháp gieo quẻ
        </div>
        <div style={{
          fontSize: '0.8125rem',
          color: 'var(--color-ink-muted)',
          lineHeight: 1.5,
        }}>
          {questionEmpty
            ? <>Vui lòng nhập <strong style={{ color: 'var(--color-vermillion)' }}>việc cần xem</strong> ở bên trái trước khi chọn.</>
            : <>Chọn 1 trong 4 cách lập quẻ bên dưới để bắt đầu.</>}
        </div>
      </div>

      {/* 2 nhóm × 2 card */}
      {groups.map(group => (
        <div key={group.label}>
          {/* Header nhóm */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            marginBottom: 10,
            paddingLeft: 2,
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: group.accent === 'vermillion' ? 'var(--color-vermillion)' : 'var(--color-jade)',
            }}>
              {group.label}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--color-ink-muted)',
              fontStyle: 'italic',
            }}>
              — {group.subtitle}
            </span>
          </div>

          {/* 2-card grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}>
            {group.methods.map(m => (
              <MethodCard
                key={m.mode}
                method={m}
                disabled={questionEmpty}
                onClick={() => onPick(m.mode)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Footer hint */}
      <div style={{
        marginTop: 6,
        padding: '10px 14px',
        background: 'rgba(184,134,11,0.06)',
        border: '1px dashed rgba(184,134,11,0.25)',
        borderRadius: 8,
        fontSize: '0.75rem',
        color: 'var(--color-ink-muted)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        💡 Mỗi phương pháp cho ra <strong style={{ color: 'var(--color-gold)' }}>quẻ chủ + quẻ biến</strong> nếu có hào động.
        Bạn có thể đổi phương pháp sau khi gieo xong.
      </div>
    </div>
  );
}

function MethodCard({ method, disabled, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'flex-start',
        textAlign:      'left',
        gap:            10,
        padding:        '16px 14px',
        borderRadius:   12,
        border:         `1.5px solid ${hovered && !disabled ? method.hoverBorder : method.border}`,
        background:     hovered && !disabled ? method.hoverBg : method.gradient,
        cursor:         disabled ? 'not-allowed' : 'pointer',
        opacity:        disabled ? 0.55 : 1,
        transform:      hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:      hovered && !disabled
          ? '0 6px 20px rgba(44,24,16,0.12)'
          : '0 1px 4px rgba(44,24,16,0.04)',
        transition:     'all 0.2s ease',
        fontFamily:     "'Be Vietnam Pro', sans-serif",
        minHeight:      132,
      }}
    >
      {/* Icon + meta badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
        <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{method.icon}</span>
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.7)',
          color: 'var(--color-ink-muted)',
          letterSpacing: '0.04em',
        }}>
          {method.meta}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Noto Serif', serif",
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--color-ink)',
        letterSpacing: '0.03em',
        lineHeight: 1.2,
      }}>
        {method.title}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '0.8125rem',
        color: 'var(--color-ink-muted)',
        lineHeight: 1.45,
        flex: 1,
      }}>
        {method.desc}
      </div>

      {/* Action hint */}
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        color: hovered && !disabled ? method.hoverBorder : 'var(--color-ink-muted)',
        transition: 'color 0.2s',
      }}>
        {disabled ? '🔒 Cần nhập việc cần xem' : (hovered ? 'Bấm để chọn →' : 'Bấm để chọn')}
      </div>
    </button>
  );
}
