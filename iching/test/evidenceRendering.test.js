import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { parseInterpretationResponse } from '../src/logic/interpretationEvidence.js';

test('actual answer component renders structured, legacy, recovered and missing answers', async () => {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: Answer } = await server.ssrLoadModule('/src/components/EvidenceInterpretation.jsx');
    const { LanguageProvider } = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const { EvidenceContext } = await server.ssrLoadModule('/src/context/evidenceState.js');
    const catalog = [{ id: 'hex.primary' }];
    const raw = JSON.stringify({ version: 1, sections: [{ title: 'Tổng quan', text: 'Nội dung luận giải', references: ['hex.primary'] }], questions: ['Nên làm gì tiếp?'] });
    const render = (response) => renderToStaticMarkup(React.createElement(LanguageProvider, null,
      React.createElement(EvidenceContext.Provider, { value: { catalog, open() {} } },
        React.createElement(Answer, { parsedResponse: parseInterpretationResponse(response, catalog), renderMarkdown: text => text }))));
    for (const response of [raw, `\`\`\`json\n${raw}\n\`\`\``, `Dưới đây là kết quả:\n${raw}`]) {
      const html = render(response);
      assert.ok(html.includes('Nội dung luận giải'));
      assert.ok(html.includes('Xem căn cứ'));
    }
    assert.ok(render('Luận giải cũ\n---SUGGESTED_QUESTIONS---\n1. Nên làm gì tiếp?').includes('Luận giải cũ'));
    assert.ok(render('{"sections":[{"text":"Nội dung còn lại","references":[').includes('Nội dung còn lại'));
    assert.ok(render('---SUGGESTED_QUESTIONS---\n1. Nên làm gì tiếp?').includes('AI chưa trả về nội dung luận giải'));
  } finally {
    await server.close();
  }
});
