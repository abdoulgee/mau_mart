import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, MessageSquare, ShieldAlert } from 'lucide-react'
import Page from '../components/navigation/Page'
import Button from '../components/ui/Button'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { SkeletonRows } from '../components/ui/Skeleton'
import { LoadMore } from '../components/ui/Pagination'
import usePaginatedList from '../hooks/usePaginatedList'
import api from '../services/api'
import useChatStore from '../store/chatStore'
import useUIStore from '../store/uiStore'
import { timeAgo } from '../utils/format'
import cn from '../utils/cn'

const icons = { chat: MessageSquare, moderation: ShieldAlert }

export default function Notifications() {
    const navigate = useNavigate()
    const { resetNotificationCount } = useChatStore()
    const { addToast } = useUIStore()
    const list = usePaginatedList('/api/v1/notifications', {}, { key: 'notifications' })
    const [markingAll, setMarkingAll] = useState(false)
    const unread = list.items.filter((n) => !n.is_read).length

    useEffect(() => {
        resetNotificationCount()
    }, [resetNotificationCount])

    const open = async (notification) => {
        if (!notification.is_read) {
            list.setItems((items) => items.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
            api.post(`/api/v1/notifications/${notification.id}/read`).catch(() => { })
        }
        const data = notification.data || {}
        if (data.chat_id) navigate(`/chat/${data.chat_id}`)
        else if (data.product_id) navigate(`/product/${data.product_id}`)
    }

    const markAllRead = async () => {
        setMarkingAll(true)
        try {
            await api.post('/api/v1/notifications/read-all')
            list.setItems((items) => items.map((n) => ({ ...n, is_read: true })))
        } catch {
            addToast({ type: 'error', message: 'Could not mark notifications as read' })
        } finally {
            setMarkingAll(false)
        }
    }

    const markAll = unread > 0 && (
        <Button variant="ghost" size="sm" icon={CheckCheck} onClick={markAllRead} loading={markingAll}>Mark all read</Button>
    )

    return (
        <Page title="Notifications" back width="medium" actions={markAll}>
            <div className="rounded-lg border border-line bg-surface">
                {list.loading ? (
                    <SkeletonRows rows={5} avatar />
                ) : list.error ? (
                    <ErrorState onRetry={list.reload} />
                ) : list.items.length === 0 ? (
                    <EmptyState icon={Bell} title="You're all caught up" message="New messages and account updates will show up here." />
                ) : (
                    <ul className="divide-y divide-line">
                        {list.items.map((n) => {
                            const Icon = icons[n.type] || Bell
                            return (
                                <li key={n.id}>
                                    <button type="button" onClick={() => open(n)}
                                        className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover', !n.is_read && 'bg-brand-soft/40')}>
                                        <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                            n.type === 'moderation' ? 'bg-danger-soft text-danger' : 'bg-surface-muted text-fg-muted')}>
                                            <Icon size={16} aria-hidden />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className={cn('text-sm text-fg', !n.is_read && 'font-semibold')}>{n.title}</span>
                                                <span className="shrink-0 text-xs text-fg-subtle">{timeAgo(n.created_at)}</span>
                                            </span>
                                            <span className="mt-0.5 block text-sm text-fg-muted">{n.message}</span>
                                        </span>
                                        {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
            <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
        </Page>
    )
}
