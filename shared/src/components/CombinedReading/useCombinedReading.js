/**
 * useCombinedReading
 * Hook quản lý toàn bộ state của tính năng kết hợp Tử Vi + Kinh Dịch.
 *
 * NOTE: Module này hoàn toàn tự chứa (no cross-app imports) để có thể dùng
 * trong cả IChingNow lẫn TuViNow mà không kéo theo lunar-javascript dependency.
 */
import { useState, useCallback, useRef } from 'react';

// ─── 64 Hexagrams compact table (binary lower+upper → name) ────────────────
const HEXAGRAMS = [
  { id:  1, binary:'111111', nameVi:'Thuần Càn',            nameZh:'乾' },
  { id:  2, binary:'000000', nameVi:'Thuần Khôn',           nameZh:'坤' },
  { id:  3, binary:'100010', nameVi:'Thủy Lôi Truân',       nameZh:'屯' },
  { id:  4, binary:'010001', nameVi:'Sơn Thủy Mông',        nameZh:'蒙' },
  { id:  5, binary:'111010', nameVi:'Thủy Thiên Nhu',       nameZh:'需' },
  { id:  6, binary:'010111', nameVi:'Thiên Thủy Tụng',      nameZh:'訟' },
  { id:  7, binary:'010000', nameVi:'Địa Thủy Sư',          nameZh:'師' },
  { id:  8, binary:'000010', nameVi:'Thủy Địa Tỷ',          nameZh:'比' },
  { id:  9, binary:'111011', nameVi:'Phong Thiên Tiểu Súc', nameZh:'小畜' },
  { id: 10, binary:'110111', nameVi:'Thiên Trạch Lý',       nameZh:'履' },
  { id: 11, binary:'111000', nameVi:'Địa Thiên Thái',       nameZh:'泰' },
  { id: 12, binary:'000111', nameVi:'Thiên Địa Bĩ',         nameZh:'否' },
  { id: 13, binary:'101111', nameVi:'Thiên Hỏa Đồng Nhân', nameZh:'同人' },
  { id: 14, binary:'111101', nameVi:'Hỏa Thiên Đại Hữu',   nameZh:'大有' },
  { id: 15, binary:'001000', nameVi:'Địa Sơn Khiêm',        nameZh:'謙' },
  { id: 16, binary:'000100', nameVi:'Lôi Địa Dự',           nameZh:'豫' },
  { id: 17, binary:'100110', nameVi:'Trạch Lôi Tùy',        nameZh:'隨' },
  { id: 18, binary:'011001', nameVi:'Sơn Phong Cổ',         nameZh:'蠱' },
  { id: 19, binary:'110000', nameVi:'Địa Trạch Lâm',        nameZh:'臨' },
  { id: 20, binary:'000011', nameVi:'Phong Địa Quan',        nameZh:'觀' },
  { id: 21, binary:'100101', nameVi:'Hỏa Lôi Phệ Hạp',     nameZh:'噬嗑' },
  { id: 22, binary:'101001', nameVi:'Sơn Hỏa Bí',           nameZh:'賁' },
  { id: 23, binary:'000001', nameVi:'Sơn Địa Bác',          nameZh:'剝' },
  { id: 24, binary:'100000', nameVi:'Địa Lôi Phục',         nameZh:'復' },
  { id: 25, binary:'100111', nameVi:'Thiên Lôi Vô Vọng',    nameZh:'無妄' },
  { id: 26, binary:'111001', nameVi:'Sơn Thiên Đại Súc',    nameZh:'大畜' },
  { id: 27, binary:'100001', nameVi:'Sơn Lôi Di',           nameZh:'頤' },
  { id: 28, binary:'011110', nameVi:'Trạch Phong Đại Quá',  nameZh:'大過' },
  { id: 29, binary:'010010', nameVi:'Thuần Khảm',           nameZh:'坎' },
  { id: 30, binary:'101101', nameVi:'Thuần Ly',             nameZh:'離' },
  { id: 31, binary:'001110', nameVi:'Trạch Sơn Hàm',        nameZh:'咸' },
  { id: 32, binary:'011100', nameVi:'Lôi Phong Hằng',       nameZh:'恆' },
  { id: 33, binary:'001111', nameVi:'Thiên Sơn Độn',        nameZh:'遯' },
  { id: 34, binary:'111100', nameVi:'Lôi Thiên Đại Tráng',  nameZh:'大壯' },
  { id: 35, binary:'000101', nameVi:'Hỏa Địa Tấn',          nameZh:'晉' },
  { id: 36, binary:'101000', nameVi:'Địa Hỏa Minh Di',      nameZh:'明夷' },
  { id: 37, binary:'101011', nameVi:'Phong Hỏa Gia Nhân',   nameZh:'家人' },
  { id: 38, binary:'110101', nameVi:'Hỏa Trạch Khuê',       nameZh:'睽' },
  { id: 39, binary:'001010', nameVi:'Thủy Sơn Kiển',        nameZh:'蹇' },
  { id: 40, binary:'010100', nameVi:'Lôi Thủy Giải',        nameZh:'解' },
  { id: 41, binary:'110001', nameVi:'Sơn Trạch Tổn',        nameZh:'損' },
  { id: 42, binary:'100011', nameVi:'Phong Lôi Ích',         nameZh:'益' },
  { id: 43, binary:'111110', nameVi:'Trạch Thiên Quải',      nameZh:'夬' },
  { id: 44, binary:'011111', nameVi:'Thiên Phong Cấu',       nameZh:'姤' },
  { id: 45, binary:'000110', nameVi:'Trạch Địa Tụy',         nameZh:'萃' },
  { id: 46, binary:'011000', nameVi:'Địa Phong Thăng',       nameZh:'升' },
  { id: 47, binary:'010110', nameVi:'Trạch Thủy Khốn',       nameZh:'困' },
  { id: 48, binary:'011010', nameVi:'Thủy Phong Tỉnh',       nameZh:'井' },
  { id: 49, binary:'101110', nameVi:'Trạch Hỏa Cách',        nameZh:'革' },
  { id: 50, binary:'011101', nameVi:'Hỏa Phong Đỉnh',        nameZh:'鼎' },
  { id: 51, binary:'100100', nameVi:'Thuần Chấn',            nameZh:'震' },
  { id: 52, binary:'001001', nameVi:'Thuần Cấn',             nameZh:'艮' },
  { id: 53, binary:'001011', nameVi:'Phong Sơn Tiệm',        nameZh:'漸' },
  { id: 54, binary:'110100', nameVi:'Lôi Trạch Quy Muội',   nameZh:'歸妹' },
  { id: 55, binary:'101100', nameVi:'Lôi Hỏa Phong',        nameZh:'豐' },
  { id: 56, binary:'001101', nameVi:'Hỏa Sơn Lữ',           nameZh:'旅' },
  { id: 57, binary:'011011', nameVi:'Thuần Tốn',             nameZh:'巽' },
  { id: 58, binary:'110110', nameVi:'Thuần Đoài',            nameZh:'兌' },
  { id: 59, binary:'010011', nameVi:'Phong Thủy Hoán',       nameZh:'渙' },
  { id: 60, binary:'110010', nameVi:'Thủy Trạch Tiết',       nameZh:'節' },
  { id: 61, binary:'110011', nameVi:'Phong Trạch Trung Phu', nameZh:'中孚' },
  { id: 62, binary:'001100', nameVi:'Lôi Sơn Tiểu Quá',     nameZh:'小過' },
  { id: 63, binary:'101010', nameVi:'Thủy Hỏa Ký Tế',       nameZh:'既濟' },
  { id: 64, binary:'010101', nameVi:'Hỏa Thủy Vị Tế',       nameZh:'未濟' },
];

// Binary lookup (hào 1-6 từ dưới lên: 3 hào dưới = lower trigram, 3 hào trên = upper trigram)
const _hexLookup = {};
HEXAGRAMS.forEach(h => { _hexLookup[h.binary] = h; });

/**
 * Cast 6 lines using three-coin method.
 * Returns array of 6 values: 6=old-yin(moving), 7=young-yang, 8=young-yin, 9=old-yang(moving)
 */
function castAllLines() {
  return Array.from({ length: 6 }, () => {
    // Each coin: head=3 (yang), tail=2 (yin)
    const total = (Math.random() < 0.5 ? 3 : 2)
                + (Math.random() < 0.5 ? 3 : 2)
                + (Math.random() < 0.5 ? 3 : 2);
    return total; // 6,7,8,9
  });
}

/**
 * Convert line values to binary string (1=yang, 0=yin), lines[0]=bottom
 */
function linesToBinary(lines) {
  return lines.map(v => (v === 7 || v === 9) ? '1' : '0').join('');
}

/**
 * Build simplified hexagram result from raw line values
 */
function buildSimpleResult(lines) {
  const binary = linesToBinary(lines);
  const primary = _hexLookup[binary] || null;

  const hasMoving = lines.some(v => v === 6 || v === 9);
  let changed = null;
  if (hasMoving) {
    const changedBinary = lines.map(v => {
      if (v === 6) return '1'; // old yin → yang
      if (v === 9) return '0'; // old yang → yin
      return (v === 7 || v === 9) ? '1' : '0';
    }).join('');
    changed = _hexLookup[changedBinary] || null;
  }

  return {
    lines,
    primary: primary ? { ...primary, name: primary.nameVi, chineseName: primary.nameZh } : null,
    changed:  changed ? { ...changed,  name: changed.nameVi,  chineseName: changed.nameZh  } : null,
    hasMoving,
  };
}

// ─── Topic → Cung mapping ──────────────────────────────────────────────────
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
    .filter(p => relevantCungs.some(c => (p.chucNang || '').includes(c) || c.includes(p.chucNang || '')))
    .slice(0, 3)
    .map(p => ({
      name: p.chucNang || p.chiName,
      chi: p.chiName,
      stars: (p.stars || []).map(s => `${s.name}${s.trangThai ? ` (${s.trangThai})` : ''}`).join(', '),
      isMenh: p.isMenh,
      isThan: p.isThan,
      isTuan: p.isTuan,
      isTriet: p.isTriet,
    }));
}

/**
 * Build AI prompt kết hợp Tử Vi + Kinh Dịch
 */
export function buildCombinedPrompt({ topic, question, birthInfo, relevantPalaces, hexResult, language, chartResult }) {
  const isVi = language !== 'en';
  const topicLabel = TOPIC_LABELS[topic]?.[isVi ? 'vi' : 'en'] || topic;

  const palaceSection = relevantPalaces?.map(p =>
    `  - Cung ${p.name} (${p.chi}): ${p.stars || '(chưa có sao chiếu)'}`
    + (p.isMenh ? ' [Cung Mệnh]' : '')
    + (p.isThan ? ' [Cung Thân]' : '')
    + (p.isTuan ? ' [bị Tuần]' : '')
    + (p.isTriet ? ' [bị Triệt]' : '')
  ).join('\n') || '  (chưa có dữ liệu lá số)';

  const hexSection = hexResult?.primary
    ? `- Quẻ chủ: ${hexResult.primary.name} (${hexResult.primary.chineseName})\n`
      + (hexResult.changed ? `- Quẻ biến: ${hexResult.changed.name} (${hexResult.changed.chineseName}) — hướng chuyển hóa` : '- Không có hào động')
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

--- KẾT QUẢ KINH DỊCH (GIEO QUẺ 3 XU) ---
${hexSection}

--- YÊU CẦU LUẬN GIẢI ---
Kết hợp cả hai nguồn để đưa ra luận giải toàn diện:

**1. Tử Vi nói gì?** — Từ các cung liên quan và sao chiếu, cho biết xu hướng nền tảng của người hỏi.

**2. Kinh Dịch nói gì?** — Từ quẻ chủ và quẻ biến (nếu có), cho biết thời điểm hiện tại.

**3. Tổng hợp** — Khi kết hợp, hai hệ thống có đồng thuận không? Vận mệnh tổng thể ra sao?

**4. Lời khuyên cụ thể** — 3 hành động thực tế nên làm ngay.

Viết tiếng Việt, ân cần nhưng thẳng thắn, tránh sáo rỗng.`;
  }

  return `You are an Eastern wisdom expert synthesizing Zi Wei Dou Shu astrology and I Ching divination.

TOPIC: ${topicLabel}
QUESTION: "${question}"

--- ZI WEI DOU SHU ---
${birthInfo ? `Born: ${birthInfo.year}/${birthInfo.month}/${birthInfo.day}, gender: ${birthInfo.gender}` : 'No birth data.'}
Relevant palaces:
${palaceSection}

--- I CHING ---
${hexSection}

Provide: (1) What Zi Wei reveals, (2) What I Ching shows, (3) Synthesized verdict, (4) 3 practical actions.
Write in English, warm but direct.`;
}

// ─── Main hook ─────────────────────────────────────────────────────────────
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
    // Small delay for animation feel
    setTimeout(() => {
      const lines = castAllLines();
      const result = buildSimpleResult(lines);
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
      topic, question, birthInfo, relevantPalaces, hexResult, language, chartResult,
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
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            full += delta;
            setAiResponse(full);
          } catch { /* skip malformed SSE */ }
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
