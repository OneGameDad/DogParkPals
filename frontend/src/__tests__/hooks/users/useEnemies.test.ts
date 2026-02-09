import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEnemies } from '../../../hooks/users/useEnemies';
import api from '../../../services/api';
import { useFetch } from '../../../hooks/useFetch';

// Mock dependencies
vi.mock('../../../services/api');
vi.mock('../../../hooks/useFetch');
vi.mock('../../../hooks/useSubmit', () => ({
    useSubmit: () => ({
        submit: async (fn: any) => fn(),
    })
}));

describe('useEnemies', () => {
    const mockRefetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useFetch as any).mockReturnValue({
            data: [{ id: 101, enemyUser: { id: 3, username: 'enemy1' } }],
            loading: false,
            error: null,
            refetch: mockRefetch
        });
    });

    it('should return error if no userId provided', () => {
        // Mock specific behavior for undefined userId if needed, or rely on hook logic
        // If hook returns empty array when useFetch returns something unexpected, ensure mock matches
        (useFetch as any).mockReturnValue({
            data: null,
            loading: false,
            error: 'No user ID'
        });
        const { result } = renderHook(() => useEnemies(undefined));
        expect(result.current.error).toBeDefined();
        expect(result.current.enemies).toEqual([]);
    });

    it('should fetch enemies for provided userId', () => {
        renderHook(() => useEnemies(1));
        expect(useFetch).toHaveBeenCalledWith('/api/enemies/1');
    });

    it('should transform data to return list of users', () => {
        const { result } = renderHook(() => useEnemies(1));
        expect(result.current.enemies).toHaveLength(1);
        expect(result.current.enemies[0].username).toBe('enemy1'); // Checks nested mapping
    });

    it('should remove enemy and refetch', async () => {
        (api.delete as any).mockResolvedValue({});
        const { result } = renderHook(() => useEnemies(1));

        let success;
        await act(async () => {
            success = await result.current.removeEnemy(3);
        });

        expect(success).toBe(true);
        expect(api.delete).toHaveBeenCalledWith('/api/enemies', { userId: 1, enemyUserId: 3 });
        expect(mockRefetch).toHaveBeenCalled();
    });
});
