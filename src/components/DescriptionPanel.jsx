import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

const BINARY_TO_QUAI_NUMBER = {
  '111': 1, // Càn
  '110': 2, // Đoài
  '101': 3, // Ly
  '100': 4, // Chấn
  '011': 5, // Tốn
  '010': 6, // Khảm
  '001': 7, // Cấn
  '000': 8, // Khôn
};

/**
 * Panel hiển thị 5 khía cạnh luận giải chi tiết của quẻ
 */
export default function DescriptionPanel({ hexagram, color }) {
  const { t, language, getHexDescription } = useLanguage();
  
  if (!hexagram) return null;

  const upperId = BINARY_TO_QUAI_NUMBER[hexagram.upper];
  const lowerId = BINARY_TO_QUAI_NUMBER[hexagram.lower];
  const d = getHexDescription(upperId, lowerId);

  if (!d) return null;

  const hexName = language === 'en' ? t(`hex.name.${hexagram.id}`, hexagram.nameVi) : hexagram.nameVi;

  const aspects = [
    { key: 'tong_quat', label: t('desc.aspect_tong_quat', 'Tổng quát') },
    { key: 'tinh_cam',  label: t('desc.aspect_tinh_cam', 'Tình cảm') },
    { key: 'gia_dao',   label: t('desc.aspect_gia_dao', 'Gia đạo')  },
    { key: 'cong_viec', label: t('desc.aspect_cong_viec', 'Công việc') },
    { key: 'suc_khoe',  label: t('desc.aspect_suc_khoe', 'Sức khỏe') },
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
          📖 {t('desc.basic_title', 'Luận giải cơ bản')}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
          fontStyle: 'italic',
        }}>
          {hexName}
        </div>
      </div>
      {aspects.map(({ key, label }) => (
        d[key] && (
          <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{
              flexShrink: 0,
              minWidth: 90,
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
        {t('desc.ai_hint', '💡 Đây là luận giải cơ bản. Để xem luận giải chi tiết hơn, bạn hãy sao chép phần "Xuất kết quả" (dạng Plaintext) ở phía dưới và gửi cho các trợ lý AI như ChatGPT hoặc Gemini.')}
      </div>
    </div>
  );
}
