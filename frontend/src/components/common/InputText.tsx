import React from 'react';

interface InputTextProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time';
  required?: boolean;
  className?: string;
}

const InputText: React.FC<InputTextProps> = ({
  id,
  placeholder = '',
  value,
  onChange,
  label,
  type = 'text',
  required = false,
  className = ''
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="font-semibold text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      />
    </div>
  );
};

export default InputText;
