import { create } from 'zustand'
import api from '../services/api'

const useCategoryStore = create((set, get) => ({
    categories: [],
    loading: false,
    loaded: false,

    fetchCategories: async (force = false) => {
        if ((get().loaded || get().loading) && !force) return
        set({ loading: true })
        try {
            const { data } = await api.get('/api/v1/categories')
            set({ categories: data.categories || [], loaded: true })
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        } finally {
            set({ loading: false })
        }
    },
}))

export default useCategoryStore
