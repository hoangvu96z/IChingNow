import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Bảng Lục Hào chính — render cả quẻ chủ và quẻ biến song song
 */
export default function LucHaoTable({ result }) {
  const { t, language } = useLanguage();

  if (!result || !result.lines || result.lines.length < 6) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        {t('result.no_data', 'Chưa có dữ liệu quẻ')}
      </div>
    );
  }

  const hasChanged = result.movingLines?.length > 0 && result.changedLines;
  // Hào từ H6 xuống H1
  const sortedPrimary = [...result.lines].sort((a, b) => b.index - a.index);
  const sortedChanged = hasChanged
    ? [...result.changedLines].sort((a, b) => b.index - a.index)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Tên quẻ */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '2px solid rgba(184,134,11,0.25)' }}>
        <HexNameHeader
          hexagram={result.primaryHexagram}
          palace={result.palaceName}
          queType={result.queType}
          flex={hasChanged ? 1 : undefined}
        />
        {hasChanged && (
          <>
            <div style={{ width: 1, background: 'rgba(184,134,11,0.2)' }} />
            <HexNameHeader
              hexagram={result.changedHexagram}
              palace={result.changedLines ? findPalaceLabel(result.changedLines, result) : ''}
              isChanged
              flex={1}
            />
          </>
        )}
      </div>

      {/* Bảng hào chính */}
      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 1, minWidth: hasChanged ? 480 : 'auto' }}>
          {/* Quẻ chủ */}
          <div style={{ flex: 1, minWidth: hasChanged ? 230 : 0 }}>
            <HaoTableSection
              lines={sortedPrimary}
              khongVong={result.khongVong || []}
              showLucThu={false}
              accentColor="var(--color-vermillion)"
            />
          </div>

          {hasChanged && (
            <>
              <div style={{ width: 1, background: 'rgba(184,134,11,0.15)', flexShrink: 0 }} />
              {/* Quẻ biến */}
              <div style={{ flex: 1, minWidth: 230 }}>
                <HaoTableSection
                  lines={sortedChanged}
                  khongVong={result.khongVong || []}
                  showLucThu={true}
                  accentColor="var(--color-jade)"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thông tin Thế/Ứng và Không Vong */}
      <InfoFooter result={result} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function HexNameHeader({ hexagram, palace, queType, isChanged, flex }) {
  const { t, language } = useLanguage();
  
  if (!hexagram) return null;
  const hexName = language === 'en' ? t(`hex.name.${hexagram.id}`, hexagram.nameVi) : hexagram.nameVi;
  
  // Format palace element
  const palaceNameTrans = t(`trigram.${palace}`, palace);
  const queTypeTrans = queType ? t(`queType.${queType}`, queType) : '';
  const palaceLabel = queTypeTrans ? `${palaceNameTrans} (${queTypeTrans})` : palaceNameTrans;

  return (
    <div style={{
      flex: flex || 1,
      textAlign: 'center',
      padding: '10px 8px 8px',
      background: isChanged
        ? 'rgba(26,107,74,0.06)'
        : 'rgba(192,57,43,0.06)',
    }}>
      <div style={{
        fontFamily: "'Noto Serif', serif",
        fontSize: '1rem',
        fontWeight: 800,
        color: isChanged ? 'var(--color-jade)' : 'var(--color-vermillion)',
        letterSpacing: '0.04em',
        marginBottom: 2,
      }}>
        {hexName.toUpperCase()}
      </div>
      {palace && (
        <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginBottom: 2 }}>
          {palaceLabel}
        </div>
      )}
    </div>
  );
}

function HaoTableSection({ lines, khongVong, showLucThu, accentColor }) {
  const { t, language } = useLanguage();

  const headers = [
    t('result.col_yao', 'Vạch'),
    t('result.col_the_ung', 'T/Ứ'),
    t('result.col_luc_than', 'Lục Thân'),
    t('result.col_can_chi', 'Can Chi'),
    t('result.col_phuc_than', 'P.Thần'),
    t('result.col_tuan_khong', 'T.K'),
  ];
  if (showLucThu) {
    headers.push(t('result.col_luc_thu', 'Lục Thú'));
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', tableLayout: 'auto' }}>
      <thead>
        <tr style={{ borderBottom: '1.5px solid rgba(184,134,11,0.25)' }}>
          {headers.map((h, i) => (
            <Th key={i}>{h}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => {
          const isKV = khongVong.includes(line.chi);
          const isMoving = line.moving;

          // Localize terms
          const theUngLabel = line.theUng === 'Thế' ? t('theUng.the', 'Thế') : line.theUng === 'Ứng' ? t('theUng.ung', 'Ứng') : '';
          const lucThanLabel = line.lucThan ? t(`lucThan.${line.lucThan}`, line.lucThan) : '';
          
          const chiTrans = t(`branch.${line.chi}`, line.chi);
          const elementTrans = t(`element.${line.nguHanhHao}`, line.nguHanhHao);
          const canChiLabel = line.chi && line.nguHanhHao ? `${chiTrans}-${elementTrans}` : '—';
          const canLabel = line.can ? t(`stem.${line.can}`, line.can) : '';

          const phucThanLabel = line.phucThan ? t(`lucThan.${line.phucThan.lucThan}`, line.phucThan.lucThan) : '';
          const ptChiTrans = line.phucThan ? t(`branch.${line.phucThan.chi}`, line.phucThan.chi) : '';
          const ptElementTrans = line.phucThan ? t(`element.${line.phucThan.nguHanh}`, line.phucThan.nguHanh) : '';

          const lucThuLabel = line.lucThu ? t(`lucThu.${line.lucThu}`, line.lucThu) : '—';

          return (
            <tr key={line.index} style={{
              borderBottom: '1px solid rgba(184,134,11,0.09)',
              background: idx % 2 === 0 ? 'transparent' : 'rgba(184,134,11,0.03)',
            }}>
              {/* Vạch */}
              <Td>
                <YaoMiniLine line={line} accent={isMoving ? accentColor : 'var(--color-ink)'} />
              </Td>

              {/* Thế/Ứng */}
              <Td center>
                {theUngLabel && (
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: line.isThe ? 'var(--color-vermillion)' : 'var(--color-jade)',
                    background: line.isThe ? 'rgba(192,57,43,0.1)' : 'rgba(26,107,74,0.1)',
                    padding: '1px 5px',
                    borderRadius: 4,
                  }}>
                    {theUngLabel}
                  </span>
                )}
              </Td>

              {/* Lục Thân */}
              <Td>
                <span style={{
                  color: isMoving ? accentColor : 'var(--color-ink)',
                  fontWeight: isMoving ? 700 : 500,
                }}>
                  {lucThanLabel || '—'}
                </span>
              </Td>

              {/* Can Chi + Ngũ Hành */}
              <Td>
                <span style={{ color: isKV ? 'var(--color-ink-muted)' : 'var(--color-ink)' }}>
                  {canChiLabel}
                </span>
                {canLabel && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)', marginTop: 1 }}>
                    {canLabel}
                  </div>
                )}
              </Td>

              {/* Phục Thần */}
              <Td>
                {line.phucThan && (
                  <div style={{ fontSize: '0.75rem' }}>
                    <div style={{ color: '#7b6f3a', fontWeight: 600 }}>{phucThanLabel}</div>
                    <div style={{ color: 'var(--color-ink-muted)' }}>{ptChiTrans}-{ptElementTrans}</div>
                  </div>
                )}
              </Td>

              {/* Tuần Không */}
              <Td center>
                {isKV && (
                  <span style={{
                    color: '#7b6f3a',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid #b8860b55',
                    borderRadius: 3,
                    padding: '1px 4px',
                  }}>
                    {language === 'en' ? 'V' : 'K'}
                  </span>
                )}
              </Td>

              {/* Lục Thú (chỉ quẻ biến) */}
              {showLucThu && (
                <Td>
                  <span style={{ fontSize: '0.75rem', color: getLucThuColor(line.lucThu) }}>
                    {lucThuLabel}
                  </span>
                </Td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function InfoFooter({ result }) {
  const { t } = useLanguage();
  
  const palaceNameTrans = t(`trigram.${result.palaceName}`, result.palaceName);
  const palaceElementTrans = t(`element.${result.palaceElement}`, result.palaceElement);
  const queTypeTrans = t(`queType.${result.queType}`, result.queType);
  const khongVongTrans = result.khongVong?.map(v => t(`branch.${v}`, v)).join(', ') || '';

  const dayCanTrans = result.canChi ? t(`stem.${result.canChi.ngayCan}`, result.canChi.ngayCan) : '';
  const dayChiTrans = result.canChi ? t(`branch.${result.canChi.ngayChi}`, result.canChi.ngayChi) : '';
  const canNgayTrans = dayCanTrans && dayChiTrans ? `${dayCanTrans} ${dayChiTrans}` : '';

  return (
    <div style={{
      marginTop: 10,
      padding: '8px 10px',
      background: 'rgba(184,134,11,0.05)',
      borderRadius: 6,
      border: '1px solid rgba(184,134,11,0.15)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px 20px',
      fontSize: '0.8125rem',
    }}>
      <InfoItem label={t('info.palace', 'Cung')} value={`${palaceNameTrans} (${palaceElementTrans})`} />
      <InfoItem label={t('info.que_type', 'Loại quẻ')} value={queTypeTrans} />
      <InfoItem label={t('info.the_h', 'Thế H')} value={result.theHao} />
      <InfoItem label={t('info.ung_h', 'Ứng H')} value={result.ungHao} />
      {result.khongVong?.length > 0 && (
        <InfoItem label={t('info.tuan_khong', 'Tuần Không')} value={khongVongTrans} color="#7b6f3a" />
      )}
      {canNgayTrans && (
        <InfoItem label={t('info.can_ngay', 'Can Ngày')} value={canNgayTrans} />
      )}
    </div>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────

function Th({ children }) {
  return (
    <th style={{
      padding: '6px 6px',
      textAlign: 'left',
      fontSize: '0.6875rem',
      fontWeight: 700,
      color: 'var(--color-ink-muted)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children, center }) {
  return (
    <td style={{
      padding: '7px 6px',
      verticalAlign: 'middle',
      textAlign: center ? 'center' : 'left',
    }}>
      {children}
    </td>
  );
}

function YaoMiniLine({ line, accent }) {
  const h  = 5;
  const bg = accent || 'var(--color-ink)';
  if (line.yinYang === 'yang') {
    return <div style={{ height: h, width: 44, background: bg, borderRadius: 2 }} />;
  }
  return (
    <div style={{ display: 'flex', gap: 6, width: 44 }}>
      <div style={{ flex: 1, height: h, background: bg, borderRadius: 2 }} />
      <div style={{ flex: 1, height: h, background: bg, borderRadius: 2 }} />
    </div>
  );
}

function InfoItem({ label, value, color }) {
  return (
    <span>
      <span style={{ color: 'var(--color-ink-muted)', marginRight: 3 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: color || 'var(--color-ink)' }}>{value}</span>
    </span>
  );
}

// ── Utilities ──────────────────────────────────────────────────────────────

const LUC_THU_COLORS = {
  'Thanh Long': '#1a6b4a',
  'Chu Tước':   '#c0392b',
  'Câu Trận':   '#8B6914',
  'Đằng Xà':    '#6A0DAD',
  'Bạch Hổ':    '#555',
  'Huyền Vũ':   '#1a4a6b',
  
  'Azure Dragon': '#1a6b4a',
  'Vermilion Bird': '#c0392b',
  'Curving Snake': '#8B6914',
  'Soaring Serpent': '#6A0DAD',
  'White Tiger': '#555',
  'Black Tortoise': '#1a4a6b',
};

function getLucThuColor(name) {
  return LUC_THU_COLORS[name] || 'var(--color-ink-muted)';
}

function findPalaceLabel(changedLines, result) {
  return result.changedHexagram ? '' : '';
}
