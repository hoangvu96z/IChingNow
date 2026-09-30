import React, { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

/**
 * ShareCard — Generates a beautiful, compact social sharing card
 * for the user's Tử Vi chart. Designed for Facebook/Zalo/Instagram.
 *
 * Features:
 * - Compact summary card (not the full chart grid)
 * - Beautiful gradient background
 * - TuViNow watermark for viral branding
 * - Web Share API integration (or fallback to download)
 * - Copy image to clipboard
 */
export default function ShareCard({ result, inputData }) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [showCard, setShowCard] = useState(false);

  if (!result || !result.palates) return null;

  const { amDuongNamNu, canChiNam, banMenhNapAm, cucName,
    chuMenh, chuThan, menhCung, thanCung, palates } = result;

  const menhPalace = palates.find(p => p.isMenh);
  const thanPalace = palates.find(p => p.isThan);
  const menhStars = menhPalace?.chinhTinh?.join(', ') || 'Không có chính tinh';

  const isDark = typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';

  // Determine element based on Nạp Âm
  const getElementEmoji = (napAm) => {
    if (!napAm) return '🔮';
    if (napAm.includes('Kim')) return '🪙';
    if (napAm.includes('Mộc')) return '🌿';
    if (napAm.includes('Thủy')) return '💧';
    if (napAm.includes('Hỏa')) return '🔥';
    if (napAm.includes('Thổ')) return '⛰️';
    return '🔮';
  };

  const elementEmoji = getElementEmoji(banMenhNapAm);

  const generateShareImage = useCallback(async () => {
    if (!cardRef.current || isGenerating) return null;
    setIsGenerating(true);
    setShareMessage('Đang tạo ảnh chia sẻ...');
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: 'transparent',
        skipFonts: true,
      });
      return dataUrl;
    } catch (err) {
      console.error('Share card generation failed:', err);
      setShareMessage('Lỗi tạo ảnh. Vui lòng thử lại!');
      setTimeout(() => setShareMessage(''), 3000);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateShareImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    const raw = (inputData?.name || 'tuvi-share')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    link.download = `${raw || 'tuvi-share'}-card.png`;
    link.href = dataUrl;
    link.click();
    setShareMessage('Đã tải ảnh thành công! 🎉');
    setTimeout(() => setShareMessage(''), 3000);
  }, [generateShareImage, inputData]);

  const handleShare = useCallback(async () => {
    const dataUrl = await generateShareImage();
    if (!dataUrl) return;

    // Convert data URL to Blob for Web Share API
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'tuvi-share.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Lá Số Tử Vi — ${inputData?.name || ''}`,
          text: `Xem lá số Tử Vi của ${inputData?.name || 'tôi'} tại TuViNow! ${canChiNam} · ${banMenhNapAm} · Mệnh ${menhCung}`,
          files: [file],
        });
        setShareMessage('Chia sẻ thành công! ✨');
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setShareMessage('Đã copy ảnh vào clipboard! Dán vào Zalo/Facebook để chia sẻ 📋');
        } catch {
          // Final fallback: download
          handleDownload();
          return;
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShareMessage('Không thể chia sẻ. Đã tải ảnh thay thế.');
        handleDownload();
      }
    }
    setTimeout(() => setShareMessage(''), 4000);
  }, [generateShareImage, inputData, canChiNam, banMenhNapAm, menhCung, handleDownload]);

  const handleCopyImage = useCallback(async () => {
    const dataUrl = await generateShareImage();
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setShareMessage('Đã copy ảnh vào clipboard! 📋');
    } catch {
      setShareMessage('Trình duyệt không hỗ trợ copy ảnh. Hãy tải ảnh thay thế.');
      handleDownload();
    }
    setTimeout(() => setShareMessage(''), 3000);
  }, [generateShareImage, handleDownload]);

  return (
    <div className="share-card-wrapper">
      <button
        type="button"
        className="share-card-toggle-btn"
        onClick={() => setShowCard(v => !v)}
      >
        {showCard ? '✕ Đóng' : '🌟 Chia sẻ lá số lên mạng xã hội'}
      </button>

      {showCard && (
        <div className="share-card-area">
          {/* The card to be captured */}
          <div ref={cardRef} className="share-card" data-theme-override={isDark ? 'dark' : 'light'}>
            {/* Background decorations */}
            <div className="share-card-bg-pattern" />

            {/* Header */}
            <div className="share-card-header">
              <span className="share-card-element-emoji">{elementEmoji}</span>
              <div className="share-card-title-group">
                <h3 className="share-card-name">{inputData?.name || 'Lá Số Tử Vi'}</h3>
                <p className="share-card-subtitle">{canChiNam} · {amDuongNamNu}</p>
              </div>
            </div>

            {/* Main info grid */}
            <div className="share-card-grid">
              <div className="share-card-item">
                <span className="share-card-item-label">Bản Mệnh</span>
                <span className="share-card-item-value highlight">{banMenhNapAm}</span>
              </div>
              <div className="share-card-item">
                <span className="share-card-item-label">Cục</span>
                <span className="share-card-item-value">{cucName}</span>
              </div>
              <div className="share-card-item">
                <span className="share-card-item-label">Cung Mệnh</span>
                <span className="share-card-item-value highlight">{menhCung}</span>
              </div>
              <div className="share-card-item">
                <span className="share-card-item-label">Cung Thân</span>
                <span className="share-card-item-value">{thanCung}</span>
              </div>
              <div className="share-card-item span-2">
                <span className="share-card-item-label">Chính Tinh tại Mệnh</span>
                <span className="share-card-item-value highlight">{menhStars}</span>
              </div>
              <div className="share-card-item">
                <span className="share-card-item-label">Chủ Mệnh</span>
                <span className="share-card-item-value">{chuMenh}</span>
              </div>
              <div className="share-card-item">
                <span className="share-card-item-label">Chủ Thân</span>
                <span className="share-card-item-value">{chuThan}</span>
              </div>
            </div>

            {/* Watermark */}
            <div className="share-card-watermark">
              <span className="share-card-watermark-logo">✦</span>
              <span>TuViNow</span>
              <span className="share-card-watermark-dot">·</span>
              <span>Tử Vi Đẩu Số Online</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="share-card-actions">
            <button type="button" className="share-btn share-btn-primary" onClick={handleShare} disabled={isGenerating}>
              {isGenerating ? '⏳ Đang tạo...' : '📤 Chia sẻ'}
            </button>
            <button type="button" className="share-btn share-btn-secondary" onClick={handleDownload} disabled={isGenerating}>
              📸 Tải ảnh
            </button>
            <button type="button" className="share-btn share-btn-secondary" onClick={handleCopyImage} disabled={isGenerating}>
              📋 Copy ảnh
            </button>
          </div>

          {shareMessage && (
            <div className="share-card-message">{shareMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
