
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Organization } from '../../types';
import { Picture, Button } from '../common';
import { DEFAULT_IMAGES } from '../../constants';

interface OrganizationHeaderProps {
    organization: Organization;
    canEdit: boolean;
}

const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({ organization, canEdit }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 relative">
            {/* Banner Area - could be a separate image if backend supported it */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

            <div className="px-6 pb-6 mt-[-3rem] flex flex-col sm:flex-row items-end sm:items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                    <Picture
                        location={organization.profilePictureUrl || DEFAULT_IMAGES.parkCard}
                        size={120}
                        shape="square"
                        alt={organization.name}
                        className="border-4 border-white shadow-lg"
                    />
                </div>

                {/* Info */}
                <div className="flex-grow pt-12 sm:pt-0">
                    <h1 className="text-3xl font-bold text-gray-800">{organization.name}</h1>
                    {organization.websiteUrl && (
                        <a
                            href={organization.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {organization.websiteUrl}
                        </a>
                    )}
                </div>

                {/* Actions */}
                {canEdit && (
                    <div className="flex-shrink-0 mt-4 sm:mt-0">
                        <Button
                            text={t('organizations.edit', 'Edit Organization')}
                            onClick={() => navigate(`/organizations/${organization.id}/edit`)}
                            variant="outline"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationHeader;
