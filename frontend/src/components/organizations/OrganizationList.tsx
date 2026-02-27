import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Organization } from '../../types';
import OrganizationCard from './OrganizationCard';
import { Button, Loading, ErrorMessage, FilterTabs, SortSelect, Pagination } from '../common';
import { SearchBar } from '../features';
import { useEntitySearch } from '../../hooks/search/useEntitySearch';
import { usePagination } from '../../hooks/search/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../hooks/useAuth';
import type { SortOrder } from '../common/SortSelect';

const PAGE_SIZE = 12;

type FilterType = 'all' | 'mine';

const OrganizationList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();

    // Base data (when not searching)
    const [baseOrganizations, setBaseOrganizations] = useState<Organization[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 400);

    // Advanced search hook
    const { results: searchResults, loading: searchLoading, error: searchError, isSearching } = useEntitySearch<Organization>('ORGANIZATION', debouncedQuery);

    // Filter and Sort state
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('az');

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const data = await api.get<Organization[]>('/api/organizations');
                setBaseOrganizations(data);
            } catch (err: unknown) {
                let message: string;
                if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
                    message = (err as { message: string }).message;
                } else {
                    message = t('organizations.fetchError', 'Failed to fetch organizations');
                }
                setError(message);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchOrganizations();
    }, [t]);

    // Choose data source based on whether we are searching
    const dataSource = useMemo(() => {
        return isSearching ? searchResults : baseOrganizations;
    }, [isSearching, searchResults, baseOrganizations]);

    // Apply filtering and sorting
    const processedOrganizations = useMemo(() => {
        let filtered: Organization[] = [...dataSource];

        // Apply filter tab
        if (activeFilter === 'mine' && user) {
            filtered = filtered.filter((org: Organization) =>
                org.ownerId === user.id || (org.memberRole && org.memberRole !== null)
            );
        }

        // Apply sort
        filtered.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (sortOrder === 'az') return nameA.localeCompare(nameB);
            if (sortOrder === 'za') return nameB.localeCompare(nameA);
            return 0;
        });

        return filtered;
    }, [dataSource, activeFilter, sortOrder, user]);

    // Pagination
    const { offset, setOffset, paginatedItems } = usePagination(processedOrganizations, PAGE_SIZE);

    // Reset pagination when search, filter, or sort changes
    useEffect(() => {
        setOffset(0);
    }, [searchQuery, activeFilter, sortOrder, setOffset]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const loading = initialLoading || searchLoading;
    const currentError = error || (searchError ? searchError.message : '');

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

            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-1/2">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder={t('organizations.searchPlaceholder', 'Search organizations...')}
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <SortSelect
                        value={sortOrder}
                        onChange={setSortOrder}
                        className="w-full md:w-auto min-w-[150px]"
                    />
                </div>
            </div>

            <FilterTabs<FilterType>
                tabs={[
                    { id: 'all', label: t('organizations.filterAll', 'All Organizations') },
                    { id: 'mine', label: t('organizations.filterMine', 'My Organizations') }
                ]}
                activeTab={activeFilter}
                onChange={setActiveFilter}
            />

            {loading ? (
                <Loading />
            ) : currentError ? (
                <ErrorMessage message={currentError} />
            ) : processedOrganizations.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg">
                    <p className="text-gray-600 text-lg mb-4">
                        {searchQuery || activeFilter === 'mine'
                            ? t('organizations.noResults', 'No organizations found matching your criteria.')
                            : t('organizations.noOrganizations', 'No organizations found.')
                        }
                    </p>
                    {!searchQuery && activeFilter === 'all' && (
                        <Button
                            text={t('organizations.createFirst', 'Create the first one!')}
                            onClick={() => navigate('/organizations/create')}
                        />
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedItems.map((org) => (
                            <OrganizationCard key={org.id} organization={org} />
                        ))}
                    </div>

                    <Pagination
                        offset={offset}
                        pageSize={PAGE_SIZE}
                        total={processedOrganizations.length}
                        onPageChange={setOffset}
                    />
                </>
            )}
        </div>
    );
};

export default OrganizationList;
