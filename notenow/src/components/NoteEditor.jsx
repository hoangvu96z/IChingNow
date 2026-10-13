import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import React, { useState, useEffect, useRef } from 'react';
import { notesApi, charCount, compressImageTo720p } from '../api.js';
import NoteColorPicker from './NoteColorPicker.jsx';
import ImageViewer from './ImageViewer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

// Lucide React icons
import {
  Bold, Italic, Underline, Strikethrough,
  Highlighter, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Palette, X, Check,
  Loader2, AlertCircle, Eye, Pencil, Plus,
} from 'lucide-react';

// TipTap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import UnderlineExt from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

const SSO_BASE = getSsoApiBase(import.meta.env);

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

export default function NoteEditor({ note, isNew, onSave, onClose, isReadOnly = false, userIsLoggedIn, shareToken }) {
  const { t } = useLanguage();
  const MAX_CHARS = userIsLoggedIn ? 10000 : 2048;

  const [activeNoteId, setActiveNoteId] = useState(note?.id || null);
  const [title, setTitle] = useState(note?.title || '');
  const [bgColor, setBgColor] = useState(note?.bgColor || 'default');
  const [bgPattern, setBgPattern] = useState(note?.bgPattern || 'none');
  const [images, setImages] = useState(note?.images || []);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null); // null = closed
  const fileInputRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // Auto-save debounce for existing notes
  const triggerAutoSave = () => {
    if (isReadOnly || (!activeNoteId && isNew && !shareToken)) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave(true);
    }, 1200);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({ types: ['paragraph'] }),
      TextStyle,
      UnderlineExt,
      Placeholder.configure({ placeholder: t('editor.content_placeholder', 'Viết ghi chú của bạn ở đây…') }),
    ],
    content: note?.content || '',
    editable: !isReadOnly,
    immediatelyRender: false,
    onUpdate: () => {
      triggerAutoSave();
    },
  });

  const currentContent = editor?.getHTML() || '';
  const chars = charCount(currentContent);
  const overLimit = chars > MAX_CHARS;
  const nearLimit = chars > MAX_CHARS * 0.85;

  const handleSave = async (silent = false, closeAfter = false, overrides = {}) => {
    if (overLimit) return;
    clearTimeout(autoSaveTimer.current);
    if (!silent) setSaving(true);
    setError(null);
    try {
      const finalBgColor = overrides.bgColor !== undefined ? overrides.bgColor : bgColor;
      const finalBgPattern = overrides.bgPattern !== undefined ? overrides.bgPattern : bgPattern;
      const dto = {
        title: title.trim() || null,
        content: currentContent,
        bgColor: finalBgColor,
        bgPattern: finalBgPattern,
      };
      const result = await onSave(dto, activeNoteId, { silent });
      if (result?.id) {
        setActiveNoteId(result.id);
      }
      if (closeAfter) {
        onClose();
      }
      return result;
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setSaving(false);
    }
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
      let targetId = activeNoteId;
      // If new note without ID yet, create draft first
      if (!targetId && !shareToken) {
        const dto = {
          title: title.trim() || null,
          content: currentContent,
          bgColor,
          bgPattern,
        };
        const saved = await onSave(dto);
        if (saved?.id) {
          targetId = saved.id;
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
      } else if (activeNoteId) {
        await notesApi.deleteImage(activeNoteId, idx);
      }
      setImages((prev) => prev.filter((_, i) => i !== idx));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleColorChange = (updates) => {
    if (updates.bgColor !== undefined) setBgColor(updates.bgColor);
    if (updates.bgPattern !== undefined) setBgPattern(updates.bgPattern);
    if (activeNoteId || !isNew || shareToken) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(true, false, updates);
      }, 400);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearTimeout(autoSaveTimer.current);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
          <div className="nn-editor-badge">
            <span>
              {isNew
                ? <><Plus size={14} strokeWidth={2.5} /> {t('editor.badge_new', 'Ghi chú mới')}</>
                : isReadOnly
                ? <><Eye size={14} strokeWidth={2} /> {t('editor.badge_viewing', 'Đang xem ghi chú')}</>
                : <><Pencil size={14} strokeWidth={2} /> {t('editor.badge_editing', 'Chỉnh sửa ghi chú')}</>
              }
            </span>
          </div>
          {!isReadOnly && (
            <button
              className="nn-modal-close"
              onClick={async () => {
                clearTimeout(autoSaveTimer.current);
                if (activeNoteId || !isNew || shareToken) {
                  await handleSave(true, false);
                }
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
              {images.map((img, idx) => (
                <div key={idx} className="nn-editor-img-wrap">
                  <img
                    className="nn-editor-img"
                    src={img.url.startsWith('data:') || img.url.startsWith('http') ? img.url : `${SSO_BASE}${img.url}`}
                    alt={`Hình ${idx + 1}`}
                    loading="lazy"
                    onClick={() => setViewerIndex(idx)}
                    style={{ cursor: 'zoom-in' }}
                    title={t('card.click_zoom', 'Bấm để xem to')}
                  />
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

          {/* Image Viewer Lightbox */}
          {viewerIndex !== null && (
            <ImageViewer
              images={images}
              index={viewerIndex}
              onClose={() => setViewerIndex(null)}
              onChange={(i) => setViewerIndex(i)}
              ssoBase={SSO_BASE}
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

          {/* Error */}
          {error && (
            <div style={{ padding: '0 20px 8px', fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={13} strokeWidth={2} />
              {error}
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
                  {chars.toLocaleString()}/{MAX_CHARS.toLocaleString()}
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
                    : <><Check size={14} strokeWidth={2.5} /> {isNew ? t('editor.btn_create', 'Tạo note') : t('editor.btn_save', 'Lưu')}</>
                  }
                </button>
              )}

              {!isReadOnly && (
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    clearTimeout(autoSaveTimer.current);
                    if (activeNoteId || !isNew || shareToken) {
                      await handleSave(true, false);
                    }
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
    </div>
  );
}
