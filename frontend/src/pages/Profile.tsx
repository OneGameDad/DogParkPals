import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Header from '../components/Header';
import Button from '../components/Button';
import Picture from '../components/Picture';
import BodyText from '../components/BodyText';
import type { Dog } from '../types';

const Profile = () => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { user, loading: authLoading } = useAuth();
	const { data: dogs, loading: dogsLoading } = useFetch<Dog[]>(
		user ? `/api/dogs/owner/${user.id}` : ''
	);

	const loading = authLoading || dogsLoading;

	if (loading) {
		return <Loading message={t('profile.loadingProfile')} />;
	}

	if (!user) {
		return <ErrorMessage message={t('profile.failedToLoad')} showBackButton backTo="/" />;
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
							location={user.profilePictureUrl || '/imgs/exampleprofilepic.jpg'}
							size={128}
							shape="circle"
							alt="Profile"
						/>
					</div>
				</div>
				<Header
					text={user.first_name && user.last_name
						? `${user.first_name} ${user.last_name}`
						: user.username}
					level="h1"
					className="text-center mb-4"
				/>
				<div className="flex justify-center mb-8">
					<Button
						text={t('profile.editProfile')}
						onClick={() => navigate('/profile/edit')}
						className="bg-blue-600 hover:bg-blue-700 px-6"
					/>
				</div>
				<div className="space-y-4">

					<div className="flex justify-between border-b pb-2">
						<span className="font-semibold text-gray-700">{t('profile.username')}:</span>
						<span className="text-gray-900">{user.username}</span>
					</div>
					<div className="flex justify-between border-b pb-2">
						<span className="font-semibold text-gray-700">{t('profile.email')}:</span>
						<span className="text-gray-900">{user.email}</span>
					</div>
					<div className="flex justify-between border-b pb-2">
						<span className="font-semibold text-gray-700">{t('profile.experiencePoints')}:</span>
						<span className="text-gray-900">{user.ExpPoints}</span>
					</div>
					<div className="flex justify-between border-b pb-2">
						<span className="font-semibold text-gray-700">{t('memberSince')}:</span>
						<span className="text-gray-900">{formatDate(user.createdAt)}</span>
					</div>
				</div>

				{/* Dogs List */}
				<div className="mt-8 pt-8 border-t border-gray-200">
					<div className="flex justify-between items-center mb-6">
						<Header text={t('profile.dogs')} level="h2" />
						<Button
							text={t('profile.addDog')}
							onClick={() => navigate('/dog/add')}
							className="bg-green-600 hover:bg-green-700"
						/>
					</div>
					{!dogs || dogs.length === 0 ? (
						<BodyText text={t('profile.noDogs')} colour="text-gray-500" className="text-center py-4" />
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
							{dogs.map((dog) => (
								<Link
									key={dog.id}
									to={`/dog/${dog.id}`}
									className="flex flex-col items-center p-4 border rounded-lg hover:shadow-lg transition-shadow"
								>
									<div className="mb-3">
										<Picture
											location={dog.profilePictureUrl || '/imgs/exampledogpic.jpg'}
											size={96}
											shape="circle"
											alt={dog.name}
										/>
									</div>
									<span className="font-semibold text-gray-800">{dog.name}</span>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Profile;