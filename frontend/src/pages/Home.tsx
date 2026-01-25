import React from 'react';
import Button from '../components/Button';
import NotifContainer from '../components/Notif';
import { useTranslation } from 'react-i18next';
import Achievement from '../components/Achievement';
import Header from '../components/Header';
import Picture from '../components/Picture';
import BodyText from '../components/BodyText';
import InputText from '../components/InputText';

type NotifHandle = {
  addNotification: (type: string, payload: { name: string }) => void;
};

const Home = () => {
  const { t } = useTranslation();
  const notifRef = React.useRef<NotifHandle | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [text, setText] = React.useState('');

  return (
    <div>
      <NotifContainer ref={notifRef} />
      <Header text="Home" />
      <Header text="Welcome to ParkPals" level="h2" colour="text-pink-500"/>
      <Button text={t('buttons.cancel')} // click the button to get a notification
      onClick={() => notifRef.current?.addNotification('messageReceived', { name: 'Mark' })}
       />
      <Button 
        text={t('buttons.submit')} // click the button to get a notification
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
    />

    <Picture location="imgs/exampledogpic.jpg" size={100} />
    <Picture location="imgs/exampledogpic.jpg" size="150px" />
    <Picture location="imgs/exampledogpic.jpg" size="10rem" shape="circle" />
    <Picture location="imgs/exampledogpic.jpg" size="200px" shape="square" />

    <BodyText text="This is body text" />
    <BodyText text="Small text" size="sm" />
    <BodyText text="Large body text" size="lg" color="text-gray-700" />
    <BodyText text="Custom styled" color="text-blue-600" className="italic" />


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