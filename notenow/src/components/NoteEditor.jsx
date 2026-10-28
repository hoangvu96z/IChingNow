import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  notesApi,
  charCount,
  compressImageTo720p,
  getLocalNoteHistory,
  pushLocalNoteHistory,
  stripHtml,
} from '../api.js';
import NoteColorPicker from './NoteColorPicker.jsx';
import ImageViewer from './ImageViewer.jsx';
import NotePasswordModal from './NotePasswordModal.jsx';
import { useNoteImageSources } from '../hooks/useNoteImageSources.js';
import { getInlineImageOrphanIndices } from '../noteImages.mjs';
import {
  contentWithPreservedInlineImages,
  contentWithInlineImagePlaceholders,
  hasInlineImagePlaceholder,
  sanitizeNoteContent,
} from '../safeNoteContent.js';
import { useLanguage } from '../context/LanguageContext.jsx';

// Lucide React icons
import {
  Bold, Italic, Underline, Strikethrough,
  Highlighter, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Palette, X, Check,
  Loader2, AlertCircle, Eye, Pencil, Plus,
  History, RotateCcw, Lock, Unlock,
} from 'lucide-react';

// TipTap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import NoteInlineImagePlaceholder from '../extensions/NoteInlineImagePlaceholder.js';

function ToolbarButton({ onClick, title, isActive, children, id }) {
  return (
    <button
      id={id}
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`nn-tb-btn${isActive ? ' is-active' : ''}`}
    >
      {children}
    </button>
  );
}

export default function NoteEditor({
  note,
  isNew,
  onSave,
  onClose,
  onPasswordChanged,
  isReadOnly = false,
  userIsLoggedIn,
  shareToken,
}) {
  const { t, language } = useLanguage();
  // 10x character limit: 100,000 for logged-in users, 20,480 for guests
  const MAX_CHARS = userIsLoggedIn ? 100000 : 20480;

  const [activeNoteId, setActiveNoteId] = useState(note?.id || null);
  const activeNoteIdRef = useRef(note?.id || null);
  const saveInFlightRef = useRef(false);
  const pendingAutoSaveRef = useRef(false);

  const [title, setTitle] = useState(note?.title || '');
  const titleRef = useRef(note?.title || '');
  const [bgColor, setBgColor] = useState(note?.bgColor || 'default');
  const bgColorRef = useRef(note?.bgColor || 'default');
  const [bgPattern, setBgPattern] = useState(note?.bgPattern || 'none');
  const bgPatternRef = useRef(note?.bgPattern || 'none');
  const [images, setImages] = useState(note?.images || []);
  const [hasPassword, setHasPassword] = useState(Boolean(note?.hasPassword));
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [, setContentRevision] = useState(0);
  const sanitizedContent = useMemo(() => sanitizeNoteContent(note?.content), [note?.content]);
  const inlineImageContent = useMemo(() => contentWithInlineImagePlaceholders(sanitizedContent), [sanitizedContent]);
  const inlineImages = inlineImageContent.images;
  const editorContent = inlineImageContent.content;

  // Track the last saved snapshot so we can push history revisions before overwriting
  const lastSavedSnapshotRef = useRef({
    title: note?.title || null,
    content: note?.content || '',
    bgColor: note?.bgColor || 'default',
    bgPattern: note?.bgPattern || 'none',
    savedAt: note?.updatedAt || new Date().toISOString(),
  });

  // Version History state:
  // - Guest notes: stored ONLY in localStorage (never sent to server)
  // - Logged-in user notes: server supports up to 5 back revisions (max 5), synced with local fallback
  const [serverHistory, setServerHistory] = useState(() =>
    userIsLoggedIn && Array.isArray(note?.history) ? note.history.slice(0, 5) : [],
  );
  const [localHistory, setLocalHistory] = useState(() =>
    note?.id ? getLocalNoteHistory(note.id) : [],
  );
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'

  useEffect(() => {
    if (activeNoteId) {
      setLocalHistory(getLocalNoteHistory(activeNoteId));
    }
  }, [activeNoteId]);

  const effectiveHistory = useMemo(() => {
    if (userIsLoggedIn) {
      // Server supports up to 5 back versions; fall back to localStorage capped at 5 if offline
      return (serverHistory.length > 0 ? serverHistory : localHistory).slice(0, 5);
    }
    // Guests: history is stored strictly in localStorage
    return localHistory;
  }, [userIsLoggedIn, serverHistory, localHistory]);

  const unsupportedImageIndices = useMemo(() => {
    const noteId = activeNoteId || note?.id;
    if (String(noteId || '').startsWith('local-')) return [];
    return getInlineImageOrphanIndices(inlineImages, images);
  }, [activeNoteId, note?.id, images, inlineImages]);

  const imageRefs = useMemo(() => [...images, ...inlineImages], [images, inlineImages]);
  const { sources: imageSources, loading: imageSourcesLoading, failedCount: imageLoadFailedCount } = useNoteImageSources(
    imageRefs,
    activeNoteId || note?.id,
    shareToken,
    Boolean(note?.isGuest || !userIsLoggedIn),
  );

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileInputRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // Auto-save debounce while typing (works for both new notes and existing notes!)
  const triggerAutoSave = () => {
    if (isReadOnly) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave(true, false);
    }, 900);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({ types: ['paragraph'] }),
      TextStyle,
      Placeholder.configure({ placeholder: t('editor.content_placeholder', 'Viết ghi chú của bạn ở đây…') }),
      NoteInlineImagePlaceholder,
    ],
    content: editorContent,
    editable: !isReadOnly,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: () => {
      setContentRevision((revision) => revision + 1);
      triggerAutoSave();
    },
  });

  const currentContent = editor?.getHTML() || '';
  const visibleInlineImageIndices = inlineImages
    .map((_, index) => index)
    .filter((index) => hasInlineImagePlaceholder(currentContent || editorContent, index));
  const unresolvedUnsupportedImageIndices = unsupportedImageIndices
    .filter((index) => hasInlineImagePlaceholder(currentContent || editorContent, index));
  const chars = charCount(currentContent);
  const overLimit = chars > MAX_CHARS;
  const nearLimit = chars > MAX_CHARS * 0.85;
  const hasUnsupportedImagePlaceholder = (content) => unsupportedImageIndices
    .some((index) => hasInlineImagePlaceholder(content, index));

  const handleSave = async (silent = false, closeAfter = false, overrides = {}) => {
    if (overLimit) return;
    clearTimeout(autoSaveTimer.current);

    const contentToSave = overrides.content !== undefined
      ? overrides.content
      : (editor?.getHTML() || currentContent);
    const currentTitle = overrides.title !== undefined ? overrides.title : titleRef.current;
    const finalBgColor = overrides.bgColor !== undefined ? overrides.bgColor : bgColorRef.current;
    const finalBgPattern = overrides.bgPattern !== undefined ? overrides.bgPattern : bgPatternRef.current;

    const currentTargetId = activeNoteIdRef.current;

    // For a brand-new note during silent auto-save, skip if both title and content are still empty
    const plainText = stripHtml(contentToSave);
    if (silent && !currentTargetId && !shareToken && !currentTitle.trim() && !plainText) {
      return;
    }

    if (hasUnsupportedImagePlaceholder(contentToSave)) {
      setError('Không thể lưu: ảnh nội tuyến này không có trong danh sách ảnh của ghi chú nên máy chủ sẽ gỡ ảnh. Hãy xóa vị trí giữ ảnh trong nội dung rồi lưu lại.');
      return;
    }

    // Prevent concurrent duplicate POST /notes when user types fast in a new note
    if (saveInFlightRef.current) {
      if (silent) {
        pendingAutoSaveRef.current = true;
        return;
      }
    }

    saveInFlightRef.current = true;
    if (!silent) {
      setSaving(true);
    } else {
      setAutoSaveState('saving');
    }
    setError(null);

    try {
      const preservedContent = contentWithPreservedInlineImages(contentToSave, inlineImages);
      const dto = {
        title: currentTitle.trim() || null,
        content: preservedContent,
        bgColor: finalBgColor,
        bgPattern: finalBgPattern,
      };

      const prevSnap = lastSavedSnapshotRef.current;
      const contentChanged =
        (dto.title || '') !== (prevSnap.title || '') ||
        (dto.content || '') !== (prevSnap.content || '');
      const prevHadData =
        Boolean((prevSnap.title || '').trim()) ||
        Boolean(stripHtml(prevSnap.content || ''));

      const result = await onSave(dto, currentTargetId, { silent });
      const resolvedId = result?.id || currentTargetId;

      if (resolvedId) {
        activeNoteIdRef.current = resolvedId;
        setActiveNoteId(resolvedId);

        // Push previous snapshot into localStorage history when content/title changed
        if (contentChanged && prevHadData && !overrides.skipHistoryPush) {
          const updatedLocal = pushLocalNoteHistory(resolvedId, {
            ...prevSnap,
            savedAt: new Date().toISOString(),
          });
          setLocalHistory(updatedLocal);
        }
      }

      if (userIsLoggedIn && Array.isArray(result?.history)) {
        setServerHistory(result.history.slice(0, 5));
      }

      lastSavedSnapshotRef.current = {
        title: dto.title,
        content: dto.content,
        bgColor: dto.bgColor,
        bgPattern: dto.bgPattern,
        savedAt: result?.updatedAt || new Date().toISOString(),
      };

      if (silent) {
        setAutoSaveState('saved');
      }

      if (closeAfter) {
        onClose();
      }
      return result;
    } catch (e) {
      if (!silent) setError(e.message);
      setAutoSaveState('idle');
    } finally {
      saveInFlightRef.current = false;
      if (!silent) setSaving(false);
      if (pendingAutoSaveRef.current) {
        pendingAutoSaveRef.current = false;
        triggerAutoSave();
      }
    }
  };

  // Restore a version from history (Undo / Back)
  const handleRestoreRevision = async (revision, index) => {
    if (!revision || isReadOnly) return;
    const nextTitle = revision.title || '';
    const nextContent = revision.content || '';
    const nextBgColor = revision.bgColor || bgColorRef.current;
    const nextBgPattern = revision.bgPattern || bgPatternRef.current;

    setTitle(nextTitle);
    titleRef.current = nextTitle;
    setBgColor(nextBgColor);
    bgColorRef.current = nextBgColor;
    setBgPattern(nextBgPattern);
    bgPatternRef.current = nextBgPattern;

    if (editor) {
      const placeholderProcessed = contentWithInlineImagePlaceholders(sanitizeNoteContent(nextContent));
      editor.commands.setContent(placeholderProcessed.content || '');
    }

    // If guest, remove the restored item from the top of localStorage history so repeated "Back" steps walk backward
    if (!userIsLoggedIn && activeNoteIdRef.current) {
      const remaining = localHistory.filter((_, idx) => idx !== index);
      try {
        localStorage.setItem(`notenow_history_${activeNoteIdRef.current}`, JSON.stringify(remaining));
      } catch {}
      setLocalHistory(remaining);
    }

    await handleSave(true, false, {
      title: nextTitle,
      content: nextContent,
      bgColor: nextBgColor,
      bgPattern: nextBgPattern,
      skipHistoryPush: !userIsLoggedIn,
    });
  };

  const handleQuickUndoStep = async () => {
    if (!effectiveHistory.length) return;
    await handleRestoreRevision(effectiveHistory[0], 0);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 2) {
      setError(t('editor.max_images_error', 'Mỗi note chỉ được tối đa 2 hình ảnh'));
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const contentToSave = editor?.getHTML() || currentContent;
      if (hasUnsupportedImagePlaceholder(contentToSave)) {
        setError('Không thể tải ảnh lên khi ảnh nội tuyến chưa có trong danh sách ảnh của ghi chú. Hãy xóa vị trí giữ ảnh trong nội dung trước.');
        return;
      }
      let targetId = activeNoteIdRef.current;
      // If new note without ID yet, create draft first
      if (!targetId && !shareToken) {
        const dto = {
          title: titleRef.current.trim() || null,
          content: contentWithPreservedInlineImages(contentToSave, inlineImages),
          bgColor: bgColorRef.current,
          bgPattern: bgPatternRef.current,
        };
        const saved = await onSave(dto, null, { silent: true });
        if (saved?.id) {
          targetId = saved.id;
          activeNoteIdRef.current = saved.id;
          setActiveNoteId(saved.id);
        }
      }

      for (const file of files.slice(0, 2 - images.length)) {
        const compressed = await compressImageTo720p(file);
        const { image } = shareToken
          ? await notesApi.uploadImageByShareToken(shareToken, compressed)
          : await notesApi.uploadImage(targetId, compressed);
        setImages((prev) => [...prev, image]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (idx) => {
    try {
      if (shareToken) {
        await notesApi.deleteImageByShareToken(shareToken, idx);
      } else if (activeNoteIdRef.current) {
        await notesApi.deleteImage(activeNoteIdRef.current, idx);
      }
      setImages((prev) => prev.filter((_, i) => i !== idx));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleColorChange = (updates) => {
    if (updates.bgColor !== undefined) {
      setBgColor(updates.bgColor);
      bgColorRef.current = updates.bgColor;
    }
    if (updates.bgPattern !== undefined) {
      setBgPattern(updates.bgPattern);
      bgPatternRef.current = updates.bgPattern;
    }
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave(true, false, updates);
    }, 400);
  };

  const handleOpenPasswordSettings = async () => {
    // Ensure the note has been saved/created before setting a password on it
    if (!activeNoteIdRef.current && !shareToken) {
      const created = await handleSave(true, false);
      if (!created?.id) {
        setError(t('note_pw.save_first_hint', 'Hãy nhập nội dung ghi chú trước khi đặt mật khẩu'));
        return;
      }
    }
    setShowPasswordModal(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showPasswordModal) {
        clearTimeout(autoSaveTimer.current);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showPasswordModal]);

  const iconSize = 15;

  return (
    <div className="nn-overlay">
      <div
        className="nn-modal nn-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? t('editor.badge_new', 'Tạo ghi chú mới') : t('editor.badge_editing', 'Chỉnh sửa ghi chú')}
      >
        <div className="nn-sheet-handle" aria-hidden="true" />
        <div className="nn-editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="nn-editor-badge">
              <span>
                {isNew && !activeNoteId
                  ? <><Plus size={14} strokeWidth={2.5} /> {t('editor.badge_new', 'Ghi chú mới')}</>
                  : isReadOnly
                  ? <><Eye size={14} strokeWidth={2} /> {t('editor.badge_viewing', 'Đang xem ghi chú')}</>
                  : <><Pencil size={14} strokeWidth={2} /> {t('editor.badge_editing', 'Chỉnh sửa ghi chú')}</>
                }
              </span>
            </div>

            {!isReadOnly && autoSaveState !== 'idle' && (
              <span
                id="editor-autosave-status"
                style={{
                  fontSize: '0.73rem',
                  color: autoSaveState === 'saved' ? 'var(--accent)' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                {autoSaveState === 'saving' ? (
                  <>
                    <Loader2 size={12} className="nn-spin" />
                    {t('editor.autosave_saving', 'Đang tự động lưu…')}
                  </>
                ) : (
                  <>
                    <Check size={12} strokeWidth={2.5} />
                    {t('editor.autosave_saved', 'Đã tự động lưu')}
                  </>
                )}
              </span>
            )}
          </div>

          {!isReadOnly && (
            <button
              className="nn-modal-close"
              onClick={async () => {
                clearTimeout(autoSaveTimer.current);
                await handleSave(true, false);
                onClose();
              }}
              aria-label={t('editor.btn_close', 'Đóng')}
              title={`${t('editor.btn_close', 'Đóng')} (Esc)`}
              type="button"
              id="btn-editor-top-close"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <div className="nn-editor-wrap" data-bg={bgColor}>
          {/* Title */}
          <textarea
            className="nn-editor-title"
            placeholder={t('editor.title_placeholder', 'Tiêu đề')}
            value={title}
            rows={1}
            maxLength={200}
            readOnly={isReadOnly}
            onChange={(e) => {
              setTitle(e.target.value);
              titleRef.current = e.target.value;
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              triggerAutoSave();
            }}
            id="note-editor-title"
            aria-label={t('editor.title_placeholder', 'Tiêu đề ghi chú')}
          />

          {/* Images */}
          {images.length > 0 && (
            <div className="nn-editor-images">
              {images.map((_img, idx) => (
                <div key={idx} className="nn-editor-img-wrap">
                  {imageSources[idx] ? (
                    <img
                      className="nn-editor-img"
                      src={imageSources[idx]}
                      alt={`Hình ${idx + 1}`}
                      loading="lazy"
                      onClick={() => setViewerIndex(idx)}
                      style={{ cursor: 'zoom-in' }}
                      title={t('card.click_zoom', 'Bấm để xem to')}
                    />
                  ) : (
                    <div className="nn-editor-img-unavailable" role="status">
                      {imageSourcesLoading ? 'Đang tải ảnh…' : 'Không tải được ảnh'}
                    </div>
                  )}
                  {!isReadOnly && (
                    <button
                      className="nn-editor-img-remove"
                      onClick={() => handleRemoveImage(idx)}
                      title={t('editor.delete_image', 'Xoá hình')}
                      aria-label={`${t('editor.delete_image', 'Xoá hình')} ${idx + 1}`}
                      type="button"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {inlineImages.length > 0 && (
            <div className="nn-editor-inline-images" aria-label="Ảnh đã lưu trong nội dung">
              <p>
                {unresolvedUnsupportedImageIndices.length
                  ? `${unresolvedUnsupportedImageIndices.length} ảnh nội tuyến chưa có trong danh sách ảnh của ghi chú. Xóa vị trí giữ ảnh trong nội dung để lưu mà không mất ảnh.`
                  : 'Ảnh đã lưu trong nội dung được giữ nguyên tại vị trí hiện tại khi lưu.'}
              </p>
              <div className="nn-editor-images">
                {visibleInlineImageIndices.map((idx) => {
                  const inlineImage = inlineImages[idx];
                  const source = imageSources[images.length + idx];
                  return source ? (
                    <img
                      key={`${inlineImage.url}-${idx}`}
                      className="nn-editor-img"
                      src={source}
                      alt={inlineImage.alt || `Ảnh nội dung ${idx + 1}`}
                      onClick={() => setViewerIndex(images.length + visibleInlineImageIndices.indexOf(idx))}
                      style={{ cursor: 'zoom-in' }}
                    />
                  ) : (
                    <div key={`${inlineImage.url}-${idx}`} className="nn-editor-img-unavailable" role="status">
                      {imageSourcesLoading ? 'Đang tải ảnh…' : 'Không tải được ảnh'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image Viewer Lightbox */}
          {viewerIndex !== null && (
            <ImageViewer
              images={[...images, ...visibleInlineImageIndices.map((idx) => inlineImages[idx])]}
              imageSources={[
                ...imageSources.slice(0, images.length),
                ...visibleInlineImageIndices.map((idx) => imageSources[images.length + idx]),
              ]}
              imagesLoading={imageSourcesLoading}
              index={viewerIndex}
              onClose={() => setViewerIndex(null)}
              onChange={(i) => setViewerIndex(i)}
            />
          )}

          {/* Toolbar */}
          {!isReadOnly && (
            <div className="nn-toolbar" role="toolbar" aria-label="Định dạng văn bản">
              <ToolbarButton
                id="tb-bold"
                title={t('editor.tb_bold', 'Đậm (Ctrl+B)')}
                isActive={editor?.isActive('bold')}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold size={iconSize} strokeWidth={2.5} />
              </ToolbarButton>
              <ToolbarButton
                id="tb-italic"
                title={t('editor.tb_italic', 'Nghiêng (Ctrl+I)')}
                isActive={editor?.isActive('italic')}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic size={iconSize} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                id="tb-underline"
                title={t('editor.tb_underline', 'Gạch chân (Ctrl+U)')}
                isActive={editor?.isActive('underline')}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <Underline size={iconSize} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                id="tb-strike"
                title={t('editor.tb_strike', 'Gạch ngang')}
                isActive={editor?.isActive('strike')}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
              >
                <Strikethrough size={iconSize} strokeWidth={2} />
              </ToolbarButton>

              <div className="nn-toolbar-sep" />

              <ToolbarButton
                id="tb-highlight"
                title={t('editor.tb_highlight', 'Highlight')}
                isActive={editor?.isActive('highlight')}
                onClick={() => editor?.chain().focus().toggleHighlight().run()}
              >
                <Highlighter size={iconSize} strokeWidth={2} />
              </ToolbarButton>

              <div className="nn-toolbar-sep" />

              <ToolbarButton
                id="tb-ul"
                title={t('editor.tb_bullet_list', 'Danh sách')}
                isActive={editor?.isActive('bulletList')}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <List size={iconSize} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                id="tb-ol"
                title={t('editor.tb_ordered_list', 'Danh sách số')}
                isActive={editor?.isActive('orderedList')}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered size={iconSize} strokeWidth={2} />
              </ToolbarButton>

              <div className="nn-toolbar-sep" />

              <ToolbarButton
                id="tb-align-left"
                title={t('editor.tb_align_left', 'Căn trái')}
                isActive={editor?.isActive({ textAlign: 'left' })}
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              >
                <AlignLeft size={iconSize} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                id="tb-align-center"
                title={t('editor.tb_align_center', 'Căn giữa')}
                isActive={editor?.isActive({ textAlign: 'center' })}
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              >
                <AlignCenter size={iconSize} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                id="tb-align-right"
                title={t('editor.tb_align_right', 'Căn phải')}
                isActive={editor?.isActive({ textAlign: 'right' })}
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              >
                <AlignRight size={iconSize} strokeWidth={2} />
              </ToolbarButton>
            </div>
          )}

          {/* Content */}
          <div
            className="nn-tiptap-wrap"
            onClick={() => editor?.commands.focus()}
            onChange={triggerAutoSave}
          >
            <EditorContent editor={editor} onKeyUp={triggerAutoSave} />
          </div>

          {/* Color picker inline */}
          {showColorPicker && (
            <NoteColorPicker
              bgColor={bgColor}
              bgPattern={bgPattern}
              onChange={handleColorChange}
            />
          )}

          {/* Version History Drawer / Panel */}
          {!isReadOnly && showHistoryPanel && (
            <div
              id="note-history-panel"
              style={{
                margin: '0 20px 12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={14} strokeWidth={2.2} style={{ color: 'var(--accent)' }} />
                  {userIsLoggedIn
                    ? t('editor.history_title_user', 'Lịch sử chỉnh sửa (Server lưu tối đa 5 lần hoàn tác)')
                    : t('editor.history_title_guest', 'Lịch sử chỉnh sửa (Lưu trên trình duyệt thiết bị)')}
                </span>
                {effectiveHistory.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleQuickUndoStep}
                    id="btn-history-undo-latest"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <RotateCcw size={12} strokeWidth={2.2} />
                    {t('editor.history_back_once', 'Lùi 1 bước')}
                  </button>
                )}
              </div>

              {effectiveHistory.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('editor.history_empty', 'Chưa có bản lưu trước đó. Khi bạn gõ, các phiên bản trước sẽ tự động được lưu tại đây.')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 165, overflowY: 'auto' }}>
                  {effectiveHistory.map((rev, idx) => {
                    const previewText = stripHtml(rev.content || '') || rev.title || t('card.untitled', 'Không có tiêu đề');
                    const timeStr = rev.savedAt
                      ? new Date(rev.savedAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '';
                    return (
                      <div
                        key={`${rev.savedAt || idx}-${idx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            #{idx + 1} · {rev.title ? `${rev.title} — ` : ''}{previewText.slice(0, 80)}
                          </div>
                          {timeStr && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {timeStr}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleRestoreRevision(rev, idx)}
                          id={`btn-restore-history-${idx}`}
                          style={{ padding: '4px 10px', fontSize: '0.74rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <RotateCcw size={12} strokeWidth={2} />
                          {t('editor.history_restore', 'Khôi phục')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {(error || imageLoadFailedCount > 0) && (
            <div role="alert" style={{ padding: '0 20px 8px', fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={13} strokeWidth={2} />
              {error || `Không tải được ${imageLoadFailedCount} ảnh đính kèm.`}
            </div>
          )}

          {/* Footer */}
          <div className="nn-editor-footer">
            <div className="nn-editor-actions">
              {!isReadOnly && (
                <>
                  {/* Image upload */}
                  {images.length < 2 && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                        id="note-image-upload"
                        aria-label={t('editor.upload_image', 'Upload hình ảnh')}
                      />
                      <button
                        className="btn btn-ghost btn-icon"
                        title={t('editor.upload_image_count', `Upload hình (${images.length}/2)`, { count: images.length })}
                        aria-label={t('editor.upload_image', 'Upload hình ảnh')}
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        id="btn-upload-image"
                      >
                        {uploading
                          ? <Loader2 size={16} strokeWidth={2} className="nn-spin" />
                          : <ImageIcon size={16} strokeWidth={2} />
                        }
                      </button>
                    </>
                  )}

                  {/* Color picker toggle */}
                  <button
                    className={`btn btn-ghost btn-icon${showColorPicker ? ' text-accent' : ''}`}
                    title={t('editor.color_picker', 'Màu nền và hoa văn')}
                    aria-label={t('editor.color_picker', 'Màu nền và hoa văn')}
                    aria-expanded={showColorPicker}
                    type="button"
                    onClick={() => setShowColorPicker((v) => !v)}
                    id="btn-color-picker"
                  >
                    <Palette size={16} strokeWidth={2} />
                  </button>

                  {/* Direct Note Password Lock button (only on user's board, not share link view) */}
                  {!shareToken && (
                    <button
                      className={`btn btn-ghost btn-icon${hasPassword ? ' text-accent' : ''}`}
                      title={
                        hasPassword
                          ? t('card.action_password_manage', 'Đổi / Gỡ mật khẩu ghi chú')
                          : t('card.action_password_set', 'Đặt mật khẩu ghi chú')
                      }
                      aria-label={
                        hasPassword
                          ? t('card.action_password_manage', 'Đổi / Gỡ mật khẩu ghi chú')
                          : t('card.action_password_set', 'Đặt mật khẩu ghi chú')
                      }
                      type="button"
                      onClick={handleOpenPasswordSettings}
                      id="btn-editor-password"
                    >
                      {hasPassword ? <Lock size={16} strokeWidth={2.2} /> : <Unlock size={16} strokeWidth={2} />}
                    </button>
                  )}

                  {/* Version History / Back toggle */}
                  <button
                    className={`btn btn-ghost btn-icon${showHistoryPanel ? ' text-accent' : ''}`}
                    title={t('editor.history_btn', `Lịch sử chỉnh sửa / Hoàn tác (${effectiveHistory.length})`)}
                    aria-label={t('editor.history_btn', 'Lịch sử chỉnh sửa / Hoàn tác')}
                    aria-expanded={showHistoryPanel}
                    type="button"
                    onClick={() => setShowHistoryPanel((v) => !v)}
                    id="btn-editor-history"
                    style={{ position: 'relative' }}
                  >
                    <History size={16} strokeWidth={2} />
                    {effectiveHistory.length > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          minWidth: 14,
                          height: 14,
                          borderRadius: 999,
                          background: '#047857',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 3px',
                        }}
                      >
                        {effectiveHistory.length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Char counter — hide in read-only mode */}
              {!isReadOnly && (
                <span
                  className={`nn-char-counter${overLimit ? ' over' : nearLimit ? ' warn' : ''}`}
                  aria-live="polite"
                >
                  {chars.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}/{MAX_CHARS.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}
                </span>
              )}

              {!isReadOnly && (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await handleSave(false, true);
                  }}
                  disabled={saving || overLimit}
                  id="btn-save-note"
                  type="button"
                >
                  {saving
                    ? <><Loader2 size={14} strokeWidth={2} className="nn-spin" /> {t('editor.btn_saving', 'Đang lưu…')}</>
                    : <><Check size={14} strokeWidth={2.5} /> {isNew && !activeNoteId ? t('editor.btn_create', 'Tạo note') : t('editor.btn_save', 'Lưu')}</>
                  }
                </button>
              )}

              {!isReadOnly && (
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    clearTimeout(autoSaveTimer.current);
                    await handleSave(true, false);
                    onClose();
                  }}
                  id="btn-close-editor"
                  type="button"
                >
                  {t('editor.btn_close', 'Đóng')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && activeNoteIdRef.current && (
        <NotePasswordModal
          note={{ id: activeNoteIdRef.current, hasPassword }}
          mode="manage"
          onClose={() => setShowPasswordModal(false)}
          onPasswordChanged={({ hasPassword: nextHasPw, unlockedPassword, updated }) => {
            setHasPassword(nextHasPw);
            onPasswordChanged?.(activeNoteIdRef.current, {
              hasPassword: nextHasPw,
              unlockedPassword,
              updated,
            });
          }}
        />
      )}
    </div>
  );
}
