import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TuViEvidenceAnswer from './TuViEvidenceAnswer';
import { useTuViEvidence } from '../context/tuViEvidenceState';
import { parseTuViAnswer, tuViAnswerText, tuViEvidencePrompt } from '../utils/tuViEvidence';
import {
  TOPICS,
  PROMPT_STYLES,
  buildTuViText,
  buildTuViPrompt,
} from '../utils/buildTuViPrompt';
import { THIEN_CAN, DIA_CHI } from '../utils/tuViZiweiModule.js';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { ssoRequest } from '../services/ssoApi';
import { requestAiChat } from '../../../shared/src/utils/aiProxy.mjs';
import { readOpenAiChatStream } from '../../../shared/src/utils/openAiSse.mjs';

function Icon({ name = 'spark', size = 18 }) {
  const paths = {
    spark: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z',
    copy: 'M9 9h11v12H9z M15 9V3H3v12h6',
    settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    chat: 'M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5Z',
    book: 'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
    check: 'm5 12 4 4L19 6',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  );
}

export default function TuViAiPanel({
  result,
  inputData,
  initialConversation,
  onSave,
  readingContext,
  yunxianState: externalYunxianState,
  onYunxianChange,
}) {
  const { isAuthenticated, login } = useAuth();
  const {
    remaining,
    planLabel,
    canBonus,
    fetchQuota,
    requestBonus,
    applyCoupon,
  } = usePlan(isAuthenticated);
  const [topic, setTopic] = useState(initialConversation?.topic || 'overview');
  const [question, setQuestion] = useState(initialConversation?.question || '');
  const [conversation, setConversation] = useState(initialConversation || null);
  const [followUp, setFollowUp] = useState('');
  const [config, setConfig] = useState({ models: ['combo1'], configured: null });
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [configError, setConfigError] = useState('');
  const [model, setModel] = useState('combo1');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [coupon, setCoupon] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [exportTab, setExportTab] = useState('prompt');
  const [includeZiweiEngine, setIncludeZiweiEngine] = useState(true);
  const [promptStyle, setPromptStyle] = useState('concise');
  const [elapsed, setElapsed] = useState(0);
  const controller = useRef(null);
  const mounted = useRef(false);
  const pendingSave = useRef(null);
  const savingRef = useRef(false);
  const evidence = useTuViEvidence();
  const catalog = evidence?.catalog || [];

  const [localYunxianState, setLocalYunxianState] = useState(() => ({
    mode: externalYunxianState?.mode || (result?.viewYear ? 'liunian' : 'mingpan'),
    daXianChiIndex: externalYunxianState?.daXianChiIndex ?? null,
    viewYear: externalYunxianState?.viewYear !== undefined && externalYunxianState?.viewYear !== null
      ? Number(externalYunxianState.viewYear)
      : (result?.viewYear ? Number(result.viewYear) : new Date().getFullYear()),
    lunarMonth: externalYunxianState?.lunarMonth ?? null,
  }));

  useEffect(() => {
    if (externalYunxianState) {
      setLocalYunxianState((prev) => ({
        ...prev,
        ...externalYunxianState,
      }));
    }
  }, [externalYunxianState]);

  const effectiveYunxianState = useMemo(() => {
    return {
      mode: externalYunxianState?.mode ?? localYunxianState.mode,
      daXianChiIndex: externalYunxianState?.daXianChiIndex !== undefined
        ? externalYunxianState.daXianChiIndex
        : localYunxianState.daXianChiIndex,
      viewYear: externalYunxianState?.viewYear !== undefined && externalYunxianState?.viewYear !== null
        ? Number(externalYunxianState.viewYear)
        : localYunxianState.viewYear,
      lunarMonth: externalYunxianState?.lunarMonth !== undefined
        ? externalYunxianState.lunarMonth
        : localYunxianState.lunarMonth,
    };
  }, [externalYunxianState, localYunxianState]);

  const updateYunxian = useCallback((patch) => {
    setLocalYunxianState((prev) => ({ ...prev, ...patch }));
    if (onYunxianChange) {
      const merged = { ...effectiveYunxianState, ...patch };
      onYunxianChange(merged);
    }
  }, [onYunxianChange, effectiveYunxianState]);

  const daXianOptions = useMemo(() => {
    if (!result?.palates || !Array.isArray(result.palates)) return [];
    return [...result.palates]
      .filter((p) => p.daiHan !== undefined && p.daiHan !== null)
      .sort((a, b) => a.daiHan - b.daiHan)
      .map((p) => ({
        chiIndex: p.chiIndex,
        daiHan: p.daiHan,
        startAge: p.daiHan,
        endAge: p.daiHan + 9,
        chucNang: p.chucNang,
        canName: p.canName,
        chiName: p.chiName,
        label: `${p.daiHan}–${p.daiHan + 9} tuổi · Cung ${p.chucNang} (${p.canName} ${p.chiName})`,
      }));
  }, [result?.palates]);

  const birthYear = inputData?.lunarYear || 1950;
  const maxYear = Math.max(birthYear + 95, new Date().getFullYear() + 20);

  const yearOptions = useMemo(() => {
    const bYear = inputData?.lunarYear || 1950;
    const mYear = Math.max(bYear + 95, new Date().getFullYear() + 20);
    const years = [];
    for (let y = bYear; y <= mYear; y++) {
      const stem = THIEN_CAN[((y - 4) % 10 + 10) % 10];
      const branch = DIA_CHI[((y - 4) % 12 + 12) % 12];
      const age = inputData?.lunarYear ? y - inputData.lunarYear + 1 : null;
      years.push({
        year: y,
        canChi: `${stem} ${branch}`,
        age,
        label: `Năm ${y} (${stem} ${branch}${age ? ` · ${age} tuổi` : ''})`,
      });
    }
    return years;
  }, [inputData?.lunarYear]);

  const yunxianBadge = useMemo(() => {
    if (!effectiveYunxianState) return null;
    if (effectiveYunxianState.mode === 'daxian') {
      return 'Đại Hạn (10 Năm)';
    }
    if (effectiveYunxianState.mode === 'liunian') {
      return `Lưu Niên Năm ${effectiveYunxianState.viewYear || result?.viewYear || ''}`;
    }
    if (effectiveYunxianState.mode === 'liuyue') {
      return `Lưu Nguyệt Tháng ${effectiveYunxianState.lunarMonth || 1} (Năm ${effectiveYunxianState.viewYear || result?.viewYear || ''})`;
    }
    return 'Bản Mệnh';
  }, [effectiveYunxianState, result?.viewYear]);

  const exportOptions = useMemo(
    () => ({ includeZiweiEngine, promptStyle }),
    [includeZiweiEngine, promptStyle],
  );

  const makePrompt = readingContext?.buildPrompt || ((topic, question, structured) => buildTuViPrompt(result, inputData, topic, question, structured, effectiveYunxianState, exportOptions));
  const prompt = makePrompt(topic, question, false);
  const parsed = parseTuViAnswer(conversation?.initialInterpretation || '', catalog);
  const answerText = tuViAnswerText(conversation?.initialInterpretation || '');
  const followUps = conversation?.followUps || [];
  const exportText =
    exportTab === 'prompt' ? prompt : readingContext?.exportText || buildTuViText(result, inputData, effectiveYunxianState, exportOptions);
  const exportCopied = copiedText === exportText;

  const checkConfig = useCallback(async (signal) => {
    if (!isAuthenticated) {
      setCheckingConfig(false);
      setConfigError('');
      return;
    }
    setCheckingConfig(true);
    setConfigError('');
    try {
      const data = await ssoRequest('/plans/tuvi-ai/config', { signal });
      if (signal?.aborted || !mounted.current) return;
      const models = Array.isArray(data.models) ? data.models.filter(m => typeof m === 'string' && m.trim()) : [];
      if (!models.length || typeof data.configured !== 'boolean') throw new Error('Invalid AI configuration');
      setConfig({ models, configured: data.configured });
      setModel(previous => models.includes(previous) ? previous : models[0]);
    } catch {
      if (signal?.aborted || !mounted.current) return;
      setConfig(previous => ({ ...previous, configured: null }));
      setConfigError('Chưa kiểm tra được dịch vụ AI. Vui lòng kiểm tra kết nối rồi thử lại.');
    } finally {
      if (!signal?.aborted && mounted.current) setCheckingConfig(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    mounted.current = true;
    const abort = new AbortController();
    checkConfig(abort.signal);
    return () => {
      mounted.current = false;
      abort.abort();
      controller.current?.abort();
    };
  }, [checkConfig, isAuthenticated]);

  const aiUnavailable = isAuthenticated && (checkingConfig || config.configured !== true);

  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    const retry = () => {
      if (pendingSave.current && !savingRef.current) save(pendingSave.current);
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setCopyMessage('Đã sao chép!');
    } catch {
      setCopiedText('');
      setCopyMessage(
        'Không truy cập được clipboard. Bạn có thể chọn và sao chép nội dung bên dưới.',
      );
    }
  }
  async function save(value) {
    pendingSave.current = value;
    savingRef.current = true;
    setSaving(true);
    setSaveMessage('');
    try {
      await onSave(value);
      pendingSave.current = null;
      if (mounted.current) setSaveMessage('Đã tự lưu lá số và hội thoại.');
    } catch (err) {
      if (mounted.current)
        setSaveMessage(`Chưa lưu được: ${err.message}. Sẽ tự thử lại khi có mạng.`);
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  async function ask(nextQuestion) {
    if (controller.current || saving || aiUnavailable) return;
    const isFollowUp = typeof nextQuestion === 'string';
    const text = isFollowUp ? nextQuestion.trim() : '';
    if (isFollowUp && (!text || text.length > 2048 || followUps.length >= 5))
      return;
    if (!isAuthenticated) {
      login();
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError('');
    const timeout = setTimeout(() => abort.abort(), 195000);
    const apiPrompt = makePrompt(topic, question, true) + tuViEvidencePrompt(catalog);
    const basePrompt = isFollowUp ? conversation.prompt : apiPrompt;
    const messages = [{ role: 'user', content: basePrompt }];
    if (isFollowUp) {
      messages.push({
        role: 'assistant',
        content: conversation.initialInterpretation,
      });
      for (const item of followUps)
        messages.push(
          { role: 'user', content: item.question },
          { role: 'assistant', content: item.answer },
        );
      messages.push({ role: 'user', content: text + tuViEvidencePrompt(catalog) });
    }
    const activeModel = model || config.models?.[0] || 'combo1';
    try {
      const response = await requestAiChat({
        app: 'tuvi',
        model: activeModel,
        messages,
        stream: true,
        signal: abort.signal,
      });
      const content = await readOpenAiChatStream(response);
      const answer = parseTuViAnswer(content, catalog);
      if (!answer.sections.length && !answer.fallback.trim()) {
        throw new Error('Không nhận được nội dung luận giải từ AI. Vui lòng thử lại.');
      }
      if (abort.signal.aborted || !mounted.current) return;
      const updated = isFollowUp
        ? {
            ...conversation,
            followUps: [...followUps, { question: text, answer: content }],
          }
        : {
            prompt: apiPrompt,
            evidenceVersion: 1,
            topic,
            question,
            initialInterpretation: content,
            followUps: [],
          };
      setConversation(updated);
      setFollowUp('');
      await save(updated);
    } catch (err) {
      if (mounted.current && err.code === 'QUOTA_EXCEEDED') setShowSettings(true);
      if (mounted.current)
        setError(
          abort.signal.aborted
            ? 'Đã dừng chờ phản hồi. Lượt đã gửi vẫn có thể được tính theo quota SSO.'
            : err.message,
        );
    } finally {
      clearTimeout(timeout);
      controller.current = null;
      if (mounted.current) {
        setBusy(false);
        fetchQuota();
      }
    }
  }
  async function quotaAction(action) {
    setError('');
    const response = await action();
    if (mounted.current)
      setError(
        response.ok
          ? response.message || 'Đã cập nhật lượt sử dụng.'
          : response.error,
      );
  }

  function handleAutoResize(e) {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
  }

  return (
    <div className="tuvi-ai">
      <section
        className="tv-card tv-reading-card"
        aria-labelledby="tuvi-ai-title"
      >
        <header className="tv-card-header">
          <div className="tv-heading">
            <span className="tv-heading-icon">
              <Icon />
            </span>
            <div>
              <h3 id="tuvi-ai-title">{readingContext?.title || 'Luận giải Tử Vi bằng AI'}</h3>
              <p>Phân tích chuyên sâu, hỏi thêm theo vấn đề bạn quan tâm</p>
            </div>
          </div>
          <div className="tv-header-actions">
            <span className="tv-quota">
              ✧{' '}
              {isAuthenticated
                ? `${remaining} lượt còn lại`
                : 'Luận giải lá số'}
            </span>
            <button
              className="tv-icon-button"
              aria-label="Cấu hình AI"
              aria-expanded={showSettings}
              onClick={() => setShowSettings((value) => !value)}
            >
              <Icon name="settings" />
              <span>Cấu hình</span>
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="tv-settings">
            <div className="tv-settings-heading">
              <strong>Cấu hình luận giải</strong>
              <span>
                {isAuthenticated ? planLabel : 'Đăng nhập để sử dụng AI'}
              </span>
            </div>
            <label>
              Model AI
              <select
                value={model}
                disabled={busy}
                onChange={(e) => setModel(e.target.value)}
              >
                {config.models.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            {isAuthenticated && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    quotaAction(() => applyCoupon(coupon.trim()));
                  }}
                  className="tv-coupon"
                >
                  <input
                    aria-label="Mã ưu đãi"
                    placeholder="Nhập mã ưu đãi"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <button
                    className="tv-button tv-secondary"
                    disabled={!coupon.trim() || busy}
                  >
                    Áp dụng
                  </button>
                </form>
                {canBonus && (
                  <button
                    className="tv-text-button"
                    disabled={busy}
                    onClick={() => quotaAction(requestBonus)}
                  >
                    + Xin thêm lượt luận giải
                  </button>
                )}
                <p className="tv-caption">
                  Mỗi yêu cầu gửi đi sử dụng một lượt. Tự động kết nối lại không
                  tính thêm lượt.
                </p>
              </>
            )}
          </div>
        )}

        <div className="tv-reading-body">
          <div className="tv-context">
            <span className="tv-context-star">✦</span>
            <strong>{readingContext?.label || inputData?.name || 'Lá số của bạn'}</strong>
            {!readingContext && <>
            <span className="tv-context-dot">·</span>
            <span>{result.canChiNam}</span>
            <span className="tv-context-dot">·</span>
            <span>{result.cucName}</span>
            </>}
            {yunxianBadge && (
              <span className="tv-yunxian-context-badge" title="Ngữ cảnh vận hạn gửi kèm AI">
                🌐 Đang gửi kèm ngữ cảnh: {yunxianBadge}
              </span>
            )}
          </div>
          <div className="tv-topic-label">Bạn muốn tìm hiểu điều gì?</div>
          <div className="tv-topics" role="group" aria-label="Chủ đề luận giải">
            {Object.entries(TOPICS).map(([key, label]) => (
              <button
                key={key}
                className={`tv-topic ${topic === key ? 'is-selected' : ''}`}
                aria-pressed={topic === key}
                disabled={busy}
                onClick={() => setTopic(key)}
              >
                <span aria-hidden="true">
                  {{ overview: '✧', career: '◇', love: '♡', custom: '◌' }[key]}
                </span>
                {label}
              </button>
            ))}
          </div>
          <label className="tv-question-label" htmlFor="tuvi-question">
            Câu hỏi của bạn <span>Không bắt buộc</span>
          </label>
          <div className="tv-question-box">
            <textarea
              id="tuvi-question"
              value={question}
              maxLength={2048}
              rows={2}
              onChange={(e) => setQuestion(e.target.value)}
              onInput={handleAutoResize}
              disabled={busy}
              placeholder="Điều gì trong lá số khiến bạn muốn hiểu sâu hơn?"
            />
            <span className="tv-character-count">{question.length}/2048</span>
          </div>

          {busy ? (
            <div className="tv-waiting" role="status">
              <div className="tv-orbit">
                <span>✦</span>
                <i />
                <i />
              </div>
              <h4>Đang soi chiếu những vì sao</h4>
              <p>AI đang kết nối các cung và tổng hợp luận giải cho bạn.</p>
              <div className="tv-waiting-meta">
                <span>{elapsed}s · Đang phân tích lá số</span>
                <button
                  className="tv-text-button"
                  onClick={() => controller.current?.abort()}
                >
                  Dừng chờ
                </button>
              </div>
            </div>
          ) : (
            <div className="tv-main-action">
              {!isAuthenticated ? (
                <button className="tv-button tv-primary" onClick={login}>
                  <Icon />
                  Đăng nhập để luận giải
                  <Icon name="arrow" />
                </button>
              ) : (
                <button
                  className="tv-button tv-primary"
                  disabled={saving || busy || aiUnavailable}
                  onClick={() => ask()}
                >
                  <Icon />
                  {checkingConfig ? 'Đang kiểm tra dịch vụ…' : aiUnavailable ? 'AI tạm chưa sẵn sàng' : readingContext ? (conversation ? 'Luận giải lại hợp hôn' : 'Luận giải hợp hôn') : conversation ? 'Luận giải lại lá số' : 'Luận giải lá số'}
                  <Icon name="arrow" />
                </button>
              )}
              <p>
                {!isAuthenticated
                  ? 'Bạn vẫn có thể sao chép prompt miễn phí ở bên dưới.'
                  : readingContext ? 'Đối chiếu đầy đủ hai lá số và câu hỏi của bạn' : 'Luận giải chuyên sâu từ đầy đủ 12 cung trên lá số của bạn'}
              </p>
            </div>
          )}
          {!checkingConfig && aiUnavailable && (
            <div className="tv-notice tv-service-status" role="status">
              <strong>{configError ? 'Chưa kết nối được dịch vụ AI' : 'Dịch vụ AI chưa sẵn sàng'}</strong>
              <p>{configError || 'Bạn vẫn có thể lưu lá số hoặc sao chép prompt bên dưới để luận giải với AI khác.'}</p>
              <button type="button" className="tv-text-button" onClick={() => checkConfig()} disabled={checkingConfig}>Kiểm tra lại dịch vụ</button>
            </div>
          )}
          {error && (
            <div role="alert" className="tv-notice tv-error">
              <strong>Chưa hoàn tất yêu cầu</strong>
              <p>{error}</p>
            </div>
          )}
        </div>

        {conversation && (
          <div className="tv-result-section">
            <div className="tv-result-heading">
              <span>
                <Icon name="book" />
                Luận giải dành cho bạn
              </span>
              <button
                className="tv-text-button"
                onClick={() => copy(answerText)}
              >
                <Icon name="copy" size={15} />
                {copiedText === answerText
                  ? 'Đã sao chép!'
                  : 'Copy luận giải'}
              </button>
            </div>
            <article className="tv-prose">
              <TuViEvidenceAnswer parsedResponse={parsed} />
            </article>
            <div className="tv-chat-divider">
              <span />
              <h4>
                <Icon name="chat" size={16} />
                HỎI THÊM VỀ LÁ SỐ <b>{followUps.length}/5</b>
              </h4>
              <span />
            </div>
            <div className="tv-chat-history">
              {followUps.map((item, index) => (
                <div className="tv-chat-pair" key={index}>
                  <div className="tv-user-bubble">{item.question}</div>
                  <div className="tv-assistant-bubble">
                    <span className="tv-chat-avatar">✦</span>
                    <div className="tv-prose">
                      <TuViEvidenceAnswer text={item.answer} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {followUps.length < 5 ? (
              <>
                <div className="tv-suggestions">
                  {(followUps.length
                    ? parseTuViAnswer(followUps.at(-1).answer, catalog).questions
                    : parsed.questions
                  ).map((text) => (
                    <button
                      key={text}
                      disabled={busy || saving || aiUnavailable}
                      onClick={() => ask(text)}
                    >
                      {text}
                      <Icon name="arrow" size={14} />
                    </button>
                  ))}
                </div>
                <form
                  className="tv-chat-compose"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(followUp);
                  }}
                >
                  <textarea
                    aria-label="Câu hỏi tiếp theo"
                    value={followUp}
                    maxLength={2048}
                    rows={2}
                    disabled={busy}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onInput={handleAutoResize}
                    placeholder="Hỏi thêm để hiểu rõ hơn về lá số của bạn…"
                  />
                  <div>
                    <span>{followUp.length}/2048</span>
                    <button
                      className="tv-button tv-primary"
                      disabled={busy || saving || aiUnavailable || !followUp.trim()}
                    >
                      Gửi câu hỏi
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <p className="tv-caption">
                Bạn đã dùng đủ 5 câu hỏi thêm cho luận giải này.
              </p>
            )}
          </div>
        )}
        {isAuthenticated && (saving || saveMessage) && (
          <footer className="tv-card-footer">
            <span className="tv-save-status" role="status">
              {saving ? 'Đang tự lưu lá số và hội thoại…' : saveMessage}
            </span>
          </footer>
        )}
      </section>

      <section
        className="tv-card tv-export-card"
        aria-labelledby="tuvi-export-title"
      >
        <header className="tv-card-header">
          <div className="tv-heading">
            <span className="tv-heading-icon">
              <Icon name="copy" />
            </span>
            <div>
              <h3 id="tuvi-export-title">Xuất dữ liệu luận giải cho AI</h3>
              <p>{readingContext ? 'Mang hai lá số và kết quả đối chiếu đến trợ lý AI yêu thích' : 'Mang lá số của bạn đến trợ lý AI yêu thích'}</p>
            </div>
          </div>
          <span className="tv-free-badge">Miễn phí</span>
        </header>
        <div className="tv-export-body">
          <div
            className="tv-export-tabs"
            role="group"
            aria-label="Nội dung xuất"
          >
            <button
              aria-pressed={exportTab === 'prompt'}
              className={exportTab === 'prompt' ? 'is-selected' : ''}
              onClick={() => {
                setExportTab('prompt');
                setCopyMessage('');
              }}
            >
              <Icon size={16} />
              Prompt luận giải đầy đủ
            </button>
            <button
              aria-pressed={exportTab === 'data'}
              className={exportTab === 'data' ? 'is-selected' : ''}
              onClick={() => {
                setExportTab('data');
                setCopyMessage('');
              }}
            >
              <Icon name="book" size={16} />
              Dữ liệu lá số
            </button>
          </div>

          {!readingContext && (
            <div className="tv-yunxian-controls" aria-label="Bộ tùy chỉnh nhanh Vận Hạn xuất AI">
              <div className="tv-yunxian-mode-pills" role="group" aria-label="Chọn Chế độ Vận Hạn xuất AI">
                <button
                  type="button"
                  className={`tv-yunxian-pill ${effectiveYunxianState.mode === 'mingpan' ? 'is-active' : ''}`}
                  onClick={() => updateYunxian({ mode: 'mingpan' })}
                >
                  🏛️ Bản Mệnh
                </button>
                <button
                  type="button"
                  className={`tv-yunxian-pill ${effectiveYunxianState.mode === 'daxian' ? 'is-active' : ''}`}
                  onClick={() => updateYunxian({ mode: 'daxian' })}
                >
                  🪐 Đại Vận (10 Năm)
                </button>
                <button
                  type="button"
                  className={`tv-yunxian-pill ${effectiveYunxianState.mode === 'liunian' ? 'is-active' : ''}`}
                  onClick={() => updateYunxian({ mode: 'liunian' })}
                >
                  📅 Lưu Niên (Năm)
                </button>
                <button
                  type="button"
                  className={`tv-yunxian-pill ${effectiveYunxianState.mode === 'liuyue' ? 'is-active' : ''}`}
                  onClick={() => updateYunxian({ mode: 'liuyue', lunarMonth: effectiveYunxianState.lunarMonth || 1 })}
                >
                  🌙 Lưu Nguyệt (Tháng)
                </button>
              </div>

              <div className="tv-yunxian-select-row">
                <div className="tv-yunxian-field">
                  <label htmlFor="tv-ai-daxian-select">Chọn Đại Vận (10 năm):</label>
                  <select
                    id="tv-ai-daxian-select"
                    aria-label="Chọn Đại Vận xuất AI"
                    value={effectiveYunxianState.daXianChiIndex !== null && effectiveYunxianState.daXianChiIndex !== undefined ? effectiveYunxianState.daXianChiIndex : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        updateYunxian({ daXianChiIndex: null });
                      } else {
                        updateYunxian({
                          daXianChiIndex: Number(val),
                          ...(effectiveYunxianState.mode === 'mingpan' ? { mode: 'daxian' } : {}),
                        });
                      }
                    }}
                  >
                    <option value="">Tự động theo tuổi / năm xem</option>
                    {daXianOptions.map((dx) => (
                      <option key={dx.chiIndex} value={dx.chiIndex}>
                        {dx.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tv-yunxian-field tv-yunxian-year-field">
                  <label htmlFor="tv-ai-year-select">Chọn Năm Lưu Niên:</label>
                  <div className="tv-yunxian-year-stepper">
                    <button
                      type="button"
                      className="tv-step-btn"
                      aria-label="Năm trước"
                      title="Năm trước"
                      onClick={() => {
                        const prevY = (effectiveYunxianState.viewYear || new Date().getFullYear()) - 1;
                        if (prevY >= birthYear) {
                          updateYunxian({
                            viewYear: prevY,
                            ...((effectiveYunxianState.mode === 'mingpan' || effectiveYunxianState.mode === 'daxian') ? { mode: 'liunian' } : {}),
                          });
                        }
                      }}
                    >
                      ‹
                    </button>
                    <select
                      id="tv-ai-year-select"
                      aria-label="Chọn Năm Lưu Niên xuất AI"
                      value={effectiveYunxianState.viewYear || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateYunxian({
                          viewYear: val,
                          ...((effectiveYunxianState.mode === 'mingpan' || effectiveYunxianState.mode === 'daxian') ? { mode: 'liunian' } : {}),
                        });
                      }}
                    >
                      {yearOptions.map((yo) => (
                        <option key={yo.year} value={yo.year}>
                          {yo.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="tv-step-btn"
                      aria-label="Năm sau"
                      title="Năm sau"
                      onClick={() => {
                        const nextY = (effectiveYunxianState.viewYear || new Date().getFullYear()) + 1;
                        if (nextY <= maxYear) {
                          updateYunxian({
                            viewYear: nextY,
                            ...((effectiveYunxianState.mode === 'mingpan' || effectiveYunxianState.mode === 'daxian') ? { mode: 'liunian' } : {}),
                          });
                        }
                      }}
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className="tv-yunxian-field">
                  <label htmlFor="tv-ai-month-select">Chọn Tháng Lưu Nguyệt:</label>
                  <select
                    id="tv-ai-month-select"
                    aria-label="Chọn Tháng Lưu Nguyệt xuất AI"
                    value={effectiveYunxianState.lunarMonth || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        updateYunxian({ lunarMonth: null, mode: 'liunian' });
                      } else {
                        updateYunxian({ lunarMonth: Number(val), mode: 'liuyue' });
                      }
                    }}
                  >
                    <option value="">Cả năm (Không chọn tháng lẻ)</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m} Âm lịch
                      </option>
                    ))}
                  </select>
                </div>

                {exportTab === 'prompt' && (
                  <div className="tv-yunxian-field">
                    <label htmlFor="tv-ai-topic-select">Chọn Chủ Đề:</label>
                    <select
                      id="tv-ai-topic-select"
                      aria-label="Chọn Chủ Đề xuất AI"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      {Object.entries(TOPICS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="tv-export-options-row">
                <label htmlFor="tv-include-ziwei-engine" className="tv-export-checkbox-label">
                  <input
                    type="checkbox"
                    id="tv-include-ziwei-engine"
                    name="includeZiweiEngine"
                    checked={includeZiweiEngine}
                    onChange={(e) => setIncludeZiweiEngine(e.target.checked)}
                  />
                  <span>
                    Đính kèm kết quả phân tích từ Engine ZiWei mới (Đánh giá 1–5★ 6 phương diện, Cách cục, Phi Tinh Tứ Hóa, Cân lượng &amp; Luận giải nền v6)
                  </span>
                </label>

                {exportTab === 'prompt' && (
                  <fieldset className="tv-prompt-style-fieldset">
                    <legend>Kiểu cấu trúc Prompt (Tránh lan man 12 cung):</legend>
                    <div className="tv-prompt-style-options">
                      {Object.entries(PROMPT_STYLES).map(([styleKey, styleLabel]) => (
                        <label
                          key={styleKey}
                          htmlFor={`tv-prompt-style-${styleKey}`}
                          className={`tv-prompt-style-radio-label ${promptStyle === styleKey ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            id={`tv-prompt-style-${styleKey}`}
                            name="promptStyle"
                            value={styleKey}
                            checked={promptStyle === styleKey}
                            onChange={(e) => setPromptStyle(e.target.value)}
                          />
                          <span>{styleLabel}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>
            </div>
          )}
          <div className="tv-terminal">
            <div className="tv-terminal-header">
              <span className="tv-terminal-dots">
                <i />
                <i />
                <i />
              </span>
              <span>
                {exportTab === 'prompt'
                  ? 'tu-vi-prompt.txt'
                  : 'la-so-tu-vi.txt'}
              </span>
              <span>UTF-8</span>
            </div>
            <textarea
              aria-label="Prompt cho AI"
              readOnly
              value={exportText}
              spellCheck={false}
            />
          </div>
          <div className="tv-export-actions">
            <p>
              {readingContext ? 'Bao gồm đầy đủ hai lá số, cách chấm điểm và giới hạn của các quy tắc hiện có. Sao chép toàn bộ để AI giữ đúng ngữ cảnh hai người.' : exportTab === 'prompt'
                ? 'Gồm đủ 12 cung, quan hệ tam hợp/xung chiếu, Tứ Hóa và các hạn đã tính; kèm hướng dẫn luận giải theo chủ đề và câu hỏi đã chọn. Sao chép toàn bộ để dùng với AI khác.'
                : 'Dữ liệu đầy đủ từ lá số đang xem, gồm sao, trạng thái, Tuần/Triệt, Cân lượng và các hạn nếu có. Phần chưa có dữ liệu được ghi rõ.'}
            </p>
            <button
              className={`tv-button tv-primary ${exportCopied ? 'tv-copied' : ''}`}
              onClick={() => copy(exportText)}
            >
              <Icon name={exportCopied ? 'check' : 'copy'} />
              {exportCopied
                ? 'Đã sao chép!'
                : exportTab === 'prompt'
                  ? 'Copy prompt cho AI'
                  : 'Copy dữ liệu lá số'}
            </button>
          </div>
          {copyMessage && (exportCopied || !copiedText) && (
            <p className="tv-copy-feedback" role="status">
              {copyMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
