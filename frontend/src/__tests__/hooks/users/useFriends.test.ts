import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFriends } from '../../../hooks/users/useFriends';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';

// Mock dependencies
vi.mock('../../../services/api');
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useFetch');
vi.mock('../../../hooks/useSubmit', () => ({
    useSubmit: () => ({
        submit: async (fn: any) => fn(),
    })
}));

describe('useFriends', () => {
    const mockUser = { id: 1 };
    const mockRefetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser });
        (useFetch as any).mockReturnValue({
            data: { users: [{ id: 2, username: 'friend1' }] },
            loading: false,
            error: null,
            refetch: mockRefetch
        });
    });

    it('should fetch friends for current user if no ID provided', () => {
        renderHook(() => useFriends());
        expect(useFetch).toHaveBeenCalledWith('/api/friends?userId=1');
    });

    it('should fetch friends for target user if ID provided', () => {
        renderHook(() => useFriends(99));
        expect(useFetch).toHaveBeenCalledWith('/api/friends?userId=99');
    });

    it('should return friends list from data', () => {
        const { result } = renderHook(() => useFriends());
        expect(result.current.friends).toHaveLength(1);
        expect(result.current.friends[0].username).toBe('friend1');
    });

    it('should remove friend and refetch', async () => {
        (api.delete as any).mockResolvedValue({});
        const { result } = renderHook(() => useFriends());

        let success;
        await act(async () => {
            success = await result.current.removeFriend(2);
        });

        expect(success).toBe(true);
        expect(api.delete).toHaveBeenCalledWith('/api/friends', { userId: 1, friendId: 2 });
        expect(mockRefetch).toHaveBeenCalled();
    });
});
