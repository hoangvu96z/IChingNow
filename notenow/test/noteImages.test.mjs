import test from 'node:test';
import assert from 'node:assert/strict';
import { getInlineImageOrphanIndices, getLocalNoteImageSource, getNoteImageEndpoint, getNoteImageFilename } from '../src/noteImages.mjs';
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
