import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

import {
  SON_24,
  THE_QUAI_MAP,
  yearToPeriod,
  degreeToMountain,
  resolveTheQuaiStar,
  getAnnualCenterStar,
  getMonthlyCenterStar,
  computeBatTrachFromBirth,
  lapTinhBanHuyenKhong,
} from '../src/utils/huyenKhongEngine.js';
import {
  CUU_TINH_INFO,
  CUU_CUNG_META,
  HUYEN_KHONG_81,
  getStarPairInfo,
} from '../src/data/huyenKhong81.js';

const TUVI_ROOT = path.resolve(import.meta.dirname, '..');

const SHARED_SHIM_PLUGIN = {
  name: 'shared-auth-shim-for-ssr-hk',
  enforce: 'pre',
  resolveId(source) {
    if (source.endsWith('shared/src/components/SaveToNoteNowButton.jsx')) {
      return path.resolve(TUVI_ROOT, 'src/components/__ssr_SaveToNoteNowButton.jsx');
    }
    return null;
  },
  load(id) {
    if (
      id.endsWith('/shared/src/components/AppHeader.jsx') ||
      id.endsWith('/shared/src/components/AppFooter.jsx') ||
      id.endsWith('/shared/src/components/CombinedReading/CombinedReadingModal.jsx') ||
      id.endsWith('/shared/src/components/SpiritualJournal.jsx')
    ) {
      return 'export default function Stub() { return null; }';
    }
    if (id.endsWith('/shared/src/utils/useStreak.js')) {
      return 'export function useStreak() { return { streak: 0, recordActivity: () => {} }; }';
    }
    if (id.endsWith('/src/hooks/useReadingsApi.js')) {
      return 'export function useReadingsApi() { return { history: [], error: null, loading: false, loadHistory: async () => {}, persistReading: async () => null, deleteReading: async () => {}, deleteAllReadings: async () => {} }; }';
    }
    if (id.endsWith('__ssr_SaveToNoteNowButton.jsx')) {
      const realPath = path.resolve(TUVI_ROOT, '../shared/src/components/SaveToNoteNowButton.jsx');
      return fs.readFileSync(realPath, 'utf8').replaceAll("'../utils/", "'../../../shared/src/utils/");
    }
    if (id.endsWith('/src/context/AuthContext.jsx')) {
      return `export function useAuth() { return { isAuthenticated: false, user: null, login: () => {}, logout: () => {} }; }
export function AuthProvider({ children }) { return children; }`;
    }
    if (id.endsWith('/src/hooks/usePlan.js')) {
      return `export function usePlan() { return { remaining: 3, planLabel: 'Miễn phí', canBonus: false, fetchQuota: async () => {}, requestBonus: async () => {}, applyCoupon: async () => {} }; }`;
    }
    return null;
  },
};

const VITE_RESOLVE = {
  alias: {
    '@shared': path.resolve(TUVI_ROOT, '../shared/src'),
    '@iching': path.resolve(TUVI_ROOT, '../iching/src'),
  },
};

test('1. yearToPeriod converts Gregorian years cleanly across period boundaries', () => {
  assert.equal(yearToPeriod(1864), 1);
  assert.equal(yearToPeriod(2003), 7);
  assert.equal(yearToPeriod(2004), 8);
  assert.equal(yearToPeriod(2023), 8);
  assert.equal(yearToPeriod(2024), 9);
  assert.equal(yearToPeriod(2043), 9);
  assert.equal(yearToPeriod(2044), 1);
});

test('2. degreeToMountain resolves 24 mountains, wrap-around 0/360, kiêm hướng & Không Vong', () => {
  assert.equal(SON_24.length, 24);
  for (const s of SON_24) {
    const info = degreeToMountain(s.centerDeg);
    assert.equal(info.huong.ten, s.ten);
    assert.equal(info.absOffset, 0);
    assert.equal(info.kongWangStatus, 'none');
  }

  // Wrap-around 0° / 359.9° / 352.5° / 7.4°
  assert.equal(degreeToMountain(0).huong.ten, 'Tý');
  assert.equal(degreeToMountain(359.9).huong.ten, 'Tý');
  assert.equal(degreeToMountain(352.5).huong.ten, 'Tý');
  assert.equal(degreeToMountain(7.4).huong.ten, 'Tý');
  assert.equal(degreeToMountain(7.5).huong.ten, 'Quý');

  // 90° Mão -> Tọa Dậu
  const mao = degreeToMountain(90);
  assert.equal(mao.huong.ten, 'Mão');
  assert.equal(mao.toa.ten, 'Dậu');

  // Kiêm hướng vs Chính hướng vs Không Vong thresholds
  assert.equal(degreeToMountain(94.4).isKiemHuong, false);
  assert.equal(degreeToMountain(94.4).kongWangStatus, 'none');

  assert.equal(degreeToMountain(94.5).isKiemHuong, true);
  assert.equal(degreeToMountain(94.5).kongWangStatus, 'kiem_huong');

  // 96.5° is +6.5° from Mão center (same Chấn trigram as Ất) -> Tiểu Không Vong
  assert.equal(degreeToMountain(96.5).huong.ten, 'Mão');
  assert.equal(degreeToMountain(96.5).kongWangStatus, 'tieu_khong_vong');

  // 112° is +7° from Ất (105°, Chấn) crossing to Thìn (120°, Tốn) at 112.5° -> Đại Không Vong
  assert.equal(degreeToMountain(112).huong.ten, 'Ất');
  assert.equal(degreeToMountain(112).isSameGuaAdjacent, false);
  assert.equal(degreeToMountain(112).kongWangStatus, 'dai_khong_vong');
});

test('3. Exact reference case: Vận 9 (2024), Hướng Mão (90°) - Tọa Dậu, Hạ quái', () => {
  const chart = lapTinhBanHuyenKhong({ namXay: 2024, doHuong: 90, cheDo: 'ha_quai' });
  assert.equal(chart.van, 9);
  assert.equal(chart.effectiveMode, 'ha_quai');
  assert.equal(chart.directionInfo.huong.ten, 'Mão');
  assert.equal(chart.directionInfo.toa.ten, 'Dậu');

  const matrix = chart.grid.map((row) =>
    row.map((cell) => [cell.sonStar, cell.vanStar, cell.huongStar])
  );
  assert.deepEqual(matrix, [
    [[1, 8, 8], [6, 4, 3], [8, 6, 1]],
    [[9, 7, 9], [2, 9, 7], [4, 2, 5]],
    [[5, 3, 4], [7, 5, 2], [3, 1, 6]],
  ]);

  assert.ok(chart.patterns.some((p) => p.name.includes('Song Tinh Đáo Hướng')));
});

test('4. Classical charts & patterns: Vượng Sơn Vượng Hướng, Thượng Sơn Hạ Thủy, Song Tinh Đáo Tọa', () => {
  // Vận 8, Hướng Sửu (30°) - Tọa Mùi -> Vượng Sơn Vượng Hướng + Hợp Thập
  const v8Suu = lapTinhBanHuyenKhong({ namXay: 2010, doHuong: 30, cheDo: 'ha_quai' });
  assert.ok(v8Suu.patterns.some((p) => p.id === 'vuong_son_vuong_huong'));
  assert.ok(v8Suu.patterns.some((p) => p.id === 'huong_van_hop_thap'));

  // Vận 8, Tọa Cấn Hướng Khôn (225°) -> Thượng Sơn Hạ Thủy + Phụ Mẫu Tam Ban Quái
  const v8Khon = lapTinhBanHuyenKhong({ namXay: 2010, doHuong: 225, cheDo: 'ha_quai' });
  assert.ok(v8Khon.patterns.some((p) => p.id === 'thuong_son_ha_thuy'));
  assert.ok(v8Khon.patterns.some((p) => p.id === 'phu_mau_tam_ban'));

  // Vận 8, Tọa Nhâm Hướng Bính (165°) -> Song Tinh Đáo Tọa (Khảm = [8|4|8])
  const v8Binh = lapTinhBanHuyenKhong({ namXay: 2010, doHuong: 165, cheDo: 'ha_quai' });
  assert.ok(v8Binh.patterns.some((p) => p.id === 'song_tinh_dao_toa'));
  assert.equal(v8Binh.palacesByCung[1].sonStar, 8);
  assert.equal(v8Binh.palacesByCung[1].huongStar, 8);
});

test('5. Thế quái table covers all 24 mountains (13 replaced, 11 unchanged) & preserves flight direction', () => {
  const counts = { 1: 0, 2: 0, 6: 0, 7: 0, 9: 0 };
  let changedCount = 0;
  let unchangedCount = 0;

  for (const s of SON_24) {
    const rep = THE_QUAI_MAP[s.ten];
    assert.ok(rep in counts, `Unexpected Thế quái star ${rep} for ${s.ten}`);
    counts[rep] += 1;
    if (rep === s.cung) unchangedCount += 1;
    else changedCount += 1;
  }

  assert.deepEqual(counts, { 1: 4, 2: 5, 6: 6, 7: 5, 9: 4 });
  assert.equal(changedCount, 13);
  assert.equal(unchangedCount, 11);

  // Star 5 entering center is never substituted
  const five = resolveTheQuaiStar(5, 'Thiên');
  assert.equal(five.saoThe, 5);
  assert.equal(five.changed, false);

  // Auto mode switches to Thế quái at >= 4.5° offset while keeping original mountain flight polarity
  const autoChart = lapTinhBanHuyenKhong({ namXay: 2024, doHuong: 95.5, cheDo: 'auto' });
  assert.equal(autoChart.effectiveMode, 'the_quai');
  assert.equal(autoChart.directionInfo.huong.ten, 'Mão');
  // In Vận 9 Mão(3): vanBan[3] = 7 (Thiên -> Tứ Chính Thiên = -1). Thế quái of (7, Thiên) = Dậu -> 7 (unchanged)
  // For Tọa Dậu(7): vanBan[7] = 2 (Thiên -> Tứ Duy Thiên = +1). Thế quái of (2, Thiên) = Khôn -> 2 (unchanged)
  // Test Giáp (Địa, cung 3) at 75° + 5° = 80° in Vận 9:
  // vanBan[3] = 7, (7, Địa) = Canh -> 9! vanBan[7] = 2, (2, Địa) = Mùi -> 2.
  const giapThe = lapTinhBanHuyenKhong({ namXay: 2024, doHuong: 80, cheDo: 'auto' });
  assert.equal(giapThe.effectiveMode, 'the_quai');
  assert.equal(giapThe.trace.saoHuongGoc, 7);
  assert.equal(giapThe.trace.saoHuongNhapTrung, 9);
  assert.equal(giapThe.trace.chieuHuong, +1); // Giáp is Địa in Tứ Chính 7 -> +1
});

test('6. Lưu Niên, Lưu Nguyệt (Tử Bạch Quyết) & Thần Sát afflictions', () => {
  assert.equal(getAnnualCenterStar(2024), 3);
  assert.equal(getAnnualCenterStar(2025), 2);
  assert.equal(getAnnualCenterStar(2026), 1);
  assert.equal(getAnnualCenterStar(2027), 9);
  assert.equal(getAnnualCenterStar(2028), 8);

  // 2027 Đinh Mùi (Tứ Khố): Month 1 = 5, Month 2 = 4 (matches reference screenshot!)
  assert.equal(getMonthlyCenterStar(2027, 1), 5);
  assert.equal(getMonthlyCenterStar(2027, 2), 4);
  // Year boundary continuity: 2026 (Bính Ngọ, M1=8 -> M12=6) -> 2027 (Đinh Mùi, M1=5)
  assert.equal(getMonthlyCenterStar(2026, 12), 6);
  assert.equal(getMonthlyCenterStar(2027, 1), 5);

  const chart2027 = lapTinhBanHuyenKhong({
    namXay: 2024,
    doHuong: 90,
    namXem: 2027,
    thangXem: 2,
    includeAnnual: true,
    includeMonthly: true,
  });

  assert.equal(chart2027.afflictions.thaiTue.mountain, 'Mùi');
  assert.equal(chart2027.afflictions.thaiTue.cung, 2);
  assert.equal(chart2027.afflictions.tuePha.mountain, 'Sửu');
  assert.equal(chart2027.afflictions.tuePha.cung, 8);
  assert.equal(chart2027.afflictions.tamSatDirection, 'Tây');
  assert.equal(chart2027.afflictions.nguHoangCung, 1);
  assert.equal(chart2027.afflictions.nhiHacCung, 7);
});

test('7. HUYEN_KHONG_81 dataset & CUU_TINH_INFO cover all 81 pairs and 9 stars', () => {
  assert.equal(Object.keys(CUU_TINH_INFO).length, 9);
  assert.equal(Object.keys(CUU_CUNG_META).length, 9);
  assert.equal(Object.keys(HUYEN_KHONG_81).length, 81);

  const validRatings = new Set(['cat', 'binh', 'hung']);
  for (let s = 1; s <= 9; s++) {
    for (let h = 1; h <= 9; h++) {
      const pair = getStarPairInfo(s, h);
      assert.ok(pair, `Missing pair ${s}-${h}`);
      assert.ok(validRatings.has(pair.baseRating), `Invalid rating at ${s}-${h}`);
      assert.ok(pair.title.length > 5);
      assert.ok(pair.shortTag.length > 2);
      assert.ok(pair.meaning.length > 15);
      assert.ok(pair.layoutAdvice.length > 15);
    }
  }
});

test('8. computeBatTrachFromBirth matches classical Cung Phi formulas', () => {
  assert.equal(computeBatTrachFromBirth(1990, 'nam').trigram, 'Khảm');
  assert.equal(computeBatTrachFromBirth(1990, 'nu').trigram, 'Cấn');
  assert.equal(computeBatTrachFromBirth(1996, 'nam').trigram, 'Tốn');
  assert.equal(computeBatTrachFromBirth(1996, 'nu').trigram, 'Khôn');
  assert.equal(computeBatTrachFromBirth(2000, 'nam').trigram, 'Ly');
  assert.equal(computeBatTrachFromBirth(2000, 'nu').trigram, 'Càn');
});

test('9. SSR renders HuyenKhongPage & App without error and follows Web Platform standards', async () => {
  const server = await createServer({
    root: TUVI_ROOT,
    configFile: false,
    cacheDir: path.resolve(TUVI_ROOT, 'node_modules/.vite-ssr-hk'),
    resolve: VITE_RESOLVE,
    plugins: [SHARED_SHIM_PLUGIN, react()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: 'custom',
  });

  try {
    const { default: HuyenKhongPage } = await server.ssrLoadModule('/src/components/HuyenKhongPage.jsx');
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');

    const hkHtml = renderToStaticMarkup(React.createElement(HuyenKhongPage, { savedProfiles: [] }));
    assert.ok(hkHtml.includes('Tinh bàn Cửu cung'), 'Must render main title');
    assert.ok(hkHtml.includes('<svg'), 'Must render 24-mountain SVG compass');
    assert.ok(hkHtml.includes('Mão') && hkHtml.includes('Dậu') && hkHtml.includes('Ngọ') && hkHtml.includes('Tý'));
    assert.ok(hkHtml.includes('Song Tinh Đáo Hướng'));
    assert.ok(hkHtml.includes('closedby="any"'), 'Print preview must use native <dialog closedby="any">');
    assert.ok(!hkHtml.includes('role="dialog"'), 'Must not use ARIA role="dialog"');
    assert.ok(!hkHtml.includes('aria-modal="true"'), 'Must not use aria-modal="true"');

    // Verify no headings inside <summary>
    const summaryMatches = hkHtml.match(/<summary>[\s\S]*?<\/summary>/g) || [];
    assert.ok(summaryMatches.length >= 4, 'Expected at least 4 <details> disclosures');
    for (const s of summaryMatches) {
      assert.ok(!/<h[1-6]\b/i.test(s), `Found heading inside <summary>: ${s}`);
    }

    const prevStorage = globalThis.localStorage;
    const prevWindow = globalThis.window;
    globalThis.localStorage = { getItem: () => null, setItem: () => {} };
    globalThis.window = { location: { hash: '#huyen-khong', search: '' } };
    try {
      const appHtml = renderToStaticMarkup(React.createElement(App));
      assert.ok(appHtml.includes('href="#huyen-khong"'), 'App nav must include #huyen-khong link');
      assert.ok(appHtml.includes('Tinh bàn Cửu cung'), 'App must render HuyenKhongPage when hash is #huyen-khong');
    } finally {
      if (prevStorage === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = prevStorage;
      if (prevWindow === undefined) delete globalThis.window;
      else globalThis.window = prevWindow;
    }
  } finally {
    await server.close();
  }
});
