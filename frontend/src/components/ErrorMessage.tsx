import { useNavigate } from 'react-router-dom';

interface ErrorMessageProps {
  message: string;
  showBackButton?: boolean;
  backTo?: string;
}

const ErrorMessage = ({ message, showBackButton = false, backTo = '/' }: ErrorMessageProps) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600 text-lg mb-4">{message}</p>
        {showBackButton && (
          <button
            onClick={() => navigate(backTo)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
