import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import api from '../services/api'
import { Skeleton, ProductCardSkeleton } from '../components/ui/Skeleton'
import ReportModal from '../components/ui/ReportModal'
import useAuthStore from '../store/authStore'

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

export default function StoreDetail() {
    const { id } = useParams()
    const { user } = useAuthStore()
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    useEffect(() => { fetchStoreData() }, [id])

    const fetchStoreData = async () => {
        try {
            const [storeRes, productsRes] = await Promise.all([
                api.get(`/api/v1/stores/${id}`),
                api.get(`/api/v1/stores/${id}/products`)
            ])
            setStore(storeRes.data.store)
            setProducts(productsRes.data.products || [])
        } catch (error) { console.error('Failed to fetch store:', error) }
        finally { setLoading(false) }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50">
                <Header showBack />
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" />
                    <div className="grid grid-cols-2 gap-3 mt-6">{[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}</div>
                </div>
            </div>
        )
    }

    if (!store) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Store not found</h2>
                    <Link to="/" className="btn-primary px-6 mt-4 inline-block">Go Home</Link>
                </div>
            </div>
        )
    }

    const isOwnStore = user?.id === store?.owner_id

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header showBack transparent
                rightAction={!isOwnStore ? (
                    <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </button>
                ) : null}
            />

            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} entityType="store" entityId={id} />

            {/* Store Banner */}
            <div className="relative h-40 bg-gradient-to-br from-primary-500 to-primary-700">
                {store.banner_url && <img src={store.banner_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Store Info Card */}
            <div className="bg-white -mt-12 rounded-t-3xl relative z-10 px-4 pt-6 pb-4">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 -mt-14 rounded-2xl bg-white shadow-elevated flex items-center justify-center overflow-hidden border-4 border-white ring-2 ring-primary-200">
                        {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                        )}
                    </div>
                    <div className="flex-1 pt-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                            {store.is_verified && (
                                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{store.store_type} store</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                    <div className="bg-surface-50 rounded-2xl py-3">
                        <p className="text-lg font-bold text-gray-900">{products.length}</p>
                        <p className="text-[11px] text-gray-500 font-medium">Products</p>
                    </div>
                    <div className="bg-surface-50 rounded-2xl py-3">
                        <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                            <svg className="w-4 h-4 text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            {store.rating?.toFixed(1) || '0.0'}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">Rating</p>
                    </div>
                    <div className="bg-surface-50 rounded-2xl py-3">
                        <p className="text-lg font-bold text-gray-900">{store.total_orders || 0}</p>
                        <p className="text-[11px] text-gray-500 font-medium">Orders</p>
                    </div>
                </div>

                {store.description && <p className="text-gray-600 text-sm mt-4 leading-relaxed">{store.description}</p>}

                <Link to={`/chat?seller=${store.owner_id}`} className="btn-primary w-full mt-4">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Contact Seller
                </Link>
            </div>

            {/* Products */}
            <div className="p-4">
                <h2 className="section-title mb-4">Products ({products.length})</h2>
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-3 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <p className="text-gray-400 font-medium text-sm">No products yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}
