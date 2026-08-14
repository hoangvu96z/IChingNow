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

// ─── Danh sách lời động viên / nhắc nhở vui nhộn & huyền bí theo chủ đề Tarot ───
const TAROT_WAIT_QUOTES = {
  vi: [
    { icon: '🔮', title: 'Kết nối Trực giác', desc: 'Đang lắng nghe trực giác và kết nối năng lượng sâu thẳm của các lá bài...' },
    { icon: '🎴', title: 'Thông điệp Ẩn số', desc: 'Các lá bài đang thì thầm, đan cài những bức tranh định mệnh sống động...' },
    { icon: '✨', title: 'Tín hiệu Vũ trụ', desc: 'Vũ trụ đang gửi tín hiệu, chuẩn bị đón nhận thông điệp sáng tỏ nhất nhé...' },
    { icon: '🪐', title: 'Hành tinh thuận hành', desc: 'Sao Thủy không hề nghịch hành, kiên nhẫn một tẹo là thông điệp xuất lộ ngay!' },
    { icon: '☕', title: 'Thanh lọc Năng lượng', desc: 'Thả lỏng vai, thở nhẹ một nhịp để đón nhận nguồn năng lượng thuần khiết...' },
    { icon: '🌟', title: 'Chiếu rọi Ánh sáng', desc: 'The Star và The Sun đang lan tỏa ánh sáng may mắn vào trải bài này...' },
    { icon: '🎯', title: 'Sắp hoàn tất rồi!', desc: 'Chỉ còn vài giây nữa, toàn bộ bức tranh sẽ hiển thị rạng ngời và tròn vẹn ngay đây!' }
  ],
  en: [
    { icon: '🔮', title: 'Intuitive Connection', desc: 'Tuning into cosmic frequencies and channeling your cards...' },
    { icon: '🎴', title: 'Unfolding Archetypes', desc: 'The archetypes are whispering, weaving their deep divine narrative...' },
    { icon: '✨', title: 'Cosmic Transmission', desc: 'The Universe is broadcasting clarity and wisdom for your question...' },
    { icon: '🪐', title: 'Planetary Harmony', desc: 'No Mercury retrograde here, divine magic takes just a moment to brew!' },
    { icon: '☕', title: 'Mindful Aura', desc: 'Take a gentle breath and relax your aura while the cards reveal...' },
    { icon: '🌟', title: 'Celestial Blessings', desc: 'Channeling the radiant blessings of The Star and The Sun...' },
    { icon: '🎯', title: 'Almost Complete!', desc: 'Synthesizing your full, crystal-clear reading right now...' }
  ]
};

// ─── Component Animation Đợi Luận Giải Tarot Vũ Trụ ───
function TarotWaitingAnimation({ isEn, retryInfo, elapsedSeconds }) {
  const quotes = isEn ? TAROT_WAIT_QUOTES.en : TAROT_WAIT_QUOTES.vi;
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
      padding: '30px 16px',
      background: 'linear-gradient(180deg, rgba(28,23,46,0.85) 0%, rgba(13,10,25,0.95) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(229,193,88,0.25)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px rgba(167,139,250,0.06)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background celestial glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Floating Glowing Tarot Card Visual */}
      <div style={{ position: 'relative', width: 80, height: 110, marginBottom: 20 }}>
        {/* Mystic Orbit Halo */}
        <div style={{
          position: 'absolute',
          top: -12,
          left: -12,
          right: -12,
          bottom: -12,
          borderRadius: '50%',
          border: '1px dashed rgba(229,193,88,0.4)',
          animation: 'spin 14s linear infinite'
        }}>
          <span style={{ position: 'absolute', top: -6, left: '45%', fontSize: '0.8rem' }}>✨</span>
          <span style={{ position: 'absolute', bottom: -6, left: '45%', fontSize: '0.8rem' }}>🌙</span>
          <span style={{ position: 'absolute', left: -6, top: '45%', fontSize: '0.8rem' }}>⭐</span>
          <span style={{ position: 'absolute', right: -6, top: '45%', fontSize: '0.8rem' }}>🔮</span>
        </div>

        {/* 3D Holographic Card */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #2d1b4e 0%, #150f28 100%)',
          border: '1.5px solid rgba(229,193,88,0.6)',
          boxShadow: '0 0 24px rgba(229,193,88,0.3), 0 8px 16px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'cardHover 3s ease-in-out infinite',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Card inner border */}
          <div style={{
            position: 'absolute',
            inset: 4,
            border: '1px solid rgba(229,193,88,0.25)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '2rem',
              animation: 'starPulse 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 8px rgba(229,193,88,0.8))'
            }}>
              🎴
            </span>
          </div>

          {/* Shimmer sweep */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
            transform: 'skewX(-25deg)',
            animation: 'cardShimmer 2.4s infinite'
          }} />
        </div>
      </div>

      {/* Rotating Quote Card */}
      <div style={{
        maxWidth: 500,
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
          color: '#e5c158',
          fontFamily: 'var(--font-heading, serif)',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{currentQuote.icon}</span>
          <span>{currentQuote.title}</span>
        </div>
        <div style={{
          fontSize: '0.84rem',
          color: '#dfdbf0',
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
          background: 'rgba(235,94,85,0.12)',
          border: '1px solid rgba(235,94,85,0.3)',
          color: '#eb5e55',
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
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(90deg, #a78bfa, #e5c158)',
            borderRadius: 4,
            animation: 'shimmerSlide 1.8s ease-in-out infinite'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: '0.72rem',
          color: 'var(--text-muted, #a69fbf)',
          fontWeight: 500
        }}>
          <span>{isEn ? 'Synthesizing complete reading...' : 'Đang kết tinh trọn vẹn thông điệp...'}</span>
          <span>{elapsedSeconds}s</span>
        </div>
      </div>
    </div>
  );
}

export default function AiInterpretationPanel({ 
  question, 
  drawnCards, 
  spreadName, 
  spreadPositions,
  interpretationContext,
  interpretationSummary,
  getCardMeaning,
  readingId,
  onSaveAiConversation,
  savedConversation,
}) {
  const { t, language } = useLanguage();
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
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryStatus, setRetryStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [modelsList, setModelsList] = useState(PREDEFINED_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');

  // ─── Follow-up Q&A State ──────────────────────────────────────────────────
  const [followUps, setFollowUps] = useState([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [followUpRetryStatus, setFollowUpRetryStatus] = useState('');
  const [followUpElapsed, setFollowUpElapsed] = useState(0);

  const charCount = userQuestion.length;
  const isCharCountValid = charCount > 0 && charCount <= 2048;

  const isEn = language === 'en';

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

  // Restore conversation từ savedConversation prop (khi load từ history)
  useEffect(() => {
    if (savedConversation) {
      if (savedConversation.initialInterpretation) {
        setInterpretation(savedConversation.initialInterpretation);
      }
      if (Array.isArray(savedConversation.followUps) && savedConversation.followUps.length > 0) {
        setFollowUps(savedConversation.followUps);
      }
    } else {
      setInterpretation('');
      setFollowUps([]);
      setUserQuestion('');
      setError('');
    }
  }, [savedConversation]);

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
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.warn('Error fetching models:', err);
      setModelsError('Unable to load models: ' + err.message);
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
      const saved = localStorage.getItem('tarot_ai_settings');
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
    localStorage.setItem('tarot_ai_settings', JSON.stringify({
      endpoint: newSettings.endpoint,
      model: newSettings.model
    }));
    setShowSettings(false);
    fetchModels(newSettings);
  };

  // Generate detailed prompt text
  const getPromptText = () => {
    if (!drawnCards || drawnCards.length === 0) return '';
    const cardsSection = drawnCards.map((c, idx) => {
      const orientationText = c.orientation === 'reversed' 
        ? t('modal.orientation_reversed', 'Lá ngược (Reversed)') 
        : t('modal.orientation_upright', 'Lá xuôi (Upright)');
      const kws = c.orientation === 'reversed' ? c.reversedKeywords : c.uprightKeywords;
      const posText = spreadPositions && spreadPositions[idx] ? ` - ${isEn ? 'Position meaning' : 'Ý nghĩa vị trí'}: ${spreadPositions[idx]}` : '';
      const localMeaning = getCardMeaning ? getCardMeaning(c, interpretationContext, c.orientation) : '';
      
      return `${idx + 1}. ${isEn ? 'Card' : 'Lá bài'}: ${c.name}\n` +
             `   - ${isEn ? 'Orientation' : 'Trạng thái'}: ${orientationText}\n` +
             `   - ${isEn ? 'Category' : 'Nhóm'}: ${c.arcana}${c.suit ? ` (${c.suit})` : ''}\n` +
             `   - ${isEn ? 'Keywords' : 'Từ khóa chính'}: ${kws.join(', ')}\n` +
             `${posText ? `   - ${isEn ? 'Position in spread' : 'Vị trí trong trải bài'}: ${posText}\n` : ''}` +
             `${localMeaning ? `   - ${isEn ? 'Preliminary meaning' : 'Giải nghĩa cơ bản sơ bộ'}: ${localMeaning}\n` : ''}`;
    }).join('\n');

    let instruction = '';
    if (isEn) {
      switch (promptTemplate) {
        case 'love':
          instruction = 'Please interpret this spread focusing on Love & Relationships. Analyze the emotions, thoughts, current blockages, and offer concrete action advice to improve this connection.';
          break;
        case 'career':
          instruction = 'Please interpret this spread focusing on Career, Business & Finance. Analyze potential opportunities, challenges to overcome, the best path forward, and practical steps for the present.';
          break;
        case 'standard':
        default:
          instruction = 'Please interpret this spread in a comprehensive and deep manner. Analyze the meaning of each card, the energetic connection between them, and compile it into a cohesive guidance message for my question.';
          break;
      }
    } else {
      switch (promptTemplate) {
        case 'love':
          instruction = 'Hãy luận giải trải bài này theo khía trạng Tình cảm & Các mối quan hệ. Phân tích chi tiết cảm xúc, suy nghĩ của các bên, rào cản hiện tại và lời khuyên hành động cụ thể để cải thiện mối quan hệ này.';
          break;
        case 'career':
          instruction = 'Hãy luận giải trải bài này theo khía trạng Công việc, Sự nghiệp & Tài chính. Phân tích rõ các cơ hội tiềm năng, thách thức cần vượt qua, hướng đi tốt nhất và cách ứng phó thực tế ở thời điểm hiện tại.';
          break;
        case 'standard':
        default:
          instruction = 'Hãy luận giải trải bài này một cách toàn diện và sâu sắc. Phân tích ý nghĩa từng lá, mối liên kết năng lượng giữa chúng và tổng hợp thành thông điệp khuyên bảo cụ thể cho câu hỏi của tôi.';
          break;
      }
    }

    const sysRole = t('export.prompt_system', 'Tôi muốn bạn đóng vai một nhà giải nghĩa Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith.');
    const qLabel = t('export.prompt_question', 'CÂU HỎI CỦA TÔI:');
    const dLabel = t('export.prompt_details', 'CHI TIẾT TRẢI BÀI ĐÃ RÚT:');
    const sLabel = t('export.prompt_summary', 'TÓM TẮT LUẬN GIẢI CƠ BẢN (NỀN TẢNG SƠ BỘ):');
    const gLabel = t('export.prompt_guide', 'HƯỚNG DẪN GIẢI NGHĨA CHO AI:');
    const rLabel = t('export.prompt_req', 'Yêu cầu định dạng phản hồi:');
    const rBullets = isEn
      ? '- Use English, fluently, deeply and objectively.\n- Use clear section headers.\n- Conclude with actionable guidance.\n- AT THE VERY END OF YOUR RESPONSE, output exact delimiter line "---SUGGESTED_QUESTIONS---" followed by 3 concise follow-up questions:\n---SUGGESTED_QUESTIONS---\n1. [Question 1]\n2. [Question 2]\n3. [Question 3]'
      : '- Sử dụng tiếng Việt, viết trôi chảy, sâu sắc và khách quan.\n- Có tiêu đề rõ ràng cho từng phần.\n- Kết luận bằng một thông điệp đúc kết hoặc hành động cụ thể tôi nên làm.\n- Ở CUỐI BÀI VIẾT, hãy xuất đúng dòng phân cách "---SUGGESTED_QUESTIONS---" theo sau là 3 câu hỏi đào sâu ngắn gọn dành riêng cho bài này:\n---SUGGESTED_QUESTIONS---\n1. [Câu hỏi 1]\n2. [Câu hỏi 2]\n3. [Câu hỏi 3]';

    return `${sysRole}\n\n${qLabel}\n"${question}"\n\n${dLabel}\n${cardsSection}\n${interpretationSummary ? `\n${sLabel}\n${interpretationSummary}\n` : ''}\n${gLabel}\n${instruction}\n\n${rLabel}\n${rBullets}`;
  };

  // ─── HÀM GỌI AI CHỐNG MẤT KẾT NỐI VÀ TỰ ĐỘNG RETRY ───
  const fetchAiWithRetry = async (messages, onStatusUpdate) => {
    const fallbackModels = Array.from(new Set([
      settings.model,
      'combo1',
      'openrouter/tencent/hy3:free'
    ])).filter(Boolean);

    const callEndpoint = getResolvedEndpoint(settings.endpoint);
    const MAX_RETRIES_PER_MODEL = 2;
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

          if (!accumulatedText || accumulatedText.trim().length < 40) {
            throw new Error('Dữ liệu Tarot trả về bị ngắt quãng hoặc không hoàn chỉnh');
          }

          return accumulatedText.trim();
        } catch (err) {
          console.warn(`[AI Request] Model ${currentModel} attempt ${attempt} failed:`, err);
          lastError = err;
        }
      }
    }

    throw lastError || new Error('Không thể kết nối đến server AI sau nhiều lần thử.');
  };

  const handleInterpret = async () => {
    if (!drawnCards || drawnCards.length === 0) return;

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

    try {
      const sysPrompt = isEn
        ? `You are a professional Tarot reader, highly knowledgeable in Rider-Waite-Smith symbolism, Jungian archetypes, and holistic life guidance. Please interpret the drawn cards deeply, empathetically, and constructively. Help the user reflect on their situations instead of making superstitious predictions. Always respond in English.`
        : `Bạn là một nhà giải nghĩa Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith, các hình mẫu tâm lý học Jung và hướng dẫn cuộc sống toàn diện. Hãy giải nghĩa các lá bài đã rút một cách sâu sắc, thấu cảm và mang tính xây dựng. Giúp người dùng suy ngẫm về hoàn cảnh thay vì đưa ra các phán đoán mang tính bói toán mê tín. Luôn trả lời bằng tiếng Việt.`;

      const userPrompt = getPromptText();

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

      // Successful run, persist
      if (onSaveAiConversation && readingId && fullText) {
        onSaveAiConversation(readingId, {
          aiConversation: {
            initialInterpretation: fullText,
            initialTimestamp: new Date().toISOString(),
            followUps: [],
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || (isEn ? 'Error occurred while calling the AI server API.' : 'Lỗi khi gọi API của server AI. Vui lòng bấm thử lại.'));
    } finally {
      setLoading(false);
      setRetryStatus('');
    }
  };

  // Helper for context memory
  const getPlainContext = () => {
    if (!drawnCards || drawnCards.length === 0) return '';
    const cardsText = drawnCards.map((c, idx) => {
      const ori = c.orientation === 'reversed' ? 'Ngược' : 'Xuôi';
      return `${idx + 1}. ${c.name} — ${ori}`;
    }).join('\n');
    return `Câu hỏi: "${question || 'Không có'}"\nTrải bài: ${spreadName || 'Custom'}\nCác lá bài:\n${cardsText}`;
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

  // ─── Follow-up Q&A Handler ────────────────────────────────────────────────
  const handleSendFollowUp = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const questionToSend = (textOverride || userQuestion).trim();
    if (!questionToSend || askingFollowUp || followUps.length >= 5) return;

    setAskingFollowUp(true);
    setFollowUpError('');
    setFollowUpRetryStatus('');

    try {
      const sysPrompt = isEn
        ? `You are a professional Tarot reader, highly knowledgeable in Rider-Waite-Smith symbolism. The user is asking a follow-up question based on their drawn Tarot spread and previous interpretation.\nRequirements:\n1. Answer CONCISELY and directly address the user's question. Do NOT repeat card names or introductory fluff.\n2. Briefly analyze based on the drawn cards and previous interpretation.\n3. Conclude with clear, practical advice. Always respond in English.`
        : `Bạn là một chuyên gia Tarot chuyên nghiệp, am hiểu sâu sắc về biểu tượng học Rider-Waite-Smith. Người dùng đang hỏi thêm một câu hỏi cụ thể dựa trên trải bài Tarot và luận giải đã có trước đó.\nYêu cầu quan trọng khi trả lời câu hỏi thêm:\n1. Trả lời NGẮN GỌN, súc tích, đi thẳng vào trọng tâm câu hỏi. KHÔNG dông dài, KHÔNG lặp lại phần giới thiệu hay tên các lá bài đã biết.\n2. Phân tích ngắn gọn dựa trên các lá bài đã rút và luận giải trước đó.\n3. Đưa ra kết luận hoặc lời khuyên cụ thể, ngắn gọn, dễ hiểu. Luôn trả lời bằng tiếng Việt.`;

      const contextPrompt = getPlainContext();

      const messages = [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: isEn ? `My Tarot spread:\n${contextPrompt}` : `Trải bài Tarot của tôi:\n${contextPrompt}` },
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
            initialInterpretation: interpretation,
            initialTimestamp: savedConversation?.initialTimestamp || new Date().toISOString(),
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
    html = html.replace(/^### (.*$)/gim, '<h4 style="color: #e5c158; font-family: var(--font-heading); font-size: 1.05rem; margin-top: 16px; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color: #e5c158; font-family: var(--font-heading); font-size: 1.25rem; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid rgba(229,193,88,0.2); padding-bottom: 4px; font-weight: 600; letter-spacing: 0.5px;">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="color: #e5c158; font-family: var(--font-heading); font-size: 1.40rem; margin-top: 24px; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px;">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-weight: 600;">$1</strong>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: square; color: #dfdbf0;">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 6px; list-style-type: square; color: #dfdbf0;">$1</li>');

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
        return prefix + `<p style="margin: 8px 0; line-height: 1.65; color: #dfdbf0;">${line}</p>`;
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
    <div className="interpretation-section glass-panel" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(229,193,88,0.2)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <h2 className="results-title" style={{ fontSize: '20px', margin: 0, textAlign: 'left' }}>
            {t('ai.title', 'Luận giải Tarot bằng AI')}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quota badge */}
          <div style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.06)', color: remaining === 0 ? '#ef4444' : '#94a3b8',
            border: `1px solid ${remaining === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            ⚡ {remaining} lượt còn lại
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px',
              borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            ⚙️ <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('ai.settings', 'Cấu hình')}</span>
          </button>
        </div>
      </div>

      {/* AI Settings Form */}
      {showSettings && (
        <form onSubmit={handleSaveSettings} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(229,193,88,0.2)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#e5c158' }}>{t('ai.settings_header', 'Cấu hình Server AI (9Router)')}</h4>
          
          <div>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>API Endpoint *</label>
            <input
              type="text"
              className="custom-textarea"
              style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '36px' }}
              value={formSettings.endpoint}
              onChange={e => setFormSettings({ ...formSettings, endpoint: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Chọn Model *</span>
              {loadingModels && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>⏳ Đang tải...</span>}
              {modelsError && <span style={{ fontSize: '10px', color: 'red' }} title={modelsError}>⚠️ Lỗi tải model</span>}
            </label>
            <select
              className="custom-textarea"
              style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '38px', background: '#1c172e', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
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
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>Nhập Model Name tùy chỉnh *</label>
              <input
                type="text"
                className="custom-textarea"
                style={{ minHeight: 'auto', padding: '8px 12px', fontSize: '13px', height: '36px' }}
                value={formSettings.model}
                onChange={e => setFormSettings({ ...formSettings, model: e.target.value })}
                placeholder="Nhập tên model (ví dụ: combo1)"
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" className="reset-weights-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowSettings(false)}>
              {t('common.cancel', 'Hủy')}
            </button>
            <button type="submit" className="copy-main-btn" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '80px' }}>
              {t('common.save', 'Lưu lại')}
            </button>
          </div>
        </form>
      )}

      {/* Template Selector for AI Prompt context */}
      {!interpretation && !loading && (
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
      )}

      {/* Action and Initial Button */}
      {!interpretation && !loading && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <button
            onClick={handleInterpret}
            className="copy-main-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto',
              padding: '12px 28px',
              maxWidth: '360px',
              fontSize: '14px'
            }}
          >
            <span>✨</span> {t('ai.button_cast_tarot', 'Luận giải Tarot bằng AI')}
          </button>
        </div>
      )}

      {/* Loading state: Cosmic floating card + Rotating quotes + Timer */}
      {loading && (
        <TarotWaitingAnimation
          isEn={isEn}
          retryInfo={retryStatus}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '14px', background: 'rgba(235,94,85,0.08)', border: '1px solid rgba(235,94,85,0.25)', borderRadius: '10px', color: '#eb5e55', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
            <span>⚠️</span> {isEn ? 'Connection issue:' : 'Chưa hoàn tất luận giải:'}
          </div>
          <div style={{ opacity: 0.9, lineHeight: 1.5 }}>{error}</div>
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleInterpret} className="copy-main-btn" style={{ padding: '6px 14px', fontSize: '12px', width: 'auto' }}>
              🔄 {isEn ? 'Try Again' : 'Thử lại ngay'}
            </button>
          </div>
        </div>
      )}

      {/* Final Interpretation Result (Rendered All At Once) */}
      {!loading && interpretation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(229,193,88,0.18)', borderRadius: '10px', padding: '22px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(displayInterpretation) }} />
          </div>

          {/* ─── Follow-up Q&A Chat Section ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(229,193,88,0.15)' }} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(229,193,88,0.7)', fontWeight: 600, letterSpacing: '0.06em' }}>
                💬 HỎI THÊM AI ({followUps.length}/5)
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(229,193,88,0.15)' }} />
            </div>

            {/* Previous Q&A list */}
            {followUps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {followUps.map((fu, idx) => (
                  <div key={fu.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Question bubble */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '80%', background: 'rgba(229,193,88,0.12)', border: '1px solid rgba(229,193,88,0.25)', borderRadius: '12px 12px 4px 12px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#f5e6a3', fontWeight: 600 }}>{fu.question}</div>
                        {fu.questionTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'rgba(229,193,88,0.5)', marginTop: 3, textAlign: 'right', fontFamily: 'monospace' }}>
                            🕐 {new Date(fu.questionTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Answer bubble */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ maxWidth: '85%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '0.82rem', color: '#dfdbf0', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(fu.answer) }} />
                        {fu.answerTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'rgba(229,193,88,0.4)', marginTop: 4, fontFamily: 'monospace' }}>
                            🕐 {new Date(fu.answerTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                padding: '12px 16px',
                background: 'rgba(167,139,250,0.08)',
                border: '1px dashed rgba(167,139,250,0.3)',
                borderRadius: '10px',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(229,193,88,0.2)', borderTop: '2px solid var(--gold-color, #e5c158)', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e5c158' }}>
                    {isEn ? 'AI is focusing on your Tarot question...' : 'AI đang thấu cảm và chuẩn bị câu trả lời hoàn chỉnh...'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #a69fbf)' }}>
                    {followUpRetryStatus || (isEn ? `Synthesizing guidance (${followUpElapsed}s)...` : `Đang kết nối năng lượng lá bài (${followUpElapsed}s)...`)}
                  </span>
                </div>
              </div>
            )}

            {/* Follow-up error */}
            {followUpError && (
              <div style={{ padding: '8px 12px', background: 'rgba(235,94,85,0.08)', border: '1px solid rgba(235,94,85,0.2)', borderRadius: '8px', color: '#eb5e55', fontSize: '12px' }}>
                ⚠️ {followUpError}
              </div>
            )}

            {/* Question input form */}
            {followUps.length < 5 ? (
              <form onSubmit={handleSendFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 3 AI Suggested Questions Pill Buttons */}
                {!askingFollowUp && aiSuggestedQuestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💡</span> {isEn ? 'AI Suggested Follow-up Questions (Click to ask immediately):' : 'AI gợi ý 3 câu hỏi tiếp theo (Bấm vào để hỏi ngay):'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aiSuggestedQuestions.map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={askingFollowUp}
                          onClick={() => handleSendFollowUp(null, qText)}
                          style={{
                            background: 'rgba(167,139,250,0.08)',
                            border: '1px solid rgba(167,139,250,0.25)',
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: '0.825rem',
                            color: '#dfdbf0',
                            cursor: askingFollowUp ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(167,139,250,0.18)'; }}
                          onMouseLeave={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; }}
                        >
                          <span style={{ fontSize: '0.9rem', color: '#a78bfa' }}>🔮</span>
                          <span style={{ flex: 1 }}>{qText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <textarea
                    rows={2}
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi thêm về trải bài này (tối đa 2048 ký tự)..."
                    disabled={askingFollowUp}
                    className="custom-textarea"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${charCount > 2048 ? 'rgba(235,94,85,0.6)' : 'rgba(229,193,88,0.2)'}`,
                      background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem',
                      resize: 'vertical', outline: 'none', color: '#dfdbf0',
                      boxSizing: 'border-box', minHeight: 'unset',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: 3, fontSize: '0.7rem' }}>
                    <span style={{ color: charCount > 2048 ? '#eb5e55' : 'rgba(229,193,88,0.5)', fontWeight: charCount > 2048 ? 700 : 400 }}>
                      {charCount > 2048 ? `⚠️ Đã vượt quá 2048 ký tự (${charCount})` : `${charCount} / 2048 ký tự`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={askingFollowUp || !userQuestion.trim() || !isCharCountValid}
                    className="copy-main-btn"
                    style={{
                      padding: '7px 18px', fontSize: '0.82rem', width: 'auto',
                      opacity: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 0.5 : 1,
                      cursor: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {askingFollowUp ? '⏳ Đang xử lý...' : '💬 Gửi câu hỏi'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 14px', background: 'rgba(229,193,88,0.06)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(229,193,88,0.6)', border: '1px solid rgba(229,193,88,0.15)' }}>
                ℹ️ Bạn đã sử dụng tối đa 5 câu hỏi thêm cho lượt luận giải này.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global CSS animations for cosmic waiting */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cardHover {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
        }
        @keyframes starPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes cardShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
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
    </div>
    </>
  );
}

