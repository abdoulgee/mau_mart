import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import { Skeleton } from '../components/ui/Skeleton'

function ConversationItem({ chat }) {
    const { user } = useAuthStore()
    const otherUser = chat.other_user
    const lastMessage = chat.last_message

    return (
        <Link
            to={`/chat/${chat.id}`}
            className="flex items-center gap-3 p-4 bg-white hover:bg-surface-50 transition-colors"
        >
            {/* Avatar */}
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-medium">
                    {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        otherUser?.first_name?.[0] || '?'
                    )}
                </div>
                {chat.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                        {chat.unread_count > 9 ? '9+' : chat.unread_count}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium ${chat.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {otherUser?.first_name} {otherUser?.last_name}
                    </h3>
                    <span className="text-xs text-gray-400">
                        {lastMessage && formatTime(lastMessage.created_at)}
                    </span>
                </div>
                <p className={`text-sm truncate ${chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {lastMessage?.message_type === 'image' && '📷 Photo'}
                    {lastMessage?.message_type === 'order' && '📦 Order message'}
                    {lastMessage?.message_type === 'text' && lastMessage?.content}
                    {!lastMessage && 'Start a conversation'}
                </p>
            </div>
        </Link>
    )
}

function formatTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    if (diff < 604800000) return date.toLocaleDateString('en', { weekday: 'short' })
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function ChatList() {
    const { conversations, fetchConversations, startChat, isLoadingConversations, connectSocket, socket } = useChatStore()
    const { isAuthenticated } = useAuthStore()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [startingChat, setStartingChat] = useState(false)

    // Ensure socket is connected
    useEffect(() => {
        if (isAuthenticated && !socket) {
            connectSocket()
        }
    }, [isAuthenticated, socket, connectSocket])

    // Handle starting a new chat via query params
    useEffect(() => {
        const sellerId = searchParams.get('seller')
        const productId = searchParams.get('product')

        if (sellerId && isAuthenticated && !startingChat) {
            setStartingChat(true)
            startChat(parseInt(sellerId), productId ? parseInt(productId) : null)
                .then(result => {
                    if (result.success && result.chat) {
                        navigate(`/chat/${result.chat.id}`, { replace: true })
                    } else {
                        setStartingChat(false)
                    }
                })
                .catch(() => {
                    setStartingChat(false)
                })
        }
    }, [searchParams, isAuthenticated, startChat, navigate, startingChat])

    useEffect(() => {
        if (isAuthenticated) {
            fetchConversations()
        }
    }, [isAuthenticated, fetchConversations])

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-gray-500 mb-6 text-sm">Please login to view your messages</p>
                    <Link to="/login" className="btn-primary px-8">Login</Link>
                </div>
            </div>
        )
    }

    // Show loading while starting a new chat
    if (startingChat) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium text-sm">Starting conversation...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Messages" />

            {isLoadingConversations ? (
                <div className="space-y-px">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-4 bg-white flex items-center gap-3">
                            <div className="skeleton w-12 h-12 rounded-full" />
                            <div className="flex-1">
                                <div className="skeleton h-4 w-32 mb-2" />
                                <div className="skeleton h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : conversations.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {conversations.map(chat => (
                        <ConversationItem key={chat.id} chat={chat} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-400 text-sm">Start chatting with sellers when you find products you like!</p>
                </div>
            )}
        </div>
    )
}
