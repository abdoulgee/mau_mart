import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

/** "Load more" button for infinite lists */
export function LoadMore({ hasMore, loading, onClick }) {
    if (!hasMore) return null
    return (
        <div className="flex justify-center pt-6">
            <Button variant="secondary" onClick={onClick} loading={loading}>
                {loading ? 'Loading' : 'Load more'}
            </Button>
        </div>
    )
}

/** Page-by-page navigation for admin tables */
export function Pager({ page, pages, total, onChange }) {
    if (!pages || pages <= 1) return null
    return (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-xs text-fg-muted tabular">
                Page {page} of {pages}{total != null && ` · ${total.toLocaleString()} total`}
            </p>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => onChange(page - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="secondary" size="sm" iconRight={ChevronRight} onClick={() => onChange(page + 1)} disabled={page >= pages}>Next</Button>
            </div>
        </nav>
    )
}
