import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks';
import type { Park } from '../../types';

interface ParkSelectorProps {
    onSelect: (parkId: number) => void;
    selectedParkId?: number;
}

const ParkSelector: React.FC<ParkSelectorProps> = ({ onSelect, selectedParkId }) => {
    const { t } = useTranslation();
    const { data: parks, loading } = useFetch<Park[]>('/api/parks');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value) {
            onSelect(Number(value));
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="parkSelect" className="font-semibold text-sm">
                {t('events.selectParkLabel', 'Location (Park)')}
                <span className="text-red-500 ml-1">*</span>
            </label>

            <select
                id="parkSelect"
                value={selectedParkId || ''}
                onChange={handleChange}
                disabled={loading}
                required
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
                <option value="" disabled>
                    {loading ? t('common.loading', 'Loading...') : t('events.selectParkPlaceholder', 'Select a park...')}
                </option>

                {parks?.map((park) => (
                    <option key={park.id} value={park.id}>
                        {park.name} {park.address ? `(${park.address})` : ''}
                    </option>
                ))}
            </select>

            {parks && parks.length === 0 && !loading && (
                <p className="text-xs text-gray-500 mt-1">{t('events.noParksFound', 'No parks found in database.')}</p>
            )}
        </div>
    );
};

export default ParkSelector;
