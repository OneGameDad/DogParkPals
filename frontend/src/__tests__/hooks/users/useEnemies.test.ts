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

    it('should return empty enemies and no error if no userId provided', () => {
        // For undefined userId, useEnemies calls useFetch with a falsy endpoint, which short-circuits with error: null
        (useFetch as any).mockReturnValue({
            data: null,
            loading: false,
            error: null
        });
        const { result } = renderHook(() => useEnemies(undefined));
        expect(result.current.error).toBeNull();
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

    it('should filter out null enemyUser relationships', () => {
        (useFetch as any).mockReturnValue({
            data: [
                { id: 101, enemyUser: { id: 3, username: 'enemy1' } },
                { id: 102, enemyUser: null }
            ],
            loading: false,
            error: null,
            refetch: mockRefetch
        });

        const { result } = renderHook(() => useEnemies(1));
        expect(result.current.enemies).toHaveLength(1);
        expect(result.current.enemies[0].id).toBe(3);
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
