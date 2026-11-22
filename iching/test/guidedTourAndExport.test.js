import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { buildHexagram } from '../src/logic/buildHexagram.js';

const ICHING_ROOT = path.resolve(import.meta.dirname, '..');
const SHARED_COMPONENTS = path.resolve(ICHING_ROOT, '../shared/src/components');

const SSR_SHARED_PLUGIN = {
  name: 'ssr-shared-guided-tour-loader',
  enforce: 'pre',
  resolveId(source) {
    if (source === '@shared/components/GuidedTour.jsx' || source.endsWith('shared/src/components/GuidedTour.jsx')) {
      return path.resolve(ICHING_ROOT, 'src/__ssr_GuidedTour.jsx');
    }
    return null;
  },
  load(id) {
    if (id.endsWith('__ssr_GuidedTour.jsx')) {
      return fs
        .readFileSync(path.join(SHARED_COMPONENTS, 'GuidedTour.jsx'), 'utf8')
        .replace("'./guidedTourUtils.js'", `'${path.join(SHARED_COMPONENTS, 'guidedTourUtils.js')}'`)
        .replace("'./GuidedTour.css'", `'${path.join(SHARED_COMPONENTS, 'GuidedTour.css')}'`);
    }
    return null;
  },
};

test('PlainTextExportCard is unlocked for guest users and highlights Gemini prompt copy', async () => {
  const server = await createServer({
    root: ICHING_ROOT,
    configFile: false,
    cacheDir: path.resolve(ICHING_ROOT, 'node_modules/.vite-ssr-guide'),
    resolve: {
      alias: {
        '@shared': path.resolve(ICHING_ROOT, '../shared/src'),
      },
    },
    plugins: [SSR_SHARED_PLUGIN, react()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: 'custom',
  });

  try {
    const { default: PlainTextExportCard } = await server.ssrLoadModule('/src/components/PlainTextExportCard.jsx');
    const { buildIChingAiPrompt } = await server.ssrLoadModule('/src/utils/promptBuilder.js');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { default: GuidedTour } = await server.ssrLoadModule('@shared/components/GuidedTour.jsx');

    const result = buildHexagram([7, 8, 9, 7, 8, 6], {
      question: 'Công việc tháng tới có thuận lợi không?',
      castDate: '2026-11-22',
      castTime: '10:30',
    });

    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(PlainTextExportCard, { result })
      )
    );

    assert.ok(html.includes('btn-iching-copy-ai-prompt'), 'Must expose Copy Prompt for AI button without login gate');
    assert.ok(html.includes('Gemini'), 'Must recommend Google Gemini');
    assert.ok(html.includes('https://gemini.google.com/'), 'Must link to Google Gemini');
    assert.ok(!html.includes('Bạn cần đăng nhập'), 'Must NOT lock export card behind login');

    const prompt = buildIChingAiPrompt(result, 'QUẺ CHỦ: ...', 'vi');
    assert.ok(prompt.includes('Công việc tháng tới có thuận lợi không?'));
    assert.ok(prompt.includes('Dữ liệu quẻ chi tiết'));

    const tourHtml = renderToStaticMarkup(
      React.createElement(GuidedTour, {
        isOpen: true,
        onClose: () => {},
        steps: [
          {
            id: 's1',
            selector: '[data-tour="iching-export"]',
            title: 'Bước test',
            body: 'Copy prompt sang Gemini',
            ctaLink: { label: 'Mở Gemini', href: 'https://gemini.google.com/' },
          },
        ],
      })
    );
    assert.ok(tourHtml.includes('Bước 1 / 1'));
    assert.ok(tourHtml.includes('https://gemini.google.com/'));
  } finally {
    await server.close();
  }
});
