import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Hiển thị metadata của lần lập quẻ
 */
export default function ResultMetadata({ result }) {
  const { t, language } = useLanguage();

  if (!result) return null;

  const createdAt = result.createdAt ? new Date(result.createdAt) : null;

  const getMovingLinesText = () => {
    if (!result.movingLines || result.movingLines.length === 0) {
      return t('meta.moving_lines_none', 'Không có hào động');
    }
    const label = language === 'en' ? 'Line' : 'Hào';
    return `${label} ${result.movingLines.join(', ')}`;
  };

  const getSolarTermText = () => {
    if (!result.useSolarTerm || !result.solarTerm) return '—';
    return language === 'en' ? result.solarTerm.nameEn || result.solarTerm.nameVi : result.solarTerm.nameVi;
  };

  const getMovingMindTimeText = () => {
    if (!result.movingMindTime?.enabled || !result.movingMindTime?.hourBranch) return '—';
    const branchName = result.movingMindTime.hourBranch.replace('Giờ ', '');
    return `${t('common.hour_prefix', 'Giờ')} ${t(`branch.${branchName}`, branchName)}`;
  };

  const rows = [
    { label: t('meta.question', 'Việc cần xem'),   value: result.question || '—' },
    { label: t('meta.caster', 'Người lập'),      value: result.caster   || '—', hide: !result.caster },
    { label: t('meta.cast_date', 'Ngày lập quẻ'),   value: createdAt ? formatDateTime(createdAt, language) : '—' },
    { label: t('meta.moving_date', 'Ngày động tâm'),  value: result.movingMindDate || '—' },
    { label: t('meta.moving_time', 'Giờ động tâm'),   value: getMovingMindTimeText() },
    { label: t('meta.solar_term', 'Tiết khí'),       value: getSolarTermText() },
    { label: t('meta.method', 'Phương pháp'),    value: result.mode === 'quick' ? t('meta.method_quick', 'Gieo nhanh 1 lần') : t('meta.method_manual', 'Gieo từng hào (6 bước)') },
    { label: t('meta.moving_lines', 'Hào động'),       value: getMovingLinesText() },
  ].filter(r => !r.hide);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{
          display: 'flex',
          gap: 12,
          padding: '6px 0',
          borderBottom: '1px solid rgba(184,134,11,0.1)',
          alignItems: 'flex-start',
        }}>
          <span style={{
            minWidth: 120,
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            flexShrink: 0,
          }}>
            {label}
          </span>
          <span style={{
            fontSize: '0.9rem',
            color: 'var(--color-ink)',
            fontFamily: "'Noto Serif', serif",
          }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(d, language) {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return language === 'en' ? `${mm}/${dd}/${yyyy} ${hh}:${min}` : `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}
