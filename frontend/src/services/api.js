import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // First try the in-memory token
        let token = api.authToken

        // If not set, try to get from localStorage (fallback)
        if (!token) {
            try {
                const stored = localStorage.getItem('maumart-auth')
                if (stored) {
                    const { state } = JSON.parse(stored)
                    token = state?.accessToken
                    // Also set it in memory for future requests
                    if (token) {
                        api.authToken = token
                    }
                }
            } catch (e) {
                console.error('Failed to get token from storage:', e)
            }
        }

        console.log('[API Request]', config.method?.toUpperCase(), config.url, '- Token:', token ? token.substring(0, 20) + '...' : 'NONE')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // Try to refresh token
                const refreshToken = localStorage.getItem('maumart-auth')
                    ? JSON.parse(localStorage.getItem('maumart-auth')).state?.refreshToken
                    : null

                if (refreshToken) {
                    const response = await axios.post(`${api.defaults.baseURL}/api/v1/auth/refresh`, {}, {
                        headers: {
                            'Authorization': `Bearer ${refreshToken}`
                        }
                    })

                    const { access_token } = response.data
                    api.setAuthToken(access_token)

                    // Update stored token
                    const stored = JSON.parse(localStorage.getItem('maumart-auth'))
                    stored.state.accessToken = access_token
                    localStorage.setItem('maumart-auth', JSON.stringify(stored))

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${access_token}`
                    return api(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('maumart-auth')
                // window.location.href = '/login'
                console.error('Refresh token failed - Stopped redirect for debugging')
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

// Method to set auth token
api.setAuthToken = (token) => {
    api.authToken = token
}

// Initialize token from storage
const stored = localStorage.getItem('maumart-auth')
if (stored) {
    try {
        const { state } = JSON.parse(stored)
        if (state?.accessToken) {
            api.setAuthToken(state.accessToken)
        }
    } catch (e) {
        console.error('Failed to parse stored auth:', e)
    }
}

export default api
