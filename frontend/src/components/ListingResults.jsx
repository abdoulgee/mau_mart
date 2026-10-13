import { useState } from 'react'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import ProductCard, { ProductGrid, ProductGridSkeleton } from './ProductCard'
import { EmptyState, ErrorState } from './ui/Feedback'
import { LoadMore } from './ui/Pagination'
import Button from './ui/Button'
import { controlClass } from './ui/Field'
import usePaginatedList from '../hooks/usePaginatedList'
import { CONDITIONS } from '../utils/format'
import cn from '../utils/cn'

const SORTS = {
    newest: 'Newest first',
    price_low: 'Price: low to high',
    price_high: 'Price: high to low',
}

const emptyFilters = { sort: 'newest', condition: '', min_price: '', max_price: '' }

/** Filter bar + paginated grid for /api/v1/products */
export default function ListingResults({ params = {}, emptyTitle = 'No listings found', emptyMessage, emptyAction }) {
    const [filters, setFilters] = useState(emptyFilters)
    const [showPrice, setShowPrice] = useState(false)
    const [priceDraft, setPriceDraft] = useState({ min: '', max: '' })

    const query = Object.fromEntries(Object.entries({ ...params, ...filters }).filter(([, v]) => v !== ''))
    const list = usePaginatedList('/api/v1/products', query)

    const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }))
    const priceInvalid = priceDraft.min !== '' && priceDraft.max !== '' && Number(priceDraft.min) > Number(priceDraft.max)
    const applyPrice = (e) => {
        e.preventDefault()
        if (priceInvalid) return
        setFilters((f) => ({ ...f, min_price: priceDraft.min, max_price: priceDraft.max }))
        setShowPrice(false)
    }
    const activeCount = [filters.condition, filters.min_price || filters.max_price].filter(Boolean).length
    const clearAll = () => {
        setFilters(emptyFilters)
        setPriceDraft({ min: '', max: '' })
    }

    const select = cn(controlClass(false), 'h-9 w-auto pr-8')

    return (
        <section aria-label="Listings" className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} className={select} aria-label="Sort by">
                    {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select value={filters.condition} onChange={(e) => setFilter('condition', e.target.value)} className={select} aria-label="Condition">
                    <option value="">Any condition</option>
                    {Object.entries(CONDITIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={SlidersHorizontal}
                    className="h-9"
                    aria-expanded={showPrice}
                    onClick={() => setShowPrice(!showPrice)}
                >
                    Price{filters.min_price || filters.max_price ? ': set' : ''}
                </Button>
                {activeCount > 0 && (
                    <Button variant="ghost" size="sm" icon={X} className="h-9" onClick={clearAll}>Clear filters</Button>
                )}
                {!list.loading && !list.error && (
                    <p className="ml-auto text-xs text-fg-subtle tabular" aria-live="polite">
                        {list.total.toLocaleString()} {list.total === 1 ? 'result' : 'results'}
                    </p>
                )}
            </div>

            {showPrice && (
                <form onSubmit={applyPrice} className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-3">
                    <label className="space-y-1 text-xs font-medium text-fg-muted">
                        <span className="block">Min (₦)</span>
                        <input type="number" min="0" inputMode="numeric" value={priceDraft.min} onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
                            className={cn(controlClass(priceInvalid), 'h-9 w-32')} />
                    </label>
                    <label className="space-y-1 text-xs font-medium text-fg-muted">
                        <span className="block">Max (₦)</span>
                        <input type="number" min="0" inputMode="numeric" value={priceDraft.max} onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
                            className={cn(controlClass(priceInvalid), 'h-9 w-32')} aria-invalid={priceInvalid || undefined} />
                    </label>
                    <Button type="submit" size="sm" className="h-9" disabled={priceInvalid}>Apply</Button>
                    {priceInvalid && <p className="w-full text-xs text-danger">Minimum can't be more than maximum.</p>}
                </form>
            )}

            {list.loading ? (
                <ProductGridSkeleton />
            ) : list.error ? (
                <ErrorState message="Listings could not be loaded." onRetry={list.reload} />
            ) : list.items.length === 0 ? (
                <EmptyState
                    icon={SearchX}
                    title={emptyTitle}
                    message={activeCount ? 'Try removing some filters.' : emptyMessage}
                    action={activeCount ? <Button variant="secondary" onClick={clearAll}>Clear filters</Button> : emptyAction}
                />
            ) : (
                <>
                    <ProductGrid>
                        {list.items.map((product) => <ProductCard key={product.id} product={product} />)}
                    </ProductGrid>
                    <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
                </>
            )}
        </section>
    )
}
