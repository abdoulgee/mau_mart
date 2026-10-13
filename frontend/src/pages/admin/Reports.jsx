import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Check, ExternalLink, Flag, Package, Trash2, User } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Pager } from '../../components/ui/Pagination'
import { Badge, EmptyState, ErrorState } from '../../components/ui/Feedback'
import { SkeletonRows } from '../../components/ui/Skeleton'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import { timeAgo, fullName } from '../../utils/format'

const TABS = [
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' },
]

const ACTIONS = {
    remove_listing: { title: 'Remove this listing?', message: 'The listing will be hidden and the seller notified.', label: 'Remove listing' },
    suspend_user: { title: 'Suspend this account?', message: "They won't be able to log in, and their listings will be hidden.", label: 'Suspend' },
}

export default function AdminReports() {
    const [status, setStatus] = useState('pending')
    const [page, setPage] = useState(1)
    const [data, setData] = useState({ reports: [], pagination: {} })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [confirm, setConfirm] = useState(null) // { report, action }
    const [pending, setPending] = useState(null)
    const { addToast } = useUIStore()
    const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')

    const load = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await api.get('/api/v1/admin/reports', { params: { status, page } })
            setData(res.data)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [status, page])

    const resolve = async (report, action) => {
        setPending(report.id)
        try {
            const res = await api.post(`/api/v1/admin/reports/${report.id}/resolve`, { action })
            addToast({ type: 'success', message: res.data.message })
            setConfirm(null)
            load()
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err) })
        } finally {
            setPending(null)
        }
    }

    return (
        <AdminPage title="Reports" description="Review what users have flagged">
            <Tabs label="Report status" value={status} options={TABS} onChange={(v) => { setStatus(v); setPage(1) }} />

            <Panel padded={false}>
                {loading ? (
                    <SkeletonRows rows={4} />
                ) : error ? (
                    <ErrorState onRetry={load} />
                ) : data.reports.length === 0 ? (
                    <EmptyState icon={Flag} title={status === 'pending' ? 'No reports to review' : 'Nothing here'}
                        message={status === 'pending' ? 'New reports from users will appear here.' : undefined} />
                ) : (
                    <ul className="divide-y divide-line">
                        {data.reports.map((r) => {
                            const isProduct = r.entity_type === 'product'
                            const TargetIcon = isProduct ? Package : User
                            return (
                                <li key={r.id} className="space-y-3 p-4 sm:p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-fg-muted">
                                                <TargetIcon size={18} aria-hidden />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs text-fg-subtle">{isProduct ? 'Listing' : 'User'} · reported {timeAgo(r.created_at)} by {fullName(r.reporter)}</p>
                                                <Link to={isProduct ? `/product/${r.entity_id}` : `/user/${r.entity_id}`} target="_blank"
                                                    className="inline-flex max-w-full items-center gap-1 font-medium text-fg hover:underline">
                                                    <span className="truncate">{r.target.name}</span><ExternalLink size={12} aria-hidden className="shrink-0 text-fg-subtle" />
                                                </Link>
                                            </div>
                                        </div>
                                        {!r.target.is_active && <Badge tone="danger" dot>{isProduct ? 'Already removed' : 'Already suspended'}</Badge>}
                                    </div>
                                    <div className="rounded-md bg-surface-muted p-3 text-sm">
                                        <p className="font-medium text-fg">{r.reason}</p>
                                        {r.description && <p className="mt-1 text-fg-muted">{r.description}</p>}
                                    </div>
                                    {r.status === 'pending' ? (
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="secondary" size="sm" icon={Check} loading={pending === r.id && !confirm} onClick={() => resolve(r, 'dismiss')}>
                                                Dismiss
                                            </Button>
                                            {isProduct && r.target.is_active && (
                                                <Button variant="secondary" size="sm" icon={Trash2} onClick={() => setConfirm({ report: r, action: 'remove_listing' })}>
                                                    Remove listing
                                                </Button>
                                            )}
                                            {(isSuper || r.target.owner_role === 'user') && (
                                                <Button variant="danger-ghost" size="sm" icon={Ban} onClick={() => setConfirm({ report: r, action: 'suspend_user' })}>
                                                    Suspend {isProduct ? 'seller' : 'user'}
                                                </Button>
                                            )}
                                        </div>
                                    ) : r.admin_notes ? (
                                        <p className="text-xs text-fg-subtle">Note: {r.admin_notes}</p>
                                    ) : null}
                                </li>
                            )
                        })}
                    </ul>
                )}
                <Pager page={page} pages={data.pagination.pages} total={data.pagination.total} onChange={setPage} />
            </Panel>

            <ConfirmDialog
                open={!!confirm}
                title={confirm && ACTIONS[confirm.action].title}
                message={confirm && ACTIONS[confirm.action].message}
                confirmLabel={confirm && ACTIONS[confirm.action].label}
                danger
                loading={pending === confirm?.report.id}
                onConfirm={() => resolve(confirm.report, confirm.action)}
                onClose={() => setConfirm(null)}
            />
        </AdminPage>
    )
}
