/**
 * useCombinedReading
 * Hook quản lý toàn bộ state của tính năng kết hợp Tử Vi + Kinh Dịch.
 */
import { useState, useCallback, useRef } from 'react';
import { requestAiChat, refreshAiQuota, resolveAllowedAiModel } from '../../utils/aiProxy.mjs';
import { readOpenAiChatStream } from '../../utils/openAiSse.mjs';
import {
  castAllLines,
  buildSimpleResult,
  summarizeRelevantPalaces,
  buildCombinedPrompt,
} from './combinedReadingModel.js';

export {
  HEXAGRAMS,
  NAP_AM_MAP,
  getBirthCanChiAndMenh,
  normalizeHexResult,
  TOPIC_CUNG_MAP,
  TOPIC_LABELS,
  summarizeRelevantPalaces,
  GIO_SINH_OPTIONS,
  getHourIndexFromTimeStr,
  resolveEffectiveBirthInfo,
  resolveCurrentDaiHan,
  buildCombinedPrompt,
} from './combinedReadingModel.js';

// ─── Main hook ─────────────────────────────────────────────────────────────
export function useCombinedReading({ app = 'iching', model = 'combo1', isAuthenticated = false, onLogin }) {
  const [topic, setTopic] = useState('career');
  const [question, setQuestion] = useState('');
  const [hexResult, setHexResult] = useState(null);
  const [isCasting, setIsCasting] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef(null);

  const castHexagram = useCallback(() => {
    setIsCasting(true);
    // Small delay for animation feel
    setTimeout(() => {
      const lines = castAllLines();
      const result = buildSimpleResult(lines);
      setHexResult(result);
      setIsCasting(false);
    }, 800);
  }, []);

  const queryAi = useCallback(async ({ chartResult, birthInfo, language = 'vi' }) => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    if (!question.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingAi(true);
    setAiError('');
    setAiResponse('');

    const relevantPalaces = summarizeRelevantPalaces(chartResult, topic);
    const prompt = buildCombinedPrompt({
      topic, question, birthInfo, relevantPalaces, hexResult, language, chartResult,
    });

    const activeModel = resolveAllowedAiModel(model);

    try {
      const response = await requestAiChat({
        app,
        model: activeModel,
        stream: true,
        messages: [
          { role: 'system', content: 'Bạn là chuyên gia phương Đông tổng hợp hai hệ thống: Tử Vi Đẩu Số và Kinh Dịch.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.75,
        signal: controller.signal,
      });
      const full = await readOpenAiChatStream(response, {
        onText: setAiResponse,
      });
      setAiResponse(full);
      if (full.trim()) await refreshAiQuota(app);
    } catch (streamErr) {
      if (streamErr.name !== 'AbortError') {
        setAiError(streamErr.message || 'Lỗi đọc luồng dữ liệu AI');
      }
    } finally {
      setIsLoadingAi(false);
    }
  }, [question, topic, hexResult, app, model, isAuthenticated, onLogin]);

  return {
    topic, setTopic,
    question, setQuestion,
    hexResult, setHexResult,
    isCasting, castHexagram,
    aiResponse, isLoadingAi, aiError,
    queryAi,
  };
}
