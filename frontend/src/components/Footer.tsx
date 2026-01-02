import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer()  {
  const { t } = useTranslation();

    return (
        <footer className="p-4 mt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-4xl mx-auto">
                <div>
                    <Link to="/privacy" className="mr-4 text-gray-600 hover:underline">
                        {t('footer.privacy')}
                    </Link>
                    <Link to="/terms" className="text-gray-600 hover:underline">
                        {t('footer.terms')} 
                    </Link>
                </div>
                <div className="text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} <Link to="/" className="hover:underline">DogParkPals</Link> {t('footer.rightsReserved')}
                </div>
            </div>
        </footer>
    );
}

