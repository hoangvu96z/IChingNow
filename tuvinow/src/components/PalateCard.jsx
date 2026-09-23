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

export default function PalateCard({ palace }) {
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
  const otherPhuTinh = phuTinh.filter(s => !s.startsWith('Hóa '));

  // Show Mệnh/Thân label
  const funcLabel = chucNang || '';
  const isMenhCung = funcLabel.includes('Mệnh') && !funcLabel.includes('Phụ Mẫu');

  return (
    <div className={cardClass} {...evidence?.targetProps(`palace.${chiIndex}`)}>
      {/* Header */}
      <div className="palace-header">
        <div>
          <div className={`palace-name ${isMenhCung ? 'menh-label' : ''}`}>
            {funcLabel}
          </div>
          <div className="palace-canchi">{canName} {chiName}</div>
        </div>
        <div className="palace-daihan">{daiHan > 0 ? `${daiHan}–${daiHan + 9}` : ''}</div>
      </div>

      {/* Stars */}
      <div className="palace-stars">
        {chinhTinh.map((star, i) => {
          const statusClass = getStarStatusClass(star);
          // Also check if this star has Tứ Hóa
          const starName = star.split(' ')[0];
          const relatedHoa = hoaStars.filter(h => {
            // Simple: just show Hóa at the palace level
            return false; // Handled below
          });
          return (
            <div key={i} className={`chinh-tinh ${statusClass}`}>
              {star}
            </div>
          );
        })}

        {/* Tứ Hóa badges */}
        {hoaStars.length > 0 && (
          <div className="hoa-badge-container">
            {hoaStars.map((h, i) => (
              <span key={i} className={`hoa-pill ${getHoaClass(h)}`}>
                {HOA_SYMBOLS[h] || h}
              </span>
            ))}
          </div>
        )}

        {/* Other Phụ Tinh */}
        {otherPhuTinh.length > 0 && (
          <div className="phu-tinh">
            {otherPhuTinh.join(' · ')}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="palace-footer">
        <div className="palace-trangsinh">{trangSinh}</div>
        <div className="palace-badges">
          {isTuan && <span className="mini-badge tuan">Tuần</span>}
          {isTriet && <span className="mini-badge triet">Triệt</span>}
          {isThan && <span className="mini-badge than">Thân</span>}
        </div>
      </div>
    </div>
  );
}
