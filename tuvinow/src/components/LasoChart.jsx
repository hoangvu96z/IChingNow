import React from 'react';
import PalateCard from './PalateCard';
import { THIEN_CAN, DIA_CHI } from '../utils/tuViEngine';
import { GIO_SINH_OPTIONS } from '../utils/lunarConverter';

/**
 * LasoChart — renders the full 4×4 TuVi chart grid with center info panel
 */
export default function LasoChart({ result, inputData }) {
  if (!result || !result.palates) return null;

  const { palates, amDuongNamNu, canChiNam, banMenhNapAm, cucName, chuMenh, chuThan,
          menhCung, thanCung, tuanCung, trietCung, isThuan } = result;
  
  const hourLabel = GIO_SINH_OPTIONS[inputData?.lunarHourIndex]?.label || '';

  return (
    <div className="chart-container fade-in">
      <div className="chart-grid">
        {/* Render 12 palace cards */}
        {palates.map((palace, i) => (
          <PalateCard key={i} palace={palace} />
        ))}

        {/* Center Info Panel */}
        <div className="chart-center">
          <div className="center-name">
            {inputData?.name || 'Lá Số Tử Vi'}
          </div>
          
          <div className="center-info-row">
            <span className="label">Sinh:</span>
            <span className="value">{inputData?.solarInput ? `${inputData.solarInput.day}/${inputData.solarInput.month}/${inputData.solarInput.year}` : ''}</span>
            <span className="label">|</span>
            <span className="value">{hourLabel}</span>
          </div>

          <div className="center-info-row">
            <span className="label">Âm lịch:</span>
            <span className="value">{inputData?.lunarDay}/{inputData?.lunarMonth}/{inputData?.lunarYear}</span>
          </div>

          <div className="center-divider" />

          <div className="center-info-row">
            <span className="value">{amDuongNamNu}</span>
            <span className="label">|</span>
            <span className="value">{isThuan ? 'Thuận' : 'Nghịch'}</span>
          </div>

          <div className="center-info-row">
            <span className="label">Năm:</span>
            <span className="value">{canChiNam}</span>
          </div>

          <div className="center-info-row">
            <span className="label">Nạp Âm:</span>
            <span className="value">{banMenhNapAm}</span>
          </div>

          <div className="center-info-row">
            <span className="label">Cục:</span>
            <span className="value" style={{ color: 'var(--accent-gold-bright)' }}>{cucName}</span>
          </div>

          <div className="center-divider" />

          <div className="center-info-row">
            <span className="label">Mệnh:</span>
            <span className="value">{menhCung}</span>
            <span className="label">Thân:</span>
            <span className="value" style={{ color: 'var(--accent-cyan)' }}>{thanCung}</span>
          </div>

          <div className="center-info-row">
            <span className="label">Chủ Mệnh:</span>
            <span className="value">{chuMenh}</span>
          </div>
          <div className="center-info-row">
            <span className="label">Chủ Thân:</span>
            <span className="value">{chuThan}</span>
          </div>

          <div className="center-divider" />

          <div className="center-info-row">
            <span className="center-badge badge-tuan">Tuần: {tuanCung.join(', ')}</span>
            <span className="center-badge badge-triet">Triệt: {trietCung.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
