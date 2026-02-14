import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { Skeleton } from '../components/ui/Skeleton'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import api from '../services/api'

function NotificationIcon({ type }) {
    const iconPaths = {
        order: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
        chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        review: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
        store: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5',
        product: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        general: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    }
    return <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[type] || iconPaths.general} /></svg>
}

function timeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function Notifications() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const { isAuthenticated } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications()
        } else {
            setLoading(false)
        }
    }, [isAuthenticated])

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/v1/notifications')
            setNotifications(response.data.notifications || [])
            setUnreadCount(response.data.unread_count || 0)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.is_read) {
            try {
                await api.post(`/api/v1/notifications/${notification.id}/read`)
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            } catch (error) {
                console.error('Failed to mark as read:', error)
            }
        }

        // Navigate based on notification type
        const data = notification.data || {}
        if (data.order_id) {
            navigate(`/order/${data.order_id}`)
        } else if (data.chat_id) {
            navigate(`/chat/${data.chat_id}`)
        } else if (data.product_id) {
            navigate(`/product/${data.product_id}`)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await api.post('/api/v1/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            addToast({ type: 'success', message: 'All notifications marked as read' })
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to mark all as read' })
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Notifications" showBack />

            {/* Mark all read button */}
            {unreadCount > 0 && (
                <div className="px-4 py-2 flex justify-end">
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-primary-600 font-medium hover:text-primary-700"
                    >
                        Mark all as read ({unreadCount})
                    </button>
                </div>
            )}

            <div className="divide-y divide-gray-100">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 bg-white flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-40 mb-2" />
                                <Skeleton className="h-3 w-64 mb-1" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))
                ) : notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-surface-50 ${!notification.is_read ? 'bg-primary-50/50' : 'bg-white'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${!notification.is_read ? 'bg-primary-100' : 'bg-gray-100'
                                }`}>
                                <NotificationIcon type={notification.type} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                    {notification.title}
                                </h4>
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                </p>
                                <span className="text-xs text-gray-400 mt-1 block">
                                    {timeAgo(notification.created_at)}
                                </span>
                            </div>

                            {/* Unread dot */}
                            {!notification.is_read && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 px-4 bg-white">
                        <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">No Notifications</h3>
                        <p className="text-gray-400 text-sm">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
