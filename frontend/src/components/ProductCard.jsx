import { Link } from 'react-router-dom'
import { ImageOff, MapPin } from 'lucide-react'
import { Badge } from './ui/Feedback'
import { SkeletonProductCard } from './ui/Skeleton'
import getImageUrl from '../utils/imageUrl'
import { formatPrice, timeAgo } from '../utils/format'
import cn from '../utils/cn'

export default function ProductCard({ product }) {
    const image = product.media?.[0]?.url

    return (
        <Link to={`/product/${product.id}`} className="group block rounded-lg focus-visible:ring-offset-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface-muted">
                {image ? (
                    <img
                        src={getImageUrl(image)}
                        alt=""
                        loading="lazy"
                        className={cn('h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]', product.is_sold && 'opacity-60 grayscale')}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-fg-subtle"><ImageOff size={28} aria-hidden /></div>
                )}
                {product.is_sold && <Badge className="absolute left-2 top-2 bg-fg text-surface">Sold</Badge>}
            </div>
            <div className="mt-2.5 space-y-0.5">
                <p className="text-sm font-semibold text-fg tabular">{formatPrice(product.price)}</p>
                <h3 className="line-clamp-2 text-sm text-fg-muted group-hover:text-fg">{product.title}</h3>
                <p className="flex items-center gap-1 text-xs text-fg-subtle">
                    {product.location && <><MapPin size={12} aria-hidden className="shrink-0" /><span className="truncate">{product.location}</span><span aria-hidden>·</span></>}
                    <span className="shrink-0">{timeAgo(product.created_at)}</span>
                </p>
            </div>
        </Link>
    )
}

export function ProductGrid({ children, className }) {
    return <div className={cn('grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', className)}>{children}</div>
}

export function ProductGridSkeleton({ count = 8 }) {
    return (
        <ProductGrid>
            {Array.from({ length: count }).map((_, i) => <SkeletonProductCard key={i} />)}
        </ProductGrid>
    )
}
