import React, { useEffect, useState, useCallback, useRef } from 'react';
import { resolveTourStepTarget, clampTooltipPosition } from './guidedTourUtils.js';
import './GuidedTour.css';

export { resolveTourStepTarget, clampTooltipPosition };

/**
 * Interactive step-by-step spotlight walkthrough modal for SpiritNow apps.
 */
export default function GuidedTour({
  isOpen,
  onClose,
  steps = [],
  title = 'Hướng dẫn sử dụng',
  accentColor = '#d4a017',
  language = 'vi',
  footerAction = null,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const cardRef = useRef(null);

  const safeSteps = Array.isArray(steps) ? steps : [];
  const total = safeSteps.length;
  const clampedIndex = total > 0 ? Math.max(0, Math.min(stepIndex, total - 1)) : 0;
  const activeStep = safeSteps[clampedIndex] || null;
  const isEn = language === 'en';

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  const measureTarget = useCallback(() => {
    if (!isOpen || !activeStep || typeof window === 'undefined') {
      setTargetRect(null);
      return;
    }
    const el = resolveTourStepTarget(activeStep, document);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    });
  }, [isOpen, activeStep]);

  useEffect(() => {
    if (!isOpen || !activeStep || typeof window === 'undefined') return undefined;

    const el = resolveTourStepTarget(activeStep, document);
    if (el && typeof el.scrollIntoView === 'function') {
      const reducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        el.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } catch {
        el.scrollIntoView();
      }
    }

    measureTarget();
    const timer1 = setTimeout(measureTarget, 180);
    const timer2 = setTimeout(measureTarget, 420);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isOpen, activeStep, measureTarget]);

  const handleNext = useCallback(() => {
    if (clampedIndex + 1 >= total) {
      onClose?.();
    } else {
      setStepIndex((i) => Math.min(total - 1, i + 1));
    }
  }, [clampedIndex, total, onClose]);

  const handlePrev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || !activeStep) return null;

  const viewport =
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 1280, height: 800 };

  const measuredCard = cardRef.current
    ? { width: cardRef.current.offsetWidth || 380, height: cardRef.current.offsetHeight || 270 }
    : { width: 380, height: 270 };

  const pos = clampTooltipPosition(targetRect, viewport, measuredCard);
  const isMobile = viewport.width <= 600;
  const pad = 6;

  return (
    <div
      className="gt-root"
      style={{ '--gt-accent': accentColor }}
      role="region"
      aria-label={title}
    >
      {/* Dimmed backdrop — renders full backdrop when no target, or spotlight ring cutout when target is visible */}
      {targetRect ? (
        <div
          className="gt-spotlight-ring"
          style={{
            top: Math.max(4, targetRect.top - pad),
            left: Math.max(4, targetRect.left - pad),
            width: Math.min(viewport.width - 8, targetRect.width + pad * 2),
            height: Math.min(viewport.height - 8, targetRect.height + pad * 2),
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="gt-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      {/* Click-outside layer above spotlight box-shadow */}
      {targetRect && (
        <div className="gt-click-catcher" onClick={onClose} aria-hidden="true" />
      )}

      {/* Floating Tour Card */}
      <div
        ref={cardRef}
        className={`gt-card ${isMobile ? 'is-mobile-dock' : ''} ${!targetRect ? 'is-centered' : ''}`}
        style={
          isMobile
            ? undefined
            : {
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                width: `${pos.width}px`,
              }
        }
        aria-live="polite"
      >
        <div className="gt-card-header">
          <div className="gt-step-meta">
            <span className="gt-step-pill">
              {isEn ? `Step ${clampedIndex + 1} / ${total}` : `Bước ${clampedIndex + 1} / ${total}`}
            </span>
            {activeStep.badge && (
              <span className="gt-badge">{activeStep.badge}</span>
            )}
          </div>
          <button
            type="button"
            className="gt-close-btn"
            onClick={onClose}
            aria-label={isEn ? 'Close guide' : 'Đóng hướng dẫn'}
            title={isEn ? 'Close (Esc)' : 'Đóng (Esc)'}
          >
            ✕
          </button>
        </div>

        <h3 className="gt-title">{activeStep.title}</h3>
        <p className="gt-body">{activeStep.body}</p>

        {activeStep.tip && (
          <div className="gt-tip">
            {activeStep.tip}
          </div>
        )}

        {!targetRect && activeStep.fallbackNote && (
          <div className="gt-fallback-note">
            {activeStep.fallbackNote}
          </div>
        )}

        {activeStep.ctaLink && (
          <div className="gt-cta-row">
            <a
              href={activeStep.ctaLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="gt-cta-link"
            >
              {activeStep.ctaLink.label} ↗
            </a>
          </div>
        )}

        <div className="gt-dots" role="tablist" aria-label={isEn ? 'Guide steps' : 'Các bước hướng dẫn'}>
          {safeSteps.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              role="tab"
              aria-selected={idx === clampedIndex}
              aria-label={s.title}
              className={`gt-dot ${idx === clampedIndex ? 'is-active' : ''}`}
              onClick={() => setStepIndex(idx)}
            />
          ))}
        </div>

        <div className="gt-footer">
          <div className="gt-footer-left">
            {footerAction && (
              <button
                type="button"
                className="gt-btn-ghost"
                onClick={() => {
                  onClose?.();
                  footerAction.onClick?.();
                }}
              >
                {footerAction.label}
              </button>
            )}
          </div>
          <div className="gt-footer-nav">
            {clampedIndex > 0 && (
              <button type="button" className="gt-btn-secondary" onClick={handlePrev}>
                {isEn ? '← Back' : '← Trước'}
              </button>
            )}
            <button type="button" className="gt-btn-primary" onClick={handleNext}>
              {clampedIndex + 1 >= total
                ? isEn
                  ? '✓ Done'
                  : '✓ Hoàn tất'
                : isEn
                  ? 'Next →'
                  : 'Tiếp →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
