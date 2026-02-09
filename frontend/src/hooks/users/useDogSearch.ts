import { useState, useMemo } from 'react';
import { useAuth } from '../useAuth';
import { useFetch } from '../useFetch';
import type { Dog } from '../../types';

export const useDogSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all dogs - API doesn't support server-side search yet
    const { data: allDogs, loading, error } = useFetch<Dog[]>('/api/dogs');
    const { user } = useAuth();

    // Fetch my dogs to filter them out
    const { data: myDogs } = useFetch<Dog[]>(
        user ? `/api/dogs/owner/${user.id}` : ''
    );

    const dogs = useMemo(() => {
        if (!allDogs) return [];

        let filteredDogs = allDogs;

        // Filter out my own dogs
        if (myDogs) {
            const myDogIds = new Set(myDogs.map(d => d.id));
            filteredDogs = filteredDogs.filter(d => !myDogIds.has(d.id));
        }

        if (!searchQuery.trim()) return filteredDogs;

        const query = searchQuery.toLowerCase();
        return filteredDogs.filter(dog =>
            dog.name.toLowerCase().includes(query) ||
            dog.breed.toLowerCase().includes(query)
        );
    }, [allDogs, searchQuery, myDogs]);

    return {
        searchQuery,
        setSearchQuery,
        dogs,
        loading,
        error
    };
};
