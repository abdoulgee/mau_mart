import { create } from 'zustand'

const useUIStore = create((set) => ({
    // Toast notifications
    toasts: [],
    addToast: (toast) => {
        const id = Date.now()
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }))
        // Auto remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }))
        }, toast.duration || 4000)
        return id
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }))
    },

    // Modal state
    modals: {},
    openModal: (modalId, data = null) => {
        set((state) => ({
            modals: { ...state.modals, [modalId]: { isOpen: true, data } },
        }))
    },
    closeModal: (modalId) => {
        set((state) => ({
            modals: { ...state.modals, [modalId]: { isOpen: false, data: null } },
        }))
    },
    getModalState: (modalId) => {
        const { modals } = useUIStore.getState()
        return modals[modalId] || { isOpen: false, data: null }
    },

    // Global loading state
    isPageLoading: false,
    setPageLoading: (loading) => set({ isPageLoading: loading }),

    // Network status
    isOnline: navigator.onLine,
    setOnline: (online) => set({ isOnline: online }),

    // Search state
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Bottom nav visibility (for hiding during scroll)
    bottomNavVisible: true,
    setBottomNavVisible: (visible) => set({ bottomNavVisible: visible }),
}))

// Listen for online/offline events
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useUIStore.getState().setOnline(true)
        useUIStore.getState().addToast({
            type: 'success',
            message: 'You are back online!',
        })
    })

    window.addEventListener('offline', () => {
        useUIStore.getState().setOnline(false)
        useUIStore.getState().addToast({
            type: 'warning',
            message: 'You are offline. Some features may not work.',
            duration: 6000,
        })
    })
}

export default useUIStore
