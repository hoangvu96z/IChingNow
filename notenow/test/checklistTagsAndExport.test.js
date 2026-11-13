import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeNoteContent,
  extractChecklistProgress,
  contentWithProtectedImageSources,
} from '../src/safeNoteContent.js';
import {
  htmlToMarkdown,
  markdownToHtml,
  htmlToPlainText,
  buildExportFilename,
} from '../src/utils/noteExport.js';
import {
  SUGGESTED_NOTE_TAGS,
  extractInlineHashtags,
  collectBoardTags,
  collectBoardColors,
  filterBoardNotes,
} from '../src/utils/noteFilters.js';
import {
  normalizeNoteTags,
  enqueueIncomingNoteDraft,
  consumeIncomingNoteDrafts,
} from '../../shared/src/utils/saveToNoteNow.mjs';
import {
  selectSupportedAudioMimeType,
  resolveRecordedFileFormat,
  formatVoiceRecordingFilename,
  stopMediaStreamTracks,
} from '../src/utils/voiceRecorderHelpers.js';

test('sanitizeNoteContent preserves TipTap taskList/taskItem markup and checkbox inputs', () => {
  const rawHtml = [
    '<ul data-type="taskList">',
    '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Hoàn thành báo cáo</p></div></li>',
    '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Gửi email khách hàng</p></div></li>',
    '</ul>',
  ].join('');

  const clean = sanitizeNoteContent(rawHtml);
  assert.match(clean, /<ul data-type="taskList">/);
  assert.match(clean, /<li data-type="taskItem" data-checked="true">/);
  assert.match(clean, /<li data-type="taskItem" data-checked="false">/);
  assert.match(clean, /<label><input type="checkbox" checked="checked"><\/label>/);
  assert.match(clean, /<label><input type="checkbox"><\/label>/);
  assert.match(clean, /<div><p>Hoàn thành báo cáo<\/p><\/div>/);
});

test('sanitizeNoteContent strips non-checkbox inputs, unsafe input attributes, scripts, and event handlers', () => {
  const maliciousHtml = [
    '<p onclick="alert(1)">Xin chào</p>',
    '<script>window.__pwned = true;</script>',
    '<input type="text" value="phishing" name="username">',
    '<input type="password" name="pw" formaction="https://evil.example/steal">',
    '<input type="checkbox" name="sneaky" value="1" formaction="https://evil.example" onchange="alert(2)" checked>',
    '<ul data-type="evilList"><li data-type="evilItem" data-checked="maybe"><a href="javascript:alert(3)">Click</a></li></ul>',
  ].join('');

  const clean = sanitizeNoteContent(maliciousHtml);
  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /window\.__pwned/);
  assert.doesNotMatch(clean, /type="text"/i);
  assert.doesNotMatch(clean, /type="password"/i);
  assert.doesNotMatch(clean, /\bname=/i);
  assert.doesNotMatch(clean, /\bvalue=/i);
  assert.doesNotMatch(clean, /\bformaction=/i);
  assert.doesNotMatch(clean, /\bonclick=/i);
  assert.doesNotMatch(clean, /\bonchange=/i);
  assert.doesNotMatch(clean, /javascript:/i);
  assert.doesNotMatch(clean, /evilList/);
  assert.doesNotMatch(clean, /evilItem/);
  assert.doesNotMatch(clean, /data-checked="maybe"/);
  // Valid checkbox remains with only safe attributes
  assert.match(clean, /<input type="checkbox" checked="checked">/);
});

test('contentWithProtectedImageSources disables checkboxes for read-only NoteCard previews', () => {
  const clean = sanitizeNoteContent(
    '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Mục 1</p></div></li></ul>',
  );
  const preview = contentWithProtectedImageSources(clean, [], 0, false);
  assert.match(preview, /disabled="disabled"/);
});

test('extractChecklistProgress counts total and completed taskItems accurately', () => {
  assert.deepEqual(extractChecklistProgress('<p>Không có checklist</p>'), {
    total: 0,
    completed: 0,
  });

  const partialHtml = [
    '<ul data-type="taskList">',
    '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Việc 1</p></div></li>',
    '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Việc 2</p></div></li>',
    '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Việc 3</p></div></li>',
    '</ul>',
  ].join('');
  assert.deepEqual(extractChecklistProgress(partialHtml), {
    total: 3,
    completed: 2,
  });

  const completeHtml = [
    '<ul data-type="taskList">',
    '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Xong A</p></div></li>',
    '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Xong B</p></div></li>',
    '</ul>',
  ].join('');
  assert.deepEqual(extractChecklistProgress(completeHtml), {
    total: 2,
    completed: 2,
  });
});

test('htmlToMarkdown and markdownToHtml roundtrip headings, formatting, lists, code, quotes, links, tags, and checklists', () => {
  const sourceHtml = [
    '<h2>Kế hoạch tuần</h2>',
    '<p>Ưu tiên <strong>quan trọng</strong>, <em>ghi nhớ</em> và <s>đã huỷ</s> cùng <code>npm test</code>.</p>',
    '<ul data-type="taskList">',
    '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Kiểm tra bảo mật XSS</p></div></li>',
    '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Viết tài liệu hướng dẫn</p></div></li>',
    '</ul>',
    '<ul><li><p>Ý chính một</p></li><li><p>Ý chính hai</p></li></ul>',
    '<ol><li><p>Bước đầu</p></li><li><p>Bước tiếp</p></li></ol>',
    '<blockquote><p>Trích dẫn nghiệm lý Dịch học</p></blockquote>',
    '<pre><code>const ok = true;</code></pre>',
    '<p>Xem thêm tại <a href="https://notenow.vunph.id.vn">NoteNow</a></p>',
  ].join('');

  const md = htmlToMarkdown(sourceHtml, {
    title: 'Ghi chú tổng hợp',
    tags: ['#Cong-Viec', 'nghiem-ly'],
  });

  assert.match(md, /^# Ghi chú tổng hợp/);
  assert.match(md, /## Kế hoạch tuần/);
  assert.match(md, /\*\*quan trọng\*\*/);
  assert.match(md, /\*ghi nhớ\*/);
  assert.match(md, /~~đã huỷ~~/);
  assert.match(md, /`npm test`/);
  assert.match(md, /- \[x\] Kiểm tra bảo mật XSS/);
  assert.match(md, /- \[ \] Viết tài liệu hướng dẫn/);
  assert.match(md, /- Ý chính một/);
  assert.match(md, /1\. Bước đầu/);
  assert.match(md, /> Trích dẫn nghiệm lý Dịch học/);
  assert.match(md, /```\nconst ok = true;\n```/);
  assert.match(md, /\[NoteNow\]\(https:\/\/notenow\.vunph\.id\.vn\)/);
  assert.match(md, /#cong-viec #nghiem-ly$/);

  const roundtrippedHtml = markdownToHtml(md);
  assert.deepEqual(extractChecklistProgress(roundtrippedHtml), {
    total: 2,
    completed: 1,
  });

  const plainText = htmlToPlainText(sourceHtml, {
    title: 'Ghi chú tổng hợp',
    tags: ['cong-viec'],
  });
  assert.match(plainText, /Ghi chú tổng hợp/);
  assert.match(plainText, /- \[x\] Kiểm tra bảo mật XSS/);
  assert.match(plainText, /NoteNow \(https:\/\/notenow\.vunph\.id\.vn\)/);
  assert.doesNotMatch(plainText, /\*\*quan trọng\*\*/);

  assert.match(buildExportFilename('Quẻ Thuần Càn!', 'md'), /^quẻ-thuần-càn-\d{4}-\d{2}-\d{2}\.md$/u);
  assert.match(buildExportFilename('', 'txt'), /^ghi-chu-notenow-\d{4}-\d{2}-\d{2}\.txt$/);
});

test('tag normalization, inline hashtag extraction, and board quick filters respect locked note privacy', () => {
  assert.deepEqual(SUGGESTED_NOTE_TAGS, [
    'cong-viec',
    'tai-chinh',
    'hoc-tap',
    'nghiem-ly',
    'ca-nhan',
  ]);

  const normalized = normalizeNoteTags(['#Cong-Viec', '  #TAI-CHINH ', 'cong-viec', '']);
  assert.deepEqual(normalized, ['cong-viec', 'tai-chinh']);

  const inline = extractInlineHashtags('<p>Hôm nay đọc quẻ #nghiem-ly và #Cong-Viec!</p>');
  assert.deepEqual(inline, ['nghiem-ly', 'cong-viec']);

  const sampleNotes = [
    {
      id: 'n-check',
      title: 'Checklist việc ngày mai',
      content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Họp sáng</p></div></li></ul>',
      bgColor: 'emerald',
      tags: ['cong-viec'],
      images: [],
      audios: [],
      hasPassword: false,
    },
    {
      id: 'n-media',
      title: 'Ghi âm & hình ảnh',
      content: '<p>Tư liệu học tập</p>',
      bgColor: 'blue',
      tags: ['hoc-tap'],
      images: [{ filename: 'pic.jpg', url: '/notes/n-media/images/pic.jpg' }],
      audios: [{ filename: 'voice.webm', url: '/notes/n-media/audios/voice.webm' }],
      hasPassword: false,
    },
    {
      id: 'n-locked',
      title: 'Tài chính riêng tư',
      content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Bí mật ngân sách</p></div></li></ul>',
      bgColor: 'amber',
      tags: ['tai-chinh'],
      images: [{ filename: 'secret.png' }],
      audios: [],
      hasPassword: true,
    },
  ];

  // Locked note's tags are hidden until unlocked
  assert.deepEqual(collectBoardTags(sampleNotes, {}), ['cong-viec', 'hoc-tap']);
  assert.deepEqual(collectBoardTags(sampleNotes, { 'n-locked': true }), [
    'cong-viec',
    'hoc-tap',
    'tai-chinh',
  ]);
  assert.deepEqual(collectBoardColors(sampleNotes), ['emerald', 'blue', 'amber']);

  // Type filters
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { type: 'checklist' }).map((n) => n.id),
    ['n-check'],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { type: 'checklist', unlockedNoteIds: { 'n-locked': true } }).map((n) => n.id),
    ['n-check', 'n-locked'],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { type: 'image' }).map((n) => n.id),
    ['n-media'],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { type: 'audio' }).map((n) => n.id),
    ['n-media'],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { type: 'locked' }).map((n) => n.id),
    ['n-locked'],
  );

  // Tag & color filters
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { tag: 'tai-chinh' }).map((n) => n.id),
    [],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { tag: 'tai-chinh', unlockedNoteIds: { 'n-locked': true } }).map((n) => n.id),
    ['n-locked'],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { color: 'blue' }).map((n) => n.id),
    ['n-media'],
  );

  // Search does not leak locked body content
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { search: 'ngân sách' }).map((n) => n.id),
    [],
  );
  assert.deepEqual(
    filterBoardNotes(sampleNotes, { search: 'riêng tư' }).map((n) => n.id),
    ['n-locked'],
  );
});

test('VoiceRecorderButton helpers select supported MIME types across Chromium/Firefox and Safari', () => {
  const chromiumRecorder = {
    isTypeSupported: (mime) => mime === 'audio/webm;codecs=opus',
  };
  const safariRecorder = {
    isTypeSupported: (mime) => mime === 'audio/mp4',
  };

  assert.equal(selectSupportedAudioMimeType(chromiumRecorder), 'audio/webm;codecs=opus');
  assert.equal(selectSupportedAudioMimeType(safariRecorder), 'audio/mp4');

  assert.deepEqual(resolveRecordedFileFormat('audio/webm;codecs=opus'), {
    ext: 'webm',
    type: 'audio/webm',
  });
  assert.deepEqual(resolveRecordedFileFormat('audio/mp4'), {
    ext: 'm4a',
    type: 'audio/mp4',
  });
  assert.deepEqual(resolveRecordedFileFormat('audio/ogg;codecs=opus'), {
    ext: 'ogg',
    type: 'audio/ogg',
  });

  const fixedDate = new Date(2026, 10, 13, 21, 5, 9);
  assert.equal(formatVoiceRecordingFilename('m4a', fixedDate), 'ghi-am-20261113-210509.m4a');

  let stoppedCount = 0;
  stopMediaStreamTracks({
    getTracks: () => [
      { stop: () => { stoppedCount += 1; } },
      { stop: () => { stoppedCount += 1; } },
    ],
  });
  assert.equal(stoppedCount, 2);
});

test('consumeIncomingNoteDrafts imports queued SpiritNow cross-app drafts exactly once', () => {
  const store = new Map();
  const prevStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };

  try {
    const queued = enqueueIncomingNoteDraft({
      id: 'draft-iching-1',
      title: 'Quẻ Địa Thiên Thái',
      content: '<p>Tiểu vãng đại lai, cát hanh.</p>',
      bgColor: 'emerald',
      tags: ['kinh-dich', 'nghiem-ly'],
      sourceApp: 'iching',
    });
    assert.ok(queued);

    const firstConsume = consumeIncomingNoteDrafts();
    assert.equal(firstConsume.length, 1);
    assert.equal(firstConsume[0].title, 'Quẻ Địa Thiên Thái');
    assert.deepEqual(firstConsume[0].tags, ['kinh-dich', 'nghiem-ly']);

    // Deduplicated on subsequent calls
    const secondConsume = consumeIncomingNoteDrafts();
    assert.equal(secondConsume.length, 0);
  } finally {
    globalThis.localStorage = prevStorage;
  }
});
