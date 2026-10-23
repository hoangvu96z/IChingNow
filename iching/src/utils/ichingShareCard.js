const HEXAGRAM_BITS = /^[01]{6}$/;

function getBinary(hexagram, fallbackBinary, lines) {
  if (HEXAGRAM_BITS.test(hexagram?.binary || '')) return hexagram.binary;
  if (HEXAGRAM_BITS.test(fallbackBinary || '')) return fallbackBinary;

  if (Array.isArray(lines) && lines.length >= 6) {
    const byIndex = new Map(lines.map((line) => [Number(line.index), line]));
    const bits = Array.from({ length: 6 }, (_, offset) => {
      const line = byIndex.get(offset + 1);
      if (!line || !['yang', 'yin'].includes(line.yinYang)) return null;
      return line.yinYang === 'yang' ? '1' : '0';
    });
    if (bits.every((bit) => bit !== null)) return bits.join('');
  }

  return null;
}

function createHexagramModel(hexagram, fallbackBinary, lines) {
  const binary = getBinary(hexagram, fallbackBinary, lines);
  if (!hexagram || !binary) return null;

  const sourceLines = Array.isArray(lines) ? lines : [];
  const linesByIndex = new Map(sourceLines.map((line) => [Number(line.index), line]));

  return {
    id: hexagram.id,
    name: hexagram.nameVi || '',
    chinese: hexagram.nameZh || '',
    lines: Array.from({ length: 6 }, (_, offset) => {
      const index = offset + 1;
      return {
        index,
        yinYang: binary[offset] === '1' ? 'yang' : 'yin',
        moving: Boolean(linesByIndex.get(index)?.moving),
      };
    }),
    overview: typeof hexagram.description?.tong_quat === 'string'
      ? hexagram.description.tong_quat
      : '',
  };
}

/**
 * Selects only share-safe, public reading fields. In particular, question and
 * caster data are never copied into the image model.
 */
export function buildIChingShareCardModel(result) {
  if (!result?.primaryHexagram) return null;

  const primary = createHexagramModel(
    result.primaryHexagram,
    result.primaryBinary,
    result.lines,
  );
  if (!primary) return null;

  const hasMovingLines = Array.isArray(result.movingLines)
    ? result.movingLines.length > 0
    : Array.isArray(result.lines) && result.lines.some((line) => line.moving);
  const changed = hasMovingLines && result.changedHexagram
    ? createHexagramModel(
      result.changedHexagram,
      result.changedBinary,
      result.changedLines,
    )
    : null;

  return { primary, changed };
}
