import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { usePlan } from '../hooks/usePlan.js';
import PricingModal from './PricingModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PREDEFINED_MODELS = [
  { value: 'combo1', label: 'combo1 (Combo)' },
  { value: 'openrouter/tencent/hy3:free', label: 'hy3:free' },
  { value: 'openrouter/openai/gpt-oss-20b:free', label: 'gpt-oss-20b:free' },
  { value: 'openrouter/poolside/laguna-xs-2.1:free', label: 'laguna-xs-2.1:free' },
  { value: 'openrouter/google/gemma-4-26b-a4b-it:free', label: 'gemma-4-26b-a4b-it:free' }
];

export default function AiInterpretationPanel({ result, mode, plainTextResult, readingId, onSaveAiConversation }) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    endpoint: 'http://43.128.116.69:20128/v1',
    apiKey: 'sk-07c9f002b12e445e-luaxyd-d0592739',
    model: 'combo1',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({
    endpoint: '',
    apiKey: '',
    model: ''
  });
  const [modelType, setModelType] = useState('combo1');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');

  const [modelsList, setModelsList] = useState(PREDEFINED_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');

  const getResolvedEndpoint = (endpoint) => {
    if (!endpoint) return '';
    let callEndpoint = endpoint.replace(/\/$/, '');
    const isHttp = callEndpoint.startsWith('http://');
    const isSecureCtx = window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
    if (isHttp && isSecureCtx) {
      const path = window.location.pathname;
      let base = '/';
      if (path.startsWith('/kinhdich')) base = '/kinhdich/';
      else if (path.startsWith('/tarot')) base = '/tarot/';
      const suffix = callEndpoint.replace(/^http:\/\/[^/]+/, '');
      callEndpoint = base + 'api-vps' + suffix;
    }
    return callEndpoint;
  };

  const fetchModels = async (currentSettings) => {
    if (!currentSettings.endpoint) return;
    setLoadingModels(true);
    setModelsError('');
    try {
      const resolvedEndpoint = getResolvedEndpoint(currentSettings.endpoint);
      const headers = {
        'Content-Type': 'application/json',
      };
      if (currentSettings.apiKey) {
        headers['Authorization'] = `Bearer ${currentSettings.apiKey}`;
      }
      const response = await fetch(`${resolvedEndpoint}/models`, {
        method: 'GET',
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const fetched = data.data.map(m => {
          const simpleName = m.id.split('/').pop();
          const label = m.owned_by === 'combo' ? `${simpleName} (Combo)` : simpleName;
          return {
            value: m.id,
            label: label
          };
        });
        setModelsList(fetched);
      } else {
        throw new Error('Định dạng dữ liệu không đúng');
      }
    } catch (err) {
      console.warn('Error fetching models:', err);
      setModelsError('Không thể lấy danh sách model: ' + err.message);
    } finally {
      setLoadingModels(false);
    }
  };

  // Load settings
  useEffect(() => {
    const defaultSettings = {
      endpoint: 'http://43.128.116.69:20128/v1',
      apiKey: 'sk-07c9f002b12e445e-luaxyd-d0592739',
      model: 'combo1',
    };
    let activeSettings = { ...defaultSettings };
    try {
      const saved = localStorage.getItem('iching_ai_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        activeSettings = {
          ...activeSettings,
          endpoint: parsed.endpoint || activeSettings.endpoint,
          model: parsed.model || activeSettings.model
        };
      }
    } catch (e) {}
    setSettings(activeSettings);
    fetchModels(activeSettings);
  }, []);

  // Sync settings to form when settings modal opens
  useEffect(() => {
    if (showSettings) {
      setFormSettings(settings);
      const isPredefined = modelsList.some(m => m.value === settings.model);
      setModelType(isPredefined ? settings.model : 'custom');
    }
  }, [showSettings, settings, modelsList]);

  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const newSettings = {
      endpoint: formSettings.endpoint,
      apiKey: 'sk-07c9f002b12e445e-luaxyd-d0592739', // Enforced default
      model: formSettings.model
    };
    setSettings(newSettings);
    localStorage.setItem('iching_ai_settings', JSON.stringify({
      endpoint: newSettings.endpoint,
      model: newSettings.model
    }));
    fetchModels(newSettings);
  };

  // ─── AI Follow-up Q&A State ───────────────────────────────────────────────
  const [followUps, setFollowUps] = useState([]); // [{ question: '', answer: '' }]
  const [userQuestion, setUserQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [currentFollowUpAnswer, setCurrentFollowUpAnswer] = useState('');

  const charCount = userQuestion.length;
  const isCharCountValid = charCount > 0 && charCount <= 2048;

  // ─── Quota & Plan ─────────────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  const { canAsk, remaining, plan, canBonus, consumeQuota, requestBonus, applyCoupon } = usePlan(isAuthenticated);
  const [showPricing, setShowPricing] = useState(false);

  // Restore AI conversation khi load từ history
  useEffect(() => {
    if (result?.aiConversation) {
      const conv = result.aiConversation;
      if (conv.initialInterpretation) {
        setInterpretation(conv.initialInterpretation);
      }
      if (Array.isArray(conv.followUps) && conv.followUps.length > 0) {
        setFollowUps(conv.followUps);
      }
    } else {
      // Reset khi có result mới không có conversation
      setInterpretation('');
      setFollowUps([]);
      setUserQuestion('');
      setError('');
    }
  }, [result?.createdAt]);

  const handleInterpret = async () => {
    if (!result) return;

    // Check quota before calling AI
    const quotaResult = await consumeQuota();
    if (!quotaResult.ok) {
      setShowPricing(true);
      return;
    }

    setLoading(true);
    setError('');
    setInterpretation('');
    setFollowUps([]);
    setUserQuestion('');
    setFollowUpError('');
    setCurrentFollowUpAnswer('');
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
        'combo1',
        'openrouter/tencent/hy3:free'
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

          const callEndpoint = getResolvedEndpoint(settings.endpoint);

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
          
          // Successful run, exit loop — persist interpretation lên server
          persistInitialInterpretation(resultText);
          return;
        } catch (err) {
          console.warn(`Model ${currentModel} failed:`, err);
          lastError = err;
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

  // Persist initial interpretation sau khi AI trả lời xong
  const persistInitialInterpretation = (interpretationText) => {
    if (!onSaveAiConversation || !interpretationText) return;
    onSaveAiConversation(readingId, {
      aiConversation: {
        ...(result?.aiConversation || {}),
        initialInterpretation: interpretationText,
        initialTimestamp: new Date().toISOString(),
        followUps: result?.aiConversation?.followUps || [],
      }
    });
  };

  // Handler cho câu hỏi thêm tới AI (Memory 100% ngữ cảnh quẻ + lịch sử trò chuyện)
  const handleSendFollowUp = async (e) => {
    if (e) e.preventDefault();
    if (!userQuestion.trim() || askingFollowUp || followUps.length >= 5 || !isCharCountValid) return;

    // Check quota before calling AI
    const quotaResult = await consumeQuota();
    if (!quotaResult.ok) {
      setShowPricing(true);
      return;
    }

    const questionToSend = userQuestion.trim();
    setAskingFollowUp(true);
    setFollowUpError('');
    setCurrentFollowUpAnswer('');

    try {
      const sysPrompt = `Bạn là một chuyên gia Kinh Dịch (I Ching) uyên bác, thấu đáo.
Người dùng đang hỏi thêm một câu hỏi cụ thể dựa trên quẻ dịch và thông tin đã luận giải trước đó.
Yêu cầu quan trọng khi trả lời câu hỏi thêm:
1. Trả lời NGẮN GỌN, súc tích, đi thẳng vào trọng tâm câu hỏi của người dùng. KHÔNG dông dài, KHÔNG lặp lại phần giới thiệu hay thông tin quẻ ban đầu.
2. Phân tích ngắn gọn dựa trên tượng quẻ, hào động hoặc thể dụng liên quan trực tiếp tới thắc mắc này.
3. Đưa ra kết luận hoặc lời khuyên cụ thể, ngắn gọn, dễ hiểu. Luôn trả lời bằng tiếng Việt.`;

      const question = result?.question || '';
      const caster = result?.caster || '';
      const castDate = result?.castDate || '';
      const castTime = result?.castTime || '';

      const initialUserPrompt = `Hãy luận giải quẻ dịch sau cho tôi:
- Việc cần xem: "${question}"
- Người lập quẻ: ${caster || 'Ẩn danh'}
- Thời gian lập: ${castDate} ${castTime}
- Thông tin quẻ chi tiết:
${plainTextResult}`;

      // Xây dựng chuỗi hội thoại giữ đầy đủ bộ nhớ (Memory)
      const messages = [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: initialUserPrompt },
        { role: 'assistant', content: interpretation }
      ];

      followUps.forEach(item => {
        messages.push({ role: 'user', content: item.question });
        messages.push({ role: 'assistant', content: item.answer });
      });

      messages.push({ role: 'user', content: questionToSend });

      const fallbackModels = Array.from(new Set([
        settings.model,
        'combo1',
        'openrouter/tencent/hy3:free'
      ])).filter(Boolean);

      let lastErr = null;
      let finalAns = '';

      for (let i = 0; i < fallbackModels.length; i++) {
        const currentModel = fallbackModels[i];
        try {
          const callEndpoint = getResolvedEndpoint(settings.endpoint);
          const response = await fetch(`${callEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {})
            },
            body: JSON.stringify({
              model: currentModel,
              messages,
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
                    finalAns += chunkText;
                    setCurrentFollowUpAnswer(finalAns);
                  } catch (err) {}
                }
              }
            }
          }

          const newFollowUp = {
            id: Date.now().toString(),
            question: questionToSend,
            answer: finalAns,
            questionTimestamp: new Date(Date.now() - finalAns.length * 5).toISOString(), // approximate
            answerTimestamp: new Date().toISOString(),
          };
          const updatedFollowUps = [...followUps, newFollowUp];
          setFollowUps(updatedFollowUps);
          setUserQuestion('');
          setCurrentFollowUpAnswer('');

          // Persist follow-up lên server
          if (onSaveAiConversation && readingId) {
            onSaveAiConversation(readingId, {
              aiConversation: {
                ...(result?.aiConversation || {}),
                initialInterpretation: interpretation,
                initialTimestamp: result?.aiConversation?.initialTimestamp || new Date().toISOString(),
                followUps: updatedFollowUps,
              }
            });
          }
          return;
        } catch (err) {
          console.warn(`Follow-up model ${currentModel} failed:`, err);
          lastErr = err;
          setCurrentFollowUpAnswer('');
        }
      }

      if (lastErr) throw lastErr;
    } catch (err) {
      console.error(err);
      setFollowUpError(err.message || 'Lỗi khi kết nối AI để trả lời câu hỏi.');
    } finally {
      setAskingFollowUp(false);
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
    <>
    <PricingModal
      isOpen={showPricing}
      onClose={() => setShowPricing(false)}
      currentPlan={plan}
      canBonus={canBonus}
      onRequestBonus={requestBonus}
      onApplyCoupon={applyCoupon}
    />
    <section className="card animate-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(184,134,11,0.15)', paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <div className="section-title" style={{ margin: 0 }}>
            {t('ai.title', 'Luận giải Kinh Dịch bằng AI')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quota badge */}
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
            background: 'rgba(184,134,11,0.08)', color: remaining === 0 ? '#ef4444' : 'var(--color-ink-muted)',
            border: `1px solid ${remaining === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(184,134,11,0.2)'}`,
          }}>
            ⚡ {remaining} lượt
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-ink-muted)',
              cursor: 'pointer', fontSize: '1rem', padding: 4,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            title={t('ai.config', 'Cấu hình Server AI')}
          >
            ⚙️ <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('ai.settings', 'Cấu hình')}</span>
          </button>
        </div>
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
              value={formSettings.endpoint}
              onChange={e => setFormSettings({ ...formSettings, endpoint: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>Chọn Model *</span>
              {loadingModels && <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)' }}>⏳ Đang tải...</span>}
              {modelsError && <span style={{ fontSize: '0.6875rem', color: 'var(--color-vermillion)' }} title={modelsError}>⚠️ Lỗi tải model</span>}
            </label>
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
              {modelsList.map(m => (
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
                placeholder="Nhập tên model (ví dụ: combo1)"
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

      {/* Final Interpretation Result & Interactive Q&A */}
      {!loading && interpretation && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 8, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(interpretation) }} />
          </div>

          {/* Interactive Follow-up Q&A Section */}
          <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px dashed rgba(184,134,11,0.25)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💬</span> {t('ai.followup_title', 'Hỏi thêm AI về quẻ này')}
              </h4>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: followUps.length >= 5 ? 'rgba(192,57,43,0.1)' : 'rgba(184,134,11,0.1)', color: followUps.length >= 5 ? 'var(--color-vermillion)' : 'var(--color-gold)' }}>
                {followUps.length}/5 câu hỏi
              </span>
            </div>

            {/* Chat History */}
            {followUps.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(184,134,11,0.03)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-vermillion)', background: 'rgba(192,57,43,0.1)', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
                    Hỏi #{idx + 1}
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', marginTop: 2 }}>
                    {item.question}
                  </div>
                </div>
                <div style={{ paddingLeft: 12, borderLeft: '3px solid var(--color-gold)', marginTop: 4 }}>
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(item.answer) }} />
                </div>
              </div>
            ))}

            {/* Current Streaming Answer */}
            {askingFollowUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(184,134,11,0.04)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(184,134,11,0.2)', borderTop: '2px solid var(--color-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold)' }}>AI đang suy nghĩ lời giải đáp...</span>
                </div>
                {currentFollowUpAnswer && (
                  <div style={{ paddingLeft: 12, borderLeft: '3px solid var(--color-gold)', marginTop: 4 }}>
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(currentFollowUpAnswer) }} />
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Error */}
            {followUpError && (
              <div style={{ padding: 10, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, color: 'var(--color-vermillion)', fontSize: '0.8125rem' }}>
                ⚠️ {followUpError}
              </div>
            )}

            {/* Question Input Form */}
            {followUps.length < 5 ? (
              <form onSubmit={handleSendFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <div>
                  <textarea
                    rows={3}
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder={t('ai.followup_placeholder', 'Nhập câu hỏi thêm của bạn về quẻ dịch này (ví dụ: Vận trình tháng sau thế nào? Tình cảm có tiến triển gì không?)...')}
                    disabled={askingFollowUp}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1px solid ${charCount > 2048 ? 'var(--color-vermillion)' : 'rgba(184,134,11,0.3)'}`,
                      background: 'var(--color-paper, #fbf9f4)',
                      fontSize: '0.875rem',
                      fontFamily: "'Be Vietnam Pro', sans-serif",
                      resize: 'vertical',
                      outline: 'none',
                      color: 'var(--color-ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    marginTop: 4,
                    fontSize: '0.75rem',
                  }}>
                    <span style={{ color: charCount > 2048 ? 'var(--color-vermillion)' : 'var(--color-ink-muted)', fontWeight: charCount > 2048 ? 700 : 400 }}>
                      {charCount > 2048 ? `⚠️ Đã vượt quá số ký tự quy định (${charCount}/2048 ký tự)` : `${charCount} / 2048 ký tự`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="submit"
                    disabled={askingFollowUp || !userQuestion.trim() || !isCharCountValid}
                    className="btn-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.85rem',
                      opacity: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 0.5 : 1,
                      cursor: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {askingFollowUp ? '⏳ Đang gửi...' : '💬 Gửi câu hỏi'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '12px 16px',
                background: 'rgba(184,134,11,0.08)',
                borderRadius: 8,
                fontSize: '0.8125rem',
                color: 'var(--color-ink-muted)',
                fontWeight: 500,
                border: '1px solid rgba(184,134,11,0.2)',
              }}>
                ℹ️ Bạn đã sử dụng tối đa 5 câu hỏi thêm cho lượt luận giải quẻ này.
              </div>
            )}
          </div>
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
    </>
  );
}
