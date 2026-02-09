import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDogFriends } from '../../../hooks/users/useDogFriends';
import { useFetch } from '../../../hooks/useFetch';
import { useSubmit } from '../../../hooks/useSubmit';
import api from '../../../services/api';

// Mock hooks
vi.mock('../../../hooks/useFetch', () => ({
    useFetch: vi.fn(),
}));

vi.mock('../../../hooks/useSubmit', () => ({
    useSubmit: vi.fn(),
}));

vi.mock('../../../services/api', () => ({
    default: {
        delete: vi.fn(),
    },
}));

describe('useDogFriends Hook', () => {
    const mockFriends = [
        { id: 1, name: 'Dog Friend 1' },
        { id: 2, name: 'Dog Friend 2' },
    ];

    const mockRefetch = vi.fn();
    const mockSubmit = vi.fn((callback) => callback());

    beforeEach(() => {
        vi.clearAllMocks();
        (useFetch as any).mockReturnValue({
            data: { dogs: mockFriends },
            loading: false,
            error: null,
            refetch: mockRefetch,
        });
        (useSubmit as any).mockReturnValue({
            submit: mockSubmit,
            loading: false,
        });
    });

    it('should fetch friends for a given dogId', () => {
        const { result } = renderHook(() => useDogFriends(1));

        expect(useFetch).toHaveBeenCalledWith('/api/friends?dogId=1');
        expect(result.current.friends).toEqual(mockFriends);
        expect(result.current.loading).toBe(false);
    });

    it('should not fetch if dogId is undefined', () => {
        renderHook(() => useDogFriends(undefined));
        expect(useFetch).toHaveBeenCalledWith(null);
    });

    it('should return empty array if data is null', () => {
        (useFetch as any).mockReturnValue({
            data: null,
            loading: false,
            error: null,
        });

        const { result } = renderHook(() => useDogFriends(1));
        expect(result.current.friends).toEqual([]);
    });

    it('should call removeFriend successfully', async () => {
        const { result } = renderHook(() => useDogFriends(1));

        await result.current.removeFriend(2);

        expect(mockSubmit).toHaveBeenCalled();
        expect(api.delete).toHaveBeenCalledWith('/api/friends', { dogId: 1, friendDogId: 2 });
        expect(mockRefetch).toHaveBeenCalled();
    });

    it('should not call removeFriend if dogId is missing', async () => {
        const { result } = renderHook(() => useDogFriends(undefined));

        await result.current.removeFriend(2);

        expect(mockSubmit).not.toHaveBeenCalled();
    });
});
