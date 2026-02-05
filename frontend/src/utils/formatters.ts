import type { User } from '../types';

export const formatAmenity = (amenity: string) => {
    return amenity
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const getUserInitials = (userOrName: User | string) => {
    if (typeof userOrName === 'string') {
        const trimmedName = userOrName?.trim() ?? '';
        if (!trimmedName) {
            return '??';
        }
        return trimmedName.substring(0, 2).toUpperCase();
    }
    const user = userOrName;
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
        return firstName.slice(0, 2).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
};

export const getUserDisplayName = (user: User): string => {
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    }
    if (firstName) {
        return firstName;
    }
    return user.username;
};

export const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};