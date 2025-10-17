import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { updateUserLanguage } from '../services/authService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('my');

  useEffect(() => {
    if (user?.language_preference) {
      setLanguageState(user.language_preference as Language);
    } else {
      const stored = localStorage.getItem('language') as Language;
      if (stored && (stored === 'en' || stored === 'my')) {
        setLanguageState(stored);
      }
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    if (user) {
      await updateUserLanguage(user.id, lang);
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
