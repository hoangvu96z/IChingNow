import React, { useState, useMemo } from 'react';
import {
  computeZiweiMeta,
  getTamPhuongTuChinh,
} from '../utils/tuViZiweiModule.js';

// Elemental mappings for Nạp Âm & Cục
function getElementFromNapAm(napAm = '') {
  if (napAm.includes('Kim')) return 'Kim';
  if (napAm.includes('Mộc')) return 'Mộc';
  if (napAm.includes('Thủy')) return 'Thủy';
  if (napAm.includes('Hỏa')) return 'Hỏa';
  if (napAm.includes('Thổ')) return 'Thổ';
  return 'Thổ';
}

function getElementFromCuc(cucName = '') {
  if (cucName.includes('Thủy')) return 'Thủy';
  if (cucName.includes('Mộc')) return 'Mộc';
  if (cucName.includes('Kim')) return 'Kim';
  if (cucName.includes('Thổ')) return 'Thổ';
  if (cucName.includes('Hỏa')) return 'Hỏa';
  return 'Thủy';
}

const SINH_CYCLE = {
  Kim: 'Thủy',
  Thủy: 'Mộc',
  Mộc: 'Hỏa',
  Hỏa: 'Thổ',
  Thổ: 'Kim',
};

const KHAC_CYCLE = {
  Kim: 'Mộc',
  Mộc: 'Thổ',
  Thổ: 'Thủy',
  Thủy: 'Hỏa',
  Hỏa: 'Kim',
};

function getMenhCucRelation(menhElement, cucElement) {
  if (menhElement === cucElement) {
    return {
      type: 'binh-hoa',
      title: 'Mệnh Cục Bình Hòa (Đồng Hành)',
      badgeClass: 'guide-badge-neutral',
      desc: 'Bản mệnh và hoàn cảnh tương hòa, tương đắc. Bạn dễ dàng hòa nhập với môi trường sống, cuộc đời phát triển thuận tự nhiên, ít gặp biến động quá lớn.',
    };
  }
  if (SINH_CYCLE[cucElement] === menhElement) {
    return {
      type: 'cuc-sinh-menh',
      title: 'Cục Sinh Mệnh (Đại Cát)',
      badgeClass: 'guide-badge-good',
      desc: 'Thời thế và môi trường xung quanh luôn nâng đỡ bạn. Đương số dễ gặp may mắn, quý nhân tương trợ, thuận buồm xuôi gió khi bước ra đời.',
    };
  }
  if (SINH_CYCLE[menhElement] === cucElement) {
    return {
      type: 'menh-sinh-cuc',
      title: 'Mệnh Sinh Cục (Tận Tụy Cống Hiến)',
      badgeClass: 'guide-badge-warning',
      desc: 'Bản thân phải hao tâm tổn sức, đóng góp nhiều cho công việc và cộng đồng trước khi gặt hái thành quả. Càng về hậu vận, thành tựu càng rạng rỡ.',
    };
  }
  if (KHAC_CYCLE[menhElement] === cucElement) {
    return {
      type: 'menh-khac-cuc',
      title: 'Mệnh Khắc Cục (Tự Lực Cánh Sinh)',
      badgeClass: 'guide-badge-accent',
      desc: 'Bản lĩnh mạnh mẽ, kiên cường. Bạn dám đối đầu và vượt lên hoàn cảnh khó khăn, kiểm soát số phận và tạo dựng cơ đồ bằng chính đôi tay mình.',
    };
  }
  if (KHAC_CYCLE[cucElement] === menhElement) {
    return {
      type: 'cuc-khac-menh',
      title: 'Cục Khắc Mệnh (Nghịch Cảnh Tôi Luyện)',
      badgeClass: 'guide-badge-danger',
      desc: 'Hoàn cảnh hay đặt ra thử thách, trở ngại. Nghịch cảnh chính là thao trường tôi luyện ý chí kiên định; bền chí ắt làm nên việc lớn.',
    };
  }
  return {
    type: 'binh-hoa',
    title: 'Mệnh Cục Bình Hòa',
    badgeClass: 'guide-badge-neutral',
    desc: 'Bản mệnh và Cục thế hòa hợp, tạo nền móng vững chắc cho cuộc sống.',
  };
}

function getThanCungInterpretation(thanCung = '') {
  if (thanCung.includes('Mệnh')) {
    return {
      title: 'Thân Cư Mệnh (Tự Lập Tự Quyết)',
      desc: 'Sau tuổi 30, tính cách trước sau như một, kiên định với lập trường bản thân. Cuộc đời do chính bạn tự định đoạt, ít bị hoàn cảnh bên ngoài chi phối.',
    };
  }
  if (thanCung.includes('Tài')) {
    return {
      title: 'Thân Cư Tài Bạch (Kinh Tế Làm Trọng)',
      desc: 'Sau tuổi 30, vấn đề tài chính, đầu tư và độc lập kinh tế trở thành động lực lớn nhất. Bạn nhạy bén với cơ hội kiếm tiền và quản lý tài sản.',
    };
  }
  if (thanCung.includes('Quan')) {
    return {
      title: 'Thân Cư Quan Lộc (Sự Nghiệp Lý Tưởng)',
      desc: 'Sau tuổi 30, sự nghiệp, chức vị và danh tiếng là trọng tâm đời người. Bạn đam mê cống hiến, có tinh thần trách nhiệm cao với công việc.',
    };
  }
  if (thanCung.includes('Thiên Di')) {
    return {
      title: 'Thân Cư Thiên Di (Hướng Ngoại Năng Động)',
      desc: 'Sau tuổi 30, bạn thường xuyên đi lại, ngoại giao hoặc phát triển xa quê hương. Môi trường bên ngoài mang lại nhiều cơ hội thành công hơn nơi chôn rau cắt rốn.',
    };
  }
  if (thanCung.includes('Phu') || thanCung.includes('Thê')) {
    return {
      title: 'Thân Cư Phu Thê (Gia Đình Là Điểm Tựa)',
      desc: 'Sau tuổi 30, người bạn đời và hạnh phúc hôn nhân đóng vai trò then chốt, tác động sâu sắc đến sự nghiệp, tài lộc và tâm lý của bạn.',
    };
  }
  if (thanCung.includes('Phúc')) {
    return {
      title: 'Thân Cư Phúc Đức (Tâm Linh & Phúc Báo)',
      desc: 'Sau tuổi 30, bạn hướng về chiều sâu tinh thần, phúc ấm dòng họ tổ tiên và hoạt động thiện nguyện. Hưởng thụ an lạc nội tâm nhiều hơn danh lợi bề ngoài.',
    };
  }
  return {
    title: `Thân Cư ${thanCung}`,
    desc: `Sau tuổi 30, cung ${thanCung} trở thành bến đỗ và lĩnh vực bạn dành nhiều thời gian, năng lượng và tâm huyết nhất.`,
  };
}

export default function TuViSelfGuidePanel({ result, inputData, yunxianState }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  if (!result || !result.palates || result.palates.length !== 12) return null;

  const {
    palates,
    amDuongNamNu,
    canChiNam,
    banMenhNapAm,
    cucName,
    menhCung,
    thanCung,
    tuanCung = [],
    trietCung = [],
    isThuan,
  } = result;

  // Ziwei metadata
  const ziweiMeta = useMemo(() => {
    return computeZiweiMeta(result, inputData, inputData?.schoolConfig);
  }, [result, inputData]);

  // Bước 1: Mệnh Cục
  const menhElement = getElementFromNapAm(banMenhNapAm);
  const cucElement = getElementFromCuc(cucName);
  const menhCucRel = getMenhCucRelation(menhElement, cucElement);

  // Bước 2: Mệnh & Thân
  const menhPalace = palates.find((p) => p.isMenh || p.chiName === menhCung) || palates[0];
  const menhStars = menhPalace?.chinhTinh || [];
  const isVoChinhDieu = menhStars.length === 0;
  const menhOppositeChi = (menhPalace.chiIndex + 6) % 12;
  const menhOppositePalace = palates.find((p) => p.chiIndex === menhOppositeChi);
  const thanInfo = getThanCungInterpretation(thanCung);

  // Bước 3: Tam phương tứ chính & Lai Nhân
  const sanFangMenh = getTamPhuongTuChinh(menhPalace.chiIndex);
  const laiNhan = ziweiMeta?.laiNhanCung || null;

  // Bước 4: Tứ Hóa năm sinh
  const natalSihuaList = useMemo(() => {
    const list = [];
    for (const p of palates) {
      for (const s of p.phuTinh || []) {
        if (s.startsWith('Hóa ')) {
          list.push({
            star: s,
            palaceName: (p.chucNang || '').replace(/\s*<THÂN>/g, '').trim(),
            canChi: `${p.canName} ${p.chiName}`,
          });
        }
      }
    }
    return list;
  }, [palates]);

  const stepsList = [
    { num: 1, label: 'Nền Tảng Bản Mệnh & Cục', icon: '🌿' },
    { num: 2, label: 'Cung Mệnh & Cung Thân', icon: '👤' },
    { num: 3, label: 'Tam Phương Tứ Chính', icon: '📐' },
    { num: 4, label: 'Tứ Hóa & Phi Tinh', icon: '⚡' },
    { num: 5, label: 'Cách Xem Vận Hạn', icon: '🪐' },
    { num: 6, label: 'Cách Cục, Cổ Thư & AI', icon: '📚' },
  ];

  return (
    <section
      className="tuvi-self-guide-panel"
      aria-labelledby="tuvi-self-guide-title"
    >
      {/* Panel Header */}
      <div className="guide-header">
        <div className="guide-title-group" onClick={() => setIsOpen((v) => !v)}>
          <span className="guide-header-icon" aria-hidden="true">📖</span>
          <div>
            <h3 id="tuvi-self-guide-title" className="guide-title">
              Hướng Dẫn Tự Đọc Lá Số Của Bạn (6 Bước Dễ Hiểu)
            </h3>
            <p className="guide-subtitle">
              Cẩm nang cá nhân hóa cho lá số {inputData?.name ? `của ${inputData.name}` : 'của bạn'} · Tự luận từng bước, không lo quá tải
            </p>
          </div>
        </div>
        <div className="guide-header-actions">
          <span className="guide-chip-badge">Dành cho người mới</span>
          <button
            type="button"
            className="guide-toggle-btn"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Thu gọn hướng dẫn' : 'Mở rộng hướng dẫn'}
          >
            {isOpen ? 'Thu gọn ▲' : 'Mở cẩm nang ▼'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="guide-body">
          {/* Step Navigation Tabs */}
          <div className="guide-step-tabs" role="tablist" aria-label="Các bước đọc lá số">
            {stepsList.map((st) => (
              <button
                key={st.num}
                type="button"
                role="tab"
                aria-selected={activeStep === st.num}
                className={`guide-step-tab ${activeStep === st.num ? 'is-active' : ''}`}
                onClick={() => setActiveStep(st.num)}
              >
                <span className="step-tab-num">Bước {st.num}</span>
                <span className="step-tab-label">{st.icon} {st.label}</span>
              </button>
            ))}
          </div>

          {/* Active Step Content */}
          <div className="guide-step-content">
            {/* ================= BƯỚC 1 ================= */}
            {activeStep === 1 && (
              <div className="guide-step-card fade-in">
                <div className="step-card-header">
                  <div className="step-badge">Bước 1 trên 6</div>
                  <h4>🌿 Nền Tảng Bản Mệnh & Cục — Gốc Rễ Cuộc Đời</h4>
                </div>
                <p className="step-intro-text">
                  Trước khi nhìn vào các cung hay các sao nhỏ, người xưa luôn xét <strong>Âm Dương</strong>, <strong>Bản Mệnh</strong> và <strong>Cục Thế</strong>. Đây là "mảnh đất" và "khí hậu" mà hạt giống cuộc đời bạn được gieo trồng:
                </p>

                <div className="guide-facts-grid">
                  <div className="guide-fact-item">
                    <span className="fact-label">Âm Dương & Giới Tính</span>
                    <span className="fact-value highlight">{amDuongNamNu}</span>
                    <span className="fact-sub">
                      {isThuan
                        ? '✦ Thuận Lý: Vận trình thuận chiều tự nhiên, cuộc đời dễ phát triển theo kỳ vọng.'
                        : '✦ Nghịch Lý: Đương số cần nhiều nỗ lực vươn lên, tôi luyện qua nghịch cảnh để tạo dựng thành tựu.'}
                    </span>
                  </div>

                  <div className="guide-fact-item">
                    <span className="fact-label">Năm Sinh & Bản Mệnh</span>
                    <span className="fact-value highlight">{canChiNam} · {banMenhNapAm}</span>
                    <span className="fact-sub">Hành {menhElement}: Đại diện cho bản thể, nội lực, tính cách gốc và sức khỏe cốt lõi.</span>
                  </div>

                  <div className="guide-fact-item">
                    <span className="fact-label">Cục Thế (Môi Trường)</span>
                    <span className="fact-value highlight">{cucName}</span>
                    <span className="fact-sub">Hành {cucElement}: Đại diện cho thời thế, xã hội, hoàn cảnh bên ngoài bao bọc cuộc đời bạn.</span>
                  </div>
                </div>

                <div className="guide-callout-box">
                  <div className="callout-header">
                    <span className="callout-tag">Tương Tác Mệnh & Cục:</span>
                    <strong className={menhCucRel.badgeClass}>{menhCucRel.title}</strong>
                  </div>
                  <p className="callout-body">{menhCucRel.desc}</p>
                </div>

                <div className="step-tip-box">
                  <span className="tip-icon">💡</span>
                  <span>
                    <strong>Mẹo nhớ:</strong> Mệnh là cái "Tôi", Cục là "Hoàn Cảnh". Cục sinh Mệnh là may mắn lớn nhất; Mệnh khắc Cục là người tự lập quật cường; Cục khắc Mệnh đòi hỏi sự kiên nhẫn qua gian khó.
                  </span>
                </div>
              </div>
            )}

            {/* ================= BƯỚC 2 ================= */}
            {activeStep === 2 && (
              <div className="guide-step-card fade-in">
                <div className="step-card-header">
                  <div className="step-badge">Bước 2 trên 6</div>
                  <h4>👤 Đọc Cung Mệnh & Cung Thân — Tính Cách & Hậu Vận</h4>
                </div>
                <p className="step-intro-text">
                  Trong Tử Vi, <strong>Cung Mệnh</strong> chi phối tiền vận (từ nhỏ đến 30 tuổi) và cốt cách bẩm sinh; <strong>Cung Thân</strong> tiếp quản hậu vận (sau 30 tuổi), cho biết bến đỗ cuộc đời và nơi bạn gửi gắm nhiều tâm sức nhất:
                </p>

                <div className="guide-two-columns">
                  {/* Cung Mệnh */}
                  <div className="guide-subcard">
                    <div className="subcard-title">
                      <span>🏛️ Cung Mệnh: Cung {menhCung}</span>
                    </div>
                    {isVoChinhDieu ? (
                      <div className="subcard-content">
                        <div className="vcd-pill">✧ Vô Chính Diệu (Không có chính tinh)</div>
                        <p>
                          Cung Mệnh của bạn không có 1 trong 14 chính tinh tọa thủ. Bạn là người có tư duy linh hoạt, khả năng ứng biến nhạy bén và không thích bị bó hẹp trong khuôn mẫu cứng nhắc.
                        </p>
                        <p className="vcd-note">
                          ✦ <strong>Quy tắc mượn sao:</strong> Khi luận đoán cốt cách, bạn cần mượn các chính tinh ở{' '}
                          <strong>Cung {menhOppositePalace?.chucNang || 'Thiên Di'}</strong> ({menhOppositePalace?.chinhTinh?.join(', ') || 'Không có'}) xung chiếu đối diện (hưởng khoảng 70% uy lực chiếu).
                        </p>
                      </div>
                    ) : (
                      <div className="subcard-content">
                        <div className="stars-pill">
                          Chính tinh: <strong>{menhStars.join(', ')}</strong>
                        </div>
                        <p>
                          Các chính tinh này quyết định phong thái, tài năng chủ đạo và khí chất của bạn. Hãy nhìn vào ký hiệu độ sáng (M, V, Đ, B, H) của từng sao để biết điểm mạnh tự nhiên.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cung Thân */}
                  <div className="guide-subcard">
                    <div className="subcard-title">
                      <span>🕊️ Cung Thân: {thanCung}</span>
                    </div>
                    <div className="subcard-content">
                      <div className="than-pill">{thanInfo.title}</div>
                      <p>{thanInfo.desc}</p>
                      <p className="than-note">
                        ✦ <strong>Cột mốc 30 tuổi:</strong> Sau tuổi 30, những biến cố, suy nghĩ và sự nghiệp của bạn sẽ chuyển hướng rõ rệt về cung ngự của Thân.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="step-tip-box">
                  <span className="tip-icon">💡</span>
                  <span>
                    <strong>Cách tự đọc:</strong> Hãy kết hợp chính tinh tại Mệnh với cung ngự của Thân để hiểu được chặng đường phát triển từ tuổi trẻ tới lúc trưởng thành.
                  </span>
                </div>
              </div>
            )}

            {/* ================= BƯỚC 3 ================= */}
            {activeStep === 3 && (
              <div className="guide-step-card fade-in">
                <div className="step-card-header">
                  <div className="step-badge">Bước 3 trên 6</div>
                  <h4>📐 Tam Phương Tứ Chính & Giải Mã Ký Hiệu Trên Cung</h4>
                </div>
                <p className="step-intro-text">
                  Không bao giờ được xem một cung đơn độc! Mỗi cung trên lá số chịu ảnh hưởng mật thiết từ <strong>Tam Phương Tứ Chính</strong> (Tam hợp, Xung chiếu, Giáp cung) và các ký hiệu năng lượng đặc biệt:
                </p>

                <div className="guide-interactive-hint">
                  <span className="hint-radar">🎯</span>
                  <div>
                    <strong>Thao tác trực quan trên bàn lá số:</strong> Chạm/nhấp vào bất kỳ cung nào trên bảng lá số, hệ thống sẽ tự động chiếu sáng:
                    <ul className="sanfang-guide-list">
                      <li><strong>Bản Cung (Khung vàng):</strong> Cung bạn đang bấm chọn (VD: Mệnh tại {menhCung}).</li>
                      <li><strong>Xung Chiếu (Cung đối diện):</strong> Cung {sanFangMenh?.xungChieuName || 'đối diện'} tác động trực diện mạnh nhất (~70% lực).</li>
                      <li><strong>2 Cung Tam Hợp (Khung xanh):</strong> Cung {sanFangMenh?.tamHopNames?.join(', ') || 'Tam hợp'} tạo thế kiềng ba chân vững chắc (Mệnh – Tài – Quan).</li>
                      <li><strong>2 Cung Giáp (Kẹp 2 bên):</strong> Cung {sanFangMenh?.giapCungNames?.join(', ') || 'kề bên'} là môi trường sát sườn kề cận.</li>
                    </ul>
                  </div>
                </div>

                <div className="guide-legend-grid">
                  <div className="legend-item">
                    <span className="legend-tag tag-m">Miếu (M)</span>
                    <span>Tốt nhất, ngọc sáng lung linh, tài năng phát huy đỉnh cao.</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-tag tag-v">Vượng (V)</span>
                    <span>Rất mạnh mẽ, thời vận hanh thông, công danh thuận lợi.</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-tag tag-d">Đắc (Đ)</span>
                    <span>Vừa tầm, gặp đúng thời cơ sẽ bộc phát sức mạnh lớn.</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-tag tag-b">Bình (B)</span>
                    <span>Trung bình, bình ổn, ít sóng gió nhưng cũng ít đột phá.</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-tag tag-h">Hãm (H)</span>
                    <span>Tối mờ, trắc trở, cần phụ tinh cát hóa hoặc qua rèn luyện mới tỏa sáng.</span>
                  </div>
                </div>

                <div className="guide-special-tags">
                  <div className="special-tag-box">
                    <strong>Tuần Không ({tuanCung.join(', ') || 'Không'}) & Triệt Lộ ({trietCung.join(', ') || 'Không'}):</strong>
                    <p>
                      Tuần ảnh hưởng âm ỉ, bao trùm tiền vận (đến 30–35 tuổi) làm dịu bớt hung cát; Triệt tác động mạnh mẽ thời niên thiếu (trước 30 tuổi), ngăn chặn cả sao tốt lẫn sao xấu nhưng mở ra sự bứt phá sau 30 tuổi.
                    </p>
                  </div>

                  {laiNhan && (
                    <div className="special-tag-box lai-nhan">
                      <strong>Lai Nhân Cung: Cung {laiNhan.chucNang} ({laiNhan.canName} {laiNhan.chiName})</strong>
                      <p>
                        Trong Đẩu Số Khâm Thiên, Lai Nhân Cung là nơi quy tụ tiền duyên nghiệp quả, nguồn năng lượng phát khởi toàn bộ 4 Hóa (Lộc, Quyền, Khoa, Kỵ) của cuộc đời bạn!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= BƯỚC 4 ================= */}
            {activeStep === 4 && (
              <div className="guide-step-card fade-in">
                <div className="step-card-header">
                  <div className="step-badge">Bước 4 trên 6</div>
                  <h4>⚡ Đọc Tứ Hóa (Lộc – Quyền – Khoa – Kỵ) & Phi Tinh</h4>
                </div>
                <p className="step-intro-text">
                  Nếu các chính tinh là chiếc xe, thì <strong>Tứ Hóa</strong> chính là động cơ và nhiên liệu tạo nên vận động biến chuyển của cuộc đời. Tứ Hóa tượng trưng cho 4 mùa Trời Đất:
                </p>

                <div className="guide-sihua-grid">
                  <div className="sihua-card card-loc">
                    <div className="sihua-card-title">🌸 Hóa Lộc (Mùa Xuân)</div>
                    <p>Khởi đầu, tài lộc, duyên lành, tình cảm ấm áp, sự lạc quan và may mắn tự nhiên.</p>
                  </div>
                  <div className="sihua-card card-quyen">
                    <div className="sihua-card-title">☀️ Hóa Quyền (Mùa Hạ)</div>
                    <p>Năng lực hành động, uy quyền, sự chủ động nắm bắt cơ hội, tài lãnh đạo và nghị lực vượt bậc.</p>
                  </div>
                  <div className="sihua-card card-khoa">
                    <div className="sihua-card-title">🍂 Hóa Khoa (Mùa Thu)</div>
                    <p>Học vấn, thanh danh, quý nhân giải ách, hòa giải xung đột, sự điềm đạm và uy tín trí tuệ.</p>
                  </div>
                  <div className="sihua-card card-ky">
                    <div className="sihua-card-title">❄️ Hóa Kỵ (Mùa Đông)</div>
                    <p>Thu liễm, trăn trở, bến đỗ nghiệp lực. Nơi có Hóa Kỵ là nơi bạn bận tâm và phải dụng tâm tu sửa nhiều nhất, nhưng cũng là động lực thôi thúc bạn nỗ lực phi thường nhất!</p>
                  </div>
                </div>

                {natalSihuaList.length > 0 && (
                  <div className="natal-sihua-summary">
                    <div className="summary-title">📍 Tứ Hóa Năm Sinh Trên Lá Số Của Bạn:</div>
                    <div className="natal-sihua-chips">
                      {natalSihuaList.map((item, idx) => (
                        <div key={idx} className="natal-sihua-chip">
                          <span className="sihua-chip-star">{item.star}</span>
                          <span className="sihua-chip-arrow">đóng tại</span>
                          <span className="sihua-chip-palace">Cung {item.palaceName} ({item.canChi})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="step-tip-box">
                  <span className="tip-icon">💡</span>
                  <span>
                    <strong>Tự Hóa:</strong> Khi trên một cung có ký hiệu <em>Tự Hóa Lộc / Quyền / Khoa / Kỵ</em>, nghĩa là cung đó có biến động nội tại, tự phát tiết năng lượng ra ngoài hoặc đối xung sang cung đối diện.
                  </span>
                </div>
              </div>
            )}

            {/* ================= BƯỚC 5 ================= */}
            {activeStep === 5 && (
              <div className="guide-step-card fade-in">
                <div className="step-card-header">
                  <div className="step-badge">Bước 5 trên 6</div>
                  <h4>🪐 Cách Xem Vận Hạn (Đại Hạn 10 Năm – Lưu Niên – Lưu Nguyệt)</h4>
                </div>
                <p className="step-intro-text">
                  Lá số gốc là tĩnh, Vận hạn là động. Để biết "khi nào việc gì xảy ra", bạn dùng <strong>Thanh Điều Hướng Vận Hạn (TimeNav)</strong> ngay trên bàn lá số:
                </p>

                <div className="guide-timenav-explainer">
                  <div className="timenav-level">
                    <div className="level-badge tab-mingpan">🏛️ Bản Mệnh</div>
                    <div className="level-desc">
                      <strong>Bản Mệnh Cả Đời:</strong> Soi chiếu cấu trúc tổng thể, tiềm năng nguyên bản, cốt cách tính cách và nền móng phúc ấm.
                    </div>
                  </div>

                  <div className="timenav-level">
                    <div className="level-badge tab-daxian">🪐 Đại Hạn (10 Năm)</div>
                    <div className="level-desc">
                      <strong>Khung Thời Tiết 10 Năm:</strong> Nhấp các nút tuổi (VD: 24–33, 34–43...) để xem kỳ đại hạn đang trải qua. Cung Đại Hạn sẽ trở thành <code>ĐH.Mệnh</code> và sinh ra <code>ĐH.Lộc / Quyền / Khoa / Kỵ</code>.
                    </div>
                  </div>

                  <div className="timenav-level">
                    <div className="level-badge tab-liunian">📅 Lưu Niên (1 Năm)</div>
                    <div className="level-desc">
                      <strong>Thời Điểm Ứng Kỳ Của Từng Năm:</strong> Nhấp nút ‹ Năm Trước / Năm Kế › để đổi năm xem hạn. Quan sát cung <code>LN.Mệnh</code>, các sao lưu <code>L.Thái Tuế</code>, <code>L.Kình Dương</code>, <code>L.Lộc Tồn</code> và Tứ Hóa Lưu Niên.
                    </div>
                  </div>

                  <div className="timenav-level">
                    <div className="level-badge tab-liuyue">🌙 Lưu Nguyệt (Tháng)</div>
                    <div className="level-desc">
                      <strong>Diễn Biến Từng Tháng Âm Lịch:</strong> Chọn các tháng 1 đến 12 để theo dõi dòng chảy năng lượng và thời điểm tốt xấu trong tháng.
                    </div>
                  </div>
                </div>

                <div className="step-tip-box">
                  <span className="tip-icon">💡</span>
                  <span>
                    <strong>Nguyên tắc vàng:</strong> <em>"Đại Hạn quản 10 năm như thời tiết mùa màng, Lưu Niên ứng kỳ như ngày mưa ngày nắng"</em>. Khi xuất ảnh PNG/PDF hoặc hỏi AI, hệ thống sẽ tự động bắt trọn đúng kỳ Vận Hạn bạn đang chọn!
                    {yunxianState?.mode && (
                      <span style={{ display: 'block', marginTop: '6px', fontWeight: 600 }}>
                        ✦ Chế độ bạn đang chọn trên lá số: {yunxianState.mode === 'daxian' ? '🪐 Đại Hạn (10 Năm)' : yunxianState.mode === 'liunian' ? `📅 Lưu Niên Năm ${yunxianState.viewYear}` : yunxianState.mode === 'liuyue' ? `🌙 Lưu Nguyệt Tháng ${yunxianState.lunarMonth}` : '🏛️ Bản Mệnh'}.
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* ================= BƯỚC 6 ================= */}
            {activeStep === 6 && (
              <div className="guide-step-card fade-in">
                <div className="step-card-header">
                  <div className="step-badge">Bước 6 trên 6</div>
                  <h4>📚 Kết Hợp Bảng Cách Cục, Cổ Thư & Trợ Lý AI</h4>
                </div>
                <p className="step-intro-text">
                  Sau khi đã nắm rõ 5 bước nền tảng, bạn có thể tận dụng toàn bộ sức mạnh của công nghệ Đẩu Số hiện đại trên TuViNow:
                </p>

                <div className="guide-features-showcase">
                  <div className="showcase-card">
                    <span className="showcase-icon">🏆</span>
                    <h5>Bảng Cách Cục Đẩu Số</h5>
                    <p>
                      Kéo xuống mục <strong>Phân Tích Chuyên Sâu Đẩu Số</strong> ngay bên dưới lá số để xem các <em>Thượng Cách</em>, <em>Cát Cách</em> hoặc <em>Hung Cách</em> đã được giải mã tự động.
                    </p>
                  </div>

                  <div className="showcase-card">
                    <span className="showcase-icon">💡</span>
                    <h5>Tra Cứu Nhanh (Tap-to-learn)</h5>
                    <p>
                      Chạm vào bất kỳ ngôi sao nào trên bảng lá số để mở thẻ luận giải chuyên sâu, kèm theo điển tích cổ thư và lời giảng của danh sư <strong>Nghê Hải Hạ</strong> trong bộ sách <em>Thiên Kỷ</em>.
                    </p>
                  </div>

                  <div className="showcase-card">
                    <span className="showcase-icon">🤖</span>
                    <h5>Trợ Lý AI Luận Giải Chi Tiết</h5>
                    <p>
                      Dùng khung <strong>Luận giải Tử Vi bằng AI</strong> ở cuối trang để đặt câu hỏi riêng về Công việc, Tài chính hoặc Tình duyên. AI sẽ kết hợp toàn bộ thông số Vận Hạn đang chọn để phân tích sát sườn nhất!
                    </p>
                  </div>
                </div>

                <div className="step-summary-banner">
                  <span className="banner-icon">✨</span>
                  <span>
                    <strong>Chúc mừng bạn đã hoàn thành cẩm nang tự đọc!</strong> Bạn đã nắm vững logic đọc lá số từ gốc rễ Mệnh–Cục đến biến động Vận Hạn. Hãy tự tin khám phá lá số của mình ngay bây giờ.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
