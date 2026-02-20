import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogoHeader } from '../components/navigation/Header'
import useProductStore from '../store/productStore'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import { SkeletonProductCard as ProductCardSkeleton } from '../components/ui/Skeleton'

import useCategoryStore from '../store/categoryStore'
import AdBanner from '../components/ui/AdBanner'
import getImageUrl from '../utils/imageUrl'

// Helper for category colors since they aren't in the DB
const categoryColors = [
    'from-amber-400 to-orange-500',
    'from-sky-400 to-blue-500',
    'from-rose-400 to-pink-500',
    'from-emerald-400 to-green-500',
    'from-violet-400 to-purple-500',
    'from-cyan-400 to-teal-500',
    'from-lime-400 to-green-500',
    'from-fuchsia-400 to-pink-500',
]

// Category icons mapping
const categoryIcons = ['🛍️', '📱', '👕', '📚', '🍔', '💄', '🎮', '🏠']


// Product Card Component
function ProductCard({ product }) {
    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                <div className="aspect-square relative overflow-hidden">
                    {product.media?.[0]?.url ? (
                        <img
                            src={getImageUrl(product.media[0].url)}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    )}
                    {product.compare_price && product.compare_price > product.price && (
                        <span className="absolute top-2 left-2 bg-accent-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                            -{Math.round((1 - product.price / product.compare_price) * 100)}%
                        </span>
                    )}
                </div>
                <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1.5 leading-tight group-hover:text-primary-600 transition-colors">
                        {product.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-primary-600">₦{product.price.toLocaleString()}</span>
                        {product.compare_price && product.compare_price > product.price && (
                            <span className="text-xs text-gray-400 line-through">₦{product.compare_price.toLocaleString()}</span>
                        )}
                    </div>
                    {product.store && (
                        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {product.store.name}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    )
}

// Store Card Component
function StoreCard({ store }) {
    return (
        <Link to={`/store/${store.id}`} className="min-w-[130px] max-w-[130px] group">
            <div className="bg-white rounded-2xl shadow-card p-4 text-center hover:shadow-card-hover transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center overflow-hidden ring-2 ring-primary-200/50">
                    {store.logo_url ? (
                        <img src={getImageUrl(store.logo_url)} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                        <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    )}
                </div>
                <h3 className="font-semibold text-gray-800 text-xs line-clamp-1">{store.name}</h3>
                <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 mt-1">
                    <svg className="w-3 h-3 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">{store.rating?.toFixed(1) || '0.0'}</span>
                </div>
            </div>
        </Link>
    )
}

export default function Home() {
    const { featuredProducts, recentProducts, fetchFeaturedProducts, fetchRecentProducts } = useProductStore()
    const { categories, loading: categoriesLoading, fetchCategories, connectSocket } = useCategoryStore()
    const { addToast } = useUIStore()
    const [loading, setLoading] = useState(true)
    const [stores, setStores] = useState([])

    useEffect(() => {
        connectSocket()
        fetchCategories()

        // Refresh profile if logged in to catch status updates (e.g. store approval)
        const { isAuthenticated, fetchProfile } = useAuthStore.getState()
        if (isAuthenticated) {
            fetchProfile()
        }

        const loadData = async () => {
            try {
                await Promise.all([
                    fetchFeaturedProducts(),
                    fetchRecentProducts()
                ])
            } catch (error) {
                addToast({ type: 'error', message: 'Failed to load products' })
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div className="pb-6">
            <LogoHeader />

            <div className="px-4 space-y-6 pt-1">
                {/* Search Bar */}
                <Link
                    to="/search"
                    className="flex items-center gap-3 bg-surface-100 rounded-2xl px-4 py-3.5 text-gray-400 hover:bg-surface-200 transition-colors border border-surface-200"
                >
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-medium">Search for products, stores...</span>
                </Link>

                <AdBanner position="home_banner" />

                {/* Categories Grid */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Categories</h2>
                        <Link to="/categories" className="section-link">See All</Link>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {categoriesLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-24 skeleton rounded-2xl" />
                            ))
                        ) : categories.slice(0, 6).map((cat, i) => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.slug}`}
                                className={`p-4 rounded-2xl bg-gradient-to-br ${categoryColors[i % categoryColors.length]} text-white text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
                            >
                                <span className="text-2xl block mb-1.5">{cat.icon || categoryIcons[i % categoryIcons.length]}</span>
                                <span className="text-xs font-semibold">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                    {!categoriesLoading && categories.length === 0 && (
                        <div className="text-center py-4 text-gray-400 bg-surface-100 rounded-2xl">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-sm">No categories found</p>
                        </div>
                    )}
                </section>

                {/* Featured Products */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Featured
                        </h2>
                        <Link to="/products?featured=true" className="section-link">See All</Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {featuredProducts.slice(0, 4).map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                    {!loading && featuredProducts.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="font-medium text-sm">No featured products yet</p>
                        </div>
                    )}
                </section>

                {/* Top Stores */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Top Stores</h2>
                        <Link to="/stores" className="section-link">See All</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                        {stores.length > 0 ? (
                            stores.map(store => <StoreCard key={store.id} store={store} />)
                        ) : (
                            <div className="w-full text-center py-10 text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-sm font-medium">Top stores coming soon</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Products */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Recently Added</h2>
                        <Link to="/products" className="section-link">See All</Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {recentProducts.slice(0, 6).map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                <AdBanner position="bottom_banner" />
            </div>
        </div>
    )
}
