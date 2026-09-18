import React from 'react';

/**
 * SummaryPanel — displays a summary overview below the chart
 */
export default function SummaryPanel({ result, inputData }) {
  if (!result) return null;

  const {
    amDuongNamNu, canChiNam, banMenhNapAm, cucName, cucNumber,
    chuMenh, chuThan, menhCung, thanCung, tuanCung, trietCung, isThuan, palates
  } = result;

  // Find Mệnh palace stars
  const menhPalace = palates.find(p => p.isMenh);
  const thanPalace = palates.find(p => p.isThan);

  const menhStars = menhPalace?.chinhTinh?.join(', ') || 'Không có chính tinh';
  const thanStars = thanPalace?.chinhTinh?.join(', ') || 'Không có chính tinh';

  return (
    <div className="summary-panel">
      <h3 className="summary-title">
        📋 Tổng Quan Lá Số
      </h3>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-item-label">Họ Tên</div>
          <div className="summary-item-value gold">{inputData?.name || '—'}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Âm Dương / Giới Tính</div>
          <div className="summary-item-value">{amDuongNamNu} ({isThuan ? 'Thuận hành' : 'Nghịch hành'})</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Can Chi Năm</div>
          <div className="summary-item-value gold">{canChiNam}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Bản Mệnh Nạp Âm</div>
          <div className="summary-item-value">{banMenhNapAm}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Ngũ Hành Cục</div>
          <div className="summary-item-value gold">{cucName}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Cung Mệnh</div>
          <div className="summary-item-value">{menhCung}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Cung Thân</div>
          <div className="summary-item-value">{thanCung}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Chủ Mệnh</div>
          <div className="summary-item-value gold">{chuMenh}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Chủ Thân</div>
          <div className="summary-item-value">{chuThan}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Chính Tinh tại Mệnh</div>
          <div className="summary-item-value">{menhStars}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Chính Tinh tại Thân</div>
          <div className="summary-item-value">{thanStars}</div>
        </div>

        <div className="summary-item">
          <div className="summary-item-label">Tuần Không / Triệt Không</div>
          <div className="summary-item-value">
            <span style={{ color: '#64b5f6' }}>Tuần: {tuanCung.join(', ')}</span>
            {' · '}
            <span style={{ color: '#ef5350' }}>Triệt: {trietCung.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
