import { create } from 'zustand'
import api from '../services/api'

const useSettingsStore = create((set, get) => ({
    settings: {
        site_name: 'MAU MART',
        site_tagline: 'Campus Marketplace',
        site_logo_url: '',
        support_email: '',
        admin_whatsapp: '',
        require_email_verification: true,
        allow_guest_browsing: true,
        maintenance_mode: false,
        hero_title: 'Buy and sell on campus',
        hero_message: "Post what you don't need, find what you do, and meet the seller in person. Chat in the app or on WhatsApp.",
        hero_image_url: '',
    },
    loaded: false,

    fetchSettings: async () => {
        try {
            const { data } = await api.get('/api/v1/settings')
            const merged = { ...get().settings, ...(data.settings || {}) }
            set({ settings: merged, loaded: true })
            // Headers read the logo and name from here before the store loads
            localStorage.setItem('app-settings', JSON.stringify(merged))
        } catch {
            set({ loaded: true })
        }
    },
}))

export default useSettingsStore
