import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BodyText } from '../components/common';
import { Header } from '../components/layout';
import { NotifContainer, type NotifContainerHandle } from '../components/features';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useAuth();
  const notifRef = useRef<NotifContainerHandle>(null);

  return (
    <div className="text-center">
      <NotifContainer ref={notifRef} />
      <Header text={t('homePage.welcome', 'Welcome to ParkPals')} level="h1" colour="text-pink-500" />

      {loading ? (
        <BodyText text={t('common.checking', 'Checking authentication...')} />
      ) : isAuthenticated ? (
        <BodyText text={t('homePage.loggedInAs', { defaultValue: 'Logged in as: {{name}}', name: user?.username || user?.email })} colour="text-green-600" />
      ) : (
        <BodyText text={t('homePage.notLoggedIn', 'Not logged in')} colour="text-gray-600" />
      )}
    </div>
  );
};

export default Home;