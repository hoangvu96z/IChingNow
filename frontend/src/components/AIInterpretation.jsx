import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AIInterpretation({ result, mode, onAuthClick, onPaymentClick }) {
  const { user, token, deductToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [error, setError] = useState('');

  const handleAIInterpret = async () => {
    if (!token) {
      onAuthClick();
      return;
    }
    if (user && user.tokens < 1) {
      onPaymentClick();
      return;
    }

    setLoading(true);
    setError('');
    setInterpretation('');

    try {
      const isMaiHoa = mode.startsWith('mai-hoa');
      const payload = {
        question: result.question || '',
        primaryHex: result.primaryHexagram,
        changedHex: result.changedHexagram,
        movingLines: isMaiHoa ? [result.movingLine] : result.movingLines,
        mode
      };

      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi kết nối máy chủ AI.');
      }

      deductToken(1);
      setInterpretation(data.interpretation);
    } catch (err) {
      setError(err.message || 'Lỗi hệ thống luận giải AI.');
    } finally {
      setLoading(false);
    }
  };

  // Trình phân tích Markdown thô cực đơn giản để không cần thêm thư viện bên ngoài
  const parseMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={index} style={{
            fontFamily: "'Noto Serif', serif",
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--color-vermillion)',
            marginTop: 18,
            marginBottom: 8,
            borderBottom: '1px dashed rgba(184, 134, 11, 0.15)',
            paddingBottom: 4
          }}>
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={index} style={{ fontWeight: 700, margin: '6px 0', fontSize: '0.875rem' }}>
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={index} style={{
            marginLeft: 14,
            fontSize: '0.8125rem',
            lineHeight: 1.55,
            color: 'var(--color-ink)',
            marginBottom: 4
          }}>
            {parseInlineStyles(trimmed.replace('- ', ''))}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={index} style={{ height: 6 }} />;
      }
      return (
        <p key={index} style={{
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          color: 'var(--color-ink)',
          margin: '6px 0'
        }}>
          {parseInlineStyles(trimmed)}
        </p>
      );
    });
  };

  // Helper để format **chữ đậm** trong dòng
  const parseInlineStyles = (lineText) => {
    const parts = lineText.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ color: 'var(--color-ink)' }}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <section className="card animate-in" style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderBottom: '1.5px solid rgba(184,134,11,0.25)',
        paddingBottom: 10,
        marginBottom: 14
      }}>
        <div className="section-title" style={{ margin: 0 }}>
          🤖 Luận giải chi tiết bằng AI
        </div>
        
        {user && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            Số dư: <strong style={{ color: 'var(--color-gold)' }}>{user.tokens} Tokens</strong>
          </span>
        )}
      </div>

      {!interpretation && !loading && (
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          {!token ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: 14 }}>
                Đăng nhập hoặc đăng ký tài khoản để sử dụng tính năng luận quẻ chuyên sâu bằng AI (Gemini 1.5 Flash).
              </p>
              <button onClick={onAuthClick} className="btn-primary">
                🔑 Đăng nhập / Đăng ký (Tặng 3 Tokens)
              </button>
            </div>
          ) : user && user.tokens < 1 ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-vermillion)', marginBottom: 14, fontWeight: 500 }}>
                ⚠️ Tài khoản của bạn đã hết lượt luận giải AI (0 Tokens).
              </p>
              <button onClick={onPaymentClick} className="btn-primary" style={{ background: 'var(--color-gold)' }}>
                🪙 Nạp thêm Token ngay
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: 14 }}>
                Sử dụng <strong>1 Token</strong> để kết nối AI và phân tích chi tiết quái lý, tương tác Thế-Ứng, ngũ hành và lời khuyên quẻ dịch.
              </p>
              <button onClick={handleAIInterpret} className="btn-primary btn-cta">
                🤖 Phân Tích Bằng AI (1 Token)
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '30px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          {/* Spinner */}
          <div style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(184, 134, 11, 0.2)',
            borderTop: '3px solid var(--color-vermillion)',
            borderRadius: '50%',
            animation: 'coinSpin 1s linear infinite'
          }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', fontStyle: 'italic', margin: 0 }}>
            Hệ thống đang quán chiếu quái tượng và kết nối AI luận giải...
          </p>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(192, 57, 43, 0.08)',
          border: '1px solid rgba(192, 57, 43, 0.25)',
          borderRadius: 8,
          color: 'var(--color-vermillion)',
          padding: '12px 14px',
          fontSize: '0.8125rem',
          textAlign: 'center',
          marginTop: 10
        }}>
          ⚠️ {error}
          <button onClick={handleAIInterpret} style={{
            display: 'block',
            margin: '8px auto 0',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-gold)',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}>
            Thử lại
          </button>
        </div>
      )}

      {interpretation && (
        <div className="animate-in" style={{
          background: 'rgba(255, 255, 255, 0.55)',
          border: '1px solid rgba(184, 134, 11, 0.15)',
          borderRadius: 10,
          padding: '4px 16px 16px'
        }}>
          {parseMarkdown(interpretation)}
        </div>
      )}
    </section>
  );
}
