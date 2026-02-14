import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import api from '../services/api'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import AdBanner from '../components/ui/AdBanner'

const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
]

function ProductCard({ product }) {
    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                <div className="aspect-square relative overflow-hidden">
                    {product.media?.[0]?.url ? (
                        <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 leading-tight">{product.title}</h3>
                    <span className="text-base font-bold text-primary-600">₦{product.price.toLocaleString()}</span>
                </div>
            </div>
        </Link>
    )
}

export default function CategoryProducts() {
    const { slug } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const [category, setCategory] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [showSort, setShowSort] = useState(false)

    const currentSort = searchParams.get('sort') || 'newest'

    useEffect(() => {
        fetchCategoryProducts()
    }, [slug, currentSort])

    const fetchCategoryProducts = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/api/v1/categories/slug/${slug}/products`, {
                params: { sort: currentSort, page, limit: 20 }
            })
            setCategory(response.data.category)
            setProducts(response.data.products)
            setPagination(response.data.pagination)
        } catch (error) {
            console.error('Failed to fetch category products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSortChange = (sort) => {
        setSearchParams({ sort })
        setShowSort(false)
    }

    return (
        <div className="min-h-screen bg-surface-50">
            <Header title={category?.name || 'Category'} showBack />

            {category && (
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-4 py-6 text-white">
                    <h1 className="text-2xl font-bold mb-1">{category.name}</h1>
                    {category.description && <p className="text-sm text-white/80">{category.description}</p>}
                    <p className="text-sm text-white/70 mt-2">{pagination.total || 0} products</p>
                </div>
            )}

            {/* Sort Bar */}
            <div className="sticky top-14 glass border-b border-surface-200/60 px-4 py-3 flex items-center justify-between z-10">
                <div className="relative">
                    <button onClick={() => setShowSort(!showSort)} className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        Sort: {sortOptions.find(o => o.value === currentSort)?.label}
                    </button>
                    {showSort && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-elevated border border-surface-200 py-2 z-20 min-w-[180px]">
                                {sortOptions.map(option => (
                                    <button key={option.value} onClick={() => handleSortChange(option.value)}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium ${currentSort === option.value ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-surface-50'}`}>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="p-4">
                <AdBanner position="category_banner" />
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}</div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">No products yet</h3>
                        <p className="text-gray-400 text-sm">Be the first to list a product in this category!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
