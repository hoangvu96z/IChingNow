import { EvidenceContext } from './evidenceState';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buildEvidenceCatalog } from '../logic/interpretationEvidence';
import { useLanguage } from './LanguageContext';

export function EvidenceProvider({ result, children }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const catalog = useMemo(() => buildEvidenceCatalog(result), [result]);
  const [selection, setSelection] = useState(null);
  const trigger = useRef(null);
  const closeButton = useRef(null);
  const pending = useRef(null);
  const close = () => {
    setSelection(null);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!selection) return;
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setSelection(null);
        trigger.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection]);
  useEffect(() => () => cancelAnimationFrame(pending.current), []);
  const selectedIds = selection?.ids || [];
  const open = (section, element) => {
    trigger.current = element;
    setSelection({
      ids: section.references,
      title: section.title,
      text: section.text,
    });
  };
  const locate = (target) => {
    // IDs are drawn exclusively from the validated catalog.
    pending.current = requestAnimationFrame(() => {
      const element = document.querySelector(`[data-evidence-id="${target}"]`);
      if (element) {
        element.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
          block: 'center',
        });
        element.focus({ preventScroll: true });
      }
    });
  };
  const targetProps = (id) => ({
    'data-evidence-id': id,
    'data-evidence-selected': selectedIds.includes(id) ? 'true' : undefined,
    tabIndex: -1,
  });
  return (
    <EvidenceContext.Provider
      value={{ catalog, selectedIds, open, targetProps }}
    >
      {children}
      {selection && (
        <aside
          className="evidence-drawer"
          role="region"
          aria-label={isEn ? 'Interpretation evidence' : 'Căn cứ luận giải'}
        >
          <header>
            <div>
              <span className="evidence-eyebrow">
                {isEn ? 'SOURCE DATA' : 'DỮ LIỆU LẬP QUẺ'}
              </span>
              <h3>{isEn ? 'Why this interpretation?' : 'Căn cứ luận giải'}</h3>
            </div>
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              aria-label={isEn ? 'Close evidence' : 'Đóng căn cứ'}
            >
              ✕
            </button>
          </header>
          {selection.title && <h4>{selection.title}</h4>}
          <p className="evidence-note">
            {isEn
              ? 'These are the computed facts cited by AI. The interpretation remains an inference.'
              : 'Đây là dữ kiện từ kết quả lập quẻ được AI viện dẫn. Phần luận giải là diễn giải từ các dữ kiện này.'}
          </p>
          {selectedIds
            .map((id) => catalog.find((item) => item.id === id))
            .filter(Boolean)
            .map((item) => (
              <section key={item.id} className="evidence-fact">
                <h4>{item.label}</h4>
                <dl>
                  {item.facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <button type="button" onClick={() => locate(item.target)}>
                  {isEn ? 'Show in reading ↑' : 'Xem trên quẻ ↑'}
                </button>
              </section>
            ))}
        </aside>
      )}
    </EvidenceContext.Provider>
  );
}
