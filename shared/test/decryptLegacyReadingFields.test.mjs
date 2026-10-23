import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptLegacyReadingFields } from '../src/utils/decryptLegacyReadingFields.mjs';

test('decrypts configured legacy fields without mutating the source', async () => {
  const source = {
    question: 'enc_v1::question',
    aiConversation: 'enc_v1::conversation',
    title: 'Plain title',
  };
  const calls = [];

  const result = await decryptLegacyReadingFields(
    source,
    ['question', 'aiConversation'],
    'owner-1',
    async (value, userId) => {
      calls.push([value, userId]);
      return value === 'enc_v1::question' ? 'Question' : { answer: 'Answer' };
    },
  );

  assert.deepEqual(result, {
    data: {
      question: 'Question',
      aiConversation: { answer: 'Answer' },
      title: 'Plain title',
    },
    decryptionError: false,
  });
  assert.deepEqual(calls, [
    ['enc_v1::question', 'owner-1'],
    ['enc_v1::conversation', 'owner-1'],
  ]);
  assert.deepEqual(source, {
    question: 'enc_v1::question',
    aiConversation: 'enc_v1::conversation',
    title: 'Plain title',
  });
});

test('retains failed ciphertext and marks the reading as undecryptable', async () => {
  const source = {
    inputData: 'enc_v1::unreadable',
    aiConversation: 'enc_v1::readable',
  };

  const result = await decryptLegacyReadingFields(
    source,
    ['inputData', 'aiConversation'],
    'owner-2',
    async (value) => (value === 'enc_v1::unreadable' ? null : { turns: [] }),
  );

  assert.deepEqual(result, {
    data: {
      inputData: 'enc_v1::unreadable',
      aiConversation: { turns: [] },
    },
    decryptionError: true,
  });
});

test('leaves plain and unconfigured values untouched', async () => {
  let decryptCalls = 0;
  const result = await decryptLegacyReadingFields(
    { question: 'Plain question', notes: 'enc_v1::not-selected' },
    ['question'],
    'owner-3',
    async () => {
      decryptCalls++;
      return null;
    },
  );

  assert.deepEqual(result, {
    data: { question: 'Plain question', notes: 'enc_v1::not-selected' },
    decryptionError: false,
  });
  assert.equal(decryptCalls, 0);
});
