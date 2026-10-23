import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { buildTarotPromptText } from '../utils/buildTarotPromptText.mjs';

/**
 * PromptExporter Component
 * Generates formatted text outputs for copy-pasting into AI platforms.
 */
export default function PromptExporter({ 
  question, 
  drawnCards, 
  spreadName, 
  spreadPositions,
  interpretationContext,
  interpretationSummary,
  getCardMeaning
}) {
  const { t, language } = useLanguage();
  const { isAuthenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'list'
  const [copied, setCopied] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'

  if (!drawnCards || drawnCards.length === 0) return null;

  const isEn = language === 'en';

  // Format drawn cards as text
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
    <div className="glass-panel prompt-exporter-panel" style={{ marginTop: 24 }}>
      <div className="card-header-flex">
        <h3 className="settings-title">{t('export.title', 'Xuất dữ liệu luận giải cho AI')}</h3>
        {isAuthenticated && (
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
              onClick={() => setActiveTab('prompt')}
            >
              {t('export.tab_prompt', 'Prompt Mẫu cho AI')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              {t('export.tab_list', 'Danh sách gọn')}
            </button>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(229, 193, 88, 0.25)',
            borderRadius: 12,
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: '1.8rem' }}>🔒</span>
          <p
            style={{
              margin: 0,
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: 1.5,
              maxWidth: 640,
            }}
          >
            {t(
              'export.guest_notice',
              'Bạn cần đăng nhập để sử dụng tính năng xuất dữ liệu luận giải cho AI.'
            )}
          </p>
          <button
            type="button"
            onClick={login}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #e5c158 0%, #c5a059 100%)',
              border: '1px solid rgba(229, 193, 88, 0.6)',
              borderRadius: 10,
              color: '#0f0622',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(229, 193, 88, 0.35)',
            }}
          >
            🔑 {t('auth.login_now', 'Đăng nhập ngay')}
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'prompt' && (
            <div className="prompt-template-selector" style={{ marginTop: 16 }}>
              <label className="template-label">{t('export.select_type', 'Chọn kiểu luận giải:')}</label>
              <div className="template-options">
                <button 
                  className={`template-opt-btn ${promptTemplate === 'standard' ? 'selected' : ''}`}
                  onClick={() => setPromptTemplate('standard')}
                >
                  {t('export.type_general', 'Tổng quan')}
                </button>
                <button 
                  className={`template-opt-btn ${promptTemplate === 'love' ? 'selected' : ''}`}
                  onClick={() => setPromptTemplate('love')}
                >
                  {t('export.type_love', 'Tình yêu')}
                </button>
                <button 
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
            <button 
              className={`copy-main-btn ${copied ? 'success' : ''}`}
              onClick={handleCopy}
            >
              {copied ? t('export.copied_btn', '✓ Đã Copy Thành Công!') : t('export.copy_btn', 'Sao chép kết quả')}
            </button>
            <span className="export-hint">
              {activeTab === 'prompt' 
                ? t('export.hint_prompt', 'Copy prompt này dán thẳng vào ChatGPT/Claude/Perplexity để có luận giải chuẩn nhất!')
                : t('export.hint_list', 'Copy danh sách ngắn gọn các lá bài đã rút.')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
