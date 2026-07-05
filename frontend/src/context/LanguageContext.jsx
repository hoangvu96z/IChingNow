import React, { createContext, useContext, useState, useEffect } from 'react';
import { vi } from '../data/translations/vi.js';
import { en } from '../data/translations/en.js';
import { EN_HEXAGRAM_DESCRIPTIONS } from '../data/translations/en_descriptions.js';
import { HEXAGRAM_DESCRIPTIONS } from '../data/hexagramDescriptions.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('iching_language');
      return saved === 'en' || saved === 'vi' ? saved : 'vi';
    } catch (e) {
      return 'vi';
    }
  });

  const setLanguage = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLanguageState(lang);
      try {
        localStorage.setItem('iching_language', lang);
      } catch (e) {
        console.error('Failed to save language to localStorage:', e);
      }
    }
  };

  const dictionary = language === 'en' ? en : vi;

  // Translate function
  const t = (key, fallback = '') => {
    if (!key) return '';
    return dictionary[key] ?? fallback ?? key;
  };

  // Helper to translate Hexagram Description specifically
  const getHexDescription = (upperId, lowerId) => {
    const key = `${upperId}-${lowerId}`;
    if (language === 'en') {
      return EN_HEXAGRAM_DESCRIPTIONS[key] || HEXAGRAM_DESCRIPTIONS[key] || null;
    }
    return HEXAGRAM_DESCRIPTIONS[key] || null;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getHexDescription }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
