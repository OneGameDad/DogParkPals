
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrganization } from '../hooks';
import OrganizationHeader from '../components/organizations/OrganizationHeader';
import OrganizationAbout from '../components/organizations/OrganizationAbout';
import OrganizationMembers from '../components/organizations/OrganizationMembers';
import OrganizationEvents from '../components/organizations/OrganizationEvents';
import { Loading, ErrorMessage } from '../components/common';

const OrganizationProfile = () => {
    const { id } = useParams<{ id: string }>();
    const {
        organization,
        loading,
        error,
        refresh,
        canEdit,
        isOwner,
        isModerator,
        isMember,
        isInvitee
    } = useOrganization(id);

    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'about' | 'members' | 'events'>('about');

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;
    if (!organization) return <ErrorMessage message={t('organizations.notFound', 'Organization not found')} />;

    type TabId = 'about' | 'members' | 'events';
    const tabs: { id: TabId; label: string }[] = [
        { id: 'about', label: t('organizations.tabs.about', 'About') },
        { id: 'members', label: t('organizations.tabs.members', 'Members') },
        { id: 'events', label: t('organizations.tabs.events', 'Events') },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Breadcrumb */}
            <div className="mb-4 text-sm text-gray-500">
                <Link to="/organizations" className="hover:text-blue-600 hover:underline">
                    {t('organizations.breadcrumb', 'Organizations')}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-800 font-medium">{organization.name}</span>
            </div>

            <OrganizationHeader
                organization={organization}
                canEdit={canEdit}
                isMember={isMember}
                isInvitee={isInvitee}
                onJoinRequest={refresh}
            />

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              py-4 px-6 text-sm font-medium focus:outline-none transition-colors duration-200
              ${activeTab === tab.id
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'about' && (
                    <OrganizationAbout organization={organization} />
                )}

                {activeTab === 'members' && (
                    <OrganizationMembers
                        organizationId={organization.id}
                        members={organization.members}
                        canManageMembers={isOwner || isModerator}
                        onMemberUpdate={refresh}
                    />
                )}

                {activeTab === 'events' && (
                    <OrganizationEvents
                        organizationId={organization.id}
                        canCreateEvent={canEdit}
                    />
                )}
            </div>
        </div>
    );
};

export default OrganizationProfile;
