import React from 'react';

export default function TarotPromptTemplateSelector({
  hasInterpretation,
  loading,
  promptTemplate,
  setPromptTemplate,
  t,
}) {
  if (hasInterpretation || loading) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '6px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('export.select_type', 'Chọn kiểu luận giải:')}</span>
      <div style={{ display: 'flex', gap: '6px' }}>
        {['standard', 'love', 'career'].map(type => (
          <button
            key={type}
            onClick={() => setPromptTemplate(type)}
            style={{
              background: promptTemplate === type ? 'rgba(229,193,88,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${promptTemplate === type ? 'var(--gold-color)' : 'rgba(255,255,255,0.08)'}`,
              color: promptTemplate === type ? '#fff' : 'var(--text-muted)',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {t(`export.type_${type === 'standard' ? 'general' : type}`, type)}
          </button>
        ))}
      </div>
    </div>
  );
}
