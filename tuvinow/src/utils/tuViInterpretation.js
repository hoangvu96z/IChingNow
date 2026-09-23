import { luanSoTuViToanDien } from './tuViInterpretationV5.js';
import { DIA_CHI, TEN_CUNG_CHUC_NANG } from './tuViEngine.js';

export const REPORT_SECTIONS = [
  ['step1_ThienBan', 'Thiên bàn & Mệnh – Cục'],
  ['step2_MenhThan', 'Mệnh & Thân'],
  ['step3_TamHop', 'Tam hợp & cách cục'],
  ['step4_SatTinhTuHoa', 'Tứ Hóa & sát tinh'],
  ['step5_12CungAndVanHan', '12 cung & đại hạn'],
  ['step6_LuuNien', 'Vận hạn năm xem'],
];

// Adapt existing chart metadata only; never recalculate stars or supply missing facts.
export function prepareInterpretationInput(result) {
  const fail = () => { throw new Error('Lá số này chưa đủ dữ liệu để luận đoán tự động. Hãy lập lại lá số từ thông tin sinh.'); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (!result || !['Dương Nam', 'Dương Nữ', 'Âm Nam', 'Âm Nữ'].includes(result.amDuongNamNu)
      || !DIA_CHI.includes(result.menhCung) || !DIA_CHI.includes(result.thanCung)
      || ![2, 3, 4, 5, 6].includes(result.cucNumber)
      || !['cucName', 'chuMenh', 'chuThan', 'banMenhNapAm'].every(k => text(result[k]))
      || !/kim|mộc|moc|thủy|thuy|hỏa|hoa|thổ|tho/i.test(result.banMenhNapAm)
      || !Array.isArray(result.palates) || result.palates.length !== 12) fail();
  const palates = result.palates.map(p => {
    if (!p || !Number.isInteger(p.chiIndex) || DIA_CHI[p.chiIndex] !== p.chiName
        || !text(p.chucNang) || !text(p.trangSinh) || !Number.isInteger(p.daiHan)
        || !['chinhTinh', 'phuTinh'].every(k => Array.isArray(p[k]) && p[k].every(text))
        || typeof p.isTuan !== 'boolean' || typeof p.isTriet !== 'boolean') fail();
    const base = p.chucNang.replace(/\s*<THÂN>/g, '').trim();
    return { ...p, chucNang: base + (p.chiName === result.thanCung ? ' <THÂN>' : '') };
  });
  if (new Set(palates.map(p => p.chiIndex)).size !== 12
      || !TEN_CUNG_CHUC_NANG.every(name => palates.filter(p => p.chucNang.replace(' <THÂN>', '') === name).length === 1)
      || !palates.find(p => p.chiName === result.menhCung)?.chucNang.includes('Mệnh')) fail();
  const viewYearStr = text(result.viewYearStr) ? result.viewYearStr
    : text(result.viewYearCanChi) ? [result.viewYear, result.viewYearCanChi].filter(Boolean).join(' ') : undefined;
  return { ...result, palates, viewYearStr };
}

export function buildTuViInterpretation(result) {
  const input = prepareInterpretationInput(result);
  return { sections: luanSoTuViToanDien(input), hasViewYear: Boolean(input.viewYearStr) };
}

// Presentation only: retain literal chart markers instead of treating them as HTML.
export function interpretationMarkdown(text) {
  return text.replace(/[<>]/g, char => char === '<' ? '&lt;' : '&gt;').replace(/^• /gm, '- ');
}
