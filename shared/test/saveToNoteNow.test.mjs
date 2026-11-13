import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReadingNoteHtml,
  normalizeNoteTags,
  encodeNoteHandoffHash,
  decodeNoteHandoffHash,
  saveReadingToNoteNow,
  consumeIncomingNoteDrafts,
} from '../src/utils/saveToNoteNow.mjs';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('normalizeNoteTags sanitizes, lowercases, and deduplicates tags', () => {
  const tags = normalizeNoteTags(['#Nghiệm Lý', 'nghiệm lý', 'Tài Chính 2026!', '  ', '#kinh-dich']);
  assert.deepEqual(tags, ['nghiệm-lý', 'tài-chính-2026', 'kinh-dich']);
});

test('buildReadingNoteHtml escapes untrusted input and emits TipTap taskList items', () => {
  const html = buildReadingNoteHtml({
    sourceAppLabel: 'IChingNow <script>alert(1)</script>',
    timestampLabel: '13/11/2026 21:00',
    question: 'Có nên ký hợp đồng <img onerror=alert(1)>?',
    summaryLines: ['Quẻ Thuần Càn động hào 5', 'Ứng kỳ: Ngày Giáp Thân (19/11/2026)'],
    checklistItems: [
      { text: 'Kiểm tra điều khoản thanh toán', checked: false },
      { text: 'Đối chiếu kết quả ngày 19/11/2026', checked: true },
    ],
    sourceUrl: 'https://vunph.id.vn/kinhdich/',
    tags: ['kinh-dich', 'nghiem-ly'],
  });

  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img onerror'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('<ul data-type="taskList">'));
  assert.ok(html.includes('<li data-type="taskItem" data-checked="false">'));
  assert.ok(html.includes('<li data-type="taskItem" data-checked="true">'));
  assert.ok(html.includes('#kinh-dich #nghiem-ly'));
});

test('encodeNoteHandoffHash and decodeNoteHandoffHash roundtrip Vietnamese UTF-8 safely', () => {
  const draft = {
    clientDraftId: 'nn_test_1',
    title: 'Quẻ Lục Hào: Hỏi việc chuyển công tác',
    content: '<p>Dụng Thần Quan Quỷ vượng tướng</p>',
    bgColor: 'amber',
    tags: ['kinh-dich', 'cong-viec'],
  };
  const hash = encodeNoteHandoffHash(draft);
  assert.ok(hash.startsWith('#nn_import='));
  const decoded = decodeNoteHandoffHash(hash);
  assert.equal(decoded.clientDraftId, 'nn_test_1');
  assert.equal(decoded.title, draft.title);
  assert.equal(decoded.content, draft.content);
  assert.deepEqual(decoded.tags, ['kinh-dich', 'cong-viec']);
});

test('saveReadingToNoteNow posts directly to /notes when authenticated', async () => {
  let postedBody = null;
  const storage = createMemoryStorage();
  const result = await saveReadingToNoteNow({
    title: 'Lá số Tử Vi 2026',
    sourceAppLabel: 'TuViNow',
    question: 'Vận hạn năm Bính Ngọ',
    summaryLines: ['Đại hạn cung Tài Bạch 4.2/5'],
    checklistItems: ['Nghiệm lý tháng 6 âm lịch'],
    tags: ['tu-vi', '2026'],
    isAuthenticated: true,
    ssoBase: 'https://sso.example.com',
    env: { DEV: false },
    location: { href: 'https://vunph.id.vn/tuvi/', hostname: 'vunph.id.vn', pathname: '/tuvi/' },
    storage,
    fetchImpl: async (url, init) => {
      assert.equal(url, 'https://sso.example.com/notes');
      postedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({ id: 'note-uuid-1', ...postedBody }),
      };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'cloud');
  assert.equal(result.openUrl, '/note/');
  assert.deepEqual(postedBody.tags, ['tu-vi', '2026']);
  assert.ok(postedBody.content.includes('data-type="taskList"'));
});

test('saveReadingToNoteNow stages local queue + hash handoff for guests and deduplicates on consume', async () => {
  const storage = createMemoryStorage();
  const locationObj = {
    href: 'http://localhost:5174/tarot/',
    hostname: 'localhost',
    pathname: '/tarot/',
  };

  const result = await saveReadingToNoteNow({
    title: 'Trải bài Celtic Cross',
    sourceAppLabel: 'TarotNow',
    question: 'Định hướng quý tới',
    summaryLines: ['Lửa + Khí tương trợ mạnh'],
    checklistItems: ['Xem lại sau 30 ngày'],
    tags: ['tarot'],
    isAuthenticated: false,
    env: { DEV: true },
    location: locationObj,
    storage,
  });

  assert.equal(result.mode, 'handoff');
  assert.ok(result.openUrl.startsWith('http://localhost:5177/note/#nn_import='));

  const hashPart = `#${result.openUrl.split('#')[1]}`;
  let replacedUrl = null;
  const imported = consumeIncomingNoteDrafts({
    storage,
    location: { pathname: '/note/', search: '', hash: hashPart },
    history: {
      state: null,
      replaceState: (_s, _t, url) => {
        replacedUrl = url;
      },
    },
  });

  assert.equal(imported.length, 1);
  assert.equal(imported[0].title, 'Trải bài Celtic Cross');
  assert.equal(replacedUrl, '/note/');

  // Re-consuming the same hash must be deduplicated
  const duplicateImport = consumeIncomingNoteDrafts({
    storage,
    location: { pathname: '/note/', search: '', hash: hashPart },
    history: { state: null, replaceState: () => {} },
  });
  assert.equal(duplicateImport.length, 0);
});
