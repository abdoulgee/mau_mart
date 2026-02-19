const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Ensures a media URL is absolute.
 * If it's already absolute (Supabase), returns it as is.
 * If it's relative (/api/v1/uploads/...), prepends VITE_API_URL.
 */
export const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
    const path = url.startsWith('/') ? url : `/${url}`

    return `${baseUrl}${path}`
}

export default getImageUrl
