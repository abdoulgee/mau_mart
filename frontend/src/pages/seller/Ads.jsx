import { useState, useEffect } from 'react'
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

const placementLabels = {
    home_banner: 'Home Banner',
    search_results: 'Search Results',
    bottom_cta: 'Bottom CTA'
}

export default function SellerAds() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPlacement, setSelectedPlacement] = useState('home_banner')
    const { addToast } = useUIStore()
    const { settings } = useSettingsStore()

    // Get monetization settings from admin
    const adPrice = settings?.ad_price_per_24h || 2000
    const adminWhatsapp = settings?.admin_whatsapp || '+2349000000000'

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await api.get('/api/v1/subscriptions/ads/my-requests')
            setRequests(res.data.requests || [])
        } catch (error) {
            // Endpoint may not exist yet or no requests — show empty state
            console.error('Ads page load error:', error)
            setRequests([])
        } finally {
            setLoading(false)
        }
    }

    const handleWhatsAppRequest = () => {
        const placementName = placementLabels[selectedPlacement] || selectedPlacement

        const message = encodeURIComponent(
            `Hi, I'd like to request an *Ad Placement* on MAU MART.\n\n` +
            `📍 Placement: ${placementName}\n` +
            `💰 Rate: ₦${adPrice.toLocaleString()}/24hrs\n\n` +
            `Please advise on payment details and banner requirements. Thank you!`
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
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Ad Placements</h1>
                        <p className="text-white/60 text-sm">Advertise on the platform</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-primary-400">₦{adPrice.toLocaleString()}</span>
                    <span className="text-white/50 text-sm">/ 24 hours</span>
                </div>
                <p className="text-white/50 text-xs mt-1">Banner ads across the platform</p>
            </div>

            {/* Request Section */}
            <div className="card space-y-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Request Ad Placement
                </h2>

                {/* Select Placement */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placement Type
                    </label>
                    <div className="space-y-2">
                        {Object.entries(placementLabels).map(([key, label]) => (
                            <label
                                key={key}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlacement === key
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-surface-200 hover:border-surface-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="placement"
                                    value={key}
                                    checked={selectedPlacement === key}
                                    onChange={e => setSelectedPlacement(e.target.value)}
                                    className="hidden"
                                />
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPlacement === key ? 'bg-primary-100' : 'bg-surface-100'}`}>
                                    <svg className={`w-5 h-5 ${selectedPlacement === key ? 'text-primary-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={
                                            key === 'home_banner' ? 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' :
                                                key === 'search_results' ? 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' :
                                                    'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5'
                                        } />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-gray-900">{label}</p>
                                    <p className="text-xs text-gray-400">
                                        {key === 'home_banner' ? 'Large banner on home page' :
                                            key === 'search_results' ? 'Appears in search results' :
                                                'Sticky banner at the bottom'}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div className="p-4 bg-surface-50 rounded-2xl space-y-3">
                    <p className="text-sm font-semibold text-gray-700">How it works:</p>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <p className="text-sm text-gray-600">Choose your ad placement type above</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <p className="text-sm text-gray-600">Click "Send Request" — opens WhatsApp with the admin</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <p className="text-sm text-gray-600">Send your banner image & make payment via transfer</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        <p className="text-sm text-gray-600">Admin activates your ad placement</p>
                    </div>
                </div>

                {/* Send Request Button */}
                <button
                    onClick={handleWhatsAppRequest}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-md"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Send Request via WhatsApp
                </button>
            </div>

            {/* My Ad Requests */}
            <div>
                <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">My Ad Requests</h2>

                {requests.length === 0 ? (
                    <div className="card text-center py-10">
                        <div className="w-16 h-16 mx-auto mb-3 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                        </div>
                        <p className="text-gray-500 text-sm">No ad requests yet</p>
                        <p className="text-gray-400 text-xs mt-1">Advertise your store on the platform</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(request => (
                            <div key={request.id} className="card">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {placementLabels[request.placement] || request.placement}
                                    </span>
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColors[request.status]}`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                </div>

                                {request.image_url && (
                                    <div className="relative rounded-xl overflow-hidden bg-surface-100">
                                        <img
                                            src={request.image_url}
                                            alt="Ad"
                                            className="w-full h-24 object-cover"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between mt-3 text-xs text-gray-400">
                                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                    {request.status === 'approved' && request.expires_at && (
                                        <span className="text-emerald-600 font-medium">Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
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
