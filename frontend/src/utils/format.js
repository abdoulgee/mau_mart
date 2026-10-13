export const formatPrice = (price) => `₦${Number(price || 0).toLocaleString()}`

export const CONDITIONS = {
    new: 'New',
    like_new: 'Like new',
    used: 'Used',
}

export function timeAgo(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`) // API times are UTC
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function messageTime(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`)
    return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

// wa.me link that opens WhatsApp with a ready-made question about the listing
export function whatsappLink(number, product) {
    const url = `${window.location.origin}/product/${product.id}`
    const text = `Hi! I saw your listing "${product.title}" (${formatPrice(product.price)}) on MAU MART. Is it still available?\n${url}`
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(' ')
