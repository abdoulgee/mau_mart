import axios from 'axios'
import { API_URL } from '../config'

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
})

// The auth store plugs in here (see store/authStore.js) so tokens have one source of truth
let auth = {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    onRefreshed: () => {},
    onAuthFailed: () => {},
}

api.configureAuth = (handlers) => {
    auth = { ...auth, ...handlers }
}

api.interceptors.request.use((config) => {
    const token = auth.getAccessToken()
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Share one refresh between requests that fail at the same time
let refreshPromise = null

async function refreshAccessToken() {
    const refreshToken = auth.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
    })
    const { access_token } = response.data
    auth.onRefreshed(access_token)
    return access_token
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config
        const isAuthCall = original?.url?.includes('/api/v1/auth/')

        if (error.response?.status === 401 && original && !original._retry && !isAuthCall && auth.getRefreshToken()) {
            original._retry = true
            try {
                refreshPromise = refreshPromise || refreshAccessToken()
                const token = await refreshPromise
                original.headers.Authorization = `Bearer ${token}`
                return api(original)
            } catch (refreshError) {
                auth.onAuthFailed()
                // Session is over; public reads still work without a token
                if (original.method === 'get') {
                    delete original.headers.Authorization
                    return api(original)
                }
                return Promise.reject(error)
            } finally {
                refreshPromise = null
            }
        }

        return Promise.reject(error)
    }
)

// Pull a readable message out of an API error
export const errorMessage = (error, fallback = 'Something went wrong') =>
    error?.response?.data?.message || fallback

export default api
