import {
  normalizeVerification,
  loadLocalVerifications,
} from './verification.js';

const APP = 'iching';

export function mapLoadedIChingReading(r, dataObj) {
  const localMap = loadLocalVerifications();
  const verification =
    dataObj?.verification ||
    localMap[String(r.id)] ||
    (dataObj?.createdAt ? localMap[dataObj.createdAt] : null) ||
    null;

  const normalized = verification ? normalizeVerification(verification) : null;
  if (normalized && dataObj && typeof dataObj === 'object') {
    dataObj.verification = normalized;
  }

  return {
    type: r.type,
    title: r.title,
    mode: dataObj?.mode || r.type,
    ...(normalized ? { verification: normalized } : {}),
  };
}

export function buildIChingSaveReading(newResult, type) {
  const plainQuestion = newResult.question || null;
  const dataToSave = { ...newResult, question: plainQuestion };

  const title =
    type === 'luc-hao'
      ? `${newResult.primaryHexagram?.nameVi}${newResult.changedHexagram ? ' ➔ ' + newResult.changedHexagram.nameVi : ''}`
      : `${newResult.primaryHexagram?.nameVi} (Chủ) ➔ ${newResult.changedHexagram?.nameVi} (Biến)`;

  const localItem = {
    id: Date.now().toString(),
    timestamp: newResult.createdAt || new Date().toISOString(),
    question: plainQuestion || '(Không có câu hỏi)',
    type,
    title,
    mode: newResult.mode || (type === 'mai-hoa' ? `mai-hoa-${newResult.subMode}` : 'quick'),
    ...(newResult.verification ? { verification: normalizeVerification(newResult.verification) } : {}),
    data: newResult,
  };

  return {
    payload: {
      app: APP,
      type,
      question: plainQuestion,
      title,
      data: dataToSave,
    },
    localItem,
    shouldSkipInsert: (prev) =>
      prev.some((item) => item.data?.createdAt && item.data.createdAt === newResult.createdAt),
  };
}
