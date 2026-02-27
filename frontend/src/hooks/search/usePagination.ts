import { useState, useCallback, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize: number = 10) {
    const [offset, setOffset] = useState(0);

    const resetPage = useCallback(() => {
        setOffset(0);
    }, []);

    const paginatedItems = useMemo(() => {
        return items.slice(offset, offset + pageSize);
    }, [items, offset, pageSize]);

    return {
        offset,
        setOffset,
        resetPage,
        paginatedItems
    };
}

export default usePagination;
