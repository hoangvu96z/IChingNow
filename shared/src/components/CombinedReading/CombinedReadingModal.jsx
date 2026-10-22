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
import {
  useCombinedReading,
  summarizeRelevantPalaces,
  normalizeHexResult,
  GIO_SINH_OPTIONS,
} from './useCombinedReading.js';
import { calculateChartFromBirthInfo } from '../../utils/tuViCalculator.js';

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

  const aiModel = import.meta.env.VITE_AI_MODEL || userAiSettings.model || 'combo1';

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
    if (!localBirthInfo?.day || !localBirthInfo?.month || !localBirthInfo?.year) return null;
    return calculateChartFromBirthInfo(localBirthInfo);
  }, [chartResult, localBirthInfo]);

  const effectiveChart = chartResult || calculatedChart;

  const effectiveBirthInfo = useMemo(() => {
    if (inputData) {
      const hIdx = inputData.lunarHourIndex !== undefined ? inputData.lunarHourIndex : 6;
      const hOpt = GIO_SINH_OPTIONS[hIdx] || GIO_SINH_OPTIONS[6];
      const sDay = inputData.solarInput?.day || inputData.day || '';
      const sMonth = inputData.solarInput?.month || inputData.month || '';
      const sYear = inputData.solarInput?.year || inputData.year || '';
      return {
        yearCan: inputData.yearCan || '',
        yearChi: inputData.yearChi || '',
        canChi: (inputData.yearCan && inputData.yearChi) ? `${inputData.yearCan} ${inputData.yearChi}` : '',
        menh: chartResult?.banMenhNapAm || chartResult?.nguHanh || '',
        cuc: chartResult?.cucName || chartResult?.cuc || '',
        chuMenh: chartResult?.chuMenh || '',
        chuThan: chartResult?.chuThan || '',
        menhCung: chartResult?.menhCung || '',
        thanCung: chartResult?.thanCung || '',
        name: inputData.name || '',
        gender: (inputData.gender === 1 || inputData.gender === 'nam') ? 'nam' : 'nu',
        day: sDay,
        month: sMonth,
        year: sYear,
        hourIndex: hIdx,
        hourName: hOpt.name,
        hourLabel: hOpt.label,
      };
    }
    if (localBirthInfo) {
      const hIdx = (localBirthInfo.hourIndex !== undefined && localBirthInfo.hourIndex !== null)
        ? Number(localBirthInfo.hourIndex)
        : 6;
      const hOpt = GIO_SINH_OPTIONS[hIdx] || GIO_SINH_OPTIONS[6];
      return {
        ...localBirthInfo,
        hourIndex: hIdx,
        hourName: localBirthInfo.hourName || hOpt.name,
        hourLabel: localBirthInfo.hourLabel || hOpt.label,
        canChi: calculatedChart?.canChiNam || localBirthInfo.canChi || '',
        menh: calculatedChart?.banMenhNapAm || localBirthInfo.menh || '',
        cuc: calculatedChart?.cucName || localBirthInfo.cuc || '',
        chuMenh: calculatedChart?.chuMenh || '',
        chuThan: calculatedChart?.chuThan || '',
        menhCung: calculatedChart?.menhCung || '',
        thanCung: calculatedChart?.thanCung || '',
      };
    }
    return null;
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

        {/* Step indicator (Clickable Navigation) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          padding: '8px 12px',
        }}>
          {[1, hasChart ? null : 2, 3, 4].filter(Boolean).map((s, idx) => {
            let label = '';
            if (hasChart) {
              const labelsTuVi = isVi
                ? ['Chủ đề', 'Hỏi & Gieo quẻ', 'Luận giải AI']
                : ['Topic', 'Ask & Cast', 'AI Reading'];
              label = labelsTuVi[idx];
            } else {
              const labelsIChing = isVi
                ? ['Chủ đề', 'Ngày sinh', hasPrecastHex ? 'Xác nhận & Quẻ' : 'Hỏi & Quẻ', 'Luận giải AI']
                : ['Topic', 'Birth Info', hasPrecastHex ? 'Confirm & Hex' : 'Ask & Hex', 'AI Reading'];
              label = labelsIChing[idx];
            }
            const actualStep = hasChart ? [1, 3, 4][idx] : s;
            const isActive = step === actualStep;
            const isPassed = step > actualStep;
            const isUnlocked = actualStep <= maxStepReached;
            const isClickable = !isActive && (
              isPassed ||
              isUnlocked ||
              actualStep === 1 ||
              (actualStep === 2 && !hasChart && !!topic) ||
              (actualStep === 3 && !!topic && (hasChart || !!localBirthInfo || maxStepReached >= 3)) ||
              (actualStep === 4 && (maxStepReached >= 4 || !!aiResponse))
            );
            const isHovered = hoveredStep === actualStep;

            let tooltip = '';
            if (isActive) {
              tooltip = isVi ? `Đang ở bước ${idx + 1}: ${label}` : `Current step ${idx + 1}: ${label}`;
            } else if (isClickable) {
              tooltip = isVi ? `Bấm để chuyển đến bước ${idx + 1}: ${label}` : `Click to jump to step ${idx + 1}: ${label}`;
            } else {
              tooltip = isVi ? 'Vui lòng hoàn thành các bước trước' : 'Please complete previous steps first';
            }

            return (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: idx < (hasChart ? 2 : 3) ? 1 : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isClickable) setStep(actualStep);
                  }}
                  onMouseEnter={() => setHoveredStep(actualStep)}
                  onMouseLeave={() => setHoveredStep(null)}
                  disabled={!isClickable && !isActive}
                  title={tooltip}
                  aria-label={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    background: isHovered && isClickable
                      ? 'rgba(229,193,88,0.15)'
                      : isActive
                        ? 'rgba(229,193,88,0.08)'
                        : 'transparent',
                    border: isHovered && isClickable
                      ? '1px solid rgba(229,193,88,0.45)'
                      : isActive
                        ? '1px solid rgba(229,193,88,0.25)'
                        : '1px solid transparent',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    cursor: isClickable ? 'pointer' : (isActive ? 'default' : 'not-allowed'),
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    transform: isHovered && isClickable ? 'translateY(-1px)' : 'none',
                    boxShadow: isHovered && isClickable ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(229,193,88,0.4), rgba(229,193,88,0.18))'
                      : isPassed
                        ? 'rgba(229,193,88,0.22)'
                        : isUnlocked
                          ? 'rgba(229,193,88,0.12)'
                          : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${
                      isActive
                        ? '#e5c158'
                        : isPassed
                          ? 'rgba(229,193,88,0.6)'
                          : isUnlocked
                            ? 'rgba(229,193,88,0.35)'
                            : 'rgba(255,255,255,0.1)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: isActive
                      ? '#fff'
                      : isPassed || isUnlocked
                        ? '#e5c158'
                        : 'rgba(255,255,255,0.3)',
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: isActive ? '0 0 10px rgba(229,193,88,0.5)' : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    color: isActive
                      ? '#e5c158'
                      : isHovered && isClickable
                        ? '#fff'
                        : isPassed
                          ? 'rgba(255,255,255,0.85)'
                          : isUnlocked
                            ? 'rgba(255,255,255,0.65)'
                            : 'rgba(255,255,255,0.25)',
                    fontWeight: isActive ? 700 : (isPassed || (isHovered && isClickable)) ? 600 : 400,
                    whiteSpace: 'nowrap',
                    textDecoration: isHovered && isClickable ? 'underline' : 'none',
                    textUnderlineOffset: '3px',
                    transition: 'all 0.2s ease',
                  }}>
                    {label}
                  </span>
                </button>
                {idx < (hasChart ? 2 : 3) && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    minWidth: '8px',
                    background: isPassed
                      ? 'linear-gradient(90deg, rgba(229,193,88,0.6), rgba(229,193,88,0.2))'
                      : 'rgba(255,255,255,0.08)',
                    borderRadius: '1px',
                  }} />
                )}
              </div>
            );
          })}
        </div>

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
