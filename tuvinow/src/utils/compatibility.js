import { buildTuViText, TOPICS } from './buildTuViPrompt.js';
import { buildTuViEvidence } from './tuViEvidence.js';
import {
  computeCrossChartSihua,
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
} from './tuViZiweiModule.js';
import {
  COMPATIBILITY_VERSION,
  WEIGHTS,
  ROMANCE_STARS,
  createCompatibilityPerson,
  buildPersonProfileFromChart,
  evaluateCompatibility,
  computeYearlyCompatibilityForecast,
} from './hopHonEngine.js';

export {
  COMPATIBILITY_VERSION,
  WEIGHTS,
  ROMANCE_STARS,
  createCompatibilityPerson,
  evaluateCompatibility,
  computeYearlyCompatibilityForecast,
};

function enrichSideFromSaved(side, payloadPerson, defaultGender) {
  if (!side || typeof side !== 'object') {
    if (payloadPerson) return createCompatibilityPerson(payloadPerson);
    return side;
  }

  const result = side.result;
  const inputData = side.inputData || {};
  const hoTen = side.person?.hoTen || payloadPerson?.hoTen || inputData.name || 'Ẩn danh';
  const gioiTinh =
    side.person?.gioiTinh ||
    payloadPerson?.gioiTinh ||
    (inputData.gender === 0 ? 'Nữ' : inputData.gender === 1 ? 'Nam' : defaultGender);

  if (result?.palates?.length === 12) {
    if (
      side.person?.palaceSummary &&
      side.person?.temperament &&
      side.person?.individualLoveProfile
    ) {
      Object.defineProperty(side.person, '_chart', { value: result, enumerable: false, configurable: true });
      Object.defineProperty(side.person, '_inputData', { value: inputData, enumerable: false, configurable: true });
      return side;
    }
    const upgradedPerson = buildPersonProfileFromChart({
      hoTen,
      gioiTinh,
      inputData,
      result,
    });
    return {
      ...side,
      inputData,
      result,
      person: upgradedPerson,
    };
  }

  if (payloadPerson) {
    return createCompatibilityPerson(payloadPerson);
  }
  return side;
}

/**
 * Nâng cấp an toàn hồ sơ Hợp Hôn khôi phục từ lịch sử (bao gồm bản cũ `user-reference-1`)
 * lên đầy đủ cấu trúc dữ liệu `tuvi-hophon-v2` để UI và AI hoạt động trơn tru không lỗi.
 */
export function upgradeRestoredCompatibilityPair(pair) {
  if (!pair || typeof pair !== 'object') return pair;

  const isAlreadyCompleteV2 =
    pair.assessment?.version === COMPATIBILITY_VERSION &&
    pair.assessment?.cards?.tamHop &&
    pair.assessment?.cards?.phiTinh &&
    pair.assessment?.cards?.tinhCach &&
    pair.assessment?.cards?.nguHanhDaoHoa &&
    pair.assessment?.tamHopDetail &&
    pair.assessment?.phiTinhDetail &&
    pair.assessment?.tinhCachDetail &&
    pair.individualProfiles?.chong &&
    pair.individualProfiles?.vo &&
    pair.initialForecast?.years?.length > 0;

  if (isAlreadyCompleteV2) {
    if (pair.chong?.person && pair.chong?.result) {
      Object.defineProperty(pair.chong.person, '_chart', { value: pair.chong.result, enumerable: false, configurable: true });
    }
    if (pair.vo?.person && pair.vo?.result) {
      Object.defineProperty(pair.vo.person, '_chart', { value: pair.vo.result, enumerable: false, configurable: true });
    }
    return pair;
  }

  const chong = enrichSideFromSaved(pair.chong, pair.payload?.chong, 'Nam');
  const vo = enrichSideFromSaved(pair.vo, pair.payload?.vo, 'Nữ');

  const assessment = evaluateCompatibility(chong.person, vo.person, chong.result, vo.result);

  let synastry = pair.synastry || null;
  if (!synastry && chong.result?.palates?.length === 12 && vo.result?.palates?.length === 12) {
    try {
      synastry = computeCrossChartSihua(chong.result, vo.result);
    } catch {
      synastry = null;
    }
  }

  const individualProfiles = {
    chong: chong.person?.individualLoveProfile || null,
    vo: vo.person?.individualLoveProfile || null,
  };

  const initialForecast =
    pair.initialForecast?.years?.length > 0
      ? pair.initialForecast
      : computeYearlyCompatibilityForecast(chong, vo, { yearsCount: 5 });

  return {
    ...pair,
    payload: pair.payload || {},
    chong,
    vo,
    assessment,
    synastry,
    individualProfiles,
    initialForecast,
    hemingKnowledge: pair.hemingKnowledge || {
      STAR_IN_FUQI_GU,
      SIHUA_IN_FUQI_GU,
      HEMING_METHODOLOGY,
    },
  };
}

export function buildCompatibility(payload, options = {}) {
  if (!payload?.chong || !payload?.vo) {
    throw new Error('Vui lòng cung cấp đầy đủ thông tin hai người để đối chiếu hợp hôn.');
  }

  const chong = createCompatibilityPerson(payload.chong);
  const vo = createCompatibilityPerson(payload.vo);
  const assessment = evaluateCompatibility(chong.person, vo.person, chong.result, vo.result);

  let synastry = null;
  try {
    synastry = computeCrossChartSihua(chong.result, vo.result);
  } catch {
    synastry = null;
  }

  const forecastYears = options.forecastYears ?? options.yearsCount ?? 5;
  const initialForecast = computeYearlyCompatibilityForecast(chong, vo, {
    startYear: options.startYear,
    yearsCount: forecastYears,
  });

  return {
    payload,
    chong,
    vo,
    assessment,
    synastry,
    individualProfiles: {
      chong: chong.person.individualLoveProfile,
      vo: vo.person.individualLoveProfile,
    },
    initialForecast,
    hemingKnowledge: {
      STAR_IN_FUQI_GU,
      SIHUA_IN_FUQI_GU,
      HEMING_METHODOLOGY,
    },
  };
}

export function compatibilityEvidence(pair) {
  return ['chong', 'vo'].flatMap((key) =>
    buildTuViEvidence(pair[key].result).map((entry) => ({
      ...entry,
      id: `${key}.${entry.id}`,
      label: `${key === 'chong' ? 'Chồng' : 'Vợ'} · ${pair[key].inputData.name} · ${entry.label}`,
    }))
  );
}

function formatPillarLines(cards = {}) {
  return Object.values(cards)
    .map((card) => {
      const pct = Math.round((card.weight || 0) * 100);
      const factorLines = (card.factors || [])
        .map((f) => `  • [${f.delta >= 0 ? `+${f.delta}` : f.delta}] ${f.label}`)
        .join('\n');
      return `- ${card.title} (${pct}% trọng số): ${card.score}/100 điểm\n  Nhận định: ${card.detail}${
        factorLines ? `\n${factorLines}` : ''
      }`;
    })
    .join('\n');
}

function formatIndividualLoveSection(label, person) {
  const prof = person?.individualLoveProfile;
  if (!prof) return '';
  const decades = (prof.activeMarriageDecades || [])
    .map((d) => `  • ${d.range} (Cung ${d.palaceName} · ${d.chiName}): ${d.note}`)
    .join('\n');
  const sihua = (prof.internalSihuaNotes || []).map((n) => `  • ${n}`).join('\n');
  return [
    `[${label} — ${person.hoTen} (${person.canChiNam} · ${person.napAm} · ${person.cucName})]`,
    `- Cách cục tình duyên: ${prof.archetypeTitle}`,
    `- Hình mẫu bạn đời: ${prof.spousePortrait}`,
    `- Cung Phu Thê: ${prof.phuTheAnalysis}`,
    `- Cung Phúc Đức: ${prof.phucDucAnalysis}`,
    ...(sihua ? [`- Nội tại Tứ Hóa hôn nhân:\n${sihua}`] : []),
    ...(decades ? [`- Đại Hạn kích hoạt tình duyên – gia đạo:\n${decades}`] : []),
  ].join('\n');
}

export function compatibilityText(rawPair) {
  const pair = upgradeRestoredCompatibilityPair(rawPair);
  const a = pair.assessment;

  const tamHopSection = a.tamHopDetail
    ? [
        '1. ĐỐI CHIẾU TAM HỢP BÀN (MỆNH ⇄ PHU THÊ & PHÚC ĐỨC):',
        `- ${a.tamHopDetail.aMenhToBPhuThe?.summary || ''}`,
        `- ${a.tamHopDetail.bMenhToAPhuThe?.summary || ''}`,
        `- Cung Phu Thê đôi bên: ${a.tamHopDetail.phuTheComparison?.summary || ''}`,
        `- Nền tảng Phúc Đức: ${a.tamHopDetail.phucDucFoundation?.summary || ''}`,
      ].join('\n')
    : '';

  const phiTinhFlights = [
    ...(a.phiTinhDetail?.aToBFlights || []),
    ...(a.phiTinhDetail?.bToAFlights || []),
  ];
  const phiTinhSection = [
    '2. PHI TINH TỨ HÓA TƯƠNG THAM 2 CHIỀU (HÀ LẠC / BẮC PHÁI & LƯƠNG PHÁI):',
    `- Tổng kết tương trợ: ${a.phiTinhDetail?.whoSupportsWhom || ''}`,
    ...phiTinhFlights.map((f) => `- [${f.scoreDelta >= 0 ? `+${f.scoreDelta}` : f.scoreDelta}] ${f.summary}`),
  ].join('\n');

  const tinhCachSection = a.tinhCachDetail
    ? [
        '3. BÙ TRỪ TÍNH CÁCH ÂM DƯƠNG · CƯƠNG NHU (PP3 DƯƠNG DỊCH ĐỨC):',
        `- Kiểu phối hợp: ${a.tinhCachDetail.summary}`,
        `- Khí chất ${a.husbandName}: ${a.tinhCachDetail.personA?.label} (Dương ${a.tinhCachDetail.personA?.yangScore}% / Âm ${a.tinhCachDetail.personA?.yinScore}%)`,
        `- Khí chất ${a.wifeName}: ${a.tinhCachDetail.personB?.label} (Dương ${a.tinhCachDetail.personB?.yangScore}% / Âm ${a.tinhCachDetail.personB?.yinScore}%)`,
        ...(a.tinhCachDetail.frictionWarnings?.length
          ? [`- Điểm ma sát cần lưu ý: ${a.tinhCachDetail.frictionWarnings.join(' | ')}`]
          : []),
        ...(a.tinhCachDetail.harmonyTips?.length
          ? [`- Gợi ý giao tiếp: ${a.tinhCachDetail.harmonyTips.join(' | ')}`]
          : []),
      ].join('\n')
    : '';

  const forecast = pair.initialForecast;
  const forecastSection = forecast?.years?.length
    ? [
        `4. DỰ BÁO VẬN TRÌNH TÌNH DUYÊN & HÔN NHÂN (${forecast.startYear}–${forecast.endYear}):`,
        `- Tổng quan: ${forecast.summary}`,
        ...forecast.years.map(
          (y) =>
            `- Năm ${y.year} (${y.canChiYear}): ${y.combinedScore}/100 điểm [${y.statusLabel}]${
              y.isSharedHighlight ? ' ★ Năm Hỷ Tín Cộng Hưởng' : ''
            } | ${a.husbandName} (${y.personA.age}t): ${y.personA.signals.join('; ') || 'Bình ổn'} | ${
              a.wifeName
            } (${y.personB.age}t): ${y.personB.signals.join('; ') || 'Bình ổn'}`
        ),
      ].join('\n')
    : '';

  return [
    `HỢP HÔN TỬ VI CHÍNH TÔNG — ${a.version}`,
    `Cặp đôi: ${a.husbandName} & ${a.wifeName}`,
    `Tổng điểm hòa hợp: ${a.totalScore}/100 (Điểm chi tiết: ${a.rawScore}/100) — Xếp hạng: ${a.ratingText}`,
    `Tóm tắt: ${a.ratingSummary}`,
    `Tương quan Ngũ Hành Nạp Âm: ${a.elements.husbandNapAm || a.elements.husbandElement} ⇄ ${
      a.elements.wifeNapAm || a.elements.wifeElement
    } → ${a.elements.interaction}`,
    `Thiên Can & Địa Chi năm sinh: ${a.elements.thienCanRelation || '—'} | ${a.elements.diaChiRelation || '—'}`,
    `Trọng số 4 trụ cột: Tam Hợp 35% · Phi Tinh Tứ Hóa 30% · Bù Trừ Tính Cách 20% · Ngũ Hành & Hỷ Tín 15%.`,
    '',
    'CHI TIẾT ĐIỂM 4 TRỤ CỘT HỢP HÔN:',
    formatPillarLines(a.cards),
    '',
    tamHopSection,
    '',
    phiTinhSection,
    '',
    tinhCachSection,
    '',
    'TÌNH DUYÊN RIÊNG TỪNG NGƯỜI:',
    formatIndividualLoveSection('Người A', pair.chong.person),
    '',
    formatIndividualLoveSection('Người B', pair.vo.person),
    '',
    forecastSection,
    '',
    `NGƯỜI A — CHỒNG\n${buildTuViText(pair.chong.result, pair.chong.inputData)}`,
    '',
    `NGƯỜI B — VỢ\n${buildTuViText(pair.vo.result, pair.vo.inputData)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function compatibilityPrompt(pair, topic, question) {
  const upgraded = upgradeRestoredCompatibilityPair(pair);
  return `Bạn là chuyên gia Tử Vi Đẩu Số tinh thông Hợp Hôn theo cả Nam Phái (Tam Hợp · Thiên Kỷ Nghê Hải Hạ · Dương Dịch Đức) lẫn Bắc Phái / Hà Lạc / Lương Phái (Phi Tinh Tứ Hóa 2 chiều & Tự Hóa). Hãy luận giải hợp hôn cho hai người bên dưới bằng tiếng Việt sâu sắc, nhân văn và thực tế.
Chủ đề trọng tâm: ${TOPICS[topic] || TOPICS.love}
Câu hỏi của người dùng: ${
    question?.trim() ||
    'Phân tích toàn diện sự hòa hợp, nhân duyên tiền định, điểm cần dung hòa và bí quyết giữ gìn hạnh phúc lâu dài của hai người.'
  }

${compatibilityText(upgraded)}

YÊU CẦU LUẬN GIẢI CHUYÊN SÂU:
1. Bám sát dữ kiện đã tính sẵn trên cả hai lá số (Người A và Người B); mỗi nhận định phải dẫn rõ tên cung, chính/phụ tinh, độ sáng hoặc đường bay Tứ Hóa và ghi rõ thuộc về ai. Tuyệt đối không tự an lại sao, không bịa sao, không tự ý thay đổi điểm số của hệ thống.
2. Phân tích mạch lạc theo 5 phần:
   - Tổng quan Duyên Khởi & Mức độ Tương Hợp (${upgraded.assessment.totalScore}/100 — ${upgraded.assessment.ratingText}).
   - Đối chiếu Tam Hợp Bàn (Mệnh ⇄ Phu Thê hai chiều, Vô Chính Diệu mượn sao nếu có, và gốc rễ cung Phúc Đức của cả hai).
   - Luận giải Phi Tinh Tứ Hóa 2 Chiều (Can Năm Sinh, Can Cung Mệnh, Can Cung Phu Thê bay qua lại nhập Mệnh/Phu Thê/Tật Ách/Phúc Đức/Điền Trạch, xét cả Xung Chiếu và Tự Hóa / Lộc-Kỵ chuyển hóa nội tại).
   - Bù trừ Tính Cách Âm Dương · Cương Nhu (PP3 Dương Dịch Đức), Ngũ Hành Nạp Âm (bao gồm cách cục đắc cách hay thông quan hóa giải nếu tương khắc), Can Chi năm sinh & Sao Hỷ Tín.
   - Trả lời trực diện Câu Hỏi của người dùng, điểm rơi Lưu Niên Hỷ Tín trong 5 năm tới và 3 hành động ứng xử cụ thể giúp hai người gắn kết bền lâu.
3. Giữ chuẩn mực đạo đức Tử Vi: số lượng sao Đào Hoa không phải bằng chứng ngoại tình; điểm số hợp hôn phản ánh mức độ thuận lợi/ma sát năng lượng chứ không phải định mệnh bất biến; không phán quyết bắt buộc cưới hay chia tay chỉ từ lá số.`;
}
