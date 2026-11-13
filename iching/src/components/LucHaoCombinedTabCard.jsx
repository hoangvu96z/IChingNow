import { useEvidence } from '../context/evidenceState';
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/useLanguage.js';
import LucHaoTable from './LucHaoTable.jsx';
import DescriptionPanel from './DescriptionPanel.jsx';
import LearnPanel from './LearnPanel.jsx';
import GlossarySheet from './GlossarySheet.jsx';
import UngKyCard from './UngKyCard.jsx';
import { analyzeLucHao } from '../logic/lucHaoAnalysis.js';
import { inferTopicFromQuestion } from '../data/lucHaoRules.js';

/**
 * Combined Section for Bảng Lục Hào, Chẩn Đoán Sâu & Ứng Kỳ, Luận Giải Cơ Bản, Học Xem Quẻ
 */
export default function LucHaoCombinedTabCard({ result }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'ungky' | 'basic' | 'learn'
  const [highlight, setHighlight] = useState([]);
  const [termKey, setTermKey] = useState(null);
  const [topic, setTopic] = useState(() => inferTopicFromQuestion(result?.question || ''));

  useEffect(() => {
    setTopic(inferTopicFromQuestion(result?.question || ''));
  }, [result?.createdAt, result?.question]);

  const analysis = useMemo(() => analyzeLucHao(result, topic), [result, topic]);

  const evidence = useEvidence();
  useEffect(() => {
    if (evidence?.selectedIds.some((id) => id.startsWith('line.'))) setActiveTab('table');
  }, [evidence?.selectedIds]);

  if (!result) return null;

  const tabStyle = (isSelected) => ({
    background: isSelected ? 'var(--color-gold, #8a6104)' : 'rgba(184, 134, 11, 0.09)',
    color: isSelected ? 'var(--color-on-gold, #ffffff)' : 'var(--color-ink, #2c2621)',
    border: '1px solid ' + (isSelected ? 'var(--color-gold, #8a6104)' : 'rgba(184, 134, 11, 0.3)'),
    borderBottom: isSelected ? '3px solid var(--color-vermillion, #c0392b)' : undefined,
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: '0.84rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: isSelected ? '0 2px 8px rgba(184,134,11,0.25)' : 'none',
    transition: 'all 0.2s ease',
  });

  return (
    <section className="card animate-in" style={{ padding: 20, minInlineSize: 0 }}>
      {/* Tabs Header Switcher */}
      <div
        role="tablist"
        aria-label="Các chế độ xem Bảng Lục Hào"
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
          paddingBottom: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'table'}
          className="iching-touch-control"
          onClick={() => setActiveTab('table')}
          style={tabStyle(activeTab === 'table')}
        >
          <span aria-hidden="true">📊</span> {t('result.hex_table', 'Bảng Lục Hào')}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-ung-ky"
          aria-selected={activeTab === 'ungky'}
          className="iching-touch-control"
          onClick={() => setActiveTab('ungky')}
          style={tabStyle(activeTab === 'ungky')}
        >
          <span aria-hidden="true">⏱️</span> Luận sâu &amp; Ứng Kỳ
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'basic'}
          className="iching-touch-control"
          onClick={() => setActiveTab('basic')}
          style={tabStyle(activeTab === 'basic')}
        >
          <span aria-hidden="true">📖</span> {t('result.basic_interpretation', 'Luận giải cơ bản')}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-learn"
          aria-selected={activeTab === 'learn'}
          className="iching-touch-control"
          onClick={() => setActiveTab('learn')}
          style={tabStyle(activeTab === 'learn')}
        >
          <span aria-hidden="true">🎓</span> Học xem quẻ
        </button>
      </div>

      {/* Tab 1 & Learn Content: Bảng Lục Hào */}
      {(activeTab === 'table' || activeTab === 'learn') && (
        <div role="tabpanel" className="animate-in" style={{ minInlineSize: 0 }}>
          <LucHaoTable
            result={result}
            highlight={activeTab === 'learn' ? highlight : []}
            onLearn={setTermKey}
          />
          {activeTab === 'table' && (
            <>
              <p style={{ margin: '10px 0 16px', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                💡 Chạm vào các mục có gạch chân (Thế/Ứng, Lục Thân, Tuần Không...) để xem giải nghĩa.
              </p>
              {analysis && (
                <UngKyCard
                  analysis={analysis}
                  topic={topic}
                  onTopicChange={setTopic}
                  showDiagnostics={true}
                  onLearn={setTermKey}
                  idPrefix="table-ung-ky"
                />
              )}
            </>
          )}
          {activeTab === 'learn' && (
            <div style={{ marginTop: 16 }}>
              <LearnPanel result={result} onHighlight={setHighlight} onLearn={setTermKey} />
            </div>
          )}
        </div>
      )}

      {/* Tab 2 Content: Chẩn Đoán Sâu Tăng San Bốc Dịch & Dự Báo Ứng Kỳ */}
      {activeTab === 'ungky' && (
        <div role="tabpanel" className="animate-in" style={{ minInlineSize: 0 }}>
          <UngKyCard
            analysis={analysis}
            topic={topic}
            onTopicChange={setTopic}
            showDiagnostics={true}
            onLearn={setTermKey}
            idPrefix="dedicated-ung-ky"
          />
        </div>
      )}

      {/* Tab 3 Content: Luận Giải Cơ Bản */}
      {activeTab === 'basic' && (
        <div role="tabpanel" className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, minInlineSize: 0 }}>
          {(result.primaryHexagram || result.changedHexagram) ? (
            <>
              <DescriptionPanel hexagram={result.primaryHexagram} color="var(--color-vermillion)" />
              {result.changedHexagram && (
                <DescriptionPanel hexagram={result.changedHexagram} color="var(--color-jade)" />
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-ink-muted)', padding: '24px 0' }}>
              {t('result.no_interpretation', 'Chưa có thông tin luận giải.')}
            </div>
          )}
        </div>
      )}

      <GlossarySheet termKey={termKey} onClose={() => setTermKey(null)} />
    </section>
  );
}
