import { API_URL } from '../config'

/**
 * Ensures a media URL is absolute.
 * Supabase URLs are already absolute; local uploads (/api/v1/uploads/...) get the API origin.
 */
export const getImageUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
    return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export default getImageUrl
