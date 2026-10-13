import cn from '../../utils/cn'

export function Skeleton({ className }) {
    return <div className={cn('skeleton', className)} aria-hidden />
}

export function SkeletonText({ lines = 2, className }) {
    return (
        <div className={cn('space-y-2', className)} aria-hidden>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="skeleton h-3.5" style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }} />
            ))}
        </div>
    )
}

export function SkeletonProductCard() {
    return (
        <div aria-hidden>
            <div className="skeleton aspect-square rounded-lg" />
            <div className="mt-2.5 space-y-1.5">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-3.5 w-full" />
                <div className="skeleton h-3 w-24" />
            </div>
        </div>
    )
}

export function SkeletonRows({ rows = 4, avatar = false }) {
    return (
        <div className="divide-y divide-line" aria-hidden>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                    {avatar && <div className="skeleton h-10 w-10 shrink-0 rounded-full" />}
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-1/3" />
                        <div className="skeleton h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/** Screen-reader announcement for skeleton regions */
export function LoadingRegion({ loading, label = 'Loading', children }) {
    return (
        <div aria-busy={loading} aria-live="polite">
            {loading && <span className="sr-only">{label}</span>}
            {children}
        </div>
    )
}
