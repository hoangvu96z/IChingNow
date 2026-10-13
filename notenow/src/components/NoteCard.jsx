import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import React, { useState } from 'react';
import { getDaysRemaining, stripHtml } from '../api.js';
import ImageViewer from './ImageViewer.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  GripVertical, Pin, Infinity as InfinityIcon,
  Users, User, Clock, Link2, Lock,
  Pencil, Trash2,
} from 'lucide-react';

const SSO_BASE = getSsoApiBase(import.meta.env);

export default function NoteCard({ note, onEdit, onDelete, onShare, onPin, onPermanent, isShared }) {
  const { t } = useLanguage();
  const [deleting, setDeleting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const daysLeft = getDaysRemaining(note.expiresAt);
  const contentPreview = stripHtml(note.content || '');

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(t('card.delete_confirm', 'Xoá ghi chú này?'))) return;
    setDeleting(true);
    try {
      await onDelete(note.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`nn-card${note.isPinned ? ' pinned' : ''}${note.isPermanent ? ' permanent' : ''}`}
      data-bg={note.bgColor || 'default'}
      data-pattern={note.bgPattern || 'none'}
      onClick={() => onEdit(note)}
      role="button"
      tabIndex={0}
      aria-label={`${t('editor.badge_new', 'Ghi chú')}: ${note.title || t('card.untitled', 'Không có tiêu đề')}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(note); }}
      style={{ opacity: deleting ? 0.5 : 1 }}
    >
      {/* Drag Handle — only for own notes */}
      {!isShared && (
        <div
          className="nn-card-drag-handle"
          title={t('card.drag_title', 'Kéo để sắp xếp vị trí')}
          aria-label={t('card.drag_title', 'Kéo để sắp xếp vị trí')}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
      )}

      {note.isPinned && (
        <span className="nn-pin-icon" aria-label={t('board.section_pinned', 'Đã ghim')} title={t('board.section_pinned', 'Đã ghim')}>
          <Pin size={13} fill="currentColor" strokeWidth={1.5} />
        </span>
      )}

      {note.isPermanent && (
        <span className="nn-permanent-icon" aria-label={t('card.badge_permanent', 'Lưu vĩnh viễn')} title={t('card.tooltip_permanent', 'Lưu vĩnh viễn — không tự xoá')}>
          <InfinityIcon size={14} strokeWidth={2.2} />
        </span>
      )}

      {/* Images */}
      {note.images?.length > 0 && (
        <div
          className={`nn-card-images${note.images.length === 1 ? ' single' : ''}`}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          {note.images.map((img, idx) => (
            <img
              key={idx}
              className="nn-card-img"
              src={img.url.startsWith('data:') || img.url.startsWith('http') ? img.url : `${SSO_BASE}${img.url}`}
              alt={`Ảnh ${idx + 1}`}
              loading="lazy"
              onClick={(e) => { e.stopPropagation(); setViewerIndex(idx); }}
              style={{ cursor: 'zoom-in' }}
              title={t('card.click_zoom', 'Bấm để xem to')}
            />
          ))}
        </div>
      )}

      {/* Image Viewer Lightbox */}
      {viewerIndex !== null && (
        <ImageViewer
          images={note.images}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onChange={(i) => setViewerIndex(i)}
          ssoBase={SSO_BASE}
        />
      )}

      {/* Title */}
      {note.title && (
        <h3 className="nn-card-title">{note.title}</h3>
      )}

      {/* Content preview */}
      {contentPreview && (
        <div
          className="nn-card-content"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      )}

      {/* Footer */}
      <div className="nn-card-footer">
        <div className="nn-card-badges">
          {isShared && (
            <span className="nn-badge nn-badge-shared" title={t('board.section_shared', 'Được chia sẻ với bạn')}>
              <Users size={11} strokeWidth={2} /> {t('card.badge_shared', 'Được share')}
            </span>
          )}
          {!isShared && note.isGuest && (
            <span className="nn-badge nn-badge-guest" title={t('board.empty_guest_desc', 'Ghi chú không đăng nhập')}>
              <User size={11} strokeWidth={2} /> {t('card.badge_guest', 'Khách')}
            </span>
          )}
          {note.isPermanent && (
            <span className="nn-badge nn-badge-permanent" title={t('card.tooltip_permanent', 'Lưu vĩnh viễn — không tự xoá')}>
              <InfinityIcon size={11} strokeWidth={2.2} /> {t('card.badge_permanent', 'Vĩnh viễn')}
            </span>
          )}
          {daysLeft !== null && daysLeft <= 30 && !note.isPermanent && (
            <span
              className="nn-badge nn-badge-expiry"
              title={t('card.tooltip_expiry', `Ghi chú sẽ xoá sau ${daysLeft} ngày`, { days: daysLeft })}
            >
              <Clock size={11} strokeWidth={2} /> {daysLeft}d
            </span>
          )}
          {note.shareMode !== 'none' && (
            <span className="nn-badge nn-badge-shared" title={t('share.link_section', 'Đang chia sẻ liên kết')}>
              <Link2 size={11} strokeWidth={2} />
            </span>
          )}
          {note.sharePassword && (
            <span className="nn-badge nn-badge-locked" title={t('share.password_title', 'Được bảo vệ bằng mật khẩu')}>
              <Lock size={11} strokeWidth={2} />
            </span>
          )}
        </div>

        {!isShared && (
          <div className="nn-card-actions" onClick={(e) => e.stopPropagation()}>
            {/* Pin */}
            <button
              className={`nn-card-action${note.isPinned ? ' active' : ''}`}
              title={note.isPinned ? t('card.action_unpin', 'Bỏ ghim') : t('card.action_pin', 'Ghim')}
              aria-label={note.isPinned ? t('card.action_unpin', 'Bỏ ghim') : t('card.action_pin', 'Ghim')}
              onClick={(e) => { e.stopPropagation(); onPin(note.id, !note.isPinned); }}
              type="button"
              id={`btn-pin-${note.id}`}
            >
              <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>

            {/* Permanent toggle */}
            <button
              className={`nn-card-action${note.isPermanent ? ' active' : ''}`}
              title={note.isPermanent ? t('card.action_unpermanent', 'Bỏ lưu vĩnh viễn') : t('card.action_permanent', 'Lưu vĩnh viễn')}
              aria-label={note.isPermanent ? t('card.action_unpermanent', 'Bỏ lưu vĩnh viễn') : t('card.action_permanent', 'Lưu vĩnh viễn')}
              onClick={(e) => { e.stopPropagation(); onPermanent(note.id, !note.isPermanent); }}
              type="button"
              id={`btn-permanent-${note.id}`}
            >
              <InfinityIcon size={14} strokeWidth={2} />
            </button>

            {/* Share */}
            <button
              className="nn-card-action"
              title={t('card.action_share', 'Chia sẻ')}
              aria-label={t('card.action_share', 'Chia sẻ')}
              onClick={(e) => { e.stopPropagation(); onShare(note); }}
              type="button"
              id={`btn-share-${note.id}`}
            >
              <Link2 size={14} strokeWidth={2} />
            </button>

            {/* Edit */}
            <button
              className="nn-card-action"
              title={t('card.action_edit', 'Chỉnh sửa')}
              aria-label={t('card.action_edit', 'Chỉnh sửa')}
              onClick={(e) => { e.stopPropagation(); onEdit(note); }}
              type="button"
              id={`btn-edit-${note.id}`}
            >
              <Pencil size={14} strokeWidth={2} />
            </button>

            {/* Delete */}
            <button
              className="nn-card-action danger"
              title={t('card.action_delete', 'Xoá')}
              aria-label={t('card.action_delete', 'Xoá')}
              onClick={handleDelete}
              type="button"
              id={`btn-delete-${note.id}`}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
