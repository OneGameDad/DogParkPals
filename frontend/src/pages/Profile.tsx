import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserPresence } from '../hooks/users/useUserPresence';
import { useProfileData } from '../hooks/users/useProfileData';
import { Loading, ErrorMessage, Button } from '../components/common';
import { Header } from '../components/layout';
import { UserDogsList, UserProfileHeader, UserLevelDisplay, InfoRow, UserAchievementsList } from '../components/users';

const Profile = () => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const { displayUser, isOwnProfile, loading, dogs, viewingUserId } = useProfileData(id);

	// Only poll presence for other users
	const { isOnline, lastSeenAt } = useUserPresence({
		userId: !isOwnProfile && viewingUserId ? viewingUserId : undefined,
		enabled: !isOwnProfile && !!viewingUserId,
		pollingInterval: 30000
	});

	if (loading) {
		return <Loading message={t('profile.loadingProfile')} />;
	}

	if (!displayUser) {
		return <ErrorMessage message={t('profile.failedToLoad')} showBackButton backTo={isOwnProfile ? "/" : "/social"} />;
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

				<UserProfileHeader
					user={displayUser}
					isOnline={isOnline}
					lastSeenAt={lastSeenAt}
					isOwnProfile={Boolean(isOwnProfile)}
				/>

				{/* Action Buttons */}
				<div className="flex justify-center mb-8">
					{isOwnProfile ? (
						<Button
							text={t('profile.editProfile')}
							onClick={() => navigate('/profile/edit')}
							className="bg-blue-600 hover:bg-blue-700 px-6"
						/>
					) : (
						<Button
							text={t('common.goBack', 'Go Back')}
							onClick={() => navigate(-1)}
							className="bg-gray-600 hover:bg-gray-700 px-6"
						/>
					)}
				</div>

				{/* User Details */}
				<div className="space-y-4">
					<InfoRow label={t('profile.username')} value={displayUser.username} />
					{isOwnProfile && (
						<InfoRow label={t('profile.email')} value={displayUser.email} />
					)}

					<UserLevelDisplay expPoints={displayUser.ExpPoints} />

					<InfoRow label={t('memberSince')} value={formatDate(displayUser.createdAt)} />
				</div>

				{/* Achievements Section */}
				<div className="mt-8 pt-8 border-t border-gray-200">
					<div className="flex justify-between items-center mb-6">
						<Header text={t('profile.achievements', 'Achievements')} level="h2" />
					</div>
					<UserAchievementsList userId={displayUser.id} />
				</div>

				{/* Dogs Section */}
				<div className="mt-8 pt-8 border-t border-gray-200">
					<div className="flex justify-between items-center mb-6">
						<Header text={t('profile.dogs')} level="h2" />
						{isOwnProfile && (
							<Button
								text={t('profile.addDog')}
								onClick={() => navigate('/dog/add')}
								className="bg-green-600 hover:bg-green-700"
							/>
						)}
					</div>

					<UserDogsList
						userId={displayUser.id}
						dogs={dogs}
						editable={Boolean(isOwnProfile)}
					/>
				</div>
			</div>
		</div>
	);
};

export default Profile;