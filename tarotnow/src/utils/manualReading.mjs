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
  const now = createdAt instanceof Date ? createdAt : new Date(createdAt || Date.now());
  const createdAtIso = now.toISOString();
  const timestamp = createdAtIso;
  const cards = drawnCards.map(({ id, name, orientation }) => ({
    id,
    name,
    orientation,
  }));

  return {
    id: String(now.getTime()),
    createdAt: createdAtIso,
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
