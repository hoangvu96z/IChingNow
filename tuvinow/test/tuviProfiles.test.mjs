import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUVI_PROFILES_STORAGE_KEY,
  resolveProfilesStorageKey,
  loadSavedProfiles,
  saveProfile,
  deleteProfile,
  setDefaultSelfProfile,
  getDefaultSelfProfile,
  upsertProfileLifeEvent,
  deleteProfileLifeEvent,
  reconcileProfilesFromReadings,
  profileToBirthFormState,
  profileToBirthInputPayload,
  profileToHopHonPerson,
  buildHopHonPairFromProfiles,
  stageHopHonProfilesHandoff,
  consumeHopHonProfilesHandoff,
  findMatchingProfileForInput,
} from '../src/utils/tuviProfiles.js';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

test('tuviProfiles: CRUD and single isDefaultSelf invariant in localStorage', () => {
  const storage = createMemoryStorage();
  assert.deepEqual(loadSavedProfiles(storage), []);

  const first = saveProfile(
    {
      name: 'Phạm Minh Anh',
      relation: 'self',
      gender: 0,
      calendarType: 'solar',
      day: 14,
      month: 6,
      year: 1996,
      hourValue: 4, // Thìn
      isDefaultSelf: true,
    },
    storage,
  );
  assert.ok(first.profile.id);
  assert.equal(first.profile.hourBranch, 'Thìn');
  assert.equal(first.profile.isDefaultSelf, true);
  assert.equal(getDefaultSelfProfile(storage)?.id, first.profile.id);

  // Lưu hồ sơ thứ 2 và đặt làm mặc định -> hồ sơ thứ 1 tự động bỏ cờ isDefaultSelf
  const second = saveProfile(
    {
      name: 'Trần Quốc Bảo',
      relation: 'spouse',
      gender: 1,
      calendarType: 'lunar',
      day: 8,
      month: 10,
      year: 1993,
      isLeapMonth: false,
      hourValue: 6, // Ngọ
      isDefaultSelf: true,
    },
    storage,
  );
  assert.equal(second.profiles.length, 2);
  assert.equal(second.profiles.filter((p) => p.isDefaultSelf).length, 1);
  assert.equal(getDefaultSelfProfile(storage)?.id, second.profile.id);

  // Đổi ghim mặc định quay lại hồ sơ 1
  const afterPin = setDefaultSelfProfile(first.profile.id, true, storage);
  assert.equal(afterPin.filter((p) => p.isDefaultSelf).length, 1);
  assert.equal(getDefaultSelfProfile(storage)?.id, first.profile.id);

  // Kiểm tra dữ liệu JSON thực sự lưu trong TUVI_PROFILES_STORAGE_KEY
  const rawJson = JSON.parse(storage.getItem(TUVI_PROFILES_STORAGE_KEY));
  assert.equal(rawJson.length, 2);

  // Xóa hồ sơ thứ 2
  const afterDelete = deleteProfile(second.profile.id, storage);
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].id, first.profile.id);
});

test('tuviProfiles: lifeEvents upsert/delete persistence and chart payload conversion', () => {
  const storage = createMemoryStorage();
  const { profile } = saveProfile(
    {
      name: 'Lê Thanh Hà',
      relation: 'self',
      gender: 0,
      calendarType: 'solar',
      day: 22,
      month: 11,
      year: 1995,
      hourValue: 2, // Dần
    },
    storage,
  );

  const added = upsertProfileLifeEvent(
    profile.id,
    { id: 'ev-2021', year: 2021, eventType: 'marriage', note: 'Lập gia đình' },
    storage,
  );
  assert.equal(added.profile.lifeEvents.length, 1);
  assert.equal(added.profile.lifeEvents[0].year, 2021);

  const updated = upsertProfileLifeEvent(
    profile.id,
    { id: 'ev-2021', year: 2021, eventType: 'marriage', note: 'Lập gia đình tháng 11' },
    storage,
  );
  assert.equal(updated.profile.lifeEvents.length, 1);
  assert.equal(updated.profile.lifeEvents[0].note, 'Lập gia đình tháng 11');

  const formState = profileToBirthFormState(updated.profile);
  assert.equal(formState.profileId, profile.id);
  assert.equal(formState.hourIndex, 2);

  const enginePayload = profileToBirthInputPayload(updated.profile);
  assert.equal(findMatchingProfileForInput(enginePayload, storage)?.id, profile.id);
  const chart = anLaSoTuVi(enginePayload);
  assert.equal(chart.palates.length, 12);

  const afterRemoveEv = deleteProfileLifeEvent(profile.id, 'ev-2021', storage);
  assert.equal(afterRemoveEv.profile.lifeEvents.length, 0);
});

test('tuviProfiles: Hợp Hôn 2-profile conversion and sessionStorage handoff', () => {
  const sessionStore = createMemoryStorage();
  const maleProfile = {
    id: 'p-male',
    name: 'Hoàng Gia Huy',
    gender: 1,
    calendarType: 'solar',
    day: 10,
    month: 4,
    year: 1992,
    hourValue: 5, // Tỵ -> representativeHour 10
  };
  const femaleProfile = {
    id: 'p-female',
    name: 'Vũ Ngọc Mai',
    gender: 0,
    calendarType: 'lunar',
    day: 15,
    month: 8,
    year: 1995,
    isLeapMonth: false,
    hourValue: 9, // Dậu -> representativeHour 18
  };

  const mappedMale = profileToHopHonPerson(maleProfile);
  assert.equal(mappedMale.hoTen, 'Hoàng Gia Huy');
  assert.equal(mappedMale.gioiTinh, 'Nam');
  assert.equal(mappedMale.gio, 10);
  assert.equal(mappedMale.isLunar, false);

  const pair = buildHopHonPairFromProfiles(maleProfile, femaleProfile);
  assert.equal(pair.chong.hoTen, 'Hoàng Gia Huy');
  assert.equal(pair.vo.hoTen, 'Vũ Ngọc Mai');
  assert.equal(pair.vo.isLunar, true);
  assert.equal(pair.vo.gio, 18);

  stageHopHonProfilesHandoff(maleProfile, femaleProfile, sessionStore);
  const consumed = consumeHopHonProfilesHandoff(sessionStore);
  assert.equal(consumed.chong.hoTen, 'Hoàng Gia Huy');
  assert.equal(consumed.vo.hoTen, 'Vũ Ngọc Mai');

  // Sau khi consume 1 lần, kho trung chuyển phải tự dọn sạch
  assert.equal(consumeHopHonProfilesHandoff(sessionStore), null);
});

test('tuviProfiles: user-scoped localStorage keys isolate Guest and different SSO users', () => {
  const storage = createMemoryStorage();
  assert.equal(resolveProfilesStorageKey(), TUVI_PROFILES_STORAGE_KEY);
  assert.equal(resolveProfilesStorageKey('user_101'), `${TUVI_PROFILES_STORAGE_KEY}:user_101`);

  saveProfile(
    { name: 'Khách Vãng Lai', calendarType: 'solar', day: 1, month: 1, year: 1990, hourValue: 0 },
    storage,
  );
  saveProfile(
    { name: 'Tài Khoản A', calendarType: 'solar', day: 2, month: 2, year: 1991, hourValue: 1 },
    storage,
    'user_a',
  );
  saveProfile(
    { name: 'Tài Khoản B', calendarType: 'lunar', day: 15, month: 6, year: 2017, isLeapMonth: true, hourValue: 3 },
    { storage, userId: 'user_b' },
  );

  const guestList = loadSavedProfiles(storage);
  const userAList = loadSavedProfiles(storage, 'user_a');
  const userBList = loadSavedProfiles({ storage, userId: 'user_b' });

  assert.equal(guestList.length, 1);
  assert.equal(guestList[0].name, 'Khách Vãng Lai');
  assert.equal(userAList.length, 1);
  assert.equal(userAList[0].name, 'Tài Khoản A');
  assert.equal(userBList.length, 1);
  assert.equal(userBList[0].name, 'Tài Khoản B');
  assert.equal(userBList[0].isLeapMonth, true);
});

test('tuviProfiles: reconcileProfilesFromReadings merges server lifeEvents without clobbering newer local edits', () => {
  const existing = [
    {
      id: 'prof_local_1',
      name: 'Nguyễn Minh Khoa',
      gender: 1,
      calendarType: 'solar',
      day: 14,
      month: 8,
      year: 1992,
      hourValue: 4,
      isDefaultSelf: true,
      lifeEvents: [
        { id: 'ev_shared', year: 2020, eventType: 'career_up', label: 'Thăng tiến', note: 'Ghi chú local mới hơn' },
      ],
    },
  ];

  const serverReadings = [
    {
      id: 'rd_1',
      type: 'tuvi-laso',
      updatedAt: '2026-11-10T10:00:00Z',
      data: {
        inputData: {
          name: 'Nguyễn Minh Khoa',
          gender: 1,
          calendarType: 'solar',
          isLunar: false,
          solarInput: { day: 14, month: 8, year: 1992 },
          lunarHourIndex: 4,
          lifeEvents: [
            { id: 'ev_shared', year: 2020, eventType: 'career_up', label: 'Thăng tiến', note: 'Ghi chú cũ trên server' },
            { id: 'ev_server_only', year: 2023, eventType: 'marriage', label: 'Lập gia đình', note: 'Đồng bộ từ máy chủ' },
          ],
        },
      },
    },
    {
      id: 'rd_2_fresh_device',
      type: 'tuvi-laso',
      updatedAt: '2026-11-12T08:00:00Z',
      data: {
        inputData: {
          name: 'Trần Bảo Ngọc',
          gender: 0,
          calendarType: 'lunar',
          isLunar: true,
          isLeap: true,
          isLeapMonth: true,
          lunarDay: 30,
          lunarMonth: 6,
          lunarYear: 2017,
          lunarHourIndex: 6,
          lifeEvents: [
            { id: 'ev_ngoc_1', year: 2024, eventType: 'relocation_travel', label: 'Chuyển trường', note: 'Sang cơ sở mới' },
          ],
        },
      },
    },
    {
      id: 'rd_ignored',
      type: 'tuvi-hop-hon',
      data: { inputData: { name: 'Không hợp nhất', lifeEvents: [{ id: 'x', year: 2022 }] } },
    },
  ];

  const merged = reconcileProfilesFromReadings(existing, serverReadings);
  assert.equal(merged.length, 2);

  const khoa = merged.find((p) => p.name === 'Nguyễn Minh Khoa');
  assert.ok(khoa);
  assert.equal(khoa.lifeEvents.length, 2);
  assert.equal(
    khoa.lifeEvents.find((ev) => ev.id === 'ev_shared')?.note,
    'Ghi chú local mới hơn',
  );
  assert.equal(
    khoa.lifeEvents.find((ev) => ev.id === 'ev_server_only')?.note,
    'Đồng bộ từ máy chủ',
  );

  const ngoc = merged.find((p) => p.name === 'Trần Bảo Ngọc');
  assert.ok(ngoc);
  assert.equal(ngoc.calendarType, 'lunar');
  assert.equal(ngoc.isLeapMonth, true);
  assert.equal(ngoc.day, 30);
  assert.equal(ngoc.lifeEvents.length, 1);
  assert.equal(ngoc.lifeEvents[0].id, 'ev_ngoc_1');
});

test('tuviProfiles: Bug 4.1 & 4.4 — lunar leap month profile payload and strict calendarType + isLeapMonth matching', () => {
  const storage = createMemoryStorage();
  const regularLunar = saveProfile(
    {
      name: 'Phạm Hải Đăng',
      gender: 1,
      calendarType: 'lunar',
      day: 20,
      month: 6,
      year: 2017,
      isLeapMonth: false,
      hourValue: 4,
    },
    storage,
  ).profile;

  const leapLunar = saveProfile(
    {
      name: 'Phạm Hải Đăng',
      gender: 1,
      calendarType: 'lunar',
      day: 20,
      month: 6,
      year: 2017,
      isLeapMonth: true,
      hourValue: 4,
    },
    storage,
  ).profile;

  assert.notEqual(regularLunar.id, leapLunar.id);

  const leapPayload = profileToBirthInputPayload(leapLunar);
  assert.equal(leapPayload.calendarType, 'lunar');
  assert.equal(leapPayload.isLunar, true);
  assert.equal(leapPayload.isLeap, true);
  assert.equal(leapPayload.isLeapMonth, true);

  const regularPayload = profileToBirthInputPayload(regularLunar);
  assert.equal(regularPayload.isLeap, false);
  assert.equal(regularPayload.isLeapMonth, false);

  assert.equal(findMatchingProfileForInput(leapPayload, storage)?.id, leapLunar.id);
  assert.equal(findMatchingProfileForInput(regularPayload, storage)?.id, regularLunar.id);

  // Solar input with same numbers must NOT match lunar profiles
  const solarSameNumbers = {
    name: 'Phạm Hải Đăng',
    gender: 1,
    calendarType: 'solar',
    isLunar: false,
    solarInput: { day: 20, month: 6, year: 2017 },
    lunarHourIndex: 4,
  };
  assert.equal(findMatchingProfileForInput(solarSameNumbers, storage), null);
});
