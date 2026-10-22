export function createManualReadingEntry({
  question,
  drawnCards,
  pickCount,
  language,
  createdAt = new Date(),
}) {
  const spreadName = language === 'en'
    ? `Manual Pick (${pickCount} cards)`
    : `Chọn từng lá (${pickCount} lá)`;
  const timestamp = createdAt.toISOString();
  const cards = drawnCards.map(({ id, name, orientation }) => ({
    id,
    name,
    orientation,
  }));

  return {
    id: String(createdAt.getTime()),
    timestamp,
    question: question.trim(),
    spread: 'custom',
    spreadId: 'custom',
    spreadName,
    title: spreadName,
    manualPick: true,
    cards,
    drawnCards,
  };
}
