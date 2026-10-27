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
        color: 'var(--badge-triet-color)',
        background: 'var(--badge-triet-bg)',
        border: '1px solid var(--badge-triet-border)',
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
