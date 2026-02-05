import React, { useState, useEffect } from 'react';

interface PicProps {
  location?: string | null;
  initials?: string;
  size?: string | number;
  shape?: 'square' | 'circle' | 'rect';
  alt?: string;
  className?: string;
}

const Picture: React.FC<PicProps> = ({
  location,
  initials,
  size,
  shape = 'square',
  alt,
  className
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeValue = size ? (typeof size === 'number' ? `${size}px` : size) : undefined;
  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'rect' ? '' : 'rounded-lg';
  const resolvedAlt =
    typeof alt === 'string' && alt.trim().length > 0 ? alt : '';

  useEffect(() => {
    setImageError(false);
  }, [location]);

  if (resolvedAlt === '') {
    // console.warn(
    //   '[Picture] The `alt` prop is missing or empty. '
    // );
  }

  const styleProps: React.CSSProperties = {
    ...(size ? { width: sizeValue, height: sizeValue } : {}),
    // Default size if not provided to ensure it takes space
    ...(!size ? { minWidth: '40px', minHeight: '40px' } : {})
  };

  // Logic: Show image if we have a location AND no error.
  // Otherwise, show initials if provided.
  // Otherwise, show a generic placeholder.

  if (location && !imageError) {
    return (
      <img
        src={location}
        alt={resolvedAlt}
        style={styleProps}
        className={`${shapeClass} object-cover ${className || ''}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      style={styleProps}
      className={`${shapeClass} flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg border border-blue-200 ${className || ''}`}
      title={resolvedAlt}
      role="img"
      aria-label={resolvedAlt || initials || '?'}
    >
      {initials || '?'}
    </div>
  );
};

export default Picture;