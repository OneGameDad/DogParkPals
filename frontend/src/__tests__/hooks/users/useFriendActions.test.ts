import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFriendActions } from '../../../hooks/users/useFriendActions';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

// Mock dependencies
vi.mock('../../../services/api');
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useSubmit', () => ({
    useSubmit: ({ successMessage, errorMessage }: any) => ({
        submit: async (fn: any) => fn(),
        isSubmitting: false,
        error: null
    })
}));

describe('useFriendActions', () => {
    const mockUser = { id: 1 };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser });
    });

    it('should send friend request and auto-accept', async () => {
        // Mock API responses
        (api.post as any).mockResolvedValueOnce({ id: 100 }); // Friend request response
        (api.post as any).mockResolvedValueOnce({}); // Accept response

        const { result } = renderHook(() => useFriendActions());

        let success;
        await act(async () => {
            success = await result.current.addFriend(2);
        });

        expect(success).toBe(true);
        expect(api.post).toHaveBeenCalledWith('/api/friends', { requesterId: 1, addresseeId: 2 });
        // Check for workaround auto-accept
        expect(api.post).toHaveBeenCalledWith('/api/friends/accept', { friendshipId: 100 });
        expect(result.current.isRequestSent(2)).toBe(true);
    });

    it('should handle auto-accept failure gracefully', async () => {
        (api.post as any).mockResolvedValueOnce({ id: 100 });
        (api.post as any).mockRejectedValueOnce(new Error('Auth failed')); // Accept fails

        const { result } = renderHook(() => useFriendActions());
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        let success;
        await act(async () => {
            success = await result.current.addFriend(2);
        });

        expect(success).toBe(true); // Still true because request was sent
        expect(consoleSpy).toHaveBeenCalled();
        expect(result.current.isRequestSent(2)).toBe(true);
    });

    it('should return false if user is not logged in', async () => {
        (useAuth as any).mockReturnValue({ user: null });
        const { result } = renderHook(() => useFriendActions());

        let success;
        await act(async () => {
            success = await result.current.addFriend(2);
        });

        expect(success).toBe(false);
        expect(api.post).not.toHaveBeenCalled();
    });

    it('should add enemy successfully', async () => {
        (api.post as any).mockResolvedValueOnce({});

        const { result } = renderHook(() => useFriendActions());

        let success;
        await act(async () => {
            success = await result.current.addEnemy(3);
        });

        expect(success).toBe(true);
        expect(api.post).toHaveBeenCalledWith('/api/enemies', { userId: 1, enemyUserId: 3 });
    });
});
