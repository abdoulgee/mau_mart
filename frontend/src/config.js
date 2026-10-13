// Backend origin, e.g. https://maumart-api.onrender.com
// Tolerates a trailing slash or a trailing /api/v1 in VITE_API_URL.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/, '')
