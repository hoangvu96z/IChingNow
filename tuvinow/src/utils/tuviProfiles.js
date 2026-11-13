/**
 * tuviProfiles.js — Danh bạ Hồ sơ Đương số (Saved Profiles Directory)
 *
 * Quản lý hồ sơ độc lập với lịch sử luận giải (`tuvinow_saved_profiles_v1`):
 * - Lưu / cập nhật / xóa hồ sơ đương số (bản thân, vợ/chồng, con cái, cha mẹ, đối tác, khách...)
 * - Đảm bảo bất biến duy nhất 1 hồ sơ `isDefaultSelf: true` ("Lá số mặc định của tôi")
 * - Quản lý các mốc sự kiện thực tế `lifeEvents` để nghiệm lý & hiệu chuẩn AI
 * - Chuyển đổi trực tiếp sang `BirthInputForm`, `anLaSoTuVi` và cặp hồ sơ `HopHonPage`
 */

import { DIA_CHI } from './tuViEngine.js';
import { solarToLunar, validateLunarDate, validateSolarDate } from './lunarConverter.js';

export const TUVI_PROFILES_STORAGE_KEY = 'tuvinow_saved_profiles_v1';
export const TUVI_HOP_HON_HANDOFF_KEY = 'tuvinow_hop_hon_profiles_handoff_v1';

export const PROFILE_RELATIONS = [
  { id: 'self', label: 'Bản thân', icon: '⭐' },
  { id: 'spouse', label: 'Vợ / Chồng', icon: '💍' },
  { id: 'partner', label: 'Người yêu / Đối tác', icon: '💞' },
  { id: 'child', label: 'Con cái', icon: '🌱' },
  { id: 'parent', label: 'Cha / Mẹ', icon: '🏡' },
  { id: 'other', label: 'Khác / Khách', icon: '👤' },
];

export const VALID_RELATIONS = new Set(PROFILE_RELATIONS.map((r) => r.id));

const REPRESENTATIVE_HOURS_BY_BRANCH = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

function makeId(prefix = 'prof') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeLifeEvent(raw = {}) {
  const year = Math.trunc(Number(raw.year) || new Date().getFullYear());
  const eventType = String(raw.eventType || 'career_up').trim();
  const label = String(raw.label || '').trim();
  const note = String(raw.note || '').trim().slice(0, 280);
  return {
    id: String(raw.id || makeId('ev')),
    year: Math.max(1900, Math.min(2100, year)),
    eventType,
    label,
    note,
  };
}

export function normalizeProfile(raw = {}) {
  const hourValue = ((Math.trunc(Number(raw.hourValue ?? raw.hourIndex ?? raw.lunarHourIndex ?? 0)) % 12) + 12) % 12;
  const calendarType =
    raw.calendarType === 'lunar' || raw.isLunar === true ? 'lunar' : 'solar';

  const day = Math.max(1, Math.min(31, Math.trunc(Number(raw.day ?? 15) || 15)));
  const month = Math.max(1, Math.min(12, Math.trunc(Number(raw.month ?? 1) || 1)));
  const year = Math.max(1900, Math.min(2100, Math.trunc(Number(raw.year ?? 1990) || 1990)));
  const gender = raw.gender === 0 || raw.gender === '0' || raw.gender === 'Nữ' || raw.gender === 'nu' ? 0 : 1;
  const relation = VALID_RELATIONS.has(raw.relation) ? raw.relation : 'other';

  const lifeEvents = (Array.isArray(raw.lifeEvents) ? raw.lifeEvents : [])
    .map(normalizeLifeEvent)
    .sort((a, b) => a.year - b.year);

  return {
    id: String(raw.id || makeId('tvp')),
    name: String(raw.name || 'Đương số').trim().slice(0, 100) || 'Đương số',
    relation,
    gender,
    calendarType,
    day,
    month,
    year,
    isLeapMonth: calendarType === 'lunar' ? Boolean(raw.isLeapMonth ?? raw.isLeap) : false,
    hourBranch: DIA_CHI[hourValue],
    hourValue,
    isDefaultSelf: Boolean(raw.isDefaultSelf),
    lifeEvents,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function enforceSingleDefaultSelf(profiles) {
  let foundDefault = false;
  return profiles.map((p) => {
    if (p.isDefaultSelf && !foundDefault) {
      foundDefault = true;
      return p;
    }
    if (p.isDefaultSelf && foundDefault) {
      return { ...p, isDefaultSelf: false };
    }
    return p;
  });
}

export function loadSavedProfiles(storage = globalThis.localStorage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(TUVI_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return enforceSingleDefaultSelf(parsed.map(normalizeProfile));
  } catch {
    return [];
  }
}

function persistProfiles(profiles, storage = globalThis.localStorage) {
  const clean = enforceSingleDefaultSelf(profiles);
  if (storage) {
    try {
      storage.setItem(TUVI_PROFILES_STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }
  return clean;
}

/**
 * Tạo mới hoặc cập nhật hồ sơ đương số, đảm bảo chỉ có tối đa 1 hồ sơ `isDefaultSelf: true`.
 */
export function saveProfile(profileInput, storage = globalThis.localStorage) {
  const existing = loadSavedProfiles(storage);
  const incomingId = profileInput?.id ? String(profileInput.id) : null;
  const currentMatch = incomingId ? existing.find((p) => p.id === incomingId) : null;

  const mergedRaw = {
    ...currentMatch,
    ...profileInput,
    lifeEvents:
      profileInput?.lifeEvents !== undefined
        ? profileInput.lifeEvents
        : currentMatch?.lifeEvents || [],
    updatedAt: new Date().toISOString(),
  };
  const normalized = normalizeProfile(mergedRaw);

  let nextList;
  if (currentMatch) {
    nextList = existing.map((p) => {
      if (p.id === normalized.id) return normalized;
      if (normalized.isDefaultSelf) return { ...p, isDefaultSelf: false };
      return p;
    });
  } else {
    const cleared = normalized.isDefaultSelf
      ? existing.map((p) => ({ ...p, isDefaultSelf: false }))
      : existing;
    nextList = [normalized, ...cleared];
  }

  const savedList = persistProfiles(nextList, storage);
  const savedProfile = savedList.find((p) => p.id === normalized.id) || normalized;
  return { profile: savedProfile, profiles: savedList };
}

export function deleteProfile(profileId, storage = globalThis.localStorage) {
  const existing = loadSavedProfiles(storage);
  const nextList = existing.filter((p) => p.id !== profileId);
  return persistProfiles(nextList, storage);
}

export function setDefaultSelfProfile(profileId, isDefault = true, storage = globalThis.localStorage) {
  const existing = loadSavedProfiles(storage);
  const nextList = existing.map((p) => {
    if (p.id === profileId) {
      return {
        ...p,
        isDefaultSelf: Boolean(isDefault),
        relation: isDefault && p.relation === 'other' ? 'self' : p.relation,
        updatedAt: new Date().toISOString(),
      };
    }
    if (isDefault) {
      return { ...p, isDefaultSelf: false };
    }
    return p;
  });
  return persistProfiles(nextList, storage);
}

export function getDefaultSelfProfile(storage = globalThis.localStorage) {
  const profiles = loadSavedProfiles(storage);
  return profiles.find((p) => p.isDefaultSelf) || null;
}

/**
 * Thêm hoặc sửa mốc sự kiện thực tế (`lifeEvents`) trong hồ sơ
 */
export function upsertProfileLifeEvent(profileId, eventInput, storage = globalThis.localStorage) {
  const existing = loadSavedProfiles(storage);
  const target = existing.find((p) => p.id === profileId);
  if (!target) return { profile: null, profiles: existing };

  const normalizedEvent = normalizeLifeEvent(eventInput);
  const hasExisting = target.lifeEvents.some((ev) => ev.id === normalizedEvent.id);
  const nextEvents = hasExisting
    ? target.lifeEvents.map((ev) => (ev.id === normalizedEvent.id ? normalizedEvent : ev))
    : [...target.lifeEvents, normalizedEvent];

  return saveProfile(
    {
      ...target,
      lifeEvents: nextEvents,
    },
    storage,
  );
}

export function deleteProfileLifeEvent(profileId, eventId, storage = globalThis.localStorage) {
  const existing = loadSavedProfiles(storage);
  const target = existing.find((p) => p.id === profileId);
  if (!target) return { profile: null, profiles: existing };

  return saveProfile(
    {
      ...target,
      lifeEvents: target.lifeEvents.filter((ev) => ev.id !== eventId),
    },
    storage,
  );
}

/**
 * Trích xuất thông tin hồ sơ từ `inputData` hiện hành của lá số
 */
export function extractProfileDraftFromInputData(inputData = {}, extra = {}) {
  const isLunar = Boolean(inputData.isLunar);
  const day = isLunar
    ? Number(inputData.lunarDay || 15)
    : Number(inputData.solarInput?.day || inputData.day || 15);
  const month = isLunar
    ? Number(inputData.lunarMonth || 1)
    : Number(inputData.solarInput?.month || inputData.month || 1);
  const year = isLunar
    ? Number(inputData.lunarYear || 1990)
    : Number(inputData.solarInput?.year || inputData.year || 1990);

  return normalizeProfile({
    name: inputData.name || 'Đương số',
    gender: inputData.gender === 0 ? 0 : 1,
    calendarType: isLunar ? 'lunar' : 'solar',
    day,
    month,
    year,
    isLeapMonth: Boolean(inputData.isLeap || inputData.isLeapMonth),
    hourValue: Number(inputData.lunarHourIndex ?? inputData.hourIndex ?? 0),
    ...extra,
  });
}

export function findMatchingProfileForInput(inputData, storage = globalThis.localStorage) {
  if (!inputData) return null;
  const profiles = loadSavedProfiles(storage);
  if (!profiles.length) return null;

  if (inputData.profileId) {
    const byId = profiles.find((p) => p.id === inputData.profileId);
    if (byId) return byId;
  }

  const draft = extractProfileDraftFromInputData(inputData);
  return (
    profiles.find(
      (p) =>
        p.name.toLowerCase() === draft.name.toLowerCase() &&
        p.calendarType === draft.calendarType &&
        p.day === draft.day &&
        p.month === draft.month &&
        p.year === draft.year &&
        p.hourValue === draft.hourValue &&
        p.gender === draft.gender,
    ) || null
  );
}

/**
 * Chuyển đổi hồ sơ thành state điền vào `BirthInputForm`
 */
export function profileToBirthFormState(profile) {
  const norm = normalizeProfile(profile);
  return {
    id: norm.id,
    profileId: norm.id,
    name: norm.name,
    day: norm.day,
    month: norm.month,
    year: norm.year,
    hourIndex: norm.hourValue,
    gender: norm.gender,
    isLunar: norm.calendarType === 'lunar',
    isLeapMonth: norm.isLeapMonth,
    lifeEvents: norm.lifeEvents,
  };
}

/**
 * Chuyển đổi hồ sơ trực tiếp thành payload cho `anLaSoTuVi`
 */
export function profileToBirthInputPayload(profile, viewYear = undefined) {
  const norm = normalizeProfile(profile);
  const isLunar = norm.calendarType === 'lunar';

  let lunarData;
  if (isLunar) {
    if (!validateLunarDate(norm.year, norm.month, norm.day)) {
      throw new Error('Ngày âm lịch trong hồ sơ không hợp lệ.');
    }
    const yearCanIndex = ((norm.year - 4) % 10 + 10) % 10;
    const yearChiIndex = ((norm.year - 4) % 12 + 12) % 12;
    lunarData = {
      lunarYear: norm.year,
      lunarMonth: norm.month,
      lunarDay: norm.day,
      yearCanIndex,
      yearChiIndex,
      isLeap: Boolean(norm.isLeapMonth),
      solarDateStr: '(Nhập âm lịch)',
      lunarDateStr: `${norm.month}/${norm.day}/${norm.year} (Âm lịch)`,
    };
  } else {
    if (!validateSolarDate(norm.year, norm.month, norm.day)) {
      throw new Error('Ngày dương lịch trong hồ sơ không hợp lệ.');
    }
    lunarData = solarToLunar(norm.year, norm.month, norm.day);
  }

  const vYear =
    viewYear !== undefined && viewYear !== null && viewYear !== ''
      ? Number(viewYear)
      : undefined;

  return {
    profileId: norm.id,
    name: norm.name,
    ...lunarData,
    lunarHourIndex: norm.hourValue,
    gender: norm.gender,
    isLunar,
    solarInput: isLunar ? null : { day: norm.day, month: norm.month, year: norm.year },
    lifeEvents: norm.lifeEvents,
    ...(vYear && Number.isInteger(vYear) && vYear >= lunarData.lunarYear
      ? {
          viewYear: vYear,
          viewYearCanIndex: ((vYear - 4) % 10 + 10) % 10,
          viewYearChiIndex: ((vYear - 4) % 12 + 12) % 12,
        }
      : {}),
  };
}

/**
 * Chuyển đổi hồ sơ đương số sang định dạng `PersonForm` của `HopHonPage.jsx`
 */
export function profileToHopHonPerson(profile) {
  const norm = normalizeProfile(profile);
  const repHour = REPRESENTATIVE_HOURS_BY_BRANCH[norm.hourValue] ?? 0;
  return {
    hoTen: norm.name,
    ngay: norm.day,
    thang: norm.month,
    nam: norm.year,
    gio: repHour,
    gioiTinh: norm.gender === 0 ? 'Nữ' : 'Nam',
    isLunar: norm.calendarType === 'lunar',
    isLeap: norm.calendarType === 'lunar' ? Boolean(norm.isLeapMonth) : false,
  };
}

export function buildHopHonPairFromProfiles(profileA, profileB) {
  if (!profileA || !profileB) return null;
  return {
    chong: profileToHopHonPerson(profileA),
    vo: profileToHopHonPerson(profileB),
  };
}

export function stageHopHonProfilesHandoff(profileA, profileB, storage = globalThis.localStorage) {
  const pair = buildHopHonPairFromProfiles(profileA, profileB);
  if (!pair || !storage) return null;
  const payload = {
    ...pair,
    stagedAt: new Date().toISOString(),
  };
  try {
    storage.setItem(TUVI_HOP_HON_HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
  return payload;
}

export function consumeHopHonProfilesHandoff(storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(TUVI_HOP_HON_HANDOFF_KEY);
    if (!raw) return null;
    storage.removeItem(TUVI_HOP_HON_HANDOFF_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed?.chong || !parsed?.vo) return null;
    return {
      chong: parsed.chong,
      vo: parsed.vo,
    };
  } catch {
    return null;
  }
}
