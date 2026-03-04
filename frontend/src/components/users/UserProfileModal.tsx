import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Picture } from '../common';
import UserDogsList from './UserDogsList';
import type { User } from '../../types';
import { getUserInitials } from '../../utils/formatters';
import { getUserPhotoUrl } from '../../constants';

// ... imports
interface UserProfileModalProps {
    user: User | null;
    onClose: () => void;
    onAddFriend?: (userId: number) => void;
    onAddEnemy?: (userId: number) => void;
    onRemoveFriend?: (userId: number) => void;
    onRemoveEnemy?: (userId: number) => void; // Added
    isRequestSent?: boolean;
    loading?: boolean;
    error?: string | null;
}

export default function UserProfileModal({
    user,
    onClose,
    onAddFriend,
    onAddEnemy,
    onRemoveFriend,
    onRemoveEnemy,
    isRequestSent = false,
    loading = false,
    error,
}: UserProfileModalProps) {
    const { t } = useTranslation();

    if (!user) return null;

    return (
        <Modal
            isOpen={!!user}
            onClose={onClose}
            title={user.username || t('findFriends.userProfile')}
        >
            <div className="flex flex-col items-center space-y-6">
                <Picture
                    location={getUserPhotoUrl(user.id, user.profilePictureUrl)}
                    initials={getUserInitials(user)}
                    size={120}
                    shape="circle"
                    alt={user.username}
                />

                <div className="text-center">
                    <h2 className="text-2xl font-bold">{user.username}</h2>
                    {(user.first_name || user.last_name) && (
                        <p className="text-gray-600 mt-1">
                            {user.first_name} {user.last_name}
                        </p>
                    )}
                    <Link
                        to={`/user/${user.id}`}
                        className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                        {t('social.viewFullProfile') || 'View Full Profile'}
                    </Link>
                </div>

                {error && (
                    <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col w-full space-y-3 pt-4">
                    {/* Add Friend / Add Enemy Logic (Find Users mode) */}
                    {onAddFriend && onAddEnemy ? (
                        isRequestSent ? (
                            <Button
                                text={t('findFriends.requestSentButton')}
                                onClick={() => { }}
                                disabled={true}
                                className="w-full bg-gray-400 cursor-not-allowed opacity-70"
                            />
                        ) : (
                            <>
                                <Button
                                    text={loading ? t('findFriends.processing') : t('findFriends.addFriend')}
                                    onClick={() => onAddFriend(user.id)}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                />
                                <Button
                                    text={loading ? t('findFriends.processing') : t('findFriends.addEnemy')}
                                    onClick={() => onAddEnemy(user.id)}
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 mt-2"
                                />
                            </>
                        )
                    ) : null}

                    {/* Unfriend Logic (My Friends mode) */}
                    {onRemoveFriend && (
                        <Button
                            text={loading ? t('friends.removing') || 'Unfriending...' : t('friends.remove') || 'Unfriend'}
                            onClick={() => {
                                onRemoveFriend(user.id);
                                onClose();
                            }}
                            disabled={loading}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                        />
                    )}

                    {/* Remove Enemy Logic (My Enemies mode) */}
                    {onRemoveEnemy && (
                        <Button
                            text={loading ? t('enemies.removing') || 'Removing...' : t('enemies.remove') || 'Remove Enemy'}
                            onClick={() => {
                                onRemoveEnemy(user.id);
                                onClose();
                            }}
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700"
                        />
                    )}
                </div>

                <div className="pt-2 text-sm text-gray-500 w-full text-center">
                    {/* Dogs List */}
                    <div className="mt-4 border-t border-gray-200 pt-4 w-full">
                        <h3 className="font-semibold text-gray-700 mb-3 text-center">{t('profile.dogs') || 'Dogs'}</h3>
                        <UserDogsList userId={user.id} />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
