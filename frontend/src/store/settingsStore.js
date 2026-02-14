import { create } from 'zustand'
import api from '../services/api'

const useSettingsStore = create((set, get) => ({
    settings: {
        site_name: 'MAU MART',
        site_tagline: 'Campus Marketplace',
        support_email: '',
        support_phone: '',
        currency: 'NGN',
        currency_symbol: '₦',
        transaction_fee_percent: 0,
        min_order_amount: 0,
        max_product_images: 4,
        require_email_verification: true,
        allow_guest_browsing: true,
        maintenance_mode: false,
        terms_url: '',
        privacy_url: '',
    },
    loaded: false,

    fetchSettings: async () => {
        try {
            const response = await api.get('/api/v1/settings')
            if (response.data.settings && Object.keys(response.data.settings).length > 0) {
                set(state => ({
                    settings: { ...state.settings, ...response.data.settings },
                    loaded: true,
                }))
            } else {
                set({ loaded: true })
            }
        } catch {
            set({ loaded: true })
        }
    },

    // Helper: format price with currency symbol
    formatPrice: (price) => {
        const { settings } = get()
        return `${settings.currency_symbol}${Number(price).toLocaleString()}`
    },
}))

export default useSettingsStore
