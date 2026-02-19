import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import useProductStore from '../store/productStore'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import { Skeleton } from '../components/ui/Skeleton'
import ProductReviews from '../components/ui/ProductReviews'
import api from '../services/api'
import ReportModal from '../components/ui/ReportModal'
import getImageUrl from '../utils/imageUrl'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { currentProduct, fetchProduct, isLoading } = useProductStore()
    const { isAuthenticated, user } = useAuthStore()
    const { addToast } = useUIStore()
    const [selectedMedia, setSelectedMedia] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [isSaved, setIsSaved] = useState(false)
    const [savingWishlist, setSavingWishlist] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    useEffect(() => {
        fetchProduct(id)
    }, [id])

    useEffect(() => {
        if (isAuthenticated && id) {
            api.get(`/api/v1/wishlist/check/${id}`)
                .then(res => setIsSaved(res.data.is_saved))
                .catch(() => { })
        }
    }, [isAuthenticated, id])

    const handleToggleSave = async () => {
        if (!isAuthenticated) {
            addToast({ type: 'info', message: 'Please login to save items' })
            navigate('/login')
            return
        }
        setSavingWishlist(true)
        try {
            if (isSaved) {
                await api.delete(`/api/v1/wishlist/${id}`)
                setIsSaved(false)
                addToast({ type: 'success', message: 'Removed from saved items' })
            } else {
                await api.post('/api/v1/wishlist', { product_id: parseInt(id) })
                setIsSaved(true)
                addToast({ type: 'success', message: 'Saved to wishlist!' })
            }
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to update wishlist' })
        } finally {
            setSavingWishlist(false)
        }
    }

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            addToast({ type: 'info', message: 'Please login to make a purchase' })
            navigate('/login')
            return
        }
        navigate(`/order/new?product=${id}&qty=${quantity}`)
    }

    const handleContactSeller = () => {
        if (!isAuthenticated) {
            addToast({ type: 'info', message: 'Please login to contact seller' })
            navigate('/login')
            return
        }
        navigate(`/chat?seller=${currentProduct?.store?.owner_id}&product=${id}`)
    }

    if (isLoading || !currentProduct) {
        return (
            <div className="min-h-screen bg-surface-50">
                <Header showBack />
                <div className="p-4 space-y-4">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    const product = currentProduct
    const isOwnProduct = user?.id === product.store?.owner_id

    return (
        <div className="min-h-screen bg-surface-50 pb-24">
            <Header
                showBack
                transparent
                rightAction={
                    !isOwnProduct && (
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-xl"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </button>
                    )
                }
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                entityType="product"
                entityId={id}
            />

            {/* Image Gallery */}
            <div className="relative">
                <div className="aspect-square bg-white">
                    {product.media && product.media.length > 0 ? (
                        <img
                            src={getImageUrl(product.media[selectedMedia]?.url)}
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                            <svg className="w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    )}
                </div>

                {/* Discount Badge */}
                {product.compare_price && product.compare_price > product.price && (
                    <div className="absolute top-20 left-4 bg-accent-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                        {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                    </div>
                )}

                {/* Thumbnail Strip */}
                {product.media && product.media.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {product.media.map((media, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedMedia(i)}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedMedia === i ? 'border-primary-500 scale-110' : 'border-white/50'
                                    }`}
                            >
                                <img src={getImageUrl(media.url)} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="bg-white -mt-4 rounded-t-3xl relative z-10 px-4 py-6 space-y-4">
                {/* Title & Price */}
                <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">{product.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary-600">₦{product.price.toLocaleString()}</span>
                        {product.compare_price && product.compare_price > product.price && (
                            <span className="text-lg text-gray-400 line-through">₦{product.compare_price.toLocaleString()}</span>
                        )}
                    </div>
                </div>

                {/* Rating & Stats */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="font-bold">{product.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-400">({product.total_reviews} reviews)</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">{product.total_orders} sold</span>
                </div>

                {/* Store Info */}
                {product.store && (
                    <Link
                        to={`/store/${product.store.id}`}
                        className="flex items-center gap-3 p-3 bg-surface-50 rounded-2xl hover:bg-surface-100 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
                            {product.store.logo_url ? (
                                <img src={getImageUrl(product.store.logo_url)} alt={product.store.name} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{product.store.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <svg className="w-3 h-3 text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                {product.store.rating?.toFixed(1) || '0.0'}
                                <span className="mx-1">•</span>
                                {product.store.total_products || 0} products
                            </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                )}

                {/* Details */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line">{product.description || 'No description provided.'}</p>
                </div>

                {/* Stock & Pickup */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-surface-50 rounded-2xl">
                        <span className="text-xs text-gray-400 font-medium">Availability</span>
                        <p className={`font-bold text-sm mt-0.5 ${product.is_in_stock ? 'text-emerald-600' : 'text-red-500'}`}>
                            {product.is_in_stock ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                        </p>
                    </div>
                    {product.pickup_location && (
                        <div className="p-3 bg-surface-50 rounded-2xl">
                            <span className="text-xs text-gray-400 font-medium">Pickup Location</span>
                            <p className="font-bold text-sm text-gray-900 truncate mt-0.5">{product.pickup_location}</p>
                        </div>
                    )}
                </div>

                {/* Categories */}
                {product.categories && product.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {product.categories.map(cat => (
                            <Link
                                key={cat.id}
                                to={`/category/${cat.slug}`}
                                className="px-3 py-1.5 bg-surface-100 rounded-full text-xs text-gray-600 font-medium hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div className="px-4 py-6">
                <ProductReviews productId={id} canReview={!isOwnProduct} />
            </div>

            {/* Fixed Bottom Bar */}
            {!isOwnProduct && (
                <div className="fixed bottom-0 left-0 right-0 glass border-t border-surface-200/60 px-4 py-3 flex items-center gap-3 z-50 safe-bottom">
                    <button
                        onClick={handleToggleSave}
                        disabled={savingWishlist}
                        className={`p-3 rounded-2xl border-2 transition-all ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-surface-200 text-gray-400 hover:text-rose-400 hover:border-rose-200'}`}
                        title={isSaved ? 'Remove from saved' : 'Save item'}
                    >
                        <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleContactSeller}
                        className="btn-secondary flex-1"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Contact Seller
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={!product.is_in_stock}
                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {product.is_in_stock ? 'Buy Now' : 'Out of Stock'}
                    </button>
                </div>
            )}
        </div>
    )
}
