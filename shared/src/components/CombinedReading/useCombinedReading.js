/**
 * useCombinedReading
 * Hook quản lý toàn bộ state của tính năng kết hợp Tử Vi + Kinh Dịch
 */
import { useState, useCallback, useRef } from 'react';
import { castAllLines } from '@iching/logic/castLines.js';
import { buildResult } from '@iching/logic/buildHexagram.js';

// Ánh xạ chủ đề → cung Tử Vi tương ứng
export const TOPIC_CUNG_MAP = {
  career:       ['Quan Lộc', 'Mệnh', 'Tài Bạch'],
  love:         ['Phu Thê', 'Mệnh', 'Phúc Đức'],
  finance:      ['Tài Bạch', 'Quan Lộc', 'Điền Trạch'],
  health:       ['Tật Ách', 'Mệnh', 'Phúc Đức'],
  family:       ['Phụ Mẫu', 'Tử Tức', 'Huynh Đệ'],
  general:      ['Mệnh', 'Quan Lộc', 'Tài Bạch'],
};

export const TOPIC_LABELS = {
  career:  { vi: '💼 Công danh sự nghiệp', en: '💼 Career & Fame' },
  love:    { vi: '💑 Tình duyên hôn nhân', en: '💑 Love & Marriage' },
  finance: { vi: '💰 Tài lộc tiền bạc',    en: '💰 Finance & Wealth' },
  health:  { vi: '🌿 Sức khoẻ',             en: '🌿 Health & Vitality' },
  family:  { vi: '👨‍👩‍👧 Gia đình con cái',    en: '👨‍👩‍👧 Family & Children' },
  general: { vi: '✨ Tổng quát vận mệnh',    en: '✨ General Fortune' },
};

/**
 * Tóm tắt thông tin các cung liên quan từ kết quả lá số Tử Vi
 */
export function summarizeRelevantPalaces(chartResult, topic) {
  if (!chartResult?.palates) return null;
  const relevantCungs = TOPIC_CUNG_MAP[topic] || TOPIC_CUNG_MAP.general;
  
  return chartResult.palates
    .filter(p => relevantCungs.some(c => p.chucNang?.includes(c) || c.includes(p.chucNang || '')))
    .slice(0, 3)
    .map(p => ({
      name: p.chucNang || p.chiName,
      chi: p.chiName,
      stars: (p.stars || []).map(s => `${s.name}${s.trangThai ? ` (${s.trangThai})` : ''}`).join(', '),
      isMenh: p.isMenh,
      isThan: p.isThan,
      isTuan: p.isTuan,
      isTriet: p.isTriet,
      daiHan: p.daiHan || null,
      tieuHan: p.tieuHan || null,
    }));
}

/**
 * Build prompt tổng hợp cho AI từ context Tử Vi + Kinh Dịch
 */
export function buildCombinedPrompt({ topic, question, birthInfo, relevantPalaces, hexResult, language }) {
  const isVi = language !== 'en';
  const topicLabel = TOPIC_LABELS[topic]?.[isVi ? 'vi' : 'en'] || topic;

  const palaceSection = relevantPalaces?.map(p =>
    `  - Cung ${p.name} (${p.chi}): ${p.stars || 'chưa có sao'}`
    + (p.isMenh ? ' [Cung Mệnh]' : '')
    + (p.isThan ? ' [Cung Thân]' : '')
    + (p.isTuan ? ' [bị Tuần]' : '')
    + (p.isTriet ? ' [bị Triệt]' : '')
  ).join('\n') || '  (chưa có dữ liệu lá số)';

  const hexSection = hexResult
    ? `- Quẻ chủ: ${hexResult.primary?.name || ''} (${hexResult.primary?.chineseName || ''})\n` +
      `  Lời Thoán: ${hexResult.primary?.judgment || ''}\n` +
      (hexResult.changed ? `- Quẻ biến: ${hexResult.changed.name} — hướng về: ${hexResult.changed.judgment || ''}` : '')
    : '(chưa gieo quẻ)';

  if (isVi) {
    return `Bạn là chuyên gia phương Đông tổng hợp hai hệ thống chiêm tinh: Tử Vi Đẩu Số và Kinh Dịch.

CHỦ ĐỀ HỎI: ${topicLabel}
CÂU HỎI CỤ THỂ: "${question}"

--- THÔNG TIN LÁ SỐ TỬ VI ---
${birthInfo ? `Người hỏi: sinh năm ${birthInfo.yearCan || ''} ${birthInfo.yearChi || ''}, mệnh ${birthInfo.menh || ''}, cục ${birthInfo.cuc || ''}` : 'Chưa có thông tin cá nhân.'}
Các cung liên quan đến chủ đề "${topicLabel}":
${palaceSection}
${chartResult?.daiHan ? `Đại hạn hiện tại: ${chartResult.daiHan}` : ''}
${chartResult?.tieuHan ? `Tiểu hạn hiện tại: ${chartResult.tieuHan}` : ''}

--- KẾT QUẢ KINH DỊCH (GIEO QUẺ) ---
${hexSection}

--- YÊU CẦU LUẬN GIẢI ---
Hãy kết hợp cả hai nguồn thông tin trên để đưa ra luận giải toàn diện:

1. **Tử Vi nói gì?** — Từ các cung liên quan, sao chiếu, đại hạn/tiểu hạn, cho biết xu hướng nền tảng của người hỏi về chủ đề "${topicLabel}".

2. **Kinh Dịch nói gì?** — Từ quẻ chủ và quẻ biến (nếu có), cho biết thời điểm hiện tại và hướng đi trước mắt.

3. **Tổng hợp hai nguồn** — Khi kết hợp, vận mệnh tổng thể của người hỏi về câu hỏi này là gì? Hai hệ thống có đồng thuận hay mâu thuẫn? Nếu mâu thuẫn, cần ưu tiên lắng nghe cái nào?

4. **Lời khuyên cụ thể** — 3 hành động thực tế người hỏi nên làm ngay trong thời điểm này.

Viết bằng tiếng Việt, giọng điệu ân cần nhưng thẳng thắn, không dùng câu sáo rỗng.`;
  }

  return `You are an Eastern wisdom expert synthesizing two systems: Vietnamese/Chinese Zi Wei Dou Shu astrology and I Ching divination.

TOPIC: ${topicLabel}
QUESTION: "${question}"

--- ZI WEI DOU SHU (NATAL CHART) ---
${birthInfo ? `Person: born in year ${birthInfo.yearCan || ''} ${birthInfo.yearChi || ''}, life element ${birthInfo.menh || ''}` : 'No personal data provided.'}
Relevant palaces for "${topicLabel}":
${palaceSection}

--- I CHING READING ---
${hexSection}

Please provide a holistic reading combining both systems, covering:
1. What the Zi Wei chart reveals about the person's underlying fortune
2. What the I Ching hexagram says about the current moment and near future
3. A synthesized verdict — do the two systems agree or conflict?
4. Three practical action steps for the person right now.

Write in English, warm but direct tone.`;
}

/**
 * Main hook
 */
export function useCombinedReading({ apiBaseUrl, apiKey, model = 'combo1' }) {
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
    setTimeout(() => {
      const lines = castAllLines('three-coin');
      const result = buildResult(lines);
      setHexResult(result);
      setIsCasting(false);
    }, 800);
  }, []);

  const queryAi = useCallback(async ({ chartResult, birthInfo, language = 'vi' }) => {
    if (!question.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingAi(true);
    setAiError('');
    setAiResponse('');

    const relevantPalaces = summarizeRelevantPalaces(chartResult, topic);
    const prompt = buildCombinedPrompt({
      topic, question, birthInfo, relevantPalaces, hexResult, language,
      chartResult,
    });

    try {
      const res = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: 'system', content: 'Bạn là chuyên gia tổng hợp Tử Vi Đẩu Số và Kinh Dịch phương Đông.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2000,
          temperature: 0.75,
        }),
      });

      if (!res.ok) throw new Error(`AI trả lỗi ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            full += delta;
            setAiResponse(full);
          } catch { /* ignore malformed */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setAiError(err.message || 'Lỗi kết nối AI');
    } finally {
      setIsLoadingAi(false);
    }
  }, [question, topic, hexResult, apiBaseUrl, apiKey, model]);

  return {
    topic, setTopic,
    question, setQuestion,
    hexResult, setHexResult,
    isCasting, castHexagram,
    aiResponse, isLoadingAi, aiError,
    queryAi,
  };
}
