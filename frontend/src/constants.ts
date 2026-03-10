export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:3000';

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
    organizationProfile: {
        types: ['image/jpeg', 'image/png'],
        maxSizeMB: 5,
    },
} as const;

export type UploadCategory = keyof typeof UPLOAD_RULES;

export const DEFAULT_IMAGES = {
    userProfile: '/imgs/default_user.png',
    dogPhoto: '/imgs/default_dog.png',
    orgPhoto: '/imgs/default_organization.png',
    parkCard: '/imgs/background.png',
    parkHero: '/imgs/background.png',
};

const isExternalOrDataUrl = (value: unknown): value is string => {
    return typeof value === 'string' && /^(https?:|data:)/.test(value);
};

export const getUserPhotoUrl = (userId: number | undefined, hasPhoto: boolean | string | null | undefined): string => {
    if (!hasPhoto) {
        return DEFAULT_IMAGES.userProfile;
    }

    if (isExternalOrDataUrl(hasPhoto)) {
        return hasPhoto;
    }

    if (userId) {
        return `${API_BASE_URL}/api/files/users/${userId}/profile-picture`;
    }

    return DEFAULT_IMAGES.userProfile;
};


export const getDogPhotoUrl = (dogId: number | undefined, hasPhoto: boolean | string | null | undefined): string => {
    if (!hasPhoto) {
        return DEFAULT_IMAGES.dogPhoto;
    }

    if (isExternalOrDataUrl(hasPhoto)) {
        return hasPhoto;
    }

    if (dogId) {
        return `${API_BASE_URL}/api/files/dogs/${dogId}/photo`;
    }

    return DEFAULT_IMAGES.dogPhoto;
};

export const getOrgPhotoUrl = (orgId: number | undefined, hasPhoto: boolean | string | null | undefined): string => {
    if (!hasPhoto) {
        return DEFAULT_IMAGES.orgPhoto;
    }

    if (isExternalOrDataUrl(hasPhoto)) {
        return hasPhoto;
    }

    if (orgId) {
        return `${API_BASE_URL}/api/files/organizations/${orgId}/profile-picture`;
    }

    return DEFAULT_IMAGES.orgPhoto;
};

export const getDogDocumentUrl = (dogId: number | undefined, hasDocument: boolean | string | null | undefined): string | null => {
    if (!hasDocument) {
        return null;
    }

    if (isExternalOrDataUrl(hasDocument)) {
        return hasDocument;
    }

    if (dogId) {
        return `${API_BASE_URL}/api/files/dogs/${dogId}/document`;
    }
    return null;
};