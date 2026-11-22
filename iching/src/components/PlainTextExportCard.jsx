import React, { useState, useMemo } from 'react';
import { buildPlainTextResult } from '../logic/buildPlainText.js';
import { buildIChingAiPrompt } from '../utils/promptBuilder.js';
import { copyToClipboard, downloadTxt, downloadJson } from '../logic/clipboard.js';
import { useLanguage } from '../context/useLanguage.js';

/**
 * Card xuất kết quả & Copy Prompt cho AI (mở miễn phí cho mọi người dùng, khuyên dùng Google Gemini)
 */
export default function PlainTextExportCard({ result }) {
  const { t, language } = useLanguage();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedJ, setCopiedJ] = useState(false);

  const hasResult = !!result;
  const text = useMemo(() => (hasResult ? buildPlainTextResult(result, language) : ''), [hasResult, result, language]);
  const aiPrompt = useMemo(() => (hasResult ? buildIChingAiPrompt(result, text, language) : ''), [hasResult, result, text, language]);

  async function handleCopyPrompt() {
    if (!hasResult) return;
    await copyToClipboard(aiPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  }

  async function handleCopyText() {
    if (!hasResult) return;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyJson() {
    if (!hasResult) return;
    await copyToClipboard(JSON.stringify(result, null, 2));
    setCopiedJ(true);
    setTimeout(() => setCopiedJ(false), 2000);
  }

  function handleDownloadTxt() {
    if (!hasResult) return;
    const ts = new Date().toISOString().slice(0, 10);
    downloadTxt(text, `que-kinh-dich-${ts}.txt`);
  }

  function handleDownloadJson() {
    if (!hasResult) return;
    const ts = new Date().toISOString().slice(0, 10);
    downloadJson(result, `que-kinh-dich-${ts}.json`);
  }

  const isEn = language === 'en';

  return (
    <div className="terminal-card">
      {/* Gemini Recommendation Banner */}
      <div
        style={{
          padding: '10px 14px',
          background: 'linear-gradient(90deg, rgba(16,185,129,0.14), rgba(59,130,246,0.12))',
          borderBottom: '1px solid rgba(52,211,153,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--color-terminal-text, #e2e8f0)' }}>
          {isEn
            ? '⭐ Best experience: Copy this AI Prompt and paste into Google Gemini for deep, accurate interpretation (free for everyone).'
            : '⭐ Quan trọng: Hãy bấm Copy Prompt cho AI bên dưới và dán vào Google Gemini (khuyên dùng) để được luận giải sâu & chuẩn nhất — miễn phí cho mọi người dùng.'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-iching-copy-ai-prompt"
            onClick={handleCopyPrompt}
            disabled={!hasResult}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: copiedPrompt ? '#16a34a' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: copiedPrompt ? '#ffffff' : '#0f172a',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.45,
              whiteSpace: 'nowrap',
            }}
          >
            {copiedPrompt
              ? (isEn ? '✓ Copied AI Prompt!' : '✓ Đã copy Prompt AI!')
              : (isEn ? '✨ Copy Prompt for AI (Gemini)' : '✨ Copy Prompt cho AI (Gemini)')}
          </button>
          <a
            href="https://gemini.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 11px',
              borderRadius: 8,
              background: '#1d4ed8',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isEn ? 'Open Gemini ↗' : 'Mở Gemini ↗'}
          </a>
        </div>
      </div>

      {/* Header */}
      <div className="terminal-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="terminal-dot" style={{ background: '#ff5f56' }} />
          <div className="terminal-dot" style={{ background: '#ffbd2e' }} />
          <div className="terminal-dot" style={{ background: '#27c93f' }} />
          <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
            {t('export.header', 'plaintext — kết quả lập quẻ')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyText}
            disabled={!hasResult}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: 'none',
              background: copied ? '#27c93f' : 'rgba(246,201,14,0.15)',
              color: copied ? 'white' : 'var(--color-terminal-accent)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.4,
              transition: 'all 0.2s',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {copied ? t('export.copied_text', '✓ Đã copy') : t('export.copy_text', '⎘ Copy text')}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!hasResult}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid rgba(113,128,150,0.4)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.8125rem',
              cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.4,
              fontFamily: 'monospace',
            }}
          >
            {t('export.download_txt', '↓ .txt')}
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            disabled={!hasResult}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: 'none',
              background: copiedJ ? '#27c93f' : 'rgba(39,201,63,0.1)',
              color: copiedJ ? 'white' : '#27c93f',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.4,
              transition: 'all 0.2s',
              fontFamily: 'monospace',
            }}
          >
            {copiedJ ? t('export.copied_json', '✓ JSON') : t('export.copy_json', '⎘ JSON')}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={!hasResult}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid rgba(39,201,63,0.3)',
              background: 'transparent',
              color: '#27c93f',
              fontSize: '0.8125rem',
              cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.4,
              fontFamily: 'monospace',
            }}
          >
            {t('export.download_json', '↓ .json')}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="terminal-body">
        {hasResult ? (
          <span style={{ color: 'var(--color-terminal-text)' }}>{text}</span>
        ) : (
          <span style={{ color: '#64748b', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            {t('export.empty_result', '// Chưa có kết quả.\n// Hãy gieo quẻ để xem kết quả ở đây.')}
          </span>
        )}
      </div>
    </div>
  );
}
