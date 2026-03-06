import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useSubmit } from '../hooks/useSubmit';
import { Button, InputText } from '../components/common';
import { Header } from '../components/layout';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { submit, isSubmitting } = useSubmit({
    onSuccess: () => {
      window.dispatchEvent(new Event('auth:login'));
      navigate('/dashboard');
    },
    successMessage: t('auth.login.success'),
    loadingMessage: t('auth.login.signingIn'),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submit(() => api.login(email, password));
  };

  const handleGoogleLogin = () => {
    window.location.href = `${api.getBaseUrl()}/auth/google`;
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <Header text={t('auth.login.title')} level="h2" className="mb-6 text-center" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputText
            label={t('auth.login.emailLabel')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t('auth.login.emailPlaceholder')}
            required
          />

          <InputText
            label={t('auth.login.passwordLabel')}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={t('auth.login.passwordPlaceholder')}
            required
          />

          <div className="pt-4">
            <Button
              text={isSubmitting ? t('auth.login.signingIn') : t('auth.login.signInButton')}
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div className="relative my-6">
            <hr className="border-gray-300" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500 text-sm">
              {t('auth.login.orContinueWith')}
            </span>
          </div>

          <Button
            text={t('auth.login.signInWithGoogle')}
            onClick={handleGoogleLogin}
            className="w-full"
          />

          <div className="text-center mt-4">
            <Link to="/register" className="text-blue-600 hover:text-blue-800">
              {t('auth.login.noAccount')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;