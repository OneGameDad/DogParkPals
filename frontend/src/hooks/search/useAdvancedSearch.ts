import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../useDebounce';
import searchService from '../../services/searchService';
import type { AdvancedSearchResponse } from '../../services/searchService';

const EMPTY_RESULTS: AdvancedSearchResponse = {
    parks: [],
    users: [],
    dogs: [],
    organizations: [],
    events: [],
    total: 0,
};

interface UseAdvancedSearchOptions {
    /** Debounce delay in ms (default 400) */
    delay?: number;
    /** Results per entity type (default 10, max 50) */
    limit?: number;
}

export interface UseAdvancedSearchReturn {
    query: string;
    setQuery: (q: string) => void;
    results: AdvancedSearchResponse;
    loading: boolean;
    error: Error | null;
    /** Current 0-based page offset for pagination */
    offset: number;
    setOffset: (offset: number) => void;
    /** Re-run the current search */
    refetch: () => void;
}

/**
 * Hook for the multi-type global search endpoint (GET /api/search).
 * Debounces input, manages loading/error state, and supports pagination.
 */
export const useAdvancedSearch = (
    options: UseAdvancedSearchOptions = {}
): UseAdvancedSearchReturn => {
    const { delay = 400, limit = 10 } = options;

    const [query, setQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [results, setResults] = useState<AdvancedSearchResponse>(EMPTY_RESULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const debouncedQuery = useDebounce(query, delay);

    const lastQueryRef = useRef(debouncedQuery);

    const performSearch = useCallback(async (q: string, currentOffset: number, currentLimit: number) => {
        if (!q.trim()) {
            setResults(EMPTY_RESULTS);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await searchService.searchAll(q, { limit: currentLimit, offset: currentOffset });
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Search failed'));
            setResults(EMPTY_RESULTS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let currentOffset = offset;
        if (lastQueryRef.current !== debouncedQuery) {
            currentOffset = 0;
            setOffset(0);
            lastQueryRef.current = debouncedQuery;
        }

        let cancelled = false;

        if (!debouncedQuery.trim()) {
            setResults(EMPTY_RESULTS);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        searchService.searchAll(debouncedQuery, { limit, offset: currentOffset })
            .then(data => {
                if (!cancelled) setResults(data);
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error('Search failed'));
                    setResults(EMPTY_RESULTS);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, offset, limit]);

    const refetch = useCallback(() => {
        // use the exact state
        performSearch(debouncedQuery, offset, limit);
    }, [debouncedQuery, offset, limit, performSearch]);

    return {
        query,
        setQuery,
        results,
        loading,
        error,
        offset,
        setOffset,
        refetch,
    };
};
