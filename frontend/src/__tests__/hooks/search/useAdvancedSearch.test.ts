import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdvancedSearch } from '../../../hooks/search/useAdvancedSearch';
import searchService from '../../../services/searchService';

// Mock useDebounce to return the value immediately to avoid dealing with timers in these tests
vi.mock('../../../hooks/useDebounce', () => ({
    useDebounce: (val: any) => val, // Return immediately for easier testing
}));

vi.mock('../../../services/searchService', () => ({
    default: {
        searchAll: vi.fn(),
    },
}));

const mockEmptyResults = {
    parks: [],
    users: [],
    dogs: [],
    organizations: [],
    events: [],
    total: 0,
};

describe('useAdvancedSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default states and empty results', () => {
        const { result } = renderHook(() => useAdvancedSearch());

        expect(result.current.query).toBe('');
        expect(result.current.results).toEqual(mockEmptyResults);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.offset).toBe(0);
        expect(searchService.searchAll).not.toHaveBeenCalled();
    });

    it('should fetch results and manage loading state when query changes', async () => {
        const mockResults = {
            ...mockEmptyResults,
            users: [{ id: 1, name: 'Alice' }],
            total: 1,
        };
        (searchService.searchAll as any).mockResolvedValue(mockResults);

        const { result } = renderHook(() => useAdvancedSearch());

        act(() => {
            result.current.setQuery('alice');
        });

        // The query should be updated
        expect(result.current.query).toBe('alice');

        // Wait for the mock API to resolve
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.results).toEqual(mockResults);
        expect(searchService.searchAll).toHaveBeenCalledWith('alice', { limit: 10, offset: 0 });
    });

    it('should handle API errors gracefully', async () => {
        const mockError = new Error('API down');
        (searchService.searchAll as any).mockRejectedValue(mockError);

        const { result } = renderHook(() => useAdvancedSearch());

        act(() => {
            result.current.setQuery('fail');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(mockError);
        });

        expect(result.current.results).toEqual(mockEmptyResults);
    });

    it('should reset results and not call API when query is cleared', async () => {
        const { result } = renderHook(() => useAdvancedSearch());

        act(() => {
            result.current.setQuery('');
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.results).toEqual(mockEmptyResults);
        expect(searchService.searchAll).not.toHaveBeenCalled();
    });

    it('should support updating offset and fetching more results', async () => {
        const mockResults = {
            ...mockEmptyResults,
            parks: [{ id: 1, name: 'Park' }],
            total: 1,
        };
        (searchService.searchAll as any).mockResolvedValue(mockResults);

        const { result } = renderHook(() => useAdvancedSearch());

        act(() => {
            result.current.setQuery('park');
        });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Change offset
        act(() => {
            result.current.setOffset(10);
        });

        expect(result.current.offset).toBe(10);
        await waitFor(() => {
            expect(searchService.searchAll).toHaveBeenCalledWith('park', { limit: 10, offset: 10 });
        });
    });

    it('should reset offset to 0 when query changes', async () => {
        (searchService.searchAll as any).mockResolvedValue(mockEmptyResults);

        const { result } = renderHook(() => useAdvancedSearch());

        act(() => {
            result.current.setQuery('query 1');
            result.current.setOffset(20);
        });

        expect(result.current.offset).toBe(0); // Offset resets because query changed
    });

    it('should refetch current query and offset when refetch is called', async () => {
        (searchService.searchAll as any).mockResolvedValue(mockEmptyResults);

        const { result } = renderHook(() => useAdvancedSearch());

        act(() => {
            result.current.setQuery('refetch test');
        });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.refetch();
        });

        await waitFor(() => expect(searchService.searchAll).toHaveBeenCalledTimes(2));
    });
});
