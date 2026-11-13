import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import { attachDialogLightDismiss } from '../../../shared/src/utils/pwaInstall.mjs';
import { GIO_SINH_OPTIONS } from '../utils/lunarConverter.js';
import {
  PROFILE_RELATIONS,
  extractProfileDraftFromInputData,
  saveProfile,
  deleteProfile,
  setDefaultSelfProfile,
  stageHopHonProfilesHandoff,
} from '../utils/tuviProfiles.js';

export default function SavedProfilesBar({
  profiles = [],
  onProfilesChange,
  activeInputData = null,
  formDraftData = null,
  onSelectProfile,
  onOpenHopHonPair,
  compact = false,
}) {
  const [relationFilter, setRelationFilter] = useState('all');
  const [statusToast, setStatusToast] = useState('');

  // Modal Lưu / Sửa hồ sơ
  const saveDialogRef = useRef(null);
  const saveTitleId = useId();
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [profName, setProfName] = useState('');
  const [profRelation, setProfRelation] = useState('self');
  const [profIsDefault, setProfIsDefault] = useState(false);

  // Modal Chọn 2 hồ sơ sang Hợp Hôn
  const pairDialogRef = useRef(null);
  const pairTitleId = useId();
  const [isPairOpen, setIsPairOpen] = useState(false);
  const [pairIdA, setPairIdA] = useState('');
  const [pairIdB, setPairIdB] = useState('');
  const [pairError, setPairError] = useState('');

  useEffect(() => {
    const cleanups = [];
    if (saveDialogRef.current) cleanups.push(attachDialogLightDismiss(saveDialogRef.current));
    if (pairDialogRef.current) cleanups.push(attachDialogLightDismiss(pairDialogRef.current));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    const d = saveDialogRef.current;
    if (!d) return;
    if (isSaveOpen) {
      if (!d.open && typeof d.showModal === 'function') {
        try { d.showModal(); } catch {}
      }
    } else if (d.open && typeof d.close === 'function') {
      d.close();
    }
  }, [isSaveOpen]);

  useEffect(() => {
    const d = pairDialogRef.current;
    if (!d) return;
    if (isPairOpen) {
      if (!d.open && typeof d.showModal === 'function') {
        try { d.showModal(); } catch {}
      }
    } else if (d.open && typeof d.close === 'function') {
      d.close();
    }
  }, [isPairOpen]);

  const sourceData = activeInputData || formDraftData;

  const matchedActiveProfile = useMemo(() => {
    if (!sourceData || !profiles.length) return null;
    if (sourceData.profileId) {
      const byId = profiles.find((p) => p.id === sourceData.profileId);
      if (byId) return byId;
    }
    const draft = extractProfileDraftFromInputData(sourceData);
    return (
      profiles.find(
        (p) =>
          p.name.toLowerCase() === draft.name.toLowerCase() &&
          p.day === draft.day &&
          p.month === draft.month &&
          p.year === draft.year &&
          p.hourValue === draft.hourValue &&
          p.gender === draft.gender,
      ) || null
    );
  }, [sourceData, profiles]);

  const defaultSelfProfile = useMemo(
    () => profiles.find((p) => p.isDefaultSelf) || null,
    [profiles],
  );

  const filteredProfiles = useMemo(() => {
    if (relationFilter === 'all') return profiles;
    return profiles.filter((p) => p.relation === relationFilter);
  }, [profiles, relationFilter]);

  const showNotice = (msg) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((curr) => (curr === msg ? '' : curr));
    }, 3500);
  };

  const openSaveDialog = () => {
    if (!sourceData) return;
    const draft = extractProfileDraftFromInputData(sourceData);
    if (matchedActiveProfile) {
      setEditingId(matchedActiveProfile.id);
      setProfName(matchedActiveProfile.name);
      setProfRelation(matchedActiveProfile.relation);
      setProfIsDefault(Boolean(matchedActiveProfile.isDefaultSelf));
    } else {
      setEditingId(null);
      setProfName(draft.name === 'Đương số' ? '' : draft.name);
      setProfRelation(profiles.length === 0 ? 'self' : 'other');
      setProfIsDefault(profiles.length === 0);
    }
    setIsSaveOpen(true);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!sourceData) return;
    const draft = extractProfileDraftFromInputData(sourceData);
    const cleanName = profName.trim() || draft.name || 'Đương số';

    const { profile, profiles: nextList } = saveProfile({
      ...(editingId ? { id: editingId } : {}),
      ...draft,
      name: cleanName,
      relation: profRelation,
      isDefaultSelf: profIsDefault,
      lifeEvents: sourceData.lifeEvents || matchedActiveProfile?.lifeEvents || [],
    });

    if (onProfilesChange) onProfilesChange(nextList, profile);
    setIsSaveOpen(false);
    showNotice(
      profIsDefault
        ? `⭐ Đã lưu "${profile.name}" làm Lá số mặc định của tôi`
        : `💾 Đã lưu hồ sơ "${profile.name}" vào Danh bạ`,
    );
  };

  const handleTogglePinDefault = (profile) => {
    const nextDefault = !profile.isDefaultSelf;
    const nextList = setDefaultSelfProfile(profile.id, nextDefault);
    if (onProfilesChange) onProfilesChange(nextList);
    showNotice(
      nextDefault
        ? `⭐ Đã ghim "${profile.name}" làm Lá số mặc định`
        : `Đã bỏ ghim mặc định cho "${profile.name}"`,
    );
  };

  const handleDelete = (profile) => {
    const nextList = deleteProfile(profile.id);
    if (onProfilesChange) onProfilesChange(nextList);
    showNotice(`Đã xóa hồ sơ "${profile.name}" khỏi Danh bạ`);
  };

  const openHopHonSelector = () => {
    if (profiles.length < 2) return;
    const maleFirst = profiles.find((p) => p.gender === 1) || profiles[0];
    const femaleSecond =
      profiles.find((p) => p.id !== maleFirst.id && p.gender === 0) ||
      profiles.find((p) => p.id !== maleFirst.id) ||
      profiles[1];
    setPairIdA(maleFirst?.id || '');
    setPairIdB(femaleSecond?.id || '');
    setPairError('');
    setIsPairOpen(true);
  };

  const handleLaunchHopHonPair = (e) => {
    e.preventDefault();
    if (!pairIdA || !pairIdB || pairIdA === pairIdB) {
      setPairError('Vui lòng chọn 2 hồ sơ khác nhau cho Bên A và Bên B.');
      return;
    }
    const pA = profiles.find((p) => p.id === pairIdA);
    const pB = profiles.find((p) => p.id === pairIdB);
    if (!pA || !pB) {
      setPairError('Không tìm thấy hồ sơ đã chọn.');
      return;
    }
    stageHopHonProfilesHandoff(pA, pB);
    setIsPairOpen(false);
    if (onOpenHopHonPair) {
      onOpenHopHonPair(pA, pB);
    } else {
      window.location.hash = 'hop-hon';
    }
  };

  return (
    <section
      className={`tv-profiles-bar ${compact ? 'is-compact' : ''}`}
      aria-label="Danh bạ hồ sơ đương số đã lưu"
    >
      {/* Banner 1-click mở lá số mặc định khi mới vào trang */}
      {!activeInputData && defaultSelfProfile && onSelectProfile && (
        <div className="tv-default-self-banner">
          <div className="tv-default-self-info">
            <span className="tv-default-star" aria-hidden="true">⭐</span>
            <div>
              <strong>Lá số mặc định của tôi: {defaultSelfProfile.name}</strong>
              <span>
                {defaultSelfProfile.gender === 0 ? 'Nữ' : 'Nam'} ·{' '}
                {defaultSelfProfile.day}/{defaultSelfProfile.month}/{defaultSelfProfile.year} (
                {defaultSelfProfile.calendarType === 'lunar' ? 'ÂL' : 'DL'}) · Giờ {defaultSelfProfile.hourBranch}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="tv-default-open-btn"
            onClick={() => onSelectProfile(defaultSelfProfile, true)}
          >
            ⚡ Mở lá số ngay
          </button>
        </div>
      )}

      <div className="tv-profiles-top-row">
        <div className="tv-profiles-heading">
          <span aria-hidden="true">📒</span>
          <strong>Danh bạ Đương số ({profiles.length})</strong>
          <span className="tv-profiles-sub">Chuyển nhanh hồ sơ gia đình / khách xem mà không lẫn vào lịch sử</span>
        </div>

        <div className="tv-profiles-actions">
          {sourceData && (
            <button
              type="button"
              className="tv-prof-action-btn is-save"
              onClick={openSaveDialog}
            >
              <span aria-hidden="true">{matchedActiveProfile ? '✓' : '💾'}</span>
              <span>
                {matchedActiveProfile
                  ? `Cập nhật hồ sơ (${matchedActiveProfile.name})`
                  : 'Lưu vào Danh bạ'}
              </span>
            </button>
          )}

          {profiles.length >= 2 && (
            <button
              type="button"
              className="tv-prof-action-btn is-hophon"
              onClick={openHopHonSelector}
            >
              <span aria-hidden="true">💞</span>
              <span>Đưa 2 hồ sơ sang Hợp Hôn</span>
            </button>
          )}
        </div>
      </div>

      {statusToast && (
        <div className="tv-profiles-toast" role="status">
          {statusToast}
        </div>
      )}

      {profiles.length > 0 && (
        <>
          <div className="tv-profiles-filters" role="group" aria-label="Lọc hồ sơ theo mối quan hệ">
            <button
              type="button"
              className={`tv-prof-filter-pill ${relationFilter === 'all' ? 'is-active' : ''}`}
              aria-pressed={relationFilter === 'all'}
              onClick={() => setRelationFilter('all')}
            >
              Tất cả ({profiles.length})
            </button>
            {PROFILE_RELATIONS.map((rel) => {
              const count = profiles.filter((p) => p.relation === rel.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={rel.id}
                  type="button"
                  className={`tv-prof-filter-pill ${relationFilter === rel.id ? 'is-active' : ''}`}
                  aria-pressed={relationFilter === rel.id}
                  onClick={() => setRelationFilter(rel.id)}
                >
                  <span aria-hidden="true">{rel.icon}</span> {rel.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="tv-profiles-chips-list">
            {filteredProfiles.map((prof) => {
              const relMeta = PROFILE_RELATIONS.find((r) => r.id === prof.relation) || PROFILE_RELATIONS[5];
              const isCurrent = matchedActiveProfile?.id === prof.id;
              return (
                <div
                  key={prof.id}
                  className={`tv-profile-chip-card ${isCurrent ? 'is-current' : ''} ${prof.isDefaultSelf ? 'is-default' : ''}`}
                >
                  <button
                    type="button"
                    className="tv-profile-chip-main"
                    onClick={() => onSelectProfile && onSelectProfile(prof, Boolean(activeInputData))}
                    title={`Mở lá số ${prof.name} (${prof.day}/${prof.month}/${prof.year} · Giờ ${prof.hourBranch})`}
                  >
                    <span className="tv-prof-chip-icon" aria-hidden="true">
                      {prof.isDefaultSelf ? '⭐' : relMeta.icon}
                    </span>
                    <span className="tv-prof-chip-info">
                      <strong>{prof.name}</strong>
                      <small>
                        {prof.gender === 0 ? '♀ Nữ' : '♂ Nam'} · {prof.day}/{prof.month}/{prof.year}{' '}
                        {prof.calendarType === 'lunar' ? 'ÂL' : 'DL'} · {prof.hourBranch}
                        {prof.lifeEvents?.length > 0 ? ` · 📌${prof.lifeEvents.length}` : ''}
                      </small>
                    </span>
                  </button>

                  <div className="tv-profile-chip-tools">
                    <button
                      type="button"
                      className={`tv-prof-icon-btn ${prof.isDefaultSelf ? 'is-pinned' : ''}`}
                      onClick={() => handleTogglePinDefault(prof)}
                      aria-label={
                        prof.isDefaultSelf
                          ? `Bỏ ghim mặc định cho ${prof.name}`
                          : `Đặt ${prof.name} làm lá số mặc định của tôi`
                      }
                      title={prof.isDefaultSelf ? 'Đang là lá số mặc định của tôi' : 'Đặt làm lá số mặc định của tôi'}
                    >
                      <span aria-hidden="true">★</span>
                    </button>
                    <button
                      type="button"
                      className="tv-prof-icon-btn is-danger"
                      onClick={() => handleDelete(prof)}
                      aria-label={`Xóa hồ sơ ${prof.name}`}
                      title="Xóa khỏi danh bạ"
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Native <dialog> Lưu Hồ Sơ Đương Số */}
      <dialog
        ref={saveDialogRef}
        aria-labelledby={saveTitleId}
        closedby="any"
        className="tv-native-dialog tv-profile-dialog"
        onClose={() => {
          if (saveDialogRef.current) saveDialogRef.current.returnValue = '';
          setIsSaveOpen(false);
        }}
      >
        <div className="tv-dialog-shell tv-dialog-compact">
          <header className="tv-dialog-header">
            <h2 id={saveTitleId} className="tv-dialog-title">
              <span aria-hidden="true">📒</span> {editingId ? 'Cập nhật Hồ sơ Đương số' : 'Lưu vào Danh bạ Đương số'}
            </h2>
            <button
              type="button"
              className="tv-dialog-close-btn"
              onClick={() => saveDialogRef.current?.close()}
              aria-label="Đóng hộp thoại lưu hồ sơ"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <form className="tv-dialog-body tv-prof-modal-form" onSubmit={handleSaveSubmit}>
            {sourceData && (() => {
              const d = extractProfileDraftFromInputData(sourceData);
              const hLabel = GIO_SINH_OPTIONS[d.hourValue]?.label || `Giờ ${d.hourBranch}`;
              return (
                <div className="tv-prof-summary-preview">
                  <span>{d.gender === 0 ? '♀ Nữ' : '♂ Nam'}</span>
                  <span>·</span>
                  <span>
                    Ngày {d.day}/{d.month}/{d.year} ({d.calendarType === 'lunar' ? 'Âm lịch' : 'Dương lịch'})
                  </span>
                  <span>·</span>
                  <span>{hLabel}</span>
                </div>
              );
            })()}

            <div className="tv-prof-form-field">
              <label htmlFor={`${saveTitleId}-name`}>Tên hiển thị trong Danh bạ</label>
              <input
                id={`${saveTitleId}-name`}
                type="text"
                required
                maxLength={100}
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                placeholder="Nhập tên đương số..."
                autoFocus
              />
            </div>

            <div className="tv-prof-form-field">
              <label htmlFor={`${saveTitleId}-rel`}>Nhóm mối quan hệ</label>
              <select
                id={`${saveTitleId}-rel`}
                value={profRelation}
                onChange={(e) => setProfRelation(e.target.value)}
              >
                {PROFILE_RELATIONS.map((rel) => (
                  <option key={rel.id} value={rel.id}>
                    {rel.icon} {rel.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="tv-rect-checkbox-row">
              <input
                type="checkbox"
                checked={profIsDefault}
                onChange={(e) => setProfIsDefault(e.target.checked)}
              />
              <span>⭐ Ghim làm &ldquo;Lá số mặc định của tôi&rdquo; (tự động điền sẵn mỗi khi mở TuViNow)</span>
            </label>

            <div className="tv-dialog-footer-actions">
              <button
                type="button"
                className="tv-btn-secondary"
                onClick={() => saveDialogRef.current?.close()}
              >
                Hủy
              </button>
              <button type="submit" className="tv-btn-primary">
                💾 Lưu hồ sơ
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Native <dialog> Chọn 2 hồ sơ sang Hợp Hôn */}
      <dialog
        ref={pairDialogRef}
        aria-labelledby={pairTitleId}
        closedby="any"
        className="tv-native-dialog tv-profile-dialog"
        onClose={() => {
          if (pairDialogRef.current) pairDialogRef.current.returnValue = '';
          setIsPairOpen(false);
        }}
      >
        <div className="tv-dialog-shell tv-dialog-compact">
          <header className="tv-dialog-header">
            <h2 id={pairTitleId} className="tv-dialog-title">
              <span aria-hidden="true">💞</span> Đưa 2 Hồ sơ sang Hợp Hôn
            </h2>
            <button
              type="button"
              className="tv-dialog-close-btn"
              onClick={() => pairDialogRef.current?.close()}
              aria-label="Đóng hộp thoại chọn cặp Hợp Hôn"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <form className="tv-dialog-body tv-prof-modal-form" onSubmit={handleLaunchHopHonPair}>
            <p className="tv-rect-hint">
              Chọn 2 đương số từ Danh bạ để điền sẵn Bên A &amp; Bên B trong chuyên trang Hợp Hôn 4 Trụ Cột:
            </p>

            <div className="tv-prof-form-field">
              <label htmlFor={`${pairTitleId}-a`}>Bên A (Nam / Chồng / Đối tác 1)</label>
              <select
                id={`${pairTitleId}-a`}
                value={pairIdA}
                onChange={(e) => setPairIdA(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender === 0 ? 'Nữ' : 'Nam'} · {p.day}/{p.month}/{p.year} · Giờ {p.hourBranch})
                  </option>
                ))}
              </select>
            </div>

            <div className="tv-prof-form-field">
              <label htmlFor={`${pairTitleId}-b`}>Bên B (Nữ / Vợ / Đối tác 2)</label>
              <select
                id={`${pairTitleId}-b`}
                value={pairIdB}
                onChange={(e) => setPairIdB(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender === 0 ? 'Nữ' : 'Nam'} · {p.day}/{p.month}/{p.year} · Giờ {p.hourBranch})
                  </option>
                ))}
              </select>
            </div>

            {pairError && (
              <p role="alert" className="tv-rect-inline-error">
                ⚠️ {pairError}
              </p>
            )}

            <div className="tv-dialog-footer-actions">
              <button
                type="button"
                className="tv-btn-secondary"
                onClick={() => pairDialogRef.current?.close()}
              >
                Hủy
              </button>
              <button type="submit" className="tv-btn-primary">
                💞 Chuyển sang Hợp Hôn ngay
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </section>
  );
}
