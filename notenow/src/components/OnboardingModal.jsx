import React, { useEffect } from 'react';
import { Sparkles, X, FileText, Clock, Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export function NoteNowFeatureCards() {
  const { t } = useLanguage();

  return (
    <>
      <div className="nn-onboarding-feature">
        <div className="nn-feature-badge green" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={20} strokeWidth={2} />
        </div>
        <div className="nn-feature-content">
          <h4>{t('onboarding.f1_title', 'Ghi chú nhanh & Định dạng phong phú')}</h4>
          <p>{t('onboarding.f1_desc', 'Soạn thảo trực quan với chữ đậm, nghiêng, gạch chân, danh sách và màu sắc. Hỗ trợ tải lên tối đa 2 hình ảnh (nén 720p).')}</p>
        </div>
      </div>

      <div className="nn-onboarding-feature">
        <div className="nn-feature-badge blue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={20} strokeWidth={2} />
        </div>
        <div className="nn-feature-content">
          <h4>{t('onboarding.f2_title', 'Chính sách lưu trữ thông minh')}</h4>
          <ul>
            <li><strong>{t('onboarding.f2_guest_label', 'Khách chưa đăng nhập:')}</strong> {t('onboarding.f2_guest_text', 'Tối đa 2.048 ký tự, ghi chú tự xóa sau 60 ngày.')}</li>
            <li><strong>{t('onboarding.f2_user_label', 'Đăng nhập SSO:')}</strong> {t('onboarding.f2_user_text', 'Mở rộng 10.000 ký tự. 30 note đầu lưu vĩnh viễn, từ note 31 lưu 180 ngày.')}</li>
          </ul>
        </div>
      </div>

      <div className="nn-onboarding-feature">
        <div className="nn-feature-badge purple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Share2 size={20} strokeWidth={2} />
        </div>
        <div className="nn-feature-content">
          <h4>{t('onboarding.f3_title', 'Chia sẻ & Phân quyền linh hoạt')}</h4>
          <p>{t('onboarding.f3_desc', 'Tạo liên kết chia sẻ cho phép xem hoặc sửa trực tiếp. Người dùng SSO có thể mời bạn bè qua email dễ dàng.')}</p>
        </div>
      </div>
    </>
  );
}

export default function OnboardingModal({ isOpen, onClose }) {
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
      <div className="nn-modal nn-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="nn-onboarding-header">
          <div className="nn-onboarding-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={28} strokeWidth={2.2} color="var(--accent)" />
          </div>
          <h2 id="onboarding-title" className="nn-onboarding-title">{t('onboarding.title', 'Chào mừng đến với NoteNow!')}</h2>
          <p className="nn-onboarding-sub">{t('onboarding.sub', 'Ghi chú thông minh, định dạng phong phú theo phong cách Google Keep')}</p>
          <button
            className="nn-modal-close nn-onboarding-close"
            onClick={onClose}
            aria-label={t('editor.btn_close', 'Đóng')}
            title={`${t('editor.btn_close', 'Đóng')} (Esc)`}
            type="button"
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
            id="btn-onboarding-start"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Sparkles size={16} strokeWidth={2.5} /> {t('onboarding.start_btn', 'Bắt đầu ghi chú')}
          </button>
        </div>
      </div>
    </div>
  );
}
