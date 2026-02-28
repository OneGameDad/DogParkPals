import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Picture, BodyText, InputText } from '../components/common';
import { Header } from '../components/layout';
import { Achievement, NotifContainer, type NotifContainerHandle } from '../components/features';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useAuth();
  const notifRef = React.useRef<NotifContainerHandle>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [text, setText] = React.useState('');

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