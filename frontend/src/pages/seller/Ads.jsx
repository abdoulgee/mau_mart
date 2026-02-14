import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

const placementLabels = {
    home_banner: { icon: '🏠', label: 'Home Banner', desc: 'Large banner on home page' },
    category_sidebar: { icon: '📂', label: 'Category Sidebar', desc: 'Sidebar in category pages' },
    product_interstitial: { icon: '📦', label: 'Product Page', desc: 'Between product listings' }
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600'
}

export default function SellerAds() {
    const [placements, setPlacements] = useState({})
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        placement: 'home_banner',
        image_url: '',
        link_url: '',
        payment_reference: ''
    })
    const [imageFile, setImageFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [placementsRes, requestsRes] = await Promise.all([
                api.get('/api/v1/subscriptions/ads/placements'),
                api.get('/api/v1/subscriptions/ads/my-requests')
            ])
            setPlacements(placementsRes.data.placements)
            setRequests(requestsRes.data.requests || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load data' })
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            addToast({ type: 'error', message: 'Image must be less than 2MB' })
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await api.post('/api/v1/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setForm({ ...form, image_url: res.data.url })
            setImageFile(URL.createObjectURL(file))
            addToast({ type: 'success', message: 'Image uploaded' })
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to upload image' })
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.image_url || !form.payment_reference) {
            addToast({ type: 'error', message: 'Please upload an image and enter payment reference' })
            return
        }

        setSubmitting(true)
        try {
            await api.post('/api/v1/subscriptions/ads/request', form)
            addToast({ type: 'success', message: 'Ad request submitted!' })
            setShowForm(false)
            setForm({ placement: 'home_banner', image_url: '', link_url: '', payment_reference: '' })
            setImageFile(null)
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

    const selectedPlacement = placements[form.placement]

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
                    <h1 className="text-lg font-semibold">Ad Placements</h1>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary text-sm py-2 px-4"
                >
                    + New Ad
                </button>
            </div>

            {/* Pricing Cards */}
            <div className="p-4">
                <h2 className="text-sm font-medium text-gray-500 mb-3">AD PLACEMENTS</h2>
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(placements).map(([key, placement]) => (
                        <div
                            key={key}
                            className="p-3 bg-white rounded-xl border border-gray-100 text-center"
                        >
                            <span className="text-2xl">{placementLabels[key]?.icon}</span>
                            <p className="text-xs text-gray-500 mt-1">{placementLabels[key]?.label}</p>
                            <p className="text-sm font-bold text-primary-600">₦{placement.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{placement.duration_days} days</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Requests */}
            <div className="px-4">
                <h2 className="text-sm font-medium text-gray-500 mb-3">MY AD REQUESTS</h2>

                {requests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <span className="text-4xl block mb-4">📢</span>
                        <p>No ad requests yet</p>
                        <p className="text-sm">Advertise your store on the platform</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(request => (
                            <div key={request.id} className="p-4 bg-white rounded-2xl border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{placementLabels[request.placement]?.icon}</span>
                                        <span className="text-sm font-medium">
                                            {placementLabels[request.placement]?.label}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                </div>

                                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                                    <img
                                        src={request.image_url}
                                        alt="Ad"
                                        className="w-full h-24 object-cover"
                                    />
                                </div>

                                <div className="flex justify-between mt-3 text-xs text-gray-500">
                                    <span>₦{request.amount_paid?.toLocaleString()}</span>
                                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                </div>

                                {request.status === 'approved' && request.expires_at && (
                                    <p className="text-xs text-green-600 mt-2">
                                        Expires: {new Date(request.expires_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowForm(false)}>
                    <div
                        className="w-full bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Request Ad Placement</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 text-gray-400">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Placement Type
                                </label>
                                <div className="space-y-2">
                                    {Object.entries(placementLabels).map(([key, info]) => (
                                        <label
                                            key={key}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${form.placement === key ? 'border-primary-500 bg-primary-50' : 'border-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="placement"
                                                value={key}
                                                checked={form.placement === key}
                                                onChange={e => setForm({ ...form, placement: e.target.value })}
                                                className="hidden"
                                            />
                                            <span className="text-2xl">{info.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-medium">{info.label}</p>
                                                <p className="text-sm text-gray-500">{info.desc}</p>
                                            </div>
                                            <span className="font-bold text-primary-600">
                                                ₦{placements[key]?.price?.toLocaleString()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Banner Image
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                                    {imageFile ? (
                                        <div className="relative">
                                            <img src={imageFile} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setForm({ ...form, image_url: '' }) }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="py-4">
                                                {uploading ? (
                                                    <span className="text-gray-500">Uploading...</span>
                                                ) : (
                                                    <>
                                                        <span className="text-3xl block mb-2">📷</span>
                                                        <span className="text-sm text-primary-600">Click to upload banner</span>
                                                        <p className="text-xs text-gray-400 mt-1">Recommended: 1200x300px</p>
                                                    </>
                                                )}
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link URL (optional)
                                </label>
                                <input
                                    type="url"
                                    value={form.link_url}
                                    onChange={e => setForm({ ...form, link_url: e.target.value })}
                                    placeholder="https://example.com"
                                    className="input"
                                />
                            </div>

                            <div className="p-4 bg-yellow-50 rounded-xl">
                                <p className="text-sm text-yellow-800">
                                    <strong>Payment Required:</strong> Transfer ₦{selectedPlacement?.price?.toLocaleString()} to:
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
                                disabled={submitting || !form.image_url}
                                className="btn-primary w-full disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Ad Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
