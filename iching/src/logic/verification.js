/**
 * Chuẩn hóa & lưu trữ cục bộ dữ liệu Nghiệm Lý (Outcome Verification) cho các quẻ Kinh Dịch.
 */

export const VERIFICATION_STORAGE_KEY = 'iching_verifications_v1';

export const VERIFICATION_STATUSES = ['pending', 'accurate', 'partial', 'different'];

export const VERIFICATION_META = {
  pending: {
    labelVi: '⏳ Chờ ứng nghiệm',
    labelEn: '⏳ Pending outcome',
    shortVi: '⏳ Chờ ứng',
    color: 'var(--color-ink-muted)',
    bg: 'rgba(184, 134, 11, 0.09)',
    border: 'rgba(184, 134, 11, 0.28)',
  },
  accurate: {
    labelVi: '✅ Ứng nghiệm chuẩn',
    labelEn: '✅ Accurate',
    shortVi: '✅ Đúng',
    color: 'var(--color-jade, #1a6b4a)',
    bg: 'rgba(26, 107, 74, 0.12)',
    border: 'rgba(26, 107, 74, 0.35)',
  },
  partial: {
    labelVi: '🌗 Ứng một phần',
    labelEn: '🌗 Partially accurate',
    shortVi: '🌗 Một phần',
    color: 'var(--color-gold, #8a6104)',
    bg: 'rgba(184, 134, 11, 0.14)',
    border: 'rgba(184, 134, 11, 0.38)',
  },
  different: {
    labelVi: '🔄 Khác dự đoán',
    labelEn: '🔄 Different outcome',
    shortVi: '🔄 Khác',
    color: 'var(--color-vermillion, #c0392b)',
    bg: 'rgba(192, 57, 43, 0.11)',
    border: 'rgba(192, 57, 43, 0.35)',
  },
};

export function normalizeVerification(input = {}) {
  const rawStatus = String(input?.status || 'pending').trim();
  const status = VERIFICATION_STATUSES.includes(rawStatus) ? rawStatus : 'pending';
  const rawDate = String(input?.actualDate || '').trim();
  const actualDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
  const note = String(input?.note || '').trim().slice(0, 2000);
  return {
    status,
    actualDate,
    note,
    updatedAt: input?.updatedAt || new Date().toISOString(),
  };
}

export function loadLocalVerifications() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalVerification(key, verificationObj) {
  if (!key) return null;
  const normalized = normalizeVerification(verificationObj);
  try {
    if (typeof localStorage !== 'undefined') {
      const current = loadLocalVerifications();
      current[String(key)] = normalized;
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // Ignore storage quota errors
  }
  return normalized;
}

export function getVerificationForReading(readingId, resultData) {
  if (resultData?.verification) {
    return normalizeVerification(resultData.verification);
  }
  const map = loadLocalVerifications();
  if (readingId && map[String(readingId)]) {
    return normalizeVerification(map[String(readingId)]);
  }
  if (resultData?.createdAt && map[resultData.createdAt]) {
    return normalizeVerification(map[resultData.createdAt]);
  }
  return null;
}
