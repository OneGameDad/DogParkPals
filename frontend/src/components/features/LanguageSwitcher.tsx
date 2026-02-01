import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' }
  ];

  return (
    <div className="flex items-center space-x-2 ml-4">
      {languages.map((lang) => (
        <button 
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)} 
          disabled={i18n.language === lang.code}
          aria-label={`Switch to ${lang.label}`}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            i18n.language === lang.code 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;