import { useState } from 'react'
import { Header } from '../components/navigation/Header'
import useSettingsStore from '../store/settingsStore'

const placementLabels = {
    home_banner: 'Home Banner',
    search_results: 'Search Results',
    bottom_cta: 'Bottom CTA'
}

export default function Advertise() {
    const [selectedPlacement, setSelectedPlacement] = useState('home_banner')
    const { settings } = useSettingsStore()

    const adPrice = settings?.ad_price_per_24h || 2000
    const adminWhatsapp = settings?.admin_whatsapp || '+2349000000000'

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

    return (
        <div className="min-h-screen bg-surface-50 pb-24">
            <Header title="Advertise" showBack />

            <div className="p-4 space-y-5 max-w-2xl mx-auto">
                {/* Hero */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Advertise on MAU MART</h1>
                            <p className="text-white/60 text-sm">Reach thousands of campus buyers</p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-extrabold text-primary-400">₦{adPrice.toLocaleString()}</span>
                        <span className="text-white/50 text-sm">/ 24 hours</span>
                    </div>
                    <p className="text-white/50 text-xs mt-1">Banner ads visible across the entire platform</p>
                </div>

                {/* Choose Placement */}
                <div className="card space-y-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        Choose Placement
                    </h2>

                    <div className="space-y-2">
                        {Object.entries(placementLabels).map(([key, label]) => (
                            <label
                                key={key}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlacement === key
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
                                        {key === 'home_banner' ? 'Large banner on the home page — maximum visibility' :
                                            key === 'search_results' ? 'Appears in search results — targeted reach' :
                                                'Sticky banner at the bottom — high engagement'}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div className="card space-y-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        How it works
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Choose your placement</p>
                                <p className="text-xs text-gray-400">Select where you want your ad to appear</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Send request via WhatsApp</p>
                                <p className="text-xs text-gray-400">We'll open a chat with the admin for you</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Send your banner & make payment</p>
                                <p className="text-xs text-gray-400">Transfer ₦{adPrice.toLocaleString()} per 24 hours</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Your ad goes live!</p>
                                <p className="text-xs text-gray-400">Admin activates your ad placement</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Send Request Button */}
                <button
                    onClick={handleWhatsAppRequest}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-[#25D366] hover:bg-[#1fb855] transition-colors shadow-lg active:scale-[0.98]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Send Ad Request via WhatsApp
                </button>
            </div>
        </div>
    )
}
