import React, { useState, useEffect, useRef } from 'react';
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

// ─── Danh sách lời động viên / nhắc nhở vui nhộn & huyền bí theo chủ đề Kinh Dịch ───
const ICHING_WAIT_QUOTES = {
  vi: [
    { icon: '☯️', title: 'Âm Dương giao hòa', desc: 'Bát quái đang xoay vần, âm dương tương giao định càn khôn...' },
    { icon: '📜', title: 'Thỉnh giáo Tiền nhân', desc: 'Đang kết nối hào tượng ngàn năm của Văn Vương và Chu Công...' },
    { icon: '⚡', title: 'Hào biến chuyển dịch', desc: 'Các hào động đang phân định thể dụng, giải mã thiên cơ...' },
    { icon: '☕', title: 'Người quân tử kiên nhẫn', desc: 'Trà ngon cần ủ, quẻ quý cần thời gian — AI đang trau chuốt lời khuyên sâu sắc nhất...' },
    { icon: '🌊', title: 'Thuận theo tự nhiên', desc: 'Thủy hỏa tương sinh, vạn vật chuyển dời, câu trả lời chuẩn xác đang hội tụ...' },
    { icon: '🎋', title: 'Sắp lộ quẻ tường tận', desc: 'Chỉ còn vài giây nữa, bản luận giải trọn vẹn và chỉnh chu nhất sẽ hiện ra!' },
    { icon: '✨', title: 'Tâm tĩnh trí sáng', desc: 'Hít sâu một hơi, giữ tâm thanh tịnh để đón nhận lời chỉ dẫn cát tường...' },
    { icon: '🔮', title: 'Đúc kết Dịch lý', desc: 'Đang tổng hợp 6 hào và biến quẻ thành 3 lời khuyên thực tế cho bạn...' }
  ],
  en: [
    { icon: '☯️', title: 'Yin & Yang in Harmony', desc: 'The Bagua is turning, cosmic energies aligning destiny...' },
    { icon: '📜', title: 'Consulting Ancient Sages', desc: 'Seeking timeless wisdom from King Wen and the Duke of Zhou...' },
    { icon: '⚡', title: 'Shifting Moving Lines', desc: 'Analyzing primary and changed hexagrams for clear direction...' },
    { icon: '☕', title: 'Patience of the Wise', desc: 'Profound insights take a moment to brew — crafting your complete guidance...' },
    { icon: '🌊', title: 'Flowing with Nature', desc: 'Water flows, heaven shifts; deep answers are crystallizing...' },
    { icon: '🎋', title: 'Almost Ready', desc: 'Just a few seconds! Your comprehensive reading will be revealed all at once.' },
    { icon: '✨', title: 'Mindful Presence', desc: 'Take a deep breath and prepare to receive auspicious wisdom...' }
  ]
};

// ─── Component Animation Đợi Luận Giải Kinh Dịch ───
function IChingWaitingAnimation({ isEn, retryInfo, elapsedSeconds }) {
  const quotes = isEn ? ICHING_WAIT_QUOTES.en : ICHING_WAIT_QUOTES.vi;
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, 3200);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const currentQuote = quotes[quoteIndex] || quotes[0];

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 16px',
      background: 'linear-gradient(180deg, rgba(184,134,11,0.06) 0%, rgba(26,107,74,0.04) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(184,134,11,0.25)',
      boxShadow: '0 8px 32px rgba(44,24,16,0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Bagua Trigram Watermarks */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '11rem',
        opacity: 0.04,
        color: 'var(--color-gold)',
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: 1
      }}>
        ☯
      </div>

      {/* Spinning Bagua / Tai Chi Visual */}
      <div style={{ position: 'relative', width: 84, height: 84, marginBottom: 18 }}>
        {/* Outer rotating trigram orbit ring */}
        <div className="iching-orbit-ring" style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px dashed rgba(184,134,11,0.45)',
          animation: 'spin 12s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ position: 'absolute', top: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☰</span>
          <span style={{ position: 'absolute', right: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☲</span>
          <span style={{ position: 'absolute', bottom: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☷</span>
          <span style={{ position: 'absolute', left: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☵</span>
        </div>

        {/* Center glowing Yin Yang */}
        <div style={{
          position: 'absolute',
          inset: 10,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(240,230,200,0.8) 100%)',
          boxShadow: '0 0 20px rgba(184,134,11,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulseGlow 2.4s ease-in-out infinite'
        }}>
          <span style={{
            fontSize: '2.2rem',
            animation: 'spinReverse 6s linear infinite',
            display: 'inline-block',
            color: 'var(--color-ink)',
            filter: 'drop-shadow(0 2px 4px rgba(44,24,16,0.2))'
          }}>
            ☯
          </span>
        </div>
      </div>

      {/* Rotating Quote Card */}
      <div style={{
        maxWidth: 520,
        textAlign: 'center',
        opacity: fade ? 1 : 0,
        transform: fade ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        minHeight: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
      }}>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--color-gold)',
          fontFamily: "'Noto Serif', serif",
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{currentQuote.icon}</span>
          <span>{currentQuote.title}</span>
        </div>
        <div style={{
          fontSize: '0.84rem',
          color: 'var(--color-ink)',
          lineHeight: 1.5,
          fontStyle: 'italic',
          padding: '0 12px'
        }}>
          "{currentQuote.desc}"
        </div>
      </div>

      {/* Auto Retry indicator if triggered */}
      {retryInfo && (
        <div style={{
          marginTop: 12,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'rgba(192,57,43,0.1)',
          border: '1px solid rgba(192,57,43,0.3)',
          color: 'var(--color-vermillion)',
          fontSize: '0.78rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          animation: 'fadeIn 0.3s ease'
        }}>
          <span>🔄</span>
          <span>{retryInfo}</span>
        </div>
      )}

      {/* Progress Bar & Timer */}
      <div style={{ width: '80%', maxWidth: 360, marginTop: 16 }}>
        <div style={{
          height: 4,
          background: 'rgba(184,134,11,0.15)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(90deg, var(--color-gold), var(--color-vermillion))',
            borderRadius: 4,
            animation: 'shimmerSlide 1.8s ease-in-out infinite'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: '0.72rem',
          color: 'var(--color-ink-muted)',
          fontWeight: 500
        }}>
          <span>{isEn ? 'Synthesizing full interpretation...' : 'Đang đúc kết trọn vẹn luận giải...'}</span>
          <span>{elapsedSeconds}s</span>
        </div>
      </div>
    </div>
  );
}

export default function AiInterpretationPanel({ result, mode, plainTextResult, readingId, onSaveAiConversation }) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
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
  const [retryStatus, setRetryStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [modelsList, setModelsList] = useState(PREDEFINED_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');

  // ─── Follow-up Q&A State ──────────────────────────────────────────────────
  const [followUps, setFollowUps] = useState([]); // [{ question: '', answer: '' }]
  const [userQuestion, setUserQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [followUpRetryStatus, setFollowUpRetryStatus] = useState('');
  const [followUpElapsed, setFollowUpElapsed] = useState(0);

  const charCount = userQuestion.length;
  const isCharCountValid = charCount > 0 && charCount <= 2048;

  // ─── Quota & Plan ─────────────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  const { canAsk, remaining, plan, canBonus, expiresAt, daysRemaining, isExpiringSoon, isOverride, consumeQuota, requestBonus, applyCoupon } = usePlan(isAuthenticated);
  const [showPricing, setShowPricing] = useState(false);

  // Timer cho loading state
  useEffect(() => {
    let timer = null;
    if (loading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  useEffect(() => {
    let timer = null;
    if (askingFollowUp) {
      setFollowUpElapsed(0);
      timer = setInterval(() => {
        setFollowUpElapsed(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [askingFollowUp]);

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
    try {
      localStorage.setItem('iching_ai_settings', JSON.stringify({
        endpoint: newSettings.endpoint,
        model: newSettings.model
      }));
    } catch {}
    setShowSettings(false);
    fetchModels(newSettings);
  };

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
      setInterpretation('');
      setFollowUps([]);
      setUserQuestion('');
      setError('');
    }
  }, [result?.createdAt]);

  // ─── HÀM GỌI AI CHỐNG MẤT KẾT NỐI VÀ TỰ ĐỘNG RETRY ───
  const fetchAiWithRetry = async (messages, onStatusUpdate) => {
    const fallbackModels = Array.from(new Set([
      settings.model,
      'combo1',
      'openrouter/tencent/hy3:free'
    ])).filter(Boolean);

    const callEndpoint = getResolvedEndpoint(settings.endpoint);
    const MAX_RETRIES_PER_MODEL = 2; // Thử lại tối đa 2 lần mỗi model
    let lastError = null;

    for (let modelIdx = 0; modelIdx < fallbackModels.length; modelIdx++) {
      const currentModel = fallbackModels[modelIdx];

      for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        try {
          if (modelIdx > 0 || attempt > 1) {
            const retryMsg = isEn
              ? `Reconnecting with ${currentModel} (Attempt ${attempt}/${MAX_RETRIES_PER_MODEL})...`
              : `Đang kết nối lại với ${currentModel} (Lần ${attempt}/${MAX_RETRIES_PER_MODEL})...`;
            if (onStatusUpdate) onStatusUpdate(retryMsg);
            // Delay nhẹ trước khi retry để server/network phục hồi
            await new Promise(r => setTimeout(r, 1200 * attempt));
          } else {
            if (onStatusUpdate) onStatusUpdate('');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 65000); // 65s timeout

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
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `HTTP ${response.status}`);
          }

          // Đọc toàn bộ stream vào bộ đệm, KHÔNG render từng từ dở dang
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let buffer = '';
          let accumulatedText = '';

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
                    accumulatedText += chunkText;
                  } catch (e) {}
                }
              }
            }
          }

          // Kiểm tra tính toàn vẹn: nếu dữ liệu trả về rỗng hoặc quá ngắn do đứt cáp bất ngờ, coi như thất bại để retry
          if (!accumulatedText || accumulatedText.trim().length < 40) {
            throw new Error('Dữ liệu trả về bị ngắt quãng hoặc không hoàn chỉnh');
          }

          // Thành công nhận toàn bộ dữ liệu!
          return accumulatedText.trim();
        } catch (err) {
          console.warn(`[AI Request] Model ${currentModel} attempt ${attempt} failed:`, err);
          lastError = err;
        }
      }
    }

    throw lastError || new Error('Không thể kết nối đến server AI sau nhiều lần thử.');
  };

  // ─── Luận giải quẻ dịch ───
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
    setRetryStatus('');
    setInterpretation('');
    setFollowUps([]);
    setUserQuestion('');
    setFollowUpError('');

    try {
      const sysPrompt = isEn
        ? `You are a deeply wise I Ching (Kinh Dịch) scholar with profound knowledge of Eastern philosophy, hexagram imagery, primary and changed hexagrams, Ti-Yong (Thể-Dụng), and moving lines. Provide a detailed, practical, empathetic, and actionable interpretation for the user. Always respond in English.`
        : `Bạn là một chuyên gia Kinh Dịch (I Ching) uyên bác, am hiểu sâu sắc về triết học phương Đông, tượng quẻ, quẻ chủ, quẻ biến, thể dụng và ý nghĩa các hào động. Hãy đưa ra lời luận giải chi tiết, thực tế, dễ hiểu và đưa ra lời khuyên hành động cụ thể cho người hỏi. Luôn trả lời bằng tiếng Việt.`;

      const question = result.question || '';
      const caster = result.caster || '';
      const castDate = result.castDate || '';
      const castTime = result.castTime || '';

      const userPrompt = isEn
        ? `Please interpret the following I Ching hexagram reading for me:\n- Topic / Question: "${question}"\n- Caster: ${caster || 'Anonymous'}\n- Date & Time: ${castDate} ${castTime}\n- Detailed Hexagram Info:\n${plainTextResult}\n\nPlease format your analysis using Markdown with the following structure:\n1. **Hexagram Overview**: Primary hexagram, changed hexagram, and Ti-Yong energetic relationship.\n2. **Detailed Analysis for Question**: Address "${question}" directly, analyzing current situation and potential obstacles.\n3. **Moving Lines Analysis (if any)**: Analyze specific meaning and advice of each moving line.\n4. **Actionable Guidance**: Provide 3 concrete, practical steps to navigate this situation.\n\nCRITICAL REQUIREMENT AT THE END:\nAt the very end of your response, output exact delimiter line "---SUGGESTED_QUESTIONS---" followed by 3 concise follow-up questions relevant to this reading:\n---SUGGESTED_QUESTIONS---\n1. [Question 1]\n2. [Question 2]\n3. [Question 3]`
        : `Hãy luận giải quẻ dịch sau cho tôi:\n- Việc cần xem: "${question}"\n- Người lập quẻ: ${caster || 'Ẩn danh'}\n- Thời gian lập: ${castDate} ${castTime}\n- Thông tin quẻ chi tiết:\n${plainTextResult}\n\nHãy luận giải theo cấu trúc sau (viết bằng Markdown):\n1. **Tổng quan quẻ dịch**: Ý nghĩa quẻ chủ, quẻ biến và mối tương quan giữa Thể và Dụng.\n2. **Luận giải chi tiết cho câu hỏi**: Trực tiếp câu hỏi "${question}", phân tích tình thế hiện tại ra sao, có thuận lợi hay trở ngại gì.\n3. **Ý nghĩa các hào động (nếu có)**: Phân tích ý nghĩa của hào động và lời khuyên tại vị trí hào đó.\n4. **Lời khuyên hành động**: Đưa ra 3 lời khuyên hành động thực tế, cụ thể nhất để cải biến tình huống hoặc nắm bắt cơ hội.\n\nYÊU CẦU BẮT BUỘC Ở CUỐI BÀI:\nỞ cuối cùng bài viết, hãy xuất đúng dòng phân cách "---SUGGESTED_QUESTIONS---" theo sau là 3 câu hỏi đào sâu ngắn gọn dành riêng cho quẻ này:\n---SUGGESTED_QUESTIONS---\n1. [Câu hỏi 1]\n2. [Câu hỏi 2]\n3. [Câu hỏi 3]`;

      const messages = [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Gọi AI với cơ chế retry tự động và gom kết quả toàn vẹn
      const fullText = await fetchAiWithRetry(messages, (status) => {
        setRetryStatus(status);
      });

      // Render 1 lần trọn vẹn
      setInterpretation(fullText);

      if (onSaveAiConversation && readingId) {
        onSaveAiConversation(readingId, {
          aiConversation: {
            initialInterpretation: fullText,
            initialTimestamp: new Date().toISOString(),
            followUps: [],
          }
        });
      }
    } catch (err) {
      console.error('AI Error:', err);
      setError(err.message || (isEn ? 'Error calling AI Server.' : 'Lỗi khi gọi API của server AI. Vui lòng bấm thử lại.'));
    } finally {
      setLoading(false);
      setRetryStatus('');
    }
  };

  const parseInterpretationAndQuestions = (fullText) => {
    if (!fullText) return { cleanText: '', questions: [] };

    let cleanText = fullText;
    let questionsPart = '';

    const regexHeader = /(?:---SUGGESTED_QUESTIONS---|###?\s*💡?\s*Gợi ý\s*(?:3\s*)?câu hỏi|###?\s*💡?\s*Suggested\s*(?:3\s*)?Follow-up|💡\s*Gợi ý\s*(?:3\s*)?câu hỏi|💡\s*Suggested\s*(?:3\s*)?Follow-up)/i;
    const match = fullText.match(regexHeader);

    if (match && match.index !== undefined) {
      cleanText = fullText.slice(0, match.index).trim();
      cleanText = cleanText.replace(/---\s*$/, '').trim();
      questionsPart = fullText.slice(match.index).trim();
    }

    const questions = [];
    if (questionsPart) {
      const lines = questionsPart.split('\n');
      lines.forEach(line => {
        let cleaned = line.trim();
        if (/gợi ý|suggested|follow-up|câu hỏi tiếp theo/i.test(cleaned) && !/Q\d|câu hỏi \d|\?/i.test(cleaned)) {
          return;
        }

        cleaned = cleaned
          .replace(/^(?:---SUGGESTED_QUESTIONS---|###?\s*|💡\s*|\d+\.|\*|-)*\s*/gi, '')
          .replace(/^(?:\*\*)?Q\d+:?\s*/gi, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .replace(/^["'“`]+|["'”`]+$/g, '')
          .replace(/\*\*+/g, '')
          .trim();

        if (cleaned && cleaned.length > 8) {
          if (!questions.includes(cleaned)) {
            questions.push(cleaned);
          }
        }
      });
    }

    return { cleanText, questions: questions.slice(0, 3) };
  };

  const { cleanText: displayInterpretation, questions: aiSuggestedQuestions } = parseInterpretationAndQuestions(interpretation);

  // ─── Handler cho câu hỏi thêm tới AI (Memory 100% ngữ cảnh quẻ + render toàn vẹn) ───
  const handleSendFollowUp = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const questionToSend = (textOverride || userQuestion).trim();
    if (!questionToSend || askingFollowUp || followUps.length >= 5) return;

    setAskingFollowUp(true);
    setFollowUpError('');
    setFollowUpRetryStatus('');

    try {
      const sysPrompt = isEn
        ? `You are an expert I Ching (Kinh Dịch) scholar. The user is asking a follow-up question based on their hexagram reading and previous interpretation.\nRequirements:\n1. Answer CONCISELY and directly address the user's question. Do NOT repeat introductory information or hexagram setup.\n2. Briefly analyze based on hexagram imagery, moving lines, or Ti-Yong energy.\n3. Conclude with clear, practical advice. Always respond in English.`
        : `Bạn là một chuyên gia Kinh Dịch (I Ching) uyên bác, thấu đáo. Người dùng đang hỏi thêm một câu hỏi cụ thể dựa trên quẻ dịch và thông tin đã luận giải trước đó.\nYêu cầu quan trọng khi trả lời câu hỏi thêm:\n1. Trả lời NGẮN GỌN, súc tích, đi thẳng vào trọng tâm câu hỏi của người dùng. KHÔNG dông dài, KHÔNG lặp lại phần giới thiệu hay thông tin quẻ ban đầu.\n2. Phân tích ngắn gọn dựa trên tượng quẻ, hào động hoặc thể dụng liên quan trực tiếp tới thắc mắc này.\n3. Đưa ra kết luận hoặc lời khuyên cụ thể, ngắn gọn, dễ hiểu. Luôn trả lời bằng tiếng Việt.`;

      const question = result?.question || '';
      const caster = result?.caster || '';
      const castDate = result?.castDate || '';
      const castTime = result?.castTime || '';

      const initialUserPrompt = isEn
        ? `Please interpret the following I Ching hexagram reading:\n- Topic / Question: "${question}"\n- Caster: ${caster || 'Anonymous'}\n- Date & Time: ${castDate} ${castTime}\n- Hexagram details:\n${plainTextResult}`
        : `Hãy luận giải quẻ dịch sau cho tôi:\n- Việc cần xem: "${question}"\n- Người lập quẻ: ${caster || 'Ẩn danh'}\n- Thời gian lập: ${castDate} ${castTime}\n- Thông tin quẻ chi tiết:\n${plainTextResult}`;

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

      // Gọi AI với cơ chế retry tự động
      const finalAns = await fetchAiWithRetry(messages, (status) => {
        setFollowUpRetryStatus(status);
      });

      const newFollowUp = {
        id: Date.now().toString(),
        question: questionToSend,
        answer: finalAns,
        questionTimestamp: new Date().toISOString(),
        answerTimestamp: new Date().toISOString(),
      };
      const updatedFollowUps = [...followUps, newFollowUp];
      setFollowUps(updatedFollowUps);
      setUserQuestion('');

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
    } catch (err) {
      console.error(err);
      setFollowUpError(err.message || (isEn ? 'Error connecting to AI. Please try again.' : 'Lỗi khi kết nối AI để trả lời câu hỏi. Vui lòng bấm gửi lại.'));
    } finally {
      setAskingFollowUp(false);
      setFollowUpRetryStatus('');
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
      expiresAt={expiresAt}
      daysRemaining={daysRemaining}
      isExpiringSoon={isExpiringSoon}
      isOverride={isOverride}
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

      {/* Action and Initial Button */}
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

      {/* Loading state: Beautiful animated Yin-Yang Bagua + Rotating quotes + Timer */}
      {loading && (
        <IChingWaitingAnimation
          isEn={isEn}
          retryInfo={retryStatus}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: 14, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, color: 'var(--color-vermillion)', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
            <span>⚠️</span> {isEn ? 'Connection issue:' : 'Chưa hoàn tất luận giải:'}
          </div>
          <div style={{ opacity: 0.9, lineHeight: 1.5 }}>{error}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button onClick={handleInterpret} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: 'auto' }}>
              🔄 {isEn ? 'Try Again' : 'Thử lại ngay'}
            </button>
          </div>
        </div>
      )}

      {/* Final Interpretation Result & Interactive Q&A (Rendered All At Once) */}
      {!loading && interpretation && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(184,134,11,0.22)', borderRadius: 10, padding: 22, boxShadow: '0 4px 16px rgba(44,24,16,0.03)' }}>
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(displayInterpretation) }} />
            {result?.aiConversation?.initialTimestamp && (
              <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: 14, fontFamily: 'monospace', opacity: 0.75, borderTop: '1px dashed rgba(184,134,11,0.15)', paddingTop: 8 }}>
                🕐 {new Date(result.aiConversation.initialTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}
          </div>

          {/* Interactive Follow-up Q&A Section */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px dashed rgba(184,134,11,0.25)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💬</span> {t('ai.followup_title', 'Hỏi thêm AI về quẻ này')}
              </h4>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: followUps.length >= 5 ? 'rgba(192,57,43,0.1)' : 'rgba(184,134,11,0.1)', color: followUps.length >= 5 ? 'var(--color-vermillion)' : 'var(--color-gold)' }}>
                {followUps.length}/5 câu hỏi
              </span>
            </div>

            {/* Chat History */}
            {followUps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {followUps.map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Question bubble (Right aligned) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        maxWidth: '80%',
                        background: 'rgba(184,134,11,0.12)',
                        border: '1px solid rgba(184,134,11,0.3)',
                        borderRadius: '12px 12px 4px 12px',
                        padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                          {item.question}
                        </div>
                        {item.questionTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)', marginTop: 4, textAlign: 'right', fontFamily: 'monospace' }}>
                            🕐 {new Date(item.questionTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Answer bubble (Left aligned) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%',
                        background: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(184,134,11,0.2)',
                        borderRadius: '4px 12px 12px 12px',
                        padding: '12px 16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-ink)', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(item.answer) }} />
                        {item.answerTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: 6, fontFamily: 'monospace' }}>
                            🕐 {new Date(item.answerTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Waiting box when asking follow-up */}
            {askingFollowUp && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                background: 'rgba(184,134,11,0.06)',
                border: '1px dashed rgba(184,134,11,0.3)',
                borderRadius: '10px',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(184,134,11,0.2)', borderTop: '2px solid var(--color-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-gold)' }}>
                    {isEn ? 'AI is contemplating your question...' : 'AI đang thấu suốt và chuẩn bị câu trả lời hoàn chỉnh...'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
                    {followUpRetryStatus || (isEn ? `Synthesizing guidance (${followUpElapsed}s)...` : `Đang kết nối Dịch lý và đúc kết (${followUpElapsed}s)...`)}
                  </span>
                </div>
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
              <form onSubmit={handleSendFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {/* 3 AI Suggested Questions Pill Buttons */}
                {!askingFollowUp && aiSuggestedQuestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💡</span> {isEn ? 'AI Suggested follow-up questions (Click to ask AI immediately):' : 'AI gợi ý câu hỏi thêm (Bấm vào để hỏi AI ngay):'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aiSuggestedQuestions.map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={askingFollowUp}
                          onClick={() => handleSendFollowUp(null, qText)}
                          style={{
                            background: 'rgba(184,134,11,0.06)',
                            border: '1px solid rgba(184,134,11,0.25)',
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: '0.825rem',
                            color: 'var(--color-ink)',
                            cursor: askingFollowUp ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(184,134,11,0.15)'; }}
                          onMouseLeave={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(184,134,11,0.06)'; }}
                        >
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-gold)' }}>❓</span>
                          <span style={{ flex: 1 }}>{qText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                    {askingFollowUp ? '⏳ Đang xử lý...' : '💬 Gửi câu hỏi'}
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

      {/* Global CSS animations for mystical waiting */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 16px rgba(184,134,11,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 26px rgba(184,134,11,0.55); }
        }
        @keyframes shimmerSlide {
          0% { left: -40%; }
          100% { left: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
    </>
  );
}

