import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks/useFetch';
import { Loading, ErrorMessage, Button, Picture, BodyText } from '../components/common';
import { Header } from '../components/layout';
import type { Dog } from '../types';

const DogProfile = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: dog, loading, error } = useFetch<Dog>(
    id ? `/api/dogs/${id}` : ''
  );

  if (loading) {
    return <Loading message={t('dogProfile.loading')} />;
  }

  if (error || !dog) {
    return <ErrorMessage message={t('dogProfile.failedToLoad')} showBackButton backTo="/profile" />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <div className="border-4 border-gray-200 rounded-full">
            <Picture
              location={dog.profilePictureUrl || '/imgs/exampledogpic.jpg'}
              size={128}
              shape="circle"
              alt={dog.name}
            />
          </div>
        </div>
        <Header
          text={dog.name}
          level="h1"
          className="text-center mb-4"
        />
        <div className="flex justify-center mb-8">
          <Button
            text={t('dogProfile.editProfile')}
            onClick={() => navigate(`/dog/${id}/edit`)}
            className="bg-blue-600 hover:bg-blue-700 px-6"
          />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('dogProfile.breed')}:</span>
            <span className="text-gray-900">{dog.breed.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('dogProfile.gender')}:</span>
            <span className="text-gray-900">{dog.gender}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('dogProfile.size')}:</span>
            <span className="text-gray-900">{dog.size}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('dogProfile.birthdate')}:</span>
            <span className="text-gray-900">{formatDate(dog.dateOfBirth)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('dogProfile.playstyle')}:</span>
            <span className="text-gray-900">{dog.playstyle}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-semibold text-gray-700">{t('dogProfile.fixed')}:</span>
            <span className="text-gray-900">{dog.fixed ? t('dogProfile.yes') : t('dogProfile.no')}</span>
          </div>
          {dog.description && (
            <div className="flex flex-col border-b pb-2">
              <span className="font-semibold text-gray-700 mb-1">{t('dogProfile.description')}:</span>
              <BodyText text={dog.description} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default DogProfile;
