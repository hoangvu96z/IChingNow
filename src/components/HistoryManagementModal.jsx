import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function HistoryManagementModal({
  isOpen,
  onClose,
  history = [],
  onSelect,
  onDeleteMultiple,
  onClearAll,
}) {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [previewTab, setPreviewTab] = useState('info');

  const formatHistoryTitle = (item) => {
    const getHexName = (hex) => {
      if (!hex) return '';
      return language === 'en' ? t(`hex.name.${hex.id}`, hex.nameVi) : hex.nameVi;
    };
    const data = item.data;
    if (!data) return item.title || '';
    const primaryName = getHexName(data.primaryHexagram);
    const changedName = getHexName(data.changedHexagram);
    if (item.type === 'luc-hao') {
      return `${primaryName}${changedName ? ' ➔ ' + changedName : ''}`;
    } else {
      const chuLabel = language === 'en' ? 'Primary' : 'Chủ';
      const bienLabel = language === 'en' ? 'Changed' : 'Biến';
      return `${primaryName} (${chuLabel}) ➔ ${changedName} (${bienLabel})`;
    }
  };

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch { return isoString || ''; }
  };

  const formatTimeShort = (isoString) => {
    try {
      const d = new Date(isoString);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } catch { return ''; }
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    const term = searchTerm.toLowerCase();
    return history.filter((item) => {
      const title = formatHistoryTitle(item).toLowerCase();
      const question = (item.question || '').toLowerCase();
      return title.includes(term) || question.includes(term);
    });
  }, [history, searchTerm, language]);

  if (!isOpen) return null;

  const isAllSelected =
    filteredHistory.length > 0 &&
    filteredHistory.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredHistory.map((item) => item.id)));
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (window.confirm(t('history.confirm_delete_selected', `Bạn có chắc chắn muốn xóa ${count} quẻ đã chọn không?`))) {
      onDeleteMultiple(history.filter((h) => selectedIds.has(h.id)));
      setSelectedIds(new Set());
      setPreviewItem(null);
    }
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    if (window.confirm(t('history.confirm_clear', 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử gieo quẻ không?'))) {
      onClearAll();
      setSelectedIds(new Set());
      setPreviewItem(null);
    }
  };

  const handleSelectItem = (item) => { onSelect(item); onClose(); };
  const handlePreviewItem = (item, e) => { e.stopPropagation(); setPreviewItem(item); setPreviewTab('info'); };

  // ─── Detail Overlay ────────────────────────────────────────────────────────
  const DetailView = ({ item }) => {
    const conv = item?.data?.aiConversation;
    const hasAI = !!(conv?.initialInterpretation || (conv?.followUps && conv.followUps.length > 0));

    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={() => setPreviewItem(null)}
      >
        <div
          style={{ background: 'var(--color-paper-card, #fdfbf7)', border: '1px solid var(--color-gold, #b8860b)', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden', fontFamily: "'Be Vietnam Pro', sans-serif" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #1a0a06 0%, #3d1a10 100%)', color: '#f5d78e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Noto Serif', serif", fontWeight: 700, fontSize: '1.05rem' }}>{formatHistoryTitle(item)}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>
                {item.type === 'luc-hao' ? '🪙 Lục Hào' : '🌸 Mai Hoa'} · {formatTime(item.timestamp)}
              </div>
            </div>
            <button onClick={() => setPreviewItem(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#f5d78e', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid rgba(184,134,11,0.15)', background: 'rgba(184,134,11,0.04)' }}>
            {[
              { key: 'info', label: '📋 Thông tin quẻ' },
              { key: 'ai', label: hasAI ? `💬 Hội thoại AI (${conv.followUps?.length || 0} câu hỏi)` : '💬 Hội thoại AI' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setPreviewTab(tab.key)} style={{ flex: 1, padding: '10px 16px', border: 'none', background: previewTab === tab.key ? 'rgba(184,134,11,0.1)' : 'transparent', borderBottom: previewTab === tab.key ? '2px solid var(--color-gold, #b8860b)' : '2px solid transparent', color: previewTab === tab.key ? 'var(--color-gold, #b8860b)' : 'var(--color-ink-muted)', fontSize: '0.85rem', fontWeight: previewTab === tab.key ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {previewTab === 'info' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {item.question && (
                  <div style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: 4, textTransform: 'uppercase' }}>Việc cần xem</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-ink)' }}>{item.question === '(Không có câu hỏi)' ? '(Không có câu hỏi)' : item.question}</div>
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', lineHeight: 1.8 }}>
                  <strong>Thời gian:</strong> {formatTime(item.timestamp)}<br />
                  <strong>Phương pháp:</strong> {item.type === 'luc-hao' ? 'Lục Hào' : 'Mai Hoa'}<br />
                  {item.data?.caster && <><strong>Người lập:</strong> {item.data.caster}<br /></>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!hasAI ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--color-ink-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    🤖 Chưa có hội thoại AI nào được lưu cho quẻ này.<br />
                    <span style={{ fontSize: '0.8rem', marginTop: 4, display: 'block' }}>Hãy mở lại quẻ và yêu cầu AI luận giải để lưu hội thoại.</span>
                  </div>
                ) : (
                  <>
                    {conv.initialInterpretation && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                          <span>🤖 Luận giải ban đầu của AI</span>
                          {conv.initialTimestamp && (
                            <span style={{ fontFamily: 'monospace', fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
                              🕐 {formatTimeShort(conv.initialTimestamp)}
                            </span>
                          )}
                        </div>
                        <div style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.65, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                          {conv.initialInterpretation.slice(0, 800)}{conv.initialInterpretation.length > 800 ? '...' : ''}
                        </div>
                      </div>
                    )}
                    {conv.followUps && conv.followUps.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          💬 Câu hỏi thêm ({conv.followUps.length})
                        </div>
                        {conv.followUps.map((fu, idx) => (
                          <div key={fu.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '3px solid rgba(184,134,11,0.3)', paddingLeft: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-vermillion)', minWidth: 22 }}>Q{idx + 1}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.83rem', color: 'var(--color-ink)', fontWeight: 600 }}>{fu.question}</div>
                                {fu.questionTimestamp && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontFamily: 'monospace', marginTop: 2 }}>🕐 {formatTimeShort(fu.questionTimestamp)}</div>
                                )}
                              </div>
                            </div>
                            {fu.answer && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingLeft: 22 }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a6b4a', minWidth: 22 }}>AI</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.82rem', color: 'var(--color-ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                                    {fu.answer.slice(0, 600)}{fu.answer.length > 600 ? '...' : ''}
                                  </div>
                                  {fu.answerTimestamp && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', fontFamily: 'monospace', marginTop: 2 }}>🕐 {formatTimeShort(fu.answerTimestamp)}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(184,134,11,0.15)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setPreviewItem(null)} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(184,134,11,0.3)', background: 'transparent', color: 'var(--color-ink)', fontSize: '0.85rem', cursor: 'pointer' }}>Đóng</button>
            <button onClick={() => handleSelectItem(item)} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg, #b8860b, #d4a017)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>🔍 Mở lại quẻ này ➔</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {previewItem && <DetailView item={previewItem} />}

      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div style={{ background: 'var(--color-paper-card, #fdfbf7)', border: '1px solid var(--color-gold, #b8860b)', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden', fontFamily: "'Be Vietnam Pro', sans-serif" }} onClick={(e) => e.stopPropagation()}>

          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(184, 134, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a0a06 0%, #3d1a10 100%)', color: '#f5d78e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.25rem' }}>📜</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: "'Noto Serif', serif", fontWeight: 700 }}>{t('history.manage_title', 'Quản lý Lịch sử Gieo Quẻ')}</h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{t('history.total_count', `Tổng số: ${history.length} quẻ`)}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#f5d78e', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(184, 134, 11, 0.15)', background: 'rgba(184, 134, 11, 0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" placeholder={t('history.search_placeholder', '🔍 Tìm kiếm theo tên quẻ hoặc câu hỏi...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(184, 134, 11, 0.3)', background: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={isAllSelected} onChange={handleToggleSelectAll} disabled={filteredHistory.length === 0} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                {t('history.select_all', 'Chọn tất cả')} ({filteredHistory.length})
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedIds.size > 0 && (
                  <button onClick={handleDeleteSelected} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #c0392b', background: 'rgba(192, 57, 43, 0.1)', color: '#c0392b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    🗑️ {t('history.delete_selected', `Xóa (${selectedIds.size}) mục`)}
                  </button>
                )}
                {history.length > 0 && (
                  <button onClick={handleClearAll} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(192, 57, 43, 0.4)', background: 'transparent', color: '#c0392b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    ⚠️ {t('history.clear_all', 'Xóa tất cả')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-muted, #7f8c8d)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                {searchTerm ? t('history.no_search_results', 'Không tìm thấy quẻ phù hợp') : t('history.empty', 'Chưa có quẻ nào trong lịch sử')}
              </div>
            ) : (
              filteredHistory.map((item) => {
                const isChecked = selectedIds.has(item.id);
                const isLucHao = item.type === 'luc-hao';
                const hasAI = !!(item.data?.aiConversation?.initialInterpretation || (item.data?.aiConversation?.followUps?.length > 0));
                const followUpCount = item.data?.aiConversation?.followUps?.length || 0;
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: isChecked ? '1px solid var(--color-gold, #b8860b)' : '1px solid rgba(184, 134, 11, 0.15)', background: isChecked ? 'rgba(184, 134, 11, 0.1)' : '#fff', transition: 'all 0.15s ease' }}>
                    <input type="checkbox" checked={isChecked} onChange={() => handleToggleSelectOne(item.id)} style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleSelectItem(item)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isLucHao ? '#c0392b' : '#1a6b4a', background: isLucHao ? 'rgba(192, 57, 43, 0.1)' : 'rgba(26, 107, 74, 0.1)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {isLucHao ? `🪙 ${t('history.luc_hao_badge', 'Lục Hào')}` : `🌸 ${t('history.mai_hoa_badge', 'Mai Hoa')}`}
                          </span>
                          {hasAI && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c5cfc', background: 'rgba(124,92,252,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                              💬 AI {followUpCount > 0 ? `+${followUpCount}` : ''}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#7f8c8d', fontFamily: 'monospace' }}>{formatTime(item.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Noto Serif', serif", color: 'var(--color-ink, #2c3e50)', marginBottom: 2 }}>{formatHistoryTitle(item)}</div>
                      {item.question && (
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.question === '(Không có câu hỏi)' ? t('history.no_question', '(Không có câu hỏi)') : item.question}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <button onClick={(e) => handlePreviewItem(item, e)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(124,92,252,0.3)', background: 'rgba(124,92,252,0.08)', color: '#7c5cfc', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        👁 Chi tiết
                      </button>
                      <button onClick={() => handleSelectItem(item)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(184, 134, 11, 0.3)', background: 'rgba(184, 134, 11, 0.08)', color: 'var(--color-ink, #2c3e50)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        {t('history.view_btn', 'Xem quẻ')} ➔
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
