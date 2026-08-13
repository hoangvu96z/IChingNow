import React, { useState } from 'react';
import { buildPlainTextResult } from '../logic/buildPlainText.js';
import { copyToClipboard, downloadTxt, downloadJson } from '../logic/clipboard.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Card plaintext – nền tối, monospace, nút copy + download
 */
export default function PlainTextExportCard({ result }) {
  const { t, language } = useLanguage();
  const { isAuthenticated, login } = useAuth();
  const [copied, setCopied]   = useState(false);
  const [copiedJ, setCopiedJ] = useState(false);

  const hasResult = !!result;
  const text = hasResult ? buildPlainTextResult(result, language) : '';

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

  if (!isAuthenticated) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed rgba(184, 134, 11, 0.3)',
          borderRadius: 12,
          padding: '24px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: '1.8rem' }}>🔒</span>
        <p
          style={{
            margin: 0,
            fontSize: '0.88rem',
            color: 'var(--color-ink-muted, #718096)',
            lineHeight: 1.5,
            maxWidth: 640,
          }}
        >
          {t('export.guest_notice', 'Bạn cần đăng nhập để sử dụng tính năng xuất kết quả quẻ Kinh Dịch.')}
        </p>
        <button
          type="button"
          onClick={login}
          style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
            border: 'none',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124,92,252,0.4)',
          }}
        >
          🔑 {t('auth.login_now', 'Đăng nhập ngay')}
        </button>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      {/* Header */}
      <div className="terminal-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="terminal-dot" style={{ background: '#ff5f56' }} />
          <div className="terminal-dot" style={{ background: '#ffbd2e' }} />
          <div className="terminal-dot" style={{ background: '#27c93f' }} />
          <span style={{ marginLeft: 8, color: '#718096', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
            {t('export.header', 'plaintext — kết quả lập quẻ')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
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
            onClick={handleDownloadTxt}
            disabled={!hasResult}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid rgba(113,128,150,0.4)',
              background: 'transparent',
              color: '#718096',
              fontSize: '0.8125rem',
              cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.4,
              fontFamily: 'monospace',
            }}
          >
            {t('export.download_txt', '↓ .txt')}
          </button>

          <button
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
          <span style={{ color: '#4a5568', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            {t('export.empty_result', '// Chưa có kết quả.\n// Hãy gieo quẻ để xem kết quả ở đây.')}
          </span>
        )}
      </div>
    </div>
  );
}
