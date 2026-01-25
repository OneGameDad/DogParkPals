import React from 'react';

interface AchievementProps {
  title: string;
  description?: string;
  image: string;
  imageAlt?: string;
}

const Achievement: React.FC<AchievementProps> = ({ 
  title, 
  description, 
  image, 
  imageAlt = 'Achievement' 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4">
        <img 
          src={image} 
          alt={imageAlt}
          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
        />
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default Achievement;