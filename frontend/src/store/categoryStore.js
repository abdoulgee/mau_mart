import { create } from 'zustand'
import api from '../services/api'
import { io } from 'socket.io-client'

const useCategoryStore = create((set, get) => ({
    categories: [],
    loading: false,
    error: null,
    socket: null,

    fetchCategories: async (isAdmin = false) => {
        set({ loading: true })
        try {
            const url = isAdmin ? '/api/v1/admin/categories' : '/api/v1/categories'
            const response = await api.get(url)
            set({ categories: response.data.categories || [], loading: false })
        } catch (error) {
            console.error('Failed to fetch categories:', error)
            set({ error: error.message, loading: false })
        }
    },

    connectSocket: () => {
        if (get().socket) return

        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const socket = io(socketUrl)

        socket.on('category_updated', (data) => {
            console.log('Category update received:', data)
            // Refresh with the current context (admin or public)
            // We don't know if the current user is admin here easily without extra state
            // but fetchCategories will use whatever the last call used if we are not careful.
            // Actually, the components will call fetchCategories(true/false) as needed.
            // For now, let's just refresh based on what's already in the store.
            // If the store was initialized with admin view, it stays admin view.
            get().fetchCategories(get().categories.length > 0 && window.location.pathname.startsWith('/admin'))
        })

        set({ socket })
    },

    disconnectSocket: () => {
        const { socket } = get()
        if (socket) {
            socket.disconnect()
            set({ socket: null })
        }
    }
}))

export default useCategoryStore
