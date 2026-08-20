export interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    onPageChange: (page: number) => void;
    from?: number;
    to?: number;
    unit?: string;
}

/**
 * Shared pagination control built from the backend `meta`
 * ({ current_page, last_page, total }).
 *
 * Renders: [‹ prev] [1] … [n] [next ›] with page numbers.
 * The public API (props) is intentionally unchanged so every page that
 * already uses <Pagination /> keeps working without edits.
 */
export default function Pagination({
    currentPage,
    lastPage,
    total,
    onPageChange,
    from,
    to,
    unit = "data",
}: PaginationProps) {
    const canPrev = currentPage > 1;
    const canNext = currentPage < lastPage;

    const label =
        from !== undefined && to !== undefined
            ? `Menampilkan ${from}-${to} dari ${total} ${unit}`
            : `Halaman ${currentPage} dari ${lastPage} • ${total} ${unit}`;

    const pages = buildPageList(currentPage, lastPage);

    const arrowBtn =
        "flex items-center justify-center w-9 h-9 rounded-lg border border-[#C2C6D8] text-[#424655] transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-[#F6FAFF]";

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3">
            <span className="text-sm text-[#767676]">{label}</span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Halaman sebelumnya"
                    className={arrowBtn}
                    disabled={!canPrev}
                    onClick={() => canPrev && onPageChange(currentPage - 1)}
                >
                    <ChevronLeft />
                </button>

                {pages.map((p, i) =>
                    p === "..." ? (
                        <span
                            key={`gap-${i}`}
                            className="flex items-center justify-center w-9 h-9 text-sm text-[#767676]"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            aria-label={`Halaman ${p}`}
                            aria-current={p === currentPage ? "page" : undefined}
                            onClick={() => onPageChange(p)}
                            className={`flex items-center justify-center min-w-9 h-9 px-2 rounded-lg border text-sm font-medium transition-colors ${p === currentPage
                                    ? "border-[#256EEF] bg-[#256EEF] text-white"
                                    : "border-[#C2C6D8] text-[#424655] hover:bg-[#F6FAFF]"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type="button"
                    aria-label="Halaman selanjutnya"
                    className={arrowBtn}
                    disabled={!canNext}
                    onClick={() => canNext && onPageChange(currentPage + 1)}
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
}

/**
 * Windowed page list with ellipsis, e.g. [1, "...", 4, 5, 6, "...", 12].
 * Always shows the first and last page plus a small window around current.
 */
function buildPageList(current: number, last: number): (number | "...")[] {
    if (last <= 1) return [1];

    const delta = 1; // neighbours on each side of current
    const range: number[] = [];
    const start = Math.max(2, current - delta);
    const end = Math.min(last - 1, current + delta);

    range.push(1);
    if (start > 2) range.push(-1); // left gap marker
    for (let i = start; i <= end; i++) range.push(i);
    if (end < last - 1) range.push(-2); // right gap marker
    range.push(last);

    return range.map((n) => (n < 0 ? "..." : n));
}

function ChevronLeft({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <path
                d="M12.5 4.5L7 10l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChevronRight({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <path
                d="M7.5 4.5L13 10l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
