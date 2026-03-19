import { useTranslation } from 'react-i18next';

export const Terms = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-center">
                <h1 className="text-pink-500 text-3xl">{t('termsOfService.title')}</h1>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <p className="text-pink-500">{t('termsOfService.intro')}</p>
                
                <p className="text-pink-500">{t('termsOfService.description')}</p>
                
                <p className="text-pink-500">{t('termsOfService.content')}</p>
                
                <p className="text-pink-500">{t('termsOfService.update')}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <p className="text-pink-500">{t('termsOfService.lastUpdated')}</p>
            </div>
        </div>
    );
};

export default Terms;