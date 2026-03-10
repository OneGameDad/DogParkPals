import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BodyText } from '../components/common';
import { Header } from '../components/layout';
import { NotifContainer, type NotifContainerHandle } from '../components/features';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useAuth();
  const notifRef = useRef<NotifContainerHandle>(null);

  return (
    <div className="text-center max-w-3xl mx-auto">
      <NotifContainer ref={notifRef} />
      <Header text={t('homePage.welcome', 'Welcome to ParkPals')} level="h1" colour="text-pink-500" />

      <BodyText
        text={t(
          'homePage.aboutParkPals',
          'ParkPals helps dog owners discover parks, connect with local dog lovers, and join community events in one friendly place.'
        )}
        colour="text-gray-700"
      />

      {loading ? (
        <BodyText text={t('common.checking', 'Checking authentication...')} />
      ) : isAuthenticated ? (
        <BodyText text={t('homePage.loggedInAs', { defaultValue: 'Logged in as: {{name}}', name: user?.username || user?.email })} colour="text-green-600" />
      ) : (
        <div className="mt-4">
          <BodyText text={t('homePage.notLoggedIn', 'Not logged in')} colour="text-gray-600" />
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              {t('login', 'Login')}
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-lg bg-white text-blue-700 border border-blue-300 font-semibold hover:bg-blue-50 transition-colors"
            >
              {t('navregister', 'Register')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;