import React, { useState, useEffect, useCallback, useRef } from 'react';
import NoteCard from './NoteCard.jsx';
import NoteEditor from './NoteEditor.jsx';
import NoteShareModal from './NoteShareModal.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { notesApi, stripHtml } from '../api.js';

function Toast({ toasts }) {
  return (
    <div className="nn-toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`nn-toast nn-toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function NoteBoard({ user }) {
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null); // null = closed, {note} = editing, 'new' = new
  const [sharingNote, setSharingNote] = useState(null);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const isLoggedIn = !!user;

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notesApi.list();
      setNotes(data.notes || []);
      setSharedNotes(data.sharedNotes || []);
    } catch (e) {
      addToast(e.message || 'Không thể tải ghi chú', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Listen to search events from header
  useEffect(() => {
    const handler = (e) => setSearch(e.detail || '');
    window.addEventListener('nn-search', handler);
    return () => window.removeEventListener('nn-search', handler);
  }, []);

  // Search filter
  const filteredNotes = search
    ? notes.filter((n) => {
        const q = search.toLowerCase();
        return (
          n.title?.toLowerCase().includes(q) ||
          stripHtml(n.content || '').toLowerCase().includes(q)
        );
      })
    : notes;

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateNote = async (dto) => {
    try {
      const note = await notesApi.create(dto);
      setNotes((prev) => [note, ...prev]);
      addToast('📝 Ghi chú đã được tạo');
      return note;
    } catch (e) {
      addToast(e.message, 'error');
      throw e;
    }
  };

  const handleUpdateNote = async (id, dto) => {
    try {
      const updated = await notesApi.update(id, dto);
      setNotes((prev) => prev.map((n) => n.id === id ? updated : n));
      addToast('✓ Đã lưu thay đổi');
      return updated;
    } catch (e) {
      addToast(e.message, 'error');
      throw e;
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      addToast('🗑 Ghi chú đã bị xoá');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handlePinNote = async (id, pin) => {
    try {
      await notesApi.update(id, { isPinned: pin });
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, isPinned: pin } : n));
      addToast(pin ? '📌 Đã ghim' : '📌 Đã bỏ ghim');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleEditorSave = async (dto, explicitId) => {
    const idToUpdate = explicitId || (editingNote && !editingNote._isNew ? editingNote.id : null);
    if (idToUpdate) {
      const updated = await handleUpdateNote(idToUpdate, dto);
      return updated;
    } else {
      const created = await handleCreateNote(dto);
      return created;
    }
  };

  const handleShareUpdate = (noteId, updates) => {
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, ...updates } : n));
  };

  // ─── Quick-create bar handler ──────────────────────────────────────────────

  const openNewNoteEditor = () => {
    setEditingNote({ _isNew: true, title: '', content: '', bgColor: 'default', bgPattern: 'none', images: [] });
  };

  // ─── Skeleton cards ───────────────────────────────────────────────────────

  const SkeletonCard = () => (
    <div className="nn-masonry-item">
      <div className="nn-card" style={{ pointerEvents: 'none' }}>
        <div className="nn-skeleton" style={{ height: 14, width: '60%', marginBottom: 10 }} />
        <div className="nn-skeleton" style={{ height: 10, width: '100%', marginBottom: 6 }} />
        <div className="nn-skeleton" style={{ height: 10, width: '80%', marginBottom: 6 }} />
        <div className="nn-skeleton" style={{ height: 10, width: '90%' }} />
      </div>
    </div>
  );

  return (
    <>
      {/* Quick Create Bar */}
      <div className="nn-create-bar">
        <div
          className="nn-create-box"
          onClick={openNewNoteEditor}
          role="button"
          tabIndex={0}
          aria-label="Tạo ghi chú mới"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openNewNoteEditor(); }}
          id="btn-new-note"
        >
          <span className="nn-create-placeholder">
            ✏️&nbsp;&nbsp;Tạo ghi chú mới…
          </span>
        </div>
      </div>

      {/* Board */}
      <main className="nn-main" id="note-board">
        {loading ? (
          <div className="nn-masonry">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredNotes.length === 0 && sharedNotes.length === 0 ? (
          <div className="nn-empty">
            <div className="nn-empty-icon">📝</div>
            <h2 className="nn-empty-title">
              {search ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú nào'}
            </h2>
            <p className="nn-empty-text">
              {search
                ? `Không có ghi chú nào khớp với "${search}"`
                : isLoggedIn
                ? 'Bấm vào ô trên để tạo ghi chú đầu tiên của bạn!'
                : 'Bấm vào ô trên để tạo ghi chú. Không cần đăng nhập!'}
            </p>
            {!search && (
              <button
                className="btn btn-primary"
                onClick={openNewNoteEditor}
                id="btn-create-first-note"
                type="button"
              >
                ✏️ Tạo ghi chú đầu tiên
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p className="nn-section-label">📌 Đã ghim</p>
                <div className="nn-masonry">
                  {pinnedNotes.map((note) => (
                    <div className="nn-masonry-item" key={note.id}>
                      <NoteCard
                        note={note}
                        onEdit={(n) => setEditingNote(n)}
                        onDelete={handleDeleteNote}
                        onShare={(n) => setSharingNote(n)}
                        onPin={handlePinNote}
                        isShared={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Notes */}
            {unpinnedNotes.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {pinnedNotes.length > 0 && <p className="nn-section-label">Ghi chú khác</p>}
                <div className="nn-masonry">
                  {unpinnedNotes.map((note) => (
                    <div className="nn-masonry-item" key={note.id}>
                      <NoteCard
                        note={note}
                        onEdit={(n) => setEditingNote(n)}
                        onDelete={handleDeleteNote}
                        onShare={(n) => setSharingNote(n)}
                        onPin={handlePinNote}
                        isShared={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Notes */}
            {sharedNotes.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p className="nn-section-label">👥 Được chia sẻ với bạn</p>
                <div className="nn-masonry">
                  {sharedNotes.map((note) => (
                    <div className="nn-masonry-item" key={note.id}>
                      <NoteCard
                        note={note}
                        onEdit={(n) => setEditingNote(n)}
                        onDelete={() => {}}
                        onShare={() => {}}
                        onPin={() => {}}
                        isShared={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Note Editor Modal */}
      {editingNote && (
        <ErrorBoundary onReset={() => setEditingNote(null)}>
          <NoteEditor
            note={editingNote._isNew ? null : editingNote}
            isNew={!!editingNote._isNew}
            userIsLoggedIn={isLoggedIn}
            onSave={handleEditorSave}
            onClose={() => setEditingNote(null)}
          />
        </ErrorBoundary>
      )}

      {/* Share Modal */}
      {sharingNote && (
        <NoteShareModal
          note={sharingNote}
          isLoggedIn={isLoggedIn}
          onClose={() => setSharingNote(null)}
          onUpdate={(updates) => handleShareUpdate(sharingNote.id, updates)}
        />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </>
  );
}
