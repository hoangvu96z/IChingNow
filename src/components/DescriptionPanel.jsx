import React from 'react';

/**
 * Panel hiển thị 5 khía cạnh luận giải chi tiết của quẻ
 */
export default function DescriptionPanel({ hexagram, color }) {
  if (!hexagram?.description) return null;
  const d = hexagram.description;
  const aspects = [
    { key: 'tong_quat', label: 'Tổng quát' },
    { key: 'tinh_cam',  label: 'Tình cảm' },
    { key: 'gia_dao',   label: 'Gia đạo'  },
    { key: 'cong_viec', label: 'Công việc' },
    { key: 'suc_khoe',  label: 'Sức khỏe' },
  ];
  return (
    <div style={{
      padding: '14px 16px',
      background: `${color || 'rgba(184,134,11,0.04)'}08`,
      border: `1px solid ${color || 'rgba(184,134,11,0.2)'}`,
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingBottom: 8,
        borderBottom: `1px solid ${color || 'rgba(184,134,11,0.2)'}`,
      }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: color || 'var(--color-gold)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          📖 Luận giải cơ bản
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
          fontStyle: 'italic',
        }}>
          {hexagram.nameVi}
        </div>
      </div>
      {aspects.map(({ key, label }) => (
        d[key] && (
          <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{
              flexShrink: 0,
              minWidth: 78,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: color || 'var(--color-gold)',
              paddingTop: 2,
            }}>
              {label}:
            </span>
            <span style={{
              flex: 1,
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--color-ink)',
            }}>
              {d[key]}
            </span>
          </div>
        )
      ))}

      <div style={{
        marginTop: 6,
        paddingTop: 8,
        borderTop: `1px dashed ${color || 'rgba(184,134,11,0.15)'}`,
        fontSize: '0.73rem',
        color: 'var(--color-ink-muted)',
        fontStyle: 'italic',
        lineHeight: 1.4,
      }}>
        💡 Đây là luận giải cơ bản. Để xem luận giải chi tiết hơn, bạn hãy sao chép phần <strong>"Xuất kết quả"</strong> (dạng Plaintext) ở phía dưới và gửi cho các trợ lý AI như ChatGPT hoặc Gemini.
      </div>
    </div>
  );
}
