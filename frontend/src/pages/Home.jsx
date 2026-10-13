import { useEffect, useState } from 'react'
import { ArrowRight, Plus, ShoppingBag } from 'lucide-react'
import Page from '../components/navigation/Page'
import HomeIntro, { HomeIntroAction } from '../components/HomeIntro'
import AdBanner from '../components/ui/AdBanner'
import Button from '../components/ui/Button'
import ProductCard, { ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import CategoryChips from '../components/CategoryChips'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { LoadMore } from '../components/ui/Pagination'
import usePaginatedList from '../hooks/usePaginatedList'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'
import api from '../services/api'

function SectionHeading({ title, action }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {action}
        </div>
    )
}

export default function Home() {
    const { isAuthenticated } = useAuthStore()
    const settings = useSettingsStore((s) => s.settings)
    const [featured, setFeatured] = useState([])
    const latest = usePaginatedList('/api/v1/products', { sort: 'newest' })

    useEffect(() => {
        api.get('/api/v1/products/featured')
            .then(({ data }) => setFeatured(data.products || []))
            .catch(() => { })
    }, [])

    return (
        <Page>
            <div className="space-y-10">
                <HomeIntro
                    tagline={settings.site_tagline}
                    title={settings.hero_title || 'Buy and sell on campus'}
                    message={settings.hero_message}
                    imageUrl={settings.hero_image_url}
                    action={<HomeIntroAction isAuthenticated={isAuthenticated} />}
                />

                <AdBanner />

                <section aria-labelledby="categories-heading">
                    <SectionHeading
                        title={<span id="categories-heading">Categories</span>}
                        action={<Button to="/categories" variant="ghost" size="sm" iconRight={ArrowRight}>All</Button>}
                    />
                    <CategoryChips />
                </section>

                {featured.length > 0 && (
                    <section aria-label="Featured listings">
                        <SectionHeading title="Featured" />
                        <ProductGrid>
                            {featured.slice(0, 5).map((product) => <ProductCard key={product.id} product={product} />)}
                        </ProductGrid>
                    </section>
                )}

                <section aria-label="Latest listings">
                    <SectionHeading title="Latest listings" />
                    {latest.loading ? (
                        <ProductGridSkeleton />
                    ) : latest.error ? (
                        <ErrorState message="Listings could not be loaded." onRetry={latest.reload} />
                    ) : latest.items.length === 0 ? (
                        <EmptyState
                            icon={ShoppingBag}
                            title="No listings yet"
                            message="Be the first to post something for sale on campus."
                            action={<Button to="/sell" icon={Plus}>Post a listing</Button>}
                        />
                    ) : (
                        <>
                            <ProductGrid>
                                {latest.items.map((product) => <ProductCard key={product.id} product={product} />)}
                            </ProductGrid>
                            <LoadMore hasMore={latest.hasMore} loading={latest.loadingMore} onClick={latest.loadMore} />
                        </>
                    )}
                </section>
            </div>
        </Page>
    )
}
