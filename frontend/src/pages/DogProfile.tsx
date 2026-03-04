import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Loading, ErrorMessage, Button, Picture, BodyText } from '../components/common';
import { Header } from '../components/layout';
import type { Dog } from '../types';
import { useDogFriends } from '../hooks/users/useDogFriends';
import { useFriends } from '../hooks/users/useFriends';
import DogList from '../components/users/DogList';
import { getDogPhotoUrl, getDogDocumentUrl } from '../constants';

const DogProfile = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: dog, loading, error } = useFetch<Dog>(
    id ? `/api/dogs/${id}` : ''
  );

  // Parse ID safely
  const dogId = id ? parseInt(id, 10) : null;

  // Fetch user's dogs to check ownership
  const { data: userDogs } = useFetch<Dog[]>(
    user ? `/api/dogs/owner/${user.id}` : ''
  );

  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [isAddingOwner, setIsAddingOwner] = useState(false);

  useEffect(() => {
    if (userDogs && dogId) {
      const ownsDog = userDogs.some((d: Dog) => d.id === dogId);
      setIsOwner(ownsDog);
    }
  }, [userDogs, dogId]);

  const handleDelete = async () => {
    if (!dogId) return;

    if (window.confirm(t('dogProfile.deleteConfirmation') || 'Are you sure you want to delete this dog? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await api.delete(`/api/dogs/${dogId}`);
        navigate('/profile');
      } catch (err) {
        console.error('Failed to delete dog:', err);
        alert(t('dogProfile.deleteFailed') || 'Failed to delete dog. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dogId || !newOwnerId) return;

    setIsAddingOwner(true);
    try {
      await api.post(`/api/dogs/${dogId}/owners`, { userId: parseInt(newOwnerId, 10) });
      alert(t('dogProfile.addOwnerSuccess', 'Successfully added owner!'));
      setShowAddOwner(false);
      setNewOwnerId('');
      // Optionally trigger a refresh of the dog's data here
    } catch (err: unknown) {
      console.error('Failed to add owner:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg || t('dogProfile.addOwnerFailed', 'Failed to add owner.'));
    } finally {
      setIsAddingOwner(false);
    }
  };

  const { friends, loading: friendsLoading, removeFriend } = useDogFriends(dogId || undefined);
  const { friends: userFriends } = useFriends(user?.id);

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
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Dog Details */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center mb-6">
              <div className="border-4 border-gray-200 rounded-full">
                <Picture
                  location={getDogPhotoUrl(dog.id, dog.profilePictureUrl)}
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

            <div className="flex justify-center gap-4 mb-8">
              {isOwner && (
                <>
                  <Button
                    text={t('dogProfile.editProfile')}
                    onClick={() => navigate(`/dog/${id}/edit`)}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  />
                  <Button
                    text={isDeleting ? (t('dogProfile.deleting') || 'Deleting...') : (t('dogProfile.deleteDog') || 'Delete Dog')}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 px-6"
                  />
                  <Button
                    text={t('dogProfile.addOwnerButton', 'Add Owner')}
                    onClick={() => setShowAddOwner(!showAddOwner)}
                    className="bg-green-600 hover:bg-green-700 px-6"
                  />
                </>
              )}
            </div>

            {showAddOwner && isOwner && (
              <form onSubmit={handleAddOwner} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">{t('dogProfile.addOwnerTitle', 'Add New Owner')}</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <select
                      value={newOwnerId}
                      onChange={(e) => setNewOwnerId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                      disabled={isAddingOwner}
                      required
                    >
                      <option value="" disabled>
                        {t('dogProfile.selectFriend', 'Select a friend')}
                      </option>
                      {userFriends.map((friend) => {
                        const hasName = friend.first_name || friend.last_name;
                        const fullName = hasName ? ` (${[friend.first_name, friend.last_name].filter(Boolean).join(' ')})` : '';
                        return (
                          <option key={friend.id} value={friend.id}>
                            {friend.username}{fullName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      text={isAddingOwner ? t('common.saving', 'Saving...') : t('common.submit', 'Submit')}
                      disabled={isAddingOwner || !newOwnerId}
                      className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap mb-[6px]"
                    />
                  </div>
                </div>
              </form>
            )}

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
              {/* Vaccination Record */}
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">{t('dogProfile.vaccinationRecord', 'Vaccination Record')}:</span>
                {getDogDocumentUrl(dog.id, dog.vaccinationRecordUrl) ? (
                  <a
                    href={getDogDocumentUrl(dog.id, dog.vaccinationRecordUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    {t('dogProfile.viewRecord', 'View Record')}
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">{t('dogProfile.noRecord', 'Not uploaded')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Friends List */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <Header
              text={t('dogProfile.friends') || 'Friends'}
              level="h3"
              className="mb-4 border-b pb-2"
            />

            {friendsLoading ? (
              <Loading message="" />
            ) : (
              <DogList
                dogs={friends}
                emptyMessage={t('dogProfile.noFriends') || 'No friends yet.'}
                onDogClick={(friendDog) => navigate(`/dog/${friendDog.id}`)}
                onRemove={isOwner ? async (friendDog) => {
                  if (window.confirm(t('dogProfile.removeFriendConfirm', 'Remove this friend?'))) {
                    await removeFriend(friendDog.id);
                  }
                } : undefined}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};



export default DogProfile;
