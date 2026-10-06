import React, { useState, useMemo } from 'react';
import { KNOWLEDGE_POSTS, postOfTheDay } from '../data/knowledgePosts.js';
import KnowledgeCard from './KnowledgeCard.jsx';

const FILTERS = [
  { key: 'all', label: 'Tất cả', emoji: '📋' },
  { key: 'concept', label: 'Kiến thức', emoji: '📚' },
  { key: 'tip', label: 'Mẹo', emoji: '💡' },
  { key: 'quiz', label: 'Quiz', emoji: '🎯' },
  { key: 'hexOfDay', label: 'Quẻ', emoji: '☯' },
];

const gold = 'var(--color-gold, #b8860b)';

const btnStyle = (active) => ({
  background: active ? gold : 'rgba(184,134,11,0.07)',
  color: active ? '#fff' : 'var(--color-ink, #2c2621)',
  border: '1px solid ' + (active ? gold : 'rgba(184,134,11,0.3)'),
  padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
  cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
});

/**
 * Feed "Dịch Học mỗi ngày" — modal toàn màn hình.
 * Props: onExit
 */
export default function KnowledgeFeed({ onExit }) {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 6;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPost = useMemo(() => postOfTheDay(todayStr), [todayStr]);

  const filtered = useMemo(() => {
    if (filter === 'all') return KNOWLEDGE_POSTS;
    return KNOWLEDGE_POSTS.filter((p) => p.type === filter);
  }, [filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Dịch Học mỗi ngày"
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        overflowY: 'auto', background: 'rgba(20,14,6,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 14px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f5d78e' }}>
          <h2 style={{ margin: 0, fontFamily: "'Noto Serif', serif", fontSize: '1.25rem' }}>
            📖 Dịch Học mỗi ngày
          </h2>
          <button
            type="button" id="knowledge-exit"
            onClick={onExit}
            style={{
              background: 'rgba(255,255,255,0.12)', color: '#f5d78e',
              border: '1px solid rgba(245,215,142,0.4)',
              padding: '6px 14px', borderRadius: 10, fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            ✕ Đóng
          </button>
        </div>

        {/* Today's post highlight */}
        <div style={{
          background: 'var(--color-paper, #fffaf0)',
          borderRadius: 16, padding: '16px 18px',
          border: '1px solid rgba(184,134,11,0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: gold, fontWeight: 800, marginBottom: 10 }}>
            ⭐ Kiến thức hôm nay — {todayStr}
          </div>
          <KnowledgeCard post={todayPost} compact />
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              id={`kn-filter-${f.key}`}
              onClick={() => { setFilter(f.key); setPage(0); }}
              style={btnStyle(filter === f.key)}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Feed grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pageItems.map((post) => (
            <div key={post.id} className="animate-in">
              <KnowledgeCard post={post} compact />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            padding: '8px 0',
          }}>
            <button
              type="button" id="kn-prev"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{ ...btnStyle(false), opacity: page === 0 ? 0.4 : 1 }}
            >
              ← Trước
            </button>
            <span style={{ fontSize: '0.85rem', color: '#d4ccb8', fontWeight: 600 }}>
              {page + 1} / {totalPages}
            </span>
            <button
              type="button" id="kn-next"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              style={{ ...btnStyle(false), opacity: page >= totalPages - 1 ? 0.4 : 1 }}
            >
              Tiếp →
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center', fontSize: '0.75rem', color: '#8a7f6a',
          padding: '8px 0',
        }}>
          60 thẻ kiến thức Lục Hào · IChingNow
        </div>
      </div>
    </div>
  );
}
