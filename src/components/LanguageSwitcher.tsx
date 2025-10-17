import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'my' : 'en';
    setLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-500 transition-colors text-white"
      title={language === 'en' ? 'Switch to Burmese' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {language === 'en' ? 'မြန်မာ' : 'EN'}
      </span>
    </button>
  );
}
