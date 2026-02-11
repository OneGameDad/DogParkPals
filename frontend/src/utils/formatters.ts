import type { User } from '../types';
import { API_BASE_URL } from '../constants';

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

export const getImageUrl = (url: string | null | undefined, fallback: string): string => {
  if (!url) return fallback;
  
  let cleanUrl = url.replace(/^.*[\/\\]uploads[\/\\]/, '/uploads/');
  
  if (cleanUrl.startsWith('/')) return `${API_BASE_URL}${cleanUrl}`;
  
  return cleanUrl;
};
