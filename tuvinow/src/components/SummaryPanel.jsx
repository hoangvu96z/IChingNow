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
        {result.canLuongStr && <div className="summary-item">
          <div className="summary-item-label">Cân lượng</div>
          <div className="summary-item-value gold">{result.canLuongStr}</div>
        </div>}
        {result.tuoiAm != null && <div className="summary-item">
          <div className="summary-item-label">Tuổi âm · năm {result.viewYear}</div>
          <div className="summary-item-value">{result.tuoiAm} tuổi</div>
        </div>}
        {result.tieuHanCung && <div className="summary-item">
          <div className="summary-item-label">Tiểu hạn</div>
          <div className="summary-item-value gold">{result.tieuHanCung}</div>
        </div>}
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
            <span className="summary-badge-tuan">Tuần: {tuanCung.join(', ')}</span>
            {' · '}
            <span className="summary-badge-triet">Triệt: {trietCung.join(', ')}</span>
          </div>
        </div>
      </div>
      {result.canLuongStr && <p className="annual-chart-note">LN. là cung lưu niên đại hạn; L. là sao lưu niên.
        {result.tuoiAm == null ? ' Chọn năm xem khi lập lá số để hiển thị tuổi âm và Tiểu hạn.' :
          !palates.some(p => p.luuNienChucNang) ? ' Tuổi đang xem chưa nằm trong các đại hạn của lá số nên chưa có cung LN.' : ''}
      </p>}
    </div>
  );
}
