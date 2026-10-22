import React from 'react';

export default function TarotAiAnimations() {
  return (
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes cardHover {
        0%, 100% { transform: translateY(0) rotate(-1deg); }
        50% { transform: translateY(-8px) rotate(1.5deg); }
      }
      @keyframes starPulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes cardShimmer {
        0% { left: -100%; }
        100% { left: 200%; }
      }
      @keyframes shimmerSlide {
        0% { left: -40%; }
        100% { left: 100%; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}
