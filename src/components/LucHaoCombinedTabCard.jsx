import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import LucHaoTable from './LucHaoTable.jsx';
import DescriptionPanel from './DescriptionPanel.jsx';

/**
 * Combined Section for Bảng Lục Hào & Luận Giải Cơ Bản (2 Tabs)
 * Default Tab: 'table' (Bảng Lục Hào)
 */
export default function LucHaoCombinedTabCard({ result }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'basic'

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
      </div>

      {/* Tab 1 Content: Bảng Lục Hào (Default) */}
      {activeTab === 'table' && (
        <div className="animate-in">
          <LucHaoTable result={result} />
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
    </section>
  );
}
