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
    <div className="ai-template-selector">
      <span className="ai-template-label">{t('export.select_type', 'Chọn kiểu luận giải:')}</span>
      <div className="ai-template-options">
        {['standard', 'love', 'career'].map(type => (
          <button
            key={type}
            type="button"
            className={`ai-template-tab-btn ${promptTemplate === type ? 'active' : ''}`}
            onClick={() => setPromptTemplate(type)}
          >
            {t(`export.type_${type === 'standard' ? 'general' : type}`, type)}
          </button>
        ))}
      </div>
    </div>
  );
}
