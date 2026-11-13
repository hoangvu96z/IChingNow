import React from 'react';
import { TOPICS } from '../data/lucHaoRules.js';

const VERDICT_BG = {
  cat: 'rgba(39, 134, 90, 0.1)',
  binh: 'rgba(184, 134, 11, 0.1)',
  hung: 'rgba(192, 57, 43, 0.1)',
};

const VERDICT_BORDER = {
  cat: 'rgba(39, 134, 90, 0.35)',
  binh: 'rgba(184, 134, 11, 0.35)',
  hung: 'rgba(192, 57, 43, 0.35)',
};

const VERDICT_TEXT = {
  cat: 'var(--color-jade, #1e7e50)',
  binh: 'var(--color-gold, #8a6104)',
  hung: 'var(--color-vermillion, #c0392b)',
};

/**
 * Thẻ hiển thị Chẩn Đoán Thực Chiến Tăng San Bốc Dịch v2 & Dự Báo Ứng Kỳ tự động.
 */
export default function UngKyCard({
  analysis,
  topic,
  onTopicChange,
  showDiagnostics = true,
  onLearn,
  idPrefix = 'ung-ky',
}) {
  if (!analysis) return null;

  const { advancedDiagnostics: adv = {}, ungKy, primaryDT: dt } = analysis;
  const candidateDates = ungKy?.candidateDates || [];

  return (
    <div
      className="iching-v2-diagnostics-wrap"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minInlineSize: 0,
      }}
    >
      {/* Bộ chọn chủ đề Dụng Thần (nếu truyền onTopicChange) */}
      {onTopicChange && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(184, 134, 11, 0.06)',
            border: '1px solid rgba(184, 134, 11, 0.22)',
          }}
        >
          <label
            htmlFor={`${idPrefix}-topic-select`}
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--color-ink)',
              minInlineSize: 0,
            }}
          >
            🧭 Chủ đề xét Dụng Thần &amp; Ứng Kỳ:
          </label>
          <select
            id={`${idPrefix}-topic-select`}
            className="form-input iching-touch-control"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            style={{
              flex: '1 1 210px',
              maxInlineSize: '100%',
              minInlineSize: 0,
              padding: '7px 10px',
              fontSize: '0.85rem',
            }}
          >
            {Object.entries(TOPICS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} — Dụng Thần: {v.dungThan}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Khối 1: Tóm tắt Chẩn Đoán Thực Chiến Tăng San Bốc Dịch v2 */}
      {showDiagnostics && (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: VERDICT_BG[analysis.verdict] || VERDICT_BG.binh,
            border: `1px solid ${VERDICT_BORDER[analysis.verdict] || VERDICT_BORDER.binh}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minInlineSize: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-ink)', minInlineSize: 0 }}>
              ⚖️ Pháp Quyết Tăng San Bốc Dịch
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 800,
                background: 'var(--color-paper)',
                color: VERDICT_TEXT[analysis.verdict] || VERDICT_TEXT.binh,
                border: `1px solid ${VERDICT_BORDER[analysis.verdict] || VERDICT_BORDER.binh}`,
              }}
            >
              Điểm {analysis.score > 0 ? `+${analysis.score}` : analysis.score} · {analysis.verdictLabel}
            </span>
          </div>

          {dt && (
            <div style={{ fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--color-ink)' }}>
              <strong>Dụng Thần:</strong> {analysis.dungThanName} tại{' '}
              <strong>
                Hào {dt.index} ({dt.chi} – {dt.element})
              </strong>{' '}
              · Lệnh tháng: <strong>{dt.vuongSuy}</strong>
              {dt.isPhucThan ? ` · Ẩn phục dưới Phi Thần ${dt.phiChi || '?'}` : ''}
              {dt.isMoving && dt.changedChi ? ` · Động biến ${dt.changedChi}` : ''}
              {dt.isAmDong ? ' · ⚡ Ám Động' : ''}
              {dt.isNhatPha ? ' · 💥 Nhật Phá' : ''}
              {dt.isHopTru ? ` · 🔗 Hợp Trụ (${dt.hopPartnerChi})` : ''}
            </div>
          )}

          {/* Các điểm nhấn chẩn đoán nâng cao */}
          <ul
            style={{
              margin: 0,
              paddingInlineStart: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              fontSize: '0.82rem',
              lineHeight: 1.5,
              color: 'var(--color-ink)',
            }}
          >
            {adv.amDongLines?.length > 0 && (
              <li>
                <strong>⚡ Ám Động:</strong>{' '}
                {adv.amDongLines
                  .map((l) => `Hào ${l.index} (${l.lucThan} ${l.chi} - ${l.vuongSuy})`)
                  .join(', ')}{' '}
                được Nhật xung kích phát ngầm, ứng việc rất nhanh.
              </li>
            )}
            {adv.nhatPhaLines?.length > 0 && (
              <li>
                <strong>💥 Nhật Phá / Xung Tán:</strong>{' '}
                {adv.nhatPhaLines
                  .map(
                    (l) =>
                      `Hào ${l.index} (${l.lucThan} ${l.chi}${l.isXungTan ? ' - Xung Tán' : ' - Nhật Phá'})`
                  )
                  .join(', ')}{' '}
                khí suy gặp Nhật xung nên tán lực.
              </li>
            )}
            {adv.chainSummary?.summaryVi && (
              <li
                style={{
                  color: adv.chainSummary.isThamSinhVongKhac
                    ? 'var(--color-jade, #1e7e50)'
                    : adv.chainSummary.isCuuThanChain
                    ? 'var(--color-vermillion, #c0392b)'
                    : 'inherit',
                  fontWeight:
                    adv.chainSummary.isThamSinhVongKhac || adv.chainSummary.isCuuThanChain ? 700 : 400,
                }}
              >
                <strong>🔄 Chuỗi Sinh Khắc:</strong> {adv.chainSummary.summaryVi}
              </li>
            )}
            {adv.tamHopCucs?.map((cuc) => (
              <li key={cuc.id}>
                <strong>🔱 Tam Hợp Cục:</strong> {cuc.summaryVi}
              </li>
            ))}
            {adv.hopTruLines?.map((ht) => (
              <li key={`${ht.index}-${ht.partnerChi}`}>
                <strong>🔗 Hợp Trụ:</strong> {ht.summaryVi}
              </li>
            ))}
            {adv.moDiagnostics?.items?.length > 0 && (
              <li>
                <strong>🏛️ Mộ / Tuyệt:</strong> {adv.moDiagnostics.items.join('; ')}.
              </li>
            )}
            {adv.phucPhiDetail?.summaryVi && (
              <li>
                <strong>🕵️ Phi Thần – Phục Thần:</strong> {adv.phucPhiDetail.summaryVi}
              </li>
            )}
            {adv.theUngRelation?.summaryVi && (
              <li>
                <strong>🤝 Thế – Ứng:</strong> {adv.theUngRelation.summaryVi}
              </li>
            )}
          </ul>

          {analysis.advice && (
            <div
              style={{
                fontSize: '0.82rem',
                lineHeight: 1.5,
                paddingTop: 8,
                borderTop: '1px dashed rgba(184, 134, 11, 0.25)',
                color: 'var(--color-ink)',
              }}
            >
              💡 <strong>Định hướng:</strong> {analysis.advice}
            </div>
          )}
        </div>
      )}

      {/* Khối 2: Thẻ Dự Báo Ứng Kỳ (Thời Điểm Ứng Nghiệm) */}
      {ungKy && (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: 'var(--color-paper)',
            border: '1px solid rgba(184, 134, 11, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minInlineSize: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontFamily: "'Noto Serif', serif",
                color: 'var(--color-vermillion)',
              }}
            >
              ⏱️ Dự Báo Ứng Kỳ (Thời Điểm Ứng Nghiệm)
            </h4>
            {onLearn && (
              <button
                type="button"
                className="iching-touch-control"
                onClick={() => onLearn('ungKy')}
                style={{
                  background: 'rgba(184, 134, 11, 0.1)',
                  color: 'var(--color-ink)',
                  border: '1px solid rgba(184, 134, 11, 0.3)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📖 Ứng Kỳ là gì?
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            Pháp quyết: <span style={{ color: 'var(--color-gold, #8a6104)' }}>{ungKy.primaryRuleVi}</span>
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--color-ink-muted)' }}>
            {ungKy.reasoningVi}
          </p>

          {ungKy.targetBranches?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                Địa Chi kích hoạt:
              </span>
              {ungKy.targetBranches.map((br) => (
                <span
                  key={br}
                  style={{
                    padding: '2px 9px',
                    borderRadius: 999,
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    background: 'rgba(184, 134, 11, 0.14)',
                    color: 'var(--color-ink)',
                    border: '1px solid rgba(184, 134, 11, 0.3)',
                  }}
                >
                  Chi {br}
                </span>
              ))}
            </div>
          )}

          {ungKy.isUnfavorableWarning && ungKy.cautionVi && (
            <div
              role="note"
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(192, 57, 43, 0.09)',
                border: '1px solid rgba(192, 57, 43, 0.32)',
                color: 'var(--color-vermillion)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              {ungKy.cautionVi}
            </div>
          )}

          {candidateDates.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: 8,
                marginTop: 2,
              }}
            >
              {candidateDates.map((d) => (
                <div
                  key={d.isoDate}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 8,
                    background:
                      d.priority === 1
                        ? 'rgba(184, 134, 11, 0.09)'
                        : 'var(--color-paper-dark, rgba(184,134,11,0.04))',
                    border:
                      d.priority === 1
                        ? '1px solid rgba(184, 134, 11, 0.38)'
                        : '1px solid rgba(184, 134, 11, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    minInlineSize: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--color-ink)' }}>
                      📅 {d.displayDate} ({d.weekdayVi})
                    </span>
                    <span
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: 'var(--color-paper)',
                        color: 'var(--color-gold, #8a6104)',
                        border: '1px solid rgba(184,134,11,0.28)',
                      }}
                    >
                      Ngày {d.canChiDay}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
                    {d.matchReasonVi} · <em>(+{d.daysAhead} ngày)</em>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
              Chưa có ngày cụ thể khớp trong 60 ngày tới — tham chiếu theo tháng hoặc tiết khí tương ứng.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
