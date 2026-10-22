import assert from 'node:assert/strict';
import test from 'node:test';
import { createLineCommitGate } from '../src/logic/lineCommitGate.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('a pending toss cannot begin twice and stays locked until its line commits', async () => {
  const gate = createLineCommitGate();
  const token = gate.begin();
  let commits = 0;

  assert.equal(typeof token, 'number');
  assert.equal(gate.begin(), null);
  assert.equal(gate.schedule(token, () => { commits += 1; }, 10), true);
  assert.equal(gate.begin(), null);

  await wait(25);

  assert.equal(commits, 1);
  assert.equal(gate.isPending(), false);
  assert.equal(typeof gate.begin(), 'number');
});

test('reset cancels the delayed commit and invalidates the stale toss token', async () => {
  const gate = createLineCommitGate();
  const staleToken = gate.begin();
  let commits = 0;

  assert.equal(gate.schedule(staleToken, () => { commits += 1; }, 25), true);
  gate.cancel();
  const currentToken = gate.begin();

  assert.equal(gate.isCurrent(staleToken), false);
  assert.equal(gate.isCurrent(currentToken), true);
  await wait(40);
  assert.equal(commits, 0);
  assert.equal(gate.isPending(), true);
  gate.cancel();
});
