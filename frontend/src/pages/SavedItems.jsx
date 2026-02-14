import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { Skeleton } from '../components/ui/Skeleton'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import api from '../services/api'

export default function SavedItems() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedItems()
        } else {
            setLoading(false)
        }
    }, [isAuthenticated])

    const fetchSavedItems = async () => {
        try {
            const response = await api.get('/api/v1/wishlist')
            setItems(response.data.items || [])
        } catch (error) {
            console.error('Failed to fetch saved items:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (productId) => {
        try {
            await api.delete(`/api/v1/wishlist/${productId}`)
            setItems(prev => prev.filter(item => item.product_id !== productId))
            addToast({ type: 'success', message: 'Removed from saved items' })
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to remove item' })
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Saved Items" showBack />
            <div className="p-4 space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card">
                            <div className="flex gap-3">
                                <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-5 w-24 mb-2" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : items.length > 0 ? (
                    items.map(item => {
                        const product = item.product
                        return (
                            <div key={item.id} className="card">
                                <div className="flex gap-3">
                                    {/* Product image */}
                                    <div
                                        className="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden flex-shrink-0 cursor-pointer"
                                        onClick={() => navigate(`/product/${product?.slug || product?.id}`)}
                                    >
                                        {product?.media?.[0]?.url ? (
                                            <img
                                                src={product.media[0].url}
                                                alt={product?.title || 'Product'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                                        )}
                                    </div>

                                    {/* Product info */}
                                    <div className="flex-1 min-w-0">
                                        <h3
                                            className="font-semibold text-gray-900 text-sm truncate cursor-pointer hover:text-primary-600 transition-colors"
                                            onClick={() => navigate(`/product/${product?.slug || product?.id}`)}
                                        >
                                            {product?.title || 'Product'}
                                        </h3>
                                        <p className="text-primary-600 font-bold mt-1">
                                            ₦{product?.price?.toLocaleString() || '0'}
                                        </p>
                                        {product?.compare_price && product.compare_price > product.price && (
                                            <p className="text-xs text-gray-400 line-through">
                                                ₦{product.compare_price.toLocaleString()}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-primary-500 text-xs flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>{product?.rating?.toFixed(1) || '0.0'}</span>
                                            {product?.store && (
                                                <span className="text-xs text-gray-400">• {product.store.name}</span>
                                            )}
                                        </div>
                                        <span className={`text-xs ${product?.is_in_stock ? 'text-green-600' : 'text-red-500'}`}>
                                            {product?.is_in_stock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={() => handleRemove(item.product_id)}
                                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 self-start p-1"
                                        title="Remove from saved"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-rose-300" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">No saved items</h3>
                        <p className="text-gray-400 mb-6 text-sm">Items you save will appear here</p>
                        <button onClick={() => navigate('/')} className="btn-primary px-6">Browse Products</button>
                    </div>
                )}
            </div>
        </div>
    )
}
