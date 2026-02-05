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
    <div>
      <h1>Home</h1>
      <NotifContainer ref={notifRef} />
      <Header text="Home" />
      <Header text="Welcome to ParkPals" level="h2" colour="text-pink-500" />

      {loading ? (
        <BodyText text="Checking authentication..." />
      ) : isAuthenticated ? (
        <BodyText text={`Logged in as: ${user?.username || user?.email}`} colour="text-green-600" />
      ) : (
        <BodyText text="Not logged in" colour="text-gray-600" />
      )}

      <Button
        text={t('buttons.cancel')}
        onClick={() => notifRef.current?.addNotification('messageReceived', { name: 'Mark' })}
      />
      <Button
        text={t('buttons.submit')}
        onClick={() => notifRef.current?.addNotification('friendRequest', { name: 'Greg' })}
      />
      <Button text={t('buttons.disabled')} disabled={true} />

      <Achievement
        title="Best Friend"
        description="Made your first friend"
        image="imgs/exampledogpic.jpg"
        imageAlt="Best Friend Badge"
      />

      <Achievement
        title="Explorer"
        image="imgs/exampledogpic.jpg"
        imageAlt="Explorer badge with a dog illustration"
      />

      <Picture location="imgs/exampledogpic.jpg" size={100} alt="Example dog photo" />
      <Picture location="imgs/exampledogpic.jpg" size="150px" alt="Large example dog photo" />
      <Picture location="imgs/exampledogpic.jpg" size="10rem" shape="circle" alt="Example circular dog profile picture" />
      <Picture location="imgs/exampledogpic.jpg" size="200px" shape="square" alt="Example square dog photo" />

      <BodyText text="This is body text" />
      <BodyText text="Small text" size="sm" />
      <BodyText text="Large body text" size="lg" colour="text-gray-700" />
      <BodyText text="Custom styled" colour="text-blue-600" className="italic" />

      <InputText
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChange={setEmail}
        type="email"
        required={true}
      />

      <InputText
        label="Password"
        placeholder="Enter password"
        value={password}
        onChange={setPassword}
        type="password"
      />

      <InputText
        placeholder="Just a text input"
        value={text}
        onChange={setText}
      />
    </div>
  );
};

export default Home;