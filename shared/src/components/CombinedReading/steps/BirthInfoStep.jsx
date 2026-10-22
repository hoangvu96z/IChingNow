import React from 'react';
import QuickBirthForm from '../QuickBirthForm.jsx';

export default function BirthInfoStep({
  step,
  hasChart,
  isVi,
  language,
  localBirthInfo,
  handleBirthSubmit,
  setStep,
}) {
  return (
    <>
        {/* ── STEP 2: Nhập ngày sinh (nếu không có lá số) ── */}
        {step === 2 && !hasChart && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isVi ? '2. Thông tin lá số Tử Vi' : '2. Your Natal Chart Info'}
            </h3>
            {/* Source app note */}
            <div style={{
              background: 'rgba(229,193,88,0.07)',
              border: '1px solid rgba(229,193,88,0.2)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.5',
            }}>
              💡 {isVi
                ? 'Nhập ngày sinh và giờ sinh (12 Canh giờ) để xác định chính xác Cung Mệnh, Cung Thân và bản mệnh trên lá số Tử Vi đối chiếu cùng quẻ Kinh Dịch.'
                : 'Enter your birth date and birth hour (12 branches) to determine your Life Palace, Body Palace and natal chart context.'}
            </div>
            <QuickBirthForm onSubmit={handleBirthSubmit} language={language} initialData={localBirthInfo} />
            <button onClick={() => setStep(3)} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)',
              fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              marginTop: '12px', textDecoration: 'underline',
            }}>
              {isVi ? 'Bỏ qua, tiếp tục không có lá số' : 'Skip, continue without natal chart'}
            </button>
          </div>
        )}

    </>
  );
}
