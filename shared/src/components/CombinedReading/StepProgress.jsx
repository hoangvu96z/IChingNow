import React from 'react';
import { getStepProgressItems } from './stepProgressModel.js';

export default function StepProgress({
  step,
  setStep,
  hasChart,
  isVi,
  hasPrecastHex,
  maxStepReached,
  hoveredStep,
  setHoveredStep,
  topic,
  localBirthInfo,
  aiResponse,
}) {
  const progressSteps = getStepProgressItems({
    step,
    hasChart,
    isVi,
    hasPrecastHex,
    maxStepReached,
    hoveredStep,
    topic,
    localBirthInfo,
    aiResponse,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '24px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '14px',
      padding: '8px 12px',
    }}>
      {progressSteps.map(({ s, idx, label, actualStep, isActive, isPassed, isUnlocked, isClickable, isHovered, tooltip }) => {
        return (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: idx < (hasChart ? 2 : 3) ? 1 : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (isClickable) setStep(actualStep);
              }}
              onMouseEnter={() => setHoveredStep(actualStep)}
              onMouseLeave={() => setHoveredStep(null)}
              disabled={!isClickable && !isActive}
              title={tooltip}
              aria-label={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: isHovered && isClickable
                  ? 'rgba(229,193,88,0.15)'
                  : isActive
                    ? 'rgba(229,193,88,0.08)'
                    : 'transparent',
                border: isHovered && isClickable
                  ? '1px solid rgba(229,193,88,0.45)'
                  : isActive
                    ? '1px solid rgba(229,193,88,0.25)'
                    : '1px solid transparent',
                borderRadius: '20px',
                padding: '4px 10px',
                cursor: isClickable ? 'pointer' : (isActive ? 'default' : 'not-allowed'),
                transition: 'all 0.2s ease',
                outline: 'none',
                transform: isHovered && isClickable ? 'translateY(-1px)' : 'none',
                boxShadow: isHovered && isClickable ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(229,193,88,0.4), rgba(229,193,88,0.18))'
                  : isPassed
                    ? 'rgba(229,193,88,0.22)'
                    : isUnlocked
                      ? 'rgba(229,193,88,0.12)'
                      : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${
                  isActive
                    ? '#e5c158'
                    : isPassed
                      ? 'rgba(229,193,88,0.6)'
                      : isUnlocked
                        ? 'rgba(229,193,88,0.35)'
                        : 'rgba(255,255,255,0.1)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: isActive
                  ? '#fff'
                  : isPassed || isUnlocked
                    ? '#e5c158'
                    : 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: isActive ? '0 0 10px rgba(229,193,88,0.5)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                {isPassed ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: '11.5px',
                color: isActive
                  ? '#e5c158'
                  : isHovered && isClickable
                    ? '#fff'
                    : isPassed
                      ? 'rgba(255,255,255,0.85)'
                      : isUnlocked
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? 700 : (isPassed || (isHovered && isClickable)) ? 600 : 400,
                whiteSpace: 'nowrap',
                textDecoration: isHovered && isClickable ? 'underline' : 'none',
                textUnderlineOffset: '3px',
                transition: 'all 0.2s ease',
              }}>
                {label}
              </span>
            </button>
            {idx < (hasChart ? 2 : 3) && (
              <div style={{
                flex: 1,
                height: '2px',
                minWidth: '8px',
                background: isPassed
                  ? 'linear-gradient(90deg, rgba(229,193,88,0.6), rgba(229,193,88,0.2))'
                  : 'rgba(255,255,255,0.08)',
                borderRadius: '1px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
