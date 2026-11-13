export const CUSTOM_SPREAD_STORAGE_KEY = 'tarotnow_custom_spread_templates_v1';
const MAX_CUSTOM_TEMPLATES = 24;
export const MIN_CUSTOM_CARDS = 1;
export const MAX_CUSTOM_CARDS = 10;

export const STARTER_CUSTOM_SPREAD_PRESETS = [
  {
    id: 'starter-quick-decision-3',
    isStarter: true,
    icon: '⚖️',
    count: 3,
    nameVi: 'Gỡ rối quyết định nhanh (3 lá)',
    nameEn: 'Quick Decision Unblocker (3 cards)',
    positionsVi: [
      'Phương án A: Hướng thay đổi mới',
      'Phương án B: Giữ nhịp hiện tại',
      'Lời khuyên cốt lõi để chốt quyết định',
    ],
    positionsEn: [
      'Option A: Taking the new path',
      'Option B: Staying the current course',
      'Core advice to make the call',
    ],
  },
  {
    id: 'starter-project-energy-4',
    isStarter: true,
    icon: '🚀',
    count: 4,
    nameVi: 'Kiểm tra năng lượng công việc/dự án (4 lá)',
    nameEn: 'Work / Project Energy Check (4 cards)',
    positionsVi: [
      'Tiến độ & nguồn lực hiện tại',
      'Điểm nghẽn hoặc rủi ro ẩn',
      'Đòn bẩy bứt phá chưa khai thác',
      'Hành động ưu tiên trong 2 tuần tới',
    ],
    positionsEn: [
      'Current momentum & resources',
      'Hidden bottleneck or risk',
      'Untapped leverage for breakthrough',
      'Priority action for the next 2 weeks',
    ],
  },
  {
    id: 'starter-ab-compare-5',
    isStarter: true,
    icon: '🔀',
    count: 5,
    nameVi: 'So sánh 2 lựa chọn A/B (5 lá)',
    nameEn: 'Compare Two Choices A/B (5 cards)',
    positionsVi: [
      'Trọng tâm câu hỏi & vị thế hiện tại',
      'Phương án A: Diễn biến & cơ hội',
      'Phương án B: Diễn biến & cơ hội',
      'Chi phí cơ hội / Điều cần đánh đổi',
      'Lời khuyên cốt lõi từ tổng thể',
    ],
    positionsEn: [
      'Core dilemma & current standing',
      'Option A: Trajectory & upside',
      'Option B: Trajectory & upside',
      'Trade-off / Hidden cost to watch',
      'Core synthesis & advice',
    ],
  },
];

export function clampCustomCardCount(count) {
  const num = Number.parseInt(count, 10);
  if (!Number.isFinite(num)) return 3;
  return Math.max(MIN_CUSTOM_CARDS, Math.min(MAX_CUSTOM_CARDS, num));
}

export function getDefaultPositionLabel(index, language = 'vi') {
  return language === 'en' ? `Position ${index + 1}` : `Vị trí ${index + 1}`;
}

export function resizeCustomPositions(positions = [], targetCount = 3) {
  const safeCount = clampCustomCardCount(targetCount);
  const src = Array.isArray(positions) ? positions : [];
  return Array.from({ length: safeCount }, (_, idx) => {
    const raw = src[idx];
    return typeof raw === 'string' ? raw.slice(0, 120) : '';
  });
}

export function resolveCustomSpreadPositions(positions = [], count = 3, language = 'vi') {
  const safeCount = clampCustomCardCount(count);
  const src = Array.isArray(positions) ? positions : [];
  return Array.from({ length: safeCount }, (_, idx) => {
    const raw = typeof src[idx] === 'string' ? src[idx].trim() : '';
    return raw || getDefaultPositionLabel(idx, language);
  });
}

export function validateCustomSpreadTemplate(input = {}, language = 'vi') {
  const isEn = language === 'en';
  const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 80) : '';
  if (!name) {
    return {
      valid: false,
      error: isEn
        ? 'Please enter a name for your custom spread template.'
        : 'Vui lòng nhập tên mẫu sơ đồ trải bài trước khi lưu.',
    };
  }

  const rawPositions = Array.isArray(input?.positions) ? input.positions : [];
  const count = clampCustomCardCount(input?.count ?? (rawPositions.length || 3));
  const cleanedPositions = Array.from({ length: count }, (_, idx) => {
    const raw = typeof rawPositions[idx] === 'string' ? rawPositions[idx].trim().slice(0, 120) : '';
    return raw || getDefaultPositionLabel(idx, language);
  });

  const hasCustomNamedSlot = rawPositions
    .slice(0, count)
    .some((p) => typeof p === 'string' && p.trim().length > 0);

  if (!hasCustomNamedSlot) {
    return {
      valid: false,
      error: isEn
        ? 'Please name at least one spread position before saving.'
        : 'Vui lòng đặt tên ít nhất 1 vị trí trong sơ đồ trước khi lưu mẫu.',
    };
  }

  return {
    valid: true,
    template: {
      id:
        typeof input.id === 'string' && input.id.trim() && !input.id.startsWith('starter-')
          ? input.id.trim()
          : `custom_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      count,
      positions: cleanedPositions,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function loadCustomSpreadTemplates(storage = globalThis.localStorage) {
  if (!storage || typeof storage.getItem !== 'function') return [];
  try {
    const raw = storage.getItem(CUSTOM_SPREAD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim())
      .map((item) => {
        const count = clampCustomCardCount(item.count ?? item.positions?.length ?? 3);
        return {
          id: String(item.id || `custom_tpl_${Math.random().toString(36).slice(2, 8)}`),
          name: item.name.trim().slice(0, 80),
          count,
          positions: resolveCustomSpreadPositions(item.positions, count, 'vi'),
          updatedAt: item.updatedAt || null,
        };
      })
      .slice(0, MAX_CUSTOM_TEMPLATES);
  } catch {
    return [];
  }
}

export function saveCustomSpreadTemplate(
  templateInput,
  storage = globalThis.localStorage,
  language = 'vi'
) {
  const validation = validateCustomSpreadTemplate(templateInput, language);
  if (!validation.valid) {
    return { ok: false, error: validation.error, templates: loadCustomSpreadTemplates(storage) };
  }

  const nextTemplate = validation.template;
  const existing = loadCustomSpreadTemplates(storage);
  const filtered = existing.filter(
    (item) =>
      item.id !== nextTemplate.id &&
      item.name.toLowerCase() !== nextTemplate.name.toLowerCase()
  );
  const updated = [nextTemplate, ...filtered].slice(0, MAX_CUSTOM_TEMPLATES);

  if (storage && typeof storage.setItem === 'function') {
    try {
      storage.setItem(CUSTOM_SPREAD_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      return {
        ok: false,
        error:
          language === 'en'
            ? 'Could not write template to browser storage.'
            : 'Không thể lưu mẫu vào bộ nhớ trình duyệt.',
        templates: existing,
      };
    }
  }

  return { ok: true, template: nextTemplate, templates: updated };
}

export function deleteCustomSpreadTemplate(templateId, storage = globalThis.localStorage) {
  const existing = loadCustomSpreadTemplates(storage);
  const updated = existing.filter((item) => item.id !== templateId);
  if (storage && typeof storage.setItem === 'function') {
    try {
      storage.setItem(CUSTOM_SPREAD_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      return existing;
    }
  }
  return updated;
}
