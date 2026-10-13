import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArchiveRestore, ExternalLink, ImageOff, Package, Search, Star, StarOff, Trash2 } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Tabs from '../../components/ui/Tabs'
import { IconButton } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { Pager } from '../../components/ui/Pagination'
import { Badge, EmptyState } from '../../components/ui/Feedback'
import { TextField } from '../../components/ui/Field'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'
import getImageUrl from '../../utils/imageUrl'
import { formatPrice, timeAgo, fullName } from '../../utils/format'

const FILTERS = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'sold', label: 'Sold' },
    { value: 'featured', label: 'Featured' },
    { value: 'removed', label: 'Removed' },
]

function StatusBadge({ product }) {
    if (!product.is_active) return <Badge tone="danger" dot>Removed</Badge>
    if (product.is_sold) return <Badge dot>Sold</Badge>
    return <Badge tone="success" dot>Active</Badge>
}

export default function AdminProducts() {
    const [searchParams, setSearchParams] = useSearchParams()
    const status = searchParams.get('status') || ''
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [data, setData] = useState({ products: [], pagination: {} })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [removing, setRemoving] = useState(null)
    const [pending, setPending] = useState(null)
    const { addToast } = useUIStore()

    const load = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await api.get('/api/v1/admin/products', { params: { page, search: query, status } })
            setData(res.data)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [page, query, status])

    const update = async (product, changes, message) => {
        setPending(product.id)
        try {
            await api.patch(`/api/v1/admin/products/${product.id}`, changes)
            addToast({ type: 'success', message })
            setRemoving(null)
            load()
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err) })
        } finally {
            setPending(null)
        }
    }

    const columns = [
        {
            key: 'listing', header: 'Listing', primary: true,
            render: (p) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-muted text-fg-subtle">
                        {p.media?.[0] ? <img src={getImageUrl(p.media[0].url)} alt="" className="h-full w-full object-cover" /> : <ImageOff size={16} aria-hidden />}
                    </span>
                    <div className="min-w-0">
                        <Link to={`/product/${p.id}`} target="_blank" className="inline-flex max-w-full items-center gap-1 font-medium text-fg hover:underline">
                            <span className="truncate">{p.title}</span><ExternalLink size={12} aria-hidden className="shrink-0 text-fg-subtle" />
                        </Link>
                        <p className="truncate text-xs text-fg-subtle">{fullName(p.seller)}{p.category && ` · ${p.category.name}`}</p>
                    </div>
                </div>
            ),
        },
        { key: 'price', header: 'Price', align: 'right', render: (p) => <span className="tabular">{formatPrice(p.price)}</span> },
        {
            key: 'status', header: 'Status',
            render: (p) => (
                <div className="flex flex-wrap gap-1">
                    <StatusBadge product={p} />
                    {p.is_featured && <Badge tone="brand"><Star size={12} aria-hidden />Featured</Badge>}
                </div>
            ),
        },
        { key: 'views', header: 'Views', align: 'right', render: (p) => <span className="tabular text-fg-muted">{p.views}</span> },
        { key: 'posted', header: 'Posted', render: (p) => <span className="text-fg-muted">{timeAgo(p.created_at)}</span> },
        {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
            render: (p) => (
                <div className="flex justify-end gap-1">
                    {p.is_active && (
                        <IconButton
                            icon={p.is_featured ? StarOff : Star}
                            label={p.is_featured ? 'Remove from featured' : 'Feature on home page'}
                            size="sm"
                            disabled={pending === p.id}
                            onClick={() => update(p, { is_featured: !p.is_featured }, p.is_featured ? 'Removed from featured' : 'Featured on the home page')}
                        />
                    )}
                    {p.is_active ? (
                        <IconButton icon={Trash2} label="Remove listing" size="sm" variant="danger-ghost" onClick={() => setRemoving(p)} />
                    ) : (
                        <IconButton icon={ArchiveRestore} label="Restore listing" size="sm" disabled={pending === p.id}
                            onClick={() => update(p, { is_active: true }, 'Listing restored')} />
                    )}
                </div>
            ),
        },
    ]

    return (
        <AdminPage title="Listings" description={data.pagination.total != null ? `${data.pagination.total.toLocaleString()} listings` : undefined}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs label="Filter by status" value={status} options={FILTERS}
                    onChange={(v) => { setPage(1); setSearchParams(v ? { status: v } : {}) }} />
                <form role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }} className="sm:w-72">
                    <TextField icon={Search} type="search" placeholder="Search titles" aria-label="Search listings"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </form>
            </div>

            <Panel padded={false}>
                <DataTable
                    caption="Listings"
                    columns={columns}
                    rows={data.products}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    empty={<EmptyState icon={Package} title="No listings found" message={query ? 'Try a different search.' : undefined} />}
                />
                <Pager page={page} pages={data.pagination.pages} total={data.pagination.total} onChange={setPage} />
            </Panel>

            <ConfirmDialog
                open={!!removing}
                title="Remove this listing?"
                message={`"${removing?.title}" will be hidden from the marketplace and the seller will be notified. You can restore it later.`}
                confirmLabel="Remove listing"
                danger
                loading={pending === removing?.id}
                onConfirm={() => update(removing, { is_active: false }, 'Listing removed')}
                onClose={() => setRemoving(null)}
            />
        </AdminPage>
    )
}
