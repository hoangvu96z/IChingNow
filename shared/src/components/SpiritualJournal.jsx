import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readOpenAiChatStream } from '../utils/openAiSse.mjs';
import { requestAiChat } from '../utils/aiProxy.mjs';
import { getSsoApiBase, ssoFetch } from '../utils/ssoConfig.mjs';
import {
  buildReflectionReport,
  filterJournalEntries,
  JOURNAL_APP_LABELS,
  JOURNAL_TAG_LABELS,
  padJournalDateBounds,
} from '../utils/spiritualJournal.mjs';
import './SpiritualJournal.css';

const SSO_BASE = getSsoApiBase({
  DEV: import.meta.env.DEV,
  VITE_SSO_URL: import.meta.env.VITE_SSO_URL,
});
const TAGS = Object.keys(JOURNAL_TAG_LABELS);
const PAGE_SIZE = 100;
const MAX_AI_ENTRIES = 20;

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || `Yêu cầu thất bại (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function journalRequest(path, options = {}) {
  const response = await ssoFetch(`${SSO_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...(options.body && typeof options.body !== 'string'
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  return parseResponse(response);
}

function todayMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildReportYears(selectedValue) {
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(currentYear + 1, 2030);
  const years = [];
  for (let year = maxYear; year >= 2000; year -= 1) {
    years.push(String(year));
  }
  const normalizedSelected = String(selectedValue || '').trim();
  if (/^\d{4}$/.test(normalizedSelected) && !years.includes(normalizedSelected)) {
    years.unshift(normalizedSelected);
  }
  return years;
}

function formatViDate(value) {
  if (!value) return 'Chưa chọn ngày';
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return value;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatViMonth(value) {
  if (!value) return 'Chưa chọn tháng';
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return value;
  const date = new Date(parts[0], parts[1] - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = date.toLocaleDateString('vi-VN', {
    month: '2-digit',
    year: 'numeric',
  });
  return /^tháng\s/i.test(formatted)
    ? formatted.charAt(0).toUpperCase() + formatted.slice(1)
    : `Tháng ${formatted}`;
}

function openNativePicker(inputRef) {
  const element = inputRef?.current;
  if (!element) return;
  if (typeof element.showPicker === 'function') {
    try {
      element.showPicker();
      return;
    } catch {
      // Fallback to focus if showPicker is unsupported or disallowed by gesture context
    }
  }
  element.focus();
}

function appName(app) {
  return JOURNAL_APP_LABELS[app] || app || 'Ứng dụng';
}

function readingLabel(reading) {
  if (!reading) return 'Lần xem đã lưu';
  const date = new Date(reading.createdAt);
  const timestamp = Number.isNaN(date.getTime())
    ? 'Không rõ ngày'
    : date.toLocaleString('vi-VN');
  return `${appName(reading.app)} · ${reading.type || 'Lần xem'} · ${timestamp}`;
}

function journalPageUrl({ from, to, tag, app, offset, limit = PAGE_SIZE }) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const paddedDates = padJournalDateBounds(from, to);
  if (paddedDates.from) params.set('from', paddedDates.from);
  if (paddedDates.to) params.set('to', paddedDates.to);
  if (tag) params.set('tag', tag);
  if (app) params.set('app', app);
  return `/journal?${params.toString()}`;
}

function HelpToggleButton({ id, label, openHelpId, setOpenHelpId }) {
  const isOpen = openHelpId === id;
  return (
    <button
      type="button"
      className={`sj-help-btn ${isOpen ? 'is-active' : ''}`}
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls={`sj-help-panel-${id}`}
      onClick={() => setOpenHelpId((current) => (current === id ? null : id))}
    >
      ?
    </button>
  );
}

function HelpPanel({ id, title, openHelpId, setOpenHelpId, children }) {
  if (openHelpId !== id) return null;
  return (
    <div
      id={`sj-help-panel-${id}`}
      className="sj-help-popover"
      role="region"
      aria-label={title}
    >
      <div className="sj-help-popover-header">
        <strong>{title}</strong>
        <button
          type="button"
          className="sj-help-close"
          onClick={() => setOpenHelpId(null)}
          aria-label={`Đóng giải thích: ${title}`}
        >
          Đóng
        </button>
      </div>
      <p>{children}</p>
    </div>
  );
}

function CalendarField({
  id,
  label,
  type = 'date',
  value,
  onChange,
  onClear,
  ariaLabel,
}) {
  const inputRef = useRef(null);
  const formattedValue = type === 'month' ? formatViMonth(value) : formatViDate(value);

  return (
    <div className="sj-calendar-field">
      <div className="sj-calendar-label-row">
        <label htmlFor={id} className="sj-calendar-label">{label}</label>
        <span className={`sj-calendar-preview ${value ? 'has-value' : ''}`}>
          {formattedValue}
        </span>
      </div>
      <div className="sj-calendar-control">
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          aria-label={ariaLabel || label}
          className="sj-calendar-input"
        />
        <button
          type="button"
          className="sj-calendar-btn"
          onClick={() => openNativePicker(inputRef)}
          aria-label={`Mở lịch ${ (ariaLabel || label).toLowerCase() }`}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 19 6.5v10A2.5 2.5 0 0 1 16.5 19h-13A2.5 2.5 0 0 1 1 16.5v-10A2.5 2.5 0 0 1 3.5 4H5V3a1 1 0 0 1 1-1Zm10.5 6h-13v8.5a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V8ZM3.5 6a.5.5 0 0 0-.5.5V7h14v-.5a.5.5 0 0 0-.5-.5h-13Z"
            />
          </svg>
          <span>Chọn lịch</span>
        </button>
        {onClear && value && (
          <button
            type="button"
            className="sj-calendar-clear"
            onClick={onClear}
            aria-label={`Xóa ${label.toLowerCase()}`}
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
}

export default function SpiritualJournal({
  isOpen,
  onClose,
  isAuthenticated,
  userId,
  onLogin,
  currentApp = 'iching',
}) {
  const [activeTab, setActiveTab] = useState('write');
  const [openHelpId, setOpenHelpId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadedEntriesCount, setLoadedEntriesCount] = useState(0);
  const [availableReadings, setAvailableReadings] = useState([]);
  const [selectedReadingId, setSelectedReadingId] = useState('');
  const [reflection, setReflection] = useState('');
  const [tags, setTags] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeApp, setActiveApp] = useState('');
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportValue, setReportValue] = useState(todayMonth);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [entriesHaveMore, setEntriesHaveMore] = useState(false);
  const [readingsHaveMore, setReadingsHaveMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const refreshRequestId = useRef(0);

  const visibleEntries = useMemo(
    () => filterJournalEntries(entries, { query, from, to, tag: activeTag, app: activeApp }),
    [entries, query, from, to, activeTag, activeApp],
  );
  const unreflectedReadings = useMemo(
    () => availableReadings.filter((reading) => !reading.hasReflection),
    [availableReadings],
  );
  const reportYears = useMemo(
    () => buildReportYears(reportPeriod === 'year' ? reportValue : ''),
    [reportPeriod, reportValue],
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    const requestId = ++refreshRequestId.current;
    if (from && to && from > to) {
      setEntries([]);
      setLoadedEntriesCount(0);
      setEntriesHaveMore(false);
      setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [nextEntries, nextReadings] = await Promise.all([
        journalRequest(journalPageUrl({ from, to, tag: activeTag, app: activeApp, offset: 0 })),
        journalRequest(`/journal/readings?limit=${PAGE_SIZE}&offset=0`),
      ]);
      if (requestId !== refreshRequestId.current) return;
      const entriesPage = Array.isArray(nextEntries) ? nextEntries : [];
      const readingsPage = Array.isArray(nextReadings) ? nextReadings : [];
      setEntries(entriesPage);
      setAvailableReadings(readingsPage);
      setLoadedEntriesCount(entriesPage.length);
      setEntriesHaveMore(entriesPage.length === PAGE_SIZE);
      setReadingsHaveMore(readingsPage.length === PAGE_SIZE);
    } catch (requestError) {
      if (requestId === refreshRequestId.current) {
        setError(requestError.message || 'Không tải được nhật ký.');
      }
    } finally {
      if (requestId === refreshRequestId.current) setLoading(false);
    }
  }, [isAuthenticated, userId, from, to, activeTag, activeApp]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('write');
      setOpenHelpId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAuthenticated) refresh();
  }, [isOpen, isAuthenticated, refresh]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        if (openHelpId) {
          setOpenHelpId(null);
          return;
        }
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, openHelpId]);

  if (!isOpen) return null;

  const resetDraft = () => {
    setEditingEntry(null);
    setSelectedReadingId('');
    setReflection('');
    setTags([]);
    setStatus('');
    setError('');
    setActiveTab('write');
  };

  const editEntry = (entry) => {
    setEditingEntry(entry);
    setSelectedReadingId(entry.readingId);
    setReflection(entry.reflection || '');
    setTags(entry.tags || []);
    setStatus('');
    setError('');
    setActiveTab('write');
  };

  const toggleTag = (tag) => {
    setTags((current) => (current.includes(tag)
      ? current.filter((value) => value !== tag)
      : current.length < 5 ? [...current, tag] : current));
  };

  const changeServerFilter = (setter, value) => {
    refreshRequestId.current += 1;
    setEntries([]);
    setLoadedEntriesCount(0);
    setEntriesHaveMore(false);
    setError('');
    setter(value);
  };

  const loadMoreEntries = async () => {
    const requestId = refreshRequestId.current;
    setLoadingMore(true);
    setError('');
    try {
      const next = await journalRequest(journalPageUrl({
        from,
        to,
        tag: activeTag,
        app: activeApp,
        offset: loadedEntriesCount,
      }));
      if (requestId !== refreshRequestId.current) return;
      setEntries((current) => [...current, ...next]);
      setLoadedEntriesCount((current) => current + next.length);
      setEntriesHaveMore(next.length === PAGE_SIZE);
    } catch (requestError) {
      if (requestId === refreshRequestId.current) {
        setError(requestError.message || 'Không tải thêm được nhật ký.');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreReadings = async () => {
    setLoadingReadings(true);
    setError('');
    try {
      const next = await journalRequest(`/journal/readings?limit=${PAGE_SIZE}&offset=${availableReadings.length}`);
      setAvailableReadings((current) => [...current, ...next]);
      setReadingsHaveMore(next.length === PAGE_SIZE);
    } catch (requestError) {
      setError(requestError.message || 'Không tải thêm được danh sách lần xem.');
    } finally {
      setLoadingReadings(false);
    }
  };

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!reflection.trim()) {
      setError('Hãy ghi một chiêm nghiệm ngắn trước khi lưu.');
      return;
    }
    if (!editingEntry && !selectedReadingId) {
      setError('Hãy chọn một lần xem đã lưu để gắn nhật ký.');
      return;
    }
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const entry = await journalRequest(
        editingEntry ? `/journal/${encodeURIComponent(editingEntry.id)}` : '/journal',
        {
          method: editingEntry ? 'PATCH' : 'POST',
          body: editingEntry
            ? { reflection: reflection.trim(), tags }
            : { readingId: selectedReadingId, reflection: reflection.trim(), tags },
        },
      );
      await refresh();
      setStatus('Đã lưu nhật ký an toàn.');
      setEditingEntry(entry);
      setSelectedReadingId(entry.readingId);
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được nhật ký.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm('Xóa ghi chép nhật ký này?')) return;
    setError('');
    try {
      await journalRequest(`/journal/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
      await refresh();
      if (editingEntry?.id === entry.id) resetDraft();
      setStatus('Đã xóa ghi chép nhật ký.');
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được nhật ký.');
    }
  };

  const downloadReport = async () => {
    if (!reportValue) return;
    let fromDate;
    let toDate;
    if (reportPeriod === 'year') {
      fromDate = `${reportValue}-01-01`;
      toDate = `${reportValue}-12-31`;
    } else {
      const [year, month] = reportValue.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) return;
      const lastDay = new Date(year, month, 0).getDate();
      fromDate = `${reportValue}-01`;
      toDate = `${reportValue}-${String(lastDay).padStart(2, '0')}`;
    }
    ({ from: fromDate, to: toDate } = padJournalDateBounds(fromDate, toDate));
    setReportBusy(true);
    setError('');
    try {
      const allEntries = [];
      let offset = 0;
      let page;
      do {
        const params = new URLSearchParams({
          from: fromDate,
          to: toDate,
          limit: '500',
          offset: String(offset),
        });
        page = await journalRequest(`/journal?${params.toString()}`);
        allEntries.push(...page);
        offset += page.length;
        if (offset > 100000) throw new Error('Báo cáo vượt quá giới hạn xử lý.');
      } while (page.length === 500);

      const report = buildReflectionReport(allEntries, { period: reportPeriod, value: reportValue });
      const blob = new Blob([report.markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spiritual-journal-${reportValue}.md`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus(`Đã xuất ${report.count} ghi chép trong kỳ đã chọn.`);
    } catch (requestError) {
      setError(requestError.message || 'Không xuất được báo cáo.');
    } finally {
      setReportBusy(false);
    }
  };

  const runAiPatterns = async () => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    if (!aiConsent || visibleEntries.length === 0) return;
    setAnalyzing(true);
    setError('');
    setAiResult('');
    try {
      const config = await journalRequest('/plans/ai/config');
      if (!config.configured || !config.models?.length) {
        throw new Error('Dịch vụ AI chưa sẵn sàng.');
      }
      const selected = visibleEntries.slice(0, MAX_AI_ENTRIES).map((entry) => ({
        date: new Date(entry.createdAt).toISOString().slice(0, 10),
        app: appName(entry.reading?.app),
        readingType: entry.reading?.type,
        topics: (entry.tags || []).map((tag) => JOURNAL_TAG_LABELS[tag] || tag),
        reflection: entry.reflection,
      }));
      const response = await requestAiChat({
        app: currentApp,
        model: config.models[0],
        stream: true,
        max_tokens: 1800,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'Bạn hỗ trợ người dùng tự nhìn lại các chiêm nghiệm do họ viết. Chỉ nêu các chủ đề lặp lại có bằng chứng trong dữ liệu, trích ngày hoặc cụm từ ngắn để giải thích. Không dự đoán tương lai, chẩn đoán sức khỏe, đưa kết luận bói toán hoặc suy đoán danh tính. Nếu dữ liệu ít, nói rõ giới hạn.',
          },
          {
            role: 'user',
            content: `Phân tích xu hướng trong các reflection sau. Không có câu hỏi gốc của lần xem.\n${JSON.stringify(selected)}`,
          },
        ],
      });
      setAiResult(await readOpenAiChatStream(response));
    } catch (requestError) {
      setError(requestError.message || 'Chưa phân tích được xu hướng.');
    } finally {
      setAnalyzing(false);
    }
  };

  const hasActiveFilters = Boolean(query.trim() || from || to || activeTag || activeApp);

  const clearAllFilters = () => {
    refreshRequestId.current += 1;
    setQuery('');
    setFrom('');
    setTo('');
    setActiveTag('');
    setActiveApp('');
    setError('');
  };

  return (
    <div
      className="sj-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="sj-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sj-title"
        aria-describedby="sj-purpose-desc"
      >
        <header className="sj-header">
          <div className="sj-header-copy">
            <p className="sj-eyebrow">SpiritNow · Nhật ký chung cho Kinh Dịch, Tarot &amp; Tử Vi</p>
            <div className="sj-title-row">
              <h2 id="sj-title">Nhật ký chiêm nghiệm</h2>
              <HelpToggleButton
                id="purpose"
                label="Giải thích mục đích của Nhật ký chiêm nghiệm"
                openHelpId={openHelpId}
                setOpenHelpId={setOpenHelpId}
              />
            </div>
            <p id="sj-purpose-desc" className="sj-purpose-summary">
              Lưu lại suy nghĩ của bạn sau một lần xem đã lưu. Nhật ký giúp bạn nhìn lại cảm nhận theo thời gian.
            </p>
            <p className="sj-purpose-subnote">
              “Lần xem đã lưu” là kết quả gieo quẻ Kinh Dịch, trải bài Tarot hoặc lá số Tử Vi đã lưu trong ứng dụng. Nội dung nhật ký được mã hóa khi lưu và đồng bộ giữa 3 ứng dụng.
            </p>
            <HelpPanel
              id="purpose"
              title="Nhật ký chiêm nghiệm dùng để làm gì?"
              openHelpId={openHelpId}
              setOpenHelpId={setOpenHelpId}
            >
              Sau khi xem quẻ Kinh Dịch, trải bài Tarot hoặc lập lá số Tử Vi và lưu lại kết quả, bạn có thể viết vài dòng cảm nhận hoặc bài học rút ra tại đây. Ghi chép của bạn được mã hóa an toàn và dùng chung khi đăng nhập trên cả 3 ứng dụng.
            </HelpPanel>
          </div>
          <button
            type="button"
            className="sj-close"
            onClick={onClose}
            aria-label="Đóng nhật ký"
          >
            ×
          </button>
        </header>

        {!isAuthenticated ? (
          <div className="sj-login-state">
            <div className="sj-login-card">
              <h3>Đăng nhập để bắt đầu ghi nhật ký</h3>
              <p>
                Đăng nhập để lưu và đồng bộ nhật ký chiêm nghiệm của bạn giữa Kinh Dịch, Tarot và Tử Vi. Nội dung bạn viết được mã hóa riêng cho tài khoản của bạn.
              </p>
              <button type="button" className="sj-primary" onClick={onLogin}>
                Đăng nhập SSO
              </button>
            </div>
          </div>
        ) : (
          <div className="sj-body">
            <div className="sj-nav-bar">
              <div className="sj-tabs" role="tablist" aria-label="Chế độ xem nhật ký">
                <button
                  type="button"
                  role="tab"
                  id="sj-tab-write"
                  aria-selected={activeTab === 'write'}
                  aria-controls="sj-panel-write"
                  className={`sj-tab ${activeTab === 'write' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('write')}
                >
                  <span>Viết nhật ký</span>
                  {editingEntry && <span className="sj-tab-pill">Đang sửa</span>}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="sj-tab-saved"
                  aria-selected={activeTab === 'saved'}
                  aria-controls="sj-panel-saved"
                  className={`sj-tab ${activeTab === 'saved' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('saved')}
                >
                  <span>Đã lưu</span>
                  <span className="sj-tab-count">{entries.length}</span>
                </button>
              </div>
              <div className="sj-nav-actions">
                {(editingEntry || activeTab === 'saved' || reflection || selectedReadingId || tags.length > 0) && (
                  <button
                    type="button"
                    className="sj-secondary sj-new-btn"
                    onClick={resetDraft}
                  >
                    Viết mới
                  </button>
                )}
              </div>
            </div>

            {status && <p className="sj-status" role="status">{status}</p>}
            {error && <p className="sj-error" role="alert">{error}</p>}

            {/* SECTION 1: WRITING FLOW */}
            <div
              id="sj-panel-write"
              role="tabpanel"
              aria-labelledby="sj-tab-write"
              className="sj-tabpanel sj-write-layout"
              hidden={activeTab !== 'write'}
            >
              <form className="sj-card sj-editor" onSubmit={saveEntry}>
                <div className="sj-section-heading">
                  <div>
                    <h3>{editingEntry ? 'Sửa ghi chép đã lưu' : 'Viết nhật ký mới'}</h3>
                    <p className="sj-section-subtitle">
                      Chọn một lần xem đã lưu và ghi lại điều bạn muốn nhớ.
                    </p>
                  </div>
                  {editingEntry && (
                    <button type="button" className="sj-secondary" onClick={resetDraft}>
                      Viết mới
                    </button>
                  )}
                </div>

                <div className="sj-field">
                  <div className="sj-label-with-help">
                    <label htmlFor="sj-reading-select" className="sj-field-label">
                      Chọn lần xem
                    </label>
                    <HelpToggleButton
                      id="reading"
                      label="Giải thích về Chọn lần xem"
                      openHelpId={openHelpId}
                      setOpenHelpId={setOpenHelpId}
                    />
                  </div>
                  <HelpPanel
                    id="reading"
                    title="“Chọn lần xem” nghĩa là gì?"
                    openHelpId={openHelpId}
                    setOpenHelpId={setOpenHelpId}
                  >
                    Mỗi ghi chép được gắn với một lần xem đã lưu trong tài khoản của bạn (quẻ Kinh Dịch, trải bài Tarot hoặc lá số Tử Vi). Nhờ vậy, khi xem lại bạn luôn biết cảm nhận này gắn với lần xem nào và vào ngày nào.
                  </HelpPanel>

                  {editingEntry ? (
                    <div className="sj-reading-selected">
                      <span className="sj-reading-badge">Lần xem đang gắn:</span>
                      <strong>{readingLabel(editingEntry.reading)}</strong>
                    </div>
                  ) : (
                    <>
                      <select
                        id="sj-reading-select"
                        value={selectedReadingId}
                        onChange={(event) => setSelectedReadingId(event.target.value)}
                      >
                        <option value="">Chọn lần xem đã lưu trong ứng dụng…</option>
                        {unreflectedReadings.map((reading) => (
                          <option key={reading.id} value={reading.id}>
                            {readingLabel(reading)}
                          </option>
                        ))}
                      </select>
                      {!unreflectedReadings.length && (
                        <small className="sj-hint">
                          Chưa có lần xem mới để ghi nhật ký. Hãy lưu một lần xem trước hoặc mở mục “Đã lưu” để xem lại các ghi chép trước đó.
                        </small>
                      )}
                    </>
                  )}

                  {!editingEntry && readingsHaveMore && (
                    <button
                      type="button"
                      className="sj-text-button"
                      onClick={loadMoreReadings}
                      disabled={loadingReadings}
                    >
                      {loadingReadings ? 'Đang tải danh sách lần xem…' : 'Tải các lần xem cũ hơn'}
                    </button>
                  )}
                </div>

                <div className="sj-field">
                  <label htmlFor="sj-reflection-input" className="sj-field-label">
                    Điều bạn muốn ghi nhớ
                  </label>
                  <textarea
                    id="sj-reflection-input"
                    value={reflection}
                    maxLength={2000}
                    rows={6}
                    onChange={(event) => setReflection(event.target.value)}
                    placeholder="Ghi lại suy nghĩ, cảm nhận hoặc điều bạn muốn lưu tâm sau lần xem này…"
                  />
                  <small className="sj-hint">
                    {reflection.length}/2000 ký tự · Chỉ tài khoản của bạn mới đọc được nội dung này
                  </small>
                </div>

                <fieldset className="sj-tags">
                  <div className="sj-label-with-help">
                    <legend className="sj-field-label">Chủ đề (tùy chọn, tối đa 5)</legend>
                    <HelpToggleButton
                      id="tags"
                      label="Giải thích về Chủ đề tùy chọn"
                      openHelpId={openHelpId}
                      setOpenHelpId={setOpenHelpId}
                    />
                  </div>
                  <HelpPanel
                    id="tags"
                    title="Gắn chủ đề để làm gì?"
                    openHelpId={openHelpId}
                    setOpenHelpId={setOpenHelpId}
                  >
                    Bước này không bắt buộc. Bạn có thể chọn tối đa 5 chủ đề (như Sự nghiệp, Tình cảm, Gia đình…) để dễ lọc lại hoặc nhận diện mối quan tâm lặp lại theo thời gian.
                  </HelpPanel>
                  <div className="sj-tag-list">
                    {TAGS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className={`sj-tag-chip ${tags.includes(tag) ? 'is-selected' : ''}`}
                        aria-pressed={tags.includes(tag)}
                        onClick={() => toggleTag(tag)}
                      >
                        {JOURNAL_TAG_LABELS[tag]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="sj-actions">
                  <button
                    type="submit"
                    className="sj-primary"
                    disabled={saving || !isAuthenticated}
                  >
                    {saving ? 'Đang lưu…' : editingEntry ? 'Lưu thay đổi' : 'Lưu nhật ký'}
                  </button>
                  <button
                    type="button"
                    className="sj-secondary"
                    onClick={resetDraft}
                    disabled={saving}
                  >
                    Viết mới
                  </button>
                  <button
                    type="button"
                    className="sj-text-button sj-go-saved"
                    onClick={() => setActiveTab('saved')}
                  >
                    Xem nhật ký đã lưu ({entries.length}) →
                  </button>
                </div>
              </form>

              <aside className="sj-card sj-write-aside" aria-label="Tóm tắt nhật ký">
                <h4>Không gian riêng tư của bạn</h4>
                <ul className="sj-guide-list">
                  <li>
                    <strong>Đơn giản &amp; nhẹ nhàng:</strong> Chỉ cần chọn một lần xem đã lưu và viết vài dòng cảm nhận thực tế của bạn.
                  </li>
                  <li>
                    <strong>Mã hóa &amp; đồng bộ:</strong> Ghi chép được mã hóa khi lưu và tự động đồng bộ giữa Kinh Dịch, Tarot và Tử Vi.
                  </li>
                  <li>
                    <strong>Xem lại bất cứ lúc nào:</strong> Chuyển sang tab <em>Đã lưu</em> để tìm kiếm theo ngày, xuất báo cáo tháng/năm hoặc nhờ AI tổng hợp xu hướng khi bạn đồng ý.
                  </li>
                </ul>
                <div className="sj-aside-stats">
                  <div>
                    <span className="sj-stat-number">{entries.length}</span>
                    <span className="sj-stat-label">Ghi chép đã tải</span>
                  </div>
                  <div>
                    <span className="sj-stat-number">{unreflectedReadings.length}</span>
                    <span className="sj-stat-label">Lần xem chưa ghi</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="sj-secondary sj-full-btn"
                  onClick={() => setActiveTab('saved')}
                >
                  Mở mục Đã lưu ({entries.length})
                </button>
              </aside>
            </div>

            {/* SECTION 2: SAVED ENTRIES, FILTERS, REPORT & AI */}
            <div
              id="sj-panel-saved"
              role="tabpanel"
              aria-labelledby="sj-tab-saved"
              className="sj-tabpanel sj-saved-layout"
              hidden={activeTab !== 'saved'}
            >
              <div className="sj-card sj-library">
                <div className="sj-section-heading">
                  <div className="sj-label-with-help">
                    <h3>Nhật ký đã lưu</h3>
                    <HelpToggleButton
                      id="saved"
                      label="Giải thích về Nhật ký đã lưu và bộ lọc"
                      openHelpId={openHelpId}
                      setOpenHelpId={setOpenHelpId}
                    />
                  </div>
                  <div className="sj-heading-actions">
                    {hasActiveFilters && (
                      <button type="button" className="sj-text-button" onClick={clearAllFilters}>
                        Xóa lọc
                      </button>
                    )}
                    <button
                      type="button"
                      className="sj-text-button"
                      onClick={refresh}
                      disabled={loading}
                    >
                      {loading ? 'Đang tải…' : 'Làm mới'}
                    </button>
                  </div>
                </div>

                <HelpPanel
                  id="saved"
                  title="Tìm kiếm & lọc nhật ký đã lưu"
                  openHelpId={openHelpId}
                  setOpenHelpId={setOpenHelpId}
                >
                  Bạn có thể bấm “Chọn lịch” ở ô Từ ngày / Đến ngày để mở lịch chọn khoảng thời gian, lọc theo chủ đề, ứng dụng hoặc tìm theo từ khóa trong nội dung đã viết. Bấm “Sửa” ở bất kỳ mục nào để mở lại phần viết nhật ký.
                </HelpPanel>

                <div className="sj-filters">
                  <CalendarField
                    id="sj-filter-from"
                    label="Từ ngày"
                    type="date"
                    value={from}
                    onChange={(event) => changeServerFilter(setFrom, event.target.value)}
                    onClear={() => changeServerFilter(setFrom, '')}
                  />
                  <CalendarField
                    id="sj-filter-to"
                    label="Đến ngày"
                    type="date"
                    value={to}
                    onChange={(event) => changeServerFilter(setTo, event.target.value)}
                    onClear={() => changeServerFilter(setTo, '')}
                  />
                  <label className="sj-filter-field">
                    <span>Chủ đề</span>
                    <select
                      value={activeTag}
                      onChange={(event) => changeServerFilter(setActiveTag, event.target.value)}
                    >
                      <option value="">Tất cả chủ đề</option>
                      {TAGS.map((tag) => (
                        <option key={tag} value={tag}>
                          {JOURNAL_TAG_LABELS[tag]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sj-filter-field">
                    <span>Ứng dụng</span>
                    <select
                      value={activeApp}
                      onChange={(event) => changeServerFilter(setActiveApp, event.target.value)}
                    >
                      <option value="">Cả 3 ứng dụng</option>
                      {Object.entries(JOURNAL_APP_LABELS).map(([app, label]) => (
                        <option key={app} value={app}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sj-filter-field sj-search">
                    <span>Tìm trong nhật ký</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Nhập từ khóa cần tìm…"
                    />
                  </label>
                </div>

                {!!query.trim() && (
                  <p className="sj-caption">
                    Từ khóa tìm trong {loadedEntriesCount} ghi chép đã tải; dùng “Tải ghi chép cũ hơn” để mở rộng kết quả.
                  </p>
                )}

                <div className="sj-entry-list" aria-live="polite">
                  {visibleEntries.map((entry) => (
                    <article
                      className={`sj-entry ${editingEntry?.id === entry.id ? 'is-editing' : ''}`}
                      key={entry.id}
                    >
                      <div className="sj-entry-meta">
                        <strong>
                          {appName(entry.reading?.app)} · {entry.reading?.type || 'Lần xem'}
                        </strong>
                        <time dateTime={entry.createdAt}>
                          {new Date(entry.createdAt).toLocaleDateString('vi-VN')}
                        </time>
                      </div>
                      {!!entry.tags?.length && (
                        <div className="sj-entry-tags">
                          {entry.tags.map((tag) => JOURNAL_TAG_LABELS[tag] || tag).join(' · ')}
                        </div>
                      )}
                      <p>{entry.reflection}</p>
                      <div className="sj-entry-actions">
                        <button type="button" onClick={() => editEntry(entry)}>
                          Sửa
                        </button>
                        <button type="button" onClick={() => deleteEntry(entry)}>
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                  {!loading && !visibleEntries.length && (
                    <div className="sj-empty">
                      <p>Chưa có ghi chép nào phù hợp bộ lọc hiện tại.</p>
                      <button type="button" className="sj-secondary" onClick={() => setActiveTab('write')}>
                        Viết nhật ký mới
                      </button>
                    </div>
                  )}
                  {entriesHaveMore && (
                    <button
                      type="button"
                      className="sj-secondary sj-full-btn"
                      onClick={loadMoreEntries}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Đang tải thêm…' : 'Tải ghi chép cũ hơn'}
                    </button>
                  )}
                </div>
              </div>

              <div className="sj-saved-tools">
                <section className="sj-card sj-report">
                  <div className="sj-label-with-help">
                    <h3>Báo cáo chiêm nghiệm</h3>
                    <HelpToggleButton
                      id="report"
                      label="Giải thích về Báo cáo chiêm nghiệm"
                      openHelpId={openHelpId}
                      setOpenHelpId={setOpenHelpId}
                    />
                  </div>
                  <HelpPanel
                    id="report"
                    title="Xuất báo cáo chiêm nghiệm là gì?"
                    openHelpId={openHelpId}
                    setOpenHelpId={setOpenHelpId}
                  >
                    Tạo tệp tổng hợp (.md) gồm các ghi chép nhật ký và thống kê chủ đề trong tháng hoặc năm bạn chọn ngay trên thiết bị này. Tệp xuất ra không chứa câu hỏi gốc của lần xem.
                  </HelpPanel>
                  <p className="sj-caption">
                    Chọn kỳ báo cáo theo tháng hoặc năm để tải tệp Markdown về thiết bị của bạn.
                  </p>

                  <div className="sj-report-controls">
                    <label className="sj-filter-field">
                      <span>Kỳ báo cáo</span>
                      <select
                        value={reportPeriod}
                        onChange={(event) => {
                          const next = event.target.value;
                          setReportPeriod(next);
                          setReportValue(
                            next === 'month' ? todayMonth() : String(new Date().getFullYear()),
                          );
                        }}
                        aria-label="Loại báo cáo"
                      >
                        <option value="month">Theo tháng</option>
                        <option value="year">Theo năm</option>
                      </select>
                    </label>

                    {reportPeriod === 'month' ? (
                      <CalendarField
                        id="sj-report-month"
                        label="Chọn tháng"
                        type="month"
                        value={reportValue}
                        onChange={(event) => setReportValue(event.target.value)}
                        ariaLabel="Tháng báo cáo"
                      />
                    ) : (
                      <label className="sj-filter-field">
                        <span>Chọn năm</span>
                        <select
                          value={reportValue}
                          onChange={(event) => setReportValue(event.target.value)}
                          aria-label="Năm báo cáo"
                        >
                          {reportYears.map((year) => (
                            <option key={year} value={year}>
                              Năm {year}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <button
                      type="button"
                      className="sj-secondary sj-export-btn"
                      onClick={downloadReport}
                      disabled={!reportValue || reportBusy}
                    >
                      {reportBusy ? 'Đang tạo báo cáo…' : 'Xuất Markdown'}
                    </button>
                  </div>
                </section>

                <section className="sj-card sj-ai-section">
                  <div className="sj-label-with-help">
                    <h3>Nhìn lại xu hướng bằng AI (tùy chọn)</h3>
                    <HelpToggleButton
                      id="ai"
                      label="Giải thích về Phân tích xu hướng bằng AI"
                      openHelpId={openHelpId}
                      setOpenHelpId={setOpenHelpId}
                    />
                  </div>
                  <HelpPanel
                    id="ai"
                    title="Dữ liệu nào được gửi cho AI?"
                    openHelpId={openHelpId}
                    setOpenHelpId={setOpenHelpId}
                  >
                    Tính năng này chỉ chạy khi bạn chủ động đánh dấu đồng ý và bấm nút phân tích. Hệ thống chỉ gửi tối đa {MAX_AI_ENTRIES} ghi chép mới nhất đang lọc (gồm ngày viết, tên ứng dụng, loại lần xem, chủ đề và nội dung nhật ký). Tuyệt đối không gửi câu hỏi gốc của lần xem.
                  </HelpPanel>

                  <label className="sj-consent">
                    <input
                      type="checkbox"
                      checked={aiConsent}
                      onChange={(event) => setAiConsent(event.target.checked)}
                    />
                    <span>
                      Cho phép gửi tối đa {MAX_AI_ENTRIES} ghi chép mới nhất trong kết quả đang lọc tới dịch vụ AI, gồm ngày, ứng dụng, loại lần xem, chủ đề và nội dung nhật ký. Không gửi câu hỏi gốc; thao tác này dùng quota AI của {appName(currentApp)}.
                    </span>
                  </label>

                  <button
                    type="button"
                    className="sj-secondary sj-full-btn"
                    onClick={runAiPatterns}
                    disabled={!aiConsent || !visibleEntries.length || analyzing}
                  >
                    {analyzing
                      ? 'Đang phân tích…'
                      : `Phân tích xu hướng bằng AI (${visibleEntries.length})`}
                  </button>

                  {visibleEntries.length > MAX_AI_ENTRIES && (
                    <p className="sj-caption">
                      AI chỉ nhận {MAX_AI_ENTRIES} ghi chép mới nhất trong kết quả đang lọc.
                    </p>
                  )}

                  {aiResult && (
                    <div className="sj-ai-result">
                      <strong>Gợi ý để tự suy ngẫm · không phải dự đoán</strong>
                      <p>{aiResult}</p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
