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
    userProfile: '/imgs/exampleprofilepic.jpg',
    dogPhoto: '/imgs/exampledogpic.jpg',
    parkCard: '/imgs/background.png',
    parkHero: '/imgs/background.png',
};

export const getUserPhotoUrl = (userId: number | undefined, hasPhoto: boolean | string | null | undefined): string => {
    if (userId && hasPhoto) {
        return `${API_BASE_URL}/api/files/users/${userId}/profile-picture`;
    }
    return DEFAULT_IMAGES.userProfile;
};


export const getDogPhotoUrl = (dogId: number | undefined, hasPhoto: boolean | string | null | undefined): string => {
    if (dogId && hasPhoto) {
        return `${API_BASE_URL}/api/files/dogs/${dogId}/photo`;
    }
    return DEFAULT_IMAGES.dogPhoto;
};

export const getDogDocumentUrl = (dogId: number | undefined, hasDocument: boolean | string | null | undefined): string | null => {
    if (dogId && hasDocument) {
        return `${API_BASE_URL}/api/files/dogs/${dogId}/document`;
    }
    return null;
};