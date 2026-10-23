import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadingsApi, createReadingsApiRequest } from '../src/utils/readingsApi.mjs';

test('shared readings client uses the app-scoped SSO routes and request bodies', async () => {
  const calls = [];
  const api = createReadingsApi({
    app: 'tuvi app',
    request: async (...args) => {
      calls.push(args);
      return { reading: { id: 'reading-1' } };
    },
  });

  assert.deepEqual(await api.list(), { reading: { id: 'reading-1' } });
  await api.create({ app: 'tuvi', data: { inputData: {} } });
  await api.update('reading/1', { aiConversation: [] });
  assert.deepEqual(await api.delete('reading-1'), { ok: true });
  await api.clear();

  assert.deepEqual(calls, [
    ['/readings?app=tuvi%20app', { errorMessage: 'Failed to load readings' }],
    ['/readings', {
      method: 'POST',
      body: { app: 'tuvi', data: { inputData: {} } },
      errorMessage: 'Failed to save reading',
    }],
    ['/readings/reading%2F1', {
      method: 'PATCH',
      body: { data: { aiConversation: [] } },
      errorMessage: 'Failed to update reading data',
    }],
    ['/readings/reading-1', {
      method: 'DELETE',
      errorMessage: 'Failed to delete reading',
    }],
    ['/readings/all?app=tuvi%20app', {
      method: 'DELETE',
      errorMessage: 'Không thể xóa lịch sử trên máy chủ. Lịch sử vẫn được giữ lại.',
    }],
  ]);
});

test('fetch transport sends cookie credentials and JSON bodies, then parses JSON', async () => {
  const calls = [];
  const request = createReadingsApiRequest('https://sso.example.test', async (...args) => {
    calls.push(args);
    return { ok: true, status: 200, json: async () => ({ reading: { id: 'saved' } }) };
  });

  const result = await request('/readings', {
    method: 'POST',
    body: { app: 'tarot', data: { cards: [] } },
  });

  assert.deepEqual(result, { reading: { id: 'saved' } });
  assert.deepEqual(calls, [[
    'https://sso.example.test/readings',
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'tarot', data: { cards: [] } }),
    },
  ]]);
});

test('fetch transport uses route errors and preserves status codes', async () => {
  const request = createReadingsApiRequest('https://sso.example.test', async () => ({
    ok: false,
    status: 503,
    json: async () => ({ message: 'maintenance', code: 'UPSTREAM_DOWN' }),
  }));
  const api = createReadingsApi({ app: 'iching', request });

  await assert.rejects(api.create({ data: {} }), (error) => {
    assert.equal(error.message, 'Failed to save reading');
    assert.equal(error.status, 503);
    assert.equal(error.code, 'UPSTREAM_DOWN');
    return true;
  });
});

test('fetch transport falls back to a server message when no route message is set', async () => {
  const request = createReadingsApiRequest('https://sso.example.test', async () => ({
    ok: false,
    status: 400,
    json: async () => ({ message: 'invalid request' }),
  }));

  await assert.rejects(request('/readings'), (error) => {
    assert.equal(error.message, 'invalid request');
    assert.equal(error.status, 400);
    return true;
  });
});
