import React from 'react';

interface BodyProps {
  text: string;
  size?: 'sm' | 'base' | 'lg';
  color?: string;
  className?: string;
}

const BodyText: React.FC<BodyProps> = ({ 
  text, 
  size = 'base',
  color = 'text-black',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  return (
    <p className={`${sizeClasses[size]} ${color} ${className}`}>
      {text}
    </p>
  );
};

export default BodyText;