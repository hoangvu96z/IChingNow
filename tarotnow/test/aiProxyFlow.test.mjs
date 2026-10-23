import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const appRoot = path.resolve(import.meta.dirname, '..');

test('Tarot AiInterpretationPanel and usePlan use authenticated proxy settings without client consumeQuota', async () => {
  const previousLocalStorage = globalThis.localStorage;
  if (!globalThis.localStorage) {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }

  const server = await createServer({
    root: appRoot,
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(appRoot, '../shared/src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null, fs: { allow: ['..'] } },
    appType: 'custom',
  });

  try {
    const { usePlan } = await server.ssrLoadModule('/src/hooks/usePlan.js');
    const { default: AiInterpretationPanel } = await server.ssrLoadModule('/src/components/AiInterpretationPanel.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.jsx');

    let capturedPlan = null;
    function PlanProbe() {
      capturedPlan = usePlan(false);
      return null;
    }

    renderToStaticMarkup(React.createElement(PlanProbe));
    assert.ok(capturedPlan);
    assert.equal('consumeQuota' in capturedPlan, false);
    assert.equal(typeof capturedPlan.fetchQuota, 'function');

    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(
          AuthProvider,
          null,
          React.createElement(AiInterpretationPanel, {
            question: 'Công việc tháng tới thế nào?',
            drawnCards: [
              {
                name: 'The Fool',
                arcana: 'Major Arcana',
                isReversed: false,
                uprightMeaning: 'Khởi đầu mới',
                reversedMeaning: 'Bốc đồng',
                description: 'Chàng khờ bước đi',
              },
            ],
            spreadName: 'Trải bài 1 lá',
            spreadPositions: [{ title: 'Hiện tại', description: 'Tình huống hiện tại' }],
            getCardMeaning: () => 'Khởi đầu mới',
            readingId: null,
          }),
        ),
      ),
    );

    assert.ok(html.includes('AI'));
    assert.equal(html.includes('apiKey'), false);
  } finally {
    globalThis.localStorage = previousLocalStorage;
    await server.close();
  }
});
