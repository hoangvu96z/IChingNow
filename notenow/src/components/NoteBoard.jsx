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
          <span className="nn-toast-icon">
            {t.type === 'error' ? '✕' : t.type === 'info' ? 'ℹ' : '✓'}
          </span>
          <span className="nn-toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Draggable Notes Grid ────────────────────────────────────────────────────

function DraggableNoteGrid({ notes, onEdit, onDelete, onShare, onPin, onPermanent, onReorder, isShared }) {
  const [draggedId, setDraggedId] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [localNotes, setLocalNotes] = useState(notes);
  const saveTimer = useRef(null);

  // Sync when parent notes change (e.g. after fetch)
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleDragStart = (e, note) => {
    if (isShared) return;
    setDraggedId(note.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', note.id);
  };

  const handleDragOver = (e, idx) => {
    if (isShared || draggedId === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (isShared || draggedId === null) return;

    const fromIdx = localNotes.findIndex((n) => n.id === draggedId);
    if (fromIdx === -1 || fromIdx === targetIdx) {
      setDraggedId(null);
      setOverIdx(null);
      return;
    }

    const reordered = [...localNotes];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setLocalNotes(reordered);
    setDraggedId(null);
    setOverIdx(null);

    // Debounced save
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onReorder(reordered.map((n) => n.id));
    }, 600);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverIdx(null);
  };

  return (
    <div className="nn-masonry">
      {localNotes.map((note, idx) => (
        <div
          key={note.id}
          className={`nn-masonry-item${draggedId === note.id ? ' nn-dragging' : ''}${overIdx === idx && draggedId !== note.id ? ' nn-drag-over' : ''}`}
          draggable={!isShared}
          onDragStart={(e) => handleDragStart(e, note)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
        >
          <NoteCard
            note={note}
            onEdit={(n) => onEdit(n)}
            onDelete={onDelete}
            onShare={onShare}
            onPin={onPin}
            onPermanent={onPermanent}
            isShared={isShared}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main NoteBoard ──────────────────────────────────────────────────────────

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
      const fetched = data.notes || [];
      // Apply local sort order if available
      try {
        const savedOrder = JSON.parse(localStorage.getItem('notenow_sort_order') || 'null');
        if (savedOrder && Array.isArray(savedOrder)) {
          fetched.sort((a, b) => {
            const ai = savedOrder.indexOf(a.id);
            const bi = savedOrder.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });
        }
      } catch {}
      setNotes(fetched);
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

  const handleCreateNote = async (dto, silent = false) => {
    try {
      const note = await notesApi.create(dto);
      setNotes((prev) => [note, ...prev]);
      if (!silent) {
        addToast('✓ Đã lưu ghi chú thành công!');
      }
      return note;
    } catch (e) {
      addToast(e.message || 'Lỗi khi tạo ghi chú', 'error');
      throw e;
    }
  };

  const handleUpdateNote = async (id, dto, silent = false) => {
    try {
      const updated = await notesApi.update(id, dto);
      setNotes((prev) => prev.map((n) => n.id === id ? updated : n));
      if (!silent) {
        addToast('✓ Đã lưu ghi chú thành công!');
      }
      return updated;
    } catch (e) {
      addToast(e.message || 'Lỗi khi lưu ghi chú', 'error');
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
      addToast(pin ? '📌 Đã ghim ghi chú' : '📌 Đã bỏ ghim ghi chú');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handlePermanentNote = async (id, permanent) => {
    try {
      await notesApi.update(id, { isPermanent: permanent });
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, isPermanent: permanent } : n));
      addToast(permanent ? '♾ Đã đặt lưu vĩnh viễn' : '⏳ Đã bỏ lưu vĩnh viễn');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleReorder = async (orderedIds) => {
    // Optimistic: already reordered in DraggableNoteGrid state
    // Persist to server + localStorage
    try {
      localStorage.setItem('notenow_sort_order', JSON.stringify(orderedIds));
    } catch {}
    await notesApi.reorderNotes(orderedIds);
  };

  const handleEditorSave = async (dto, explicitId, options = {}) => {
    const isSilent = options?.silent === true;
    const idToUpdate = explicitId || (editingNote && !editingNote._isNew ? editingNote.id : null);
    if (idToUpdate) {
      const updated = await handleUpdateNote(idToUpdate, dto, isSilent);
      return updated;
    } else {
      const created = await handleCreateNote(dto, isSilent);
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
      {/* Quick Create Bar & Search */}
      <div className="nn-create-bar">
        {/* Mobile Search Bar */}
        <div className="nn-search-mobile">
          <span className="nn-search-mobile-icon" aria-hidden="true">🔍</span>
          <input
            className="nn-search-mobile-input"
            type="search"
            placeholder="Tìm kiếm ghi chú…"
            aria-label="Tìm kiếm ghi chú"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="nn-search-mobile-clear"
              onClick={() => setSearch('')}
              type="button"
              aria-label="Xoá tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Create Box */}
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
                <DraggableNoteGrid
                  notes={pinnedNotes}
                  onEdit={(n) => setEditingNote(n)}
                  onDelete={handleDeleteNote}
                  onShare={(n) => setSharingNote(n)}
                  onPin={handlePinNote}
                  onPermanent={handlePermanentNote}
                  onReorder={handleReorder}
                  isShared={false}
                />
              </div>
            )}

            {/* My Notes */}
            {unpinnedNotes.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {pinnedNotes.length > 0 && <p className="nn-section-label">Ghi chú khác</p>}
                <DraggableNoteGrid
                  notes={unpinnedNotes}
                  onEdit={(n) => setEditingNote(n)}
                  onDelete={handleDeleteNote}
                  onShare={(n) => setSharingNote(n)}
                  onPin={handlePinNote}
                  onPermanent={handlePermanentNote}
                  onReorder={handleReorder}
                  isShared={false}
                />
              </div>
            )}

            {/* Shared Notes */}
            {sharedNotes.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p className="nn-section-label">👥 Được chia sẻ với bạn</p>
                <DraggableNoteGrid
                  notes={sharedNotes}
                  onEdit={(n) => setEditingNote(n)}
                  onDelete={() => {}}
                  onShare={() => {}}
                  onPin={() => {}}
                  onPermanent={() => {}}
                  onReorder={() => {}}
                  isShared={true}
                />
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

      {/* Mobile Floating Action Button (FAB) */}
      <button
        className="nn-fab"
        onClick={openNewNoteEditor}
        aria-label="Tạo ghi chú mới"
        title="Tạo ghi chú mới"
        type="button"
        id="btn-fab-new-note"
      >
        <span className="nn-fab-icon">✏️</span>
      </button>

      {/* Toasts */}
      <Toast toasts={toasts} />
    </>
  );
}
