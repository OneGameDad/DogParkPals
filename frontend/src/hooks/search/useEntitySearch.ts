import { useState, useEffect } from 'react';
import searchService from '../../services/searchService';
import type { SearchEntityType } from '../../services/searchService';

// Backend max — fetch all at once for these entities, paginate client-side
const FETCH_LIMIT = 50;

export function useEntitySearch<T>(type: SearchEntityType, debouncedQuery: string) {
    const [results, setResults] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        searchService
            .searchByType<any>(type, debouncedQuery, { limit: FETCH_LIMIT, offset: 0 })
            .then((res) => {
                if (!cancelled) setResults(res.results as unknown as T[]);
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err : new Error('Search failed'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [debouncedQuery, type]);

    const isSearching = Boolean(debouncedQuery.trim());

    return {
        results,
        loading: isSearching ? loading : false,
        error: isSearching ? error : null,
        isSearching
    };
}

export default useEntitySearch;
