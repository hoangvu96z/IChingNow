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
    <form onSubmit={onSubmit} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(229,193,88,0.2)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#e5c158' }}>{t('ai.settings_header', 'Cấu hình Server AI (9Router)')}</h4>

      <div>
        <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>
          <span>Chọn Model *</span>
        </label>
        <select
          className="custom-textarea"
          style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '38px', background: '#1c172e', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
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
