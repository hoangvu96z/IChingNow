import React, { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import HexagramDisplay from './HexagramDisplay.jsx';
import { buildIChingShareCardModel } from '../utils/ichingShareCard.js';

const CARD_STYLE = {
  width: 'min(360px, calc(100vw - 32px))',
  maxWidth: '100%',
  minHeight: 450,
  boxSizing: 'border-box',
  padding: 26,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 16,
  overflow: 'hidden',
  position: 'relative',
  color: '#f8f1df',
  background: 'radial-gradient(circle at 50% 0%, #3b2c17 0%, #17140f 46%, #0d0c0a 100%)',
  border: '1px solid rgba(221, 180, 92, 0.55)',
  borderRadius: 22,
  fontFamily: "'Be Vietnam Pro', 'Noto Serif', serif",
};

const actionStyle = {
  border: '1px solid var(--color-gold, #8a6104)',
  borderRadius: 10,
  padding: '9px 14px',
  color: 'var(--color-gold, #8a6104)',
  background: 'var(--color-paper-dark, rgba(184, 134, 11, 0.14))',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function IChingShareCard({ result, language = 'vi' }) {
  const cardRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const model = buildIChingShareCardModel(result);

  const copy = useCallback((viText, enText) => language === 'en' ? enText : viText, [language]);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `iching-reading-${date}.png`;

  const generateBlob = useCallback(async () => {
    if (!cardRef.current || busy) return null;
    setBusy(true);
    setMessage(copy('Đang tạo ảnh...', 'Creating image...'));
    try {
      // Allow the preview to paint before html-to-image clones the DOM.
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#0d0c0a',
      });
      return await (await fetch(dataUrl)).blob();
    } catch (error) {
      console.error('IChing share card generation failed:', error);
      setMessage(copy('Không tạo được ảnh. Hãy thử lại.', 'Could not create image. Please try again.'));
      return null;
    } finally {
      setBusy(false);
    }
  }, [busy, copy]);

  const handleDownload = useCallback(async () => {
    const blob = await generateBlob();
    if (!blob) return;
    downloadBlob(blob, filename);
    setMessage(copy('Đã tải ảnh quẻ.', 'Hexagram image downloaded.'));
  }, [copy, filename, generateBlob]);

  const handleCopy = useCallback(async () => {
    const blob = await generateBlob();
    if (!blob) return;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard image write is unsupported');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setMessage(copy('Đã chép ảnh vào clipboard.', 'Image copied to clipboard.'));
    } catch {
      downloadBlob(blob, filename);
      setMessage(copy('Trình duyệt chưa hỗ trợ chép ảnh; đã tải ảnh xuống.', 'Clipboard image copy is unavailable; image downloaded.'));
    }
  }, [copy, filename, generateBlob]);

  const handleShare = useCallback(async () => {
    const blob = await generateBlob();
    if (!blob) return;
    const file = new File([blob], filename, { type: 'image/png' });
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const text = `${model.primary.name}${model.changed ? ` → ${model.changed.name}` : ''} · IChingNow`;

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: copy('Kết quả quẻ Kinh Dịch', 'I Ching reading'),
          text: `${text}\n${shareUrl}`,
          files: [file],
        });
        setMessage(copy('Đã chia sẻ ảnh quẻ.', 'Hexagram image shared.'));
        return;
      }
      downloadBlob(blob, filename);
      setMessage(copy('Thiết bị chưa hỗ trợ chia sẻ ảnh; đã tải ảnh xuống.', 'Image sharing is unavailable; image downloaded.'));
    } catch (error) {
      if (error?.name !== 'AbortError') {
        downloadBlob(blob, filename);
        setMessage(copy('Không thể chia sẻ; đã tải ảnh xuống.', 'Could not share; image downloaded.'));
      }
    }
  }, [copy, filename, generateBlob, model]);

  if (!model) return null;

  return (
    <section style={{ marginTop: 18 }} aria-label={copy('Chia sẻ quẻ', 'Share reading')}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        style={{ ...actionStyle, display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <span aria-hidden="true">✦</span>
        {expanded
          ? copy('Ẩn thẻ chia sẻ', 'Hide share card')
          : copy('Tạo thẻ chia sẻ', 'Create share card')}
      </button>

      {expanded && (
        <div style={{ marginTop: 14, display: 'grid', justifyItems: 'start', gap: 12 }}>
          <div ref={cardRef} style={CARD_STYLE}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 12, border: '1px solid rgba(221,180,92,0.18)', borderRadius: 15, pointerEvents: 'none' }} />
            <header style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ color: '#e5c158', fontSize: 10, letterSpacing: '0.28em', fontWeight: 800 }}>
                I CHING NOW
              </div>
              <h2 style={{ margin: '7px 0 0', color: '#fff4d4', fontSize: 19, fontFamily: "'Noto Serif', serif", letterSpacing: '0.03em' }}>
                {copy('KẾT QUẢ QUẺ KINH DỊCH', 'I CHING READING')}
              </h2>
            </header>

            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: model.changed ? '1fr 1fr' : '1fr', gap: 12, alignItems: 'start' }}>
              <ShareHexagram hexagram={model.primary} label={copy('QUẺ CHỦ', 'PRIMARY')} accent="#e5c158" copy={copy} />
              {model.changed && (
                <ShareHexagram hexagram={model.changed} label={copy('QUẺ BIẾN', 'CHANGED')} accent="#78bd98" copy={copy} />
              )}
            </div>

            {model.primary.overview && (
              <div style={{ position: 'relative', borderTop: '1px solid rgba(229,193,88,0.3)', paddingTop: 12 }}>
                <div style={{ color: '#e5c158', fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, marginBottom: 6 }}>
                  {copy('TỔNG QUAN QUẺ', 'HEXAGRAM OVERVIEW')}
                </div>
                <p style={{ margin: 0, color: '#eee4ce', fontSize: 12, lineHeight: 1.55, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                  {model.primary.overview}
                </p>
              </div>
            )}

            <footer style={{ position: 'relative', borderTop: '1px solid rgba(229,193,88,0.22)', paddingTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#bda978', fontSize: 10, letterSpacing: '0.1em' }}>
              <span>{copy('GIEO QUẺ · CHIÊM NGHIỆM', 'CAST · REFLECT')}</span>
              <span style={{ fontWeight: 800, color: '#e5c158' }}>IChingNow</span>
            </footer>
            <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px 4px', color: '#bda978', fontSize: 9, lineHeight: 1.4, textAlign: 'center' }}>
              <span>{copy('Thoán từ được chép nguyên văn từ Wikisource · người đóng góp Wikimedia ·', 'Judgment reproduced unchanged from Wikisource · Wikimedia contributors ·')}</span>
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" style={{ color: '#e5c158', overflowWrap: 'anywhere' }}>
                CC BY-SA 4.0 · creativecommons.org/licenses/by-sa/4.0/
              </a>
              <span>{copy('· Chia sẻ tương tự', '· ShareAlike')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" onClick={handleShare} disabled={busy} style={actionStyle}>
              {busy ? copy('Đang tạo ảnh…', 'Creating…') : copy('Chia sẻ', 'Share')}
            </button>
            <button type="button" onClick={handleDownload} disabled={busy} style={actionStyle}>
              {copy('Tải ảnh PNG', 'Download PNG')}
            </button>
            <button type="button" onClick={handleCopy} disabled={busy} style={actionStyle}>
              {copy('Chép ảnh', 'Copy image')}
            </button>
          </div>
          {message && <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-muted)' }}>{message}</p>}
        </div>
      )}
    </section>
  );
}

function ShareHexagram({ hexagram, label, accent, copy }) {
  return (
    <div style={{ minWidth: 0, display: 'grid', justifyItems: 'center', gap: 5, textAlign: 'center' }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', color: accent }}>{label}</div>
      {hexagram.chinese && <div lang="zh" style={{ fontFamily: "'Noto Serif', serif", fontSize: 26, lineHeight: 1, color: '#e5c158' }}>{hexagram.chinese}</div>}
      <div style={{ width: '100%', maxWidth: 112, padding: '0 8px' }}>
        <HexagramDisplay lines={hexagram.lines} size="md" />
      </div>
      <div style={{ color: '#fff4d4', fontFamily: "'Noto Serif', serif", fontWeight: 800, fontSize: 13, lineHeight: 1.25 }}>
        {hexagram.name || `#${hexagram.id}`}
      </div>
      <div style={{ color: '#bda978', fontSize: 10 }}>{`#${hexagram.id}`}</div>
      <div style={{ width: '100%', borderTop: '1px solid rgba(229,193,88,0.24)', paddingTop: 6 }}>
        <div style={{ color: accent, fontSize: 9, fontWeight: 800, lineHeight: 1.3 }}>
          {copy('Thoán từ (卦辭)', 'Judgment (卦辭)')}
        </div>
        <p lang="zh-Hant" style={{ margin: '4px 0', color: '#eee4ce', fontFamily: "'Noto Serif', serif", fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
          {hexagram.classicalChineseJudgement}
        </p>
        <a
          href={hexagram.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={hexagram.attributionLicenseNote}
          style={{ display: 'block', color: '#bda978', fontSize: 8, lineHeight: 1.25, overflowWrap: 'anywhere' }}
        >
          {hexagram.sourceUrl.replace(/^https?:\/\//, '')}
        </a>
      </div>
    </div>
  );
}
