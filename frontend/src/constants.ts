export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const UPLOAD_RULES = {
    userProfile: {
        types: ['image/jpeg', 'image/png'],
        maxSizeMB: 5,
    },
    dogPhoto: {
        types: ['image/jpeg', 'image/png'],
        maxSizeMB: 5,
    },
    document: {
        types: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSizeMB: 10,
    },
} as const;

export type UploadCategory = keyof typeof UPLOAD_RULES;

export const DEFAULT_IMAGES = {
    userProfile: '/images/default_user_profile.png', // TODO: or whatever the correct path is
    dogPhoto: '/images/default_dog_photo.png',
};