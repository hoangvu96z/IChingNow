import { useTuViEvidence } from '../context/tuViEvidenceState';
import React from 'react';

/**
 * PalateCard — renders a single palace (cung) in the TuVi chart
 * Supports:
 * - Proper Vietnamese capitalization
 * - Interactive Tam Phương Tứ Chính highlighting
 * - Rotated Palace names (Đại Hạn, Lưu Niên, Lưu Nguyệt)
 * - Tự Hóa, Lai Nhân Cung, Vô Chính Diệu mượn sao
 * - School star brightness & Thập Nhị Thần
 */

const PALACE_CLASSES = [
  'palace-ty', 'palace-suu', 'palace-dan', 'palace-mao',
  'palace-thin', 'palace-ti', 'palace-ngo', 'palace-mui',
  'palace-than', 'palace-dau', 'palace-tuat', 'palace-hoi'
];

function getStarStatusClass(starStr) {
  const match = starStr.match(/\(([MVĐBH])\)$/);
  if (!match) return '';
  const code = match[1];
  const map = { M: 'star-mieu', V: 'star-vuong', Đ: 'star-dac', B: 'star-binh', H: 'star-ham' };
  return map[code] || '';
}

function getHoaClass(star) {
  if (star.includes('Lộc')) return 'hoa-loc';
  if (star.includes('Quyền')) return 'hoa-quyen';
  if (star.includes('Khoa')) return 'hoa-khoa';
  if (star.includes('Kỵ')) return 'hoa-ky';
  return '';
}

const HOA_SYMBOLS = {
  'Hóa Lộc': 'Lộc',
  'Hóa Quyền': 'Quyền',
  'Hóa Khoa': 'Khoa',
  'Hóa Kỵ': 'Kỵ',
};

const SAN_FANG_LABELS = {
  'ban-cung': 'Bản Cung',
  'xung-chieu': 'Xung Chiếu',
  'tam-hop': 'Tam Hợp',
  'giap-cung': 'Giáp Cung',
};

export default function PalateCard({
  palace,
  onSelectTerm,
  onSelectPalace,
  sanFangRole,
  isLaiNhan = false,
  tuHoaList = [],
  _isVoChinhDieu = false,
  borrowedInfo = null,
  schoolBrightnessMap = null,
  rotatedPalaceName = null,
  activeYunxianSihua = [],
  boshiStar = null,
  jiangQianStar = null,
}) {
  const evidence = useTuViEvidence();
  if (!palace) return null;

  const {
    chiIndex,
    chiName,
    canName,
    chucNang,
    daiHan,
    trangSinh,
    isTuan,
    isTriet,
    isMenh,
    isThan,
    chinhTinh = [],
    phuTinh = [],
  } = palace;

  const sanFangClass = sanFangRole ? `is-${sanFangRole}` : '';

  const cardClass = [
    'palace-card',
    PALACE_CLASSES[chiIndex],
    isMenh ? 'is-menh' : '',
    isThan ? 'is-than' : '',
    sanFangClass,
  ].filter(Boolean).join(' ');

  // Separate Tứ Hóa from other phụ tinh
  const hoaStars = phuTinh.filter((s) => s.startsWith('Hóa '));
  const annualStars = phuTinh.filter((s) => s.startsWith('L.'));
  const otherPhuTinh = phuTinh.filter((s) => !s.startsWith('Hóa ') && !s.startsWith('L.'));

  // Natal palace label
  const funcLabel = (chucNang || '').replace(' <THÂN>', '');
  const isMenhCung = funcLabel.includes('Mệnh') && !funcLabel.includes('Phụ Mẫu');

  const handleLearn = (e, term) => {
    if (onSelectTerm) {
      e.stopPropagation();
      onSelectTerm(term);
    }
  };

  const handleCardClick = () => {
    if (onSelectPalace) {
      onSelectPalace(chiIndex);
    }
  };

  return (
    <div
      className={cardClass}
      onClick={handleCardClick}
      {...evidence?.targetProps(`palace.${chiIndex}`)}
    >
      {/* Header */}
      <div className="palace-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              className={`palace-name ${isMenhCung ? 'menh-label' : ''}`}
              onClick={(e) => handleLearn(e, funcLabel)}
              title="Chạm để xem ý nghĩa cung này"
              style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            >
              {funcLabel}
            </span>
            {rotatedPalaceName && (
              <span className="rotated-palace-badge" title="Chức năng cung theo vận hạn">
                {rotatedPalaceName}
              </span>
            )}
          </div>
          <div className="palace-canchi">
            {canName} {chiName}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div className="palace-daihan">
            {daiHan > 0 ? `${daiHan}–${daiHan + 9}` : ''}
          </div>
          {sanFangRole && (
            <span className={`san-fang-tag tag-${sanFangRole}`}>
              {SAN_FANG_LABELS[sanFangRole] || sanFangRole}
            </span>
          )}
        </div>
      </div>

      {/* Year Context */}
      {(palace.isTieuHan || palace.luuNienChucNang) && (
        <div className="palace-year-context">
          {palace.isTieuHan && <span className="palace-tieuhan">Tiểu hạn</span>}
          {palace.luuNienChucNang && (
            <span title="Cung lưu niên đại hạn">{palace.luuNienChucNang}</span>
          )}
        </div>
      )}

      {/* Stars Section */}
      <div className="palace-stars">
        {chinhTinh.map((star, i) => {
          const statusClass = getStarStatusClass(star);
          const cleanName = star.split('(')[0].trim();
          const schoolBright = schoolBrightnessMap?.[cleanName];

          return (
            <div
              key={i}
              className={`chinh-tinh ${statusClass}`}
              onClick={(e) => handleLearn(e, star)}
              title="Chạm để xem giải nghĩa sao"
              style={{
                cursor: onSelectTerm ? 'pointer' : 'default',
                transition: 'transform 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{star}</span>
              {schoolBright && (
                <span className={`school-brightness-tag ${schoolBright.code === 'H' ? 'is-ham' : 'is-cat'}`}>
                  {schoolBright.label}
                </span>
              )}
            </div>
          );
        })}

        {/* Vô Chính Diệu Notice */}
        {chinhTinh.length === 0 && (
          <div
            className="palace-vcd-note"
            onClick={(e) => handleLearn(e, 'Vô Chính Diệu')}
            style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            title={borrowedInfo?.tuanTrietNote || 'Vô Chính Diệu mượn chính tinh cung xung chiếu'}
          >
            ✧ Vô Chính Diệu
            {borrowedInfo?.borrowedChinhTinh?.length > 0 && (
              <span className="vcd-borrowed-text">
                {' '}(Mượn {borrowedInfo.borrowedChinhTinh.map((s) => s.split('(')[0].trim()).join(', ')})
              </span>
            )}
          </div>
        )}

        {/* Tứ Hóa Gốc Badges */}
        {hoaStars.length > 0 && (
          <div className="hoa-badge-container">
            {hoaStars.map((h, i) => (
              <span
                key={i}
                className={`hoa-pill ${getHoaClass(h)}`}
                onClick={(e) => handleLearn(e, h)}
                title={`Chạm để xem giải nghĩa ${h}`}
                style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
              >
                {HOA_SYMBOLS[h] || h}
              </span>
            ))}
          </div>
        )}

        {/* Active Yunxian Tứ Hóa Badges (Đại Hạn / Lưu Niên / Lưu Nguyệt) */}
        {activeYunxianSihua.length > 0 && (
          <div className="hoa-badge-container yunxian-hoa-container">
            {activeYunxianSihua.map((yh, i) => (
              <span
                key={i}
                className={`hoa-pill ${getHoaClass(yh.type)} yunxian-hoa-pill`}
                title={`${yh.label}: ${yh.starName}`}
              >
                {yh.label}
              </span>
            ))}
          </div>
        )}

        {/* Phụ Tinh */}
        {otherPhuTinh.length > 0 && (
          <div className="phu-tinh">
            {otherPhuTinh.map((starName, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && ' · '}
                <span
                  onClick={(e) => handleLearn(e, starName)}
                  title={`Tra cứu sao ${starName}`}
                  style={{
                    cursor: onSelectTerm ? 'pointer' : 'default',
                    display: 'inline-block',
                    borderRadius: 3,
                  }}
                  className="interactive-star"
                >
                  {starName}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Thập Nhị Thần Badges (Bác Sỹ, Tướng Tiền) */}
      {(boshiStar || jiangQianStar) && (
        <div className="palace-shiershen-strip">
          {boshiStar && (
            <span className="shiershen-tag boshi" title="Vòng Bác Sỹ">
              BS.{boshiStar}
            </span>
          )}
          {jiangQianStar && (
            <span className="shiershen-tag jiangqian" title="Vòng Tướng Tiền">
              TT.{jiangQianStar}
            </span>
          )}
        </div>
      )}

      {/* Sao Lưu Niên */}
      {annualStars.length > 0 && (
        <div className="palace-annual-stars" aria-label="Sao lưu niên">
          {annualStars.map((starName, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && ' · '}
              <span
                onClick={(e) => handleLearn(e, starName)}
                title={`Tra cứu ${starName}`}
                style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
              >
                {starName}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="palace-footer">
        <div
          className="palace-trangsinh"
          onClick={(e) => handleLearn(e, trangSinh)}
          title={`Tra cứu trạng thái ${trangSinh}`}
          style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
        >
          {trangSinh}
        </div>

        <div className="palace-badges">
          {isLaiNhan && (
            <span
              className="mini-badge lai-nhan"
              onClick={(e) => handleLearn(e, 'Lai Nhân Cung')}
              title="Lai Nhân Cung — Nơi khởi phát nhân quả tiền kiếp"
              style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            >
              Lai Nhân
            </span>
          )}

          {tuHoaList.map((th, idx) => (
            <span
              key={idx}
              className={`mini-badge tu-hoa ${getHoaClass(th)}`}
              onClick={(e) => handleLearn(e, th)}
              title={`Cung này có ${th}`}
              style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            >
              {th}
            </span>
          ))}

          {isTuan && (
            <span
              className="mini-badge tuan"
              onClick={(e) => handleLearn(e, 'Tuần')}
              title="Tra cứu Tuần Không"
              style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            >
              Tuần
            </span>
          )}
          {isTriet && (
            <span
              className="mini-badge triet"
              onClick={(e) => handleLearn(e, 'Triệt')}
              title="Tra cứu Triệt Lộ"
              style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            >
              Triệt
            </span>
          )}
          {isThan && (
            <span
              className="mini-badge than"
              onClick={(e) => handleLearn(e, 'Thân')}
              title="Tra cứu Cung Thân"
              style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
            >
              Thân
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
