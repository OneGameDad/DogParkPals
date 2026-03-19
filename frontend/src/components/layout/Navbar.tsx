import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import NotificationDropdown from '../features/NotificationDropdown';
import { UserRole } from '../../types';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, loading, user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const canAccessAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.DEVELOPER;

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        setLangOpen(false);
    };

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <nav className="p-4 border-b border-gray-200 flex items-center justify-center bg-white">
                <Link to="/" className="text-gray-600 hover:underline font-bold text-lg">{t('home')}</Link>
            </nav>
        );
    }

    return (
        <nav className="p-4 border-b border-gray-200 flex items-center justify-between bg-white relative">
            {/* Left side — Hamburger menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-gray-600 hover:text-gray-900 focus:outline-none text-2xl leading-none p-1"
                    aria-label="Toggle menu"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                {menuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <Link
                            to="/"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium"
                        >
                            {t('home')}
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                >
                                    {t('dashboard')}
                                </Link>
                                <Link
                                    to="/messages"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                >
                                    {t('messages')}
                                </Link>
                                <Link
                                    to="/social"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                >
                                    {t('social.title', 'Social')}
                                </Link>
                                <Link
                                    to="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                >
                                    {t('profile.title')}
                                </Link>
                                {canAccessAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                    >
                                        {t('admin.title', 'Admin')}
                                    </Link>
                                )}
                                <Link
                                    to="/logout"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-200"
                                >
                                    {t('navlogout')}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 font-medium border-t border-gray-100"
                                >
                                    {t('navregister')}
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Center — App name / Home link */}
            <Link to="/" className="text-gray-800 font-bold text-lg hover:text-gray-600">
                ParkPals
            </Link>

            {/* Right side — Bell + Globe */}
            <div className="flex items-center gap-2">
                {/* Notification bell — only when authenticated */}
                {isAuthenticated && <NotificationDropdown />}

                {/* Globe language switcher */}
                <div className="relative" ref={langRef}>
                <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none transition-colors"
                    aria-label="Change language"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </button>

                {langOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
            </div>
        </nav>
    );
}

export default Navbar;