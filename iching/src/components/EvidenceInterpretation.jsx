import { useEvidence } from '../context/evidenceState';
import { useLanguage } from '../context/LanguageContext';
import { parseInterpretationResponse } from '../logic/interpretationEvidence';

export default function EvidenceInterpretation({
  text,
  parsedResponse,
  renderMarkdown,
}) {
  const evidence = useEvidence();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const parsed = parsedResponse ?? parseInterpretationResponse(text, evidence?.catalog || []);
  if (!parsed.structured) {
    if (!parsed.fallback.trim()) {
      return <p role="status" style={{ color: 'var(--color-ink)', lineHeight: 1.65 }}>
        {isEn
          ? 'AI returned no interpretation. Please try again.'
          : 'AI chưa trả về nội dung luận giải. Bạn vui lòng thử lại.'}
      </p>;
    }
    return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed.fallback) }} />;
  }
  return (
    <div className="evidence-interpretation">
      {parsed.sections.map((section, index) => (
        <section key={index}>
          {section.title && <h3>{section.title}</h3>}
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdown(section.text) }}
          />
          {section.references.length > 0 && (
            <button
              type="button"
              className="evidence-open"
              onClick={(event) => evidence.open(section, event.currentTarget)}
            >
              ◈ {isEn ? 'View evidence' : 'Xem căn cứ'}{' '}
              <span>{section.references.length}</span>
            </button>
          )}
          {section.omittedReferences && (
            <p className="evidence-note">
              {isEn
                ? 'Some references could not be matched to this reading.'
                : 'Một số căn cứ AI viện dẫn không khớp dữ liệu quẻ nên không được liên kết.'}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
