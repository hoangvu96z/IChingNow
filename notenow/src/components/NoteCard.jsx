import { getSsoApiBase } from '../../../shared/src/utils/ssoConfig.mjs';
import React, { useState } from 'react';
import { getDaysRemaining, stripHtml } from '../api.js';
import ImageViewer from './ImageViewer.jsx';
import {
  GripVertical, Pin, Infinity as InfinityIcon,
  Users, User, Clock, Link2, Lock,
  Pencil, Trash2,
} from 'lucide-react';

const SSO_BASE = getSsoApiBase(import.meta.env);

export default function NoteCard({ note, onEdit, onDelete, onShare, onPin, onPermanent, isShared }) {
  const [deleting, setDeleting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const daysLeft = getDaysRemaining(note.expiresAt);
  const contentPreview = stripHtml(note.content || '');

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Xoá ghi chú này?')) return;
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
      aria-label={`Ghi chú: ${note.title || 'Không có tiêu đề'}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(note); }}
      style={{ opacity: deleting ? 0.5 : 1 }}
    >
      {/* Drag Handle — only for own notes */}
      {!isShared && (
        <div
          className="nn-card-drag-handle"
          title="Kéo để sắp xếp vị trí"
          aria-label="Kéo thả để sắp xếp"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
      )}

      {note.isPinned && (
        <span className="nn-pin-icon" aria-label="Đã ghim" title="Đã ghim">
          <Pin size={13} fill="currentColor" strokeWidth={1.5} />
        </span>
      )}

      {note.isPermanent && (
        <span className="nn-permanent-icon" aria-label="Lưu vĩnh viễn" title="Ghi chú vĩnh viễn">
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
              alt={`Ảnh ${idx + 1} trong ghi chú`}
              loading="lazy"
              onClick={(e) => { e.stopPropagation(); setViewerIndex(idx); }}
              style={{ cursor: 'zoom-in' }}
              title="Bấm để xem to"
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
            <span className="nn-badge nn-badge-shared" title="Được chia sẻ với bạn">
              <Users size={11} strokeWidth={2} /> Được share
            </span>
          )}
          {!isShared && note.isGuest && (
            <span className="nn-badge nn-badge-guest" title="Ghi chú không đăng nhập">
              <User size={11} strokeWidth={2} /> Khách
            </span>
          )}
          {note.isPermanent && (
            <span className="nn-badge nn-badge-permanent" title="Lưu vĩnh viễn — không tự xoá">
              <InfinityIcon size={11} strokeWidth={2.2} /> Vĩnh viễn
            </span>
          )}
          {daysLeft !== null && daysLeft <= 30 && !note.isPermanent && (
            <span
              className="nn-badge nn-badge-expiry"
              title={`Ghi chú sẽ xoá sau ${daysLeft} ngày`}
            >
              <Clock size={11} strokeWidth={2} /> {daysLeft}d
            </span>
          )}
          {note.shareMode !== 'none' && (
            <span className="nn-badge nn-badge-shared" title="Đang chia sẻ liên kết">
              <Link2 size={11} strokeWidth={2} />
            </span>
          )}
          {note.sharePassword && (
            <span className="nn-badge nn-badge-locked" title="Được bảo vệ bằng mật khẩu">
              <Lock size={11} strokeWidth={2} />
            </span>
          )}
        </div>

        {!isShared && (
          <div className="nn-card-actions" onClick={(e) => e.stopPropagation()}>
            {/* Pin */}
            <button
              className={`nn-card-action${note.isPinned ? ' active' : ''}`}
              title={note.isPinned ? 'Bỏ ghim' : 'Ghim'}
              aria-label={note.isPinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'}
              onClick={(e) => { e.stopPropagation(); onPin(note.id, !note.isPinned); }}
              type="button"
              id={`btn-pin-${note.id}`}
            >
              <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>

            {/* Permanent toggle */}
            <button
              className={`nn-card-action${note.isPermanent ? ' active' : ''}`}
              title={note.isPermanent ? 'Bỏ lưu vĩnh viễn' : 'Lưu vĩnh viễn (không tự xoá)'}
              aria-label={note.isPermanent ? 'Bỏ lưu vĩnh viễn' : 'Đặt lưu vĩnh viễn'}
              onClick={(e) => { e.stopPropagation(); onPermanent(note.id, !note.isPermanent); }}
              type="button"
              id={`btn-permanent-${note.id}`}
            >
              <InfinityIcon size={14} strokeWidth={2} />
            </button>

            {/* Share */}
            <button
              className="nn-card-action"
              title="Chia sẻ"
              aria-label="Chia sẻ ghi chú"
              onClick={(e) => { e.stopPropagation(); onShare(note); }}
              type="button"
              id={`btn-share-${note.id}`}
            >
              <Link2 size={14} strokeWidth={2} />
            </button>

            {/* Edit */}
            <button
              className="nn-card-action"
              title="Chỉnh sửa"
              aria-label="Chỉnh sửa ghi chú"
              onClick={(e) => { e.stopPropagation(); onEdit(note); }}
              type="button"
              id={`btn-edit-${note.id}`}
            >
              <Pencil size={14} strokeWidth={2} />
            </button>

            {/* Delete */}
            <button
              className="nn-card-action danger"
              title="Xoá"
              aria-label="Xoá ghi chú"
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
