import React from 'react';

interface HeaderProps {
  text: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  colour?: string;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  text, 
  level = 'h1',
  colour = 'text-black',
  className = ''
}) => {
  const Tag = level;
  
  const defaultStyles = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    h4: 'text-xl font-bold',
    h5: 'text-lg font-bold',
    h6: 'text-base font-bold',
  };

  return (
    <Tag className={`${defaultStyles[level]} ${colour} ${className}`}>
      {text}
    </Tag>
  );
};

export default Header;