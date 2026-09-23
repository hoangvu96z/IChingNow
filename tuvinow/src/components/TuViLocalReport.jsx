import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { buildTuViInterpretation, interpretationMarkdown, REPORT_SECTIONS } from '../utils/tuViInterpretation.js';
import './TuViLocalReport.css';

export default function TuViLocalReport({ result }) {
  const report = useMemo(() => {
    try { return buildTuViInterpretation(result); }
    catch (error) { return { error: error.message }; }
  }, [result]);
  return (
    <section className="tuvi-local-report" aria-labelledby="local-report-title">
      <header className="local-report-header">
        <div>
          <h2 id="local-report-title">Luận đoán lá số</h2>
          <p>Theo bộ quy tắc Tử Vi v5 · Tự động từ lá số của bạn</p>
        </div>
        <span className="local-report-badge">Miễn phí</span>
      </header>
      {report.error ? <p className="local-report-message" role="status">{report.error}</p> : (
        <div className="local-report-sections">
          {REPORT_SECTIONS.map(([key, title], index) => (
            <details key={key} open={index === 0} className="local-report-section">
              <summary><span className="local-report-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{title}</span><span className="local-report-chevron" aria-hidden="true">⌄</span></summary>
              <div className="local-report-prose">
                {key === 'step6_LuuNien' && !report.hasViewYear
                  ? <p>Bạn chưa chọn năm xem hạn. Khi lập lá số, điền năm muốn xem để có phần luận đoán này.</p>
                  : <ReactMarkdown>{interpretationMarkdown(report.sections[key])}</ReactMarkdown>}
              </div>
            </details>
          ))}
        </div>
      )}
      <footer className="local-report-footer">Muốn tìm hiểu sâu hơn? Phần AI bên dưới hỗ trợ phân tích theo câu hỏi của bạn.</footer>
    </section>
  );
}
