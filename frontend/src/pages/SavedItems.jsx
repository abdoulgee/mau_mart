import { Heart } from 'lucide-react'
import Page from '../components/navigation/Page'
import Button from '../components/ui/Button'
import ProductCard, { ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { LoadMore } from '../components/ui/Pagination'
import usePaginatedList from '../hooks/usePaginatedList'

export default function SavedItems() {
    const saved = usePaginatedList('/api/v1/wishlist', {}, { key: 'items' })

    return (
        <Page title="Saved" back description="Listings you've saved for later">
            {saved.loading ? (
                <ProductGridSkeleton count={4} />
            ) : saved.error ? (
                <ErrorState onRetry={saved.reload} />
            ) : saved.items.length === 0 ? (
                <EmptyState icon={Heart} title="Nothing saved yet" message="Tap the heart on a listing to keep it here."
                    action={<Button to="/" variant="secondary">Browse listings</Button>} />
            ) : (
                <>
                    <ProductGrid>{saved.items.map((item) => <ProductCard key={item.id} product={item.product} />)}</ProductGrid>
                    <LoadMore hasMore={saved.hasMore} loading={saved.loadingMore} onClick={saved.loadMore} />
                </>
            )}
        </Page>
    )
}
