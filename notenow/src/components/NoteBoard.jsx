import React, { useState, useEffect, useCallback, useRef } from 'react';
import NoteCard from './NoteCard.jsx';
import NoteEditor from './NoteEditor.jsx';
import NoteShareModal from './NoteShareModal.jsx';
import NotePasswordModal from './NotePasswordModal.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { notesApi, stripHtml } from '../api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  Check, X, Info, Pin, Users, Plus,
  Search, FileText,
} from 'lucide-react';

function Toast({ toasts }) {
  return (
    <div className="nn-toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`nn-toast nn-toast-${t.type}`}>
          <span className="nn-toast-icon">
            {t.type === 'error' ? (
              <X size={14} strokeWidth={2.5} />
            ) : t.type === 'info' ? (
              <Info size={14} strokeWidth={2.2} />
            ) : (
              <Check size={14} strokeWidth={2.5} />
            )}
          </span>
          <span className="nn-toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Draggable Notes Grid ────────────────────────────────────────────────────

function DraggableNoteGrid({
  notes,
  onEdit,
  onDelete,
  onShare,
  onPin,
  onPassword,
  unlockedNoteIds,
  onReorder,
  isShared,
}) {
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
            onPassword={onPassword}
            isUnlocked={Boolean(unlockedNoteIds?.[note.id])}
            isShared={isShared}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main NoteBoard ──────────────────────────────────────────────────────────

export default function NoteBoard({ user }) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);
  // Password modal state: { note, mode: 'unlock' | 'manage', onSuccess?: fn }
  const [passwordModalState, setPasswordModalState] = useState(null);
  // Session-unlocked note IDs so the user doesn't have to re-type password while editing
  const [unlockedNoteIds, setUnlockedNoteIds] = useState({});
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
      addToast(e.message || t('toast.load_error', 'Không thể tải ghi chú'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Listen to search events from header
  useEffect(() => {
    const handler = (e) => setSearch(e.detail || '');
    window.addEventListener('nn-search', handler);
    return () => window.removeEventListener('nn-search', handler);
  }, []);

  // Search filter (do not leak body content of locked notes when searching)
  const filteredNotes = search
    ? notes.filter((n) => {
        const q = search.toLowerCase();
        const isLocked = Boolean(n.hasPassword) && !unlockedNoteIds[n.id];
        if (isLocked) {
          return n.title?.toLowerCase().includes(q);
        }
        return (
          n.title?.toLowerCase().includes(q) ||
          stripHtml(n.content || '').toLowerCase().includes(q)
        );
      })
    : notes;

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);
  const isEmpty = notes.length === 0 && sharedNotes.length === 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateNote = async (dto, silent = false) => {
    try {
      const note = await notesApi.create(dto);
      setNotes((prev) => {
        if (prev.some((n) => n.id === note.id)) {
          return prev.map((n) => (n.id === note.id ? note : n));
        }
        return [note, ...prev];
      });
      if (!silent) {
        addToast(t('toast.save_success', 'Đã lưu ghi chú thành công!'));
      }
      return note;
    } catch (e) {
      addToast(e.message || t('toast.create_error', 'Lỗi khi tạo ghi chú'), 'error');
      throw e;
    }
  };

  const handleUpdateNote = async (id, dto, silent = false) => {
    try {
      const updated = await notesApi.update(id, dto);
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
      if (!silent) {
        addToast(t('toast.save_success', 'Đã lưu ghi chú thành công!'));
      }
      return updated;
    } catch (e) {
      addToast(e.message || t('toast.update_error', 'Lỗi khi lưu ghi chú'), 'error');
      throw e;
    }
  };

  const executeDeleteNote = async (id) => {
    try {
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      addToast(t('toast.delete_success', 'Ghi chú đã bị xoá'));
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleRequestEditNote = (note) => {
    if (note.hasPassword && !unlockedNoteIds[note.id]) {
      setPasswordModalState({
        note,
        mode: 'unlock',
        onSuccess: () => setEditingNote(note),
      });
      return;
    }
    setEditingNote(note);
  };

  const handleRequestDeleteNote = async (noteOrId) => {
    const targetNote =
      typeof noteOrId === 'object' ? noteOrId : notes.find((n) => n.id === noteOrId);
    const id = typeof noteOrId === 'object' ? noteOrId.id : noteOrId;

    if (targetNote?.hasPassword && !unlockedNoteIds[id]) {
      setPasswordModalState({
        note: targetNote,
        mode: 'unlock',
        onSuccess: async () => {
          if (window.confirm(t('card.delete_confirm', 'Xoá ghi chú này?'))) {
            await executeDeleteNote(id);
          }
        },
      });
      return;
    }
    await executeDeleteNote(id);
  };

  const handleRequestShareNote = (note) => {
    if (note.hasPassword && !unlockedNoteIds[note.id]) {
      setPasswordModalState({
        note,
        mode: 'unlock',
        onSuccess: () => setSharingNote(note),
      });
      return;
    }
    setSharingNote(note);
  };

  const handleRequestPasswordModal = (note) => {
    setPasswordModalState({
      note,
      mode: 'manage',
    });
  };

  const handlePasswordChanged = (noteId, { hasPassword, unlockedPassword, updated }) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, ...updated, hasPassword } : n,
      ),
    );
    if (hasPassword && unlockedPassword) {
      setUnlockedNoteIds((prev) => ({ ...prev, [noteId]: true }));
      addToast(t('note_pw.toast_set', 'Đã đặt mật khẩu bảo vệ ghi chú'));
    } else if (!hasPassword) {
      setUnlockedNoteIds((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
      addToast(t('note_pw.toast_removed', 'Đã gỡ mật khẩu ghi chú'));
    }
  };

  const handlePinNote = async (id, pin) => {
    try {
      await notesApi.update(id, { isPinned: pin });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: pin } : n)));
      addToast(pin ? t('toast.pin_added', 'Đã ghim ghi chú') : t('toast.pin_removed', 'Đã bỏ ghim ghi chú'));
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleReorder = async (orderedIds) => {
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
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n)));
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
          <Search size={15} className="nn-search-mobile-icon" aria-hidden="true" />
          <input
            className="nn-search-mobile-input"
            type="search"
            placeholder={t('header.search_placeholder', 'Tìm kiếm ghi chú…')}
            aria-label={t('header.search_placeholder', 'Tìm kiếm ghi chú…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="nn-search-mobile-clear"
              onClick={() => setSearch('')}
              type="button"
              aria-label={t('board.search_clear', 'Xoá tìm kiếm')}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Create Box */}
        <div
          className="nn-create-box"
          onClick={openNewNoteEditor}
          role="button"
          tabIndex={0}
          aria-label={t('board.create_placeholder', 'Tạo ghi chú mới…')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openNewNoteEditor(); }}
          id="btn-new-note"
        >
          <span className="nn-create-placeholder">
            <Plus size={17} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {t('board.create_placeholder', 'Tạo ghi chú mới…')}
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
            <div className="nn-empty-icon">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h2 className="nn-empty-title">
              {search ? t('board.empty_search_title', 'Không tìm thấy ghi chú') : t('board.empty_title', 'Chưa có ghi chú nào')}
            </h2>
            <p className="nn-empty-text">
              {search
                ? t('board.empty_search_desc', `Không có ghi chú nào khớp với "${search}"`, { query: search })
                : isLoggedIn
                ? t('board.empty_user_cta_desc', 'Bấm nút bên dưới để tạo ghi chú đầu tiên của bạn!')
                : t('board.empty_guest_cta_desc', 'Bấm nút bên dưới để tạo ghi chú. Không cần đăng nhập!')}
            </p>
            {!search && (
              <button
                className="btn btn-primary"
                onClick={openNewNoteEditor}
                id="btn-create-first-note"
                type="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={15} strokeWidth={2.5} />
                {t('board.create_first', 'Tạo ghi chú đầu tiên')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p className="nn-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pin size={13} fill="currentColor" strokeWidth={1.5} />
                  {t('board.section_pinned', 'Đã ghim')}
                </p>
                <DraggableNoteGrid
                  notes={pinnedNotes}
                  onEdit={handleRequestEditNote}
                  onDelete={handleRequestDeleteNote}
                  onShare={handleRequestShareNote}
                  onPin={handlePinNote}
                  onPassword={handleRequestPasswordModal}
                  unlockedNoteIds={unlockedNoteIds}
                  onReorder={handleReorder}
                  isShared={false}
                />
              </div>
            )}

            {/* My Notes */}
            {unpinnedNotes.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {pinnedNotes.length > 0 && <p className="nn-section-label">{t('board.section_others', 'Ghi chú khác')}</p>}
                <DraggableNoteGrid
                  notes={unpinnedNotes}
                  onEdit={handleRequestEditNote}
                  onDelete={handleRequestDeleteNote}
                  onShare={handleRequestShareNote}
                  onPin={handlePinNote}
                  onPassword={handleRequestPasswordModal}
                  unlockedNoteIds={unlockedNoteIds}
                  onReorder={handleReorder}
                  isShared={false}
                />
              </div>
            )}

            {/* Shared Notes */}
            {sharedNotes.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p className="nn-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={13} strokeWidth={2} />
                  {t('board.section_shared', 'Được chia sẻ với bạn')}
                </p>
                <DraggableNoteGrid
                  notes={sharedNotes}
                  onEdit={(n) => setEditingNote(n)}
                  onDelete={() => {}}
                  onShare={() => {}}
                  onPin={() => {}}
                  onPassword={() => {}}
                  unlockedNoteIds={unlockedNoteIds}
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
            onPasswordChanged={handlePasswordChanged}
            onClose={() => setEditingNote(null)}
          />
        </ErrorBoundary>
      )}

      {/* Direct Note Password Modal */}
      {passwordModalState && (
        <NotePasswordModal
          note={passwordModalState.note}
          mode={passwordModalState.mode}
          onClose={() => setPasswordModalState(null)}
          onUnlocked={() => {
            const target = passwordModalState.note;
            const callback = passwordModalState.onSuccess;
            setUnlockedNoteIds((prev) => ({ ...prev, [target.id]: true }));
            setPasswordModalState(null);
            callback?.();
          }}
          onPasswordChanged={({ hasPassword, unlockedPassword, updated }) => {
            handlePasswordChanged(passwordModalState.note.id, {
              hasPassword,
              unlockedPassword,
              updated,
            });
          }}
        />
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
      {!loading && !isEmpty && (
        <button
          className="nn-fab"
          onClick={openNewNoteEditor}
          aria-label={t('board.create_placeholder', 'Tạo ghi chú mới')}
          title={t('board.create_placeholder', 'Tạo ghi chú mới')}
          type="button"
          id="btn-fab-new-note"
        >
          <span className="nn-fab-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} strokeWidth={2.5} />
          </span>
        </button>
      )}

      {/* Toasts */}
      <Toast toasts={toasts} />
    </>
  );
}
