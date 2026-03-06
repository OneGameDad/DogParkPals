import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Picture, BodyText } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useFriendActions } from '../../hooks/users/useFriendActions';
import { useDogFriends } from '../../hooks/users/useDogFriends';
import { useDogEnemies } from '../../hooks/users/useDogEnemies';
import { useDogEnemyActions } from '../../hooks/users/useDogEnemyActions';
import type { Dog } from '../../types';
import { getDogPhotoUrl } from '../../constants';

interface DogProfileModalProps {
    dog: Dog | null;
    onClose: () => void;
}

const DogProfileModal = ({ dog, onClose }: DogProfileModalProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addFriend, actionLoading } = useFriendActions();
    const { addDogEnemy, addEnemyLoading } = useDogEnemyActions();
    const [selectedMyDogId, setSelectedMyDogId] = useState<number | null>(null);

    const { data: myDogs } = useFetch<Dog[]>(
        user ? `/api/dogs/owner/${user.id}` : ''
    );

    useEffect(() => {
        if (myDogs && myDogs.length === 1 && !selectedMyDogId) {
            setSelectedMyDogId(myDogs[0].id);
        }
    }, [myDogs, selectedMyDogId]);

    const { friends: selectedDogFriends, loading: friendsLoading, removeFriend, refetch: refetchFriends } = useDogFriends(selectedMyDogId || undefined);
    const { enemies: selectedDogEnemies, loading: enemiesLoading, removeEnemy, refetch: refetchEnemies } = useDogEnemies(selectedMyDogId || undefined);

    const isOwner = myDogs?.some(d => d.id === dog?.id);
    const isAlreadyFriend = selectedDogFriends.some(d => d.id === dog?.id);
    const isAlreadyEnemy = selectedDogEnemies.some(d => d.id === dog?.id);

    // Refetch friends and enemies when modal opens or selected dog changes
    useEffect(() => {
        if (dog && selectedMyDogId) {
            refetchFriends();
            refetchEnemies();
        }
    }, [dog, selectedMyDogId, refetchFriends, refetchEnemies]);

    const handleAddFriend = async () => {
        let requesterId = selectedMyDogId;
        if (!requesterId && myDogs && myDogs.length === 1) {
            requesterId = myDogs[0].id;
        }

        if (requesterId && dog) {
            const success = await addFriend(dog.id, true, requesterId);
            if (success) {
                await refetchFriends();
                onClose();
            }
        }
    };

    const handleAddEnemy = async () => {
        let myDogId = selectedMyDogId;
        if (!myDogId && myDogs && myDogs.length === 1) {
            myDogId = myDogs[0].id;
        }

        if (myDogId && dog) {
            const success = await addDogEnemy(myDogId, dog.id);
            if (success) {
                await refetchEnemies();
                onClose();
            }
        }
    };

    const handleRemoveEnemy = async () => {
        if (selectedMyDogId && dog) {
            if (window.confirm(t('dogProfile.removeEnemyConfirm') || 'Remove this enemy?')) {
                await removeEnemy(dog.id);
            }
        }
    };

    if (!dog) return null;

    return (
        <Modal
            isOpen={!!dog}
            onClose={onClose}
            title={dog.name}
        >
            <div className="flex flex-col items-center space-y-6">
                <Picture
                    location={getDogPhotoUrl(dog.id, dog.profilePictureUrl)}
                    size={120}
                    shape="circle"
                    alt={dog.name}
                />

                <div className="text-center">
                    <h2 className="text-2xl font-bold">{dog.name}</h2>
                    <p className="text-gray-600 mt-1">
                        {dog.breed.replace(/_/g, ' ')} • {dog.age ? `${dog.age} years` : 'Age unknown'}
                    </p>
                </div>

                <div className="w-full space-y-2">
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold text-gray-700">{t('dogProfile.gender')}:</span>
                        <span>{dog.gender}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold text-gray-700">{t('dogProfile.size')}:</span>
                        <span>{dog.size}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold text-gray-700">{t('dogProfile.playstyle')}:</span>
                        <span>{dog.playstyle}</span>
                    </div>
                    {dog.description && (
                        <div className="flex flex-col border-b pb-2">
                            <span className="font-semibold text-gray-700 mb-1">{t('dogProfile.description')}:</span>
                            <BodyText text={dog.description} />
                        </div>
                    )}
                    <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold text-gray-700">{t('dogProfile.vaccinationRecord', 'Vaccination Record')}:</span>
                        {dog.vaccinationRecordUrl ? (
                            <span className="text-green-600 font-medium">✓ {t('dogProfile.vaccinated', 'Vaccinated')}</span>
                        ) : (
                            <span className="text-gray-400 text-sm">{t('dogProfile.noRecord', 'Not uploaded')}</span>
                        )}
                    </div>
                </div>

                {!isOwner && myDogs && myDogs.length > 0 && (
                    <div className="w-full pt-4 border-t">
                        <h4 className="text-center font-semibold mb-2">Add as Friend</h4>

                        {myDogs.length > 1 && (
                            <div className="mb-3">
                                <label className="block text-sm text-gray-600 mb-1">Which of your dogs?</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={selectedMyDogId || ''}
                                    onChange={(e) => setSelectedMyDogId(Number(e.target.value))}
                                >
                                    <option value="">Select a dog...</option>
                                    {myDogs.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <Button
                            text={
                                actionLoading ? (t('common.processing') || 'Processing...') :
                                    friendsLoading ? (t('common.checking') || 'Checking...') :
                                        isAlreadyFriend ? (t('friends.unfriend') || 'Unfriend') :
                                            (t('findFriends.addFriend') || 'Add Friend')
                            }
                            onClick={isAlreadyFriend ? async () => {
                                if (window.confirm(t('friends.unfriendConfirm') || 'Are you sure you want to unfriend this dog?')) {
                                    if (selectedMyDogId && dog) {
                                        await removeFriend(dog.id);
                                    }
                                }
                            } : handleAddFriend}
                            disabled={actionLoading || friendsLoading || (myDogs.length > 1 && !selectedMyDogId)}
                            className={`w-full ${isAlreadyFriend
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : friendsLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        />

                        <Button
                            text={
                                addEnemyLoading ? (t('common.processing') || 'Processing...') :
                                    enemiesLoading ? (t('common.checking') || 'Checking...') :
                                        isAlreadyEnemy ? (t('dogProfile.removeEnemy') || 'Remove Enemy') :
                                            (t('dogProfile.addEnemy') || 'Add Enemy')
                            }
                            onClick={isAlreadyEnemy ? handleRemoveEnemy : handleAddEnemy}
                            disabled={addEnemyLoading || enemiesLoading || (myDogs.length > 1 && !selectedMyDogId)}
                            className={`w-full mt-2 ${isAlreadyEnemy
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : enemiesLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default DogProfileModal;
