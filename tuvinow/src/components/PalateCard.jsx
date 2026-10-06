import { useTuViEvidence } from '../context/tuViEvidenceState';
import React from 'react';

/**
 * PalateCard — renders a single palace (cung) in the TuVi chart
 */

const PALACE_CLASSES = [
  'palace-ty', 'palace-suu', 'palace-dan', 'palace-mao',
  'palace-thin', 'palace-ti', 'palace-ngo', 'palace-mui',
  'palace-than', 'palace-dau', 'palace-tuat', 'palace-hoi'
];

function getStarStatusClass(starStr) {
  // Extract status code from "StarName (X)"
  const match = starStr.match(/\(([MVĐBH])\)$/);
  if (!match) return '';
  const code = match[1];
  const map = { 'M': 'star-mieu', 'V': 'star-vuong', 'Đ': 'star-dac', 'B': 'star-binh', 'H': 'star-ham' };
  return map[code] || '';
}

function getHoaClass(star) {
  if (star === 'Hóa Lộc') return 'hoa-loc';
  if (star === 'Hóa Quyền') return 'hoa-quyen';
  if (star === 'Hóa Khoa') return 'hoa-khoa';
  if (star === 'Hóa Kỵ') return 'hoa-ky';
  return '';
}

const HOA_SYMBOLS = {
  'Hóa Lộc': 'Lộc',
  'Hóa Quyền': 'Quyền',
  'Hóa Khoa': 'Khoa',
  'Hóa Kỵ': 'Kỵ',
};

export default function PalateCard({ palace, onSelectTerm }) {
  const evidence = useTuViEvidence();
  if (!palace) return null;

  const { chiIndex, chiName, canName, chucNang, daiHan, trangSinh, isTuan, isTriet, isMenh, isThan, chinhTinh, phuTinh } = palace;
  
  const cardClass = [
    'palace-card',
    PALACE_CLASSES[chiIndex],
    isMenh ? 'is-menh' : '',
    isThan ? 'is-than' : '',
  ].filter(Boolean).join(' ');

  // Separate Tứ Hóa from other phụ tinh
  const hoaStars = phuTinh.filter(s => s.startsWith('Hóa '));
  const annualStars = phuTinh.filter(s => s.startsWith('L.'));
  const otherPhuTinh = phuTinh.filter(s => !s.startsWith('Hóa ') && !s.startsWith('L.'));

  // Show Mệnh/Thân label
  const funcLabel = (chucNang || '').replace(' <THÂN>', '');
  const isMenhCung = funcLabel.includes('Mệnh') && !funcLabel.includes('Phụ Mẫu');

  const handleLearn = (e, term) => {
    if (onSelectTerm) {
      e.stopPropagation();
      onSelectTerm(term);
    }
  };

  return (
    <div className={cardClass} {...evidence?.targetProps(`palace.${chiIndex}`)}>
      {/* Header */}
      <div className="palace-header">
        <div>
          <div
            className={`palace-name ${isMenhCung ? 'menh-label' : ''}`}
            onClick={(e) => handleLearn(e, funcLabel)}
            title="Chạm để xem ý nghĩa cung này"
            style={{ cursor: onSelectTerm ? 'pointer' : 'default' }}
          >
            {funcLabel}
          </div>
          <div className="palace-canchi">{canName} {chiName}</div>
        </div>
        <div className="palace-daihan">{daiHan > 0 ? `${daiHan}–${daiHan + 9}` : ''}</div>
      </div>

      {/* Stars */}
      {(palace.isTieuHan || palace.luuNienChucNang) && <div className="palace-year-context">
        {palace.isTieuHan && <span className="palace-tieuhan">Tiểu hạn</span>}
        {palace.luuNienChucNang && <span title="Cung lưu niên đại hạn">{palace.luuNienChucNang}</span>}
      </div>}
      <div className="palace-stars">
        {chinhTinh.map((star, i) => {
          const statusClass = getStarStatusClass(star);
          return (
            <div
              key={i}
              className={`chinh-tinh ${statusClass}`}
              onClick={(e) => handleLearn(e, star)}
              title="Chạm để xem giải nghĩa sao"
              style={{ cursor: onSelectTerm ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
            >
              {star}
            </div>
          );
        })}

        {/* Tứ Hóa badges */}
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

        {/* Other Phụ Tinh - chia thành từng sao có thể click tra cứu */}
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
