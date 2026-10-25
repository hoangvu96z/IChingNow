import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@shared/context/AuthContext.jsx';
import App from './App.jsx';
import './styles.css';

const savedSpiritTheme = localStorage.getItem('spiritnow_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedSpiritTheme);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
