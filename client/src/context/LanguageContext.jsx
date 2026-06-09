import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('swazi_lang') || 'en'
  );

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('swazi_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);

// Helper: returns siSwati value if lang=ss and field exists, else English fallback
export const t = (lang, record, enField, ssField) => {
  if (lang === 'ss' && record?.[ssField]) return record[ssField];
  return record?.[enField] || '';
};
