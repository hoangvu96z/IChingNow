import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadContactSessionMessages,
  MAX_CONTACT_IMAGE_B64_LENGTH,
  MAX_TOTAL_CONTACT_IMAGE_B64_LENGTH,
  sendContactMessage,
  validateContactImages,
} from '../src/contactApi.mjs';

test('follow-up contact message sends the saved guest token and returns its renewal', async () => {
  let request;
  const responseBody = { success: true, guestToken: 'renewed-token', message: { id: 12 } };
  const result = await sendContactMessage({
    ssoBase: 'https://sso.example',
    fetchImpl: async (...args) => {
      request = args;
      return { ok: true, json: async () => responseBody };
    },
    sessionId: 'twm_session',
    guestToken: 'saved-token',
    name: 'Vu',
    message: 'Xin chào',
    images: [
      { data: 'base64-data-1', mime: 'image/jpeg', name: 'photo-1.jpg', compressedSize: 42, width: 10, height: 20 },
      { data: 'base64-data-2', mime: 'image/png', name: 'photo-2.png', compressedSize: 84, width: 30, height: 40 },
    ],
  });

  assert.equal(request[0], 'https://sso.example/contact/messages');
  assert.equal(request[1].method, 'POST');
  assert.equal(request[1].headers['X-Guest-Token'], 'saved-token');
  assert.equal('Authorization' in request[1].headers, false);
  assert.deepEqual(JSON.parse(request[1].body), {
    sessionId: 'twm_session',
    name: 'Vu',
    message: 'Xin chào',
    images: [
      { data: 'base64-data-1', mime: 'image/jpeg', name: 'photo-1.jpg', size: 42, width: 10, height: 20 },
      { data: 'base64-data-2', mime: 'image/png', name: 'photo-2.png', size: 84, width: 30, height: 40 },
    ],
  });
  assert.deepEqual(result, responseBody);
});

test('contact image validation accepts exact per-image and combined backend caps', () => {
  assert.doesNotThrow(() => validateContactImages([
    { data: 'A'.repeat(MAX_CONTACT_IMAGE_B64_LENGTH), mime: 'image/jpeg' },
  ]));
  assert.equal(MAX_TOTAL_CONTACT_IMAGE_B64_LENGTH, MAX_CONTACT_IMAGE_B64_LENGTH * 2);
  assert.doesNotThrow(() => validateContactImages([
    { data: 'A'.repeat(MAX_CONTACT_IMAGE_B64_LENGTH), mime: 'image/jpeg' },
    { data: 'B'.repeat(MAX_CONTACT_IMAGE_B64_LENGTH), mime: 'image/jpeg' },
  ]));
});

test('contact image validation rejects single and aggregate overflow before POST', async () => {
  let requestCount = 0;
  const submit = (images) => sendContactMessage({
    ssoBase: 'https://sso.example',
    fetchImpl: async () => {
      requestCount += 1;
      return { ok: true, json: async () => ({ success: true }) };
    },
    sessionId: 'twm_session',
    name: 'Vu',
    message: 'Xin chào',
    images,
  });

  await assert.rejects(
    submit([{ data: 'A'.repeat(MAX_CONTACT_IMAGE_B64_LENGTH + 1), mime: 'image/jpeg' }]),
    /Ảnh 1 quá lớn/,
  );
  await assert.rejects(
    submit([
      { data: 'A'.repeat(MAX_CONTACT_IMAGE_B64_LENGTH), mime: 'image/jpeg' },
      { data: 'B'.repeat(MAX_CONTACT_IMAGE_B64_LENGTH), mime: 'image/jpeg' },
      { data: 'C', mime: 'image/jpeg' },
    ]),
    /Tổng dung lượng ảnh vượt quá/,
  );
  assert.equal(requestCount, 0);
});

test('contact history sends its guest token and returns messages', async () => {
  let request;
  const messages = [{ id: 7, message: 'Earlier message' }];
  const result = await loadContactSessionMessages({
    ssoBase: 'https://sso.example',
    fetchImpl: async (...args) => {
      request = args;
      return { ok: true, json: async () => ({ messages }) };
    },
    sessionId: 'twm_session',
    guestToken: 'saved-token',
  });

  assert.equal(request[0], 'https://sso.example/contact/session/twm_session');
  assert.deepEqual(request[1].headers, { 'X-Guest-Token': 'saved-token' });
  assert.deepEqual(result, messages);
});

test('legacy contact history without a guest token fails closed without a request', async () => {
  let requestCount = 0;
  await assert.rejects(
    loadContactSessionMessages({
      ssoBase: 'https://sso.example',
      fetchImpl: async () => { requestCount += 1; },
      sessionId: 'twm_session',
      guestToken: null,
    }),
    /không có mã truy cập lịch sử/,
  );
  assert.equal(requestCount, 0);
});
