export const formatAmenity = (amenity: string) => {
    return amenity
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const getUserInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || '??';
};

export const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};