import React, { useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { NoteNowFeatureCards } from './OnboardingModal.jsx';

export default function HelpModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="nn-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="nn-modal nn-onboarding-modal nn-help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div className="nn-onboarding-header">
          <div
            className="nn-onboarding-icon"
            aria-hidden="true"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <HelpCircle size={28} strokeWidth={2.2} color="var(--accent)" />
          </div>
          <h2 id="help-title" className="nn-onboarding-title">
            {t('help.title', 'Hướng dẫn & Tính năng')}
          </h2>
          <p className="nn-onboarding-sub">
            {t('help.sub', 'Khám phá các tính năng và cách sử dụng NoteNow hiệu quả')}
          </p>
          <button
            className="nn-modal-close nn-onboarding-close"
            onClick={onClose}
            aria-label={t('help.close_btn', 'Đóng')}
            title={`${t('help.close_btn', 'Đóng')} (Esc)`}
            type="button"
            id="btn-help-close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="nn-onboarding-body">
          <NoteNowFeatureCards />
        </div>

        <div className="nn-onboarding-footer">
          <button
            className="btn btn-primary nn-onboarding-start-btn"
            onClick={onClose}
            type="button"
            id="btn-help-dismiss"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {t('help.close_btn', 'Đóng')}
          </button>
        </div>
      </div>
    </div>
  );
}
