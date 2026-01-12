import React from 'react';
import { useTranslation } from 'react-i18next';

const DogProfile = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <img
            src="/imgs/exampledogpic.jpg"
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          /> {/* needs to be changed */}
        </div>
        <h1 className="text-3xl font-bold text-center mb-8">Example Good Boy</h1> {/* needs to be changed */}
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('owner')}:</span>
            <span className="text-gray-900">Example</span>
          </div>

        {/* example data, will be changed when we have some data to pull */}

		  <div className="flex justify-between border-b pb-2">
			  <span className="font-semibold text-gray-700">{t('exampleData')}:</span>
			  <span className="text-gray-900">Example</span>
		  </div>
		  <div className="flex justify-between border-b pb-2">
			  <span className="font-semibold text-gray-700">{t('exampleData')}:</span>
			  <span className="text-gray-900">Example</span>
		  </div>
        </div>
      </div>
    </div>
  );
};

export default DogProfile;