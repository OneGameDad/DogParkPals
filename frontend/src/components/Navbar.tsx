import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { t } = useTranslation();

    return (
        <nav className='p-4 border-b border-gray-200 bg-white flex gap-6 shadow-sm items-center'>
            <Link to="/" className='text-gray-600 hover:text-blue-600 font-medium transition-colors'>{t('home')}</Link>
            <Link to="/login" className='text-gray-600 hover:text-blue-600 font-medium transition-colors'>{t('login')}</Link>
            <Link to="/dashboard" className='text-gray-600 hover:text-blue-600 font-medium transition-colors'>{t('dashboard')}</Link>
        </nav>
    );
}

export default Navbar;