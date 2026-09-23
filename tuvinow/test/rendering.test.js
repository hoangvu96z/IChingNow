import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';

test('answer and actual palace components render evidence and legacy text', async () => {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Provider } = await server.ssrLoadModule('/src/components/TuViEvidenceProvider.jsx');
    const { default: Answer } = await server.ssrLoadModule('/src/components/TuViEvidenceAnswer.jsx');
    const { default: Palace } = await server.ssrLoadModule('/src/components/PalateCard.jsx');
    const result = anLaSoTuVi({ lunarYear: 1996, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, yearCanIndex: 2, yearChiIndex: 0, gender: 1 });
    const render = text => renderToStaticMarkup(React.createElement(Provider, { result },
      React.createElement(Answer, { text }), ...result.palates.map(p => React.createElement(Palace, { palace: p, key: p.chiIndex }))));
    const html = render(JSON.stringify({ version: 1, sections: [{ title: 'Tổng quan', text: 'Luận giải có **căn cứ**', references: ['palace.0', 'palace.99'] }] }));
    assert.ok(html.includes('<strong>căn cứ</strong>'));
    assert.ok(html.includes('Xem căn cứ · 1'));
    assert.ok(html.includes('id="tuvi-palace.0"'));
    assert.ok(!html.includes('id="tuvi-palace.99"'));
    assert.ok(render('Luận giải cũ').includes('Luận giải cũ'));
    assert.ok(render('---SUGGESTED_QUESTIONS---\n1. Hỏi tiếp?').includes('AI chưa trả về nội dung luận giải'));
  } finally { await server.close(); }
});
