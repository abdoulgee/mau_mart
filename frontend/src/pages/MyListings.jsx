import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, ImageOff, Package, Pencil, Plus, RotateCcw } from 'lucide-react'
import Page from '../components/navigation/Page'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { SkeletonRows } from '../components/ui/Skeleton'
import { LoadMore } from '../components/ui/Pagination'
import usePaginatedList from '../hooks/usePaginatedList'
import api, { errorMessage } from '../services/api'
import useUIStore from '../store/uiStore'
import getImageUrl from '../utils/imageUrl'
import { formatPrice, timeAgo } from '../utils/format'

export default function MyListings() {
    const [tab, setTab] = useState('available')
    const [pending, setPending] = useState(null)
    const { addToast } = useUIStore()
    const list = usePaginatedList('/api/v1/products/mine', { status: tab })

    const toggleSold = async (product) => {
        setPending(product.id)
        try {
            await api.post(`/api/v1/products/${product.id}/sold`, { is_sold: !product.is_sold })
            addToast({ type: 'success', message: product.is_sold ? `"${product.title}" is available again` : `"${product.title}" marked as sold` })
            list.setItems((items) => items.filter((p) => p.id !== product.id))
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error) })
        } finally {
            setPending(null)
        }
    }

    const newButton = <Button to="/sell" icon={Plus} size="sm">New listing</Button>

    return (
        <Page title="My listings" back actions={newButton}>
            <Tabs
                label="Listing status"
                value={tab}
                onChange={setTab}
                options={[{ value: 'available', label: 'Available' }, { value: 'sold', label: 'Sold' }]}
                className="mb-4"
            />

            <div className="rounded-lg border border-line bg-surface">
                {list.loading ? (
                    <SkeletonRows rows={4} />
                ) : list.error ? (
                    <ErrorState message="Your listings could not be loaded." onRetry={list.reload} />
                ) : list.items.length === 0 ? (
                    tab === 'available' ? (
                        <EmptyState icon={Package} title="You're not selling anything yet" message="Post your first item. It only takes a minute."
                            action={<Button to="/sell" icon={Plus}>Post a listing</Button>} />
                    ) : (
                        <EmptyState icon={CheckCircle2} title="No sold items" message="Listings you mark as sold will appear here." />
                    )
                ) : (
                    <ul className="divide-y divide-line">
                        {list.items.map((product) => (
                            <li key={product.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                <Link to={`/product/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md">
                                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-muted text-fg-subtle">
                                        {product.media?.[0]
                                            ? <img src={getImageUrl(product.media[0].url)} alt="" className="h-full w-full object-cover" />
                                            : <ImageOff size={20} aria-hidden />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium text-fg">{product.title}</span>
                                        <span className="block text-sm font-semibold text-fg tabular">{formatPrice(product.price)}</span>
                                        <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
                                            {timeAgo(product.created_at)}
                                            <span aria-hidden>·</span>
                                            <Eye size={12} aria-hidden /><span className="tabular">{product.views}</span><span className="sr-only">views</span>
                                        </span>
                                    </span>
                                </Link>
                                <div className="flex gap-2 sm:shrink-0">
                                    <Button to={`/product/${product.id}/edit`} variant="secondary" size="sm" icon={Pencil} className="flex-1 sm:flex-none">Edit</Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={product.is_sold ? RotateCcw : CheckCircle2}
                                        loading={pending === product.id}
                                        onClick={() => toggleSold(product)}
                                        className="flex-1 sm:flex-none"
                                    >
                                        {product.is_sold ? 'Relist' : 'Mark sold'}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
        </Page>
    )
}
