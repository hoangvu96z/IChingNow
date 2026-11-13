import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { attachDialogLightDismiss } from '../../../shared/src/utils/pwaInstall.mjs';
import { CONTEXTS, resolveCardElement, ELEMENT_METADATA } from '../utils/tarotLogic.js';
import {
  DECK_FILTER_PILLS,
  filterDeckCards,
  getCardVietnameseSubtitle,
  resizePhysicalSlots,
  findCardSlotIndex,
  assignCardToPhysicalSlot,
  togglePhysicalSlotOrientation,
  clearPhysicalSlot,
  swapPhysicalSlots,
  buildDrawnCardsFromPhysicalSlots,
} from '../utils/physicalDeckUtils.js';
import SpreadSelector from './SpreadSelector.jsx';
import CustomSpreadBuilder from './CustomSpreadBuilder.jsx';

export default function PhysicalSpreadInput({
  tarotCards = [],
  question,
  setQuestion,
  activeSpread,
  onSpreadChange,
  drawCount,
  onDrawCountChange,
  customPositions,
  onCustomPositionsChange,
  customSpreadTitle,
  onCustomSpreadTitleChange,
  spreadPositions = [],
  interpretationContext,
  setInterpretationContext,
  onAnalyzeAndSave,
  language = 'vi',
}) {
  const isEn = language === 'en';
  const pickerDialogRef = useRef(null);
  const searchInputRef = useRef(null);
  const pickerTitleId = useId();

  const slotCount = Math.max(1, spreadPositions.length || drawCount || 3);
  const [slots, setSlots] = useState(() => resizePhysicalSlots([], slotCount));
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [pickerOrientation, setPickerOrientation] = useState('upright');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSlots((prev) => resizePhysicalSlots(prev, slotCount));
  }, [slotCount]);

  // Attach native <dialog closedby="any"> light-dismiss fallback (Safari support)
  useEffect(() => {
    const dialog = pickerDialogRef.current;
    if (!dialog) return undefined;
    const detachLightDismiss = attachDialogLightDismiss(dialog);
    const handleNativeClose = () => {
      dialog.returnValue = '';
      setIsPickerOpen(false);
    };
    dialog.addEventListener('close', handleNativeClose);
    return () => {
      detachLightDismiss();
      dialog.removeEventListener('close', handleNativeClose);
    };
  }, []);

  const openPickerForSlot = (index) => {
    setActiveSlotIndex(index);
    const currentSlot = slots[index];
    setPickerOrientation(currentSlot?.orientation === 'reversed' ? 'reversed' : 'upright');
    setSearchQuery('');
    setErrorMsg('');
    setIsPickerOpen(true);

    const dialog = pickerDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
    }
  };

  const closePickerDialog = () => {
    const dialog = pickerDialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    setIsPickerOpen(false);
  };

  const filteredDeck = useMemo(
    () => filterDeckCards(tarotCards, { query: searchQuery, category: filterCategory }),
    [tarotCards, searchQuery, filterCategory]
  );

  const handleSelectCardForSlot = (card) => {
    const res = assignCardToPhysicalSlot(slots, activeSlotIndex, card, pickerOrientation);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    setSlots(res.slots);
    setErrorMsg('');

    // Auto-advance to next empty slot or close dialog when all slots are filled
    const nextEmptyIdx = res.slots.findIndex((s, idx) => idx > activeSlotIndex && !s?.card);
    const anyEmptyIdx = res.slots.findIndex((s) => !s?.card);
    if (nextEmptyIdx !== -1) {
      setActiveSlotIndex(nextEmptyIdx);
      setSearchQuery('');
      searchInputRef.current?.focus();
    } else if (anyEmptyIdx !== -1) {
      setActiveSlotIndex(anyEmptyIdx);
      setSearchQuery('');
      searchInputRef.current?.focus();
    } else {
      closePickerDialog();
    }
  };

  const handleToggleOrientation = (idx) => {
    setSlots((prev) => togglePhysicalSlotOrientation(prev, idx));
  };

  const handleClearSlot = (idx) => {
    setSlots((prev) => clearPhysicalSlot(prev, idx));
    setErrorMsg('');
  };

  const handleSwapWithNext = (idx) => {
    const targetIdx = idx + 1 < slots.length ? idx + 1 : idx - 1;
    if (targetIdx >= 0) {
      setSlots((prev) => swapPhysicalSlots(prev, idx, targetIdx));
    }
  };

  const handleClearAllSlots = () => {
    setSlots(resizePhysicalSlots([], slotCount));
    setErrorMsg('');
  };

  const filledCount = slots.filter((s) => Boolean(s?.card)).length;
  const allFilled = filledCount === slots.length && slots.length > 0;

  const handleSubmitReading = () => {
    setErrorMsg('');
    if (!question || question.trim().length < 5) {
      setErrorMsg(
        isEn
          ? 'Please enter your reading question (at least 5 characters) before analyzing.'
          : 'Vui lòng nhập câu hỏi trải bài (tối thiểu 5 ký tự) trước khi phân tích!'
      );
      return;
    }

    const built = buildDrawnCardsFromPhysicalSlots(slots, language);
    if (!built.valid) {
      setErrorMsg(built.error);
      return;
    }

    if (onAnalyzeAndSave) {
      onAnalyzeAndSave(built.drawnCards);
    }
  };

  const baseUrl = import.meta.env.BASE_URL || '/';

  return (
    <div className="physical-spread-panel glass-panel">
      <div className="physical-header-banner">
        <div>
          <h3 className="settings-title" style={{ fontSize: '1.1rem', marginBottom: 4 }}>
            🃏 {isEn ? 'Log Physical Tarot Spread' : 'Nhập Trải Bài Từ Bộ Bài Ngoài Đời'}
          </h3>
          <p className="settings-subtitle" style={{ margin: 0 }}>
            {isEn
              ? 'Pulled real cards on your table? Log each position below for Elemental Dignities, AI synthesis & journal history.'
              : 'Bạn vừa tự xào và rút bài thật trên bàn? Chọn lại đúng từng vị trí để phân tích Tương tác Nguyên tố, luận giải AI và lưu nhật ký.'}
          </p>
        </div>
        {filledCount > 0 && (
          <button
            type="button"
            className="reset-weights-btn physical-clear-all-btn"
            onClick={handleClearAllSlots}
          >
            {isEn ? 'Clear slots' : 'Xóa chọn lại'}
          </button>
        )}
      </div>

      {/* Question Input */}
      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label" htmlFor="physical-question-input">
          {isEn ? 'Your Question / Reading Topic *' : 'Câu hỏi hoặc chủ đề bạn đã rút bài *'}
        </label>
        <textarea
          id="physical-question-input"
          className="custom-textarea"
          placeholder={
            isEn
              ? 'e.g., What do I need to see clearly about switching jobs vs staying over the next 3 months?'
              : 'Ví dụ: Hai phương án chuyển việc và ở lại trong 3 tháng tới có thuận lợi/rủi ro gì?'
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      {/* Spread & Context Settings */}
      <div className="settings-grid">
        <div className="settings-col">
          <label className="form-label">
            {isEn ? 'Select Spread Layout' : 'Chọn Sơ Đồ Trải Bài'}
          </label>
          <SpreadSelector
            activeSpread={activeSpread}
            onSpreadChange={onSpreadChange}
            customSpreadTitle={customSpreadTitle}
            customPositions={customPositions}
            customCount={drawCount}
          />
        </div>

        <div className="settings-col">
          <label className="form-label" htmlFor="physical-perspective-select">
            {isEn ? 'Interpretation Lens' : 'Góc nhìn giải nghĩa'}
          </label>
          <select
            id="physical-perspective-select"
            className="custom-select"
            value={interpretationContext}
            onChange={(e) => setInterpretationContext(e.target.value)}
          >
            {CONTEXTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Spread Position Builder when activeSpread === 'custom' */}
      {activeSpread === 'custom' && (
        <CustomSpreadBuilder
          drawCount={drawCount}
          onDrawCountChange={onDrawCountChange}
          customPositions={customPositions}
          onCustomPositionsChange={onCustomPositionsChange}
          customSpreadTitle={customSpreadTitle}
          onCustomSpreadTitleChange={onCustomSpreadTitleChange}
          language={language}
        />
      )}

      {/* Spread Slots Grid */}
      <div className="physical-slots-header">
        <span className="physical-slots-progress">
          {isEn
            ? `Filled ${filledCount}/${slots.length} positions`
            : `Đã điền ${filledCount}/${slots.length} vị trí trải bài`}
        </span>
      </div>

      <div className="physical-slots-grid">
        {slots.map((slot, idx) => {
          const posLabel =
            spreadPositions[idx] || (isEn ? `Position ${idx + 1}` : `Vị trí ${idx + 1}`);
          const pickedCard = slot?.card || null;
          const isRev = slot?.orientation === 'reversed';
          const elem = pickedCard ? resolveCardElement(pickedCard) : null;
          const elemMeta = elem ? ELEMENT_METADATA[elem] : null;
          const viSub = pickedCard && !isEn ? getCardVietnameseSubtitle(pickedCard) : '';

          return (
            <div
              key={idx}
              className={`physical-slot-card${pickedCard ? ' is-filled' : ' is-empty'}`}
            >
              <div className="physical-slot-top">
                <span className="physical-slot-index">{idx + 1}</span>
                <span className="physical-slot-pos-title" title={posLabel}>
                  {posLabel}
                </span>
              </div>

              {pickedCard ? (
                <div className="physical-slot-filled-body">
                  <button
                    type="button"
                    className="physical-slot-card-preview-btn"
                    onClick={() => openPickerForSlot(idx)}
                    aria-label={
                      isEn
                        ? `Change card at position ${idx + 1}: ${pickedCard.name}`
                        : `Đổi lá bài ở vị trí ${idx + 1}: ${pickedCard.name}`
                    }
                  >
                    <img
                      src={baseUrl + pickedCard.image.replace(/^\//, '')}
                      alt={pickedCard.name}
                      className="physical-slot-thumb"
                      style={{ transform: isRev ? 'rotate(180deg)' : 'none' }}
                    />
                    <div className="physical-slot-card-meta">
                      <strong className="physical-slot-card-name">{pickedCard.name}</strong>
                      {viSub && <span className="physical-slot-card-vi">{viSub}</span>}
                      {elemMeta && (
                        <span className="physical-slot-elem-tag">
                          <span aria-hidden="true">{elemMeta.icon}</span>{' '}
                          {isEn ? elemMeta.en : elemMeta.shortVi}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="physical-slot-controls">
                    <button
                      type="button"
                      className={`physical-ori-toggle-btn ${isRev ? 'is-reversed' : 'is-upright'}`}
                      onClick={() => handleToggleOrientation(idx)}
                    >
                      <span aria-hidden="true">{isRev ? '↓' : '↑'}</span>
                      <span>
                        {isRev
                          ? isEn
                            ? 'Reversed'
                            : 'Ngược'
                          : isEn
                            ? 'Upright'
                            : 'Xuôi'}
                      </span>
                    </button>

                    {slots.length > 1 && (
                      <button
                        type="button"
                        className="physical-slot-icon-btn"
                        onClick={() => handleSwapWithNext(idx)}
                        aria-label={
                          isEn
                            ? `Swap position ${idx + 1} with neighbor`
                            : `Đổi chỗ vị trí ${idx + 1} với ô kế bên`
                        }
                        title={isEn ? 'Swap slot' : 'Đổi chỗ ô kế bên'}
                      >
                        <span aria-hidden="true">⇄</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="physical-slot-icon-btn is-danger"
                      onClick={() => handleClearSlot(idx)}
                      aria-label={
                        isEn
                          ? `Clear card at position ${idx + 1}`
                          : `Xóa lá bài ở vị trí ${idx + 1}`
                      }
                      title={isEn ? 'Remove card' : 'Xóa lá này'}
                    >
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="physical-slot-pick-trigger"
                  onClick={() => openPickerForSlot(idx)}
                >
                  <span className="physical-slot-plus" aria-hidden="true">
                    ＋
                  </span>
                  <span>
                    {isEn ? 'Tap to select card from 78-deck' : 'Chạm để chọn lá bài (78 lá)'}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {errorMsg && <div className="error-alert">{errorMsg}</div>}

      <div className="action-area" style={{ marginTop: 22 }}>
        <button
          type="button"
          className="draw-trigger-btn"
          disabled={!allFilled}
          onClick={handleSubmitReading}
        >
          {isEn ? '🔮 Analyze & Save Spread' : '🔮 Phân tích & Lưu trải bài'}
        </button>
      </div>

      {/* Native <dialog> Card Picker Modal */}
      <dialog
        ref={pickerDialogRef}
        aria-labelledby={pickerTitleId}
        closedby="any"
        className="tarot-native-dialog card-picker-dialog"
      >
        <div className="tarot-dialog-inner">
          <div className="tarot-dialog-header">
            <div style={{ minInlineSize: 0 }}>
              <h3 id={pickerTitleId} className="tarot-dialog-title">
                {isEn
                  ? `Select Card for Position ${activeSlotIndex + 1}`
                  : `Chọn lá bài cho Vị trí ${activeSlotIndex + 1}`}
              </h3>
              <p className="tarot-dialog-subtitle">
                {spreadPositions[activeSlotIndex] ||
                  (isEn ? `Position ${activeSlotIndex + 1}` : `Vị trí ${activeSlotIndex + 1}`)}
              </p>
            </div>
            <button
              type="button"
              className="tarot-dialog-close-btn"
              onClick={closePickerDialog}
              aria-label={isEn ? 'Close card picker' : 'Đóng bảng chọn bài'}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          {/* Slot Switcher Pills inside Picker for multi-slot flow */}
          {slots.length > 1 && (
            <div className="picker-slot-stepper">
              {slots.map((s, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  className={`picker-slot-pill${sIdx === activeSlotIndex ? ' active' : ''}${s?.card ? ' filled' : ''}`}
                  onClick={() => {
                    setActiveSlotIndex(sIdx);
                    setPickerOrientation(s?.orientation === 'reversed' ? 'reversed' : 'upright');
                  }}
                >
                  <span>#{sIdx + 1}</span>
                  <span>{s?.card ? '✓' : '·'}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search & Orientation Controls */}
          <div className="picker-controls-bar">
            <input
              ref={searchInputRef}
              type="search"
              className="custom-position-input picker-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={isEn ? 'Search 78 Tarot cards' : 'Tìm kiếm trong 78 lá bài Tarot'}
              placeholder={
                isEn
                  ? 'Search card name or number (e.g. Tower, 3 of Swords, Ace of Cups, Queen)...'
                  : 'Tìm nhanh tên Việt / Anh / số (VD: Tháp, Tower, 3 Kiếm, Ace of Cups, Queen)...'
              }
            />
            <div
              className="picker-orientation-segmented"
              role="group"
              aria-label={isEn ? 'Card orientation' : 'Chiều lá bài'}
            >
              <button
                type="button"
                className={`picker-ori-seg-btn${pickerOrientation === 'upright' ? ' active is-upright' : ''}`}
                onClick={() => setPickerOrientation('upright')}
              >
                ↑ {isEn ? 'Upright' : 'Xuôi'}
              </button>
              <button
                type="button"
                className={`picker-ori-seg-btn${pickerOrientation === 'reversed' ? ' active is-reversed' : ''}`}
                onClick={() => setPickerOrientation('reversed')}
              >
                ↓ {isEn ? 'Reversed' : 'Ngược'}
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="picker-filter-pills">
            {DECK_FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                className={`picker-filter-pill${filterCategory === pill.id ? ' active' : ''}`}
                onClick={() => setFilterCategory(pill.id)}
              >
                {isEn ? pill.labelEn : pill.labelVi}
              </button>
            ))}
          </div>

          {/* 78-Card Results Grid */}
          <div className="picker-cards-scroll">
            {isPickerOpen && filteredDeck.length === 0 ? (
              <p className="picker-empty-msg">
                {isEn
                  ? 'No matching Tarot card found. Try another keyword.'
                  : 'Không tìm thấy lá bài phù hợp. Hãy thử từ khóa khác (VD: "Tháp", "3 Kiếm", "Cốc").'}
              </p>
            ) : (
              <div className="picker-cards-grid">
                {filteredDeck.map((card) => {
                  const otherSlotIdx = findCardSlotIndex(slots, card.id, activeSlotIndex);
                  const isTakenElsewhere = otherSlotIdx !== -1;
                  const isCurrentSlotCard = slots[activeSlotIndex]?.card?.id === card.id;
                  const viSub = !isEn ? getCardVietnameseSubtitle(card) : '';

                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={isTakenElsewhere}
                      className={`picker-card-tile${isCurrentSlotCard ? ' is-current' : ''}${isTakenElsewhere ? ' is-taken' : ''}`}
                      onClick={() => handleSelectCardForSlot(card)}
                    >
                      <div className="picker-card-img-wrap">
                        <img
                          src={baseUrl + card.image.replace(/^\//, '')}
                          alt={card.name}
                          loading="lazy"
                          className="picker-card-img"
                          style={{
                            transform:
                              pickerOrientation === 'reversed' ? 'rotate(180deg)' : 'none',
                          }}
                        />
                        {isTakenElsewhere && (
                          <span className="picker-taken-badge">
                            {isEn ? `Slot #${otherSlotIdx + 1}` : `Vị trí #${otherSlotIdx + 1}`}
                          </span>
                        )}
                        {isCurrentSlotCard && (
                          <span className="picker-current-badge">
                            {isEn ? 'Selected' : 'Đang chọn'}
                          </span>
                        )}
                      </div>
                      <span className="picker-card-title">{card.name}</span>
                      {viSub && <span className="picker-card-subtitle">{viSub}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
