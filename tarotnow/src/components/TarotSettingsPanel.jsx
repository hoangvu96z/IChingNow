import React from 'react';

export default function TarotSettingsPanel({
  isOpen,
  onSubmit,
  onClose,
  formSettings,
  setFormSettings,
  modelsList,
  t,
}) {
  if (!isOpen) return null;

  return (
    <form onSubmit={onSubmit} className="ai-settings-form" style={{ borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h4 className="ai-settings-heading" style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600 }}>{t('ai.settings_header', 'Cấu hình Server AI (9Router)')}</h4>

      <div>
        <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>
          <span>Chọn Model *</span>
        </label>
        <select
          className="custom-textarea ai-settings-select"
          style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '38px' }}
          value={formSettings.model}
          onChange={e => setFormSettings({ ...formSettings, model: e.target.value })}
        >
          {modelsList.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
        <button type="button" className="reset-weights-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={onClose}>
          {t('common.cancel', 'Hủy')}
        </button>
        <button type="submit" className="copy-main-btn" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '80px' }}>
          {t('common.save', 'Lưu lại')}
        </button>
      </div>
    </form>
  );
}
