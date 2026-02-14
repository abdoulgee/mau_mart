import { create } from 'zustand'
import api from '../services/api'

const useProductStore = create((set, get) => ({
    // Products list
    products: [],
    featuredProducts: [],
    recentProducts: [],
    categoryProducts: [],
    searchResults: [],

    // Single product
    currentProduct: null,

    // Pagination
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: true,
    },

    // Loading states
    isLoading: false,
    isLoadingMore: false,
    error: null,

    // Fetch featured products
    fetchFeaturedProducts: async () => {
        try {
            const response = await api.get('/api/v1/products/featured')
            set({ featuredProducts: response.data.products || [] })
            return response.data.products
        } catch (error) {
            console.error('Failed to fetch featured products:', error)
            return []
        }
    },

    // Fetch recent products
    fetchRecentProducts: async (limit = 10) => {
        try {
            const response = await api.get(`/api/v1/products/recent?limit=${limit}`)
            set({ recentProducts: response.data.products || [] })
            return response.data.products
        } catch (error) {
            console.error('Failed to fetch recent products:', error)
            return []
        }
    },

    // Fetch products by category
    fetchCategoryProducts: async (categoryId, page = 1, filters = {}) => {
        const isFirstPage = page === 1
        set({
            isLoading: isFirstPage,
            isLoadingMore: !isFirstPage,
            error: null
        })

        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...filters,
            })
            const response = await api.get(`/api/v1/categories/${categoryId}/products?${params}`)
            const { products, pagination } = response.data

            set((state) => ({
                categoryProducts: isFirstPage ? products : [...state.categoryProducts, ...products],
                pagination: {
                    ...pagination,
                    hasMore: products.length === 20,
                },
                isLoading: false,
                isLoadingMore: false,
            }))

            return products
        } catch (error) {
            set({ error: error.message, isLoading: false, isLoadingMore: false })
            return []
        }
    },

    // Search products
    searchProducts: async (query, page = 1) => {
        if (!query.trim()) {
            set({ searchResults: [] })
            return []
        }

        const isFirstPage = page === 1
        set({
            isLoading: isFirstPage,
            isLoadingMore: !isFirstPage,
            error: null
        })

        try {
            const response = await api.get(`/api/v1/products/search?q=${encodeURIComponent(query)}&page=${page}`)
            const { products, pagination } = response.data

            set((state) => ({
                searchResults: isFirstPage ? products : [...state.searchResults, ...products],
                pagination: {
                    ...pagination,
                    hasMore: products.length === 20,
                },
                isLoading: false,
                isLoadingMore: false,
            }))

            return products
        } catch (error) {
            set({ error: error.message, isLoading: false, isLoadingMore: false })
            return []
        }
    },

    // Fetch single product
    fetchProduct: async (productId) => {
        set({ isLoading: true, error: null, currentProduct: null })

        try {
            const response = await api.get(`/api/v1/products/${productId}`)
            set({ currentProduct: response.data.product, isLoading: false })
            return response.data.product
        } catch (error) {
            set({ error: error.message, isLoading: false })
            return null
        }
    },

    // Create product
    createProduct: async (productData) => {
        set({ isLoading: true, error: null })

        try {
            const formData = new FormData()

            // Append regular fields
            Object.keys(productData).forEach((key) => {
                if (key === 'media') {
                    productData.media.forEach((file) => {
                        formData.append('media', file)
                    })
                } else {
                    formData.append(key, productData[key])
                }
            })

            const response = await api.post('/api/v1/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            set({ isLoading: false })
            return { success: true, product: response.data.product }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create product'
            set({ error: message, isLoading: false })
            return { success: false, error: message }
        }
    },

    // Update product
    updateProduct: async (productId, productData) => {
        set({ isLoading: true, error: null })

        try {
            const formData = new FormData()

            Object.keys(productData).forEach((key) => {
                if (key === 'media' && Array.isArray(productData.media)) {
                    productData.media.forEach((file) => {
                        if (file instanceof File) {
                            formData.append('media', file)
                        }
                    })
                } else if (key === 'existing_media') {
                    formData.append('existing_media', JSON.stringify(productData.existing_media))
                } else {
                    formData.append(key, productData[key])
                }
            })

            const response = await api.put(`/api/v1/products/${productId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            set({ isLoading: false, currentProduct: response.data.product })
            return { success: true, product: response.data.product }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update product'
            set({ error: message, isLoading: false })
            return { success: false, error: message }
        }
    },

    // Delete product
    deleteProduct: async (productId) => {
        try {
            await api.delete(`/api/v1/products/${productId}`)
            set((state) => ({
                products: state.products.filter((p) => p.id !== productId),
            }))
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    // Clear states
    clearCategoryProducts: () => set({ categoryProducts: [], pagination: { page: 1, limit: 20, total: 0, hasMore: true } }),
    clearSearchResults: () => set({ searchResults: [] }),
    clearCurrentProduct: () => set({ currentProduct: null }),
    clearError: () => set({ error: null }),
}))

export default useProductStore
