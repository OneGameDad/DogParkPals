import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePagination } from '../../../hooks/search/usePagination';

describe('usePagination', () => {
    const items = Array.from({ length: 25 }, (_, i) => `Item ${i + 1}`);

    it('should initialize with default offset and page size', () => {
        const { result } = renderHook(() => usePagination(items));

        expect(result.current.offset).toBe(0);
        expect(result.current.paginatedItems.length).toBe(10);
        expect(result.current.paginatedItems[0]).toBe('Item 1');
        expect(result.current.paginatedItems[9]).toBe('Item 10');
    });

    it('should initialize with custom page size', () => {
        const { result } = renderHook(() => usePagination(items, 5));

        expect(result.current.offset).toBe(0);
        expect(result.current.paginatedItems.length).toBe(5);
        expect(result.current.paginatedItems[4]).toBe('Item 5');
    });

    it('should update offset and paginated items when setOffset is called', () => {
        const { result } = renderHook(() => usePagination(items, 10));

        act(() => {
            result.current.setOffset(10);
        });

        expect(result.current.offset).toBe(10);
        expect(result.current.paginatedItems.length).toBe(10);
        expect(result.current.paginatedItems[0]).toBe('Item 11');
        expect(result.current.paginatedItems[9]).toBe('Item 20');
    });

    it('should reset offset when resetPage is called', () => {
        const { result } = renderHook(() => usePagination(items, 10));

        act(() => {
            result.current.setOffset(20);
        });
        expect(result.current.offset).toBe(20);

        act(() => {
            result.current.resetPage();
        });

        expect(result.current.offset).toBe(0);
        expect(result.current.paginatedItems[0]).toBe('Item 1');
    });

    it('should handle offset exceeding array bounds gracefully', () => {
        const { result } = renderHook(() => usePagination(items, 10));

        act(() => {
            result.current.setOffset(30);
        });

        expect(result.current.offset).toBe(30);
        expect(result.current.paginatedItems.length).toBe(0);
        expect(result.current.paginatedItems).toEqual([]);
    });
});
