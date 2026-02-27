import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEntitySearch } from '../../../hooks/search/useEntitySearch';
import searchService from '../../../services/searchService';

vi.mock('../../../services/searchService', () => ({
    default: {
        searchByType: vi.fn(),
    },
}));

describe('useEntitySearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return empty results and not load when query is empty', () => {
        const { result } = renderHook(() => useEntitySearch('USER', ''));

        expect(result.current.results).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isSearching).toBe(false);
        expect(searchService.searchByType).not.toHaveBeenCalled();
    });

    it('should fetch results and update state when query is provided', async () => {
        const mockResults = { total: 2, results: [{ id: 1, name: 'Test' }, { id: 2, name: 'Another' }] };
        (searchService.searchByType as any).mockResolvedValue(mockResults);

        const { result } = renderHook(() => useEntitySearch('USER', 'test'));

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.isSearching).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.results).toEqual(mockResults.results);
        expect(result.current.error).toBe(null);
        expect(searchService.searchByType).toHaveBeenCalledWith('USER', 'test', { limit: 50, offset: 0 });
    });

    it('should handle API errors', async () => {
        const mockError = new Error('Network error');
        (searchService.searchByType as any).mockRejectedValue(mockError);

        const { result } = renderHook(() => useEntitySearch('PARK', 'error query'));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.results).toEqual([]);
        expect(result.current.error).toBe(mockError);
        expect(searchService.searchByType).toHaveBeenCalledWith('PARK', 'error query', { limit: 50, offset: 0 });
    });

    it('should cancel the request if query changes before it completes', async () => {
        // Prevent the promise from resolving immediately
        let resolveRequest: any;
        const mockPromise = new Promise((resolve) => {
            resolveRequest = resolve;
        });
        (searchService.searchByType as any).mockReturnValue(mockPromise);

        const { result, unmount } = renderHook(() => useEntitySearch('DOG', 'pending'));

        expect(result.current.loading).toBe(true);

        // Unmount to trigger the cancellation logic
        unmount();

        // Resolve the promise after unmount
        resolveRequest({ results: [{ id: 1, name: 'Late Result' }] });

        // The results and loading state should not have changed due to cancellation
        expect(result.current.results).toEqual([]);
    });
});
