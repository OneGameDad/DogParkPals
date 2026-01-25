import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useSubmit } from '../hooks/useSubmit';
import Button from '../components/Button';
import InputText from '../components/InputText';
import Header from '../components/Header';
import BodyText from '../components/BodyText';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { submit, isSubmitting } = useSubmit({
    onSuccess: async () => {
      try {
        await api.login(email, password);
        window.dispatchEvent(new Event('auth:login'));
        navigate('/dashboard');
      } catch (error) {
        console.error('Auto-login failed after registration:', error);
        navigate('/login');
      }
    },
    successMessage: t('auth.register.success'),
    loadingMessage: t('auth.register.creatingAccount'),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    await submit(async () => {
      // Validation
      if (username.length < 3) {
        throw new Error(t('auth.register.usernameTooShort'));
      }
      
      if (password.length < 8) {
        throw new Error(t('auth.register.passwordTooShort'));
      }

      if (password !== confirmPassword) {
        throw new Error(t('auth.register.passwordsDontMatch'));
      }

      return api.register(username, email, password);
    });
  };

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${api.getBaseUrl()}/auth/google`;
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <Header text={t('auth.register.title')} level="h2" className="mb-2 text-center" />
        <BodyText text={t('auth.register.subtitle')} className="mb-6 text-center text-gray-600" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputText
            label={t('auth.register.usernameLabel')}
            type="text"
            value={username}
            onChange={setUsername}
            placeholder={t('auth.register.usernamePlaceholder')}
            required
          />

          <InputText
            label={t('auth.register.emailLabel')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t('auth.register.emailPlaceholder')}
            required
          />

          <InputText
            label={t('auth.register.passwordLabel')}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={t('auth.register.passwordPlaceholder')}
            required
          />

          <InputText
            label={t('auth.register.confirmPasswordLabel')}
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            required
          />

          <div className="pt-4">
            <Button
              text={isSubmitting ? t('auth.register.creatingAccount') : t('auth.register.signUpButton')}
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div className="relative my-6">
            <hr className="border-gray-300" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500 text-sm">
              {t('auth.register.orContinueWith')}
            </span>
          </div>

          <Button
            text={t('auth.register.signUpWithGoogle')}
            onClick={handleGoogleSignup}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          />

          <div className="text-center mt-4">
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              {t('auth.register.haveAccount')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
