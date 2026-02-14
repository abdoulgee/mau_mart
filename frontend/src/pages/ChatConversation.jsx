import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import { Skeleton } from '../components/ui/Skeleton'
import api from '../services/api'
import ReportModal from '../components/ui/ReportModal'

function MessageBubble({ message, isOwn, currentUserId, otherUserId, onOrderAction }) {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const { addToast } = useUIStore()

    const handleApprove = async () => {
        if (!message.order_id) return
        setActionLoading(true)
        try {
            await api.post(`/api/v1/orders/${message.order_id}/approve`)
            addToast({ type: 'success', message: 'Order approved!' })
            if (onOrderAction) onOrderAction()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to approve' })
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        const reason = prompt('Reason for rejection (optional):')
        if (reason === null) return // User cancelled
        if (!message.order_id) return
        setActionLoading(true)
        try {
            await api.post(`/api/v1/orders/${message.order_id}/reject`, { reason: reason || 'Payment not confirmed' })
            addToast({ type: 'info', message: 'Order rejected' })
            if (onOrderAction) onOrderAction()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to reject' })
        } finally {
            setActionLoading(false)
        }
    }

    // Check if this is a receipt that needs seller action
    const isReceipt = message.message_type === 'receipt'
    const isAwaitingApproval = isReceipt && message.content?.includes('Awaiting your approval')
    const isApproved = isReceipt && message.content?.includes('APPROVED')
    const isRejected = isReceipt && message.content?.includes('REJECTED')
    // Only allow action if awaiting approval, not own message, has order_id, and hasn't been approved/rejected
    const canTakeAction = isAwaitingApproval && !isOwn && message.order_id && !isApproved && !isRejected

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-[85%] ${isOwn ? 'order-2' : ''}`}>
                {(message.message_type === 'image' || message.message_type === 'media') && message.media_url && (
                    <div className="relative rounded-2xl overflow-hidden mb-1">
                        {!imageLoaded && <div className="w-48 h-48 bg-gray-200 animate-pulse" />}
                        <img
                            src={message.media_url}
                            alt=""
                            className={`max-w-full h-auto ${!imageLoaded ? 'hidden' : ''}`}
                            onLoad={() => setImageLoaded(true)}
                            onClick={() => window.open(message.media_url, '_blank')}
                        />
                    </div>
                )}

                {/* Receipt Message Type */}
                {isReceipt && (
                    <div className={`rounded-2xl overflow-hidden shadow-sm border-2 ${isApproved ? 'border-green-200 bg-green-50' :
                        isRejected ? 'border-red-200 bg-red-50' :
                            'border-blue-200 bg-blue-50'
                        }`}>
                        <div className={`px-3 py-2 font-medium text-sm ${isApproved ? 'bg-green-100 text-green-800' :
                            isRejected ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {isApproved ? '✅ Payment Approved' :
                                isRejected ? '❌ Payment Rejected' :
                                    '📧 Payment Receipt'}
                        </div>
                        <div className="p-3">
                            <p className={`text-sm whitespace-pre-wrap ${isApproved ? 'text-green-700' :
                                isRejected ? 'text-red-700' :
                                    'text-blue-700'
                                }`}>
                                {message.content}
                            </p>

                            {/* Action Buttons for Seller - Only show if can take action */}
                            {canTakeAction && (
                                <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 px-3 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Processing...' : 'Approve ✓'}
                                    </button>
                                </div>
                            )}

                            {/* Link to Order */}
                            {message.order_id && (
                                <Link
                                    to={`/order/${message.order_id}`}
                                    className="mt-2 block text-center text-xs text-gray-500 hover:text-primary-600"
                                >
                                    View Order Details →
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Message Type (legacy) */}
                {message.message_type === 'order' && (
                    <div className={`p-3 rounded-2xl ${isOwn ? 'bg-primary-500' : 'bg-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span>📦</span>
                            <span className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                                Order Message
                            </span>
                        </div>
                        <p className={`text-sm ${isOwn ? 'text-white/90' : 'text-gray-600'}`}>
                            {message.content}
                        </p>
                    </div>
                )}

                {/* Regular Text Message */}
                {(message.message_type === 'text' || !message.message_type) && message.content && (
                    <div className={`px-4 py-2 rounded-2xl ${isOwn
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                )}
                <p className={`text-xs mt-1 ${isOwn ? 'text-right' : ''} text-gray-400`}>
                    {formatTime(message.created_at)}
                    {isOwn && message.is_read && <span className="ml-1">✓✓</span>}
                </p>
            </div>
        </div>
    )
}


function formatTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatConversation() {
    const { chatId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { addToast } = useUIStore()
    const {
        currentChat,
        messages,
        fetchMessages,
        sendMessage,
        setTyping,
        typingUsers,
        isLoadingMessages,
        error,
        connectSocket,
        clearCurrentChat,
        socket
    } = useChatStore()

    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState(null)
    const [mediaPreview, setMediaPreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [loadError, setLoadError] = useState(null)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const fileInputRef = useRef(null)

    // Initialize socket connection if not connected
    useEffect(() => {
        if (!socket) {
            connectSocket()
        }
    }, [socket, connectSocket])

    // Fetch messages when chatId changes
    useEffect(() => {
        if (chatId) {
            setLoadError(null)
            fetchMessages(chatId).catch(err => {
                console.error('Failed to fetch messages:', err)
                setLoadError('Failed to load chat. Please try again.')
            })
        }
        // Cleanup: leave room on unmount or chatId change
        return () => {
            clearCurrentChat()
        }
    }, [chatId, fetchMessages, clearCurrentChat])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e) => {
        e.preventDefault()
        if ((!newMessage.trim() && !selectedMedia) || sending) return

        setSending(true)
        try {
            if (selectedMedia) {
                // Upload media first
                setUploading(true)
                const formData = new FormData()
                formData.append('file', selectedMedia)
                formData.append('chat_id', chatId)

                const uploadRes = await api.post('/api/v1/uploads/chat', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                // Send message with media URL
                await sendMessage(chatId, newMessage.trim() || '', 'media', uploadRes.data.url)
                setUploading(false)
            } else {
                await sendMessage(chatId, newMessage.trim())
            }

            setNewMessage('')
            setSelectedMedia(null)
            setMediaPreview(null)
            inputRef.current?.focus()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to send message' })
            setUploading(false)
        } finally {
            setSending(false)
        }
    }

    const handleTyping = (e) => {
        setNewMessage(e.target.value)
    }

    const handleMediaSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            addToast({ type: 'error', message: 'File size must be less than 5MB' })
            return
        }

        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            addToast({ type: 'error', message: 'Only images and videos are allowed' })
            return
        }

        setSelectedMedia(file)
        setMediaPreview(URL.createObjectURL(file))
    }

    const cancelMediaUpload = () => {
        setSelectedMedia(null)
        setMediaPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const otherUser = currentChat?.other_user

    // Show error state if chat failed to load
    if (loadError || (error && !isLoadingMessages)) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <span className="text-6xl block mb-4">😕</span>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Chat Not Found</h2>
                    <p className="text-gray-500 mb-6">
                        {loadError || error || 'This chat could not be loaded. It may have been deleted or you may not have access to it.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/chat')}
                            className="btn-secondary px-6"
                        >
                            Back to Chats
                        </button>
                        <button
                            onClick={() => {
                                setLoadError(null)
                                fetchMessages(chatId)
                            }}
                            className="btn-primary px-6"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Show loading state while fetching initial data
    if (isLoadingMessages && !currentChat) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading chat...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
                <Link to="/chat" className="p-2 -ml-2 text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                {otherUser ? (
                    <>
                        <div
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => {
                                if (otherUser.store_id) {
                                    navigate(`/store/${otherUser.store_id}`)
                                }
                            }}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-medium">
                                {otherUser.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    otherUser.first_name?.[0]
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                    {otherUser.first_name} {otherUser.last_name}
                                </h3>
                                {typingUsers[chatId]?.includes(otherUser.id) ? (
                                    <p className="text-xs text-primary-500">typing...</p>
                                ) : otherUser.store_name ? (
                                    <p className="text-xs text-primary-500 hover:underline">{otherUser.store_name} →</p>
                                ) : (
                                    <p className="text-xs text-gray-500">Online</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Report User"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <Skeleton className="h-10 w-40" />
                )}
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                entityType="user"
                entityId={otherUser?.id}
            />

            {/* Product Header (if chat started from product) */}
            {currentChat?.product && (
                <Link
                    to={`/product/${currentChat.product.id}`}
                    className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        {currentChat.product.media?.[0]?.url ? (
                            <img src={currentChat.product.media[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl flex items-center justify-center h-full">📦</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{currentChat.product.title}</p>
                        <p className="text-xs text-primary-600">₦{currentChat.product.price?.toLocaleString()}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoadingMessages ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                <Skeleton className={`h-10 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-2xl`} />
                            </div>
                        ))}
                    </div>
                ) : messages.length > 0 ? (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={msg.sender_id === user?.id}
                            currentUserId={user?.id}
                            otherUserId={otherUser?.id}
                            onOrderAction={() => fetchMessages(chatId)}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No messages yet. Say hello! 👋</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Media Preview */}
            {mediaPreview && (
                <div className="bg-white border-t border-gray-100 px-4 py-3">
                    <div className="relative inline-block">
                        {selectedMedia?.type.startsWith('video/') ? (
                            <video src={mediaPreview} className="max-h-32 rounded-lg" />
                        ) : (
                            <img src={mediaPreview} alt="Preview" className="max-h-32 rounded-lg" />
                        )}
                        <button
                            onClick={cancelMediaUpload}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm"
                        >
                            ×
                        </button>
                    </div>
                    {uploading && (
                        <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                    )}
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={handleSend}
                className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedMedia) || sending}
                    className={`p-2 rounded-full ${(newMessage.trim() || selectedMedia) && !sending
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    )
}

