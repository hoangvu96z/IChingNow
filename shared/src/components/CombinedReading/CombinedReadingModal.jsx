/**
 * CombinedReadingModal
 * Modal kết hợp Tử Vi + Kinh Dịch — dùng được từ cả IChingNow và TuViNow
 *
 * Props:
 *   isOpen            — boolean
 *   onClose           — fn()
 *   chartResult       — object | null  (từ TuViNow anLaSoTuVi, hoặc null nếu chưa có)
 *   inputData         — object | null  (birth input từ TuViNow)
 *   sourceApp         — 'iching' | 'tuvi'
 *   language          — 'vi' | 'en'
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { STORAGE_KEY } from './QuickBirthForm.jsx';
import TopicSelectionStep from './steps/TopicSelectionStep.jsx';
import BirthInfoStep from './steps/BirthInfoStep.jsx';
import QuestionStep from './steps/QuestionStep.jsx';
import AiResultStep from './steps/AiResultStep.jsx';
import StepProgress from './StepProgress.jsx';
import {
  useCombinedReading,
  summarizeRelevantPalaces,
  normalizeHexResult,
  resolveEffectiveBirthInfo,
} from './useCombinedReading.js';
import { calculateChartFromBirthInfo } from '../../utils/tuViCalculator.js';
import { resolveAllowedAiModel } from '../../utils/aiProxy.mjs';

// ─── Main Modal ─────────────────────────────────────────────────────────
export default function CombinedReadingModal({
  isOpen,
  onClose,
  chartResult = null,
  inputData = null,
  initialQuestion = '',
  initialHexResult = null,
  sourceApp = 'iching',
  language = 'vi',
  isAuthenticated = false,
  onLogin,
}) {
  const isVi = language !== 'en';
  const userAiSettings = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('iching_ai_settings') || '{}');
    } catch {
      return {};
    }
  }, []);

  const aiModel = resolveAllowedAiModel(userAiSettings.model);

  const {
    topic, setTopic,
    question, setQuestion,
    hexResult, setHexResult, isCasting, castHexagram,
    aiResponse, isLoadingAi, aiError,
    queryAi,
  } = useCombinedReading({
    app: sourceApp === 'tuvi' ? 'tuvi' : 'iching',
    model: aiModel,
    isAuthenticated,
    onLogin,
  });

  // Local birth info (khi không có chartResult từ TuViNow)
  const [localBirthInfo, setLocalBirthInfo] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return (saved.year && saved.month && saved.day) ? saved : null;
    } catch {
      return null;
    }
  });

  const hasChart = !!chartResult;
  const isFromIChing = sourceApp === 'iching' || !!initialHexResult;
  const hasPrecastHex = !!initialHexResult || (isFromIChing && !!hexResult);

  // Step 1: topic, Step 2: birth info (if needed), Step 3: question+review hex, Step 4: AI result
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  useEffect(() => {
    if (step > maxStepReached) {
      setMaxStepReached(step);
    }
  }, [step, maxStepReached]);

  // Pre-fill question và hexResult khi mở modal — luôn đồng bộ state khi open/close
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      // Modal vừa mở: Luôn đồng bộ question và hexResult từ props (kể cả khi xem lại quẻ cũ khác)
      if (initialQuestion) {
        setQuestion(initialQuestion);
      }
      if (initialHexResult) {
        const normalized = normalizeHexResult(initialHexResult);
        if (normalized) {
          setHexResult(normalized);
        }
      }
    } else if (!isOpen && wasOpen) {
      // Modal vừa đóng: Reset toàn bộ state về ban đầu
      setStep(1);
      setMaxStepReached(1);
      setHexResult(null);
      setQuestion('');
    }
  }, [isOpen, initialQuestion, initialHexResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopicSelect = (t) => {
    setTopic(t);
    if (hasChart) {
      // Đã có lá số sẵn (từ TuViNow) → bỏ qua bước nhập ngày sinh
      setStep(3);
    } else {
      // Chưa có lá số (từ IChingNow) → sang bước nhập ngày sinh
      setStep(2);
    }
  };

  const handleBirthSubmit = ({ birthInfo }) => {
    setLocalBirthInfo(birthInfo);
    setStep(3);
  };

  // Tự động an lá số Tử Vi hoàn chỉnh từ thông tin ngày/giờ sinh nếu chưa có lá số sẵn
  const calculatedChart = useMemo(() => {
    if (chartResult) return null;
    const source = inputData || localBirthInfo;
    if (!source) return null;
    return calculateChartFromBirthInfo(source);
  }, [chartResult, inputData, localBirthInfo]);

  const effectiveChart = chartResult || calculatedChart;

  const effectiveBirthInfo = useMemo(() => {
    return resolveEffectiveBirthInfo({
      inputData,
      chartResult,
      localBirthInfo,
      calculatedChart,
    });
  }, [inputData, chartResult, localBirthInfo, calculatedChart]);

  const handleCastAndAsk = () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    // Chỉ tự gieo quẻ nếu quẻ hoàn toàn chưa có
    if (!hexResult) {
      castHexagram();
    }
    setStep(4);

    setTimeout(() => {
      queryAi({
        chartResult: effectiveChart,
        birthInfo: effectiveBirthInfo,
        language,
      });
    }, 400);
  };

  if (!isOpen) return null;

  const relevantPalaces = effectiveChart ? summarizeRelevantPalaces(effectiveChart, topic) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(5,3,15,0.85)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9001,
        width: 'min(680px, 96vw)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(160deg, rgba(18,12,40,0.98) 0%, rgba(10,8,25,0.98) 100%)',
        border: '1px solid rgba(229,193,88,0.3)',
        borderRadius: '20px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,193,88,0.08), inset 0 1px 0 rgba(229,193,88,0.1)',
        padding: '28px 28px 32px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(229,193,88,0.2) transparent',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>🔮</span>
              <h2 style={{
                margin: 0,
                fontFamily: "'Cinzel', serif",
                fontSize: '18px',
                background: 'linear-gradient(135deg, #e5c158, #f3e5ab)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {isVi ? 'Kết hợp Tử Vi & Kinh Dịch' : 'Zi Wei + I Ching Combined'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>
              {isVi
                ? 'Lá số Tử Vi định hướng nền tảng · Kinh Dịch phán định thời điểm · AI tổng hợp'
                : 'Natal chart reveals foundation · I Ching divines the moment · AI synthesizes both'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.5)',
            width: '32px', height: '32px',
            cursor: 'pointer', fontSize: '16px', flexShrink: 0,
          }}>✕</button>
        </div>

        <StepProgress
          step={step}
          setStep={setStep}
          hasChart={hasChart}
          isVi={isVi}
          hasPrecastHex={hasPrecastHex}
          maxStepReached={maxStepReached}
          hoveredStep={hoveredStep}
          setHoveredStep={setHoveredStep}
          topic={topic}
          localBirthInfo={localBirthInfo}
          aiResponse={aiResponse}
        />

        <TopicSelectionStep
          step={step}
          isVi={isVi}
          topic={topic}
          handleTopicSelect={handleTopicSelect}
        />
        <BirthInfoStep
          step={step}
          hasChart={hasChart}
          isVi={isVi}
          language={language}
          localBirthInfo={localBirthInfo}
          handleBirthSubmit={handleBirthSubmit}
          setStep={setStep}
        />
        <QuestionStep
          step={step}
          isVi={isVi}
          hasChart={hasChart}
          hasPrecastHex={hasPrecastHex}
          effectiveBirthInfo={effectiveBirthInfo}
          relevantPalaces={relevantPalaces}
          question={question}
          setQuestion={setQuestion}
          hexResult={hexResult}
          topic={topic}
          effectiveChart={effectiveChart}
          language={language}
          isCasting={isCasting}
          castHexagram={castHexagram}
          showPromptPreview={showPromptPreview}
          setShowPromptPreview={setShowPromptPreview}
          promptCopied={promptCopied}
          setPromptCopied={setPromptCopied}
          handleCastAndAsk={handleCastAndAsk}
          isLoadingAi={isLoadingAi}
          isAuthenticated={isAuthenticated}
        />
        <AiResultStep
          step={step}
          isVi={isVi}
          hasChart={hasChart}
          hexResult={hexResult}
          effectiveBirthInfo={effectiveBirthInfo}
          topic={topic}
          isLoadingAi={isLoadingAi}
          aiResponse={aiResponse}
          aiError={aiError}
          queryAi={queryAi}
          effectiveChart={effectiveChart}
          language={language}
          setStep={setStep}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
