import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { errorMessage } from '../services/api'

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

            setAuth: (user, accessToken, refreshToken) => {
                set({ user, accessToken, refreshToken, isAuthenticated: true })
            },

            updateUser: (userData) => {
                set((state) => ({ user: { ...state.user, ...userData } }))
            },

            setPendingVerification: (email) => set({ pendingVerificationEmail: email }),

            // Wraps a request with the loading flag and a { success, error } result
            _run: async (request) => {
                set({ isLoading: true, error: null })
                try {
                    return { success: true, ...(await request()) }
                } catch (error) {
                    const message = errorMessage(error)
                    set({ error: message })
                    return { success: false, error: message, data: error.response?.data }
                } finally {
                    set({ isLoading: false })
                }
            },

            login: async (credentials) => {
                const result = await get()._run(async () => {
                    const { data } = await api.post('/api/v1/auth/login', credentials)
                    get().setAuth(data.user, data.access_token, data.refresh_token)
                    return { user: data.user }
                })
                if (!result.success && result.data?.needs_verification) {
                    const email = result.data.email || credentials.email
                    set({ pendingVerificationEmail: email })
                    return { ...result, needsVerification: true, email }
                }
                return result
            },

            register: (userData) => get()._run(async () => {
                const { data } = await api.post('/api/v1/auth/register', userData)
                set({ pendingVerificationEmail: data.auto_verified ? null : userData.email })
                return { message: data.message, autoVerified: !!data.auto_verified }
            }),

            verifyOtp: (email, otp) => get()._run(async () => {
                const { data } = await api.post('/api/v1/auth/verify-otp', { email, otp })
                set({ pendingVerificationEmail: null })
                return { message: data.message }
            }),

            resendOtp: (email) => get()._run(async () => {
                const { data } = await api.post('/api/v1/auth/resend-otp', { email })
                return { message: data.message }
            }),

            forgotPassword: (email) => get()._run(async () => {
                const { data } = await api.post('/api/v1/auth/forgot-password', { email })
                return { message: data.message }
            }),

            resetPassword: (email, otp, newPassword) => get()._run(async () => {
                const { data } = await api.post('/api/v1/auth/reset-password', { email, otp, new_password: newPassword })
                return { message: data.message }
            }),

            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    pendingVerificationEmail: null,
                })
            },

            // Re-sync the stored user with the server (role changes, suspension, etc.)
            fetchProfile: async () => {
                try {
                    const { data } = await api.get('/api/v1/users/profile')
                    set({ user: data.user })
                    return data.user
                } catch {
                    return null
                }
            },

            clearError: () => set({ error: null }),

            isAdmin: () => ['admin', 'super_admin'].includes(get().user?.role),
            isSuperAdmin: () => get().user?.role === 'super_admin',
        }),
        {
            name: 'maumart-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                pendingVerificationEmail: state.pendingVerificationEmail,
            }),
        }
    )
)

api.configureAuth({
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onRefreshed: (accessToken) => useAuthStore.setState({ accessToken }),
    onAuthFailed: () => useAuthStore.getState().logout(),
})

export default useAuthStore
