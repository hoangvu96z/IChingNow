import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TalkWithMePage.css';

const SSO_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_SSO_URL || 'https://sso.vunph.click').replace(/\/$/, '');

const SESSION_KEY = 'talkwithme_session';
const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024; // 1.5MB raw
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function getOrCreateSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id && parsed.name) return parsed;
    }
  } catch {}
  return null;
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

function generateSessionId() {
  return 'twm_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getClientMetadata() {
  try {
    const screenWidth = window.screen?.width || 0;
    const screenHeight = window.screen?.height || 0;
    const dpr = window.devicePixelRatio || 1;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const language = navigator.language || navigator.userLanguage || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

    return {
      screen: `${screenWidth}x${screenHeight} (DPR ${dpr})`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone,
      language,
      isMobile,
    };
  } catch {
    return null;
  }
}

async function sendMessage({ sessionId, name, email, title, message, imageData, imageMime }) {
  const clientMeta = getClientMetadata();
  const res = await fetch(`${SSO_BASE}/contact/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      name,
      email,
      title,
      message,
      imageData,
      imageMime,
      clientMeta,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi ${res.status}`);
  }
  return res.json();
}

async function loadSessionMessages(sessionId) {
  const res = await fetch(`${SSO_BASE}/contact/session/${sessionId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function TalkWithMePage() {
  const [session, setSession] = useState(getOrCreateSession);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState(session?.name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const textareaRef = useRef(null);

  const hasSession = !!session?.id;

  // Load previous messages on mount
  useEffect(() => {
    if (session?.id) {
      setLoading(true);
      loadSessionMessages(session.id)
        .then(msgs => setMessages(msgs))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) { setImageFile(null); setImagePreview(null); return; }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Ảnh quá lớn. Tối đa 1.5MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) { setError('Vui lòng nhập tên.'); return; }
    if (!message.trim()) { setError('Vui lòng nhập nội dung tin nhắn.'); return; }

    setSending(true);

    try {
      let sid = session?.id;
      if (!sid) {
        sid = generateSessionId();
      }

      let imageData, imageMime;
      if (imageFile) {
        imageData = await fileToBase64(imageFile);
        imageMime = imageFile.type;
      }

      const result = await sendMessage({
        sessionId: sid,
        name: name.trim(),
        email: email.trim() || undefined,
        title: title.trim() || undefined,
        message: message.trim(),
        imageData,
        imageMime,
      });

      // Save session
      const newSession = { id: sid, name: name.trim(), email: email.trim() || '' };
      setSession(newSession);
      saveSession(newSession);

      // Add to messages list
      setMessages(prev => [...prev, result.message]);

      // Reset form fields (keep name & email)
      setTitle('');
      setMessage('');
      removeImage();
      setSuccess('Tin nhắn đã gửi thành công! 🎉');
      setTimeout(() => setSuccess(''), 5000);

      // Focus back to textarea
      textareaRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Không gửi được tin nhắn. Thử lại sau.');
    } finally {
      setSending(false);
    }
  };

  const handleNewSession = () => {
    clearSession();
    setSession(null);
    setMessages([]);
    setName('');
    setEmail('');
    setTitle('');
    setMessage('');
    removeImage();
    setError('');
    setSuccess('');
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  return (
    <div className="twm">
      {/* Hero */}
      <header className="twm-hero">
        <div className="twm-hero-glow" />
        <div className="twm-hero-badge">
          <span className="twm-hero-badge-dot" />
          Online
        </div>
        <h1>Gửi tin nhắn cho tôi</h1>
        <p>Không cần đăng nhập — tin nhắn sẽ gửi trực tiếp đến hộp thư của tôi.</p>
      </header>

      <div className="twm-layout">
        {/* Previous Messages */}
        {hasSession && messages.length > 0 && (
          <section className="twm-messages" aria-label="Tin nhắn đã gửi">
            <div className="twm-messages-header">
              <h2>
                <span className="twm-messages-count">{messages.length}</span>
                Tin nhắn đã gửi
              </h2>
              <button type="button" className="twm-btn-ghost" onClick={handleNewSession}>
                Session mới
              </button>
            </div>
            <div className="twm-messages-list" ref={messageListRef}>
              {messages.map((msg, i) => (
                <article className="twm-msg" key={msg.id || i}>
                  <div className="twm-msg-meta">
                    <strong>{msg.name}</strong>
                    <time dateTime={msg.createdAt}>{formatTime(msg.createdAt)}</time>
                  </div>
                  {msg.title && <h3 className="twm-msg-title">{msg.title}</h3>}
                  <p className="twm-msg-body">{msg.message}</p>
                  {msg.hasImage && (
                    <div className="twm-msg-attachment">
                      <span>📷</span> Có ảnh đính kèm
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Send Form */}
        <section className="twm-form-card" aria-label="Gửi tin nhắn">
          <div className="twm-form-header">
            <h2>✉️ Viết tin nhắn</h2>
            {hasSession && (
              <div className="twm-session-badge">
                <span className="twm-session-dot" />
                {session.name}
              </div>
            )}
          </div>

          <form className="twm-form" onSubmit={handleSubmit}>
            {/* Name & Email row */}
            <div className="twm-row-2">
              <label className="twm-field">
                <span className="twm-label">
                  Tên của bạn <span className="twm-req">*</span>
                </span>
                <div className="twm-input-wrap">
                  <span className="twm-input-icon">👤</span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nhập tên..."
                    maxLength={100}
                    required
                    disabled={hasSession}
                    autoComplete="name"
                  />
                </div>
              </label>
              <label className="twm-field">
                <span className="twm-label">
                  Email <span className="twm-opt">(tuỳ chọn)</span>
                </span>
                <div className="twm-input-wrap">
                  <span className="twm-input-icon">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    maxLength={200}
                    disabled={hasSession}
                    autoComplete="email"
                  />
                </div>
              </label>
            </div>

            {/* Title */}
            <label className="twm-field">
              <span className="twm-label">
                Tiêu đề <span className="twm-opt">(tuỳ chọn)</span>
              </span>
              <div className="twm-input-wrap">
                <span className="twm-input-icon">📌</span>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề tin nhắn..."
                  maxLength={300}
                />
              </div>
            </label>

            {/* Message */}
            <label className="twm-field">
              <span className="twm-label">
                Nội dung <span className="twm-req">*</span>
              </span>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Viết gì đó cho tôi..."
                rows={5}
                maxLength={5000}
                required
              />
              <div className="twm-textarea-footer">
                <span className="twm-char-count">
                  {message.length} <span>/ 5000</span>
                </span>
              </div>
            </label>

            {/* Image Upload */}
            <div className="twm-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="twm-file-hidden"
                id="twm-file-input"
              />
              {!imagePreview ? (
                <label htmlFor="twm-file-input" className="twm-upload-dropzone">
                  <span className="twm-upload-icon">🖼️</span>
                  <span>Đính kèm ảnh</span>
                  <small>JPG, PNG, GIF, WebP · Tối đa 1.5MB</small>
                </label>
              ) : (
                <div className="twm-preview">
                  <img src={imagePreview} alt="Xem trước ảnh" />
                  <button type="button" className="twm-preview-x" onClick={removeImage} aria-label="Xoá ảnh">✕</button>
                  <span className="twm-preview-name">{imageFile?.name}</span>
                </div>
              )}
            </div>

            {/* Status */}
            {error && <div className="twm-alert twm-alert-error" role="alert"><span>⚠️</span> {error}</div>}
            {success && <div className="twm-alert twm-alert-success" role="status"><span>✅</span> {success}</div>}

            {/* Submit */}
            <button type="submit" className="twm-submit" disabled={sending}>
              {sending ? (
                <><span className="twm-spinner-inline" /> Đang gửi...</>
              ) : (
                <>🚀 Gửi tin nhắn</>
              )}
            </button>
          </form>

          {hasSession && (
            <div className="twm-session-info">
              📌 Phiên: <code>{session.id.substring(0, 12)}…</code>
              {session.email && <> · {session.email}</>}
              <button type="button" className="twm-btn-ghost twm-btn-sm" onClick={handleNewSession}>
                Xoá session
              </button>
            </div>
          )}
        </section>
      </div>

      {loading && (
        <div className="twm-loading-overlay">
          <div className="twm-spinner-lg" />
          <span>Đang tải tin nhắn cũ...</span>
        </div>
      )}
    </div>
  );
}
