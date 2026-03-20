interface PaginationProps {
    /** 0-based current offset */
    offset: number;
    /** Page size (matches `limit` used in the search call) */
    pageSize: number;
    /** Total results available (from API response `count` or `total`) */
    total: number;
    onPageChange: (newOffset: number) => void;
    className?: string;
}

const Pagination = ({ offset, pageSize, total, onPageChange, className = '' }: PaginationProps) => {
    const currentPage = Math.floor(offset / pageSize) + 1;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const handlePrev = () => {
        if (offset > 0) onPageChange(Math.max(0, offset - pageSize));
    };

    const handleNext = () => {
        if (offset + pageSize < total) onPageChange(offset + pageSize);
    };

    if (total === 0) return null;

    return (
        <div className={`flex items-center justify-center gap-4 mt-6 ${className}`}>
            <button
                onClick={handlePrev}
                disabled={offset === 0}
                aria-label="Previous page"
                className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    offset === 0
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50 border border-gray-200'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
                ].join(' ')}
            >
                ← Prev
            </button>

            <span className="text-sm text-gray-600 select-none">
                Page <span className="font-semibold text-gray-800">{currentPage}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-800">{totalPages}</span>
            </span>

            <button
                onClick={handleNext}
                disabled={offset + pageSize >= total}
                aria-label="Next page"
                className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    offset + pageSize >= total
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50 border border-gray-200'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
                ].join(' ')}
            >
                Next →
            </button>
        </div>
    );
};

export default Pagination;
