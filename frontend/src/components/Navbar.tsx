import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { t } = useTranslation();

    return (
        <nav className="p-4 border-b border-gray-200 flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:underline font-medium">{t('home')}</Link>
            <Link to="/login" className="text-gray-600 hover:underline font-medium">{t('login')}</Link>
            <Link to="/dashboard" className="text-gray-600 hover:underline font-medium">{t('dashboard')}</Link>
            <Link to="/settings" className="text-gray-600 hover:underline font-medium">{t('settings')}</Link>
        </nav>
    );
}

export default Navbar;