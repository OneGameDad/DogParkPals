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
      <Header text="Welcome to ParkPals" level="h1" colour="text-pink-500" />

      {loading ? (
        <BodyText text="Checking authentication..." />
      ) : isAuthenticated ? (
        <BodyText text={`Logged in as: ${user?.username || user?.email}`} colour="text-green-600" />
      ) : (
        <BodyText text="Not logged in" colour="text-gray-600" />
      )}
    </div>
  );
};

export default Home;