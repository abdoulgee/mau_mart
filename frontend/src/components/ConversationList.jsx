import { NavLink } from 'react-router-dom'
import { Image as ImageIcon, MessageSquare } from 'lucide-react'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import { EmptyState, ErrorState } from './ui/Feedback'
import { SkeletonRows } from './ui/Skeleton'
import useAuthStore from '../store/authStore'
import { timeAgo, fullName } from '../utils/format'
import cn from '../utils/cn'

function Preview({ message, mine }) {
    if (!message) return <span className="italic">No messages yet</span>
    return (
        <>
            {mine && <span className="text-fg-subtle">You: </span>}
            {message.content || (message.media_url && <span className="inline-flex items-center gap-1"><ImageIcon size={12} aria-hidden />Photo</span>)}
        </>
    )
}

export default function ConversationList({ conversations, loading, error, onRetry }) {
    const { user } = useAuthStore()

    if (loading) return <SkeletonRows rows={5} avatar />
    if (error && !conversations.length) return <ErrorState message="Conversations could not be loaded." onRetry={onRetry} />
    if (!conversations.length) {
        return (
            <EmptyState icon={MessageSquare} title="No messages yet"
                message="When you message a seller, or a buyer messages you, it shows up here."
                action={<Button to="/" variant="secondary">Browse listings</Button>} />
        )
    }

    return (
        <ul className="divide-y divide-line">
            {conversations.map((chat) => {
                const unread = chat.unread_count > 0
                return (
                    <li key={chat.id}>
                        <NavLink
                            to={`/chat/${chat.id}`}
                            className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 transition-colors', isActive ? 'bg-surface-muted' : 'hover:bg-surface-hover')}
                        >
                            <Avatar user={chat.other_user} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className={cn('truncate text-sm', unread ? 'font-semibold text-fg' : 'font-medium text-fg')}>{fullName(chat.other_user)}</p>
                                    <span className="shrink-0 text-xs text-fg-subtle">{timeAgo(chat.last_message_at)}</span>
                                </div>
                                {chat.product && <p className="truncate text-xs text-fg-subtle">{chat.product.title}</p>}
                                <div className="flex items-center gap-2">
                                    <p className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'text-fg' : 'text-fg-muted')}>
                                        <Preview message={chat.last_message} mine={chat.last_message?.sender_id === user?.id} />
                                    </p>
                                    {unread && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-2xs font-semibold text-brand-fg tabular">
                                            {chat.unread_count}<span className="sr-only"> unread</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </NavLink>
                    </li>
                )
            })}
        </ul>
    )
}
