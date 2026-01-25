import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useSubmit } from '../hooks/useSubmit';

const Logout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { submit, isSubmitting } = useSubmit({
    onSuccess: () => {
      window.dispatchEvent(new Event('auth:logout'));
      navigate('/login');
    },
    successMessage: t('auth.logout.success'),
    errorMessage: t('auth.logout.error'),
    loadingMessage: t('auth.logout.loggingOut'),
  });

  useEffect(() => {
    submit(() => api.logout()).catch(() => {
      // If logout fails, redirect to home
      navigate('/');
    });
  }, []);

  if (isSubmitting) {
    return (
      <div>
        <h2>{t('auth.logout.title')}</h2>
        <p>{t('auth.logout.loggingOut')}</p>
      </div>
    );
  }

  return null;
};

export default Logout;
