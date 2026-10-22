import test from 'node:test';
import assert from 'node:assert/strict';
import { readOpenAiChatStream } from '../src/utils/openAiSse.mjs';

function createResponse(chunks) {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    body: new ReadableStream({
      pull(controller) {
        if (index < chunks.length) controller.enqueue(encoder.encode(chunks[index++]));
        else controller.close();
      },
    }),
  };
}

test('reads fragmented OpenAI SSE chunks and the final unterminated DONE line', async () => {
  const response = createResponse([
    'data: {"choices":[{"delta":{"content":',
    '"Xin "}}]}\r\n\r\n',
    'data: {"choices":[{"delta":{"content":"chào"}}]}\n\ndata: [DONE]',
  ]);

  assert.equal(await readOpenAiChatStream(response), 'Xin chào');
});

test('surfaces an SSE error even after partial assistant text', async () => {
  const response = createResponse([
    `data: ${JSON.stringify({ choices: [{ delta: { content: 'A'.repeat(80) } }] })}\n\n`,
    'data: {"error":{"message":"Upstream timed out"}}\n\ndata: [DONE]\n',
  ]);

  await assert.rejects(readOpenAiChatStream(response), /Upstream timed out/);
});

test('rejects a persistable-length answer when the stream closes without DONE', async () => {
  const partialAnswer = 'A partial answer long enough to appear complete and save. '.repeat(3);
  const response = createResponse([
    `data: ${JSON.stringify({ choices: [{ delta: { content: partialAnswer } }] })}\n`,
  ]);

  await assert.rejects(readOpenAiChatStream(response), /ngắt quãng/);
});

test('rejects malformed SSE JSON instead of silently truncating the answer', async () => {
  const response = createResponse(['data: {not-json}\n\ndata: [DONE]\n']);

  await assert.rejects(readOpenAiChatStream(response), /không hợp lệ/);
});
