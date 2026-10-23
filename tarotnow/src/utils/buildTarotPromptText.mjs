export function buildTarotPromptText({
  language,
  promptTemplate,
  question,
  drawnCards,
  spreadName,
  spreadPositions,
  interpretationContext,
  interpretationSummary,
  getCardMeaning,
  t,
}) {
  const isEn = language === 'en';
  const translate = typeof t === 'function' ? t : (_key, fallback) => fallback;
  const cardsSection = drawnCards.map((card, index) => {
    const orientationText = card.orientation === 'reversed'
      ? translate('modal.orientation_reversed', 'Lá ngược (Reversed)')
      : translate('modal.orientation_upright', 'Lá xuôi (Upright)');
    const keywords = card.orientation === 'reversed' ? card.reversedKeywords : card.uprightKeywords;
    const position = spreadPositions?.[index];
    const localMeaning = getCardMeaning ? getCardMeaning(card, interpretationContext, card.orientation) : '';

    return `${index + 1}. ${isEn ? 'Card' : 'Lá bài'}: ${card.name}\n` +
      `   - ${isEn ? 'Orientation' : 'Trạng thái'}: ${orientationText}\n` +
      `   - ${isEn ? 'Category' : 'Nhóm'}: ${card.arcana}${card.suit ? ` (${card.suit})` : ''}\n` +
      `   - ${isEn ? 'Keywords' : 'Từ khóa chính'}: ${keywords.join(', ')}\n` +
      `${position ? `   - ${isEn ? 'Position in spread' : 'Vị trí trong trải bài'}: ${position}\n` : ''}` +
      `${localMeaning ? `   - ${isEn ? 'Preliminary meaning' : 'Giải nghĩa cơ bản sơ bộ'}: ${localMeaning}\n` : ''}`;
  }).join('\n').trimEnd();

  let instruction;
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
        instruction = 'Hãy luận giải trải bài này theo khía cạnh Tình cảm & Các mối quan hệ. Phân tích chi tiết cảm xúc, suy nghĩ của các bên, rào cản hiện tại và lời khuyên hành động cụ thể để cải thiện mối quan hệ này.';
        break;
      case 'career':
        instruction = 'Hãy luận giải trải bài này theo khía cạnh Công việc, Sự nghiệp & Tài chính. Phân tích rõ các cơ hội tiềm năng, thách thức cần vượt qua, hướng đi tốt nhất và cách ứng phó thực tế ở thời điểm hiện tại.';
        break;
      case 'standard':
      default:
        instruction = 'Hãy luận giải trải bài này một cách toàn diện và sâu sắc. Phân tích ý nghĩa từng lá, mối liên kết năng lượng giữa chúng và tổng hợp thành thông điệp khuyên bảo cụ thể cho câu hỏi của tôi.';
        break;
    }
  }

  let roleText = isEn
    ? 'Act as an expert Tarot Reader and intuitive mentor. Provide a deep, insightful, and compassionate interpretation.'
    : 'Hãy đóng vai một Reader Tarot chuyên nghiệp và giàu kinh nghiệm. Hãy đưa ra luận giải sâu sắc, thấu đáo và đầy tính định hướng.';

  if (promptTemplate === 'love') {
    roleText = isEn
      ? 'Act as a relationship counselor and Tarot Reader specializing in love dynamics, emotional connections, and romantic growth.'
      : 'Hãy đóng vai một chuyên gia tư vấn tình cảm & Reader Tarot chuyên sâu về tình yêu, cảm xúc và các mối quan hệ.';
  } else if (promptTemplate === 'career') {
    roleText = isEn
      ? 'Act as a strategic career coach and Tarot Reader focusing on practical advice, work dynamics, financial outlook, and professional growth.'
      : 'Hãy đóng vai một chuyên gia định hướng sự nghiệp & Reader Tarot chuyên sâu về công việc, tài chính và phát triển bản thân.';
  }

  const promptContext = [
    `${translate('form.question_label', 'Câu hỏi')}: ${question}\n${isEn ? 'Spread' : 'Trải bài'}: ${spreadName}`,
    interpretationContext
      ? `${translate('result.perspective_prefix', 'Góc nhìn')}: ${interpretationContext}`
      : null,
    `${isEn ? 'Drawn Cards List' : 'Danh sách lá bài đã rút'}:\n${cardsSection}`,
    interpretationSummary
      ? `${isEn ? 'General Overview' : 'Nhận xét tổng quan'}:\n${interpretationSummary}`
      : null,
  ].filter(Boolean).join('\n\n');

  return `${roleText}\n\n${promptContext}\n\n${instruction}`;
}
