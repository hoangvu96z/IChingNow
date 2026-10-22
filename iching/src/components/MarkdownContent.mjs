import React from 'react';
import ReactMarkdown from 'react-markdown';

const components = {
  h1: ({ children }) => React.createElement('h2', {
    style: { color: 'var(--color-gold)', fontFamily: "'Noto Serif', serif", fontSize: '1.4rem', margin: '24px 0 12px', fontWeight: 700 },
  }, children),
  h2: ({ children }) => React.createElement('h3', {
    style: { color: 'var(--color-gold)', fontFamily: "'Noto Serif', serif", fontSize: '1.25rem', margin: '20px 0 10px', borderBottom: '1px solid rgba(184,134,11,0.15)', paddingBottom: 4, fontWeight: 700 },
  }, children),
  h3: ({ children }) => React.createElement('h4', {
    style: { color: 'var(--color-gold-light)', fontFamily: "'Noto Serif', serif", fontSize: '1.05rem', margin: '16px 0 8px', fontWeight: 700 },
  }, children),
  h4: ({ children }) => React.createElement('h5', {
    style: { color: 'var(--color-gold-light)', fontFamily: "'Noto Serif', serif", fontSize: '0.95rem', margin: '14px 0 8px', fontWeight: 700 },
  }, children),
  p: ({ children }) => React.createElement('p', {
    style: { margin: '8px 0', lineHeight: 1.65, color: 'var(--color-ink)' },
  }, children),
  strong: ({ children }) => React.createElement('strong', {
    style: { color: 'var(--color-ink)', fontWeight: 700 },
  }, children),
  ul: ({ children }) => React.createElement('ul', {
    style: { margin: '8px 0', paddingLeft: 30 },
  }, children),
  ol: ({ children }) => React.createElement('ol', {
    style: { margin: '8px 0', paddingLeft: 30 },
  }, children),
  li: ({ children }) => React.createElement('li', {
    style: { marginBottom: 6, listStyleType: 'square', color: 'var(--color-ink)' },
  }, children),
  a: ({ href, children }) => React.createElement('a', {
    href,
    target: '_blank',
    rel: 'noopener noreferrer',
  }, children),
};

export default function MarkdownContent({ children }) {
  const markdown = typeof children === 'string' ? children : '';
  return React.createElement(ReactMarkdown, { components }, markdown);
}
