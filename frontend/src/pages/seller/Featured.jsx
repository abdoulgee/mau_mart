import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

const listingTypeLabels = {
    home_featured: { icon: '🏠', label: 'Home Page Featured', desc: 'Top visibility on home page' },
    category_top: { icon: '📂', label: 'Category Top', desc: 'First in category results' },
    search_boost: { icon: '🔍', label: 'Search Boost', desc: 'Prioritized in search' }
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600'
}

export default function SellerFeatured() {
    const [prices, setPrices] = useState({})
    const [products, setProducts] = useState([])
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        product_id: '',
        listing_type: 'home_featured',
        payment_reference: ''
    })
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [pricesRes, productsRes, listingsRes] = await Promise.all([
                api.get('/api/v1/subscriptions/featured/prices'),
                api.get('/api/v1/products/my-products'),
                api.get('/api/v1/subscriptions/featured/my-listings')
            ])
            setPrices(pricesRes.data.prices)
            setProducts(productsRes.data.products || [])
            setListings(listingsRes.data.listings || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load data' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.product_id || !form.payment_reference) {
            addToast({ type: 'error', message: 'Please fill all fields' })
            return
        }

        setSubmitting(true)
        try {
            await api.post('/api/v1/subscriptions/featured/request', form)
            addToast({ type: 'success', message: 'Featured listing request submitted!' })
            setShowForm(false)
            setForm({ product_id: '', listing_type: 'home_featured', payment_reference: '' })
            fetchData()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Request failed' })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50 p-4">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
            </div>
        )
    }

    const selectedPrice = prices[form.listing_type]

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <Link to="/seller/subscription" className="p-2 -ml-2 text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-lg font-semibold">Featured Listings</h1>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary text-sm py-2 px-4"
                >
                    + New Request
                </button>
            </div>

            {/* Pricing Cards */}
            <div className="p-4">
                <h2 className="text-sm font-medium text-gray-500 mb-3">PRICING OPTIONS</h2>
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(prices).map(([key, price]) => (
                        <div
                            key={key}
                            className="p-3 bg-white rounded-xl border border-gray-100 text-center"
                        >
                            <span className="text-2xl">{listingTypeLabels[key]?.icon}</span>
                            <p className="text-xs text-gray-500 mt-1">{listingTypeLabels[key]?.label}</p>
                            <p className="text-sm font-bold text-primary-600">₦{price.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{price.duration_days} days</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Listings */}
            <div className="px-4">
                <h2 className="text-sm font-medium text-gray-500 mb-3">MY REQUESTS</h2>

                {listings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <span className="text-4xl block mb-4">⭐</span>
                        <p>No featured listing requests yet</p>
                        <p className="text-sm">Boost your products with featured listings</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {listings.map(listing => (
                            <div key={listing.id} className="p-4 bg-white rounded-2xl border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{listingTypeLabels[listing.listing_type]?.icon}</span>
                                        <span className="text-sm font-medium">
                                            {listingTypeLabels[listing.listing_type]?.label}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[listing.status]}`}>
                                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                    </span>
                                </div>

                                {listing.product && (
                                    <div className="flex items-center gap-3 p-2 bg-surface-50 rounded-lg">
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                                            {listing.product.media?.[0]?.url ? (
                                                <img src={listing.product.media[0].url} alt="" className="w-full h-full object-cover" />
                                            ) : '📦'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{listing.product.title}</p>
                                            <p className="text-xs text-primary-600">₦{listing.product.price?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between mt-3 text-xs text-gray-500">
                                    <span>Amount: ₦{listing.amount_paid?.toLocaleString()}</span>
                                    <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowForm(false)}>
                    <div
                        className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Request Featured Listing</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 text-gray-400">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Product
                                </label>
                                <select
                                    value={form.product_id}
                                    onChange={e => setForm({ ...form, product_id: e.target.value })}
                                    className="input"
                                    required
                                >
                                    <option value="">Choose a product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Listing Type
                                </label>
                                <div className="space-y-2">
                                    {Object.entries(listingTypeLabels).map(([key, info]) => (
                                        <label
                                            key={key}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${form.listing_type === key ? 'border-primary-500 bg-primary-50' : 'border-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="listing_type"
                                                value={key}
                                                checked={form.listing_type === key}
                                                onChange={e => setForm({ ...form, listing_type: e.target.value })}
                                                className="hidden"
                                            />
                                            <span className="text-2xl">{info.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-medium">{info.label}</p>
                                                <p className="text-sm text-gray-500">{info.desc}</p>
                                            </div>
                                            <span className="font-bold text-primary-600">
                                                ₦{prices[key]?.price?.toLocaleString()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-yellow-50 rounded-xl">
                                <p className="text-sm text-yellow-800">
                                    <strong>Payment Required:</strong> Transfer ₦{selectedPrice?.price?.toLocaleString()} to:
                                </p>
                                <p className="text-sm font-medium mt-2">Bank: GTBank<br />Account: 0123456789<br />Name: MAU MART</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Reference
                                </label>
                                <input
                                    type="text"
                                    value={form.payment_reference}
                                    onChange={e => setForm({ ...form, payment_reference: e.target.value })}
                                    placeholder="Enter transaction reference"
                                    className="input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-primary w-full disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
