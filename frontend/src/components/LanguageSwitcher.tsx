import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center space-x-2 ml-4">
      <button 
        onClick={() => i18n.changeLanguage('en')} 
        disabled={i18n.language === 'en'}
        aria-label="Switch to English"
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          i18n.language === 'en' 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        English
      </button>
      <button 
        onClick={() => i18n.changeLanguage('es')} 
        disabled={i18n.language === 'es'}
        aria-label="Switch to Spanish"
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          i18n.language === 'es' 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Español
      </button>
    </div>
  );
};

export default LanguageSwitcher;