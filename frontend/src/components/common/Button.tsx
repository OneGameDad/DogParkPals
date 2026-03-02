import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  fullWidth = false,
  loading = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'outline':
        return 'bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700';
      case 'primary':
      default:
        return 'bg-pink-500 hover:bg-blue-600 text-white';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center ${fullWidth ? 'w-full' : ''} ${getVariantClasses()} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : text}
    </button>
  );
};

export default Button;