import React from 'react';
import { Link } from 'react-router-dom';
import { Organization } from '../../types';
import { Picture } from '../common';
import { useTranslation } from 'react-i18next';
import { DEFAULT_IMAGES } from '../../constants';

interface OrganizationCardProps {
    organization: Organization;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization }) => {
    const { t } = useTranslation();

    return (
        <Link
            to={`/organizations/${organization.id}`}
            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100"
        >
            <div className="flex p-4 gap-4">
                <div className="flex-shrink-0">
                    <Picture
                        location={organization.profilePictureUrl || DEFAULT_IMAGES.parkCard} // TODO: Add specific org default image
                        size={100}
                        shape="square"
                        alt={organization.name}
                    />
                </div>

                <div className="flex flex-col justify-between flex-grow overflow-hidden">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 truncate mb-1">
                            {organization.name}
                        </h3>

                        {organization.websiteUrl && (
                            <a
                                href={organization.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-sm mb-2 truncate block"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {organization.websiteUrl}
                            </a>
                        )}

                        <p className="text-gray-500 text-sm line-clamp-2">
                            {organization.description || t('organizations.noDescription', "No description available.")}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default OrganizationCard;
