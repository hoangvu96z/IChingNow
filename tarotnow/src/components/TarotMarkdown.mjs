import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function TarotMarkdown({ children, compact = false }) {
  const markdown = typeof children === 'string' ? children : '';
  const className = compact
    ? 'tarot-markdown tarot-markdown--compact'
    : 'tarot-markdown';

  return React.createElement(
    'div',
    { className },
    React.createElement(ReactMarkdown, { skipHtml: true }, markdown),
  );
}
