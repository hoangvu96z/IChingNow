import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const PACKAGES = [
  { id: 'starter', tokens: 10, price: '20.000đ', priceNum: 20000, value: 10, desc: 'Thích hợp gieo quẻ hàng ngày.', color: 'var(--color-ink-muted)' },
  { id: 'deluxe', tokens: 30, price: '50.000đ', priceNum: 50000, value: 30, desc: 'Gói phổ biến, tiết kiệm 16%.', color: 'var(--color-vermillion)', popular: true },
  { id: 'fortune', tokens: 100, price: '150.000đ', priceNum: 150000, value: 100, desc: 'Dành cho các thầy dịch lý xem nhiều.', color: 'var(--color-gold)' }
];

export default function PaymentModal({ isOpen, onClose }) {
  const { user, token, creditTokens } = useAuth();
  
  const [selectedPack, setSelectedPack] = useState(PACKAGES[1]); // Default deluxe
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDemoPayment = async () => {
    if (!token) return;
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tokensToBuy: selectedPack.value })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi xử lý nạp Token.');
      }

      creditTokens(selectedPack.value);
      setSuccessMsg(`🎉 ${data.message}`);
    } catch (err) {
      alert(err.message || 'Lỗi thanh toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(26, 10, 6, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="card animate-in" style={{
        background: 'var(--color-paper)',
        border: '2.5px solid var(--color-gold)',
        maxWidth: 550,
        width: '100%',
        padding: '24px 20px',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Nút đóng */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            fontWeight: 'bold',
            padding: '2px 8px'
          }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h3 style={{
            fontFamily: "'Noto Serif', serif",
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--color-vermillion)',
            margin: '0 0 4px 0'
          }}>
            🪙 NẠP TOKEN LUẬN GIẢI AI
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            Số dư hiện tại: <strong style={{ color: 'var(--color-gold)' }}>{user?.tokens ?? 0} Tokens</strong>
          </p>
        </div>

        {successMsg ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            background: 'rgba(26, 107, 74, 0.08)',
            border: '1.5px solid var(--color-jade)',
            borderRadius: 10,
            margin: '20px 0'
          }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-jade)', margin: '0 0 10px 0' }}>
              {successMsg}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: '0 0 20px 0' }}>
              Tài khoản đã được cộng thêm {selectedPack.value} Tokens. Bạn hiện có {user?.tokens} Tokens.
            </p>
            <button 
              onClick={() => { setSuccessMsg(''); onClose(); }} 
              className="btn-primary"
            >
              Quay lại lập quẻ
            </button>
          </div>
        ) : (
          <>
            {/* Gói Token */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
              marginBottom: 20
            }} className="method-grid">
              {PACKAGES.map(pack => {
                const isSelected = selectedPack.id === pack.id;
                return (
                  <div 
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    style={{
                      border: `1.5px solid ${isSelected ? pack.color : 'rgba(184, 134, 11, 0.25)'}`,
                      background: isSelected ? `${pack.color}08` : 'rgba(255, 255, 255, 0.4)',
                      borderRadius: 10,
                      padding: '16px 10px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    {pack.popular && (
                      <span style={{
                        position: 'absolute',
                        top: -9,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-vermillion)',
                        color: 'white',
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 999,
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                      }}>
                        MUA NHIỀU
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>Mở khóa</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: pack.color, margin: '2px 0' }}>
                      {pack.tokens} 🪙
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                      {pack.price}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)', marginTop: 8, lineHeight: 1.3 }}>
                      {pack.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hướng dẫn chuyển khoản */}
            <div style={{
              background: 'rgba(184, 134, 11, 0.05)',
              border: '1px solid rgba(184, 134, 11, 0.2)',
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: '0.8125rem',
              color: 'var(--color-ink)',
              marginBottom: 20
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-gold-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🏦 CHUYỂN KHOẢN NGÂN HÀNG (MOCK)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Ngân hàng: <strong>DEMOBANK (Ngân hàng Thử nghiệm)</strong></div>
                <div>Số tài khoản: <strong>9999 8888 7777</strong></div>
                <div>Chủ tài khoản: <strong>ICHINGNOW CO., LTD</strong></div>
                <div>Số tiền: <strong>{selectedPack.price}</strong></div>
                <div>Nội dung chuyển khoản: <strong style={{ color: 'var(--color-vermillion)', background: 'rgba(192, 57, 43, 0.07)', padding: '1px 5px', borderRadius: 4 }}>
                  IC {user?.username} {selectedPack.value}
                </strong></div>
              </div>
            </div>

            {/* Nút Demo thanh toán */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                onClick={handleDemoPayment}
                disabled={loading || !user}
                className="btn-primary btn-cta"
                style={{ width: '100%', padding: '12px 0' }}
              >
                {loading ? 'Đang thực hiện giao dịch...' : '⚡ BẤM ĐỂ THANH TOÁN DEMO (Tự động cộng Token)'}
              </button>
              
              {!user && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-vermillion)', textAlign: 'center' }}>
                  ⚠️ Vui lòng đăng nhập hoặc tạo tài khoản để thực hiện giao dịch nạp Token.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
