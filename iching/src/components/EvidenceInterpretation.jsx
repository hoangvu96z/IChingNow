import { useEvidence } from '../context/evidenceState';
import { useLanguage } from '../context/LanguageContext';
import { parseEvidenceResponse } from '../logic/interpretationEvidence';

export default function EvidenceInterpretation({
  text,
  fallbackText,
  renderMarkdown,
}) {
  const evidence = useEvidence();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const parsed = parseEvidenceResponse(text, evidence?.catalog || []);
  if (!parsed.structured)
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(
            parsed.fallback !== text
              ? parsed.fallback
              : (fallbackText ?? parsed.fallback),
          ),
        }}
      />
    );
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
