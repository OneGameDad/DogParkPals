
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Organization } from '../../types';

interface OrganizationAboutProps {
    organization: Organization;
}

const OrganizationAbout: React.FC<OrganizationAboutProps> = ({ organization }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {t('organizations.about', 'About')}
            </h2>

            <div className="prose max-w-none text-gray-600">
                {organization.description ? (
                    <p className="whitespace-pre-wrap">{organization.description}</p>
                ) : (
                    <p className="italic text-gray-400">
                        {t('organizations.noDescription', 'No description available for this organization.')}
                    </p>
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <span className="block text-sm font-medium text-gray-500">
                        {t('organizations.founded', 'Founded')}
                    </span>
                    <span className="text-gray-800">
                        {new Date(organization.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {/* Add more metadata here as needed, e.g. Location if added to schema */}
            </div>
        </div>
    );
};

export default OrganizationAbout;
