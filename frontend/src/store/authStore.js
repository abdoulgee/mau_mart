import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            pendingVerificationEmail: null,

            // Set user data after login
            setAuth: (user, accessToken, refreshToken) => {
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    error: null,
                })
                api.setAuthToken(accessToken)
            },

            // Update user profile
            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData },
                }))
            },

            // Set pending verification email for OTP flow
            setPendingVerification: (email) => {
                set({ pendingVerificationEmail: email })
            },

            // Clear pending verification
            clearPendingVerification: () => {
                set({ pendingVerificationEmail: null })
            },

            // Login action
            login: async (credentials) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/api/v1/auth/login', credentials)
                    const { user, access_token, refresh_token } = response.data
                    get().setAuth(user, access_token, refresh_token)
                    return { success: true, user }
                } catch (error) {
                    const message = error.response?.data?.message || 'Login failed'
                    set({ error: message, isLoading: false })
                    return { success: false, error: message }
                } finally {
                    set({ isLoading: false })
                }
            },

            // Register action
            register: async (userData) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/api/v1/auth/register', userData)
                    set({ pendingVerificationEmail: userData.email })
                    return { success: true, message: response.data.message }
                } catch (error) {
                    const message = error.response?.data?.message || 'Registration failed'
                    set({ error: message, isLoading: false })
                    return { success: false, error: message }
                } finally {
                    set({ isLoading: false })
                }
            },

            // Verify OTP
            verifyOtp: async (email, otp) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/api/v1/auth/verify-otp', { email, otp })
                    set({ pendingVerificationEmail: null })
                    return { success: true, message: response.data.message }
                } catch (error) {
                    const message = error.response?.data?.message || 'Verification failed'
                    set({ error: message, isLoading: false })
                    return { success: false, error: message }
                } finally {
                    set({ isLoading: false })
                }
            },

            // Resend OTP
            resendOtp: async (email) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/api/v1/auth/resend-otp', { email })
                    return { success: true, message: response.data.message }
                } catch (error) {
                    const message = error.response?.data?.message || 'Failed to resend OTP'
                    set({ error: message, isLoading: false })
                    return { success: false, error: message }
                } finally {
                    set({ isLoading: false })
                }
            },

            // Forgot password
            forgotPassword: async (email) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/api/v1/auth/forgot-password', { email })
                    set({ pendingVerificationEmail: email })
                    return { success: true, message: response.data.message }
                } catch (error) {
                    const message = error.response?.data?.message || 'Request failed'
                    set({ error: message, isLoading: false })
                    return { success: false, error: message }
                } finally {
                    set({ isLoading: false })
                }
            },

            // Reset password
            resetPassword: async (email, otp, newPassword) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await api.post('/api/v1/auth/reset-password', {
                        email,
                        otp,
                        new_password: newPassword,
                    })
                    set({ pendingVerificationEmail: null })
                    return { success: true, message: response.data.message }
                } catch (error) {
                    const message = error.response?.data?.message || 'Password reset failed'
                    set({ error: message, isLoading: false })
                    return { success: false, error: message }
                } finally {
                    set({ isLoading: false })
                }
            },

            // Refresh token
            refreshAccessToken: async () => {
                const { refreshToken } = get()
                if (!refreshToken) return false

                try {
                    // Send refresh token in Authorization header as required by Flask-JWT-Extended
                    const response = await api.post('/api/v1/auth/refresh', {}, {
                        headers: {
                            'Authorization': `Bearer ${refreshToken}`
                        }
                    })
                    const { access_token } = response.data
                    set({
                        accessToken: access_token,
                        // Keep the same refresh token
                    })
                    api.setAuthToken(access_token)
                    return true
                } catch (error) {
                    get().logout()
                    return false
                }
            },

            // Logout
            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    error: null,
                    pendingVerificationEmail: null,
                })
                api.setAuthToken(null)
            },

            // Refresh user profile data
            fetchProfile: async () => {
                try {
                    const response = await api.get('/api/v1/users/profile')
                    const { user } = response.data
                    set({ user })
                    return { success: true, user }
                } catch (error) {
                    console.error('Failed to fetch profile:', error)
                    return { success: false, error }
                }
            },

            // Clear error
            clearError: () => {
                set({ error: null })
            },

            // Check if user has a specific role
            hasRole: (role) => {
                const { user } = get()
                if (!user) return false
                if (role === 'admin') return user.role === 'admin' || user.role === 'super_admin' || user.role === 'support_admin'
                if (role === 'seller') return user.is_seller || user.role === 'admin' || user.role === 'super_admin' || user.role === 'support_admin'
                return true
            },
        }),
        {
            name: 'maumart-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)

export default useAuthStore
