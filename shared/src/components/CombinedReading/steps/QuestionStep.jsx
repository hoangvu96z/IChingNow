import React from 'react';
import { HexLines, resolveChangedLines } from '../HexagramDisplay.jsx';
import { buildCombinedPrompt, summarizeRelevantPalaces } from '../useCombinedReading.js';

export default function QuestionStep({
  step,
  isVi,
  hasChart,
  hasPrecastHex,
  effectiveBirthInfo,
  relevantPalaces,
  question,
  setQuestion,
  hexResult,
  topic,
  effectiveChart,
  language,
  isCasting,
  castHexagram,
  showPromptPreview,
  setShowPromptPreview,
  promptCopied,
  setPromptCopied,
  handleCastAndAsk,
  isLoadingAi,
  isAuthenticated,
}) {
  return (
    <>
        {/* ── STEP 3: Câu hỏi + Quẻ ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: '#e5c158', fontSize: '14px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
                {hasPrecastHex
                  ? (isVi ? `${hasChart ? '2' : '3'}. Xác nhận câu hỏi & Quẻ Kinh Dịch` : `${hasChart ? '2' : '3'}. Confirm Question & Hexagram`)
                  : (isVi ? `${hasChart ? '2' : '3'}. Câu hỏi & Gieo quẻ Kinh Dịch` : `${hasChart ? '2' : '3'}. Question & Cast Hexagram`)}
              </h3>
              {hasPrecastHex && (
                <span style={{
                  fontSize: '11px',
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  color: '#86efac',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}>
                  ✓ {isVi ? 'Đã lấy quẻ từ Kinh Dịch' : 'Hexagram loaded'}
                </span>
              )}
            </div>

            {/* Tử Vi context preview */}
            {(effectiveBirthInfo || relevantPalaces) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(79,70,229,0.06) 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔭 {isVi ? 'Tử Vi — Thông tin bản mệnh' : 'Zi Wei Natal Context'}
                  </div>
                  {effectiveBirthInfo?.canChi && (
                    <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', padding: '2px 8px', borderRadius: '12px', color: '#ddd6fe' }}>
                      Năm {effectiveBirthInfo.canChi} {effectiveBirthInfo.menh ? `· Mệnh ${effectiveBirthInfo.menh}` : ''}
                    </span>
                  )}
                </div>
                {effectiveBirthInfo?.day && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    👤 {effectiveBirthInfo.name && effectiveBirthInfo.name !== 'Người hỏi' ? `${effectiveBirthInfo.name} · ` : ''}
                    {isVi ? 'Sinh ngày' : 'Born:'} {effectiveBirthInfo.day}/{effectiveBirthInfo.month}/{effectiveBirthInfo.year}
                    {effectiveBirthInfo.hourLabel ? ` · Giờ ${effectiveBirthInfo.hourLabel}` : (effectiveBirthInfo.hourName ? ` · Giờ ${effectiveBirthInfo.hourName}` : '')} · {effectiveBirthInfo.gender === 'nam' ? '♂ Nam' : '♀ Nữ'}
                  </div>
                )}
                {relevantPalaces && relevantPalaces.length > 0 && (
                  <div style={{ marginTop: '2px', borderTop: '1px solid rgba(139,92,246,0.15)', paddingTop: '8px' }}>
                    {relevantPalaces.map((p, i) => (
                      <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>
                        <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{p.isMenh ? '⭐ ' : ''}{p.name}: </span>
                        {p.stars || (isVi ? '(chưa có sao chiếu)' : '(no stars)')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Question input */}
            <div>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
                {isVi ? '✏️ Câu hỏi cụ thể của bạn' : '✏️ Your specific question'}
              </label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={isVi
                  ? 'Ví dụ: Công việc hiện tại của tôi có nên tiếp tục hay đổi sang lĩnh vực khác?'
                  : 'E.g.: Should I stay in my current job or change fields?'}
                style={{
                  width: '100%',
                  minHeight: '76px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(229,193,88,0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Hexagram display: Quẻ đã có từ IChingNow vs Gieo quẻ từ TuViNow */}
            {hasPrecastHex && hexResult ? (
              /* TH1: Đã có quẻ từ IChingNow — Trình bày trang trọng chuẩn phong cách Kinh Dịch */
              <div style={{
                background: 'linear-gradient(180deg, rgba(20, 16, 32, 0.95) 0%, rgba(12, 9, 20, 0.98) 100%)',
                border: '1px solid rgba(229,193,88,0.25)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}>
                {/* Khung 2 quẻ: Quẻ Chủ & Quẻ Biến cân xứng tuyệt đối */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '28px',
                  flexWrap: 'wrap',
                }}>
                  {/* Cột 1: Quẻ Chủ */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(229,193,88,0.25)',
                    borderRadius: '14px',
                    padding: '16px 22px',
                    minWidth: '150px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#e5c158',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      background: 'rgba(229,193,88,0.12)',
                      border: '1px solid rgba(229,193,88,0.35)',
                      padding: '3px 12px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                    }}>
                      {isVi ? 'Quẻ Chủ' : 'Primary Hex'}
                    </div>

                    <HexLines lines={hexResult.lines} size="lg" />

                    <div style={{
                      fontSize: '28px',
                      color: '#f5d77f',
                      fontFamily: "'Cinzel', 'Noto Serif', serif",
                      fontWeight: 700,
                      marginTop: '12px',
                      lineHeight: 1,
                      textShadow: '0 2px 10px rgba(229,193,88,0.4)',
                    }}>
                      {hexResult.primary?.chineseName || '卦'}
                    </div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#fff',
                      marginTop: '6px',
                      textAlign: 'center',
                      fontFamily: "'Cinzel', serif",
                    }}>
                      {hexResult.primary?.name}
                    </div>
                    {hexResult.primary?.id && (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                        {isVi ? `Quẻ số ${hexResult.primary.id}` : `Hexagram #${hexResult.primary.id}`}
                      </div>
                    )}
                  </div>

                  {/* Cột giữa: Mũi tên chuyển dịch & Hào động */}
                  {hexResult.changed && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 6px',
                    }}>
                      <div style={{
                        fontSize: '28px',
                        color: '#e5c158',
                        textShadow: '0 0 12px rgba(229,193,88,0.5)',
                        lineHeight: 1,
                      }}>
                        ➔
                      </div>
                      {hexResult.movingLines?.length > 0 ? (
                        <div style={{
                          background: 'rgba(217, 74, 56, 0.18)',
                          border: '1px solid rgba(217, 74, 56, 0.5)',
                          borderRadius: '20px',
                          padding: '4px 14px',
                          color: '#fca5a5',
                          fontSize: '11px',
                          fontWeight: 700,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 0 10px rgba(217, 74, 56, 0.25)',
                        }}>
                          ⚡ {isVi ? `Động hào ${hexResult.movingLines.join(', ')}` : `Moving ${hexResult.movingLines.join(', ')}`}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          {isVi ? 'Biến quẻ' : 'Transformed'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cột 2: Quẻ Biến (nếu có) */}
                  {hexResult.changed && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      borderRadius: '14px',
                      padding: '16px 22px',
                      minWidth: '150px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#c084fc',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        background: 'rgba(168,85,247,0.15)',
                        border: '1px solid rgba(168,85,247,0.4)',
                        padding: '3px 12px',
                        borderRadius: '12px',
                        marginBottom: '12px',
                      }}>
                        {isVi ? 'Quẻ Biến' : 'Transformed Hex'}
                      </div>

                      <HexLines lines={resolveChangedLines(hexResult)} size="lg" />

                      <div style={{
                        fontSize: '28px',
                        color: '#d8b4fe',
                        fontFamily: "'Cinzel', 'Noto Serif', serif",
                        fontWeight: 700,
                        marginTop: '12px',
                        lineHeight: 1,
                        textShadow: '0 2px 10px rgba(168,85,247,0.4)',
                      }}>
                        {hexResult.changed?.chineseName || '卦'}
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#fff',
                        marginTop: '6px',
                        textAlign: 'center',
                        fontFamily: "'Cinzel', serif",
                      }}>
                        {hexResult.changed?.name}
                      </div>
                      {hexResult.changed?.id && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                          {isVi ? `Quẻ số ${hexResult.changed.id}` : `Hexagram #${hexResult.changed.id}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Thanh thông tin phụ bên dưới */}
                <div style={{
                  borderTop: '1px solid rgba(229,193,88,0.12)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  <div>
                    {hexResult.raw?.palaceName && (
                      <span style={{ color: 'rgba(229,193,88,0.9)', fontWeight: 600 }}>
                        🏛️ Cung {hexResult.raw.palaceName} ({hexResult.raw.palaceElement})
                        {hexResult.raw.theHao ? ` · Hào Thế: ${hexResult.raw.theHao} · Hào Ứng: ${hexResult.raw.ungHao}` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                    📍 {isVi ? 'Quẻ đã lập sẵn từ Kinh Dịch, sẵn sàng kết hợp cùng lá số Tử Vi.' : 'Pre-cast hexagram ready for synthesis.'}
                  </div>
                </div>
              </div>
            ) : (
              /* TH2: Chưa có quẻ (từ TuViNow) — Cho gieo 3 xu */
              <div style={{
                background: 'rgba(229,193,88,0.04)',
                border: '1px solid rgba(229,193,88,0.15)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}>
                <div style={{ flexShrink: 0 }}>
                  {hexResult ? (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <HexLines lines={hexResult.lines} />
                        <div style={{ fontSize: '11px', color: '#e5c158', marginTop: '6px' }}>{hexResult.primary?.name}</div>
                      </div>
                      {hexResult.changed && (
                        <>
                          <div style={{ color: 'rgba(229,193,88,0.3)', fontSize: '18px' }}>→</div>
                          <div style={{ textAlign: 'center' }}>
                            <HexLines lines={resolveChangedLines(hexResult)} />
                            <div style={{ fontSize: '11px', color: 'rgba(229,193,88,0.6)', marginTop: '6px' }}>{hexResult.changed?.name}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '48px', height: '64px',
                      border: '1px dashed rgba(229,193,88,0.2)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', opacity: 0.4,
                    }}>☯</div>
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  {hexResult ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5c158' }}>
                        {isVi ? 'Quẻ đã gieo' : 'Hexagram Cast'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {hexResult.primary?.name} {hexResult.primary?.chineseName && `(${hexResult.primary.chineseName})`}
                        {hexResult.changed && ` → ${hexResult.changed.name}`}
                      </div>
                      <button onClick={castHexagram} style={{
                        background: 'transparent', border: 'none', color: 'rgba(229,193,88,0.5)',
                        fontSize: '11px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        marginTop: '6px', padding: 0, textDecoration: 'underline',
                      }}>
                        {isVi ? 'Gieo lại' : 'Recast'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                        {isVi ? 'Gieo 3 xu để hỏi Kinh Dịch' : 'Cast 3 coins to consult I Ching'}
                      </div>
                      <button
                        onClick={castHexagram}
                        disabled={isCasting}
                        style={{
                          background: 'rgba(229,193,88,0.12)',
                          border: '1px solid rgba(229,193,88,0.3)',
                          borderRadius: '8px',
                          color: '#e5c158',
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          fontFamily: "'Inter', sans-serif",
                          cursor: isCasting ? 'not-allowed' : 'pointer',
                          opacity: isCasting ? 0.6 : 1,
                        }}
                      >
                        {isCasting ? '🎲 ...' : `🎲 ${isVi ? 'Gieo quẻ' : 'Cast Hexagram'}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Preview & Copy */}
            {question.trim() && (() => {
              const previewPrompt = buildCombinedPrompt({
                topic,
                question,
                birthInfo: effectiveBirthInfo,
                relevantPalaces: effectiveChart ? summarizeRelevantPalaces(effectiveChart, topic) : null,
                hexResult,
                language,
                chartResult: effectiveChart,
              });
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(229,193,88,0.15)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowPromptPreview(!showPromptPreview); setPromptCopied(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'rgba(229,193,88,0.7)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{showPromptPreview ? '▼' : '▶'}</span>
                      📋 {isVi ? 'Xem & Copy Prompt AI' : 'View & Copy AI Prompt'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                      {isVi ? `${previewPrompt.length} ký tự` : `${previewPrompt.length} chars`}
                    </span>
                  </button>

                  {showPromptPreview && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <div style={{
                        position: 'relative',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(229,193,88,0.12)',
                        borderRadius: '10px',
                        padding: '14px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(229,193,88,0.2) transparent',
                      }}>
                        <pre style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '11.5px',
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.75)',
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        }}>
                          {previewPrompt}
                        </pre>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(previewPrompt);
                            setPromptCopied(true);
                            setTimeout(() => setPromptCopied(false), 2500);
                          } catch {
                            // Fallback
                            const ta = document.createElement('textarea');
                            ta.value = previewPrompt;
                            ta.style.cssText = 'position:fixed;opacity:0';
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand('copy');
                            document.body.removeChild(ta);
                            setPromptCopied(true);
                            setTimeout(() => setPromptCopied(false), 2500);
                          }
                        }}
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: '10px',
                          border: promptCopied
                            ? '1px solid rgba(34,197,94,0.5)'
                            : '1px solid rgba(229,193,88,0.35)',
                          background: promptCopied
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(229,193,88,0.08)',
                          color: promptCopied ? '#86efac' : '#e5c158',
                          fontSize: '13px',
                          fontWeight: 700,
                          fontFamily: "'Inter', sans-serif",
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {promptCopied
                          ? (isVi ? '✅ Đã copy prompt!' : '✅ Prompt copied!')
                          : (isVi ? '📋 Copy toàn bộ Prompt' : '📋 Copy Full Prompt')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* CTA */}
            <button
              onClick={handleCastAndAsk}
              disabled={isLoadingAi || (isAuthenticated && !question.trim())}
              style={{
                background: (question.trim() || !isAuthenticated)
                  ? 'linear-gradient(135deg, rgba(229,193,88,0.3), rgba(229,193,88,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(question.trim() || !isAuthenticated) ? 'rgba(229,193,88,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                color: question.trim() ? '#e5c158' : 'rgba(255,255,255,0.3)',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.5px',
                cursor: (question.trim() || !isAuthenticated) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {isLoadingAi
                ? (isVi ? '⏳ Đang tổng hợp luận giải...' : '⏳ Synthesizing reading...')
                : (!isAuthenticated
                  ? (isVi ? '🔑 Đăng nhập để luận giải' : '🔑 Log in for a reading')
                  : (isVi ? '🔮 Luận giải kết hợp AI' : '🔮 Combined AI Reading'))}
            </button>
          </div>
        )}

    </>
  );
}
