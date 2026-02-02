import React from 'react';

interface PicProps {
  location: string;
  size?: string | number;
  shape?: 'square' | 'circle' | 'rect';
  alt?: string;
  className?: string;
}

const Picture: React.FC<PicProps> = ({ 
  location,
  size,
  shape = 'square',
  alt,
  className
}) => {
  const sizeValue = size ? (typeof size === 'number' ? `${size}px` : size) : undefined;
  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'rect' ? '' : 'rounded-lg';
  const resolvedAlt =
    typeof alt === 'string' && alt.trim().length > 0 ? alt : '';

  if (resolvedAlt === '') {
    console.warn(
      '[Picture] The `alt` prop is missing or empty. ' +
        'Provide descriptive alt text for accessibility, or confirm that this image is purely decorative.'
    );
  }

  const styleProps = size ? {
    width: sizeValue,
    height: sizeValue,
  } : undefined;

  return (
    <img
      src={location}
      alt={resolvedAlt}
      style={styleProps}
      className={`${shapeClass} object-cover ${className || ''}`}
    />
  );
};

export default Picture;