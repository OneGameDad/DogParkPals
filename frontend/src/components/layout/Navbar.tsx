import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
    const { t } = useTranslation();
    const { isAuthenticated, loading } = useAuth();

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
                    <Link to="/profile" className="text-gray-600 hover:underline font-medium">{t('profile.title')}</Link>
                    <Link to="/settings" className="text-gray-600 hover:underline font-medium">{t('settings')}</Link>
                    <Link to="/logout" className="text-gray-600 hover:underline font-medium">{t('logout')}</Link>
                </>
            ) : (
                <>
                    <Link to="/login" className="text-gray-600 hover:underline font-medium">{t('login')}</Link>
                    <Link to="/register" className="text-gray-600 hover:underline font-medium">{t('register')}</Link>
                </>
            )}
        </nav>
    );
}

export default Navbar;