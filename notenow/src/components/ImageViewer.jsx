import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Full-screen image lightbox viewer.
 * Props:
 *   images   – array of { url } objects
 *   index    – currently displayed index
 *   onClose  – callback to close viewer
 *   onChange – callback(newIndex) to navigate
 *   ssoBase  – base URL for relative image URLs
 */
export default function ImageViewer({ images, index, onClose, onChange, ssoBase = '' }) {
  const { t } = useLanguage();
  const total = images.length;
  const img = images[index];
  const src = img?.url
    ? (img.url.startsWith('data:') || img.url.startsWith('http') ? img.url : `${ssoBase}${img.url}`)
    : '';

  const goPrev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
  const goNext = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && total > 1) goPrev();
      if (e.key === 'ArrowRight' && total > 1) goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext, total]);

  if (!img) return null;

  return (
    <div
      className="nn-img-viewer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('viewer.aria_label', 'Xem ảnh')}
    >
      {/* Close button */}
      <button
        className="nn-img-viewer-close"
        onClick={onClose}
        aria-label={t('viewer.close', 'Đóng')}
        type="button"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={20} strokeWidth={2.5} />
      </button>

      {/* Counter */}
      {total > 1 && (
        <div className="nn-img-viewer-counter">
          {index + 1} / {total}
        </div>
      )}

      {/* Prev arrow */}
      {total > 1 && (
        <button
          className="nn-img-viewer-arrow nn-img-viewer-prev"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label={t('viewer.prev', 'Ảnh trước')}
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Image */}
      <img
        className="nn-img-viewer-img"
        src={src}
        alt={`Ảnh ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next arrow */}
      {total > 1 && (
        <button
          className="nn-img-viewer-arrow nn-img-viewer-next"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label={t('viewer.next', 'Ảnh tiếp theo')}
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Thumbnails strip */}
      {total > 1 && (
        <div className="nn-img-viewer-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((thumb, i) => {
            const thumbSrc = thumb.url.startsWith('data:') || thumb.url.startsWith('http')
              ? thumb.url
              : `${ssoBase}${thumb.url}`;
            return (
              <button
                key={i}
                className={`nn-img-viewer-thumb${i === index ? ' active' : ''}`}
                onClick={() => onChange(i)}
                type="button"
                aria-label={`${t('viewer.aria_label', 'Xem ảnh')} ${i + 1}`}
              >
                <img src={thumbSrc} alt={`Thumbnail ${i + 1}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
