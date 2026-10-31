import { useEvidence } from '../context/evidenceState';
import React from 'react';
import { useLanguage } from '../context/useLanguage.js';
import { GLOSSARY } from '../data/glossary.js';

/**
 * Bảng Lục Hào chính — render cả quẻ chủ và quẻ biến song song
 */
export default function LucHaoTable({ result, highlight = [], onLearn }) {
  const { t } = useLanguage();

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
      {/* Thanh thông tin Tiết khí · Nhật thần · Nguyệt lệnh · Tuần Không */}
      <CosmicHeaderBar result={result} onLearn={onLearn} />

      {/* Tên quẻ (Quẻ Chủ · Quẻ Hỗ · Quẻ Biến) */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '2px solid rgba(184,134,11,0.25)', flexWrap: 'wrap' }}>
        <HexNameHeader
          hexagram={result.primaryHexagram}
          palace={result.palaceName}
          queType={result.queType}
          trait={result.primaryTrait}
          roleLabel={t('result.primary_hex', 'QUẺ CHỦ')}
          flex={1}
          onLearn={onLearn}
        />
        {result.queHo?.hexagram && (
          <>
            <div style={{ width: 1, background: 'rgba(184,134,11,0.2)' }} />
            <HexNameHeader
              hexagram={result.queHo.hexagram}
              palace={result.queHo.palaceName}
              queType={result.queHo.queType}
              trait={result.queHo.trait}
              roleLabel={t('result.nuclear_hex', 'QUẺ HỖ')}
              isNuclear
              flex={1}
              onLearn={onLearn}
            />
          </>
        )}
        {hasChanged && (
          <>
            <div style={{ width: 1, background: 'rgba(184,134,11,0.2)' }} />
            <HexNameHeader
              hexagram={result.changedHexagram}
              palace={findPalaceLabel(result.changedLines, result)}
              queType={result.changedQueType}
              trait={result.changedTrait}
              roleLabel={t('result.changed_hex', 'QUẺ BIẾN')}
              isChanged
              flex={1}
              onLearn={onLearn}
            />
          </>
        )}
      </div>

      {/* Bảng hào chính (Lục Thân, Can Chi, Phục Thần, Tuần Không, Lục Thú) */}
      <div
        tabIndex={0}
        role="region"
        aria-label={t('result.hex_table', 'Bảng Lục Hào')}
        style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', marginBottom: 12 }}
      >
        <div style={{ display: 'flex', gap: 1, minWidth: hasChanged ? 520 : 'auto' }}>
          {/* Quẻ chủ — khi Quẻ Tĩnh (!hasChanged) vẫn hiển thị cột Lục Thú */}
          <div style={{ flex: 1, minWidth: hasChanged ? 250 : 0 }}>
            <HaoTableSection
              evidenceKind="primary"
              lines={sortedPrimary}
              khongVong={result.khongVong || []}
              showLucThu={!hasChanged}
              accentColor="var(--color-vermillion)"
              highlight={highlight}
              onLearn={onLearn}
            />
          </div>

          {hasChanged && (
            <>
              <div style={{ width: 1, background: 'rgba(184,134,11,0.18)', flexShrink: 0 }} />
              {/* Quẻ biến */}
              <div style={{ flex: 1, minWidth: 250 }}>
                <HaoTableSection
                  evidenceKind="changed"
                  lines={sortedChanged}
                  khongVong={result.khongVong || []}
                  showLucThu={true}
                  accentColor="var(--color-jade)"
                  onLearn={onLearn}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bảng phụ chi tiết: Hào (Can Chi) | Q.Thần | TS.Ngày | TS.Tháng | Lộc | Mã | Đào */}
      <div
        tabIndex={0}
        role="region"
        aria-label={t('result.sub_table_aria', 'Bảng Quái Thân, Trường Sinh và Thần Sát')}
        style={{
          overflowX: 'auto',
          width: '100%',
          WebkitOverflowScrolling: 'touch',
          marginBottom: 8,
          borderTop: '1.5px solid rgba(184,134,11,0.22)',
          paddingTop: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 1, minWidth: hasChanged ? 520 : 'auto' }}>
          <div style={{ flex: 1, minWidth: hasChanged ? 250 : 0 }}>
            <SubDetailTableSection
              lines={sortedPrimary}
              accentColor="var(--color-vermillion)"
              isChangedSide={false}
              onLearn={onLearn}
            />
          </div>

          {hasChanged && (
            <>
              <div style={{ width: 1, background: 'rgba(184,134,11,0.18)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 250 }}>
                <SubDetailTableSection
                  lines={sortedChanged}
                  accentColor="var(--color-jade)"
                  isChangedSide={true}
                  onLearn={onLearn}
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

function CosmicHeaderBar({ result, onLearn }) {
  const { t, language } = useLanguage();
  const canChi = result.canChi;
  if (!canChi) return null;

  const tietKhi = language === 'en'
    ? (canChi.tietKhiEn || result.solarTerm?.nameEn || canChi.tietKhi || '')
    : (canChi.tietKhi || result.solarTerm?.nameVi || '');

  const ngayChiTrans = canChi.ngayChi ? t(`branch.${canChi.ngayChi}`, canChi.ngayChi) : '';
  const ngayElTrans  = canChi.ngayChiObj?.element ? t(`element.${canChi.ngayChiObj.element}`, canChi.ngayChiObj.element) : '';
  const nhatThanLabel = ngayChiTrans && ngayElTrans ? `${ngayChiTrans}-${ngayElTrans}` : (canChi.nhatThan || '');

  const thangChiTrans = canChi.thangChi ? t(`branch.${canChi.thangChi}`, canChi.thangChi) : '';
  const thangElTrans  = canChi.thangChiObj?.element ? t(`element.${canChi.thangChiObj.element}`, canChi.thangChiObj.element) : '';
  const nguyetLenhLabel = thangChiTrans && thangElTrans ? `${thangChiTrans}-${thangElTrans}` : (canChi.nguyetLenh || '');

  const tuanKhongLabel = (result.khongVong || []).map(v => t(`branch.${v}`, v)).join('-');

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px 18px',
      padding: '7px 10px',
      marginBottom: 10,
      background: 'rgba(184,134,11,0.06)',
      border: '1px solid rgba(184,134,11,0.18)',
      borderRadius: 6,
      fontSize: '0.8rem',
      alignItems: 'center',
    }}>
      {tietKhi && (
        <InfoItem label={t('meta.solar_term', 'Tiết khí')} value={tietKhi} />
      )}
      {nhatThanLabel && nhatThanLabel !== '?' && (
        <Tap k="nhatThan" onLearn={onLearn}>
          <InfoItem label={t('info.nhat_than', 'Nhật thần')} value={nhatThanLabel} />
        </Tap>
      )}
      {nguyetLenhLabel && nguyetLenhLabel !== '?' && (
        <Tap k="nguyetKien" onLearn={onLearn}>
          <InfoItem label={t('info.nguyet_lenh', 'Nguyệt lệnh')} value={nguyetLenhLabel} />
        </Tap>
      )}
      {tuanKhongLabel && (
        <Tap k="khongVong" onLearn={onLearn}>
          <InfoItem
            label={t('info.tuan_khong', 'Tuần Không')}
            value={tuanKhongLabel}
            color="var(--color-gold, #b8860b)"
          />
        </Tap>
      )}
    </div>
  );
}

function HexNameHeader({ hexagram, palace, queType, trait, roleLabel, isChanged, isNuclear, flex, onLearn }) {
  const { t, language } = useLanguage();
  
  if (!hexagram) return null;
  const hexName = language === 'en' ? t(`hex.name.${hexagram.id}`, hexagram.nameVi) : hexagram.nameVi;
  
  // Format Họ Quẻ + Đặc tính (Lục Xung / Lục Hợp / Du Hồn / Quy Hồn)
  const palaceNameTrans = palace ? t(`trigram.${palace}`, palace) : '';
  const traitText = trait?.code
    ? (language === 'en' ? trait.labelEn : trait.labelVi)
    : (queType && queType !== 'bat-thuan' && queType !== 'unknown' ? t(`queType.${queType}`, queType) : '');

  const palaceLabel = palaceNameTrans
    ? (language === 'en'
        ? `${palaceNameTrans} Palace${traitText ? ` (${traitText})` : ''}`
        : `HỌ ${palaceNameTrans.toUpperCase()}${traitText ? ` (${traitText.toUpperCase()})` : ''}`)
    : '';

  const traitGlossaryKey = trait?.code === 'luc-xung'
    ? 'lucXung'
    : trait?.code === 'luc-hop'
      ? 'lucHop'
      : trait?.code === 'du-hon'
        ? 'duHon'
        : trait?.code === 'quy-hon'
          ? 'quyHon'
          : palace;

  const titleColor = isChanged
    ? 'var(--color-jade)'
    : isNuclear
      ? 'var(--color-gold, #8a6104)'
      : 'var(--color-vermillion)';

  const bg = isChanged
    ? 'rgba(26,107,74,0.06)'
    : isNuclear
      ? 'rgba(184,134,11,0.05)'
      : 'rgba(192,57,43,0.06)';

  const learnKey = isChanged ? 'queBien' : isNuclear ? 'hoQuai' : 'queChu';

  return (
    <div style={{
      flex: flex || 1,
      minWidth: 140,
      textAlign: 'center',
      padding: '10px 8px 8px',
      background: bg,
    }}>
      {roleLabel && (
        <div style={{
          fontSize: '0.625rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--color-ink-muted)',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}>
          {roleLabel}
        </div>
      )}
      <div
        onClick={() => onLearn && onLearn(learnKey)}
        title={onLearn ? 'Chạm để xem khái niệm' : undefined}
        style={{
          fontFamily: "'Noto Serif', serif",
          fontSize: '1rem',
          fontWeight: 800,
          color: titleColor,
          letterSpacing: '0.04em',
          marginBottom: 2,
          cursor: onLearn ? 'pointer' : 'default',
        }}
      >
        {hexName.toUpperCase()}
      </div>
      {palaceLabel && (
        <div
          onClick={() => onLearn && onLearn(traitGlossaryKey)}
          title={onLearn ? `Chạm để tra cứu ${palaceLabel}` : undefined}
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            marginBottom: 2,
            cursor: onLearn ? 'pointer' : 'default',
          }}
        >
          {palaceLabel}
        </div>
      )}
    </div>
  );
}

function HaoTableSection({ evidenceKind, lines, khongVong, showLucThu, accentColor, highlight = [], onLearn }) {
  const evidence = useEvidence();
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

          const isHl = highlight.includes(line.index);
          return (
            <tr key={line.index} {...evidence?.targetProps(`line.${evidenceKind}.${line.index}`)} style={{
              borderBottom: '1px solid rgba(184,134,11,0.09)',
              background: isHl ? 'rgba(184,134,11,0.18)' : idx % 2 === 0 ? 'transparent' : 'rgba(184,134,11,0.03)',
              outline: isHl ? '2px solid rgba(184,134,11,0.7)' : 'none',
              outlineOffset: -2,
              transition: 'background 0.25s ease',
            }}>
              {/* Vạch */}
              <Td>
                <YaoMiniLine line={line} accent={isMoving ? accentColor : 'var(--color-ink)'} />
              </Td>

              {/* Thế/Ứng */}
              <Td center>
                {theUngLabel && (
                  <Tap k={line.isThe ? 'the' : 'ung'} onLearn={onLearn}>
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
                  </Tap>
                )}
              </Td>

              {/* Lục Thân */}
              <Td>
                <Tap k={line.lucThan} onLearn={onLearn}>
                  <span style={{
                    color: isMoving ? accentColor : 'var(--color-ink)',
                    fontWeight: isMoving ? 700 : 500,
                  }}>
                    {lucThanLabel || '—'}
                  </span>
                </Tap>
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
                  <Tap k="phucThan" onLearn={onLearn}>
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--color-gold, #b8860b)', fontWeight: 600 }}>{phucThanLabel}</div>
                      <div style={{ color: 'var(--color-ink-muted)' }}>{ptChiTrans}-{ptElementTrans}</div>
                    </div>
                  </Tap>
                )}
              </Td>

              {/* Tuần Không */}
              <Td center>
                {isKV && (
                  <Tap k="khongVong" onLearn={onLearn}>
                    <span style={{
                      color: 'var(--color-gold, #b8860b)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      border: '1px solid rgba(184, 134, 11, 0.35)',
                      borderRadius: 3,
                      padding: '1px 4px',
                    }}>
                      {language === 'en' ? 'V' : 'K'}
                    </span>
                  </Tap>
                )}
              </Td>

              {/* Lục Thú (chỉ quẻ biến) */}
              {showLucThu && (
                <Td>
                  <Tap k={line.lucThu} onLearn={onLearn}>
                    <span style={{ fontSize: '0.75rem', color: getLucThuColor(line.lucThu) }}>
                      {lucThuLabel}
                    </span>
                  </Tap>
                </Td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SubDetailTableSection({ lines, accentColor, isChangedSide, onLearn }) {
  const { t, language } = useLanguage();

  const headers = [
    { label: t('result.col_hao_canchi', 'Hào'),     key: null },
    { label: t('result.col_quai_than',  'Q.Thần'),  key: 'quaiThan', center: true },
    { label: t('result.col_ts_ngay',    'TS.Ngày'), key: 'truongSinh' },
    { label: t('result.col_ts_thang',   'TS.Tháng'),key: 'truongSinh' },
    { label: t('result.col_loc',        'Lộc'),     key: 'locThan',  center: true },
    { label: t('result.col_ma',         'Mã'),      key: 'dichMa',   center: true },
    { label: t('result.col_dao',        'Đào'),     key: 'daoHoa',   center: true },
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', tableLayout: 'auto' }}>
      <thead>
        <tr style={{ borderBottom: '1.5px solid rgba(184,134,11,0.22)' }}>
          {headers.map((h, i) => (
            <Th key={i} center={h.center}>
              {h.key ? (
                <Tap k={h.key} onLearn={onLearn}>{h.label}</Tap>
              ) : (
                h.label
              )}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => {
          const isMoving = line.moving;
          const canTrans = line.can ? t(`stem.${line.can}`, line.can) : '';
          const chiTrans = line.chi ? t(`branch.${line.chi}`, line.chi) : '';
          const fullCanChi = canTrans && chiTrans ? `${canTrans} ${chiTrans}` : (line.displayLabel || '—');

          const qtText = line.isQuaiThan ? 'QT' : '-';
          const tsNgayText  = language === 'en' ? (line.tsNgayEn  || line.tsNgay  || '-') : (line.tsNgay  || '-');
          const tsThangText = language === 'en' ? (line.tsThangEn || line.tsThang || '-') : (line.tsThang || '-');
          const locText = line.isLoc ? 'L' : '-';
          const maText  = line.isMa  ? 'M' : '-';
          const daoText = line.isDaoHoa ? (language === 'en' ? 'P' : 'Đ') : '-';

          const rowColor = isMoving
            ? accentColor
            : isChangedSide
              ? 'var(--color-ink)'
              : 'var(--color-ink)';

          return (
            <tr
              key={line.index}
              style={{
                borderBottom: '1px solid rgba(184,134,11,0.08)',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(184,134,11,0.03)',
                color: rowColor,
              }}
            >
              <Td>
                <span style={{ fontWeight: isMoving ? 700 : 500, color: rowColor, whiteSpace: 'nowrap' }}>
                  {fullCanChi}
                </span>
              </Td>
              <Td center>
                {line.isQuaiThan ? (
                  <Tap k="quaiThan" onLearn={onLearn}>
                    <span style={{ fontWeight: 700, color: 'var(--color-vermillion)' }}>{qtText}</span>
                  </Tap>
                ) : (
                  <span style={{ color: 'var(--color-ink-muted)' }}>-</span>
                )}
              </Td>
              <Td>
                <Tap k="truongSinh" onLearn={onLearn}>
                  <span title={line.tsNgayFull || ''} style={{ fontWeight: isMoving ? 600 : 400 }}>
                    {tsNgayText}
                  </span>
                </Tap>
              </Td>
              <Td>
                <Tap k="truongSinh" onLearn={onLearn}>
                  <span title={line.tsThangFull || ''} style={{ fontWeight: isMoving ? 600 : 400 }}>
                    {tsThangText}
                  </span>
                </Tap>
              </Td>
              <Td center>
                {line.isLoc ? (
                  <Tap k="locThan" onLearn={onLearn}>
                    <span style={{ fontWeight: 700, color: 'var(--color-gold, #b8860b)' }}>{locText}</span>
                  </Tap>
                ) : (
                  <span style={{ color: 'var(--color-ink-muted)' }}>-</span>
                )}
              </Td>
              <Td center>
                {line.isMa ? (
                  <Tap k="dichMa" onLearn={onLearn}>
                    <span style={{ fontWeight: 700, color: 'var(--color-jade)' }}>{maText}</span>
                  </Tap>
                ) : (
                  <span style={{ color: 'var(--color-ink-muted)' }}>-</span>
                )}
              </Td>
              <Td center>
                {line.isDaoHoa ? (
                  <Tap k="daoHoa" onLearn={onLearn}>
                    <span style={{ fontWeight: 700, color: 'var(--color-vermillion)' }}>{daoText}</span>
                  </Tap>
                ) : (
                  <span style={{ color: 'var(--color-ink-muted)' }}>-</span>
                )}
              </Td>
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

  const qtChiTrans = result.quaiThanChi ? t(`branch.${result.quaiThanChi}`, result.quaiThanChi) : '';

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
      {qtChiTrans && (
        <InfoItem label={t('info.quai_than', 'Quái Thân')} value={qtChiTrans} />
      )}
      {result.khongVong?.length > 0 && (
        <InfoItem label={t('info.tuan_khong', 'Tuần Không')} value={khongVongTrans} color="var(--color-gold, #b8860b)" />
      )}
      {canNgayTrans && (
        <InfoItem label={t('info.can_ngay', 'Can Ngày')} value={canNgayTrans} />
      )}
    </div>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────

/** Bọc ô có thể chạm để học (chỉ bật khi có onLearn và có mục glossary) */
function Tap({ k, onLearn, children }) {
  if (!onLearn || !k || !GLOSSARY[k]) return children;
  return (
    <span
      role="button"
      tabIndex={0}
      title="Chạm để học"
      onClick={() => onLearn(k)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLearn(k); } }}
      style={{ cursor: 'help', borderBottom: '1px dotted rgba(184,134,11,0.6)' }}
    >
      {children}
    </span>
  );
}

function Th({ children, center }) {
  return (
    <th style={{
      padding: '6px 6px',
      textAlign: center ? 'center' : 'left',
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
  'Thanh Long': 'var(--color-lucthu-thanhlong, #1a6b4a)',
  'Chu Tước':   'var(--color-lucthu-chutuoc, #c0392b)',
  'Câu Trận':   'var(--color-lucthu-cautran, #8b6914)',
  'Đằng Xà':    'var(--color-lucthu-dangxa, #6a0dad)',
  'Bạch Hổ':    'var(--color-lucthu-bachho, #555555)',
  'Huyền Vũ':   'var(--color-lucthu-huyenvu, #1a4a6b)',
  
  'Azure Dragon': 'var(--color-lucthu-thanhlong, #1a6b4a)',
  'Vermilion Bird': 'var(--color-lucthu-chutuoc, #c0392b)',
  'Curving Snake': 'var(--color-lucthu-cautran, #8b6914)',
  'Soaring Serpent': 'var(--color-lucthu-dangxa, #6a0dad)',
  'White Tiger': 'var(--color-lucthu-bachho, #555555)',
  'Black Tortoise': 'var(--color-lucthu-huyenvu, #1a4a6b)',
};

function getLucThuColor(name) {
  return LUC_THU_COLORS[name] || 'var(--color-ink-muted)';
}

function findPalaceLabel(_changedLines, result) {
  return result.changedPalaceName || '';
}
