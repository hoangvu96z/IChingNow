import { useEvidence } from '../context/evidenceState';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import LucHaoTable from './LucHaoTable.jsx';
import DescriptionPanel from './DescriptionPanel.jsx';
import LearnPanel from './LearnPanel.jsx';
import GlossarySheet from './GlossarySheet.jsx';

/**
 * Combined Section for Bảng Lục Hào & Luận Giải Cơ Bản (2 Tabs)
 * Default Tab: 'table' (Bảng Lục Hào)
 */
export default function LucHaoCombinedTabCard({ result }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'basic' | 'learn'
  const [highlight, setHighlight] = useState([]);
  const [termKey, setTermKey] = useState(null);

  const evidence = useEvidence();
  useEffect(() => {
    if (evidence?.selectedIds.some(id => id.startsWith('line.'))) setActiveTab('table');
  }, [evidence?.selectedIds]);

  if (!result) return null;

  return (
    <section className="card animate-in" style={{ padding: 20 }}>
      {/* 2 Tabs Header Switcher */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
          paddingBottom: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('table')}
          style={{
            background: activeTab === 'table' ? 'var(--color-gold, #b8860b)' : 'rgba(184, 134, 11, 0.07)',
            color: activeTab === 'table' ? '#ffffff' : 'var(--color-ink, #2c2621)',
            border: '1px solid ' + (activeTab === 'table' ? 'var(--color-gold, #b8860b)' : 'rgba(184, 134, 11, 0.3)'),
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: activeTab === 'table' ? '0 2px 8px rgba(184,134,11,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          📊 {t('result.hex_table', 'Bảng Lục Hào')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          style={{
            background: activeTab === 'basic' ? 'var(--color-gold, #b8860b)' : 'rgba(184, 134, 11, 0.07)',
            color: activeTab === 'basic' ? '#ffffff' : 'var(--color-ink, #2c2621)',
            border: '1px solid ' + (activeTab === 'basic' ? 'var(--color-gold, #b8860b)' : 'rgba(184, 134, 11, 0.3)'),
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: activeTab === 'basic' ? '0 2px 8px rgba(184,134,11,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          📖 {t('result.basic_interpretation', 'Luận giải cơ bản')}
        </button>

        <button
          type="button"
          id="tab-learn"
          onClick={() => setActiveTab('learn')}
          style={{
            background: activeTab === 'learn' ? 'var(--color-gold, #b8860b)' : 'rgba(184, 134, 11, 0.07)',
            color: activeTab === 'learn' ? '#ffffff' : 'var(--color-ink, #2c2621)',
            border: '1px solid ' + (activeTab === 'learn' ? 'var(--color-gold, #b8860b)' : 'rgba(184, 134, 11, 0.3)'),
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: activeTab === 'learn' ? '0 2px 8px rgba(184,134,11,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          🎓 Học xem quẻ
        </button>
      </div>

      {/* Tab 1 Content: Bảng Lục Hào (Default) */}
      {(activeTab === 'table' || activeTab === 'learn') && (
        <div className="animate-in">
          <LucHaoTable
            result={result}
            highlight={activeTab === 'learn' ? highlight : []}
            onLearn={setTermKey}
          />
          {activeTab === 'table' && (
            <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
              💡 Chạm vào các mục có gạch chân (Thế/Ứng, Lục Thân, Tuần Không...) để xem giải nghĩa.
            </p>
          )}
          {activeTab === 'learn' && (
            <div style={{ marginTop: 16 }}>
              <LearnPanel result={result} onHighlight={setHighlight} onLearn={setTermKey} />
            </div>
          )}
        </div>
      )}

      {/* Tab 2 Content: Luận Giải Cơ Bản */}
      {activeTab === 'basic' && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
