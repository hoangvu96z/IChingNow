import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

const SSO_BASE = import.meta.env.VITE_SSO_URL || '';

const DEFAULT_PLANS = [
  {
    name: 'free',
    labelVi: 'Miễn Phí',
    labelEn: 'Free',
    emoji: '⚡',
    price: 0,
    dailyLimit: 1,
    monthlyLimit: 30,
    canBonus: false,
    color: '#a3a3a3',
    highlight: false,
  },
  {
    name: 'lite',
    labelVi: 'Lite',
    labelEn: 'Lite',
    emoji: '🌟',
    price: 49000,
    dailyLimit: 5,
    monthlyLimit: 60,
    canBonus: false,
    color: '#f59e0b',
    highlight: false,
  },
  {
    name: 'premium',
    labelVi: 'Premium',
    labelEn: 'Premium',
    emoji: '💎',
    price: 99000,
    dailyLimit: -1,
    monthlyLimit: 180,
    canBonus: true,
    color: '#f5d78e',
    highlight: true,
  },
];

export default function PricingModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  canBonus = false,
  onRequestBonus,
  onApplyCoupon,
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
    if (isOpen) {
      fetch(`${SSO_BASE}/plans/config`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.plans) && data.plans.length > 0) {
            const merged = data.plans.map((p) => {
              const meta = DEFAULT_PLANS.find((dp) => dp.name === p.name) || {};
              return {
                ...meta,
                ...p,
                label: isEn ? (meta.labelEn || p.label) : (p.label || meta.labelVi),
                emoji: meta.emoji || '📦',
                color: meta.color || '#f5d78e',
                highlight: p.name === 'premium',
              };
            });
            setDynamicPlans(merged);
          }
        })
        .catch((err) => console.error('Failed to load plans config:', err));
    }
  }, [isOpen, isEn]);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg('');
    const result = await onApplyCoupon(couponCode.trim());
    setCouponMsg(result.ok ? `✅ ${result.message}` : `❌ ${result.error}`);
    setCouponLoading(false);
    if (result.ok) setTimeout(onClose, 2000);
  };

  const handleBonus = async () => {
    setBonusLoading(true);
    const result = await onRequestBonus();
    setBonusLoading(false);
    if (result.ok) {
      onClose();
    } else {
      alert(result.error || (isEn ? 'Failed to request bonus' : 'Không thể xin thêm câu'));
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return isEn ? 'Free' : 'Miễn phí';
    return `${Number(price).toLocaleString('vi-VN')}đ`;
  };

  const getFeatures = (plan) => {
    const dailyText = isEn
      ? (plan.dailyLimit === -1 ? 'Unlimited AI asks/day' : `${plan.dailyLimit} AI ask(s) per day`)
      : (plan.dailyLimit === -1 ? 'Không giới hạn lượt/ngày' : `${plan.dailyLimit} lượt hỏi AI mỗi ngày`);

    const monthlyText = isEn
      ? (plan.monthlyLimit === -1 ? 'Unlimited asks/month' : `Max ${plan.monthlyLimit} asks/month`)
      : (plan.monthlyLimit === -1 ? 'Không giới hạn lượt/tháng' : `Tối đa ${plan.monthlyLimit} lượt/tháng`);

    if (plan.name === 'free') {
      return [
        dailyText,
        monthlyText,
        isEn ? 'Save reading history' : 'Lưu lịch sử quẻ',
        isEn ? 'Basic hexagram interpretation' : 'Xem giải nghĩa cơ bản',
      ];
    }
    if (plan.name === 'lite') {
      return [
        dailyText,
        monthlyText,
        isEn ? 'Unlimited history saving' : 'Lưu lịch sử không giới hạn',
        isEn ? 'In-depth AI analysis' : 'Giải nghĩa chi tiết hơn',
      ];
    }
    return [
      dailyText,
      monthlyText,
      isEn ? '✨ 5 follow-up questions per reading' : '✨ Hỏi thêm 5 câu AI cho mỗi quẻ',
      isEn ? 'Deepest AI I Ching insights' : 'Phân tích AI sâu nhất',
      isEn ? 'Priority customer support' : 'Ưu tiên hỗ trợ',
    ];
  };

  const getNotIncluded = (plan) => {
    if (plan.name === 'free') {
      return [
        isEn ? '5 follow-up questions per reading' : 'Hỏi thêm 5 câu cho mỗi quẻ',
        isEn ? 'Priority support' : 'Ưu tiên hỗ trợ',
      ];
    }
    if (plan.name === 'lite') {
      return [
        isEn ? '5 follow-up questions per reading' : 'Hỏi thêm 5 câu cho mỗi quẻ',
      ];
    }
    return [];
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 7, 3, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #1c0d08 0%, #3a190b 100%)',
        border: '1px solid rgba(184, 134, 11, 0.4)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '760px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.7), 0 0 30px rgba(184, 134, 11, 0.15)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>☯️</div>
          <h2 style={{ color: '#f5d78e', fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: "'Noto Serif', serif" }}>
            {isEn ? 'Upgrade Your I Ching Plan' : 'Nâng Cấp Gói Luận Giải Kinh Dịch'}
          </h2>
          <p style={{ color: '#d4b886', fontSize: '0.9rem', marginTop: '8px' }}>
            {isEn ? 'You have reached your daily AI quota limit.' : 'Bạn đã dùng hết lượt luận giải AI hôm nay.'}{' '}
            {canBonus && <strong style={{ color: '#f5d78e' }}>{isEn ? 'Or use "Ask 5 Follow-ups" now!' : 'Hoặc dùng "Hỏi thêm 5 câu" ngay bây giờ!'}</strong>}
          </p>
        </div>

        {/* Bonus button (Premium only) */}
        {canBonus && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.25), rgba(139, 69, 19, 0.3))',
            border: '1px solid rgba(184, 134, 11, 0.5)',
            borderRadius: '14px', padding: '16px', marginBottom: '24px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#f5d78e', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 600 }}>
              {isEn ? '💎 You are on Premium plan — ask 5 follow-up questions for this reading!' : '💎 Bạn đang dùng gói Premium — có thể hỏi thêm 5 câu cho quẻ này!'}
            </div>
            <button
              onClick={handleBonus}
              disabled={bonusLoading}
              style={{
                background: 'linear-gradient(135deg, #b8860b, #d97706)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '10px 24px', fontSize: '0.9rem', fontWeight: 700,
                cursor: bonusLoading ? 'not-allowed' : 'pointer',
                opacity: bonusLoading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(184,134,11,0.4)',
              }}
            >
              {bonusLoading ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? '✨ Ask 5 Questions Now' : '✨ Hỏi thêm 5 câu ngay')}
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {dynamicPlans.map((plan) => {
            const features = getFeatures(plan);
            const notIncluded = getNotIncluded(plan);

            return (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight
                    ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.2), rgba(139, 69, 19, 0.25))'
                    : 'rgba(255, 248, 235, 0.04)',
                  border: `1px solid ${plan.highlight ? 'rgba(184, 134, 11, 0.6)' : 'rgba(184, 134, 11, 0.2)'}`,
                  borderRadius: '14px',
                  padding: '20px',
                  position: 'relative',
                  transform: plan.highlight ? 'scale(1.02)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #b8860b, #d97706)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isEn ? 'RECOMMENDED' : 'ĐỀ XUẤT'}
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '1.5rem' }}>{plan.emoji}</div>
                  <div style={{ color: '#f5d78e', fontWeight: 800, fontSize: '1rem', marginTop: '4px' }}>
                    {plan.label}
                  </div>
                  <div style={{ color: plan.color, fontWeight: 800, fontSize: '1.3rem', marginTop: '4px' }}>
                    {formatPrice(plan.price)}
                    {plan.price > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>{isEn ? '/month' : '/tháng'}</span>
                    )}
                  </div>
                </div>

                {features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: '#e5e5e5',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ color: '#f5d78e', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}

                {notIncluded.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: '#737373',
                      marginBottom: '6px',
                      textDecoration: 'line-through',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>✕</span> {f}
                  </div>
                ))}

                {plan.name !== 'free' && plan.name !== currentPlan && (
                  <button
                    onClick={() => alert(isEn ? 'Please contact Admin to upgrade your plan!' : 'Liên hệ admin để nâng cấp gói!')}
                    style={{
                      width: '100%',
                      marginTop: '14px',
                      background: plan.highlight
                        ? 'linear-gradient(135deg, #b8860b, #d97706)'
                        : 'rgba(184, 134, 11, 0.15)',
                      color: '#fff',
                      border: plan.highlight ? 'none' : '1px solid rgba(184, 134, 11, 0.3)',
                      borderRadius: '8px',
                      padding: '9px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isEn ? `Upgrade ${plan.label}` : `Nâng cấp ${plan.label}`}
                  </button>
                )}
                {plan.name === currentPlan && (
                  <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.78rem', color: '#737373' }}>
                    {isEn ? 'Current Plan' : 'Gói hiện tại'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coupon input */}
        <div style={{
          background: 'rgba(184, 134, 11, 0.06)',
          border: '1px solid rgba(184, 134, 11, 0.2)',
          borderRadius: '12px', padding: '16px',
        }}>
          <div style={{ color: '#d4b886', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
            {isEn ? '🎟️ Have a promo code? Enter here' : '🎟️ Có mã khuyến mãi? Nhập tại đây'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              placeholder={isEn ? 'e.g. TRIAL7, PROMO50...' : 'VD: TRIAL7, PREMIUM30...'}
              style={{
                flex: 1, background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(184, 134, 11, 0.3)',
                color: '#f5d78e', borderRadius: '8px',
                padding: '9px 14px', fontSize: '0.88rem', outline: 'none',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              style={{
                background: 'linear-gradient(135deg, #b8860b, #d97706)',
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '9px 18px', fontSize: '0.85rem', fontWeight: 700,
                cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                opacity: couponLoading || !couponCode.trim() ? 0.6 : 1,
              }}
            >
              {couponLoading ? '...' : (isEn ? 'Apply' : 'Áp dụng')}
            </button>
          </div>
          {couponMsg && (
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: couponMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>
              {couponMsg}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '16px',
            background: 'transparent', color: '#a3a3a3',
            border: '1px solid rgba(184, 134, 11, 0.2)',
            borderRadius: '10px', padding: '10px',
            fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {isEn ? 'Maybe later — return tomorrow' : 'Để sau — quay lại ngày mai'}
        </button>
      </div>
    </div>
  );
}
