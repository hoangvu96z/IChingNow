import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteReadingItems } from '../src/utils/readingDeletes.mjs';

test('keeps server-rejected readings in the failed set while reporting successful deletes', async () => {
  const items = [
    { id: 'local-a', _remoteId: 'remote-a' },
    { id: 'local-b', _remoteId: 'remote-b' },
  ];
  const { deletedItems, failedItems } = await deleteReadingItems(items, {
    isAuthenticated: true,
    deleteRemote: async (id) => ({ ok: id !== 'remote-b', status: 503 }),
  });

  assert.deepEqual(deletedItems, [items[0]]);
  assert.equal(failedItems.length, 1);
  assert.equal(failedItems[0].item, items[1]);
  assert.match(failedItems[0].error.message, /HTTP 503/);
});

test('treats unauthenticated local-only entries as deletable without a remote request', async () => {
  const items = [{ id: 'local-only' }];
  let called = false;
  const result = await deleteReadingItems(items, {
    isAuthenticated: false,
    deleteRemote: async () => { called = true; return { ok: false }; },
  });

  assert.deepEqual(result.deletedItems, items);
  assert.deepEqual(result.failedItems, []);
  assert.equal(called, false);
});
