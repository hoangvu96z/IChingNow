import EvidenceInterpretation from './EvidenceInterpretation';

export default function IChingFollowUpConversation({
  followUps,
  askingFollowUp,
  followUpRetryStatus,
  followUpElapsed,
  followUpError,
  aiSuggestedQuestions,
  isEn,
  onSendFollowUp,
  userQuestion,
  setUserQuestion,
  t,
  charCount,
  isCharCountValid,
}) {
  return (
    <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px dashed rgba(184,134,11,0.25)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Interactive Follow-up Q&A Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>💬</span> {t('ai.followup_title', 'Hỏi thêm AI về quẻ này')}
        </h4>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: followUps.length >= 5 ? 'rgba(192,57,43,0.1)' : 'rgba(184,134,11,0.1)', color: followUps.length >= 5 ? 'var(--color-vermillion)' : 'var(--color-gold)' }}>
          {followUps.length}/5 câu hỏi
        </span>
      </div>

      {/* Chat History */}
      {followUps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {followUps.map((item, idx) => (
            <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Question bubble (Right aligned) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '80%',
                  background: 'rgba(184,134,11,0.12)',
                  border: '1px solid rgba(184,134,11,0.3)',
                  borderRadius: '12px 12px 4px 12px',
                  padding: '10px 14px',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                    {item.question}
                  </div>
                  {item.questionTimestamp && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)', marginTop: 4, textAlign: 'right', fontFamily: 'monospace' }}>
                      🕐 {new Date(item.questionTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Answer bubble (Left aligned) */}
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(184,134,11,0.2)',
                  borderRadius: '4px 12px 12px 12px',
                  padding: '12px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}>
                  <EvidenceInterpretation text={item.answer} />
                  {item.answerTimestamp && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)', marginTop: 6, fontFamily: 'monospace' }}>
                      🕐 {new Date(item.answerTimestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
          padding: '14px 18px',
          background: 'rgba(184,134,11,0.06)',
          border: '1px dashed rgba(184,134,11,0.3)',
          borderRadius: '10px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(184,134,11,0.2)', borderTop: '2px solid var(--color-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-gold)' }}>
              {isEn ? 'AI is contemplating your question...' : 'AI đang thấu suốt và chuẩn bị câu trả lời hoàn chỉnh...'}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-ink-muted)' }}>
              {followUpRetryStatus || (isEn ? `Synthesizing guidance (${followUpElapsed}s)...` : `Đang kết nối Dịch lý và đúc kết (${followUpElapsed}s)...`)}
            </span>
          </div>
        </div>
      )}

      {/* Follow-up Error */}
      {followUpError && (
        <div style={{ padding: 10, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, color: 'var(--color-vermillion)', fontSize: '0.8125rem' }}>
          ⚠️ {followUpError}
        </div>
      )}

      {/* Question Input Form */}
      {followUps.length < 5 ? (
        <form onSubmit={onSendFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          {/* 3 AI Suggested Questions Pill Buttons */}
          {!askingFollowUp && aiSuggestedQuestions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💡</span> {isEn ? 'AI Suggested follow-up questions (Click to ask AI immediately):' : 'AI gợi ý câu hỏi thêm (Bấm vào để hỏi AI ngay):'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {aiSuggestedQuestions.map((qText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={askingFollowUp}
                    onClick={() => onSendFollowUp(null, qText)}
                    style={{
                      background: 'rgba(184,134,11,0.06)',
                      border: '1px solid rgba(184,134,11,0.25)',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: '0.825rem',
                      color: 'var(--color-ink)',
                      cursor: askingFollowUp ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(184,134,11,0.15)'; }}
                    onMouseLeave={e => { if (!askingFollowUp) e.currentTarget.style.background = 'rgba(184,134,11,0.06)'; }}
                  >
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-gold)' }}>❓</span>
                    <span style={{ flex: 1 }}>{qText}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <textarea
              rows={3}
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder={t('ai.followup_placeholder', 'Nhập câu hỏi thêm của bạn về quẻ dịch này (ví dụ: Vận trình tháng sau thế nào? Tình cảm có tiến triển gì không?)...')}
              disabled={askingFollowUp}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${charCount > 2048 ? 'var(--color-vermillion)' : 'rgba(184,134,11,0.3)'}`,
                background: 'var(--color-paper, #fbf9f4)',
                fontSize: '0.875rem',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                resize: 'vertical',
                outline: 'none',
                color: 'var(--color-ink)',
                boxSizing: 'border-box',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginTop: 4,
              fontSize: '0.75rem',
            }}>
              <span style={{ color: charCount > 2048 ? 'var(--color-vermillion)' : 'var(--color-ink-muted)', fontWeight: charCount > 2048 ? 700 : 400 }}>
                {charCount > 2048 ? `⚠️ Đã vượt quá số ký tự quy định (${charCount}/2048 ký tự)` : `${charCount} / 2048 ký tự`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="submit"
              disabled={askingFollowUp || !userQuestion.trim() || !isCharCountValid}
              className="btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '0.85rem',
                opacity: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 0.5 : 1,
                cursor: (askingFollowUp || !userQuestion.trim() || !isCharCountValid) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {askingFollowUp ? '⏳ Đang xử lý...' : '💬 Gửi câu hỏi'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '12px 16px',
          background: 'rgba(184,134,11,0.08)',
          borderRadius: 8,
          fontSize: '0.8125rem',
          color: 'var(--color-ink-muted)',
          fontWeight: 500,
          border: '1px solid rgba(184,134,11,0.2)',
        }}>
          ℹ️ Bạn đã sử dụng tối đa 5 câu hỏi thêm cho lượt luận giải quẻ này.
        </div>
      )}
    </div>
  );
}
