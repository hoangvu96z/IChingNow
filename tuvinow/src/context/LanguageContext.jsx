import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Simplified translations for TuVi Now
const translations = {
  vi: {
    appName: 'TuVi Now',
    lapLaSo: 'Lập Lá Số',
    lapMoi: 'Lập lá số mới',
    hoTen: 'Họ Tên',
    ngaySinh: 'Ngày sinh',
    gioSinh: 'Giờ sinh',
    gioiTinh: 'Giới tính',
    nam: 'Nam',
    nu: 'Nữ',
    duongLich: 'Dương lịch',
    amLich: 'Âm lịch',
    tongQuan: 'Tổng Quan Lá Số',
  },
  en: {
    appName: 'TuVi Now',
    lapLaSo: 'Generate Chart',
    lapMoi: 'New Chart',
    hoTen: 'Full Name',
    ngaySinh: 'Date of Birth',
    gioSinh: 'Birth Hour',
    gioiTinh: 'Gender',
    nam: 'Male',
    nu: 'Female',
    duongLich: 'Solar Calendar',
    amLich: 'Lunar Calendar',
    tongQuan: 'Chart Summary',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('tuvi_language');
    return saved === 'en' ? 'en' : 'vi';
  });

  useEffect(() => {
    localStorage.setItem('tuvi_language', language);
  }, [language]);

  const currentTranslations = translations[language] || translations.vi;

  const t = (key, defaultValue = '') => {
    return currentTranslations[key] || defaultValue || key;
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
