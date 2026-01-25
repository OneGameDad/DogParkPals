import React from 'react';

interface PicProps {
  location: string;
  size: string | number;
  shape?: 'square' | 'circle';
  alt?: string;
}

const Picture: React.FC<PicProps> = ({ 
  location,
  size,
  shape = 'square',
  alt
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const resolvedAlt =
    typeof alt === 'string' && alt.trim().length > 0 ? alt : '';

  if (resolvedAlt === '') {
    // Warn during development when no meaningful alt text is provided.
    // This helps catch accessibility issues early.
    // eslint-disable-next-line no-console
    console.warn(
      '[Picture] The `alt` prop is missing or empty. ' +
        'Provide descriptive alt text for accessibility, or confirm that this image is purely decorative.'
    );
  }

  return (
    <img
      src={location}
      alt={resolvedAlt}
      style={{
        width: sizeValue,
        height: sizeValue,
      }}
      className={`${shapeClass} object-cover`}
    />
  );
};

export default Picture;