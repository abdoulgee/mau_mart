import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import useSettingsStore from '../../store/settingsStore'
import { Skeleton } from '../../components/ui/Skeleton'

const statusColors = {
    pending: 'bg-primary-100 text-primary-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-surface-200 text-gray-600'
}

export default function SellerFeatured() {
    const [products, setProducts] = useState([])
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const { addToast } = useUIStore()
    const { settings } = useSettingsStore()

    // Get monetization settings from admin
    const featuredPrice = settings?.featured_price_per_24h || 500
    const adminWhatsapp = settings?.admin_whatsapp || '+2349000000000'

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // First get the store, then its products
            const storeRes = await api.get('/api/v1/stores/my-store')
            const storeId = storeRes.data.store?.id

            const requests = []
            if (storeId) {
                requests.push(api.get(`/api/v1/stores/${storeId}/products`))
            } else {
                requests.push(Promise.resolve({ data: { products: [] } }))
            }

            // Featured listings - may fail if no listings yet, that's ok
            requests.push(
                api.get('/api/v1/subscriptions/featured/my-listings').catch(() => ({ data: { listings: [] } }))
            )

            const [productsRes, listingsRes] = await Promise.all(requests)
            setProducts(productsRes.data.products || [])
            setListings(listingsRes.data.listings || [])
        } catch (error) {
            console.error('Featured page load error:', error)
            addToast({ type: 'error', message: 'Failed to load products' })
        } finally {
            setLoading(false)
        }
    }

    const handleWhatsAppRequest = () => {
        if (!selectedProduct) {
            addToast({ type: 'info', message: 'Please select a product first' })
            return
        }

        const product = products.find(p => p.id === parseInt(selectedProduct))
        if (!product) return

        const message = encodeURIComponent(
            `Hi, I'd like to request a *Featured Listing* on MAU MART.\n\n` +
            `📦 Product: ${product.title}\n` +
            `💰 Price: ₦${product.price?.toLocaleString()}\n` +
            `🆔 Product ID: ${product.id}\n\n` +
            `Featured listing rate: ₦${featuredPrice.toLocaleString()}/24hrs\n\n` +
            `Please advise on payment details. Thank you!`
        )

        const whatsappUrl = `https://wa.me/${adminWhatsapp.replace(/[^0-9]/g, '')}?text=${message}`
        window.open(whatsappUrl, '_blank')
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48 mb-6" />
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-glow">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Featured Listings</h1>
                        <p className="text-white/80 text-sm">Boost your product visibility</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold">₦{featuredPrice.toLocaleString()}</span>
                    <span className="text-white/70 text-sm">/ 24 hours</span>
                </div>
                <p className="text-white/70 text-xs mt-1">Your product gets top placement on the home page</p>
            </div>

            {/* Request Section */}
            <div className="card space-y-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Request Featured Listing
                </h2>

                {/* Step 1: Select Product */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Product to Feature
                    </label>
                    {products.length > 0 ? (
                        <select
                            value={selectedProduct || ''}
                            onChange={e => setSelectedProduct(e.target.value)}
                            className="input"
                        >
                            <option value="">Choose a product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.title} — ₦{p.price?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm text-gray-400">No products available. <Link to="/seller/products/new" className="text-primary-500 font-medium hover:underline">Add a product first</Link></p>
                    )}
                </div>

                {/* Step 2: How it works */}
                <div className="p-4 bg-surface-50 rounded-2xl space-y-3">
                    <p className="text-sm font-semibold text-gray-700">How it works:</p>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <p className="text-sm text-gray-600">Select your product above</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <p className="text-sm text-gray-600">Click "Send Request" — opens WhatsApp with the admin</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <p className="text-sm text-gray-600">Make payment via transfer to the admin</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        <p className="text-sm text-gray-600">Admin activates your featured listing</p>
                    </div>
                </div>

                {/* Send Request Button */}
                <button
                    onClick={handleWhatsAppRequest}
                    disabled={!selectedProduct}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Send Request via WhatsApp
                </button>
            </div>

            {/* My Listings */}
            <div>
                <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">My Featured Listings</h2>

                {listings.length === 0 ? (
                    <div className="card text-center py-10">
                        <div className="w-16 h-16 mx-auto mb-3 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        </div>
                        <p className="text-gray-500 text-sm">No featured listings yet</p>
                        <p className="text-gray-400 text-xs mt-1">Request one above to boost your products</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {listings.map(listing => (
                            <div key={listing.id} className="card">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {listing.listing_type === 'home_featured' ? 'Home Featured' : listing.listing_type}
                                    </span>
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColors[listing.status]}`}>
                                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                    </span>
                                </div>

                                {listing.product && (
                                    <div className="flex items-center gap-3 p-2 bg-surface-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-xl bg-surface-200 overflow-hidden flex items-center justify-center">
                                            {listing.product.media?.[0]?.url ? (
                                                <img src={listing.product.media[0].url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{listing.product.title}</p>
                                            <p className="text-xs text-primary-600 font-bold">₦{listing.product.price?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between mt-3 text-xs text-gray-400">
                                    <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                                    {listing.status === 'approved' && listing.expires_at && (
                                        <span className="text-emerald-600 font-medium">Expires: {new Date(listing.expires_at).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
