import { useEvidence } from '../context/evidenceState';
import EvidenceInterpretation from './EvidenceInterpretation';
import IChingWaitingAnimation from './IChingWaitingAnimation.jsx';
import IChingFollowUpConversation from './IChingFollowUpConversation.jsx';
import { evidencePrompt, parseInterpretationResponse } from '../logic/interpretationEvidence';
import { buildLucHaoPromptContext } from '../utils/promptBuilder.js';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/useLanguage.js';
import { usePlan } from '../hooks/usePlan.js';
import PricingModal from './PricingModal.jsx';
import { useAuth } from '../context/useAuth.js';
import {
  DEFAULT_AI_MODEL,
  PREDEFINED_AI_MODELS,
  loadSanitizedAiSettings,
  resolveAllowedAiModel,
  requestAiChat,
} from '../../../shared/src/utils/aiProxy.mjs';
import { readOpenAiChatStream } from '../../../shared/src/utils/openAiSse.mjs';

const PREDEFINED_MODELS = PREDEFINED_AI_MODELS;

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
  const [settings, setSettings] = useState({ model: DEFAULT_AI_MODEL });
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
    setSettings(loadSanitizedAiSettings('iching_ai_settings'));
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
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 195000);
    try {
      const response = await requestAiChat({
        app: 'iching',
        model: resolveAllowedAiModel(settings.model),
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
      return accumulatedText.trim();
    } catch (err) {
      if (timedOut) {
        throw new Error(
          isEn
            ? 'AI server took too long to respond. Please try again.'
            : 'Máy chủ AI phản hồi quá thời gian chờ. Vui lòng bấm thử lại.',
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      requestController.current = null;
      if (active.current) await fetchQuota();
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

    // ── Phân biệt phương pháp: Lục Hào (gieo 6 hào) vs Mai Hoa (số / ngày giờ) ──
    const isMaiHoa = result?.method === 'mai-hoa' || result?.subMode === 'time' || result?.subMode === 'serial';

    try {
      // ── System prompt riêng cho từng phương pháp ──────────────────────────
      let sysPrompt;
      if (isMaiHoa) {
        sysPrompt = isEn
          ? `You are an expert in Mai Hoa Yi Shu (梅花易數 — Plum Blossom Numerology), the divination method created by Shao Yong (邵雍) of Song Dynasty. You understand how trigrams are derived from numbers or time (year/month/day/hour), how the Upper (Thượng quái / 體 Thể) and Lower (Hạ quái / 用 Dụng) trigrams represent Subject and Object, and how the single moving line (Hào động) transforms the Primary hexagram (Quẻ Chủ) into the Changed hexagram (Quẻ Biến). The nuclear hexagram (Quẻ Hỗ) reveals hidden dynamics. Your interpretation focuses on the symbolic imagery of the two trigrams and the five-element (Ngũ Hành) relationship between Body (Thể) and Use (Dụng). Do NOT apply Lục Hào Tăng San Bốc Dịch rules (no Nhật thần/Nguyệt lệnh line-by-line analysis). Always respond in English.`
          : `Bạn là chuyên gia về Mai Hoa Dịch Số (梅花易數 — phương pháp lập quẻ Thiệu Khang đời Tống). Bạn thấu hiểu cách tính quẻ từ số seri, ngày giờ (năm/tháng/ngày/giờ âm lịch), cách xác định Thượng quái (Thể) và Hạ quái (Dụng), và cách hào động duy nhất biến Quẻ Chủ sang Quẻ Biến. Quẻ Hỗ ẩn chứa diễn biến bên trong. Bạn luận giải dựa trên tượng quẻ, tượng quái, Ngũ Hành tương sinh tương khắc giữa Thể và Dụng — KHÔNG áp dụng quy tắc Lục Hào Tăng San Bốc Dịch (không phân tích Nhật thần, Nguyệt lệnh, Lục Thân từng hào). Luôn trả lời bằng tiếng Việt.`;
      } else {
        sysPrompt = isEn
          ? `You are a deeply wise Lục Hào (六爻 — Six Lines Divination) scholar, expert in Zēng Shān Bǔ Yì (增刪卜易 — Tăng San Bốc Dịch) and Ứng Kỳ timing. You analyze the six Nap Giap (納甲) lines with their Six Relatives (Lục Thân), Day/Month branches (Nhật thần/Nguyệt lệnh), Dụng Thần (Useful God), Ám Động, Nhật Phá, Tam Hợp, Tuần Không, Hidden Spirit (Phục Thần), and Symbolic Stars. This is LUCH HAO cast (3-coin method), not Mai Hoa. Always respond in English.`
          : `Bạn là chuyên gia Lục Hào (六爻) theo pháp Tăng San Bốc Dịch (增刪卜易). Bạn phân tích 6 hào Nạp Giáp với Lục Thân, Nhật thần, Nguyệt lệnh, Dụng Thần, Ám Động, Nhật Phá, Tham Sinh Vong Khắc, Tam Hợp Cục, Hợp Trụ, Nhập Mộ, Phi–Phục, Tuần Không và Thần sát. Đây là quẻ LỤC HÀO (gieo 3 đồng xu × 6 lần) — KHÔNG phải Mai Hoa Dịch Số. Luôn trả lời bằng tiếng Việt.`;
      }

      const question = result.question || '';
      const caster = result.caster || '';
      const castDate = result.castDate || '';
      const castTime = result.castTime || '';
      // extraContext chỉ áp dụng cho Lục Hào (Tăng San data)
      const extraContext = isMaiHoa ? '' : buildLucHaoPromptContext(result, isEn);

      // ── User prompt riêng cho từng phương pháp ────────────────────────────
      let userPrompt;
      if (isMaiHoa) {
        const subLabel = result.subMode === 'time'
          ? (isEn ? 'Date/Time of Intent' : 'Ngày giờ động tâm')
          : (isEn ? 'Serial Number' : 'Số seri');
        userPrompt = isEn
          ? `Please interpret the following Mai Hoa Yi Shu (Plum Blossom Numerology) reading:\n- Topic / Question: "${question}"\n- Method: ${subLabel}\n- Date & Time: ${castDate} ${castTime}\n- Detailed Hexagram Info:\n${plainTextResult}\n\nInterpret using Mai Hoa method (Shao Yong) with the following sections:\n1. **Trigram Imagery (Tượng Quái)**: Describe the symbolic imagery of the Upper trigram (Thượng quái / Thể) and Lower trigram (Hạ quái / Dụng) in relation to the question.\n2. **Thể–Dụng Relationship**: Analyze the Five-Element (Ngũ Hành) relationship between Body (Thể) and Use (Dụng) trigrams — is Dụng generating, controlling, or weakening Thể? What does this say about the situation?\n3. **Moving Line & Changed Hexagram**: Interpret the single moving line's transformation and what the Changed hexagram (Quẻ Biến) reveals about the outcome.\n4. **Nuclear Hexagram (Quẻ Hỗ)**: What hidden dynamic does the nuclear hexagram reveal?\n5. **Actionable Guidance**: Provide 3 concrete, practical steps based on this reading.`
          : `Hãy luận giải quẻ Mai Hoa Dịch Số sau cho tôi:\n- Việc cần xem: "${question}"\n- Phương pháp: ${subLabel}\n- Thời gian lập: ${castDate} ${castTime}\n- Thông tin quẻ chi tiết:\n${plainTextResult}\n\nLuận giải theo đúng phép Mai Hoa Dịch Số (Thiệu Khang) gồm các mục:\n1. **Tượng quái**: Phân tích hình tượng Thượng quái (Thể) và Hạ quái (Dụng) liên hệ với việc cần xem — tượng quái nói lên điều gì về tình thế?\n2. **Quan hệ Thể–Dụng**: Phân tích Ngũ Hành tương sinh tương khắc giữa quái Thể và quái Dụng — Dụng sinh Thể, khắc Thể hay bị Thể khắc? Điều này ứng với câu hỏi như thế nào?\n3. **Hào động & Quẻ Biến**: Luận ý nghĩa hào động duy nhất và những điều Quẻ Biến tiết lộ về kết cục.\n4. **Quẻ Hỗ**: Quẻ Hỗ ẩn chứa diễn biến nội tại gì trong việc cần hỏi?\n5. **Lời khuyên hành động**: Đưa ra 3 lời khuyên cụ thể, thiết thực nhất dựa trên quẻ.`;
      } else {
        userPrompt = isEn
          ? `Please interpret the following Lục Hào (Six Lines) reading for me:\n- Topic / Question: "${question}"\n- Caster: ${caster || 'Self-cast'}\n- Date & Time: ${castDate} ${castTime}${extraContext}\n- Detailed Hexagram Info:\n${plainTextResult}\n\nInclude the following topics in your interpretation sections:\n1. **Hexagram Overview**: Primary hexagram, nuclear hexagram (Quẻ Hỗ), changed hexagram, special traits (Lục Xung, Lục Hợp, Du Hồn, Quy Hồn if any), and Ti-Yong energetic relationship.\n2. **Detailed Analysis for Question**: Address "${question}" directly, analyzing current situation, Subject-Object (Thế/Ứng) dynamics, Useful God (Dụng Thần) strength under Day/Month branches (Nhật thần, Nguyệt lệnh), Ám Động / Nhật Phá, Tham Sinh Vong Khắc / Tam Hợp Cục / Hợp Trụ / Nhập Mộ, Void branches (Tuần Không), Hidden Spirit (Phục Thần), and Symbolic Stars (Lộc, Mã, Đào Hoa) if relevant.\n3. **Moving Lines & Ứng Kỳ Timing**: Analyze moving lines transformations (Hóa tiến/thoái, hồi đầu sinh/khắc) and cite the concrete Ứng Kỳ manifestation dates provided above.\n4. **Actionable Guidance**: Provide 3 concrete, practical steps to navigate this situation.`
          : `Hãy luận giải quẻ Lục Hào sau cho tôi:\n- Việc cần xem: "${question}"\n- Người lập quẻ: ${caster || 'Tự gieo quẻ'}\n- Thời gian lập: ${castDate} ${castTime}${extraContext}\n- Thông tin quẻ chi tiết:\n${plainTextResult}\n\nHãy luận giải các nội dung sau trong các mục luận giải:\n1. **Tổng quan quẻ dịch**: Ý nghĩa Quẻ Chủ, Quẻ Hỗ, Quẻ Biến, đặc tính quẻ (Lục Xung, Lục Hợp, Du Hồn, Quy Hồn nếu có) và mối tương quan giữa Thể và Dụng.\n2. **Luận giải chi tiết cho câu hỏi**: Trực tiếp câu hỏi "${question}", phân tích tình thế hiện tại, tương quan Hào Thế/Ứng, sức mạnh của Dụng Thần theo Tăng San Bốc Dịch (Ám Động, Nhật Phá, Tham Sinh Vong Khắc, Tam Hợp Cục, Hợp Trụ, Nhập Mộ, Phi–Phục, Tuần Không) và các Thần sát (Lộc, Dịch Mã, Đào Hoa) nếu có.\n3. **Ý nghĩa hào động & Dự báo Ứng Kỳ**: Phân tích sự biến hóa của hào động (hồi đầu sinh/khắc, hóa tiến/thoái...) và nêu rõ thời điểm ứng nghiệm (Ứng Kỳ) theo các mốc ngày Dương lịch / Can Chi đã tính sẵn.\n4. **Lời khuyên hành động**: Đưa ra 3 lời khuyên hành động thực tế, cụ thể nhất để cải biến tình huống hoặc nắm bắt cơ hội.`;
      }

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

    // ── Phân biệt phương pháp cho follow-up ──────────────────────────────
    const isMaiHoaFollowUp = result?.method === 'mai-hoa' || result?.subMode === 'time' || result?.subMode === 'serial';

    try {
      // Follow-up system prompt tùy phương pháp
      let sysPrompt;
      if (isMaiHoaFollowUp) {
        sysPrompt = isEn
          ? `You are an expert in Mai Hoa Yi Shu (Plum Blossom Numerology — Shao Yong method). The user is asking a follow-up question. Answer CONCISELY using Mai Hoa logic: trigram imagery, Thể–Dụng Five-Element relationship, moving line, and changed hexagram. Do NOT use Lục Hào Tăng San rules. Always respond in English.`
          : `Bạn là chuyên gia Mai Hoa Dịch Số (phép Thiệu Khang). Người dùng đang hỏi thêm. Trả lời NGẮN GỌN dựa trên tượng quái, quan hệ Ngũ Hành Thể–Dụng, hào động và quẻ biến — KHÔNG áp dụng quy tắc Lục Hào. Luôn trả lời bằng tiếng Việt.`;
      } else {
        sysPrompt = isEn
          ? `You are an expert Lục Hào (Six Lines) scholar. The user is asking a follow-up question based on their reading and previous interpretation.\nRequirements:\n1. Answer CONCISELY and directly address the user's question. Do NOT repeat introductory information or hexagram setup.\n2. Briefly analyze based on hexagram imagery, moving lines, Dụng Thần strength, or Ứng Kỳ timing.\n3. Conclude with clear, practical advice. Always respond in English.`
          : `Bạn là chuyên gia Lục Hào Tăng San Bốc Dịch. Người dùng đang hỏi thêm một câu hỏi cụ thể dựa trên quẻ dịch đã luận giải.\nYêu cầu:\n1. Trả lời NGẮN GỌN, đi thẳng vào trọng tâm. KHÔNG lặp lại thông tin quẻ ban đầu.\n2. Phân tích ngắn gọn dựa trên tượng quẻ, hào động, Dụng Thần hoặc Ứng Kỳ liên quan.\n3. Đưa ra kết luận hoặc lời khuyên cụ thể. Luôn trả lời bằng tiếng Việt.`;
      }

      const question = result?.question || '';
      const caster = result?.caster || '';
      const castDate = result?.castDate || '';
      const castTime = result?.castTime || '';
      const extraContext = isMaiHoaFollowUp ? '' : buildLucHaoPromptContext(result, isEn);

      const methodLabel = isMaiHoaFollowUp
        ? (result?.subMode === 'time' ? (isEn ? 'Date/Time of Intent' : 'Ngày giờ động tâm') : (isEn ? 'Serial Number' : 'Số seri'))
        : (isEn ? 'Six Lines (Lục Hào)' : 'Lục Hào');

      const initialUserPrompt = isEn
        ? `Please interpret the following ${isMaiHoaFollowUp ? 'Mai Hoa Yi Shu' : 'Lục Hào'} reading:\n- Topic / Question: "${question}"\n- Method: ${methodLabel}\n- Caster: ${caster || 'Self-cast'}\n- Date & Time: ${castDate} ${castTime}${extraContext}\n- Hexagram details:\n${plainTextResult}`
        : `Hãy luận giải quẻ ${isMaiHoaFollowUp ? 'Mai Hoa Dịch Số' : 'Lục Hào'} sau cho tôi:\n- Việc cần xem: "${question}"\n- Phương pháp: ${methodLabel}\n- Người lập quẻ: ${caster || 'Tự gieo quẻ'}\n- Thời gian lập: ${castDate} ${castTime}${extraContext}\n- Thông tin quẻ chi tiết:\n${plainTextResult}`;

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
    <section className="card animate-in" data-tour="iching-ai" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
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

      {/* Reference-only Notice + Scroll to Copy Prompt */}
      <div
        role="note"
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(217, 119, 6, 0.1)',
          border: '1px solid rgba(217, 119, 6, 0.32)',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span>
          {isEn
            ? 'ℹ️ Note: Built-in AI reading is for reference only (currently unstable). For best results, scroll down to Copy Prompt and paste into Google Gemini.'
            : 'ℹ️ Lưu ý: AI luận giải trực tiếp tại đây chỉ mang tính tham khảo (hiện chưa hoạt động thật sự tốt). Khuyên dùng nút Copy Prompt bên dưới và dán vào Google Gemini.'}
        </span>
        <button
          type="button"
          onClick={() => document.getElementById('iching-export-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid rgba(184, 134, 11, 0.45)',
            background: 'rgba(184, 134, 11, 0.12)',
            color: 'var(--color-ink)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isEn ? '⬇ Go to Copy Prompt' : '⬇ Tới mục Copy Prompt'}
        </button>
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
              style={{ padding: '6px 10px', fontSize: '0.8125rem', height: 34, border: '1px solid var(--color-ink-muted)' }}
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

