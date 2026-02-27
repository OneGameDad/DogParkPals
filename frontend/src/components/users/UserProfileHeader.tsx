import React from 'react';
import { useTranslation } from 'react-i18next';
import { Picture } from '../common';
import { Header } from '../layout';
import { getUserInitials } from '../../utils/formatters';
import { formatLastSeen } from '../../utils/profileUtils';
import type { User } from '../../types';
import { getUserPhotoUrl } from '../../constants';

interface UserProfileHeaderProps {
	user: User;
	isOnline?: boolean;
	lastSeenAt?: Date | null;
	isOwnProfile: boolean;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
	user,
	isOnline,
	lastSeenAt,
	isOwnProfile
}) => {
	const { t } = useTranslation();

	return (
		<>
			<div className="flex justify-center mb-6">
				<div className="relative">
					<div className="border-4 border-gray-200 rounded-full">
						<Picture
							location={getUserPhotoUrl(user.id, user.profilePictureUrl)}
							initials={getUserInitials(user)}
							size={128}
							shape="circle"
							alt="Profile"
						/>
					</div>
					{/* Online Status Indicator - only for other users */}
					{!isOwnProfile && (
						<div className="absolute bottom-2 right-2">
							<div
								className={`w-6 h-6 rounded-full border-4 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
								title={isOnline ? t('profile.online', 'Online') : t('profile.offline', 'Offline')}
								aria-label={isOnline ? t('profile.online', 'Online') : t('profile.offline', 'Offline')}
							/>
						</div>
					)}
				</div>
			</div>

			<Header
				text={user.first_name && user.last_name
					? `${user.first_name} ${user.last_name}`
					: user.username}
				level="h1"
				className="text-center mb-2"
			/>

			{/* Online Status Text - only for other users */}
			{!isOwnProfile && (
				<div className="text-center mb-6">
					<span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
						{isOnline ? (
							<>
								<span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
								{t('profile.online', 'Online')}
							</>
						) : (
							<>
								<span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
								{t('profile.lastSeen', 'Last seen')}: {formatLastSeen(lastSeenAt, t)}
							</>
						)}
					</span>
				</div>
			)}
		</>
	);
};

export default UserProfileHeader;
