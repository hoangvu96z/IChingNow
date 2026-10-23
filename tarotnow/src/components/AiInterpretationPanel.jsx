import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { usePlan } from '../hooks/usePlan.js';
import PricingModal from './PricingModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  DEFAULT_AI_MODEL,
  PREDEFINED_AI_MODELS,
  loadSanitizedAiSettings,
  resolveAllowedAiModel,
  requestAiChat,
} from '../../../shared/src/utils/aiProxy.mjs';
import { readOpenAiChatStream } from '../../../shared/src/utils/openAiSse.mjs';
import TarotMarkdown from './TarotMarkdown.mjs';

import TarotWaitingAnimation from './TarotWaitingAnimation.jsx';
import TarotFollowUpSection from './TarotFollowUpSection.jsx';
import TarotSettingsPanel from './TarotSettingsPanel.jsx';
import TarotPromptTemplateSelector from './TarotPromptTemplateSelector.jsx';
import TarotAiAnimations from './TarotAiAnimations.jsx';

const PREDEFINED_MODELS = PREDEFINED_AI_MODELS;


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
  const active = useRef(false);
  const requestController = useRef(null);
  const requestLock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      requestController.current?.abort();
    };
  }, []);

  const { t, language } = useLanguage();
  const [settings, setSettings] = useState({ model: DEFAULT_AI_MODEL });
  const [showSettings, setShowSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({ model: '' });
  const [promptTemplate, setPromptTemplate] = useState('standard'); // 'standard' | 'love' | 'career'
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryStatus, setRetryStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const modelsList = PREDEFINED_MODELS;

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
  const { isAuthenticated, login } = useAuth();
  const { remaining, plan, canBonus, expiresAt, daysRemaining, isExpiringSoon, isOverride, fetchQuota, requestBonus, applyCoupon } = usePlan(isAuthenticated);
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

  // Load settings
  useEffect(() => {
    setSettings(loadSanitizedAiSettings('tarot_ai_settings'));
  }, []);

  // Sync settings to form when settings modal opens
  useEffect(() => {
    if (showSettings) {
      setFormSettings(settings);
    }
  }, [showSettings, settings, modelsList]);

  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const newSettings = { model: resolveAllowedAiModel(formSettings.model) };
    setSettings(newSettings);
    try {
      localStorage.setItem('tarot_ai_settings', JSON.stringify(newSettings));
    } catch {}
    setShowSettings(false);
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
    if (onStatusUpdate) onStatusUpdate('');
    if (!active.current) throw new Error('Reading changed');
    const controller = new AbortController();
    requestController.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 65000);
    try {
      const response = await requestAiChat({
        app: 'tarot',
        model: resolveAllowedAiModel(settings.model),
        messages,
        stream: true,
        signal: controller.signal,
      });
      // Buffer the complete answer before displaying or saving it. Error and
      // truncated SSE streams must reach the existing visible error state.
      const accumulatedText = await readOpenAiChatStream(response);

      if (!accumulatedText || accumulatedText.trim().length < 40) {
        throw new Error('Dữ liệu Tarot trả về bị ngắt quãng hoặc không hoàn chỉnh');
      }
      return accumulatedText.trim();
    } finally {
      clearTimeout(timeoutId);
      requestController.current = null;
      if (active.current) await fetchQuota();
    }
  };

  const handleInterpret = async () => {
    if (!drawnCards || drawnCards.length === 0 || requestLock.current) return;
    requestLock.current = true;
    if (!active.current) {
      requestLock.current = false;
      return;
    }
    if (!isAuthenticated) {
      requestLock.current = false;
      login();
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
      if (!active.current) return;
      setInterpretation(fullText);

      // Successful run, persist
      if (onSaveAiConversation && readingId && fullText) {
        try {
          await onSaveAiConversation(readingId, {
            aiConversation: {
              initialInterpretation: fullText,
              initialTimestamp: new Date().toISOString(),
              followUps: [],
            }
          });
        } catch (saveError) {
          if (!active.current) return;
          setError(`${isEn ? 'The interpretation was generated, but could not be saved' : 'Đã tạo lời luận giải nhưng không thể lưu'}: ${saveError.message || (isEn ? 'please try again.' : 'vui lòng thử lại.')}`);
        }
      }
    } catch (err) {
      if (!active.current) return;
      console.error(err);
      if (err.code === 'QUOTA_EXCEEDED') setShowPricing(true);
      setError(err.message || (isEn ? 'Error occurred while calling the AI server API.' : 'Lỗi khi gọi API của server AI. Vui lòng bấm thử lại.'));
    } finally {
      requestLock.current = false;
      if (active.current) {
        setLoading(false);
        setRetryStatus('');
      }
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
    if (!questionToSend || questionToSend.length > 2048 || requestLock.current || askingFollowUp || followUps.length >= 5) return;
    requestLock.current = true;
    if (!isAuthenticated) {
      requestLock.current = false;
      login();
      return;
    }

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

      if (!active.current) return;
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
        try {
          await onSaveAiConversation(readingId, {
            aiConversation: {
              initialInterpretation: interpretation,
              initialTimestamp: savedConversation?.initialTimestamp || new Date().toISOString(),
              followUps: updatedFollowUps,
            }
          });
        } catch (saveError) {
          if (!active.current) return;
          setFollowUpError(`${isEn ? 'The answer was generated, but could not be saved' : 'Đã tạo câu trả lời nhưng không thể lưu'}: ${saveError.message || (isEn ? 'please try again.' : 'vui lòng thử lại.')}`);
        }
      }
    } catch (err) {
      if (!active.current) return;
      console.error(err);
      if (err.code === 'QUOTA_EXCEEDED') setShowPricing(true);
      setFollowUpError(err.message || (isEn ? 'Error connecting to AI. Please try again.' : 'Lỗi khi kết nối AI để trả lời câu hỏi. Vui lòng bấm gửi lại.'));
    } finally {
      requestLock.current = false;
      if (active.current) {
        setAskingFollowUp(false);
        setFollowUpRetryStatus('');
      }
    }
  };

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
      <div className="ai-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(229,193,88,0.2)', paddingBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
        <div className="ai-panel-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🤖</span>
          <h2 className="results-title" style={{ fontSize: '20px', margin: 0, textAlign: 'left' }}>
            {t('ai.title', 'Luận giải Tarot bằng AI')}
          </h2>
        </div>
        <div className="ai-panel-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quota badge */}
          <div className="ai-quota-badge" style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.06)', color: remaining === 0 ? '#ef4444' : '#94a3b8',
            border: `1px solid ${remaining === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
            whiteSpace: 'nowrap',
          }}>
            ⚡ {remaining} lượt còn lại
          </div>
          <button
            className="ai-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px',
              borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            ⚙️ <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('ai.settings', 'Cấu hình')}</span>
          </button>
        </div>
      </div>

      <TarotSettingsPanel isOpen={showSettings} onSubmit={handleSaveSettings} onClose={() => setShowSettings(false)} formSettings={formSettings} setFormSettings={setFormSettings} modelsList={modelsList} t={t} />

      <TarotPromptTemplateSelector hasInterpretation={Boolean(interpretation)} loading={loading} promptTemplate={promptTemplate} setPromptTemplate={setPromptTemplate} t={t} />

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
            {t('ai.button_cast_tarot', 'Luận giải Tarot bằng AI')}
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
            <TarotMarkdown>{displayInterpretation}</TarotMarkdown>
          </div>

          {/* ─── Follow-up Q&A Chat Section ─────────────────────────────── */}
          <TarotFollowUpSection
            followUps={followUps}
            isEn={isEn}
            askingFollowUp={askingFollowUp}
            followUpRetryStatus={followUpRetryStatus}
            followUpElapsed={followUpElapsed}
            followUpError={followUpError}
            aiSuggestedQuestions={aiSuggestedQuestions}
            handleSendFollowUp={handleSendFollowUp}
            userQuestion={userQuestion}
            setUserQuestion={setUserQuestion}
            charCount={charCount}
            isCharCountValid={isCharCountValid}
          />
        </div>
      )}

      <TarotAiAnimations />
    </div>
    </>
  );
}

