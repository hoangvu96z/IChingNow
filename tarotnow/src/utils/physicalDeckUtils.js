import { resolveCardElement, ELEMENT_METADATA } from './tarotLogic.js';

export const MAJOR_VIETNAMESE_ALIASES = {
  0: { vi: 'Kẻ Khờ', aliases: ['ke kho', 'chang kho', 'nguoi dien', '0', 'fool'] },
  1: { vi: 'Pháp Sư', aliases: ['phap su', 'ao thuat gia', 'nha ao thuat', '1', 'i', 'magician'] },
  2: { vi: 'Nữ Tư Tế', aliases: ['nu tu te', 'nu giao hoang', '2', 'ii', 'high priestess', 'priestess'] },
  3: { vi: 'Nữ Hoàng', aliases: ['nu hoang', 'hoang hau', '3', 'iii', 'empress'] },
  4: { vi: 'Hoàng Đế', aliases: ['hoang de', 'vua', '4', 'iv', 'emperor'] },
  5: { vi: 'Giáo Hoàng', aliases: ['giao hoang', 'thay tu', '5', 'v', 'hierophant'] },
  6: { vi: 'Tình Nhân', aliases: ['tinh nhan', 'doi tinh nhan', '6', 'vi', 'lovers'] },
  7: { vi: 'Cỗ Xe', aliases: ['co xe', 'chien xa', '7', 'vii', 'chariot'] },
  8: { vi: 'Sức Mạnh', aliases: ['suc manh', 'nghi luc', '8', 'viii', 'strength'] },
  9: { vi: 'Ẩn Sĩ', aliases: ['an si', 'nguoi an dat', '9', 'ix', 'hermit'] },
  10: { vi: 'Bánh Xe Số Phận', aliases: ['banh xe so phan', 'vong quay dinh menh', '10', 'x', 'wheel of fortune', 'wheel'] },
  11: { vi: 'Công Lý', aliases: ['cong ly', 'can cong ly', '11', 'xi', 'justice'] },
  12: { vi: 'Người Treo Ngược', aliases: ['nguoi treo nguoc', 'ke treo nguoc', '12', 'xii', 'hanged man'] },
  13: { vi: 'Tử Thần', aliases: ['tu than', 'cai chet', '13', 'xiii', 'death'] },
  14: { vi: 'Tiết Độ', aliases: ['tiet do', 'can bang', 'dieu do', '14', 'xiv', 'temperance'] },
  15: { vi: 'Ác Quỷ', aliases: ['ac quy', 'con quy', '15', 'xv', 'devil'] },
  16: { vi: 'Tòa Tháp', aliases: ['toa thap', 'thap', 'ngon thap', '16', 'xvi', 'tower'] },
  17: { vi: 'Ngôi Sao', aliases: ['ngoi sao', 'hy vong', '17', 'xvii', 'star'] },
  18: { vi: 'Mặt Trăng', aliases: ['mat trang', 'anh trang', '18', 'xviii', 'moon'] },
  19: { vi: 'Mặt Trời', aliases: ['mat troi', 'thai duong', '19', 'xix', 'sun'] },
  20: { vi: 'Phán Xét', aliases: ['phan xet', 'hoi sinh', '20', 'xx', 'judgement', 'judgment'] },
  21: { vi: 'Thế Giới', aliases: ['the gioi', 'hoan thanh', '21', 'xxi', 'world'] },
};

export const SUIT_VIETNAMESE_ALIASES = {
  Wands: { vi: 'Gậy', aliases: ['gay', 'wand', 'wands', 'lua', 'fire', 'hoa'] },
  Cups: { vi: 'Cốc', aliases: ['coc', 'ly', 'cup', 'cups', 'nuoc', 'water', 'thuy'] },
  Swords: { vi: 'Kiếm', aliases: ['kiem', 'guom', 'sword', 'swords', 'khi', 'air', 'phong'] },
  Pentacles: { vi: 'Tiền', aliases: ['tien', 'xu', 'pentacle', 'pentacles', 'coin', 'coins', 'dat', 'earth', 'tho'] },
};

export const RANK_VIETNAMESE_ALIASES = {
  Ace: { vi: 'Át (1)', shortVi: 'Ace / 1', num: '1', aliases: ['at', '1', 'ace', 'mot'] },
  Two: { vi: '2', shortVi: '2', num: '2', aliases: ['2', 'hai', 'two'] },
  Three: { vi: '3', shortVi: '3', num: '3', aliases: ['3', 'ba', 'three'] },
  Four: { vi: '4', shortVi: '4', num: '4', aliases: ['4', 'bon', 'tu', 'four'] },
  Five: { vi: '5', shortVi: '5', num: '5', aliases: ['5', 'nam', 'five'] },
  Six: { vi: '6', shortVi: '6', num: '6', aliases: ['6', 'sau', 'six'] },
  Seven: { vi: '7', shortVi: '7', num: '7', aliases: ['7', 'bay', 'seven'] },
  Eight: { vi: '8', shortVi: '8', num: '8', aliases: ['8', 'tam', 'eight'] },
  Nine: { vi: '9', shortVi: '9', num: '9', aliases: ['9', 'chin', 'nine'] },
  Ten: { vi: '10', shortVi: '10', num: '10', aliases: ['10', 'muoi', 'ten'] },
  Page: { vi: 'Tiểu Đồng (Page)', shortVi: 'Tiểu Đồng', num: '11', aliases: ['page', 'tieu dong', 'thi dong', 'cau be'] },
  Knight: { vi: 'Hiệp Sĩ (Knight)', shortVi: 'Hiệp Sĩ', num: '12', aliases: ['knight', 'hiep si', 'ky si'] },
  Queen: { vi: 'Hoàng Hậu (Queen)', shortVi: 'Hoàng Hậu', num: '13', aliases: ['queen', 'hoang hau', 'nu hoang'] },
  King: { vi: 'Nhà Vua (King)', shortVi: 'Nhà Vua', num: '14', aliases: ['king', 'nha vua', 'vua'] },
};

export const DECK_FILTER_PILLS = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All (78)' },
  { id: 'major', labelVi: 'Ẩn Chính', labelEn: 'Major' },
  { id: 'wands', labelVi: 'Gậy 🔥', labelEn: 'Wands 🔥' },
  { id: 'cups', labelVi: 'Cốc 💧', labelEn: 'Cups 💧' },
  { id: 'swords', labelVi: 'Kiếm 🌬️', labelEn: 'Swords 🌬️' },
  { id: 'pentacles', labelVi: 'Tiền 🌿', labelEn: 'Pentacles 🌿' },
];

export function stripDiacritics(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function getCardVietnameseSubtitle(card) {
  if (!card) return '';
  if (card.arcana === 'Major' && Number.isInteger(card.number) && MAJOR_VIETNAMESE_ALIASES[card.number]) {
    return `${card.number}. ${MAJOR_VIETNAMESE_ALIASES[card.number].vi}`;
  }
  if (card.suit && SUIT_VIETNAMESE_ALIASES[card.suit]) {
    const suitVi = SUIT_VIETNAMESE_ALIASES[card.suit].vi;
    const rankMeta = RANK_VIETNAMESE_ALIASES[card.rank];
    if (rankMeta) {
      return `${rankMeta.shortVi} ${suitVi}`;
    }
    return suitVi;
  }
  return '';
}

export function buildCardSearchBlob(card) {
  if (!card) return '';
  const tokens = [card.name || '', card.id || ''];
  if (card.arcana === 'Major') {
    tokens.push('major', 'an chinh', 'ẩn chính', String(card.number ?? ''));
    const m = MAJOR_VIETNAMESE_ALIASES[card.number];
    if (m) {
      tokens.push(m.vi, ...m.aliases);
    }
  } else if (card.suit) {
    const s = SUIT_VIETNAMESE_ALIASES[card.suit];
    const r = RANK_VIETNAMESE_ALIASES[card.rank];
    if (s) tokens.push(s.vi, ...s.aliases);
    if (r) tokens.push(r.vi, r.shortVi, r.num, ...r.aliases);
    if (s && r) {
      tokens.push(`${r.num} ${s.vi}`, `${r.shortVi} ${s.vi}`, `${r.num} of ${card.suit}`);
      for (const ra of r.aliases) {
        for (const sa of s.aliases) {
          tokens.push(`${ra} ${sa}`);
        }
      }
    }
  }
  const elem = resolveCardElement(card);
  if (elem && ELEMENT_METADATA[elem]) {
    tokens.push(elem, ELEMENT_METADATA[elem].shortVi);
  }
  return stripDiacritics(tokens.join(' '));
}

export function filterDeckCards(deck = [], { query = '', category = 'all' } = {}) {
  if (!Array.isArray(deck) || deck.length === 0) return [];
  const normCategory = (category || 'all').toLowerCase();
  const normQuery = stripDiacritics(query).replace(/\s+/g, ' ');
  const queryWords = normQuery ? normQuery.split(' ').filter(Boolean) : [];

  return deck.filter((card) => {
    if (!card) return false;
    if (normCategory === 'major' && card.arcana !== 'Major') return false;
    if (normCategory === 'wands' && card.suit !== 'Wands') return false;
    if (normCategory === 'cups' && card.suit !== 'Cups') return false;
    if (normCategory === 'swords' && card.suit !== 'Swords') return false;
    if (normCategory === 'pentacles' && card.suit !== 'Pentacles') return false;

    if (queryWords.length === 0) return true;
    const blob = buildCardSearchBlob(card);
    return queryWords.every((word) => blob.includes(word));
  });
}

export function createEmptyPhysicalSlots(count = 3) {
  const safeCount = Math.max(1, Math.min(10, Number.parseInt(count, 10) || 3));
  return Array.from({ length: safeCount }, () => null);
}

export function resizePhysicalSlots(slots = [], count = 3) {
  const safeCount = Math.max(1, Math.min(10, Number.parseInt(count, 10) || 3));
  const src = Array.isArray(slots) ? slots : [];
  const usedIds = new Set();
  return Array.from({ length: safeCount }, (_, idx) => {
    const entry = src[idx];
    if (!entry || !entry.card || usedIds.has(entry.card.id)) return null;
    usedIds.add(entry.card.id);
    return {
      card: entry.card,
      orientation: entry.orientation === 'reversed' ? 'reversed' : 'upright',
    };
  });
}

/**
 * Check if a physical card is already assigned to ANOTHER slot (not activeSlotIndex).
 */
export function findCardSlotIndex(slots = [], cardId, excludeSlotIndex = -1) {
  if (!Array.isArray(slots) || cardId == null) return -1;
  for (let i = 0; i < slots.length; i += 1) {
    if (i === excludeSlotIndex) continue;
    if (slots[i]?.card?.id === cardId) return i;
  }
  return -1;
}

export function isCardPickedInAnotherSlot(slots = [], cardId, activeSlotIndex = -1) {
  return findCardSlotIndex(slots, cardId, activeSlotIndex) !== -1;
}

/**
 * Assign a physical card to slotIndex, preventing duplicate cards across slots.
 */
export function assignCardToPhysicalSlot(slots = [], slotIndex, card, orientation = 'upright') {
  if (!Array.isArray(slots) || slotIndex < 0 || slotIndex >= slots.length || !card) {
    return { ok: false, error: 'Vị trí chọn lá bài không hợp lệ.', slots };
  }

  const conflictIndex = findCardSlotIndex(slots, card.id, slotIndex);
  if (conflictIndex !== -1) {
    return {
      ok: false,
      duplicateSlotIndex: conflictIndex,
      error: `Lá "${card.name}" đã được đặt ở Vị trí ${conflictIndex + 1}. Một bộ bài vật lý không thể rút trùng 2 lá giống nhau.`,
      slots,
    };
  }

  const nextSlots = [...slots];
  nextSlots[slotIndex] = {
    card,
    orientation: orientation === 'reversed' ? 'reversed' : 'upright',
  };
  return { ok: true, slots: nextSlots };
}

export function togglePhysicalSlotOrientation(slots = [], slotIndex) {
  if (!Array.isArray(slots) || !slots[slotIndex]?.card) return slots;
  const nextSlots = [...slots];
  nextSlots[slotIndex] = {
    ...nextSlots[slotIndex],
    orientation: nextSlots[slotIndex].orientation === 'reversed' ? 'upright' : 'reversed',
  };
  return nextSlots;
}

export function clearPhysicalSlot(slots = [], slotIndex) {
  if (!Array.isArray(slots) || slotIndex < 0 || slotIndex >= slots.length) return slots;
  const nextSlots = [...slots];
  nextSlots[slotIndex] = null;
  return nextSlots;
}

export function swapPhysicalSlots(slots = [], indexA, indexB) {
  if (
    !Array.isArray(slots) ||
    indexA < 0 ||
    indexB < 0 ||
    indexA >= slots.length ||
    indexB >= slots.length ||
    indexA === indexB
  ) {
    return slots;
  }
  const nextSlots = [...slots];
  const temp = nextSlots[indexA];
  nextSlots[indexA] = nextSlots[indexB];
  nextSlots[indexB] = temp;
  return nextSlots;
}

export function buildDrawnCardsFromPhysicalSlots(slots = [], language = 'vi') {
  const isEn = language === 'en';
  if (!Array.isArray(slots) || slots.length === 0) {
    return {
      valid: false,
      error: isEn ? 'No spread slots configured.' : 'Chưa có ô trải bài nào.',
      drawnCards: [],
    };
  }

  const missingIndices = [];
  const seenIds = new Set();

  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (!slot?.card) {
      missingIndices.push(i + 1);
      continue;
    }
    if (seenIds.has(slot.card.id)) {
      return {
        valid: false,
        error: isEn
          ? `Duplicate card "${slot.card.name}" detected across slots.`
          : `Phát hiện lá bài trùng lặp "${slot.card.name}" ở nhiều vị trí.`,
        drawnCards: [],
      };
    }
    seenIds.add(slot.card.id);
  }

  if (missingIndices.length > 0) {
    return {
      valid: false,
      error: isEn
        ? `Please select cards for position(s): ${missingIndices.join(', ')}.`
        : `Vui lòng chọn đủ lá bài cho vị trí số: ${missingIndices.join(', ')}.`,
      drawnCards: [],
    };
  }

  const drawnCards = slots.map((slot, idx) => ({
    ...slot.card,
    orientation: slot.orientation === 'reversed' ? 'reversed' : 'upright',
    drawPosition: idx + 1,
    physicalLogged: true,
  }));

  return { valid: true, drawnCards };
}
