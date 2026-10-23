import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readOpenAiChatStream } from '../utils/openAiSse.mjs';
import { requestAiChat } from '../utils/aiProxy.mjs';
import { getSsoApiBase } from '../utils/ssoConfig.mjs';
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
  const response = await fetch(`${SSO_BASE}${path}`, {
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

function appName(app) {
  return JOURNAL_APP_LABELS[app] || app || 'Ứng dụng';
}

function readingLabel(reading) {
  const date = new Date(reading.createdAt);
  const timestamp = Number.isNaN(date.getTime())
    ? 'Không rõ ngày'
    : date.toLocaleString('vi-VN');
  return `${appName(reading.app)} · ${reading.type || 'Reading'} · ${timestamp}`;
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

export default function SpiritualJournal({
  isOpen,
  onClose,
  isAuthenticated,
  userId,
  onLogin,
  currentApp = 'iching',
}) {
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
    if (isOpen && isAuthenticated) refresh();
  }, [isOpen, isAuthenticated, refresh]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetDraft = () => {
    setEditingEntry(null);
    setSelectedReadingId('');
    setReflection('');
    setTags([]);
    setStatus('');
  };

  const editEntry = (entry) => {
    setEditingEntry(entry);
    setSelectedReadingId(entry.readingId);
    setReflection(entry.reflection || '');
    setTags(entry.tags || []);
    setStatus('');
    setError('');
  };

  const toggleTag = (tag) => {
    setTags((current) => current.includes(tag)
      ? current.filter((value) => value !== tag)
      : current.length < 5 ? [...current, tag] : current);
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
        setError(requestError.message || 'Không tải thêm được reflection.');
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
      setError(requestError.message || 'Không tải thêm được reading.');
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
      setError('Chọn reading cần gắn reflection.');
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
      setStatus('Đã lưu reflection an toàn.');
      setEditingEntry(entry);
      setSelectedReadingId(entry.readingId);
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được reflection.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm('Xóa reflection này?')) return;
    setError('');
    try {
      await journalRequest(`/journal/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
      await refresh();
      if (editingEntry?.id === entry.id) resetDraft();
      setStatus('Đã xóa reflection.');
    } catch (requestError) {
      setError(requestError.message || 'Không xóa được reflection.');
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
      setStatus(`Đã xuất ${report.count} reflection trong kỳ đã chọn.`);
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

  return (
    <div className="sj-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <section className="sj-dialog" role="dialog" aria-modal="true" aria-labelledby="sj-title">
        <header className="sj-header">
          <div>
            <p className="sj-eyebrow">SpiritNow · dùng chung 3 ứng dụng</p>
            <h2 id="sj-title">Nhật ký chiêm nghiệm</h2>
            <p>Ghi lại điều bạn nhận ra sau mỗi lần xem. Reflection được mã hóa khi lưu.</p>
          </div>
          <button type="button" className="sj-close" onClick={onClose} aria-label="Đóng nhật ký">×</button>
        </header>

        {!isAuthenticated ? (
          <div className="sj-login-state">
            <p>Đăng nhập để lưu và đồng bộ reflection giữa Kinh Dịch, Tarot và Tử Vi.</p>
            <button type="button" className="sj-primary" onClick={onLogin}>Đăng nhập SSO</button>
          </div>
        ) : (
          <div className="sj-content">
            <div className="sj-column sj-editor">
              <h3>{editingEntry ? 'Sửa reflection' : 'Viết reflection'}</h3>
              {editingEntry ? (
                <div className="sj-reading-selected">{readingLabel(editingEntry.reading)}</div>
              ) : (
                <label className="sj-field">
                  <span>Reading đã lưu</span>
                  <select value={selectedReadingId} onChange={(event) => setSelectedReadingId(event.target.value)}>
                    <option value="">Chọn reading trong hệ thống…</option>
                    {unreflectedReadings.map((reading) => (
                      <option key={reading.id} value={reading.id}>{readingLabel(reading)}</option>
                    ))}
                  </select>
                  {!unreflectedReadings.length && <small>Không có reading mới để ghi reflection.</small>}
                </label>
              )}
              {!editingEntry && readingsHaveMore && (
                <button type="button" className="sj-text-button" onClick={loadMoreReadings} disabled={loadingReadings}>
                  {loadingReadings ? 'Đang tải reading…' : 'Tải reading cũ hơn'}
                </button>
              )}
              <label className="sj-field">
                <span>Điều bạn nhận ra</span>
                <textarea
                  value={reflection}
                  maxLength={2000}
                  rows={6}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="Ghi lại suy nghĩ của bạn sau lần xem…"
                />
                <small>{reflection.length}/2000 ký tự · chỉ tài khoản của bạn xem được</small>
              </label>
              <fieldset className="sj-tags">
                <legend>Chủ đề (tối đa 5)</legend>
                <div>
                  {TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={tags.includes(tag) ? 'is-selected' : ''}
                      aria-pressed={tags.includes(tag)}
                      onClick={() => toggleTag(tag)}
                    >{JOURNAL_TAG_LABELS[tag]}</button>
                  ))}
                </div>
              </fieldset>
              <div className="sj-actions">
                <button type="button" className="sj-primary" onClick={saveEntry} disabled={saving || !isAuthenticated}>
                  {saving ? 'Đang lưu…' : editingEntry ? 'Lưu thay đổi' : 'Lưu reflection'}
                </button>
                {editingEntry && <button type="button" className="sj-secondary" onClick={resetDraft}>Viết mới</button>}
              </div>
              {status && <p className="sj-status" role="status">{status}</p>}
              {error && <p className="sj-error" role="alert">{error}</p>}
            </div>

            <div className="sj-column sj-library">
              <div className="sj-section-heading">
                <h3>Reflection đã lưu</h3>
                <button type="button" className="sj-text-button" onClick={refresh} disabled={loading}>
                  {loading ? 'Đang tải…' : 'Làm mới'}
                </button>
              </div>
              <div className="sj-filters">
                <label><span>Từ</span><input type="date" value={from} onChange={(e) => changeServerFilter(setFrom, e.target.value)} /></label>
                <label><span>Đến</span><input type="date" value={to} onChange={(e) => changeServerFilter(setTo, e.target.value)} /></label>
                <label><span>Chủ đề</span><select value={activeTag} onChange={(e) => changeServerFilter(setActiveTag, e.target.value)}>
                  <option value="">Tất cả</option>
                  {TAGS.map((tag) => <option key={tag} value={tag}>{JOURNAL_TAG_LABELS[tag]}</option>)}
                </select></label>
                <label><span>Ứng dụng</span><select value={activeApp} onChange={(e) => changeServerFilter(setActiveApp, e.target.value)}>
                  <option value="">Cả 3 ứng dụng</option>
                  {Object.entries(JOURNAL_APP_LABELS).map(([app, label]) => <option key={app} value={app}>{label}</option>)}
                </select></label>
                <label className="sj-search"><span>Tìm trong reflection</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm từ khóa…" /></label>
              </div>
              {!!query.trim() && <p className="sj-caption">Từ khóa tìm trong {loadedEntriesCount} reflection đã tải; dùng “Tải reflection cũ hơn” để mở rộng kết quả.</p>}
              <div className="sj-entry-list" aria-live="polite">
                {visibleEntries.map((entry) => (
                  <article className={`sj-entry ${editingEntry?.id === entry.id ? 'is-editing' : ''}`} key={entry.id}>
                    <div className="sj-entry-meta">
                      <strong>{appName(entry.reading?.app)} · {entry.reading?.type || 'Reading'}</strong>
                      <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString('vi-VN')}</time>
                    </div>
                    {!!entry.tags?.length && <div className="sj-entry-tags">{entry.tags.map((tag) => JOURNAL_TAG_LABELS[tag] || tag).join(' · ')}</div>}
                    <p>{entry.reflection}</p>
                    <div className="sj-entry-actions">
                      <button type="button" onClick={() => editEntry(entry)}>Sửa</button>
                      <button type="button" onClick={() => deleteEntry(entry)}>Xóa</button>
                    </div>
                  </article>
                ))}
                {!loading && !visibleEntries.length && <p className="sj-empty">Chưa có reflection phù hợp bộ lọc.</p>}
                {entriesHaveMore && <button type="button" className="sj-secondary" onClick={loadMoreEntries} disabled={loadingMore}>
                  {loadingMore ? 'Đang tải thêm…' : 'Tải reflection cũ hơn'}
                </button>}
              </div>

              <section className="sj-report">
                <h3>Báo cáo chiêm nghiệm</h3>
                <div className="sj-report-controls">
                  <select value={reportPeriod} onChange={(event) => {
                    const next = event.target.value;
                    setReportPeriod(next);
                    setReportValue(next === 'month' ? todayMonth() : String(new Date().getFullYear()));
                  }} aria-label="Loại báo cáo">
                    <option value="month">Theo tháng</option>
                    <option value="year">Theo năm</option>
                  </select>
                  {reportPeriod === 'month'
                    ? <input type="month" value={reportValue} onChange={(event) => setReportValue(event.target.value)} aria-label="Tháng báo cáo" />
                    : <input type="number" min="2000" max="2100" value={reportValue} onChange={(event) => setReportValue(event.target.value)} aria-label="Năm báo cáo" />}
                  <button type="button" className="sj-secondary" onClick={downloadReport} disabled={!reportValue || reportBusy}>
                    {reportBusy ? 'Đang tạo báo cáo…' : 'Xuất Markdown'}
                  </button>
                </div>
                <p className="sj-caption">Báo cáo tải đủ các trang của tháng/năm đã chọn và được tạo trên thiết bị này.</p>
                <label className="sj-consent">
                  <input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} />
                  <span>Cho phép gửi tối đa {MAX_AI_ENTRIES} reflection mới nhất trong kết quả đang lọc tới dịch vụ AI, gồm ngày, ứng dụng, loại reading, chủ đề và nội dung reflection. Không gửi câu hỏi gốc; thao tác này dùng quota AI của {appName(currentApp)}.</span>
                </label>
                <button type="button" className="sj-secondary" onClick={runAiPatterns} disabled={!aiConsent || !visibleEntries.length || analyzing}>
                  {analyzing ? 'Đang phân tích…' : `Phân tích xu hướng bằng AI (${visibleEntries.length})`}
                </button>
                {visibleEntries.length > MAX_AI_ENTRIES && <p className="sj-caption">AI chỉ nhận {MAX_AI_ENTRIES} reflection mới nhất trong kết quả đang lọc.</p>}
                {aiResult && <div className="sj-ai-result"><strong>Gợi ý để tự suy ngẫm · không phải dự đoán</strong><p>{aiResult}</p></div>}
              </section>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
