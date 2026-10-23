import React from 'react';

export default function HistoryLoadErrorNotice({ error, onRetry }) {
  if (!error) return null;

  return React.createElement(
    'div',
    {
      role: 'alert',
      'aria-live': 'assertive',
      style: {
        margin: '0 0 16px',
        padding: '10px 14px',
        borderRadius: 10,
        color: '#fecaca',
        background: 'rgba(127,29,29,0.28)',
        border: '1px solid rgba(248,113,113,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      },
    },
    React.createElement('span', null, '⚠ Không tải được lịch sử lá số. Vui lòng thử lại.'),
    React.createElement(
      'button',
      { className: 'tuvi-history-link', type: 'button', onClick: onRetry },
      'Thử lại',
    ),
  );
}
