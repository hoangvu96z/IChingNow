import React from 'react';
import TarotMarkdown from './TarotMarkdown.mjs';

export default function TarotFollowUpSection({
  followUps,
  isEn,
  askingFollowUp,
  followUpRetryStatus,
  followUpElapsed,
  followUpError,
  aiSuggestedQuestions,
  handleSendFollowUp,
  userQuestion,
  setUserQuestion,
  charCount,
  isCharCountValid,
}) {
  const uniqueSuggestedQuestions = Array.from(new Set(aiSuggestedQuestions || []));

  return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-color)', fontWeight: 700, letterSpacing: '0.06em' }}>
                💬 HỎI THÊM AI ({followUps.length}/5)
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
            </div>

            {/* Previous Q&A list */}
            {followUps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {followUps.map((fu, idx) => (
                  <div key={fu.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Question bubble */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div className="followup-question-bubble" style={{ maxWidth: '80%', borderRadius: '12px 12px 4px 12px', padding: '8px 12px' }}>
                        <div className="followup-question-text" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fu.question}</div>
                        {fu.questionTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3, textAlign: 'right', fontFamily: 'monospace' }}>
                            🕐 {new Date(fu.questionTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Answer bubble */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div className="followup-answer-bubble" style={{ maxWidth: '85%', borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
                        <TarotMarkdown compact>{fu.answer}</TarotMarkdown>
                        {fu.answerTimestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                            🕐 {new Date(fu.answerTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Waiting box when asking follow-up */}
            {askingFollowUp && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'rgba(167,139,250,0.08)',
                border: '1px dashed rgba(167,139,250,0.3)',
                borderRadius: '10px',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(229,193,88,0.2)', borderTop: '2px solid var(--gold-color, #e5c158)', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gold-color)' }}>
                    {isEn ? 'AI is focusing on your Tarot question...' : 'AI đang thấu cảm và chuẩn bị câu trả lời hoàn chỉnh...'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #a69fbf)' }}>
                    {followUpRetryStatus || (isEn ? `Synthesizing guidance (${followUpElapsed}s)...` : `Đang kết nối năng lượng lá bài (${followUpElapsed}s)...`)}
                  </span>
                </div>
              </div>
            )}

            {/* Follow-up error */}
            {followUpError && (
              <div style={{ padding: '8px 12px', background: 'rgba(235,94,85,0.08)', border: '1px solid rgba(235,94,85,0.2)', borderRadius: '8px', color: 'var(--accent-red)', fontSize: '12px' }}>
                ⚠️ {followUpError}
              </div>
            )}

            {/* Question input form */}
            {followUps.length < 5 ? (
              <form onSubmit={handleSendFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 3 AI Suggested Questions Pill Buttons */}
                {!askingFollowUp && uniqueSuggestedQuestions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💡</span> {isEn ? 'AI Suggested Follow-up Questions (Click to ask immediately):' : 'AI gợi ý 3 câu hỏi tiếp theo (Bấm vào để hỏi ngay):'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {uniqueSuggestedQuestions.map((qText) => (
                        <button
                          key={qText}
                          type="button"
                          disabled={askingFollowUp}
                          onClick={() => handleSendFollowUp(null, qText)}
                          className="followup-suggested-btn"
                          style={{
                            borderRadius: 10,
                            padding: '8px 14px',
                            fontSize: '0.825rem',
                            cursor: askingFollowUp ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: 'inherit',
                          }}
                        >
                          <span style={{ fontSize: '0.9rem', color: 'var(--accent-purple)' }}>🔮</span>
                          <span style={{ flex: 1 }}>{qText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <textarea
                    rows={2}
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi thêm về trải bài này (tối đa 2048 ký tự)..."
                    disabled={askingFollowUp}
                    className="custom-textarea followup-textarea"
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${charCount > 2048 ? 'rgba(235,94,85,0.6)' : 'var(--border-gold)'}`,
                      fontSize: '0.85rem',
                      resize: 'vertical', outline: 'none',
                      boxSizing: 'border-box', minHeight: 'unset',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: 3, fontSize: '0.7rem' }}>
                    <span style={{ color: charCount > 2048 ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: charCount > 2048 ? 700 : 500 }}>
                      {charCount > 2048 ? `⚠️ Đã vượt quá 2048 ký tự (${charCount})` : `${charCount} / 2048 ký tự`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={askingFollowUp || !userQuestion.trim() || !isCharCountValid}
                    className="copy-main-btn"
                    style={{
                      padding: '7px 18px', fontSize: '0.82rem', width: 'auto',
                      opacity: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 0.5 : 1,
                      cursor: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {askingFollowUp ? '⏳ Đang xử lý...' : '💬 Gửi câu hỏi'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 14px', background: 'rgba(229,193,88,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--gold-color)', fontWeight: 600, border: '1px solid var(--border-gold)' }}>
                ℹ️ Bạn đã sử dụng tối đa 5 câu hỏi thêm cho lượt luận giải này.
              </div>
            )}
          </div>
  );
}
