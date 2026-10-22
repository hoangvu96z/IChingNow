import React from 'react';
import { HexLines, resolveChangedLines } from '../HexagramDisplay.jsx';
import SimpleMarkdown from '../SimpleMarkdown.jsx';
import { TOPIC_LABELS } from '../useCombinedReading.js';

export default function AiResultStep({
  step,
  isVi,
  hasChart,
  hexResult,
  effectiveBirthInfo,
  topic,
  isLoadingAi,
  aiResponse,
  aiError,
  queryAi,
  effectiveChart,
  language,
  setStep,
}) {
  return (
    <>
        {/* ── STEP 4: AI Result ── */}
        {step === 4 && (
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isVi ? `${hasChart ? '3' : '4'}. Luận giải tổng hợp` : `${hasChart ? '3' : '4'}. Combined Reading`}
            </h3>

            {/* Hexagram & Natal Banner in Step 4 — Rõ ràng, đầy đủ quẻ và thông tin */}
            <div style={{
              background: 'rgba(229,193,88,0.06)',
              border: '1px solid rgba(229,193,88,0.25)',
              borderRadius: '14px',
              padding: '14px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <HexLines lines={hexResult?.lines} size="sm" />
                {hexResult?.changed && (
                  <>
                    <span style={{ color: 'rgba(229,193,88,0.5)', fontSize: '18px' }}>→</span>
                    <HexLines lines={resolveChangedLines(hexResult)} size="sm" />
                  </>
                )}
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f3e5ab' }}>
                    {hexResult?.primary?.name}
                    {hexResult?.primary?.chineseName && (
                      <span style={{ marginLeft: '6px', color: 'rgba(229,193,88,0.85)', fontSize: '16px', fontFamily: "'Cinzel', serif" }}>
                        ({hexResult.primary.chineseName})
                      </span>
                    )}
                    {hexResult?.changed && (
                      <span style={{ color: '#e5c158', fontWeight: 600 }}>
                        {' → '}{hexResult.changed.name}
                        {hexResult.changed.chineseName && (
                          <span style={{ marginLeft: '4px', fontSize: '14px', fontFamily: "'Cinzel', serif" }}>
                            ({hexResult.changed.chineseName})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>
                    {hexResult?.movingLines?.length > 0 ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>⚡ {isVi ? `Động hào ${hexResult.movingLines.join(', ')}` : `Moving lines ${hexResult.movingLines.join(', ')}`}</span>
                    ) : (
                      <span>{isVi ? 'Quẻ thuần tĩnh (không có hào động)' : 'Static hexagram'}</span>
                    )}
                    {hexResult?.raw?.palaceName && (
                      <span style={{ color: 'rgba(229,193,88,0.8)', marginLeft: '8px' }}>· Cung {hexResult.raw.palaceName} ({hexResult.raw.palaceElement})</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '12px', color: '#c4b5fd' }}>
                <div style={{ fontWeight: 600 }}>{TOPIC_LABELS[topic]?.[isVi ? 'vi' : 'en']}</div>
                {effectiveBirthInfo?.day && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                    {effectiveBirthInfo.day}/{effectiveBirthInfo.month}/{effectiveBirthInfo.year}
                    {effectiveBirthInfo.hourName ? ` · Giờ ${effectiveBirthInfo.hourName}` : ''}
                    {effectiveBirthInfo.canChi ? ` · ${effectiveBirthInfo.canChi}` : ''}
                  </div>
                )}
              </div>
            </div>

            {isLoadingAi && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 0' }}>
                <div style={{ fontSize: '36px', animation: 'spin 3s linear infinite' }}>☯️</div>
                <p style={{ color: 'rgba(229,193,88,0.7)', fontFamily: "'Cinzel', serif", fontSize: '13px', margin: 0 }}>
                  {isVi ? 'Đang tổng hợp Tử Vi & Kinh Dịch...' : 'Synthesizing Zi Wei & I Ching...'}
                </p>
                {aiResponse && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '10px',
                    padding: '16px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    <SimpleMarkdown text={aiResponse} />
                  </div>
                )}
              </div>
            )}

            {aiError && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '12px',
                padding: '16px',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>⚠️</span>
                  <span>{aiError}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => queryAi({ chartResult: effectiveChart, birthInfo: effectiveBirthInfo, language })}
                    style={{
                      background: 'rgba(239,68,68,0.25)',
                      border: '1px solid rgba(239,68,68,0.6)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    🔄 {isVi ? 'Thử lại kết nối AI' : 'Retry AI Connection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.7)',
                      padding: '8px 14px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    ← {isVi ? 'Quay lại câu hỏi' : 'Back to question'}
                  </button>
                </div>
              </div>
            )}

            {!isLoadingAi && aiResponse && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(229,193,88,0.12)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <SimpleMarkdown text={aiResponse} />
              </div>
            )}

            {!isLoadingAi && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setStep(3)} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  padding: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  ← {isVi ? 'Đổi câu hỏi' : 'Change question'}
                </button>
                <button onClick={() => { setStep(1); }} style={{
                  flex: 1,
                  background: 'rgba(229,193,88,0.08)',
                  border: '1px solid rgba(229,193,88,0.25)',
                  borderRadius: '10px',
                  color: '#e5c158',
                  padding: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  🔄 {isVi ? 'Hỏi chủ đề khác' : 'New topic'}
                </button>
              </div>
            )}
          </div>
        )}
    </>
  );
}
