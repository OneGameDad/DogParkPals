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
  alt = 'image'
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <img
      src={location}
      alt={alt}
      style={{
        width: sizeValue,
        height: sizeValue,
      }}
      className={`${shapeClass} object-cover`}
    />
  );
};

export default Picture;