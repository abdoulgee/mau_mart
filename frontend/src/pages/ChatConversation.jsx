import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CheckCheck, Flag, ImagePlus, MessageCircle, MessageSquareOff, SendHorizontal } from 'lucide-react'
import TopBar from '../components/navigation/TopBar'
import ConversationList from '../components/ConversationList'
import Avatar from '../components/ui/Avatar'
import Button, { IconButton } from '../components/ui/Button'
import { Badge, EmptyState, Spinner } from '../components/ui/Feedback'
import { Skeleton } from '../components/ui/Skeleton'
import ReportModal from '../components/ui/ReportModal'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import api, { errorMessage } from '../services/api'
import getImageUrl from '../utils/imageUrl'
import compressImage from '../utils/compressImage'
import { formatPrice, messageTime, fullName, whatsappLink } from '../utils/format'
import cn from '../utils/cn'

function dayLabel(dateString) {
    const date = new Date(dateString.endsWith('Z') ? dateString : `${dateString}Z`)
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}

function MessageBubble({ message, isOwn }) {
    const ReadIcon = message.is_read ? CheckCheck : Check
    return (
        <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] space-y-1', isOwn && 'items-end')}>
                {message.media_url && (
                    <a href={getImageUrl(message.media_url)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-line">
                        <img src={getImageUrl(message.media_url)} alt="Shared photo" className="max-h-64 object-cover" />
                    </a>
                )}
                {message.content && (
                    <p className={cn('whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm',
                        isOwn ? 'bg-brand text-brand-fg' : 'border border-line bg-surface text-fg')}>
                        {message.content}
                    </p>
                )}
                <p className={cn('flex items-center gap-1 text-2xs text-fg-subtle', isOwn && 'justify-end')}>
                    {messageTime(message.created_at)}
                    {isOwn && <ReadIcon size={12} aria-label={message.is_read ? 'Read' : 'Sent'} className={message.is_read ? 'text-info' : ''} />}
                </p>
            </div>
        </div>
    )
}

export default function ChatConversation() {
    const { chatId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { addToast } = useUIStore()
    const {
        conversations, fetchConversations, isLoadingConversations,
        currentChat, messages, isLoadingMessages, error, openChat, closeChat, sendMessage, setTyping, typingUsers,
    } = useChatStore()

    const [text, setText] = useState(location.state?.draft || '')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const endRef = useRef(null)
    const fileRef = useRef(null)
    const inputRef = useRef(null)
    const typingTimer = useRef(null)

    useEffect(() => {
        if (!conversations.length) fetchConversations()
    }, [])

    useEffect(() => {
        openChat(chatId)
        return () => closeChat()
    }, [chatId, openChat, closeChat])

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' })
    }, [messages.length, isLoadingMessages])

    const handleTyping = (value) => {
        setText(value)
        setTyping(Number(chatId), true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTyping(Number(chatId), false), 1500)
    }

    const submit = async (e) => {
        e.preventDefault()
        const content = text.trim()
        if (!content || sending) return
        clearTimeout(typingTimer.current)
        setTyping(Number(chatId), false)
        setSending(true)
        try {
            await sendMessage(chatId, content)
            setText('')
            inputRef.current?.focus()
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err, 'Message not sent. Try again.') })
        } finally {
            setSending(false)
        }
    }

    const sendPhoto = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!file.type.startsWith('image/')) {
            addToast({ type: 'error', message: 'Only photos can be sent' })
            return
        }
        setUploading(true)
        try {
            const data = new FormData()
            data.append('file', await compressImage(file))
            const res = await api.post('/api/v1/uploads/chat', data, { headers: { 'Content-Type': 'multipart/form-data' } })
            await sendMessage(chatId, '', res.data.url)
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err, 'Photo not sent') })
        } finally {
            setUploading(false)
        }
    }

    const other = currentChat?.other_user
    const product = currentChat?.product
    const isTyping = other && typingUsers[Number(chatId)]?.includes(other.id)
    const amSeller = product && product.user_id === user?.id

    let lastDay = null

    const conversation = error && !isLoadingMessages ? (
        <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={MessageSquareOff} title="Conversation not available" message={error}
                action={<Button variant="secondary" onClick={() => navigate('/chat')}>Back to messages</Button>} />
        </div>
    ) : (
        <>
            {/* Conversation header */}
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 sm:px-3">
                <IconButton icon={ArrowLeft} label="Back to messages" to="/chat" className="md:hidden" />
                {other ? (
                    <Link to={`/user/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md">
                        <Avatar user={other} size="sm" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-fg">{fullName(other)}</p>
                            <p className="text-xs text-fg-subtle" aria-live="polite">{isTyping ? 'Typing…' : 'View profile'}</p>
                        </div>
                    </Link>
                ) : <Skeleton className="h-8 flex-1" />}
                {other && <IconButton icon={Flag} label="Report user" onClick={() => setShowReport(true)} />}
            </div>

            {/* Listing context */}
            {product && (
                <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface-muted/60 px-4 py-2">
                    <Link to={`/product/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-surface">
                            {product.media?.[0] && <img src={getImageUrl(product.media[0].url)} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-fg">{product.title}</span>
                            <span className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-fg tabular">{formatPrice(product.price)}</span>
                                {product.is_sold && <Badge>Sold</Badge>}
                            </span>
                        </span>
                    </Link>
                    {!amSeller && other?.whatsapp && (
                        <Button variant="whatsapp" size="sm" icon={MessageCircle} href={whatsappLink(other.whatsapp, product)} target="_blank" rel="noopener noreferrer">
                            WhatsApp
                        </Button>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-busy={isLoadingMessages}>
                {isLoadingMessages ? (
                    <div className="space-y-3" aria-hidden>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={cn('flex', i % 2 ? 'justify-start' : 'justify-end')}><Skeleton className="h-9 w-48 rounded-lg" /></div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-fg-subtle">No messages yet. Say hello.</p>
                ) : (
                    <div className="space-y-3">
                        {messages.map((m) => {
                            const day = dayLabel(m.created_at)
                            const showDay = day !== lastDay
                            lastDay = day
                            return (
                                <div key={m.id} className="space-y-3">
                                    {showDay && (
                                        <p className="flex items-center gap-3 text-2xs font-medium uppercase tracking-wide text-fg-subtle before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
                                            {day}
                                        </p>
                                    )}
                                    <MessageBubble message={m} isOwn={m.sender_id === user?.id} />
                                </div>
                            )
                        })}
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Composer */}
            <form onSubmit={submit} className="flex shrink-0 items-end gap-2 border-t border-line bg-surface px-2 py-2 safe-bottom sm:px-3">
                <input ref={fileRef} type="file" accept="image/*" onChange={sendPhoto} className="hidden" />
                {uploading
                    ? <span className="flex h-10 w-10 items-center justify-center"><Spinner size={18} label="Sending photo" /></span>
                    : <IconButton icon={ImagePlus} label="Send a photo" onClick={() => fileRef.current?.click()} disabled={!currentChat} />}
                <label htmlFor="message-input" className="sr-only">Message</label>
                <textarea
                    id="message-input"
                    ref={inputRef}
                    rows={1}
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
                    placeholder="Write a message"
                    maxLength={2000}
                    className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:bg-surface focus:outline-none"
                />
                <IconButton icon={SendHorizontal} label="Send message" type="submit" variant="primary" disabled={!text.trim() || sending || !currentChat} />
            </form>
        </>
    )

    return (
        <div className="flex h-[100dvh] flex-col">
            <div className="hidden md:block"><TopBar /></div>
            <div className="flex min-h-0 flex-1 md:mx-auto md:w-full md:max-w-6xl md:p-6">
                <div className="flex min-h-0 flex-1 overflow-hidden bg-surface md:rounded-lg md:border md:border-line">
                    <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-line md:block" aria-label="Conversations">
                        <ConversationList conversations={conversations} loading={isLoadingConversations && !conversations.length} onRetry={() => fetchConversations()} />
                    </aside>
                    <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversation">{conversation}</section>
                </div>
            </div>
            <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} entityType="user" entityId={other?.id} />
        </div>
    )
}
