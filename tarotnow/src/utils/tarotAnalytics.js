import { resolveCardElement, ELEMENT_METADATA } from './tarotLogic.js';

const TOPIC_LABELS = {
  love: { vi: 'Tình cảm & Mối quan hệ', en: 'Love & Relationships', icon: '❤️' },
  career: { vi: 'Công việc & Sự nghiệp', en: 'Career & Work', icon: '💼' },
  money: { vi: 'Tài chính & Nguồn lực', en: 'Finance & Money', icon: '💰' },
  family: { vi: 'Gia đình & Kết nối', en: 'Family & Home', icon: '🏡' },
  decision: { vi: 'Lựa chọn & Quyết định', en: 'Choices & Decisions', icon: '⚖️' },
  feelings: { vi: 'Nội tâm & Cảm xúc', en: 'Inner Feelings', icon: '🌙' },
  general: { vi: 'Tổng quan & Định hướng', en: 'General Guidance', icon: '✨' },
};

export function formatReadingTimestamp(rawTimestamp, language = 'vi') {
  if (!rawTimestamp && rawTimestamp !== 0) return '';

  if (typeof rawTimestamp === 'string') {
    const trimmed = rawTimestamp.trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) {
        if (language === 'vi') {
          const pad = (n) => String(n).padStart(2, '0');
          const hours = pad(d.getHours());
          const mins = pad(d.getMinutes());
          const day = pad(d.getDate());
          const month = pad(d.getMonth() + 1);
          const year = d.getFullYear();
          return `${hours}:${mins} ${day}/${month}/${year}`;
        }
        return d.toLocaleString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      }
    }
    return trimmed;
  }

  if (typeof rawTimestamp === 'number' && Number.isFinite(rawTimestamp)) {
    const d = new Date(rawTimestamp);
    if (!Number.isNaN(d.getTime())) {
      if (language === 'vi') {
        const pad = (n) => String(n).padStart(2, '0');
        const hours = pad(d.getHours());
        const mins = pad(d.getMinutes());
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        return `${hours}:${mins} ${day}/${month}/${year}`;
      }
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  return String(rawTimestamp || '');
}

export function parseReadingTimestampMs(item) {
  if (!item || typeof item !== 'object') return null;

  // Check reading?.createdAt first; then other candidate fields
  const candidates = [
    item.createdAt,
    item.data?.createdAt,
    item.updatedAt,
    item.data?.updatedAt,
    item.timestamp,
    item.data?.timestamp,
  ];

  for (const raw of candidates) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 946684800000) {
      return raw;
    }
    if (typeof raw === 'string' && raw.trim()) {
      const trimmed = raw.trim();

      // ONLY pass unambiguous ISO-8601 strings to Date.parse
      if (/^\d{4}-\d{2}-\d{2}(?:T|\s\d{2}:)/.test(trimmed)) {
        const directMs = Date.parse(trimmed);
        if (!Number.isNaN(directMs)) return directMs;
      }

      // Explicit parser for DD/MM/YYYY localized strings: "HH:mm - DD/MM/YYYY" or "HH:mm DD/MM/YYYY"
      const viMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:-|,)?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (viMatch) {
        const hour = Number(viMatch[1]);
        const minute = Number(viMatch[2]);
        const second = viMatch[3] ? Number(viMatch[3]) : 0;
        const day = Number(viMatch[4]);
        const month = Number(viMatch[5]) - 1;
        const year = Number(viMatch[6]);
        const constructed = new Date(year, month, day, hour, minute, second).getTime();
        if (!Number.isNaN(constructed)) return constructed;
      }

      // DD/MM/YYYY date-first strings
      const dateFirstMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*[, -]?\s*(\d{1,2}):(\d{2}))?/);
      if (dateFirstMatch) {
        const day = Number(dateFirstMatch[1]);
        const month = Number(dateFirstMatch[2]) - 1;
        const year = Number(dateFirstMatch[3]);
        const hour = dateFirstMatch[4] ? Number(dateFirstMatch[4]) : 0;
        const minute = dateFirstMatch[5] ? Number(dateFirstMatch[5]) : 0;
        const constructed = new Date(year, month, day, hour, minute).getTime();
        if (!Number.isNaN(constructed)) return constructed;
      }

      // Fallback for en-US formatted date strings (e.g. "11/14/2026, 2:30 PM")
      const fallbackMs = Date.parse(trimmed);
      if (!Number.isNaN(fallbackMs)) return fallbackMs;
    }
  }

  // Fallback: numeric epoch id (e.g. Date.now().toString())
  if (typeof item.id === 'string' && /^\d{12,14}$/.test(item.id.trim())) {
    const idMs = Number(item.id.trim());
    if (Number.isFinite(idMs)) return idMs;
  }

  return null;
}

function detectReadingTopic(item) {
  const explicitCtx = String(
    item?.interpretationContext ||
      item?.context ||
      item?.data?.interpretationContext ||
      item?.data?.context ||
      ''
  )
    .trim()
    .toLowerCase();

  if (explicitCtx === 'love') return 'love';
  if (explicitCtx === 'career') return 'career';
  if (explicitCtx === 'money') return 'money';
  if (explicitCtx === 'family') return 'family';
  if (explicitCtx === 'feelings') return 'feelings';
  if (explicitCtx === 'action') return 'decision';

  const spreadStr = String(item?.spreadId || item?.spread || item?.data?.spreadId || '').toLowerCase();
  if (spreadStr.includes('relationship')) return 'love';
  if (spreadStr.includes('career')) return 'career';
  if (spreadStr.includes('decision') || spreadStr === 'opt' || spreadStr === 'soa') return 'decision';

  const q = String(item?.question || item?.data?.question || '').toLowerCase();
  if (/(tình yêu|người yêu|crush|hôn nhân|chia tay|quay lại|mối quan hệ|love|partner|ex\b)/i.test(q)) {
    return 'love';
  }
  if (/(tiền|tài chính|đầu tư|lương|nợ|kinh doanh|money|finance|salary|budget)/i.test(q)) {
    return 'money';
  }
  if (/(công việc|sự nghiệp|nhảy việc|chuyển việc|dự án|sếp|phỏng vấn|career|job|work)/i.test(q)) {
    return 'career';
  }
  if (/(gia đình|bố mẹ|cha mẹ|con cái|nhà cửa|family|parents)/i.test(q)) {
    return 'family';
  }
  if (/(nên chọn|lựa chọn|phương án|hay là|có nên|should i|option)/i.test(q)) {
    return 'decision';
  }

  return 'general';
}

function isMajorCardEntry(card) {
  if (!card) return false;
  if (card.arcana === 'Major') return true;
  if (typeof card.id === 'string' && card.id.toLowerCase().startsWith('major-')) return true;
  if (!card.suit && typeof card.name === 'string' && !/\bof\s+(wands|cups|swords|pentacles)\b/i.test(card.name)) {
    return Boolean(resolveCardElement(card));
  }
  return false;
}

function buildStalkerReflectionPrompt(entry, language = 'vi') {
  const isEn = language === 'en';
  const mostlyReversed = entry.reversedCount > entry.uprightCount;
  const balancedFlip = entry.uprightCount > 0 && entry.reversedCount > 0 && entry.uprightCount === entry.reversedCount;
  const elemMeta = entry.element ? ELEMENT_METADATA[entry.element] : null;

  if (entry.isMajor) {
    if (mostlyReversed) {
      return isEn
        ? `This Major Arcana archetype keeps returning mostly Reversed (${entry.reversedCount}/${entry.count}): ask yourself what core life lesson around "${entry.name}" you are resisting or delaying.`
        : `Nguyên mẫu Ẩn Chính "${entry.name}" lặp lại chủ yếu ở chiều Ngược (${entry.reversedCount}/${entry.count} lần): bạn đang trì hoãn hoặc né tránh bài học chuyển hóa lớn nào liên quan đến lá bài này?`;
    }
    if (balancedFlip) {
      return isEn
        ? `"${entry.name}" appears in both Upright and Reversed states: notice what triggers you to swing between clarity and blockage on this theme.`
        : `"${entry.name}" xuất hiện đan xen cả Xuôi lẫn Ngược: hãy quan sát tình huống nào giúp bạn phát huy trọn vẹn năng lượng này và lúc nào bạn tự kìm hãm mình.`;
    }
    return isEn
      ? `Recurring Major Arcana "${entry.name}" (${entry.count}x): this is an active guiding archetype for your current chapter—reflect on how to embody its message consciously.`
      : `Lá Ẩn Chính "${entry.name}" lặp lại ${entry.count} lần: đây là hình mẫu dẫn đường chủ đạo trong giai đoạn này—hãy suy ngẫm cách chủ động sống đúng tinh thần của lá bài.`;
  }

  const domain = elemMeta ? (isEn ? elemMeta.domainEn : elemMeta.domainVi) : (isEn ? 'daily habits' : 'thói quen hàng ngày');
  if (mostlyReversed) {
    return isEn
      ? `"${entry.name}" repeats frequently in Reversed orientation: examine recurring friction around ${domain} that asks for a small habit reset.`
      : `"${entry.name}" lặp lại nhiều ở trạng thái Ngược: hãy rà soát điểm nghẽn lặp đi lặp lại trong khía cạnh ${domain} đang cần bạn điều chỉnh thói quen nhỏ.`;
  }
  return isEn
    ? `"${entry.name}" keeps surfacing around ${domain}: notice where this pattern shows up in your weekly decisions and lean into its constructive strength.`
    : `"${entry.name}" liên tục xuất hiện xoay quanh ${domain}: hãy để ý mô thức này đang vận hành thế nào trong các quyết định hàng tuần của bạn.`;
}

/**
 * Pure analytics engine for Personal Tarot Insights Modal.
 */
export function computeTarotReadingInsights(
  history = [],
  { windowDays = null, deck = [], now = new Date(), language = 'vi' } = {}
) {
  const isEn = language === 'en';
  const safeHistory = Array.isArray(history)
    ? history.filter((item) => item && !item._decryptionError && !item.data?._decryptionError)
    : [];
  const deckById = new Map();
  const deckByName = new Map();

  if (Array.isArray(deck)) {
    deck.forEach((c) => {
      if (c?.id != null) deckById.set(String(c.id), c);
      if (c?.name) deckByName.set(String(c.name).toLowerCase(), c);
    });
  }

  const nowMs = now instanceof Date ? now.getTime() : Number(now) || Date.now();
  const numericWindow =
    windowDays === 'all' || windowDays === null || windowDays === undefined || Number(windowDays) <= 0
      ? null
      : Number(windowDays);

  const cutoffMs = numericWindow ? nowMs - numericWindow * 24 * 60 * 60 * 1000 : null;

  const filteredReadings = safeHistory.filter((item) => {
    const cardsList = Array.isArray(item.data?.drawnCards) && item.data.drawnCards.length > 0
      ? item.data.drawnCards
      : Array.isArray(item.drawnCards) && item.drawnCards.length > 0
        ? item.drawnCards
        : Array.isArray(item.cards)
          ? item.cards
          : [];
    if (cardsList.length === 0) return false;

    if (cutoffMs === null) return true;
    const ts = parseReadingTimestampMs(item);
    // If timestamp cannot be parsed on legacy entry, exclude from bounded window so window stays accurate
    if (ts === null) return false;
    return ts >= cutoffMs && ts <= nowMs + 86400000;
  });

  const totalReadings = filteredReadings.length;
  const emptyElements = {
    counts: { Fire: 0, Water: 0, Air: 0, Earth: 0 },
    percentages: { Fire: 0, Water: 0, Air: 0, Earth: 0 },
    dominantElement: null,
    leastElement: null,
  };

  // Compute outcome reflection stats & recent reflections
  let accurateCount = 0;
  let partialCount = 0;
  let divergedCount = 0;
  const reflectedItems = [];

  filteredReadings.forEach((reading) => {
    const rawNote = typeof reading.reflectionNote === 'string'
      ? reading.reflectionNote.trim()
      : typeof reading.data?.reflectionNote === 'string'
        ? reading.data.reflectionNote.trim()
        : '';
    const status = typeof reading.verificationStatus === 'string'
      ? reading.verificationStatus.trim()
      : typeof reading.data?.verificationStatus === 'string'
        ? reading.data.verificationStatus.trim()
        : '';

    if (status === 'accurate') accurateCount += 1;
    else if (status === 'partial') partialCount += 1;
    else if (status === 'diverged') divergedCount += 1;

    if (rawNote.length > 0 || (status && status !== 'pending')) {
      reflectedItems.push({
        id: reading.id,
        question: reading.question || reading.data?.question || '',
        timestamp: formatReadingTimestamp(reading.createdAt || reading.timestamp || reading.data?.createdAt, language),
        status: status || 'pending',
        noteSnippet: rawNote.length > 100 ? rawNote.slice(0, 100) + '...' : rawNote,
        _sortMs: parseReadingTimestampMs(reading) || 0,
      });
    }
  });

  const recentReflections = reflectedItems
    .sort((a, b) => b._sortMs - a._sortMs)
    .slice(0, 5)
    .map(({ _sortMs, ...item }) => item);

  const reflectionStats = {
    reflectedCount: reflectedItems.length,
    accurateCount,
    partialCount,
    divergedCount,
    recentReflections,
  };

  if (totalReadings < 2) {
    const singleCardCount = filteredReadings.reduce((acc, r) => {
      const list = r.data?.drawnCards || r.drawnCards || r.cards || [];
      return acc + (Array.isArray(list) ? list.length : 0);
    }, 0);

    return {
      hasEnoughData: false,
      windowDays: numericWindow,
      totalReadings,
      totalCardsDrawn: singleCardCount,
      stalkerCards: [],
      elementalDistribution: emptyElements,
      majorCount: 0,
      minorCount: 0,
      majorRatePercent: 0,
      minorRatePercent: 0,
      uprightCount: 0,
      reversedCount: 0,
      reversalRatePercent: 0,
      topicBreakdown: [],
      reflectionStats,
    };
  }

  const cardStatsMap = new Map();
  const elementCounts = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
  const topicCounts = new Map();
  let totalCardsDrawn = 0;
  let majorCount = 0;
  let minorCount = 0;
  let uprightCount = 0;
  let reversedCount = 0;

  filteredReadings.forEach((reading) => {
    const topicKey = detectReadingTopic(reading);
    topicCounts.set(topicKey, (topicCounts.get(topicKey) || 0) + 1);

    const rawCards =
      Array.isArray(reading.data?.drawnCards) && reading.data.drawnCards.length > 0
        ? reading.data.drawnCards
        : Array.isArray(reading.drawnCards) && reading.drawnCards.length > 0
          ? reading.drawnCards
          : Array.isArray(reading.cards)
            ? reading.cards
            : [];

    rawCards.forEach((rawCard) => {
      if (!rawCard) return;
      const fullCard =
        (rawCard.id != null && deckById.get(String(rawCard.id))) ||
        (rawCard.name && deckByName.get(String(rawCard.name).toLowerCase())) ||
        rawCard;

      const key = String(fullCard.id ?? fullCard.name ?? '').trim();
      if (!key) return;

      totalCardsDrawn += 1;
      const isRev = rawCard.orientation === 'reversed';
      if (isRev) reversedCount += 1;
      else uprightCount += 1;

      const isMajor = isMajorCardEntry(fullCard);
      if (isMajor) majorCount += 1;
      else minorCount += 1;

      const elem = resolveCardElement(fullCard);
      if (elem && elem in elementCounts) {
        elementCounts[elem] += 1;
      }

      if (!cardStatsMap.has(key)) {
        cardStatsMap.set(key, {
          id: fullCard.id ?? key,
          name: fullCard.name || rawCard.name || key,
          image: fullCard.image || rawCard.image || '',
          isMajor,
          element: elem,
          count: 0,
          uprightCount: 0,
          reversedCount: 0,
        });
      }

      const stat = cardStatsMap.get(key);
      stat.count += 1;
      if (isRev) stat.reversedCount += 1;
      else stat.uprightCount += 1;
    });
  });

  const elemTotal = Object.values(elementCounts).reduce((a, b) => a + b, 0);
  const elementPercentages = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
  if (elemTotal > 0) {
    for (const k of ['Fire', 'Water', 'Air', 'Earth']) {
      elementPercentages[k] = Math.round((elementCounts[k] / elemTotal) * 100);
    }
  }

  const sortedElements = ['Fire', 'Water', 'Air', 'Earth'].sort(
    (a, b) => elementCounts[b] - elementCounts[a]
  );
  const dominantElement = elemTotal > 0 ? sortedElements[0] : null;
  const leastElement = elemTotal > 0 ? sortedElements[sortedElements.length - 1] : null;

  const allCardStats = Array.from(cardStatsMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });

  const recurringOnly = allCardStats.filter((c) => c.count >= 2);
  const topCandidates = (recurringOnly.length > 0 ? recurringOnly : allCardStats).slice(0, 5);

  const stalkerCards = topCandidates.map((entry) => ({
    ...entry,
    isRecurring: entry.count >= 2,
    readingSharePercent: Math.round((entry.count / totalReadings) * 100),
    reflectionPrompt: buildStalkerReflectionPrompt(entry, language),
  }));

  const topicBreakdown = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const meta = TOPIC_LABELS[key] || TOPIC_LABELS.general;
      return {
        key,
        icon: meta.icon,
        label: isEn ? meta.en : meta.vi,
        count,
        percent: Math.round((count / totalReadings) * 100),
      };
    });

  return {
    hasEnoughData: true,
    windowDays: numericWindow,
    totalReadings,
    totalCardsDrawn,
    stalkerCards,
    elementalDistribution: {
      counts: elementCounts,
      percentages: elementPercentages,
      dominantElement,
      leastElement,
    },
    majorCount,
    minorCount,
    majorRatePercent: totalCardsDrawn > 0 ? Math.round((majorCount / totalCardsDrawn) * 100) : 0,
    minorRatePercent: totalCardsDrawn > 0 ? Math.round((minorCount / totalCardsDrawn) * 100) : 0,
    uprightCount,
    reversedCount,
    reversalRatePercent: totalCardsDrawn > 0 ? Math.round((reversedCount / totalCardsDrawn) * 100) : 0,
    topicBreakdown,
    reflectionStats,
  };
}

export const computeTarotInsights = computeTarotReadingInsights;

