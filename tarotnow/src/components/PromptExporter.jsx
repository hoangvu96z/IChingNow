import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { buildTarotPromptText } from '../utils/buildTarotPromptText.mjs';

/**
 * PromptExporter Component
 * Generates formatted text outputs for copy-pasting into AI platforms (unlocked for all users, Gemini recommended).
 */
export default function PromptExporter({
  question,
  drawnCards,
  spreadName,
  spreadPositions,
  interpretationContext,
  interpretationSummary,
  getCardMeaning,
}) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'list'
  const [copied, setCopied] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'

  if (!drawnCards || drawnCards.length === 0) return null;

  const isEn = language === 'en';

  const formatCardsList = () => {
    let text = `${t('form.question_label', 'Câu hỏi')}: ${question}\n${isEn ? 'Spread' : 'Trải bài'}: ${spreadName}\n`;
    if (interpretationContext) {
      text += `${t('result.perspective_prefix', 'Góc nhìn')}: ${interpretationContext}\n`;
    }
    text += `\n${isEn ? 'Drawn Cards List' : 'Danh sách lá bài đã rút'}:\n` +
      drawnCards.map((c, idx) => {
        const orientationText = c.orientation === 'reversed'
          ? t('result.mini_reversed', 'Lá ngược (reversed)')
          : t('result.mini_upright', 'Lá xuôi (upright)');
        const posText = spreadPositions && spreadPositions[idx] ? ` [${isEn ? 'Position' : 'Vị trí'}: ${spreadPositions[idx]}]` : '';
        const localMeaning = getCardMeaning ? getCardMeaning(c, interpretationContext, c.orientation) : '';

        let cardStr = `${idx + 1}. ${c.name} (${orientationText})${posText}`;
        if (localMeaning) {
          cardStr += `\n   -> ${isEn ? 'Basic meaning' : 'Giải nghĩa cơ bản'}: ${localMeaning}`;
        }
        return cardStr;
      }).join('\n\n');

    if (interpretationSummary) {
      text += `\n\n${isEn ? 'General Overview' : 'Nhận xét tổng quan'}:\n${interpretationSummary}`;
    }
    return text;
  };

  const getPromptText = () => buildTarotPromptText({
    language,
    promptTemplate,
    question,
    drawnCards,
    spreadName,
    spreadPositions,
    interpretationContext,
    interpretationSummary,
    getCardMeaning,
    t,
  });

  const handleCopy = () => {
    const textToCopy = activeTab === 'prompt' ? getPromptText() : formatCardsList();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="tarot-export-section" data-tour="tarot-export" className="glass-panel prompt-exporter-panel" style={{ marginTop: 24 }}>
      <div className="card-header-flex">
        <h3 className="settings-title">{t('export.title', 'Xuất dữ liệu luận giải cho AI')}</h3>
        <div className="tab-switcher">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            {t('export.tab_prompt', 'Prompt Mẫu cho AI')}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            {t('export.tab_list', 'Danh sách gọn')}
          </button>
        </div>
      </div>

      {activeTab === 'prompt' && (
        <div className="prompt-template-selector" style={{ marginTop: 16 }}>
          <label className="template-label">{t('export.select_type', 'Chọn kiểu luận giải:')}</label>
          <div className="template-options">
            <button
              type="button"
              className={`template-opt-btn ${promptTemplate === 'standard' ? 'selected' : ''}`}
              onClick={() => setPromptTemplate('standard')}
            >
              {t('export.type_general', 'Tổng quan')}
            </button>
            <button
              type="button"
              className={`template-opt-btn ${promptTemplate === 'love' ? 'selected' : ''}`}
              onClick={() => setPromptTemplate('love')}
            >
              {t('export.type_love', 'Tình yêu')}
            </button>
            <button
              type="button"
              className={`template-opt-btn ${promptTemplate === 'career' ? 'selected' : ''}`}
              onClick={() => setPromptTemplate('career')}
            >
              {t('export.type_career', 'Công việc')}
            </button>
          </div>
        </div>
      )}

      <div className="output-preview-box">
        <pre className="output-text">
          {activeTab === 'prompt' ? getPromptText() : formatCardsList()}
        </pre>
      </div>

      <div className="export-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-tarot-copy-ai-prompt"
            className={`copy-main-btn ${copied ? 'success' : ''}`}
            onClick={handleCopy}
          >
            {copied
              ? t('export.copied_btn', '✓ Đã Copy Thành Công!')
              : activeTab === 'prompt'
                ? (isEn ? '✨ Copy Prompt for AI (Gemini)' : '✨ Copy Prompt cho AI (Gemini)')
                : t('export.copy_btn', 'Sao chép kết quả')}
          </button>
          <a
            href="https://gemini.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              background: '#1d4ed8',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isEn ? 'Open Gemini ↗' : 'Mở Gemini ↗'}
          </a>
        </div>
        <span className="export-hint">
          {activeTab === 'prompt'
            ? (isEn
                ? '⭐ Recommended: Paste this prompt directly into Google Gemini for the deepest Tarot interpretation (free for everyone).'
                : '⭐ Quan trọng: Copy prompt này dán thẳng vào Google Gemini (khuyên dùng) để có luận giải sâu sắc nhất — miễn phí cho mọi người dùng.')
            : t('export.hint_list', 'Copy danh sách ngắn gọn các lá bài đã rút.')}
        </span>
      </div>
    </div>
  );
}
