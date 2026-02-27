import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../useDebounce';
import searchService from '../../services/searchService';
import type { AdvancedSearchResponse, SearchFilters } from '../../services/searchService';

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

    // Keep a ref to allow refetch without extra dependencies
    const filtersRef = useRef<SearchFilters>({ limit, offset });
    filtersRef.current = { limit, offset };

    const performSearch = useCallback(async (q: string, filters: SearchFilters) => {
        if (!q.trim()) {
            setResults(EMPTY_RESULTS);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await searchService.searchAll(q, filters);
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Search failed'));
            setResults(EMPTY_RESULTS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        performSearch(debouncedQuery, filtersRef.current);
    }, [debouncedQuery, offset, performSearch]);

    // Reset to first page when the search query changes
    useEffect(() => {
        setOffset(0);
    }, [debouncedQuery]);

    const refetch = useCallback(() => {
        performSearch(debouncedQuery, filtersRef.current);
    }, [debouncedQuery, performSearch]);

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
