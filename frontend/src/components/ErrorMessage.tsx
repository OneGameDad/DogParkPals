import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  showBackButton?: boolean;
  backTo?: string;
}

const ErrorMessage = ({ message, showBackButton = false, backTo = '/' }: ErrorMessageProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p
          className="text-red-600 text-lg mb-4"
          role="alert"
          aria-live="assertive"
        >
          {message}
        </p>
        {showBackButton && (
          <button
            onClick={() => navigate(backTo)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            {t('common.goBack')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
