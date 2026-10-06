import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupTuViTerm, TUVI_GLOSSARY } from '../src/data/tuViGlossary.js';

test('lookupTuViTerm: tra cứu chính xác 14 chính tinh và đắc hãm', () => {
  const tuVi = lookupTuViTerm('Tử Vi (M)');
  assert.ok(tuVi);
  assert.equal(tuVi.title, 'Tử Vi');
  assert.equal(tuVi.statusCode, 'M');
  assert.match(tuVi.statusLabel, /Miếu địa/);
  assert.match(tuVi.element, /Thổ/);

  const thaiDuongHam = lookupTuViTerm('Thái Dương (H)');
  assert.ok(thaiDuongHam);
  assert.equal(thaiDuongHam.statusCode, 'H');
  assert.match(thaiDuongHam.statusLabel, /Hãm địa/);
});

test('lookupTuViTerm: tra cứu Tứ Hóa và Sát tinh', () => {
  const hoaLoc = lookupTuViTerm('Hóa Lộc');
  assert.ok(hoaLoc);
  assert.match(hoaLoc.type, /Tứ Hóa/);

  const kinhDuong = lookupTuViTerm('Kình Dương');
  assert.ok(kinhDuong);
  assert.match(kinhDuong.type, /Sát tinh/);

  const diaKhong = lookupTuViTerm('Địa Không');
  assert.ok(diaKhong);
});

test('lookupTuViTerm: tra cứu sao Lưu niên (prefix L.)', () => {
  const luuMa = lookupTuViTerm('L.Thiên Mã');
  assert.ok(luuMa);
  assert.match(luuMa.title, /Lưu Thiên Mã/);
});

test('lookupTuViTerm: tra cứu 12 Cung và Tuần/Triệt', () => {
  const menh = lookupTuViTerm('Mệnh');
  assert.ok(menh);
  assert.equal(menh.title, 'Cung Mệnh');

  const tuan = lookupTuViTerm('Tuần');
  assert.ok(tuan);
  assert.match(tuan.title, /Tuần Không/);

  const triet = lookupTuViTerm('Triệt');
  assert.ok(triet);
  assert.match(triet.title, /Triệt Lộ/);
});

test('lookupTuViTerm: tra cứu Vòng Tràng Sinh', () => {
  const deVuong = lookupTuViTerm('Đế Vượng');
  assert.ok(deVuong);
  assert.equal(deVuong.type, 'Vòng Tràng Sinh');
});
