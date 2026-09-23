import { useEffect, useMemo, useRef, useState } from 'react';
import { TuViEvidenceContext } from '../context/tuViEvidenceState';
import { buildTuViEvidence } from '../utils/tuViEvidence';

export default function TuViEvidenceProvider({ result, children }) {
  const catalog = useMemo(() => buildTuViEvidence(result), [result]);
  const [selection, setSelection] = useState(null);
  const trigger = useRef(null);
  const heading = useRef(null);
  const close = () => { setSelection(null); trigger.current?.focus(); };
  useEffect(() => {
    if (!selection) return;
    heading.current?.focus();
    const escape = e => { if (e.key === 'Escape') { setSelection(null); trigger.current?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [selection]);
  const entries = catalog.filter(item => selection?.references.includes(item.id));
  return <TuViEvidenceContext.Provider value={{
    catalog,
    open: (section, button) => { trigger.current = button; setSelection(section); },
    targetProps: id => ({ id: `tuvi-${id}`, tabIndex: -1, 'data-evidence-selected': selection?.references.includes(id) || undefined }),
  }}>
    {children}
    {selection && <aside className="tv-evidence-panel" aria-labelledby="tv-evidence-title">
      <header><h3 id="tv-evidence-title" ref={heading} tabIndex={-1}>Căn cứ luận giải</h3><button type="button" onClick={close} aria-label="Đóng căn cứ">×</button></header>
      <p>{selection.title || 'Dữ kiện được viện dẫn'}</p>
      <p className="tv-evidence-caption">Dữ liệu lấy từ lá số. Đây không phải xác nhận dự đoán của AI.</p>
      {entries.map(item => <section key={item.id}>
        <h4>{item.label}</h4>
        <dl>{item.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <button type="button" onClick={() => {
          const target = document.getElementById(`tuvi-${item.id}`);
          target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          target?.focus({ preventScroll: true });
        }}>Xem trên lá số ↑</button>
      </section>)}
    </aside>}
  </TuViEvidenceContext.Provider>;
}
