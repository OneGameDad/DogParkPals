import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { NotificationBadge } from '../features/NotificationBadge';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, loading } = useAuth();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        setOpenDropdown(null);
    };

    if (loading) {
        return (
            <nav className="p-4 border-b border-gray-200 flex items-center gap-4 bg-white">
                <Link to="/" className="text-gray-600 hover:underline font-medium">{t('home')}</Link>
            </nav>
        );
    }

    return (
        <nav className="p-4 border-b border-gray-200 flex items-center gap-4 bg-white">
            <Link to="/" className="text-gray-600 hover:underline font-medium">{t('home')}</Link>

            {isAuthenticated ? (
                <>
                    <Link to="/dashboard" className="text-gray-600 hover:underline font-medium">{t('dashboard')}</Link>
                    <div className="relative">
                        <Link to="/messages" className="text-gray-600 hover:underline font-medium">{t('messages')}</Link>
                        <NotificationBadge className="absolute -top-2 -right-3" />
                    </div>
                    <Link to="/social" className="text-gray-600 hover:underline font-medium">{t('social.title', 'Social')}</Link>
                    <Link to="/events" className="text-gray-600 hover:underline font-medium">{t('events.pageTitle', 'Events')}</Link>
                    <Link to="/profile" className="text-gray-600 hover:underline font-medium">{t('profile.title')}</Link>
                    <Link to="/settings" className="text-gray-600 hover:underline font-medium">{t('settings')}</Link>
                    <Link to="/logout" className="text-gray-600 hover:underline font-medium">{t('navlogout')}</Link>
                </>
            ) : (
                <>
                    <Link to="/login" className="text-gray-600 hover:underline font-medium">{t('login')}</Link>
                    <Link to="/register" className="text-gray-600 hover:underline font-medium">{t('navregister')}</Link>
                </>
            )}
            <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('languages')}
                onMouseLeave={() => setOpenDropdown(null)}
            >
                <button className="text-gray-600 hover:underline font-medium">
                    {t('navlang')}
                </button>

                {openDropdown === 'languages' && (
                    <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageChange('es')}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                        >
                            Español
                        </button>
                        <button
                            onClick={() => handleLanguageChange('fi')}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                        >
                            Suomi
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;