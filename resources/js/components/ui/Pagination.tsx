export interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    onPageChange: (page: number) => void;
}

/**
 * Simple pagination control built from the backend `meta`
 * ({ current_page, last_page, total }). The API only paginates by page,
 * so this exposes prev/next plus a page indicator.
 */
export default function Pagination({
    currentPage,
    lastPage,
    total,
    onPageChange,
}: PaginationProps) {
    const canPrev = currentPage > 1;
    const canNext = currentPage < lastPage;

    const btn =
        "px-3 py-2 text-sm rounded-lg border border-[#C2C6D8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-50";

    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-[#767676]">
                Halaman {currentPage} dari {lastPage} • {total} data
            </span>
            <div className="flex gap-2">
                <button
                    type="button"
                    className={btn}
                    disabled={!canPrev}
                    onClick={() => canPrev && onPageChange(currentPage - 1)}
                >
                    Sebelumnya
                </button>
                <button
                    type="button"
                    className={btn}
                    disabled={!canNext}
                    onClick={() => canNext && onPageChange(currentPage + 1)}
                >
                    Selanjutnya
                </button>
            </div>
        </div>
    );
}
