import React, { createContext, useContext, useState } from 'react';
import { vi } from '../data/translations/vi.js';
import { en } from '../data/translations/en.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('notenow_language') : null;
      return saved === 'en' || saved === 'vi' ? saved : 'vi';
    } catch {
      return 'vi';
    }
  });

  const setLanguage = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLanguageState(lang);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('notenow_language', lang);
        }
      } catch (e) {
        console.error('Failed to save language to localStorage:', e);
      }
    }
  };

  const dictionary = language === 'en' ? en : vi;

  // Translate function with optional placeholder replacement (e.g. {count}, {email})
  const t = (key, fallback = '', params = {}) => {
    if (!key) return '';
    let val = dictionary[key] ?? fallback ?? key;
    if (typeof val === 'string' && params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for isolated components/tests
    return {
      language: 'vi',
      setLanguage: () => {},
      t: (key, fallback = '') => fallback || key,
    };
  }
  return context;
}
