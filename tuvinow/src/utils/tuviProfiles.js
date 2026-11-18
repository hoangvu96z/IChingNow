/**
 * tuviProfiles.js — Danh bạ Hồ sơ Đương số (Saved Profiles Directory)
 *
 * Quản lý hồ sơ độc lập với lịch sử luận giải (`tuvinow_saved_profiles_v1`):
 * - Lưu / cập nhật / xóa hồ sơ đương số (bản thân, vợ/chồng, con cái, cha mẹ, đối tác, khách...)
 * - Đảm bảo bất biến duy nhất 1 hồ sơ `isDefaultSelf: true` ("Lá số mặc định của tôi")
 * - Quản lý các mốc sự kiện thực tế `lifeEvents` để nghiệm lý & hiệu chuẩn AI
 * - Chuyển đổi trực tiếp sang `BirthInputForm`, `anLaSoTuVi` và cặp hồ sơ `HopHonPage`
 */

import { LunarMonth } from 'lunar-javascript';
import { DIA_CHI } from './tuViEngine.js';
import { getYearCanChi, solarToLunar, validateLunarDate, validateSolarDate } from './lunarConverter.js';

export const TUVI_PROFILES_STORAGE_KEY = 'tuvinow_saved_profiles_v1';
export const TUVI_HOP_HON_HANDOFF_KEY = 'tuvinow_hop_hon_profiles_handoff_v1';

export function resolveProfilesStorageKey(scopeKey = '') {
  if (scopeKey && typeof scopeKey === 'object') {
    const nested = scopeKey.scopeKey ?? scopeKey.userId ?? '';
    return resolveProfilesStorageKey(nested);
  }
  const clean = scopeKey !== undefined && scopeKey !== null ? String(scopeKey).trim() : '';
  return clean ? `${TUVI_PROFILES_STORAGE_KEY}:${clean}` : TUVI_PROFILES_STORAGE_KEY;
}

function resolveStorageAndScope(storageOrOptions = globalThis.localStorage, maybeScope = '') {
  if (typeof storageOrOptions === 'string' || typeof storageOrOptions === 'number') {
    return {
      storage: globalThis.localStorage,
      storageKey: resolveProfilesStorageKey(storageOrOptions),
    };
  }
  if (
    storageOrOptions &&
    typeof storageOrOptions === 'object' &&
    typeof storageOrOptions.getItem !== 'function'
  ) {
    const resolvedStorage =
      storageOrOptions.storage !== undefined ? storageOrOptions.storage : globalThis.localStorage;
    const scope = storageOrOptions.scopeKey ?? storageOrOptions.userId ?? maybeScope;
    return {
      storage: resolvedStorage,
      storageKey: resolveProfilesStorageKey(scope),
    };
  }
  return {
    storage: storageOrOptions,
    storageKey: resolveProfilesStorageKey(maybeScope),
  };
}

export function isValidLunarDateWithLeap(year, month, day, isLeapMonth = false) {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1 || day > 30) return false;

  if (isLeapMonth) {
    try {
      const leapMonthObj = LunarMonth.fromYm(year, -Math.abs(month));
      if (leapMonthObj && typeof leapMonthObj.getDayCount === 'function') {
        return day <= leapMonthObj.getDayCount();
      }
    } catch {
      // Fallback to standard lunar month check if year does not contain this leap month
    }
  }
  return validateLunarDate(year, month, day);
}

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

export function loadSavedProfiles(storage = globalThis.localStorage, scopeKey = '') {
  const { storage: resolvedStorage, storageKey } = resolveStorageAndScope(storage, scopeKey);
  if (!resolvedStorage) return [];
  try {
    const raw = resolvedStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return enforceSingleDefaultSelf(parsed.map(normalizeProfile));
  } catch {
    return [];
  }
}

function persistProfiles(profiles, storage = globalThis.localStorage, scopeKey = '') {
  const { storage: resolvedStorage, storageKey } = resolveStorageAndScope(storage, scopeKey);
  const clean = enforceSingleDefaultSelf((Array.isArray(profiles) ? profiles : []).map(normalizeProfile));
  if (resolvedStorage) {
    try {
      resolvedStorage.setItem(storageKey, JSON.stringify(clean));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }
  return clean;
}

export function replaceSavedProfiles(profiles = [], storage = globalThis.localStorage, scopeKey = '') {
  return persistProfiles(profiles, storage, scopeKey);
}

/**
 * Tạo mới hoặc cập nhật hồ sơ đương số, đảm bảo chỉ có tối đa 1 hồ sơ `isDefaultSelf: true`.
 */
export function saveProfile(profileInput, storage = globalThis.localStorage, scopeKey = '') {
  const existing = loadSavedProfiles(storage, scopeKey);
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

  const savedList = persistProfiles(nextList, storage, scopeKey);
  const savedProfile = savedList.find((p) => p.id === normalized.id) || normalized;
  return { profile: savedProfile, profiles: savedList };
}

export function deleteProfile(profileId, storage = globalThis.localStorage, scopeKey = '') {
  const existing = loadSavedProfiles(storage, scopeKey);
  const nextList = existing.filter((p) => p.id !== profileId);
  return persistProfiles(nextList, storage, scopeKey);
}

export function setDefaultSelfProfile(
  profileId,
  isDefault = true,
  storage = globalThis.localStorage,
  scopeKey = '',
) {
  const existing = loadSavedProfiles(storage, scopeKey);
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
  return persistProfiles(nextList, storage, scopeKey);
}

export function getDefaultSelfProfile(storage = globalThis.localStorage, scopeKey = '') {
  const profiles = loadSavedProfiles(storage, scopeKey);
  return profiles.find((p) => p.isDefaultSelf) || null;
}

/**
 * Thêm hoặc sửa mốc sự kiện thực tế (`lifeEvents`) trong hồ sơ
 */
export function upsertProfileLifeEvent(
  profileId,
  eventInput,
  storage = globalThis.localStorage,
  scopeKey = '',
) {
  const existing = loadSavedProfiles(storage, scopeKey);
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
    scopeKey,
  );
}

export function deleteProfileLifeEvent(
  profileId,
  eventId,
  storage = globalThis.localStorage,
  scopeKey = '',
) {
  const existing = loadSavedProfiles(storage, scopeKey);
  const target = existing.find((p) => p.id === profileId);
  if (!target) return { profile: null, profiles: existing };

  return saveProfile(
    {
      ...target,
      lifeEvents: target.lifeEvents.filter((ev) => ev.id !== eventId),
    },
    storage,
    scopeKey,
  );
}

/**
 * Trích xuất thông tin hồ sơ từ `inputData` hiện hành của lá số
 */
export function extractProfileDraftFromInputData(inputData = {}, extra = {}) {
  const hasSolarCoords = Boolean(
    (inputData.solarInput &&
      inputData.solarInput.year &&
      inputData.solarInput.month &&
      inputData.solarInput.day) ||
      (inputData.year && inputData.month && inputData.day),
  );
  const hasLunarCoords = Boolean(
    inputData.lunarYear && inputData.lunarMonth && inputData.lunarDay,
  );
  const explicitLunar = inputData.calendarType
    ? inputData.calendarType === 'lunar'
    : Boolean(inputData.isLunar);
  const isLunar = explicitLunar || (!hasSolarCoords && hasLunarCoords);
  const day = isLunar
    ? Number(inputData.lunarDay ?? inputData.day ?? 15)
    : Number(inputData.solarInput?.day ?? inputData.day ?? 15);
  const month = isLunar
    ? Number(inputData.lunarMonth ?? inputData.month ?? 1)
    : Number(inputData.solarInput?.month ?? inputData.month ?? 1);
  const year = isLunar
    ? Number(inputData.lunarYear ?? inputData.year ?? 1990)
    : Number(inputData.solarInput?.year ?? inputData.year ?? 1990);

  return normalizeProfile({
    name: inputData.name || 'Đương số',
    gender: inputData.gender === 0 ? 0 : 1,
    calendarType: isLunar ? 'lunar' : 'solar',
    day,
    month,
    year,
    isLeapMonth: isLunar ? Boolean(inputData.isLeap || inputData.isLeapMonth) : false,
    hourValue: Number(inputData.lunarHourIndex ?? inputData.hourIndex ?? 0),
    ...extra,
  });
}

function doesProfileMatchDraft(profile, draft) {
  if (!profile || !draft) return false;
  return (
    profile.name.toLowerCase() === draft.name.toLowerCase() &&
    (profile.calendarType || 'solar') === (draft.calendarType || 'solar') &&
    Boolean(profile.isLeapMonth) === Boolean(draft.isLeapMonth) &&
    profile.day === draft.day &&
    profile.month === draft.month &&
    profile.year === draft.year &&
    profile.hourValue === draft.hourValue &&
    profile.gender === draft.gender
  );
}

export function findMatchingProfileForInput(
  inputData,
  storage = globalThis.localStorage,
  scopeKey = '',
) {
  if (!inputData) return null;
  const profiles = loadSavedProfiles(storage, scopeKey);
  if (!profiles.length) return null;

  const draft = extractProfileDraftFromInputData(inputData);

  if (inputData.profileId) {
    const byId = profiles.find((p) => p.id === inputData.profileId);
    if (
      byId &&
      (byId.calendarType || 'solar') === (draft.calendarType || 'solar') &&
      Boolean(byId.isLeapMonth) === Boolean(draft.isLeapMonth)
    ) {
      return byId;
    }
  }

  return profiles.find((p) => doesProfileMatchDraft(p, draft)) || null;
}

/**
 * Hợp nhất các mốc `lifeEvents` từ danh sách `readings` lưu trên máy chủ (`tuvi-laso`)
 * vào danh bạ hồ sơ đương số trên thiết bị (không tạo trùng lặp và không ghi đè mốc mới hơn ở local).
 */
export function reconcileProfilesFromReadings(existingProfiles = [], serverReadings = []) {
  const nextList = (Array.isArray(existingProfiles) ? existingProfiles : []).map(normalizeProfile);
  if (!Array.isArray(serverReadings) || serverReadings.length === 0) {
    return enforceSingleDefaultSelf(nextList);
  }

  const sortedReadings = [...serverReadings].sort((a, b) => {
    const tsA = Date.parse(a?.updatedAt || a?.createdAt || '') || 0;
    const tsB = Date.parse(b?.updatedAt || b?.createdAt || '') || 0;
    return tsB - tsA;
  });

  for (const reading of sortedReadings) {
    if (!reading || reading._decryptionError) continue;
    if (reading.type && reading.type !== 'tuvi-laso') continue;

    const rInput = reading?.data?.inputData ?? reading?.inputData;
    if (!rInput || typeof rInput !== 'object') continue;

    const rawEvents = Array.isArray(rInput.lifeEvents) ? rInput.lifeEvents : [];
    if (rawEvents.length === 0) continue;

    const incomingEvents = rawEvents.map(normalizeLifeEvent);
    const draft = extractProfileDraftFromInputData(
      rInput,
      rInput.profileId ? { id: String(rInput.profileId) } : {},
    );

    let matchIdx = -1;
    if (rInput.profileId) {
      matchIdx = nextList.findIndex(
        (p) =>
          p.id === String(rInput.profileId) &&
          (p.calendarType || 'solar') === (draft.calendarType || 'solar') &&
          Boolean(p.isLeapMonth) === Boolean(draft.isLeapMonth),
      );
    }
    if (matchIdx === -1) {
      matchIdx = nextList.findIndex((p) => doesProfileMatchDraft(p, draft));
    }

    if (matchIdx >= 0) {
      const target = nextList[matchIdx];
      const mergedEvents = [...target.lifeEvents];
      let changed = false;

      for (const ev of incomingEvents) {
        const isDuplicate = mergedEvents.some(
          (loc) =>
            loc.id === ev.id ||
            (loc.year === ev.year &&
              loc.eventType === ev.eventType &&
              (loc.note || '').trim().toLowerCase() === (ev.note || '').trim().toLowerCase()),
        );
        if (!isDuplicate) {
          mergedEvents.push(ev);
          changed = true;
        }
      }

      if (changed) {
        mergedEvents.sort((a, b) => a.year - b.year);
        nextList[matchIdx] = {
          ...target,
          lifeEvents: mergedEvents,
        };
      }
    } else {
      const hydrated = normalizeProfile({
        ...draft,
        ...(rInput.profileId ? { id: String(rInput.profileId) } : {}),
        lifeEvents: incomingEvents,
      });
      nextList.push(hydrated);
    }
  }

  return enforceSingleDefaultSelf(nextList);
}

/**
 * Chuyển đổi hồ sơ thành state điền vào `BirthInputForm`
 */
export function profileToBirthFormState(profile) {
  const norm = normalizeProfile(profile);
  const isLunar = norm.calendarType === 'lunar';
  const isLeap = isLunar ? Boolean(norm.isLeapMonth) : false;
  return {
    id: norm.id,
    profileId: norm.id,
    name: norm.name,
    day: norm.day,
    month: norm.month,
    year: norm.year,
    hourIndex: norm.hourValue,
    gender: norm.gender,
    calendarType: norm.calendarType,
    isLunar,
    isLeap,
    isLeapMonth: isLeap,
    lifeEvents: norm.lifeEvents,
  };
}

/**
 * Chuyển đổi hồ sơ trực tiếp thành payload cho `anLaSoTuVi`
 */
export function profileToBirthInputPayload(profile, viewYear = undefined) {
  const norm = normalizeProfile(profile);
  const isLunar = norm.calendarType === 'lunar';
  const isLeap = isLunar ? Boolean(norm.isLeapMonth) : false;

  let lunarData;
  if (isLunar) {
    if (!isValidLunarDateWithLeap(norm.year, norm.month, norm.day, isLeap)) {
      throw new Error('Ngày âm lịch trong hồ sơ không hợp lệ.');
    }
    const yearCanIndex = ((norm.year - 4) % 10 + 10) % 10;
    const yearChiIndex = ((norm.year - 4) % 12 + 12) % 12;
    const [yearCanName, yearChiName] = getYearCanChi(norm.year).split(' ');
    lunarData = {
      lunarYear: norm.year,
      lunarMonth: norm.month,
      lunarDay: norm.day,
      yearCanIndex,
      yearChiIndex,
      yearCanName,
      yearChiName,
      isLeap,
      isLeapMonth: isLeap,
      solarDateStr: '(Nhập âm lịch)',
      lunarDateStr: isLeap
        ? `${norm.month}/${norm.day}/${norm.year} (Âm lịch - Nhuận)`
        : `${norm.month}/${norm.day}/${norm.year} (Âm lịch)`,
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
    calendarType: norm.calendarType,
    isLunar,
    isLeapMonth: isLunar ? isLeap : false,
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
