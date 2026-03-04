import { Picture } from '../common';
import type { User } from '../../types';
import { getUserInitials } from '../../utils/formatters';
import { getUserPhotoUrl } from '../../constants';

interface UserCardProps {
    user: User;
    onClick?: (user: User) => void;
    action?: React.ReactNode;
    showChevron?: boolean;
    isActive?: boolean;
}

export default function UserCard({
    user,
    onClick,
    action,
    showChevron = true,
    isActive = false
}: UserCardProps) {
    const isClickable = !!onClick;

    return (
        <div
            onClick={() => onClick?.(user)}
            className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isClickable ? 'cursor-pointer hover:shadow-md' : ''
                } ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-gray-50'
                }`}
        >
            <div className="flex items-center space-x-4 pointer-events-none">
                <Picture
                    location={getUserPhotoUrl(user.id, user.profilePictureUrl)}
                    initials={getUserInitials(user)}
                    size={50}
                    shape="circle"
                    alt={user.username}
                />
                <div>
                    <h3 className="font-semibold text-lg">{user.username}</h3>
                    {(user.first_name || user.last_name) && (
                        <p className="text-gray-600">
                            {user.first_name} {user.last_name}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center">
                {action && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {action}
                    </div>
                )}

                {showChevron && !action && (
                    <div className="text-blue-500 ml-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
