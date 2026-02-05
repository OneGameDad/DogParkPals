import type { User } from '../types';

export const formatAmenity = (amenity: string) => {
    return amenity
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const getUserInitials = (userOrName: User | string) => {
    if (typeof userOrName === 'string') {
        return userOrName?.substring(0, 2).toUpperCase() || '??';
    }
    const user = userOrName;
    if (user.first_name && user.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
        return user.first_name.slice(0, 2).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
};

export const getUserDisplayName = (user: User): string => {
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
        return user.first_name;
    }
    return user.username;
};

export const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};