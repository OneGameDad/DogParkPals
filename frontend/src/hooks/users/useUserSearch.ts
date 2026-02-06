import { useState } from 'react';
import { useFetch } from '../useFetch';
import { useDebounce } from '../useDebounce';
import type { User } from '../../types';

export const useUserSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 300);

    // If query is empty, use /users (returns User[])
    // If query exists, use /api/search/USER (returns { results: User[] })
    const endpoint = debouncedQuery
        ? `/api/search/USER?q=${encodeURIComponent(debouncedQuery)}`
        : '/users';

    // We use 'any' here because the return type differs based on endpoint
    const { data, loading, error } = useFetch<any>(endpoint);

    // Normalize the data
    const users: User[] = Array.isArray(data)
        ? data
        : (data?.results || []);

    return {
        searchQuery,
        setSearchQuery,
        users,
        loading,
        error
    };
};
