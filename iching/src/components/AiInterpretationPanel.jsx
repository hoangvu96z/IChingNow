import { useEvidence } from '../context/evidenceState';
import EvidenceInterpretation from './EvidenceInterpretation';
import IChingWaitingAnimation from './IChingWaitingAnimation.jsx';
import IChingFollowUpConversation from './IChingFollowUpConversation.jsx';
import { evidencePrompt, parseInterpretationResponse } from '../logic/interpretationEvidence';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/useLanguage.js';
import { usePlan } from '../hooks/usePlan.js';
import PricingModal from './PricingModal.jsx';
import { useAuth } from '../context/useAuth.js';
import { requestAiChat } from '../../../shared/src/utils/aiProxy.mjs';
import { readOpenAiChatStream } from '../../../shared/src/utils/openAiSse.mjs';

const PREDEFINED_MODELS = [
  { value: 'combo1', label: 'combo1 (Combo)' },
  { value: 'openrouter/tencent/hy3:free', label: 'hy3:free' },
  { value: 'openrouter/openai/gpt-oss-20b:free', label: 'gpt-oss-20b:free' },
  { value: 'openrouter/poolside/laguna-xs-2.1:free', label: 'laguna-xs-2.1:free' },
  { value: 'openrouter/google/gemma-4-26b-a4b-it:free', label: 'gemma-4-26b-a4b-it:free' }
];

export default function AiInterpretationPanel({ result, plainTextResult, readingId, onSaveAiConversation }) {
  const evidence = useEvidence();
  const active = useRef(false);
  const requestController = useRef(null);
  const requestLock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; requestController.current?.abort(); };
  }, []);

  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [settings, setSettings] = useState({ model: import.meta.env.VITE_AI_MODEL || 'combo1' });
  const [showSettings, setShowSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({ model: '' });
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryStatus, setRetryStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const modelsList = PREDEFINED_MODELS;

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
  const { isAuthenticated, login } = useAuth();
  const { remaining, plan, canBonus, expiresAt, daysRemaining, isOverride, fetchQuota, requestBonus, applyCoupon } = usePlan(isAuthenticated);
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

  // Load settings
  useEffect(() => {
    let activeSettings = { model: import.meta.env.VITE_AI_MODEL || 'combo1' };
    try {
      const saved = localStorage.getItem('iching_ai_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedModel = parsed.model;
        activeSettings = {
          model: PREDEFINED_MODELS.some(({ value }) => value === savedModel)
            ? savedModel
            : activeSettings.model,
        };
      }
    } catch {}
    setSettings(activeSettings);
    try { localStorage.setItem('iching_ai_settings', JSON.stringify(activeSettings)); } catch {}
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
    const newSettings = { model: formSettings.model };
    try {
      localStorage.setItem('iching_ai_settings', JSON.stringify(newSettings));
    } catch {}
    setSettings(newSettings);
    setShowSettings(false);
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
  }, [result?.createdAt, result?.aiConversation]);

  // ─── HÀM GỌI AI CHỐNG MẤT KẾT NỐI VÀ TỰ ĐỘNG RETRY ───
  const fetchAiWithRetry = async (messages, onStatusUpdate) => {
    if (onStatusUpdate) onStatusUpdate('');
    if (!active.current) throw new Error('Reading changed');
    const controller = new AbortController();
    requestController.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 65000);
    try {
      const response = await requestAiChat({
        app: 'iching',
        model: settings.model || 'combo1',
        messages,
        stream: true,
        signal: controller.signal,
      });
      const accumulatedText = await readOpenAiChatStream(response);

      const parsedAnswer = parseInterpretationResponse(accumulatedText, evidence?.catalog || []);
      if (!accumulatedText || accumulatedText.trim().length < 40 ||
          (!parsedAnswer.sections.length && !parsedAnswer.fallback.trim())) {
        const error = new Error('Dữ liệu trả về bị ngắt quãng hoặc không hoàn chỉnh');
        error.retryable = false;
        throw error;
      }
      await fetchQuota();
      return accumulatedText.trim();
    } finally {
      clearTimeout(timeoutId);
      requestController.current = null;
    }
  };

  // ─── Luận giải quẻ dịch ───
  const handleInterpret = async () => {
    if (!result || requestLock.current) return;
    requestLock.current = true;
    if (!active.current) { requestLock.current = false; return; }
    if (!isAuthenticated) {
      requestLock.current = false;
      login();
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
        ? `Please interpret the following I Ching hexagram reading for me:\n- Topic / Question: "${question}"\n- Caster: ${caster || 'Anonymous'}\n- Date & Time: ${castDate} ${castTime}\n- Detailed Hexagram Info:\n${plainTextResult}\n\nInclude the following topics in your interpretation sections:\n1. **Hexagram Overview**: Primary hexagram, changed hexagram, and Ti-Yong energetic relationship.\n2. **Detailed Analysis for Question**: Address "${question}" directly, analyzing current situation and potential obstacles.\n3. **Moving Lines Analysis (if any)**: Analyze specific meaning and advice of each moving line.\n4. **Actionable Guidance**: Provide 3 concrete, practical steps to navigate this situation.`
        : `Hãy luận giải quẻ dịch sau cho tôi:\n- Việc cần xem: "${question}"\n- Người lập quẻ: ${caster || 'Ẩn danh'}\n- Thời gian lập: ${castDate} ${castTime}\n- Thông tin quẻ chi tiết:\n${plainTextResult}\n\nHãy luận giải các nội dung sau trong các mục luận giải:\n1. **Tổng quan quẻ dịch**: Ý nghĩa quẻ chủ, quẻ biến và mối tương quan giữa Thể và Dụng.\n2. **Luận giải chi tiết cho câu hỏi**: Trực tiếp câu hỏi "${question}", phân tích tình thế hiện tại ra sao, có thuận lợi hay trở ngại gì.\n3. **Ý nghĩa các hào động (nếu có)**: Phân tích ý nghĩa của hào động và lời khuyên tại vị trí hào đó.\n4. **Lời khuyên hành động**: Đưa ra 3 lời khuyên hành động thực tế, cụ thể nhất để cải biến tình huống hoặc nắm bắt cơ hội.`;

      const messages = [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt + evidencePrompt(evidence?.catalog || [], isEn) }
      ];

      // Gọi AI với cơ chế retry tự động và gom kết quả toàn vẹn
      const fullText = await fetchAiWithRetry(messages, (status) => {
        setRetryStatus(status);
      });

      // Render 1 lần trọn vẹn
      if (!active.current) return;
      setInterpretation(fullText);

      if (onSaveAiConversation && readingId) {
        try {
          await onSaveAiConversation(readingId, {
            aiConversation: {
              evidenceVersion: 1,
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
      console.error('AI Error:', err);
      if (err.code === 'QUOTA_EXCEEDED') setShowPricing(true);
      setError(err.message || (isEn ? 'Error calling AI Server.' : 'Lỗi khi gọi API của server AI. Vui lòng bấm thử lại.'));
    } finally {
      requestLock.current = false;
      if (active.current) { setLoading(false); setRetryStatus(''); }
    }
  };

  const parsedInterpretation = parseInterpretationResponse(interpretation, evidence?.catalog || []);
  const aiSuggestedQuestions = parsedInterpretation.questions;

  // ─── Handler cho câu hỏi thêm tới AI (Memory 100% ngữ cảnh quẻ + render toàn vẹn) ───
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
        { role: 'user', content: initialUserPrompt + evidencePrompt(evidence?.catalog || [], isEn) },
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
              ...(result?.aiConversation || {}),
              evidenceVersion: 1,
              initialInterpretation: interpretation,
              initialTimestamp: result?.aiConversation?.initialTimestamp || new Date().toISOString(),
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
      if (active.current) { setAskingFollowUp(false); setFollowUpRetryStatus(''); }
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
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
              <span>Chọn Model *</span>
            </label>
            <select
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.8125rem', height: 34, background: '#fff', border: '1px solid var(--color-ink-muted)' }}
              value={formSettings.model}
              onChange={e => setFormSettings({ ...formSettings, model: e.target.value })}
            >
              {modelsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

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
          <div style={{ background: 'var(--color-paper)', border: '1px solid var(--color-paper-dark)', borderRadius: 10, padding: 22, boxShadow: '0 4px 16px rgba(44,24,16,0.03)' }}>
            <EvidenceInterpretation parsedResponse={parsedInterpretation} />
            {!parsedInterpretation.sections.length && !parsedInterpretation.fallback.trim() && (
              <button type="button" className="btn-primary" onClick={handleInterpret}>
                {isEn ? 'Try again' : 'Luận giải lại'}
              </button>
            )}
            {result?.aiConversation?.initialTimestamp && (
              <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: 14, fontFamily: 'monospace', opacity: 0.75, borderTop: '1px dashed rgba(184,134,11,0.15)', paddingTop: 8 }}>
                🕐 {new Date(result.aiConversation.initialTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}
          </div>

          <IChingFollowUpConversation
            followUps={followUps}
            askingFollowUp={askingFollowUp}
            followUpRetryStatus={followUpRetryStatus}
            followUpElapsed={followUpElapsed}
            followUpError={followUpError}
            aiSuggestedQuestions={aiSuggestedQuestions}
            isEn={isEn}
            onSendFollowUp={handleSendFollowUp}
            userQuestion={userQuestion}
            setUserQuestion={setUserQuestion}
            t={t}
            charCount={charCount}
            isCharCountValid={isCharCountValid}
          />
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

