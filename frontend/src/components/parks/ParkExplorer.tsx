import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks';
import { SearchBar } from '../features';
import { Loading, ErrorMessage } from '../common';
import { Header } from '../layout';
import { ParkCard } from './';
import type { Park } from '../../types';

const ParkExplorer = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: parks, loading, error } = useFetch<Park[]>('/api/parks');

    const filteredParks = useMemo(() => {
        if (!parks) return [];
        if (!searchQuery.trim()) return parks;

        const lowerQuery = searchQuery.toLowerCase();
        return parks.filter((park: Park) =>
            park.name.toLowerCase().includes(lowerQuery) ||
            (park.description && park.description.toLowerCase().includes(lowerQuery))
        );
    }, [parks, searchQuery]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    if (loading) return <Loading />;
    if (error) return <ErrorMessage message={t('parks.error')} />;

    return (
        <div className="mt-12">
            <div className="mb-6">
                <Header text={t('parks.explore', 'Explore Parks')} level="h2" className="mb-4" />
                <SearchBar
                    onSearch={handleSearch}
                    placeholder={t('parks.searchPlaceholder', 'Search parks...')}
                />
            </div>

            {filteredParks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-lg">
                        {t('parks.noParksFound', 'No parks found matching your search.')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredParks.map((park: Park) => (
                        <ParkCard key={park.id} park={park} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParkExplorer;
