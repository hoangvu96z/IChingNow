import React, { useState, useEffect, useRef, useMemo } from 'react';
import { attachDialogLightDismiss } from '../../../shared/src/utils/pwaInstall.mjs';
import {
  searchHexagramAtlas,
  getTrigramMatrix,
  getAtlasHexagramDetail,
} from '../logic/hexagramAtlas.js';

/**
 * Từ Điển Tra Cứu 64 Quẻ Kinh Dịch (64-Hexagram Reference Atlas)
 * Sử dụng native <dialog closedby="any" aria-labelledby="..."> mở qua showModal()
 * kèm attachDialogLightDismiss fallback chuẩn Modern Web Guidance.
 */
export default function HexagramAtlasModal({
  isOpen,
  onClose,
  initialHexId = 1,
  defaultBrowseMode = 'list',
  onCastHexagram,
  onOpenInManualInput,
}) {
  const dialogRef = useRef(null);
  const [query, setQuery] = useState('');
  const [browseMode, setBrowseMode] = useState(defaultBrowseMode); // 'list' | 'matrix'
  const [selectedId, setSelectedId] = useState(() => Number(initialHexId) || 1);

  useEffect(() => {
    if (initialHexId && Number(initialHexId) >= 1 && Number(initialHexId) <= 64) {
      setSelectedId(Number(initialHexId));
    }
  }, [initialHexId, isOpen]);

  // Đồng bộ đóng/mở imperative cho native <dialog>
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return undefined;
    const detach = attachDialogLightDismiss(el);
    if (isOpen) {
      if (!el.open && typeof el.showModal === 'function') {
        el.showModal();
      }
    } else if (el.open && typeof el.close === 'function') {
      el.close();
    }
    return () => {
      detach();
    };
  }, [isOpen]);

  const filteredList = useMemo(() => searchHexagramAtlas(query), [query]);
  const matrix = useMemo(() => getTrigramMatrix(), []);
  const detail = useMemo(() => getAtlasHexagramDetail(selectedId), [selectedId]);

  const handleDialogNativeClose = () => {
    onClose?.();
  };

  const handleSelectHex = (id) => {
    setSelectedId(id);
  };

  return (
    <dialog
      ref={dialogRef}
      className="iching-native-dialog iching-atlas-dialog"
      aria-labelledby="hexagram-atlas-title"
      closedby="any"
      onClose={handleDialogNativeClose}
    >
      <div className="iching-atlas-shell">
        {/* Header */}
        <header className="iching-atlas-header">
          <div style={{ minInlineSize: 0 }}>
            <h2 id="hexagram-atlas-title" className="iching-atlas-title">
              📖 Từ Điển Chu Dịch 64 Quẻ
            </h2>
            <p className="iching-atlas-subtitle">
              Tra cứu Quẻ tượng, Thoán từ, Đại Tượng, 6 Hào Nạp Giáp, Hỗ · Thác · Đảo Quái
            </p>
          </div>
          <button
            type="button"
            className="iching-touch-control iching-dialog-close-btn"
            aria-label="Đóng từ điển 64 quẻ"
            onClick={() => dialogRef.current?.close()}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        {/* Thanh tìm kiếm + chuyển chế độ Danh sách / Ma trận 8×8 */}
        <div className="iching-atlas-toolbar">
          <input
            type="search"
            className="form-input iching-touch-control"
            aria-label="Tìm kiếm 64 quẻ theo số (1-64), tên Hán-Việt hoặc từ khóa"
            placeholder="🔎 Tìm số quẻ (1–64), tên quẻ (vd: Thái, Ký Tế, Khiêm) hoặc từ khóa..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (browseMode === 'matrix' && e.target.value.trim()) {
                setBrowseMode('list');
              }
            }}
            style={{ flex: '1 1 240px', minInlineSize: 0 }}
          />

          <div
            role="tablist"
            aria-label="Chế độ duyệt 64 quẻ"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'list'}
              className="iching-touch-control"
              onClick={() => setBrowseMode('list')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background:
                  browseMode === 'list' ? 'var(--color-gold, #8a6104)' : 'rgba(184,134,11,0.09)',
                color: browseMode === 'list' ? 'var(--color-on-gold, #fff)' : 'var(--color-ink)',
                border:
                  browseMode === 'list'
                    ? '1px solid var(--color-gold, #8a6104)'
                    : '1px solid rgba(184,134,11,0.3)',
                borderBottom:
                  browseMode === 'list' ? '3px solid var(--color-vermillion, #c0392b)' : undefined,
              }}
            >
              📋 Danh sách ({filteredList.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'matrix'}
              className="iching-touch-control"
              onClick={() => setBrowseMode('matrix')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background:
                  browseMode === 'matrix' ? 'var(--color-gold, #8a6104)' : 'rgba(184,134,11,0.09)',
                color: browseMode === 'matrix' ? 'var(--color-on-gold, #fff)' : 'var(--color-ink)',
                border:
                  browseMode === 'matrix'
                    ? '1px solid var(--color-gold, #8a6104)'
                    : '1px solid rgba(184,134,11,0.3)',
                borderBottom:
                  browseMode === 'matrix'
                    ? '3px solid var(--color-vermillion, #c0392b)'
                    : undefined,
              }}
            >
              🔢 Ma trận 8×8 Thượng×Hạ
            </button>
          </div>
        </div>

        {/* Body 2 cột trên desktop, xếp chồng trên mobile */}
        <div className="iching-atlas-body">
          {/* Cột trái: Danh sách lọc hoặc Ma trận 8×8 */}
          <div className="iching-atlas-nav-pane" role="tabpanel">
            {browseMode === 'list' ? (
              <div className="iching-atlas-list">
                {filteredList.length === 0 ? (
                  <div style={{ padding: 18, textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: '0.85rem' }}>
                    Không tìm thấy quẻ phù hợp với &ldquo;{query}&rdquo;.
                  </div>
                ) : (
                  filteredList.map((item) => {
                    const active = item.id === selectedId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="iching-touch-control iching-atlas-list-item"
                        aria-current={active ? 'true' : undefined}
                        onClick={() => handleSelectHex(item.id)}
                        style={{
                          background: active
                            ? 'rgba(184, 134, 11, 0.16)'
                            : 'var(--color-paper)',
                          borderColor: active
                            ? 'var(--color-gold, #8a6104)'
                            : 'rgba(184, 134, 11, 0.2)',
                        }}
                      >
                        <span className="iching-atlas-glyph" aria-hidden="true">
                          {item.unicodeGlyph}
                        </span>
                        <div style={{ flex: 1, minInlineSize: 0, textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-ink)' }}>
                            #{item.id}. {item.nameVi}{' '}
                            <span style={{ color: 'var(--color-ink-muted)', fontWeight: 500 }}>
                              ({item.nameZh})
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.73rem',
                              color: 'var(--color-ink-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.upperTrigram.glyph} {item.upperTrigram.nameVi} / {item.lowerTrigram.glyph}{' '}
                            {item.lowerTrigram.nameVi} · {item.summaryVi}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div>
                <div
                  id="atlas-matrix-caption"
                  style={{ fontSize: '0.76rem', color: 'var(--color-ink-muted)', marginBottom: 6 }}
                >
                  Hàng ngang = <strong>Thượng Quái</strong> · Cột dọc = <strong>Hạ Quái</strong> (chạm vào ô để xem chi tiết quẻ):
                </div>
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="atlas-matrix-caption"
                  className="iching-atlas-matrix-scroll"
                >
                  <table className="iching-atlas-matrix-table">
                    <thead>
                      <tr>
                        <th scope="col" className="iching-matrix-corner">
                          Thượng \ Hạ
                        </th>
                        {matrix.trigrams.map((low) => (
                          <th key={low.bits} scope="col">
                            <span aria-hidden="true">{low.glyph}</span> {low.nameVi}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.rows.map((row) => (
                        <tr key={row.upper.bits}>
                          <th scope="row">
                            <span aria-hidden="true">{row.upper.glyph}</span> {row.upper.nameVi}
                          </th>
                          {row.cells.map((cell) => {
                            const active = cell.id === selectedId;
                            return (
                              <td key={cell.id}>
                                <button
                                  type="button"
                                  className="iching-touch-control iching-matrix-cell-btn"
                                  aria-label={`Quẻ ${cell.id}: ${cell.nameVi}`}
                                  aria-pressed={active}
                                  onClick={() => handleSelectHex(cell.id)}
                                  style={{
                                    background: active
                                      ? 'var(--color-gold, #8a6104)'
                                      : 'transparent',
                                    color: active ? '#fff' : 'var(--color-ink)',
                                  }}
                                >
                                  <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>#{cell.id}</span>
                                  <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>
                                    {cell.nameZh}
                                  </span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Chi tiết Quẻ được chọn */}
          {detail && (
            <article className="iching-atlas-detail-pane">
              {/* Khối đầu: Quẻ Tượng + Hành động Lập bàn Lục Hào */}
              <div className="iching-atlas-hero">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minInlineSize: 0, flexWrap: 'wrap' }}>
                  {/* Hình 6 vạch hào từ Hào 6 xuống Hào 1 */}
                  <div
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(184,134,11,0.08)',
                      border: '1px solid rgba(184,134,11,0.28)',
                      width: 68,
                    }}
                  >
                    {[6, 5, 4, 3, 2, 1].map((no) => {
                      const isYang = detail.binary[no - 1] === '1';
                      return isYang ? (
                        <div
                          key={no}
                          style={{
                            height: 6,
                            borderRadius: 2,
                            background: 'var(--color-vermillion, #c0392b)',
                          }}
                        />
                      ) : (
                        <div key={no} style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 2,
                              background: 'var(--color-ink)',
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 2,
                              background: 'var(--color-ink)',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ minInlineSize: 0, flex: '1 1 180px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                      QUẺ SỐ #{detail.id} · CUNG {detail.palaceName.toUpperCase()} ({detail.palaceElement})
                      {detail.trait?.labelVi ? ` · ${detail.trait.labelVi.toUpperCase()}` : ''}
                    </div>
                    <h3
                      style={{
                        margin: '2px 0 4px',
                        fontFamily: "'Noto Serif', serif",
                        fontSize: '1.25rem',
                        color: 'var(--color-vermillion)',
                      }}
                    >
                      {detail.unicodeGlyph} {detail.nameVi} ({detail.nameZh})
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                      Thượng: <strong>{detail.upperTrigram.glyph} {detail.upperTrigram.nameVi}</strong> ({detail.upperTrigram.nature}) · Hạ:{' '}
                      <strong>{detail.lowerTrigram.glyph} {detail.lowerTrigram.nameVi}</strong> ({detail.lowerTrigram.nature}) · Thế Hào {detail.theHao} / Ứng Hào {detail.ungHao}
                    </div>
                  </div>
                </div>

                {/* Nút hành động: Lập bàn Lục Hào với quẻ này */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {onCastHexagram && (
                    <button
                      type="button"
                      className="btn-primary iching-touch-control"
                      onClick={() => {
                        onCastHexagram(detail);
                        dialogRef.current?.close();
                      }}
                      style={{ padding: '9px 15px', fontSize: '0.83rem', fontWeight: 800 }}
                    >
                      🔮 Lập bàn Lục Hào với quẻ này
                    </button>
                  )}
                  {onOpenInManualInput && (
                    <button
                      type="button"
                      className="btn-ghost iching-touch-control"
                      onClick={() => {
                        onOpenInManualInput(detail);
                        dialogRef.current?.close();
                      }}
                      style={{
                        padding: '8px 13px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid rgba(184,134,11,0.35)',
                        borderRadius: 8,
                      }}
                    >
                      ✍️ Chọn thêm hào động
                    </button>
                  )}
                </div>
              </div>

              {/* 1-click Pills: Hỗ Quái · Thác Quái · Đảo / Tông Quái */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(184,134,11,0.06)',
                  border: '1px solid rgba(184,134,11,0.22)',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                  🔗 Quẻ liên đới (1 chạm):
                </span>
                {detail.relations.hoQuai && (
                  <button
                    type="button"
                    className="iching-touch-control iching-relation-pill"
                    onClick={() => handleSelectHex(detail.relations.hoQuai.id)}
                  >
                    Hỗ Quái: #{detail.relations.hoQuai.id} {detail.relations.hoQuai.nameVi}
                  </button>
                )}
                {detail.relations.thacQuai && (
                  <button
                    type="button"
                    className="iching-touch-control iching-relation-pill"
                    onClick={() => handleSelectHex(detail.relations.thacQuai.id)}
                  >
                    Thác Quái: #{detail.relations.thacQuai.id} {detail.relations.thacQuai.nameVi}
                  </button>
                )}
                {detail.relations.daoQuai && (
                  <button
                    type="button"
                    className="iching-touch-control iching-relation-pill"
                    onClick={() => handleSelectHex(detail.relations.daoQuai.id)}
                  >
                    Đảo/Tông Quái: #{detail.relations.daoQuai.id} {detail.relations.daoQuai.nameVi}
                  </button>
                )}
              </div>

              {/* Thoán Từ & Tổng Quan */}
              <section className="iching-atlas-section">
                <h4 className="iching-atlas-sec-title">📜 Thoán Từ &amp; Ý Nghĩa Cốt Lõi</h4>
                {detail.thoanTu.classicalZh && (
                  <div
                    style={{
                      fontFamily: "'Noto Serif', serif",
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: 'var(--color-gold, #8a6104)',
                      marginBottom: 6,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {detail.thoanTu.classicalZh}
                  </div>
                )}
                {detail.thoanTu.summaryVi && (
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4, color: 'var(--color-ink)' }}>
                    • Chủ đề: {detail.thoanTu.summaryVi}
                  </div>
                )}
                {detail.thoanTu.overviewVi && (
                  <p style={{ margin: '0 0 8px', fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--color-ink)' }}>
                    {detail.thoanTu.overviewVi}
                  </p>
                )}
                {detail.thoanTu.adviceVi && (
                  <div
                    style={{
                      padding: '8px 11px',
                      borderRadius: 8,
                      background: 'rgba(26,107,74,0.08)',
                      border: '1px solid rgba(26,107,74,0.25)',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      color: 'var(--color-ink)',
                    }}
                  >
                    💡 <strong>Lời khuyên ứng xử:</strong> {detail.thoanTu.adviceVi}
                  </div>
                )}
              </section>

              {/* Đại Tượng Truyện */}
              <section className="iching-atlas-section">
                <h4 className="iching-atlas-sec-title">🏔️ Đại Tượng Truyện</h4>
                <div
                  style={{
                    fontFamily: "'Noto Serif', serif",
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--color-ink)',
                    marginBottom: 4,
                  }}
                >
                  &ldquo;{detail.daiTuong.hanViet}&rdquo;
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--color-ink-muted)' }}>
                  {detail.daiTuong.vi}
                </p>
              </section>

              {/* Sáu Hào Từ & Nạp Giáp Lục Thân */}
              <section className="iching-atlas-section">
                <h4 className="iching-atlas-sec-title">☷ Sáu Hào &amp; Nạp Giáp Lục Thân (Hào 1 → Hào 6)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.haoDetails.map((h) => (
                    <div
                      key={h.index}
                      style={{
                        padding: '9px 11px',
                        borderRadius: 8,
                        background: 'var(--color-paper)',
                        border: h.isThe
                          ? '1.5px solid var(--color-vermillion, #c0392b)'
                          : '1px solid rgba(184,134,11,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--color-ink)' }}>
                          Hào {h.index} · {h.title} ({h.yinYang === 'yang' ? '━━━' : '━  ━'})
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              padding: '1px 7px',
                              borderRadius: 999,
                              background: 'rgba(184,134,11,0.12)',
                              color: 'var(--color-ink)',
                            }}
                          >
                            {h.lucThan} · {h.can} {h.chi} ({h.element})
                          </span>
                          {h.theUng && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '1px 7px',
                                borderRadius: 999,
                                background: h.isThe
                                  ? 'var(--color-vermillion, #c0392b)'
                                  : 'var(--color-jade, #1a6b4a)',
                                color: '#fff',
                              }}
                            >
                              {h.theUng}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--color-ink-muted)' }}>
                        {h.summaryVi}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          )}
        </div>
      </div>
    </dialog>
  );
}
