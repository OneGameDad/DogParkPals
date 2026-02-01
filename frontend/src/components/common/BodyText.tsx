import React from 'react';

interface BodyProps {
  text: string;
  size?: 'sm' | 'base' | 'lg';
  colour?: string;
  className?: string;
}

const BodyText: React.FC<BodyProps> = ({ 
  text, 
  size = 'base',
  colour = 'text-black',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  return (
    <p className={`${sizeClasses[size]} ${colour} ${className}`}>
      {text}
    </p>
  );
};

export default BodyText;