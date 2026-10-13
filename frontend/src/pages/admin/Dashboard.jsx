import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flag, ImageOff } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import { Alert, Badge, EmptyState, ErrorState } from '../../components/ui/Feedback'
import { Skeleton } from '../../components/ui/Skeleton'
import ColumnChart from '../../components/charts/ColumnChart'
import BarList from '../../components/charts/BarList'
import api from '../../services/api'
import getImageUrl from '../../utils/imageUrl'
import { formatPrice, timeAgo, fullName } from '../../utils/format'

function StatStrip({ stats }) {
    const items = [
        { label: 'Users', value: stats.total_users, delta: stats.new_users_7d, to: '/admin/users' },
        { label: 'Active listings', value: stats.active_listings, delta: stats.new_listings_7d, to: '/admin/products?status=active' },
        { label: 'Marked sold', value: stats.sold_listings, to: '/admin/products?status=sold' },
        { label: 'Conversations', value: stats.total_chats },
    ]
    return (
        // 1px gaps over the line color draw the dividers at every breakpoint
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4 [&>*]:bg-surface">
            {items.map((item) => {
                const body = (
                    <>
                        <dt className="text-xs font-medium text-fg-muted">{item.label}</dt>
                        <dd className="mt-1 text-2xl font-semibold text-fg">{item.value.toLocaleString()}</dd>
                        {item.delta != null && <dd className="mt-0.5 text-xs text-fg-subtle tabular">+{item.delta} in the last 7 days</dd>}
                    </>
                )
                return item.to ? (
                    <Link key={item.label} to={item.to} className="block p-4 transition-colors hover:bg-surface-hover sm:p-5">{body}</Link>
                ) : (
                    <div key={item.label} className="p-4 sm:p-5">{body}</div>
                )
            })}
        </dl>
    )
}

const dayFormat = (iso, opts) => new Date(`${iso}T00:00:00`).toLocaleDateString('en', opts)

export default function AdminDashboard() {
    const [data, setData] = useState(null)
    const [error, setError] = useState(false)
    const [metric, setMetric] = useState('listings')

    const load = () => {
        setError(false)
        api.get('/api/v1/admin/dashboard').then(({ data }) => setData(data)).catch(() => setError(true))
    }
    useEffect(load, [])

    if (error) return <AdminPage title="Dashboard"><ErrorState message="Dashboard data could not be loaded." onRetry={load} /></AdminPage>

    const series = data?.daily.map((d) => ({
        key: d.date,
        label: dayFormat(d.date, { day: 'numeric' }),
        title: dayFormat(d.date, { weekday: 'short', month: 'short', day: 'numeric' }),
        value: d[metric],
    }))
    const periodTotal = series?.reduce((sum, d) => sum + d.value, 0) ?? 0

    const columns = [
        {
            key: 'title', header: 'Listing', primary: true,
            render: (p) => (
                <Link to={`/product/${p.id}`} target="_blank" className="flex items-center gap-3 rounded-md">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-muted text-fg-subtle">
                        {p.media?.[0] ? <img src={getImageUrl(p.media[0].url)} alt="" className="h-full w-full object-cover" /> : <ImageOff size={16} aria-hidden />}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-medium text-fg hover:underline">{p.title}</span>
                        <span className="block text-xs text-fg-subtle">{fullName(p.seller)}</span>
                    </span>
                </Link>
            ),
        },
        { key: 'price', header: 'Price', align: 'right', render: (p) => <span className="tabular">{formatPrice(p.price)}</span> },
        {
            key: 'status', header: 'Status',
            render: (p) => !p.is_active ? <Badge tone="danger" dot>Removed</Badge> : p.is_sold ? <Badge dot>Sold</Badge> : <Badge tone="success" dot>Active</Badge>,
        },
        { key: 'created_at', header: 'Posted', render: (p) => <span className="text-fg-muted">{timeAgo(p.created_at)}</span> },
    ]

    return (
        <AdminPage title="Dashboard" description="Marketplace activity at a glance">
            {data?.stats.pending_reports > 0 && (
                <Alert tone="warning" icon={Flag} title={`${data.stats.pending_reports} report${data.stats.pending_reports === 1 ? '' : 's'} waiting for review`}
                    action={<Button to="/admin/reports" size="sm" variant="secondary" iconRight={ArrowRight}>Review</Button>}>
                    Users flagged listings or accounts that may break the rules.
                </Alert>
            )}

            {data ? <StatStrip stats={data.stats} /> : <Skeleton className="h-28 rounded-lg" />}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Panel
                    title={metric === 'listings' ? 'New listings' : 'New users'}
                    description={data ? `${periodTotal.toLocaleString()} in the last 14 days` : 'Last 14 days'}
                    actions={
                        <Tabs size="sm" label="Chart metric" value={metric} onChange={setMetric}
                            options={[{ value: 'listings', label: 'Listings' }, { value: 'users', label: 'Users' }]} />
                    }
                >
                    {series ? <ColumnChart data={series} valueLabel={metric === 'listings' ? 'New listings' : 'New users'} /> : <Skeleton className="h-52" />}
                </Panel>

                <Panel title="Active listings by category" description="Available items only">
                    {!data ? (
                        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4" />)}</div>
                    ) : data.by_category.length ? (
                        <BarList items={data.by_category} />
                    ) : (
                        <p className="py-8 text-center text-sm text-fg-subtle">No active listings yet</p>
                    )}
                </Panel>
            </div>

            <Panel title="Latest listings" padded={false}
                actions={<Button to="/admin/products" variant="ghost" size="sm" iconRight={ArrowRight}>All listings</Button>}>
                <DataTable
                    caption="Latest listings"
                    columns={columns}
                    rows={data?.recent_listings || []}
                    loading={!data}
                    empty={<EmptyState title="No listings yet" message="New listings will appear here." />}
                />
            </Panel>
        </AdminPage>
    )
}
