import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompatibility, createCompatibilityPerson, evaluateCompatibility, compatibilityEvidence, compatibilityPrompt } from '../src/utils/compatibility.js';

const person = { hoTen: 'Người A', menh: 'Thuy', phuTheStars: ['Thất Sát', 'Quả Tú'], daoHoaStars: Array.from({ length: 9 }, () => ({ sao: 'Hồng Loan', cung: 'Mệnh' })) };
const partner = { ...person, hoTen: 'Người B', menh: 'Kim', phuTheStars: ['Vũ Khúc', 'Tham Lang'] };
const payload = { chong: { hoTen: 'Người A', ngay: 6, thang: 4, nam: 1996, gio: 6, gioiTinh: 'Nam' }, vo: { hoTen: 'Người B', ngay: 24, thang: 7, nam: 2001, gio: 7, gioiTinh: 'Nữ' } };

test('uses the supplied reference arithmetic, not hardcoded screenshot scores', () => {
  const score = evaluateCompatibility(person, partner);
  assert.equal(score.cards.nguHanh.score, 85);
  assert.equal(score.cards.phuThe.score, 62); // 70 - 3 (Thất Sát) - 5 (Quả Tú)
  assert.equal(score.cards.tuHoa.score, 55);
  assert.equal(score.cards.daoHoa.score, 100);
  assert.equal(score.rawScore, 72.85);
  assert.equal(score.totalScore, 73);
  assert.equal(score.cards.tuHoa.provisional, true);
  assert.equal(evaluateCompatibility(partner, person).cards.nguHanh.score, 80);
  assert.equal(evaluateCompatibility(person, { ...partner, menh: 'Thuy' }).cards.nguHanh.score, 75);
  assert.match(evaluateCompatibility(person, { ...partner, menh: 'Hoa' }).cards.nguHanh.detail, /chưa xử lý tương khắc/);
});

test('clamps penalties and counts romance stars by supplied formula', () => {
  assert.equal(evaluateCompatibility({ ...person, phuTheStars: Array(20).fill('Địa Kiếp') }, partner).cards.phuThe.score, 30);
  assert.equal(evaluateCompatibility({ ...person, daoHoaStars: [] }, { ...partner, daoHoaStars: [] }).cards.daoHoa.score, 0);
});

test('validates real Gregorian dates and all hour boundaries before building charts', () => {
  for (const patch of [{ ngay: 31, thang: 4 }, { ngay: 29, thang: 2, nam: 2001 }, { gio: 24 }, { gio: '' }, { hoTen: '' }]) {
    assert.throws(() => createCompatibilityPerson({ ...payload.chong, ...patch }));
  }
  for (let gio = 0; gio < 24; gio++) {
    const built = createCompatibilityPerson({ ...payload.chong, gio });
    assert.equal(built.inputData.lunarHourIndex, Math.floor((gio + 1) / 2) % 12);
    assert.equal(built.result.palates.length, 12);
  }
  assert.doesNotThrow(() => createCompatibilityPerson({ ...payload.chong, nam: 2000, thang: 2, ngay: 29 }));
});

test('builds two real v11 charts, keeps all evidence namespaced, and exports the rule limits', () => {
  const pair = buildCompatibility(payload);
  const evidence = compatibilityEvidence(pair);
  assert.equal(evidence.length, 24);
  assert.equal(new Set(evidence.map(e => e.id)).size, 24);
  assert.ok(evidence.every(e => /^(chong|vo)\.palace\./.test(e.id)));
  for (const key of ['chong', 'vo']) {
    assert.equal(pair[key].result.engineVersion, 'user-v11');
    const actualPhuThe = pair[key].result.palates.find(p => p.chucNang.startsWith('Phu Thê'));
    assert.equal(pair[key].person.phuTheStars.length, actualPhuThe.chinhTinh.length + actualPhuThe.phuTinh.length);
  }
  const prompt = compatibilityPrompt(pair, 'love', 'Làm sao giao tiếp tốt hơn?');
  assert.ok(prompt.includes('NGƯỜI A — CHỒNG'));
  assert.ok(prompt.includes('NGƯỜI B — VỢ'));
  assert.ok(prompt.includes('Làm sao giao tiếp tốt hơn?'));
  assert.ok(prompt.includes('Điểm Tứ Hóa 55 là placeholder chưa tính'));
  assert.ok(prompt.length < 60000);
});
