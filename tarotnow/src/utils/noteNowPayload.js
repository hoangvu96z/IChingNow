/**
 * tarotnow/src/utils/noteNowPayload.js
 * Builds standardized NoteNow export payload for Tarot readings with reflection notes,
 * outcome verification status, action checklists, and signature 'purple' background color.
 */

export function buildTarotNoteNowPayload(input = {}) {
  if (!input || typeof input !== 'object') return null;

  const isEn = input.language === 'en';
  const drawnCards =
    Array.isArray(input.drawnCards) && input.drawnCards.length > 0
      ? input.drawnCards
      : Array.isArray(input.cards)
        ? input.cards
        : [];

  const activeQuestion = (input.question || input.currentDrawnQuestion || '').trim();
  const spreadId = input.activeSpread || input.spread || 'custom';
  const spreadDisplayName =
    input.resolvedSpreadDisplayName ||
    input.spreadName ||
    input.title ||
    (isEn ? 'Tarot Spread' : 'Trải bài Tarot');

  const reflectionNote =
    typeof input.reflectionNote === 'string'
      ? input.reflectionNote.trim()
      : typeof input.data?.reflectionNote === 'string'
        ? input.data.reflectionNote.trim()
        : '';

  const verificationStatus =
    typeof input.verificationStatus === 'string'
      ? input.verificationStatus.trim()
      : typeof input.data?.verificationStatus === 'string'
        ? input.data.verificationStatus.trim()
        : '';

  const summaryLines = Array.isArray(input.summaryLines)
    ? [...input.summaryLines]
    : [];

  if (summaryLines.length === 0 && drawnCards.length > 0) {
    summaryLines.push(
      `${isEn ? 'Spread' : 'Sơ đồ trải bài'}: ${spreadDisplayName}${input.interpretationContext ? ` · ${isEn ? 'Lens' : 'Góc nhìn'}: ${input.interpretationContext}` : ''}`
    );
    drawnCards.forEach((c, idx) => {
      const posLabel = input.spreadPositions?.[idx] || (isEn ? `Position ${idx + 1}` : `Vị trí ${idx + 1}`);
      const oriLabel = c.orientation === 'reversed' ? (isEn ? 'Reversed ↓' : 'Ngược ↓') : (isEn ? 'Upright ↑' : 'Xuôi ↑');
      summaryLines.push(`#${idx + 1} [${posLabel}] ${c.name || `Card ${c.id}`} (${oriLabel})`);
    });
  }

  // Outcome reflection / verification lines
  if (verificationStatus) {
    const statusLabels = {
      pending: isEn ? 'Pending reflection' : 'Đang chờ chiêm nghiệm',
      accurate: isEn ? 'Resonated / Accurate' : 'Ứng nghiệm sát thực tế',
      partial: isEn ? 'Partially unfolded' : 'Đúng một phần / Đang diễn tiến',
      diverged: isEn ? 'Turned out differently' : 'Diễn biến khác dự đoán',
    };
    summaryLines.push(
      `${isEn ? 'Outcome Verification Status' : 'Trạng thái Nghiệm lý'}: ${statusLabels[verificationStatus] || verificationStatus}`
    );
  }

  if (reflectionNote) {
    summaryLines.push(
      `${isEn ? 'Real-life Reflection' : 'Chiêm nghiệm thực tế'}: ${reflectionNote}`
    );
  }

  const checklistItems =
    Array.isArray(input.checklistItems) && input.checklistItems.length > 0
      ? [...input.checklistItems]
      : [
          isEn
            ? 'Write down 1 concrete action to test this reading within the next 48 hours.'
            : 'Ghi lại 1 hành động nhỏ cụ thể để kiểm chứng lời khuyên của trải bài trong 48 giờ tới.',
          isEn
            ? 'Revisit this note in 7 days to reflect on how the card energies unfolded in reality.'
            : 'Mở lại ghi chú này sau 7 ngày để nghiệm lý diễn biến thực tế so với thông điệp các lá bài.',
        ];

  const tags =
    Array.isArray(input.tags) && input.tags.length > 0
      ? [...input.tags]
      : ['tarotnow', String(spreadId), 'nghiem-ly'];

  return {
    title: `TarotNow — ${spreadDisplayName}${activeQuestion ? `: ${activeQuestion}` : ''}`.slice(0, 180),
    sourceAppLabel: 'TarotNow',
    question: activeQuestion,
    summaryLines,
    checklistItems,
    tags,
    bgColor: 'purple',
    reflectionNote,
    verificationStatus,
  };
}
