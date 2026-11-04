import React, { useState, useMemo } from 'react';
import {
  detectPatterns,
  getCanLuongPoem,
  CLASSICS_LIBRARY,
  searchClassics,
  LEVEL_LABELS,
  buildChartFlyingSihua,
} from '../utils/tuViZiweiModule.js';

export default function TuViPatternsPanel({ result, inputData, initialTab = 'patterns' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'patterns' | 'sihua' | 'canLuong' | 'classics'
  const [patternFilter, setPatternFilter] = useState('all'); // 'all' | 'excellent' | 'good' | 'neutral' | 'caution'
  const [classicsQuery, setClassicsQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(CLASSICS_LIBRARY[0]?.id || 'toan-thu');

  // 1. Nhận diện cách cục
  const patterns = useMemo(() => {
    if (!result || !result.palates) return [];
    try {
      return detectPatterns(result);
    } catch {
      return [];
    }
  }, [result]);

  const filteredPatterns = useMemo(() => {
    if (patternFilter === 'all') return patterns;
    return patterns.filter((p) => p.level === patternFilter);
  }, [patterns, patternFilter]);

  // 2. Phi tinh Tứ Hóa & Lai Nhân Cung
  const flyingSihua = useMemo(() => {
    if (!result || !result.palates) return null;
    if (result.ziweiMeta?.flyingSihua) return result.ziweiMeta.flyingSihua;
    try {
      return buildChartFlyingSihua(result, inputData?.schoolConfig);
    } catch {
      return null;
    }
  }, [result, inputData]);

  // 3. Thơ Cân Xương Đoán Số
  const canLuongPoem = useMemo(() => {
    if (!result) return null;
    if (result.ziweiMeta?.canLuongPoem) return result.ziweiMeta.canLuongPoem;
    if (result.canLuongStr) return getCanLuongPoem(result.canLuongStr);
    return null;
  }, [result]);

  // 4. Tìm kiếm thư viện cổ thư
  const searchResults = useMemo(() => {
    const q = classicsQuery.trim();
    if (!q) return null;
    return searchClassics(q, 30);
  }, [classicsQuery]);

  const currentBook = useMemo(() => {
    return CLASSICS_LIBRARY.find((b) => b.id === selectedBookId) || CLASSICS_LIBRARY[0];
  }, [selectedBookId]);

  if (!result || !result.palates) return null;

  return (
    <section className="tuvi-patterns-panel" aria-labelledby="patterns-panel-heading">
      <div className="patterns-panel-header">
        <h3 id="patterns-panel-heading" className="patterns-panel-title">
          ✦ Phân Tích Chuyên Sâu Đẩu Số
        </h3>
        <p className="patterns-panel-subtitle">
          Nhận diện Cách Cục Kinh Điển, Phi Tinh Tứ Hóa 12 Cung, Thơ Cân Xương & Thư Viện Cổ Thư
        </p>
      </div>

      {/* Main Tabs Header */}
      <div className="patterns-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'patterns'}
          className={`patterns-tab-btn ${activeTab === 'patterns' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          🔮 Cách Cục Đẩu Số ({patterns.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sihua'}
          className={`patterns-tab-btn ${activeTab === 'sihua' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('sihua')}
        >
          ✨ Phi Tinh & Lai Nhân Cung
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'canLuong'}
          className={`patterns-tab-btn ${activeTab === 'canLuong' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('canLuong')}
        >
          ⚖️ Thơ Cân Xương
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'classics'}
          className={`patterns-tab-btn ${activeTab === 'classics' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('classics')}
        >
          📚 Thư Viện Cổ Thư & Thiên Kỷ
        </button>
      </div>

      {/* TAB 1: CÁCH CỤC ĐẨU SỐ */}
      {activeTab === 'patterns' && (
        <div className="patterns-tab-content">
          {/* Level Filter Chips */}
          <div className="pattern-filter-chips">
            <button
              type="button"
              className={`p-filter-chip ${patternFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPatternFilter('all')}
            >
              Tất Cả ({patterns.length})
            </button>
            <button
              type="button"
              className={`p-filter-chip excellent ${patternFilter === 'excellent' ? 'active' : ''}`}
              onClick={() => setPatternFilter('excellent')}
            >
              🌟 Thượng Cách ({patterns.filter((p) => p.level === 'excellent').length})
            </button>
            <button
              type="button"
              className={`p-filter-chip good ${patternFilter === 'good' ? 'active' : ''}`}
              onClick={() => setPatternFilter('good')}
            >
              ✨ Cát Cách ({patterns.filter((p) => p.level === 'good').length})
            </button>
            <button
              type="button"
              className={`p-filter-chip neutral ${patternFilter === 'neutral' ? 'active' : ''}`}
              onClick={() => setPatternFilter('neutral')}
            >
              ⚖️ Bình Hòa ({patterns.filter((p) => p.level === 'neutral').length})
            </button>
            <button
              type="button"
              className={`p-filter-chip caution ${patternFilter === 'caution' ? 'active' : ''}`}
              onClick={() => setPatternFilter('caution')}
            >
              ⚠️ Hung Cách / Lưu Ý ({patterns.filter((p) => p.level === 'caution').length})
            </button>
          </div>

          {filteredPatterns.length === 0 ? (
            <div className="patterns-empty-notice">
              Không có cách cục nào thuộc nhóm này trong lá số hiện tại.
            </div>
          ) : (
            <div className="pattern-cards-grid">
              {filteredPatterns.map((pat) => (
                <div key={pat.id} className={`pattern-card level-${pat.level}`}>
                  <div className="pattern-card-header">
                    <div>
                      <h4 className="pattern-name">
                        {pat.name}
                        {pat.nameZh && <span className="pattern-name-zh"> ({pat.nameZh})</span>}
                      </h4>
                      {pat.palaces?.length > 0 && (
                        <div className="pattern-palaces">
                          📍 Cung Vị: {pat.palaces.join(', ')}
                        </div>
                      )}
                    </div>
                    <span className={`pattern-level-badge level-${pat.level}`}>
                      {LEVEL_LABELS[pat.level] || pat.level}
                    </span>
                  </div>

                  <p className="pattern-desc">{pat.description}</p>

                  <div className="pattern-conditions">
                    {pat.conditions?.required?.length > 0 && (
                      <div className="condition-row required">
                        <strong>✓ Điều kiện thành cách:</strong>
                        <ul>
                          {pat.conditions.required.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pat.conditions?.bonus?.length > 0 && (
                      <div className="condition-row bonus">
                        <strong>+ Yếu tố cộng điểm (Gia Cát):</strong>
                        <ul>
                          {pat.conditions.bonus.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pat.conditions?.breaking?.length > 0 && (
                      <div className="condition-row breaking">
                        <strong>✕ Yếu tố phá cách:</strong>
                        <ul>
                          {pat.conditions.breaking.map((brk, i) => (
                            <li key={i}>{brk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {pat.source && (
                    <div className="pattern-source">
                      <span>📖 Xuất xứ: {pat.source}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PHI TINH TỨ HÓA 12 CUNG & LAI NHÂN CUNG */}
      {activeTab === 'sihua' && (
        <div className="patterns-tab-content">
          {/* Lai Nhân Cung Card */}
          {flyingSihua?.laiNhanCung && (
            <div className="lai-nhan-banner">
              <div className="lai-nhan-header">
                <span className="lai-nhan-badge">🌟 LAI NHÂN CUNG</span>
                <h4 className="lai-nhan-palace">
                  Cung {flyingSihua.laiNhanCung.chucNang} ({flyingSihua.laiNhanCung.canName}{' '}
                  {flyingSihua.laiNhanCung.chiName})
                </h4>
              </div>
              <p className="lai-nhan-desc">
                {flyingSihua.laiNhanCung.summary ||
                  'Lai Nhân Cung là cung có Thiên Can trùng với Thiên Can của năm sinh. Đây là nơi khởi phát nghiệp duyên tiền kiếp, phản ánh trọng tâm năng lượng cả đời và nguyên nhân gốc rễ của mọi sự may rủi, nhân quả.'}
              </p>
            </div>
          )}

          {/* 12 Palaces Flying Sihua Table */}
          <div className="flying-table-wrapper">
            <table className="flying-sihua-table">
              <thead>
                <tr>
                  <th>Cung Vị</th>
                  <th>Can Chi</th>
                  <th>Hóa Lộc</th>
                  <th>Hóa Quyền</th>
                  <th>Hóa Khoa</th>
                  <th>Hóa Kỵ</th>
                  <th>Tự Hóa</th>
                </tr>
              </thead>
              <tbody>
                {(flyingSihua?.palaces || []).map((p) => {
                  const flights = p.flyingFlights || [];
                  const locFlight = flights.find((f) => f.siHua === 'Hóa Lộc');
                  const quyenFlight = flights.find((f) => f.siHua === 'Hóa Quyền');
                  const khoaFlight = flights.find((f) => f.siHua === 'Hóa Khoa');
                  const kyFlight = flights.find((f) => f.siHua === 'Hóa Kỵ');
                  const selfSihua = p.selfSihua || [];

                  return (
                    <tr key={p.chiIndex}>
                      <td className="palace-name-col">
                        <strong>Cung {p.chucNang.replace(' <THÂN>', '')}</strong>
                      </td>
                      <td className="canchi-col">
                        {p.canName} {p.chiName}
                      </td>
                      <td className="flight-cell loc">
                        {p.transforms?.['Hóa Lộc']}
                        {locFlight?.targetPalace && (
                          <span className="target-pill"> → {locFlight.targetPalace}</span>
                        )}
                      </td>
                      <td className="flight-cell quyen">
                        {p.transforms?.['Hóa Quyền']}
                        {quyenFlight?.targetPalace && (
                          <span className="target-pill"> → {quyenFlight.targetPalace}</span>
                        )}
                      </td>
                      <td className="flight-cell khoa">
                        {p.transforms?.['Hóa Khoa']}
                        {khoaFlight?.targetPalace && (
                          <span className="target-pill"> → {khoaFlight.targetPalace}</span>
                        )}
                      </td>
                      <td className="flight-cell ky">
                        {p.transforms?.['Hóa Kỵ']}
                        {kyFlight?.targetPalace && (
                          <span className="target-pill"> → {kyFlight.targetPalace}</span>
                        )}
                      </td>
                      <td className="self-sihua-col">
                        {selfSihua.length > 0 ? (
                          selfSihua.map((s, idx) => (
                            <span key={idx} className="self-sihua-pill">
                              Tự Hóa {s.siHua.replace('Hóa ', '')}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: THƠ CÂN XƯƠNG ĐOÁN SỐ */}
      {activeTab === 'canLuong' && (
        <div className="patterns-tab-content">
          {canLuongPoem ? (
            <div className="can-luong-card">
              <div className="can-luong-header">
                <div>
                  <span className="can-luong-badge">⚖️ CÂN XƯƠNG ĐOÁN SỐ</span>
                  <h4 className="can-luong-weight">{canLuongPoem.canLuongStr}</h4>
                </div>
                <div className="can-luong-title">{canLuongPoem.title || canLuongPoem.tier}</div>
              </div>

              {/* Bài thơ Hán Việt */}
              {(canLuongPoem.poemHanViet || canLuongPoem.poem) && (
                <div className="can-luong-poem-box han-viet">
                  <div className="box-label">✦ Bài Thơ Hán Việt (Viên Thiên Cương Cổ Bản):</div>
                  <pre className="poem-text">
                    {Array.isArray(canLuongPoem.poemHanViet || canLuongPoem.poem)
                      ? (canLuongPoem.poemHanViet || canLuongPoem.poem).join('\n')
                      : (canLuongPoem.poemHanViet || canLuongPoem.poem)}
                  </pre>
                </div>
              )}

              {/* Bài thơ Dịch Nghĩa */}
              {canLuongPoem.poemDichNghia && (
                <div className="can-luong-poem-box dich-nghia">
                  <div className="box-label">✦ Thơ Dịch Nghĩa:</div>
                  <pre className="poem-text">
                    {Array.isArray(canLuongPoem.poemDichNghia)
                      ? canLuongPoem.poemDichNghia.join('\n')
                      : canLuongPoem.poemDichNghia}
                  </pre>
                </div>
              )}

              {/* Luận giải chi tiết */}
              {(canLuongPoem.interpretation || canLuongPoem.meaning) && (
                <div className="can-luong-interp-box">
                  <div className="box-label">✦ Luận Giải Chi Tiết Vận Mệnh:</div>
                  <p className="interp-text">{canLuongPoem.interpretation || canLuongPoem.meaning}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="patterns-empty-notice">
              Chưa có dữ liệu cân lượng cho lá số này.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: THƯ VIỆN CỔ THƯ & THIÊN KỶ NGHÊ HẢI HẠ */}
      {activeTab === 'classics' && (
        <div className="patterns-tab-content">
          {/* Search Bar */}
          <div className="classics-search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="classics-search-input"
              placeholder="Tìm kiếm phú quyết, câu thơ, tên sao trong Tử Vi Đẩu Số Toàn Thư, Cốt Tủy Phú, Thái Vi Phú, Thiên Kỷ..."
              value={classicsQuery}
              onChange={(e) => setClassicsQuery(e.target.value)}
            />
            {classicsQuery && (
              <button
                type="button"
                className="classics-clear-btn"
                onClick={() => setClassicsQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Book selector tabs (if not searching) */}
          {!classicsQuery && (
            <div className="classics-book-tabs">
              {CLASSICS_LIBRARY.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`classics-book-tab ${selectedBookId === b.id ? 'active' : ''}`}
                  onClick={() => setSelectedBookId(b.id)}
                >
                  {b.title}
                  {b.titleZh && <span className="book-zh"> ({b.titleZh})</span>}
                </button>
              ))}
            </div>
          )}

          {/* Passages List */}
          <div className="classics-passages-list">
            {(searchResults || currentBook.passages).map((p) => (
              <div key={p.id} className="classic-passage-card">
                <div className="passage-header">
                  <h4 className="passage-title">
                    {p.title}
                    {p.titleZh && <span className="passage-title-zh"> ({p.titleZh})</span>}
                  </h4>
                  {p.bookTitle && <span className="passage-book-tag">{p.bookTitle}</span>}
                </div>

                {p.hanViet && (
                  <div className="passage-hanviet">
                    <span className="passage-label">Cổ Quyết / Hán Việt:</span>
                    <pre className="passage-quote">{p.hanViet}</pre>
                  </div>
                )}

                {p.translation && (
                  <div className="passage-translation">
                    <span className="passage-label">Dịch Nghĩa & Luận Giải:</span>
                    <p className="passage-text">{p.translation}</p>
                  </div>
                )}

                {p.commentary && (
                  <div className="passage-commentary">
                    <span className="passage-label">Lời Giảng Nghê Hải Hạ:</span>
                    <p className="passage-commentary-text">{p.commentary}</p>
                  </div>
                )}

                {p.tags?.length > 0 && (
                  <div className="passage-tags">
                    {p.tags.map((t, idx) => (
                      <span key={idx} className="passage-tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
