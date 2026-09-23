import ReactMarkdown from 'react-markdown';
import { useTuViEvidence } from '../context/tuViEvidenceState';
import { parseTuViAnswer } from '../utils/tuViEvidence';

export default function TuViEvidenceAnswer({ text, parsedResponse }) {
  const evidence = useTuViEvidence();
  const parsed = parsedResponse ?? parseTuViAnswer(text, evidence?.catalog || []);
  if (!parsed.structured) return parsed.fallback.trim()
    ? <ReactMarkdown>{parsed.fallback}</ReactMarkdown>
    : <p role="status">AI chưa trả về nội dung luận giải. Bạn có thể bấm “Luận giải lại lá số” để thử lại.</p>;
  return <div className="tv-evidence-answer">{parsed.sections.map((section, index) => <section key={index}>
    {section.title && <h3>{section.title}</h3>}
    <ReactMarkdown>{section.text}</ReactMarkdown>
    {!!section.references.length && evidence && <button className="tv-text-button" type="button" onClick={e => evidence.open(section, e.currentTarget)}>◇ Xem căn cứ · {section.references.length} cung</button>}
    {section.omittedReferences && <p className="tv-caption">Một số căn cứ AI viện dẫn không khớp lá số nên không được liên kết.</p>}
  </section>)}</div>;
}
