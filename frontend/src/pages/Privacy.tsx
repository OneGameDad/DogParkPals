import { useTranslation } from 'react-i18next';

export const Privacy = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h1>{t('privacyPolicy.title')}</h1>
            <p>{t('privacyPolicy.lastUpdated')}</p>
            
            <p>{t('privacyPolicy.intro')}</p>
            
            <p>{t('privacyPolicy.use')}</p>
            
            <p>{t('privacyPolicy.security')}</p>
            
            <p>{t('privacyPolicy.update')}</p>
        </div>
    );
};

export default Privacy;