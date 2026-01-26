import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FileUpload from '../components/FileUpload';

const Profile = () => {
  const dogs = [
    { id: 1, name: 'Example Good Boy', image: '/imgs/exampledogpic.jpg' },
  ];
  const { t } = useTranslation();

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
	const userId = //TODO: get user id from auth context or similar
	fetch(`/api/files/users/${userId}/profile-picture`, { credentials: 'include' })
	  .then(res => res.json())
	  .then(data => setProfileImage(data.url))
	  .catch(() => setProfileImage("/imgs/exampleprofilepic.jpg"));
  }, []);

  return (
	<div className="max-w-2xl mx-auto p-6">
	  <div className="bg-white rounded-lg shadow-md p-8">
		<div className="flex justify-center mb-6">
		  <img
			src={profileImage || "/imgs/exampleprofilepic.jpg"}
			alt="Profile"
			className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
		  />

		  <FileUpload
		  	category="userProfile"
			label="Change Profile Picture"
			onUpload={(res) => setProfileImage(res.url)}
			onError={(err) => console.error(err)}
			/>
		</div>
		<h1 className="text-3xl font-bold text-center mb-8">Example User</h1> {/* needs to be changed */}
		<div className="space-y-4">

		{/* example data, will be changed when we have some data to pull */}

		  <div className="flex justify-between border-b pb-2">
			<span className="font-semibold text-gray-700">{t('exampleData')}:</span>
			<span className="text-gray-900">Example</span>
		  </div>
		  <div className="flex justify-between border-b pb-2">
			<span className="font-semibold text-gray-700">{t('exampleData')}:</span>
			<span className="text-gray-900">Example</span>
		  </div>
		  <div className="flex justify-between border-b pb-2">
			<span className="font-semibold text-gray-700">{t('exampleData')}:</span>
			<span className="text-gray-900">Example</span>
		  </div>
		  <div className="flex justify-between border-b pb-2">
			<span className="font-semibold text-gray-700">{t('memberSince')}:</span>
			<span className="text-gray-900">{t('exampleDate')}</span>
		  </div>
		</div>

		{/* Dogs List */}
		<div className="mt-8 pt-8 border-t border-gray-200">
		  <h2 className="text-2xl font-bold mb-6">Dogs</h2>
		  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
			{dogs.map((dog) => (
			  <Link
				key={dog.id}
				to={`/dog/${dog.id}`}
				className="flex flex-col items-center p-4 border rounded-lg hover:shadow-lg transition-shadow"
			  >
				<img
				  src={dog.image}
				  alt={dog.name}
				  className="w-24 h-24 rounded-full object-cover mb-3"
				/>
				<span className="font-semibold text-gray-800">{dog.name}</span>
			  </Link>
			))}
		  </div>
		</div>
	  </div>
	</div>
  );
};

export default Profile;