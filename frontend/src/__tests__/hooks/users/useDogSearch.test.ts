import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDogSearch } from '../../../hooks/users/useDogSearch';
import { useFetch } from '../../../hooks/useFetch';
import { useAuth } from '../../../hooks/useAuth';

// Mock hooks
vi.mock('../../../hooks/useFetch', () => ({
    useFetch: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

describe('useDogSearch Hook', () => {
    const mockAllDogs = [
        { id: 1, name: 'Buddy', breed: 'Type A' },
        { id: 2, name: 'Rex', breed: 'Type B' },
        { id: 3, name: 'Max', breed: 'Type A' },
    ];

    const mockMyDogs = [
        { id: 2, name: 'Rex' }, // User owns Rex
    ];

    const mockUser = { id: 101 };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser });

        // Mock implementation to return different data based on URL
        (useFetch as any).mockImplementation((url) => {
            if (url === '/api/dogs') {
                return { data: mockAllDogs, loading: false, error: null };
            }
            if (url === `/api/dogs/owner/${mockUser.id}`) {
                return { data: mockMyDogs, loading: false, error: null };
            }
            return { data: null, loading: false, error: null };
        });
    });

    it('should return dogs filtering out user\'s own dogs', () => {
        const { result } = renderHook(() => useDogSearch());

        expect(result.current.dogs).toHaveLength(2);
        expect(result.current.dogs.map((d: any) => d.name)).toEqual(['Buddy', 'Max']);
        expect(result.current.dogs.find((d: any) => d.id === 2)).toBeUndefined();
    });

    it('should filter dogs by search query (name)', () => {
        const { result } = renderHook(() => useDogSearch());

        act(() => {
            result.current.setSearchQuery('Buddy');
        });

        expect(result.current.dogs).toHaveLength(1);
        expect(result.current.dogs[0].name).toBe('Buddy');
    });

    it('should filter dogs by search query (breed)', () => {
        const { result } = renderHook(() => useDogSearch());

        act(() => {
            result.current.setSearchQuery('Type A');
        });

        expect(result.current.dogs).toHaveLength(2);
        expect(result.current.dogs.map((d: any) => d.name)).toEqual(['Buddy', 'Max']);
    });

    it('should be case insensitive', () => {
        const { result } = renderHook(() => useDogSearch());

        act(() => {
            result.current.setSearchQuery('buddy');
        });

        expect(result.current.dogs).toHaveLength(1);
        expect(result.current.dogs[0].name).toBe('Buddy');
    });

    it('should handle loading state', () => {
        (useFetch as any).mockReturnValue({ data: null, loading: true });
        const { result } = renderHook(() => useDogSearch());
        expect(result.current.loading).toBe(true);
    });
});
