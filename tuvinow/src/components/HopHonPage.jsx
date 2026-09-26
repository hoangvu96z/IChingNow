import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ssoRequest } from '../services/ssoApi';
import { encryptData, decryptData } from '../utils/cryptoUtils';
import { buildCompatibility, compatibilityEvidence, compatibilityPrompt, compatibilityText, WEIGHTS } from '../utils/compatibility';
import { getYearCanChi } from '../utils/lunarConverter';
import TuViAiPanel from './TuViAiPanel';
import TuViEvidenceProvider from './TuViEvidenceProvider';
import './HopHonPage.css';

const HISTORY_APP = 'tuvi-hop-hon';
const emptyPerson = gioiTinh => ({ hoTen: '', ngay: '', thang: '', nam: '', gio: '', gioiTinh });
const CANH_GIO = ['Tý (23h–01h)', 'Sửu (01h–03h)', 'Dần (03h–05h)', 'Mão (05h–07h)', 'Thìn (07h–09h)', 'Tỵ (09h–11h)', 'Ngọ (11h–13h)', 'Mùi (13h–15h)', 'Thân (15h–17h)', 'Dậu (17h–19h)', 'Tuất (19h–21h)', 'Hợi (21h–23h)'];
const CARD_ICONS = { nguHanh: '🔥', phuThe: '💍', tuHoa: '✨', daoHoa: '🌸' };

function ScoreRing({ score, size = 170, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);
  return (
    <div className="hh-score-wrapper">
      <div className="hh-score-glow" />
      <svg className="hh-score-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-gold)" />
            <stop offset="100%" stopColor="var(--accent-gold-bright)" />
          </linearGradient>
        </defs>
        <circle className="hh-score-ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle className="hh-score-ring-fill" cx={size / 2} cy={size / 2} r={radius}
          style={{ strokeDasharray: circumference, strokeDashoffset: animated ? offset : circumference }} />
      </svg>
      <div className="hh-score">
        <strong>{score}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, max = 100 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth((value / max) * 100), 100); return () => clearTimeout(t); }, [value, max]);
  return (
    <div className="hh-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={`${value}/${max}`}>
      <div className="hh-progress-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

function PersonForm({ label, value, onChange, side }) {
  const set = (key, data) => onChange({ ...value, [key]: data });

  const dateValue = (value.nam && value.thang && value.ngay)
    ? `${String(value.nam).padStart(4, '0')}-${String(value.thang).padStart(2, '0')}-${String(value.ngay).padStart(2, '0')}`
    : '';

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) {
      onChange({ ...value, ngay: '', thang: '', nam: '' });
      return;
    }
    const [y, m, d] = val.split('-').map(Number);
    onChange({ ...value, nam: y, thang: m, ngay: d });
  };

  const hasValidDate = value.nam && value.thang && value.ngay;
  const canChiYear = hasValidDate ? getYearCanChi(value.nam) : '';
  const hourNum = value.gio !== '' ? Number(value.gio) : null;
  const canhGioName = (hourNum !== null && Number.isInteger(hourNum) && hourNum >= 0 && hourNum <= 23)
    ? CANH_GIO[Math.floor((hourNum + 1) / 2) % 12]
    : null;

  const personIcon = side === 'A' ? '👨' : '👩';

  return (
    <fieldset className="hh-person">
      <legend><span className="hh-person-icon">{personIcon}</span> {label}</legend>
      <label>
        Họ và tên
        <input
          required
          maxLength={100}
          autoComplete="off"
          placeholder="Nhập họ và tên..."
          value={value.hoTen}
          onChange={e => set('hoTen', e.target.value)}
        />
      </label>

      <label>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Ngày sinh (Dương lịch)</span>
          {canChiYear && (
            <span className="hh-can-chi">
              ✦ Năm {canChiYear}
            </span>
          )}
        </span>
        <input
          type="date"
          required
          min="1900-01-01"
          max={`${new Date().getFullYear()}-12-31`}
          value={dateValue}
          onChange={handleDateChange}
          onClick={(e) => {
            try { e.target.showPicker?.(); } catch {}
          }}
        />
      </label>

      <div className="hh-two">
        <label>
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Giờ sinh (0–23)</span>
            {canhGioName && (
              <span className="hh-can-chi">
                {canhGioName}
              </span>
            )}
          </span>
          <input
            type="number"
            required
            min="0"
            max="23"
            placeholder="0–23"
            value={value.gio}
            onChange={e => set('gio', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </label>
        <label>
          Giới tính
          <select value={value.gioiTinh} onChange={e => set('gioiTinh', e.target.value)}>
            <option>Nam</option>
            <option>Nữ</option>
          </select>
        </label>
      </div>
      <p className="hh-muted">Nhập ngày dương lịch. Giờ sinh được quy đổi sang giờ Địa Chi như khi lập lá số.</p>
    </fieldset>
  );
}


function PairSession({ initial, userId, onStored }) {
  const [pair] = useState(initial.pair);
  const id = useRef(initial.id);
  const latest = useRef(initial.conversation || null);
  const pending = useRef(Promise.resolve());
  const active = useRef(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const catalog = useMemo(() => compatibilityEvidence(pair), [pair]);
  const persist = conversation => {
    latest.current = conversation;
    const operation = pending.current.catch(() => {}).then(async () => {
      if (!active.current) throw new Error('Phiên hợp hôn đã đóng.');
      setSaveStatus('Đang tự lưu hồ sơ và hội thoại…');
      const payload = await encryptData({ pair, conversation }, userId);
      if (typeof payload !== 'string' || !payload.startsWith('enc_v1::')) throw new Error('Chưa mã hóa được hồ sơ. Vui lòng thử lại.');
      if (!active.current) throw new Error('Phiên hợp hôn đã đóng.');
      const { reading } = await ssoRequest(id.current ? `/readings/${id.current}` : '/readings', {
        method: id.current ? 'PATCH' : 'POST',
        body: id.current ? { data: { payload } } : { app: HISTORY_APP, type: 'tuvi-hop-hon', title: 'Hồ sơ hợp hôn', data: { payload } },
      });
      if (!reading?.id) throw new Error('Máy chủ chưa xác nhận lưu hồ sơ.');
      id.current = reading.id;
      if (active.current) { setSaveStatus('Đã tự lưu hồ sơ và hội thoại'); setSaveFailed(false); onStored(); }
    });
    pending.current = operation;
    return operation.catch(error => {
      if (active.current) { setSaveStatus(`Chưa lưu được: ${error.message}`); setSaveFailed(true); }
      throw error;
    });
  };
  useEffect(() => {
    active.current = true;
    if (!initial.id) persist(latest.current).catch(() => {});
    const retry = () => { if (active.current) persist(latest.current).catch(() => {}); };
    window.addEventListener('online', retry);
    return () => { active.current = false; window.removeEventListener('online', retry); };
  }, []);
  const { assessment: a } = pair;
  return <>
    <section className="hh-result" aria-labelledby="hh-result-title">
      <p className="hh-eyebrow">KẾT QUẢ ĐỐI CHIẾU</p>
      <h2 id="hh-result-title">{a.husbandName} <span>&amp;</span> {a.wifeName}</h2>
      <ScoreRing score={a.totalScore} />
      <h3>{a.ratingText}</h3>
      <p className="hh-muted">Điểm tham khảo theo bộ quy tắc mẫu · Tứ Hóa chéo chưa được tính</p>
      <div className="hh-elements">
        <span>{a.elements.husbandElement}<small>Chồng</small></span>
        <p>{a.elements.interaction}</p>
        <span>{a.elements.wifeElement}<small>Vợ</small></span>
      </div>
    </section>
    <div className="hh-grid">{Object.entries(a.cards).map(([key, card]) => <section className="hh-card" key={key}>
      <header>
        <h3><span className="hh-card-icon">{CARD_ICONS[key] || '📋'}</span>{card.title}</h3>
        <strong>{card.score}<small>/100</small></strong>
      </header>
      <ProgressBar value={card.score} />
      <div className="hh-weight">
        ⚖️ Trọng số {WEIGHTS[key] * 100}%{card.provisional ? ' · Điểm mặc định' : ''}
      </div>
      <p>{card.detail}</p>
    </section>)}</div>
    <section className="hh-card"><h3>📖 Cách đọc kết quả</h3><p>Điểm trước làm tròn: {a.rawScore}/100. Tổng hợp bằng trọng số 30% Ngũ hành, 30% Phu Thê, 25% Tứ Hóa và 15% Đào hoa.</p>
      <p>Đây là kết quả của bộ quy tắc tham khảo, không phải xác suất hôn nhân thành công. Sự thấu hiểu, giao tiếp và cách hai người cùng giải quyết vấn đề vẫn cần được xem xét trong thực tế.</p>
      <details><summary>Dữ kiện hai lá số</summary><pre className="hh-data">{compatibilityText(pair)}</pre></details>
    </section>
    <div className="hh-save" role="status">{saveStatus}{saveFailed && <button type="button" onClick={() => persist(latest.current).catch(() => {})}>Thử lại</button>}</div>
    <TuViEvidenceProvider evidenceCatalog={catalog}>
      <TuViAiPanel result={pair.chong.result} inputData={pair.chong.inputData} initialConversation={initial.conversation} onSave={persist}
        readingContext={{ title: 'Luận giải Hợp hôn bằng AI', label: `${a.husbandName} & ${a.wifeName}`,
          exportText: compatibilityText(pair), buildPrompt: (topic, question) => compatibilityPrompt(pair, topic, question) }} />
    </TuViEvidenceProvider>
  </>;
}

function AuthenticatedPage({ userId }) {
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [payload, setPayload] = useState({ chong: emptyPerson('Nam'), vo: emptyPerson('Nữ') });
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const active = useRef(false);
  const sequence = useRef(0);
  const submitting = useRef(false);
  async function checkAccess() {
    setError(''); setAccess(null);
    try {
      const quota = await ssoRequest('/plans/my-quota?app=tuvinow');
      if (active.current) setAccess(quota.canAsk === true);
    } catch (e) { if (active.current) setError(e.message); }
  }
  async function loadHistory() {
    const seq = ++sequence.current;
    try {
      const { readings = [] } = await ssoRequest(`/readings?app=${HISTORY_APP}`);
      const rows = await Promise.all(readings.filter(r => r.type === 'tuvi-hop-hon').map(async r => ({ ...r, restored: await decryptData(r.data?.payload, userId) })));
      if (active.current && seq === sequence.current) { setHistory(rows); setHistoryError(''); }
    } catch (e) { if (active.current && seq === sequence.current) setHistoryError(e.message); }
  }
  useEffect(() => { active.current = true; checkAccess(); loadHistory(); return () => { active.current = false; sequence.current++; }; }, []);
  async function submit(e) {
    e.preventDefault(); if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const quota = await ssoRequest('/plans/my-quota?app=tuvinow');
      if (!active.current) return;
      if (quota.canAsk !== true) { setAccess(false); throw new Error('Tài khoản chưa có quyền/lượt TuViNow để sử dụng Hợp hôn.'); }
      const pair = buildCompatibility(payload);
      setSession({ key: crypto.randomUUID(), pair });
    } catch (e) { if (active.current) setError(e.message); }
    finally { submitting.current = false; if (active.current) setBusy(false); }
  }
  if (access !== true) return <section className="hh-card hh-gate"><h2>Quyền sử dụng Hợp hôn</h2>
    <p role="status">{error || (access === false ? 'Tài khoản cần có lượt TuViNow khả dụng. Kiểm tra gói hoặc liên hệ quản trị viên để được cấp quyền.' : 'Đang kiểm tra quyền sử dụng…')}</p>
    {(error || access === false) && <button onClick={checkAccess}>Kiểm tra lại</button>}</section>;
  return <>
    <header className="hh-hero">
      <div className="hh-hearts" aria-hidden="true">
        <span>♡</span><span>♡</span><span>♡</span><span>♡</span><span>♡</span>
      </div>
      <div className="hh-hero-icon"><span aria-hidden="true">💕</span></div>
      <h1>Hợp hôn · Tử Vi</h1>
      <p>Hai lá số, những điểm gặp nhau và điều cần thấu hiểu.</p>
    </header>
    <details className="hh-guide"><summary>📋 Hướng dẫn &amp; phạm vi chấm điểm</summary><p>Đối chiếu Ngũ hành, cung Phu Thê và các sao Đào hoa từ hai lá số. Tứ Hóa chéo hiện dùng điểm mặc định của code mẫu. Phần AI bên dưới giúp hỏi sâu theo dữ kiện của từng người.</p><p>Trang yêu cầu đăng nhập và quyền/lượt TuViNow. Mỗi câu hỏi AI dùng một lượt; xem kết quả quy tắc không trừ lượt AI.</p></details>
    {!session ? <form onSubmit={submit} className="hh-form">
      <div className="hh-grid">
        <PersonForm label="Bên A · Chồng" side="A" value={payload.chong} onChange={chong => setPayload(p => ({ ...p, chong }))} />
        <PersonForm label="Bên B · Vợ" side="B" value={payload.vo} onChange={vo => setPayload(p => ({ ...p, vo }))} />
      </div>
      <div className="hh-divider"><span aria-hidden="true">♡</span></div>
      <button className="hh-primary" disabled={busy}>{busy ? '✨ Đang đối chiếu…' : '💕 Xem hợp hôn'}</button>
    </form>
      : <><button className="hh-back" onClick={() => setSession(null)}>← Đổi thông tin hai người</button><PairSession key={session.key} initial={session} userId={userId} onStored={loadHistory} /></>}
    {error && <p role="alert">{error}</p>}
    <details className="hh-history"><summary>📂 Lịch sử Hợp hôn ({history.length})</summary>
      {historyError && <p role="alert">{historyError}</p>}<button onClick={loadHistory}>Làm mới</button>
      {history.map(row => <button key={row.id} className="hh-history-row" onClick={() => {
        const restored = row.restored;
        if (!restored?.pair?.assessment || !restored?.pair?.chong?.result?.palates || !restored?.pair?.vo?.result?.palates) { setError('Hồ sơ này không đọc được dữ liệu.'); return; }
        setPayload(restored.pair.payload); setSession({ ...restored, id: row.id, key: crypto.randomUUID() }); setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}>{row.restored?.pair?.assessment ? `${row.restored.pair.assessment.husbandName} & ${row.restored.pair.assessment.wifeName}` : 'Hồ sơ chưa đọc được'}<small>{new Date(row.createdAt).toLocaleDateString('vi-VN')}</small></button>)}
    </details>
  </>;
}

export default function HopHonPage() {
  const { user, isLoading, isAuthenticated, login } = useAuth();
  return <div className="hop-hon">{isLoading ? <p role="status">Đang kiểm tra đăng nhập…</p> : !isAuthenticated
    ? <section className="hh-card hh-gate"><h1>Hợp hôn · Tử Vi</h1><p>Đăng nhập để đối chiếu hai lá số và kiểm tra quyền sử dụng.</p><button className="hh-primary" onClick={login}>Đăng nhập</button></section>
    : <AuthenticatedPage key={user.id} userId={user.id} />}</div>;
}
