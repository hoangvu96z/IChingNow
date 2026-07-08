import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

const PREDEFINED_MODELS = [
  { value: 'oc/deepseek-v4-flash-free', label: 'oc/deepseek-v4-flash-free (DeepSeek V4)' },
  { value: 'mmf/mimo-auto', label: 'mmf/mimo-auto (Mimo Auto)' },
  { value: 'oc/hy3-free', label: 'oc/hy3-free (HY3)' }
];

export default function AiInterpretationPanel({ result, mode, plainTextResult }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    endpoint: 'http://43.128.116.69:20128/v1',
    apiKey: 'sk-6256f9bca9142176-megsyu-c0e57c8f',
    model: 'oc/deepseek-v4-flash-free',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({
    endpoint: '',
    apiKey: '',
    model: ''
  });
  const [modelType, setModelType] = useState('oc/deepseek-v4-flash-free');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');

  // Load settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('iching_ai_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Sync settings to form when settings modal opens
  useEffect(() => {
    if (showSettings) {
      setFormSettings(settings);
      const isPredefined = PREDEFINED_MODELS.some(m => m.value === settings.model);
      setModelType(isPredefined ? settings.model : 'custom');
    }
  }, [showSettings, settings]);

  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettings(formSettings);
    localStorage.setItem('iching_ai_settings', JSON.stringify(formSettings));
    setShowSettings(false);
  };

  const handleInterpret = async () => {
    if (!result) return;
    setLoading(true);
    setError('');
    setInterpretation('');
    setStatusText(t('ai.connecting', 'Đang kết nối đến server AI...'));

    try {
      const sysPrompt = `Bạn là một chuyên gia Kinh Dịch (I Ching) uyên bác, am hiểu sâu sắc về triết học phương Đông, tượng quẻ, quẻ chủ, quẻ biến, thể dụng và ý nghĩa các hào động.
Hãy đưa ra lời luận giải chi tiết, thực tế, dễ hiểu và đưa ra lời khuyên hành động cụ thể cho người hỏi.
Không dùng ngôn từ quá học thuật xa rời thực tế, hãy giải nghĩa một cách thân cận, có chiều sâu và hướng thiện. Luôn trả lời bằng tiếng Việt.`;

      const question = result.question || '';
      const caster = result.caster || '';
      const castDate = result.castDate || '';
      const castTime = result.castTime || '';

      const userPrompt = `Hãy luận giải quẻ dịch sau cho tôi:
- Việc cần xem: "${question}"
- Người lập quẻ: ${caster || 'Ẩn danh'}
- Thời gian lập: ${castDate} ${castTime}
- Thông tin quẻ chi tiết:
${plainTextResult}

Hãy luận giải theo cấu trúc sau (viết bằng Markdown):
1. **Tổng quan quẻ dịch**: Ý nghĩa quẻ chủ, quẻ biến và mối tương quan giữa Thể và Dụng.
2. **Luận giải chi tiết cho câu hỏi**: Trả lời trực tiếp vào câu hỏi "${question}", phân tích tình thế hiện tại ra sao, có thuận lợi hay trở ngại gì.
3. **Ý nghĩa các hào động (nếu có)**: Phân tích ý nghĩa của hào động và lời khuyên tại vị trí hào đó.
4. **Lời khuyên hành động**: Đưa ra 3 lời khuyên hành động thực tế, cụ thể nhất để cải biến tình huống hoặc nắm bắt cơ hội.`;

      const fallbackModels = Array.from(new Set([
        settings.model,
        'mmf/mimo-auto',
        'oc/hy3-free'
      ])).filter(Boolean);

      let lastError = null;

      for (let i = 0; i < fallbackModels.length; i++) {
        const currentModel = fallbackModels[i];
        try {
          setStatusText(
            i === 0 
              ? t('ai.generating', 'AI đang luận giải quẻ...')
              : `Mô hình ${fallbackModels[i - 1]} gặp sự cố, đang thử ${currentModel}...`
          );

          let callEndpoint = settings.endpoint.replace(/\/$/, '');
          if (callEndpoint.startsWith('http://43.128.116.69:20128') && 
              (window.location.protocol === 'https:' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1')) {
            const path = window.location.pathname;
            let base = '/';
            if (path.includes('/kinhdich')) {
              base = '/kinhdich/';
            } else if (path.includes('/tarot')) {
              base = '/tarot/';
            }
            const suffix = callEndpoint.replace('http://43.128.116.69:20128', '');
            callEndpoint = base + 'api-vps' + suffix;
          }

          const response = await fetch(`${callEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {})
            },
            body: JSON.stringify({
              model: currentModel,
              messages: [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: userPrompt }
              ],
              stream: true
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `HTTP error ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let buffer = '';
          let resultText = '';

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              let boundary = buffer.indexOf('\n');
              while (boundary !== -1) {
                const line = buffer.slice(0, boundary).trim();
                buffer = buffer.slice(boundary + 1);
                boundary = buffer.indexOf('\n');

                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6).trim();
                  if (jsonStr === '[DONE]') {
                    done = true;
                    break;
                  }
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const chunkText = parsed.choices?.[0]?.delta?.content || '';
                    resultText += chunkText;
                    setInterpretation(resultText);
                  } catch (err) {
                    // Keep buffer processing
                  }
                }
              }
            }
          }
          
          // Successful run, exit loop
          return;
        } catch (err) {
          console.warn(`Model ${currentModel} failed:`, err);
          lastError = err;
          // Clear any partial response so we don't end up with mixed texts
          setInterpretation('');
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi gọi API của server AI.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  function parseMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="color: var(--color-gold-light); font-family: \'Noto Serif\', serif; font-size: 1.05rem; margin-top: 16px; margin-bottom: 8px; font-weight: 700;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color: var(--color-gold); font-family: \'Noto Serif\', serif; font-size: 1.25rem; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid rgba(184,134,11,0.15); padding-bottom: 4px; font-weight: 700;">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="color: var(--color-gold); font-family: \'Noto Serif\', serif; font-size: 1.4rem; margin-top: 24px; margin-bottom: 12px; font-weight: 700;">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--color-ink); font-weight: 700;">$1</strong>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: square; color: var(--color-ink);">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: square; color: var(--color-ink);">$1</li>');

    // Paragraphs
    const lines = html.split('\n');
    let inList = false;
    const processed = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<li')) {
        if (!inList) {
          inList = true;
          return '<ul style="margin: 8px 0; padding-left: 10px;">' + line;
        }
        return line;
      } else {
        let prefix = '';
        if (inList) {
          inList = false;
          prefix = '</ul>';
        }
        if (trimmed === '') return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('</ul')) {
          return prefix + line;
        }
        return prefix + `<p style="margin: 8px 0; line-height: 1.65; color: var(--color-ink);">${line}</p>`;
      }
    });
    if (inList) processed.push('</ul>');

    return processed.join('\n');
  }

  return (
    <section className="card animate-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(184,134,11,0.15)', paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <div className="section-title" style={{ margin: 0 }}>
            {t('ai.title', 'Luận giải Kinh Dịch bằng AI')}
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={t('ai.config', 'Cấu hình Server AI')}
        >
          ⚙️ <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('ai.settings', 'Cấu hình')}</span>
        </button>
      </div>

      {/* AI Settings Form */}
      {showSettings && (
        <form onSubmit={handleSaveSettings} style={{ background: 'rgba(184,134,11,0.04)', border: '1px dashed rgba(184,134,11,0.2)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>{t('ai.settings_header', 'Cấu hình Server AI (9Router)')}</h4>
          
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>API Endpoint *</label>
            <input
              type="text"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              value={settings.endpoint}
              onChange={e => setSettings({ ...settings, endpoint: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>API Key (Tùy chọn)</label>
            <input
              type="password"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
              value={settings.apiKey}
              onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="Nhập API Key nếu có"
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Chọn Model *</label>
            <select
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.8125rem', height: 34, background: '#fff', border: '1px solid var(--color-ink-muted)' }}
              value={modelType}
              onChange={e => {
                const val = e.target.value;
                setModelType(val);
                if (val !== 'custom') {
                  setFormSettings({ ...formSettings, model: val });
                }
              }}
            >
              {PREDEFINED_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
              <option value="custom">Tùy chỉnh...</option>
            </select>
          </div>

          {modelType === 'custom' && (
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Nhập Model Name tùy chỉnh *</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                value={formSettings.model}
                onChange={e => setFormSettings({ ...formSettings, model: e.target.value })}
                placeholder="Nhập tên model (ví dụ: oc/deepseek-v4-flash-free)"
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowSettings(false)}>
              {t('common.cancel', 'Hủy')}
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: 'auto', boxShadow: 'none' }}>
              {t('common.save', 'Lưu lại')}
            </button>
          </div>
        </form>
      )}

      {/* Action and Interpretation */}
      {!interpretation && !loading && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <button
            onClick={handleInterpret}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              margin: '0 auto',
              padding: '12px 24px',
            }}
          >
            <span>✨</span> {t('ai.button_cast', 'Luận giải quẻ bằng AI')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0' }}>
          <div className="spinner" style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(184,134,11,0.1)',
            borderTop: '3px solid var(--color-vermillion)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
            {statusText}
          </span>
          {interpretation && (
            <div style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 8, padding: 16, marginTop: 12 }}>
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(interpretation) }} />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: 12, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, color: 'var(--color-vermillion)', fontSize: '0.875rem' }}>
          <strong>Lỗi:</strong> {error}
          <div style={{ marginTop: 8 }}>
            <button onClick={handleInterpret} className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: 'auto' }}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Final Interpretation Result */}
      {!loading && interpretation && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 8, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(interpretation) }} />
          </div>
          <button
            onClick={handleInterpret}
            className="btn-ghost"
            style={{
              fontSize: '0.8125rem',
              alignSelf: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px'
            }}
          >
            🔄 {t('ai.re_interpret', 'Yêu cầu AI luận giải lại')}
          </button>
        </div>
      )}

      {/* Styling spin anim */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
