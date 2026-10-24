import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import './index.css';

try {
  const theme = localStorage.getItem('nn_theme_v2') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
} catch {}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/note/sw.js', { scope: '/note/' })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
