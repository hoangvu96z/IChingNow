import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUVI_PROFILES_STORAGE_KEY,
  loadSavedProfiles,
  saveProfile,
  deleteProfile,
  setDefaultSelfProfile,
  getDefaultSelfProfile,
  upsertProfileLifeEvent,
  deleteProfileLifeEvent,
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
