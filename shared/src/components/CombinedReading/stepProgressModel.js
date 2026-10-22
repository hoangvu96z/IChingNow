export function getStepProgressItems({
  step,
  hasChart,
  isVi,
  hasPrecastHex,
  maxStepReached,
  hoveredStep,
  topic,
  localBirthInfo,
  aiResponse,
}) {
  return [1, hasChart ? null : 2, 3, 4].filter(Boolean).map((s, idx) => {
    let label = '';
    if (hasChart) {
      const labelsTuVi = isVi
        ? ['Chủ đề', 'Hỏi & Gieo quẻ', 'Luận giải AI']
        : ['Topic', 'Ask & Cast', 'AI Reading'];
      label = labelsTuVi[idx];
    } else {
      const labelsIChing = isVi
        ? ['Chủ đề', 'Ngày sinh', hasPrecastHex ? 'Xác nhận & Quẻ' : 'Hỏi & Quẻ', 'Luận giải AI']
        : ['Topic', 'Birth Info', hasPrecastHex ? 'Confirm & Hex' : 'Ask & Hex', 'AI Reading'];
      label = labelsIChing[idx];
    }

    const actualStep = hasChart ? [1, 3, 4][idx] : s;
    const isActive = step === actualStep;
    const isPassed = step > actualStep;
    const isUnlocked = actualStep <= maxStepReached;
    const isClickable = !isActive && (
      isPassed ||
      isUnlocked ||
      actualStep === 1 ||
      (actualStep === 2 && !hasChart && !!topic) ||
      (actualStep === 3 && !!topic && (hasChart || !!localBirthInfo || maxStepReached >= 3)) ||
      (actualStep === 4 && (maxStepReached >= 4 || !!aiResponse))
    );
    const isHovered = hoveredStep === actualStep;

    let tooltip = '';
    if (isActive) {
      tooltip = isVi ? `Đang ở bước ${idx + 1}: ${label}` : `Current step ${idx + 1}: ${label}`;
    } else if (isClickable) {
      tooltip = isVi ? `Bấm để chuyển đến bước ${idx + 1}: ${label}` : `Click to jump to step ${idx + 1}: ${label}`;
    } else {
      tooltip = isVi ? 'Vui lòng hoàn thành các bước trước' : 'Please complete previous steps first';
    }

    return {
      s,
      idx,
      label,
      actualStep,
      isActive,
      isPassed,
      isUnlocked,
      isClickable,
      isHovered,
      tooltip,
    };
  });
}
