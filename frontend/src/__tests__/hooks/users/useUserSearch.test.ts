import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserSearch } from '../../../hooks/users/useUserSearch';
import { useFetch } from '../../../hooks/useFetch';
import { useDebounce } from '../../../hooks/useDebounce';

// Mock dependencies
vi.mock('../../../hooks/useFetch');
vi.mock('../../../hooks/useDebounce');

describe('useUserSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use default /users endpoint when query is empty', () => {
        // Mock debounce to just return the value immediately or empty
        (useDebounce as any).mockReturnValue('');
        (useFetch as any).mockReturnValue({
            data: [{ id: 1, username: 'user1' }],
            loading: false,
            error: null
        });

        const { result } = renderHook(() => useUserSearch());

        expect(useFetch).toHaveBeenCalledWith('/users');
        expect(result.current.users).toHaveLength(1);
    });

    it('should use search endpoint when query is present', () => {
        (useDebounce as any).mockReturnValue('bob');
        (useFetch as any).mockReturnValue({
            data: { results: [{ id: 2, username: 'bob' }] }, // Search usually returns { results: [] }
            loading: false,
            error: null
        });

        const { result } = renderHook(() => useUserSearch());

        // Assuming useUserSearch sets the endpoint based on debounced value
        expect(useFetch).toHaveBeenCalledWith(expect.stringContaining('/api/search/USER?q=bob'));
        expect(result.current.users).toHaveLength(1);
        expect(result.current.users[0].username).toBe('bob');
    });

    it('should handle search query state updates', () => {
        (useDebounce as any).mockReturnValue('');
        (useFetch as any).mockReturnValue({ data: [], loading: false });

        const { result } = renderHook(() => useUserSearch());

        act(() => {
            result.current.setSearchQuery('alice');
        });

        expect(result.current.searchQuery).toBe('alice');
    });
});
