import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getInlineImageOrphanIndices,
  getLocalNoteImageSource,
  getNoteImageEndpoint,
  getNoteImageFilename,
  getLocalNoteAudioSource,
  getNoteAudioEndpoint,
  getNoteAudioFilename,
  extractClipboardMediaFiles,
  MAX_IMAGES_PER_NOTE,
  MAX_AUDIOS_PER_NOTE,
} from '../src/noteImages.mjs';
import { replaceInlineImagePlaceholders } from '../src/safeNoteContent.js';

test('private note image URLs resolve to the protected note route', () => {
  assert.equal(
    getNoteImageEndpoint({
      noteId: 'note/with space',
      image: { url: 'https://sso.example/uploads/notes/note-123/photo%20one.jpg' },
    }),
    '/notes/note%2Fwith%20space/images/photo%20one.jpg',
  );
});

test('shared note images use the share-token route', () => {
  assert.equal(
    getNoteImageEndpoint({
      shareToken: 'share/token',
      noteId: 'ignored',
      image: { url: '/uploads/notes/note-123/%E6%97%A5%E8%A8%98.png' },
    }),
    '/notes/share/share%2Ftoken/images/%E6%97%A5%E8%A8%98.png',
  );
});

test('protected private and share image URLs preserve their filenames', () => {
  const privateImage = { url: '/notes/note-123/images/photo%20one.jpg' };
  const sharedImage = { url: 'https://api.example/notes/share/share-token/images/%E6%97%A5%E8%A8%98.png' };

  assert.equal(getNoteImageFilename(privateImage), 'photo one.jpg');
  assert.equal(getNoteImageFilename(sharedImage), '日記.png');
  assert.equal(
    getNoteImageEndpoint({ noteId: 'note-123', image: privateImage }),
    '/notes/note-123/images/photo%20one.jpg',
  );
  assert.equal(
    getNoteImageEndpoint({ shareToken: 'share-token', image: sharedImage }),
    '/notes/share/share-token/images/%E6%97%A5%E8%A8%98.png',
  );
});

test('local data and blob images remain local without a server endpoint', () => {
  const dataImage = { url: 'data:image/png;base64,abc' };
  const blobImage = { url: 'blob:https://notenow.example/image-id' };

  assert.equal(getLocalNoteImageSource(dataImage), dataImage.url);
  assert.equal(getLocalNoteImageSource(blobImage), blobImage.url);
  assert.equal(getNoteImageEndpoint({ noteId: 'note-123', image: dataImage }), null);
  assert.equal(getNoteImageEndpoint({ noteId: 'note-123', image: blobImage }), null);
});

test('missing identifiers and unsafe or missing filenames are rejected', () => {
  assert.equal(getNoteImageEndpoint({ image: { url: '/uploads/notes/id/photo.jpg' } }), null);
  assert.equal(getNoteImageEndpoint({ noteId: 'note-123', image: { url: '/uploads/notes/id/%2Fetc' } }), null);
  assert.equal(getNoteImageEndpoint({ noteId: 'note-123', image: { filename: '..' } }), null);
});

test('inline image markup round-trips in its original position and order', () => {
  const editorHtml = '<p>Before <span data-note-inline-image="0">Ảnh nội tuyến 1</span> between <span data-note-inline-image="1">Ảnh nội tuyến 2</span> after</p>';
  const images = [
    { markup: '<img src="/uploads/notes/note-1/first.png" alt="first">' },
    { markup: '<img src="/uploads/notes/note-1/second.png" alt="second">' },
  ];

  assert.equal(
    replaceInlineImagePlaceholders(editorHtml, images),
    '<p>Before <img src="/uploads/notes/note-1/first.png" alt="first"> between <img src="/uploads/notes/note-1/second.png" alt="second"> after</p>',
  );
});

test('only inline image filenames present in the note attachment metadata are supported', () => {
  const inlineImages = [
    { url: '/uploads/notes/note-1/owned.png' },
    { url: 'https://images.example/external.jpg' },
    { url: 'data:image/png;base64,abc' },
    { url: '/uploads/notes/old-note/orphan.png' },
  ];
  const attachments = [{ url: 'https://sso.example/uploads/notes/note-1/owned.png' }];

  assert.deepEqual(getInlineImageOrphanIndices(inlineImages, attachments), [1, 2, 3]);
});

test('inline image ownership follows the current attachment state after deletion', () => {
  const inlineImages = [{ url: '/notes/note-1/images/owned.png' }];
  const currentAttachments = [{ url: '/notes/note-1/images/owned.png' }];

  assert.deepEqual(getInlineImageOrphanIndices(inlineImages, currentAttachments), []);
  assert.deepEqual(getInlineImageOrphanIndices(inlineImages, []), [0]);
});

test('attachment limits are 10 for images and 10 for audios', () => {
  assert.equal(MAX_IMAGES_PER_NOTE, 10);
  assert.equal(MAX_AUDIOS_PER_NOTE, 10);
});

test('private note audio URLs resolve to the protected note route', () => {
  assert.equal(
    getNoteAudioEndpoint({
      noteId: 'note/with space',
      audio: { url: 'https://sso.example/uploads/notes/note-123/voice%20one.mp3' },
    }),
    '/notes/note%2Fwith%20space/audios/voice%20one.mp3',
  );
});

test('shared note audios use the share-token route', () => {
  assert.equal(
    getNoteAudioEndpoint({
      shareToken: 'share/token',
      noteId: 'ignored',
      audio: { url: '/uploads/notes/note-123/%E9%9F%B3%E5%A3%B0.m4a' },
    }),
    '/notes/share/share%2Ftoken/audios/%E9%9F%B3%E5%A3%B0.m4a',
  );
});

test('protected private and share audio URLs preserve their filenames', () => {
  const privateAudio = { url: '/notes/note-123/audios/voice%20one.wav' };
  const sharedAudio = { url: 'https://api.example/notes/share/share-token/audios/%E9%9F%B3%E5%A3%B0.ogg' };

  assert.equal(getNoteAudioFilename(privateAudio), 'voice one.wav');
  assert.equal(getNoteAudioFilename(sharedAudio), '音声.ogg');
  assert.equal(
    getNoteAudioEndpoint({ noteId: 'note-123', audio: privateAudio }),
    '/notes/note-123/audios/voice%20one.wav',
  );
  assert.equal(
    getNoteAudioEndpoint({ shareToken: 'share-token', audio: sharedAudio }),
    '/notes/share/share-token/audios/%E9%9F%B3%E5%A3%B0.ogg',
  );
});

test('local data and blob audios remain local without a server endpoint', () => {
  const dataAudio = { url: 'data:audio/mp3;base64,abc' };
  const blobAudio = { url: 'blob:https://notenow.example/audio-id' };

  assert.equal(getLocalNoteAudioSource(dataAudio), dataAudio.url);
  assert.equal(getLocalNoteAudioSource(blobAudio), blobAudio.url);
  assert.equal(getNoteAudioEndpoint({ noteId: 'note-123', audio: dataAudio }), null);
  assert.equal(getNoteAudioEndpoint({ noteId: 'note-123', audio: blobAudio }), null);
});

test('missing identifiers and unsafe audio filenames are rejected', () => {
  assert.equal(getNoteAudioEndpoint({ audio: { url: '/uploads/notes/id/voice.mp3' } }), null);
  assert.equal(getNoteAudioEndpoint({ noteId: 'note-123', audio: { url: '/uploads/notes/id/%2Fetc' } }), null);
  assert.equal(getNoteAudioEndpoint({ noteId: 'note-123', audio: { filename: '..' } }), null);
  assert.equal(getNoteAudioEndpoint({ noteId: 'note-123', audio: { filename: '.' } }), null);
  assert.equal(getNoteAudioEndpoint({ noteId: 'note-123', audio: { filename: 'a/b' } }), null);
});

test('extractClipboardMediaFiles extracts and renames generic images and audios with unique names', () => {
  const fixedNow = 1731000000000;
  const mockFile1 = new File(['image-bytes'], 'image.png', { type: 'image/png' });
  const mockFile2 = new File(['image-bytes-2'], 'blob', { type: 'image/jpeg' });
  const mockAudio1 = new File(['audio-bytes'], 'audio.mp3', { type: 'audio/mpeg' });
  const mockAudio2 = new File(['audio-bytes-2'], 'custom-recording.wav', { type: 'audio/wav' });

  const clipboardData = {
    items: [
      { kind: 'file', getAsFile: () => mockFile1 },
      { kind: 'file', getAsFile: () => mockFile2 },
      { kind: 'string', getAsFile: () => null },
      { kind: 'file', getAsFile: () => mockAudio1 },
      { kind: 'file', getAsFile: () => mockAudio2 },
    ],
  };

  const { imageFiles, audioFiles } = extractClipboardMediaFiles(clipboardData, fixedNow);

  assert.equal(imageFiles.length, 2);
  assert.equal(imageFiles[0].name, `clipboard-image-${fixedNow}-0.png`);
  assert.equal(imageFiles[1].name, `clipboard-image-${fixedNow}-1.jpg`);

  assert.equal(audioFiles.length, 2);
  assert.equal(audioFiles[0].name, `clipboard-audio-${fixedNow}-0.mp3`);
  assert.equal(audioFiles[1].name, 'custom-recording.wav'); // preserved
});

test('extractClipboardMediaFiles falls back to clipboardData.files if items yielded no files', () => {
  const fixedNow = 1731000000000;
  const mockImg = new File(['img'], 'photo.webp', { type: 'image/webp' });
  const mockAudio = new File(['audio'], 'music.flac', { type: 'audio/flac' });

  const clipboardData = {
    items: [],
    files: [mockImg, mockAudio],
  };

  const { imageFiles, audioFiles } = extractClipboardMediaFiles(clipboardData, fixedNow);

  assert.equal(imageFiles.length, 1);
  assert.equal(imageFiles[0].name, 'photo.webp');
  assert.equal(audioFiles.length, 1);
  assert.equal(audioFiles[0].name, 'music.flac');
});

test('extractClipboardMediaFiles returns empty arrays for text-only clipboard data', () => {
  const clipboardData = {
    items: [
      { kind: 'string', getAsFile: () => null },
    ],
    files: [],
  };

  const { imageFiles, audioFiles } = extractClipboardMediaFiles(clipboardData);

  assert.deepEqual(imageFiles, []);
  assert.deepEqual(audioFiles, []);
});

test('NoteNow production .htaccess CSP explicitly allows media-src self, data:, and blob: for audio playback', () => {
  const htaccessPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../public/.htaccess',
  );
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');
  assert.match(htaccess, /media-src\s+'self'\s+data:\s+blob:/);
});

test('getLocalNoteAudioSource accepts audio, container video/webm, and application/ogg data URLs', () => {
  assert.equal(
    getLocalNoteAudioSource({ url: 'data:video/webm;base64,AAAA' }),
    'data:video/webm;base64,AAAA',
  );
  assert.equal(
    getLocalNoteAudioSource({ url: 'data:application/ogg;base64,BBBB' }),
    'data:application/ogg;base64,BBBB',
  );
});
