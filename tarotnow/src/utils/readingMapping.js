/**
 * tarotnow/src/utils/readingMapping.js
 * Pure data mappers and local reflection / guest storage helpers for Tarot readings.
 */

export const TAROT_LOCAL_REFLECTIONS_KEY = 'tarotnow_local_reflections_v1';
export const TAROT_GUEST_READINGS_KEY = 'tarotnow_guest_readings_v1';

export const REFLECTION_STATUSES = [
  {
    id: 'pending',
    labelVi: '⏳ Đang chờ chiêm nghiệm',
    labelEn: '⏳ Pending reflection',
    color: '#8e8aa0',
    bg: 'rgba(142, 138, 160, 0.12)',
    border: 'rgba(142, 138, 160, 0.3)',
  },
  {
    id: 'accurate',
    labelVi: '✨ Ứng nghiệm sát thực tế',
    labelEn: '✨ Resonated / Accurate',
    color: '#e5c158',
    bg: 'rgba(229, 193, 88, 0.15)',
    border: 'rgba(229, 193, 88, 0.4)',
  },
  {
    id: 'partial',
    labelVi: '🌗 Đúng một phần / Đang diễn tiến',
    labelEn: '🌗 Partially unfolded',
    color: '#5bc0be',
    bg: 'rgba(91, 192, 190, 0.15)',
    border: 'rgba(91, 192, 190, 0.4)',
  },
  {
    id: 'diverged',
    labelVi: '🔄 Diễn biến khác dự đoán',
    labelEn: '🔄 Turned out differently',
    color: '#eb5e55',
    bg: 'rgba(235, 94, 85, 0.15)',
    border: 'rgba(235, 94, 85, 0.4)',
  },
];

export function loadLocalTarotReflections(storage = globalThis.localStorage) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(TAROT_LOCAL_REFLECTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalTarotReflection(key, reflectionData, storage = globalThis.localStorage) {
  if (!storage || !key) return;
  try {
    const map = loadLocalTarotReflections(storage);
    map[String(key)] = reflectionData;
    storage.setItem(TAROT_LOCAL_REFLECTIONS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function loadGuestTarotReadings(storage = globalThis.localStorage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(TAROT_GUEST_READINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestTarotReadings(readings, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.setItem(TAROT_GUEST_READINGS_KEY, JSON.stringify(readings.slice(0, 100)));
  } catch {
    // ignore
  }
}

export function mapLoadedTarotReading(r, dataObj = {}) {
  const localReflections = loadLocalTarotReflections();
  const localRef =
    localReflections[String(r.id)] ||
    (dataObj?.createdAt ? localReflections[dataObj.createdAt] : null) ||
    null;

  const reflectionNote =
    typeof dataObj?.reflectionNote === 'string'
      ? dataObj.reflectionNote
      : typeof localRef?.reflectionNote === 'string'
        ? localRef.reflectionNote
        : '';

  const verificationStatus =
    typeof dataObj?.verificationStatus === 'string'
      ? dataObj.verificationStatus
      : typeof localRef?.verificationStatus === 'string'
        ? localRef.verificationStatus
        : '';

  const reflectionUpdatedAt = dataObj?.reflectionUpdatedAt || localRef?.reflectionUpdatedAt || null;

  return {
    spread: r.type,
    title: r.title,
    cards: dataObj?.cards || [],
    ...(r.createdAt || dataObj?.createdAt ? { createdAt: r.createdAt || dataObj.createdAt } : {}),
    ...(dataObj?.manualPick !== undefined ? { manualPick: Boolean(dataObj.manualPick) } : {}),
    ...(dataObj?.physicalDeck !== undefined ? { physicalDeck: Boolean(dataObj.physicalDeck) } : {}),
    ...(reflectionNote ? { reflectionNote } : {}),
    ...(verificationStatus ? { verificationStatus } : {}),
    ...(reflectionUpdatedAt ? { reflectionUpdatedAt } : {}),
    ...(dataObj?.spreadId ? { spreadId: dataObj.spreadId } : {}),
    ...(dataObj?.spreadName ? { spreadName: dataObj.spreadName } : {}),
    ...(Array.isArray(dataObj?.customPositions) ? { customPositions: dataObj.customPositions } : {}),
    ...(dataObj?.interpretationContext ? { interpretationContext: dataObj.interpretationContext } : {}),
    ...(dataObj?.physicalLogged ? { physicalLogged: true } : {}),
  };
}

export function buildTarotSaveReading(newEntry, app = 'tarot') {
  const plainQuestion = newEntry.question || null;
  const dataToSave = { ...newEntry, question: plainQuestion };

  return {
    payload: {
      app,
      type: newEntry.spread || 'custom',
      question: plainQuestion,
      title: newEntry.title || `Trải bài ${newEntry.spread || ''}`,
      data: dataToSave,
    },
    localItem: newEntry,
  };
}
