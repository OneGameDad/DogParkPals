import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks';
import { SearchBar } from '../features';
import { Loading, ErrorMessage, SortSelect, Pagination } from '../common';
import FilterSelect from '../common/FilterSelect';
import { Header } from '../layout';
import { ParkCard } from './';
import type { Park } from '../../types';
import { Amenity } from '../../types';
import { useEntitySearch } from '../../hooks/search/useEntitySearch';
import { usePagination } from '../../hooks/search/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import type { ParkSearchResult } from '../../services/searchService';
import type { SortOrder } from '../common/SortSelect';

const PAGE_SIZE = 12;

const ParkExplorer = () => {
    const { t } = useTranslation();

    // Base data
    const { data: baseParks, loading: initialLoading, error: fetchError } = useFetch<Park[]>('/api/parks');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 400);

    // Advanced search hook
    const { results: searchResults, loading: searchLoading, error: searchError, isSearching } = useEntitySearch<ParkSearchResult>('PARK', debouncedQuery);

    // Filter and Sort state
    const [activeAmenityFilter, setActiveAmenityFilter] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('az');

    // Amenity Options
    const amenityOptions = useMemo(() => Object.values(Amenity), []);

    // Choose data source based on whether we are searching
    const dataSource = useMemo(() => {
        return isSearching ? searchResults : (baseParks || []);
    }, [isSearching, searchResults, baseParks]);

    // Apply filtering and sorting
    const processedParks = useMemo(() => {
        let filtered: Array<Park | ParkSearchResult> = [...dataSource];

        // Apply amenity filter
        if (activeAmenityFilter) {
            filtered = filtered.filter(park =>
                park.amenities && park.amenities.includes(activeAmenityFilter as Amenity)
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
    }, [dataSource, activeAmenityFilter, sortOrder]);

    // Pagination
    const { offset, setOffset, paginatedItems } = usePagination(processedParks, PAGE_SIZE);

    // Reset pagination when search, filter, or sort changes
    useEffect(() => {
        setOffset(0);
    }, [searchQuery, activeAmenityFilter, sortOrder, setOffset]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const loading = initialLoading || searchLoading;
    const currentError = fetchError ? t('parks.error') : (searchError ? searchError.message : '');

    if (loading && !baseParks && !searchResults.length) return <Loading />;
    if (currentError) return <ErrorMessage message={currentError} />;

    return (
        <div className="mt-12 w-full">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Header text={t('parks.explore', 'Explore Parks')} level="h2" className="m-0 sticky" />
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-1/2">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder={t('parks.searchPlaceholder', 'Search parks...')}
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <FilterSelect
                        value={activeAmenityFilter}
                        onChange={setActiveAmenityFilter}
                        options={amenityOptions}
                        allLabel={t('parks.allAmenities', 'All Amenities')}
                        className="w-full md:w-auto min-w-[150px]"
                    />
                    <SortSelect
                        value={sortOrder}
                        onChange={setSortOrder}
                        className="w-full md:w-auto min-w-[150px]"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-12"><Loading /></div>
            ) : processedParks.length === 0 ? (
                <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-lg">
                        {searchQuery || activeAmenityFilter
                            ? t('parks.noParksFoundCriteria', 'No parks found matching your criteria.')
                            : t('parks.noParksFound', 'No parks found.')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedItems.map((park: Park) => (
                            <ParkCard key={park.id} park={park} />
                        ))}
                    </div>

                    <Pagination
                        offset={offset}
                        pageSize={PAGE_SIZE}
                        total={processedParks.length}
                        onPageChange={setOffset}
                        className="mt-8"
                    />
                </>
            )}
        </div>
    );
};

export default ParkExplorer;
