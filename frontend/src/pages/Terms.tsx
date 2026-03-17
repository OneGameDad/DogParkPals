import { useTranslation } from 'react-i18next';

export const Terms = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h1>{t('termsOfService.title')}</h1>
            <p>{t('termsOfService.lastUpdated')}</p>
            
            <p>{t('termsOfService.intro')}</p>
            
            <p>{t('termsOfService.description')}</p>
            
            <p>{t('termsOfService.content')}</p>
            
            <p>{t('termsOfService.update')}</p>
        </div>
    );
};

export default Terms;