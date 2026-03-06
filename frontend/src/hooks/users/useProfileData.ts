import { useAuth } from '../useAuth';
import { useFetch } from '../useFetch';
import type { Dog, User } from '../../types';

export const useProfileData = (id?: string) => {
	const { user: currentUser, loading: authLoading } = useAuth();
	
	// Determine if viewing own profile or someone else's
	const isOwnProfile = !id || (currentUser && id === String(currentUser.id));
	const viewingUserId = id ? parseInt(id, 10) : currentUser?.id;
	
	// Fetch other user's data if not own profile
	const { data: profileUser, loading: userLoading } = useFetch<User>(
		id && !isOwnProfile ? `/users/id/${id}` : ''
	);
	
	// Use currentUser for own profile, fetched user for others
	const displayUser = isOwnProfile ? currentUser : profileUser;
	
	// Fetch dogs using the determined user ID
	const { data: dogs, loading: dogsLoading } = useFetch<Dog[]>(
		viewingUserId ? `/api/dogs/owner/${viewingUserId}` : ''
	);

	return {
		displayUser: displayUser || undefined,
		isOwnProfile,
		loading: authLoading || (id && !isOwnProfile ? userLoading : false) || dogsLoading,
		dogs: dogs || undefined,
		viewingUserId
	};
};
