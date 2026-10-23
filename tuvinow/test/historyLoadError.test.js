import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HistoryLoadErrorNotice from '../src/components/HistoryLoadErrorNotice.mjs';

test('history load failure shows an alert and a working retry action', () => {
  let retryCount = 0;
  const onRetry = () => { retryCount += 1; };
  const notice = HistoryLoadErrorNotice({ error: 'request failed', onRetry });
  const html = renderToStaticMarkup(notice);

  assert.match(html, /role="alert"/);
  assert.match(html, /Không tải được lịch sử lá số/);
  assert.match(html, />Thử lại<\/button>/);
  assert.equal(HistoryLoadErrorNotice({ error: '', onRetry }), null);

  const retryButton = notice.props.children[1];
  retryButton.props.onClick();
  assert.equal(retryCount, 1);
});
