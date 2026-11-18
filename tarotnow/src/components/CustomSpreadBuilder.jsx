import React, { useState, useEffect } from 'react';
import {
  STARTER_CUSTOM_SPREAD_PRESETS,
  clampCustomCardCount,
  resizeCustomPositions,
  loadCustomSpreadTemplates,
  saveCustomSpreadTemplate,
  deleteCustomSpreadTemplate,
} from '../utils/customSpreadUtils.js';

const PLACEHOLDER_EXAMPLES_VI = [
  'Ví dụ: Phương án A — Chuyển việc mới',
  'Ví dụ: Phương án B — Ở lại phát triển tiếp',
  'Ví dụ: Lời khuyên cốt lõi để ra quyết định',
  'Ví dụ: Yếu tố ẩn cần lưu tâm',
  'Ví dụ: Kết quả dự kiến trong 3 tháng tới',
];

const PLACEHOLDER_EXAMPLES_EN = [
  'e.g., Option A: Switching jobs',
  'e.g., Option B: Staying at current role',
  'e.g., Core advice for making the call',
  'e.g., Hidden factor to watch',
  'e.g., Projected outcome in 3 months',
];

export default function CustomSpreadBuilder({
  drawCount,
  onDrawCountChange,
  customPositions,
  onCustomPositionsChange,
  customSpreadTitle,
  onCustomSpreadTitleChange,
  disabled = false,
  language = 'vi',
}) {
  const isEn = language === 'en';
  const [savedTemplates, setSavedTemplates] = useState(() => loadCustomSpreadTemplates());
  const [templateNameInput, setTemplateNameInput] = useState(customSpreadTitle || '');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    setSavedTemplates(loadCustomSpreadTemplates());
  }, []);

  useEffect(() => {
    if (typeof customSpreadTitle === 'string' && customSpreadTitle.trim()) {
      setTemplateNameInput(customSpreadTitle);
    }
  }, [customSpreadTitle]);

  const safePositions = resizeCustomPositions(customPositions, drawCount);

  const handleCountSelect = (nextCountRaw) => {
    const nextCount = clampCustomCardCount(nextCountRaw);
    onDrawCountChange(nextCount);
    onCustomPositionsChange(resizeCustomPositions(safePositions, nextCount));
  };

  const handleSlotNameChange = (index, value) => {
    const next = [...safePositions];
    next[index] = value;
    onCustomPositionsChange(next);
    if (feedback.text) setFeedback({ type: '', text: '' });
  };

  const handleApplyStarter = (preset) => {
    if (disabled) return;
    const labels = isEn ? preset.positionsEn : preset.positionsVi;
    const title = isEn ? preset.nameEn : preset.nameVi;
    onDrawCountChange(preset.count);
    onCustomPositionsChange([...labels]);
    if (onCustomSpreadTitleChange) onCustomSpreadTitleChange(title);
    setTemplateNameInput(title);
    setFeedback({
      type: 'ok',
      text: isEn
        ? `Loaded starter preset "${title}".`
        : `Đã nạp sơ đồ gợi ý "${title}".`,
    });
  };

  const handleLoadUserTemplate = (tpl) => {
    if (disabled || !tpl) return;
    onDrawCountChange(tpl.count);
    onCustomPositionsChange([...tpl.positions]);
    if (onCustomSpreadTitleChange) onCustomSpreadTitleChange(tpl.name);
    setTemplateNameInput(tpl.name);
    setFeedback({
      type: 'ok',
      text: isEn ? `Loaded saved template "${tpl.name}".` : `Đã nạp mẫu đã lưu "${tpl.name}".`,
    });
  };

  const handleSaveTemplate = () => {
    if (disabled) return;
    const result = saveCustomSpreadTemplate(
      {
        name: templateNameInput || customSpreadTitle,
        count: drawCount,
        positions: safePositions,
      },
      globalThis.localStorage,
      language
    );

    if (!result.ok) {
      setFeedback({ type: 'error', text: result.error });
      return;
    }

    setSavedTemplates(result.templates);
    if (onCustomSpreadTitleChange) onCustomSpreadTitleChange(result.template.name);
    setFeedback({
      type: 'ok',
      text: isEn
        ? `Saved custom spread "${result.template.name}"!`
        : `Đã lưu mẫu sơ đồ "${result.template.name}"!`,
    });
  };

  const handleDeleteTemplate = (id, name) => {
    if (disabled) return;
    const nextList = deleteCustomSpreadTemplate(id, globalThis.localStorage);
    setSavedTemplates(nextList);
    setFeedback({
      type: 'ok',
      text: isEn ? `Deleted template "${name}".` : `Đã xóa mẫu "${name}".`,
    });
  };

  return (
    <div className="custom-spread-builder">
      <div className="custom-spread-header">
        <div className="custom-spread-title-row">
          <span aria-hidden="true">🎨</span>
          <h4 className="custom-spread-heading">
            {isEn
              ? 'Custom Spread Position Designer'
              : 'Thiết kế sơ đồ vị trí trải bài riêng'}
          </h4>
        </div>
        <div className="custom-spread-count-wrap">
          <label htmlFor="custom-spread-card-count" className="custom-spread-count-label">
            {isEn ? 'Cards:' : 'Số lá:'}
          </label>
          <select
            id="custom-spread-card-count"
            className="custom-select custom-spread-count-select"
            value={drawCount}
            onChange={(e) => handleCountSelect(e.target.value)}
            disabled={disabled}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} {isEn ? (n === 1 ? 'card' : 'cards') : 'lá'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Starter Presets */}
      <div className="custom-spread-presets-block">
        <span className="custom-spread-sublabel">
          {isEn ? 'Quick starter layouts:' : 'Mẫu gợi ý thực tế (chạm để điền nhanh):'}
        </span>
        <div className="custom-spread-preset-pills">
          {STARTER_CUSTOM_SPREAD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="custom-preset-pill-btn"
              disabled={disabled}
              onClick={() => handleApplyStarter(preset)}
            >
              <span aria-hidden="true">{preset.icon}</span>
              <span>{isEn ? preset.nameEn : preset.nameVi}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saved User Templates */}
      {savedTemplates.length > 0 && (
        <div className="custom-spread-presets-block">
          <span className="custom-spread-sublabel">
            {isEn ? 'Your saved templates:' : 'Mẫu cá nhân đã lưu:'}
          </span>
          <div className="custom-saved-templates-list">
            {savedTemplates.map((tpl) => (
              <div key={tpl.id} className="custom-saved-template-chip">
                <button
                  type="button"
                  className="custom-saved-load-btn"
                  disabled={disabled}
                  onClick={() => handleLoadUserTemplate(tpl)}
                >
                  <span>{tpl.name}</span>
                  <span className="custom-saved-count-tag">
                    {tpl.count} {isEn ? 'c' : 'lá'}
                  </span>
                </button>
                <button
                  type="button"
                  className="custom-saved-delete-btn"
                  disabled={disabled}
                  onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                  aria-label={
                    isEn ? `Delete template ${tpl.name}` : `Xóa mẫu sơ đồ ${tpl.name}`
                  }
                  title={isEn ? 'Delete template' : 'Xóa mẫu này'}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Position Role Inputs */}
      <div className="custom-positions-grid">
        {safePositions.map((val, idx) => {
          const placeholderList = isEn ? PLACEHOLDER_EXAMPLES_EN : PLACEHOLDER_EXAMPLES_VI;
          const placeholder =
            placeholderList[idx] ||
            (isEn ? `Role / question for Position ${idx + 1}` : `Vai trò / câu hỏi cho Vị trí ${idx + 1}`);
          return (
            <div key={idx} className="custom-position-field">
              <label
                htmlFor={`custom-pos-input-${idx}`}
                className="custom-position-badge-label"
              >
                <span className="custom-position-num">{idx + 1}</span>
                <span>{isEn ? `Position ${idx + 1}` : `Vị trí ${idx + 1}`}</span>
              </label>
              <input
                id={`custom-pos-input-${idx}`}
                type="text"
                className="custom-position-input"
                value={val}
                maxLength={120}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => handleSlotNameChange(idx, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {/* Save Custom Template Bar */}
      <div className="custom-save-bar">
        <input
          type="text"
          className="custom-position-input custom-template-name-input"
          value={templateNameInput}
          maxLength={80}
          disabled={disabled}
          aria-label={isEn ? 'Custom spread template name' : 'Tên mẫu sơ đồ trải bài'}
          placeholder={
            isEn
              ? 'Name this spread layout to save for reuse...'
              : 'Đặt tên sơ đồ để lưu dùng lại (VD: Chọn việc A/B)...'
          }
          onChange={(e) => {
            setTemplateNameInput(e.target.value);
            if (onCustomSpreadTitleChange) onCustomSpreadTitleChange(e.target.value);
          }}
        />
        <button
          type="button"
          className="custom-save-template-btn"
          disabled={disabled}
          onClick={handleSaveTemplate}
        >
          <span aria-hidden="true">💾</span>
          <span>{isEn ? 'Save Layout' : 'Lưu mẫu sơ đồ'}</span>
        </button>
      </div>

      {feedback.text && (
        <p
          role="status"
          className={`custom-spread-feedback ${feedback.type === 'error' ? 'is-error' : 'is-ok'}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
