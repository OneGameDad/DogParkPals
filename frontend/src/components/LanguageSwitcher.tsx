import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="language-switcher" style={{ display: 'inline-block', marginLeft: '20px' }}>
      <button 
        onClick={() => i18n.changeLanguage('en')} 
        disabled={i18n.language === 'en'}
        style={{ marginRight: '8px', fontWeight: i18n.language === 'en' ? 'bold' : 'normal' }}
      >
        English
      </button>
      <button 
        onClick={() => i18n.changeLanguage('es')} 
        disabled={i18n.language === 'es'}
        style={{ fontWeight: i18n.language === 'es' ? 'bold' : 'normal' }}
      >
        Español
      </button>
    </div>
  );
};

export default LanguageSwitcher;