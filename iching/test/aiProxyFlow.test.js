import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const appRoot = path.resolve(import.meta.dirname, '..');

test('IChing AiInterpretationPanel and usePlan use authenticated proxy settings without client consumeQuota', async () => {
  const server = await createServer({
    root: appRoot,
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(appRoot, '../shared/src'),
        '@iching': path.resolve(appRoot, 'src'),
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
    const { EvidenceContext } = await server.ssrLoadModule('/src/context/evidenceState.js');

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
          React.createElement(
            EvidenceContext.Provider,
            { value: { catalog: [], open() {} } },
            React.createElement(AiInterpretationPanel, {
              result: {
                question: 'Sự nghiệp năm nay thế nào?',
                method: '2',
                primary: { number: 1, name: 'Thuần Càn', meaning: 'Nguyên hanh lợi trinh', image: 'Trời chuyển động mạnh' },
                movingLines: [1],
                transformed: { number: 44, name: 'Thiên Phong Cấu', meaning: 'Nữ tráng' },
              },
              plainTextResult: 'Quẻ Thuần Càn động hào 1',
              readingId: null,
            }),
          ),
        ),
      ),
    );

    assert.ok(html.includes('combo1') || html.includes('AI'));
    assert.equal(html.includes('apiKey'), false);
  } finally {
    await server.close();
  }
});
