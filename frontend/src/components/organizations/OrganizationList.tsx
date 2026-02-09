import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Organization } from '../../types';
import OrganizationCard from './OrganizationCard';
import { Button, Loading, ErrorMessage } from '../common';
import { SearchBar } from '../features';

const OrganizationList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const data = await api.get<Organization[]>('/api/organizations');
                setOrganizations(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch organizations');
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizations();
    }, []);

    const filteredOrganizations = useMemo(() => {
        if (!organizations) return [];
        if (!searchQuery.trim()) return organizations;

        const lowerQuery = searchQuery.toLowerCase();
        return organizations.filter((org) =>
            org.name.toLowerCase().includes(lowerQuery) ||
            (org.description && org.description.toLowerCase().includes(lowerQuery))
        );
    }, [organizations, searchQuery]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 drop-shadow-sm sticky">
                    {t('organizations.title', 'Organizations')}
                </h2>
                <Button
                    text={t('organizations.create', 'Create Organization')}
                    onClick={() => navigate('/organizations/create')}
                />
            </div>

            <div className="mb-8">
                <SearchBar
                    onSearch={handleSearch}
                    placeholder={t('organizations.searchPlaceholder', 'Search organizations...')}
                />
            </div>

            {filteredOrganizations.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg">
                    <p className="text-gray-600 text-lg mb-4">
                        {searchQuery
                            ? t('organizations.noResults', 'No organizations found matching your search.')
                            : t('organizations.noOrganizations', 'No organizations found.')
                        }
                    </p>
                    {!searchQuery && (
                        <Button
                            text={t('organizations.createFirst', 'Create the first one!')}
                            onClick={() => navigate('/organizations/create')}
                        />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrganizations.map((org) => (
                        <OrganizationCard key={org.id} organization={org} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizationList;
