// Skeleton Components for loading states

// Generic Skeleton component
export function Skeleton({ className = '', style = {}, children }) {
    return (
        <div className={`skeleton ${className}`} style={style}>
            {children}
        </div>
    )
}

export function SkeletonText({ className = '', lines = 1 }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton h-4"
                    style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
                />
            ))}
        </div>
    )
}

export function SkeletonAvatar({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    }

    return <div className={`skeleton rounded-full ${sizes[size]} ${className}`} />
}

export function SkeletonCard({ className = '' }) {
    return (
        <div className={`card p-4 ${className}`}>
            <div className="skeleton aspect-square rounded-xl mb-3" />
            <SkeletonText lines={2} />
            <div className="skeleton h-6 w-20 mt-2" />
        </div>
    )
}

export function SkeletonProductCard() {
    return (
        <div className="card overflow-hidden">
            <div className="skeleton aspect-square" />
            <div className="p-3 space-y-2">
                <SkeletonText lines={2} />
                <div className="skeleton h-5 w-24" />
                <div className="flex items-center gap-2 mt-2">
                    <SkeletonAvatar size="sm" />
                    <div className="skeleton h-3 w-20" />
                </div>
            </div>
        </div>
    )
}

// Alias for backwards compatibility
export const ProductCardSkeleton = SkeletonProductCard

export function SkeletonProductGrid({ count = 6 }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonProductCard key={i} />
            ))}
        </div>
    )
}

export function SkeletonChatItem() {
    return (
        <div className="flex items-center gap-3 p-4">
            <SkeletonAvatar size="lg" />
            <div className="flex-1">
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-48" />
            </div>
            <div className="skeleton h-3 w-12" />
        </div>
    )
}

export function SkeletonChatList({ count = 5 }) {
    return (
        <div className="divide-y divide-gray-100">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonChatItem key={i} />
            ))}
        </div>
    )
}

export function SkeletonBanner() {
    return <div className="skeleton aspect-[2.5/1] rounded-2xl" />
}

export function SkeletonCategoryGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <div className="skeleton w-14 h-14 rounded-2xl" />
                    <div className="skeleton h-3 w-12" />
                </div>
            ))}
        </div>
    )
}

export function SkeletonStoreCard() {
    return (
        <div className="card p-4 flex items-center gap-3">
            <SkeletonAvatar size="xl" />
            <div className="flex-1">
                <div className="skeleton h-5 w-32 mb-2" />
                <div className="skeleton h-3 w-48 mb-1" />
                <div className="skeleton h-3 w-24" />
            </div>
        </div>
    )
}

export function SkeletonOrderItem() {
    return (
        <div className="card p-4">
            <div className="flex items-start gap-3">
                <div className="skeleton w-20 h-20 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                    <div className="skeleton h-4 w-full mb-2" />
                    <div className="skeleton h-3 w-32 mb-2" />
                    <div className="skeleton h-5 w-20" />
                </div>
            </div>
        </div>
    )
}

export default {
    Skeleton,
    Text: SkeletonText,
    Avatar: SkeletonAvatar,
    Card: SkeletonCard,
    ProductCard: SkeletonProductCard,
    ProductGrid: SkeletonProductGrid,
    ChatItem: SkeletonChatItem,
    ChatList: SkeletonChatList,
    Banner: SkeletonBanner,
    CategoryGrid: SkeletonCategoryGrid,
    StoreCard: SkeletonStoreCard,
    OrderItem: SkeletonOrderItem,
}
