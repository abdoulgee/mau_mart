import { create } from 'zustand'
import { io } from 'socket.io-client'
import api from '../services/api'
import useAuthStore from './authStore'

const useChatStore = create((set, get) => ({
    socket: null,
    conversations: [],
    currentChat: null,
    messages: [],
    isConnected: false,
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSending: false,
    error: null,
    unreadCount: 0,
    typingUsers: {},
    notificationCount: 0,

    // Initialize socket connection
    connectSocket: () => {
        const { accessToken } = useAuthStore.getState()
        if (!accessToken || get().socket) return

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

        const socket = io(apiUrl, {
            query: { token: accessToken },
            transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
            set({ isConnected: true })
            console.log('Chat connected')
        })

        socket.on('disconnect', () => {
            set({ isConnected: false })
            console.log('Chat disconnected')
        })

        // Handle messages received in the chat room (when user is viewing the chat)
        socket.on('new_message', (message) => {
            const { currentChat, messages } = get()
            const { user } = useAuthStore.getState()

            // Skip if this is our own message (we already added it locally on send)
            if (message.sender_id === user?.id) return

            // Only add if we're viewing this chat AND message not already present
            if (currentChat && currentChat.id === message.chat_id) {
                const exists = messages.some(m => m.id === message.id)
                if (!exists) {
                    set((state) => ({
                        messages: [...state.messages, message],
                    }))
                    // Mark as read since we're viewing it
                    socket.emit('mark_read', { chat_id: message.chat_id })
                }
            }
        })

        // Handle notification of messages on chats we're not currently viewing
        socket.on('new_message_notification', ({ chat_id, message }) => {
            const { currentChat } = get()

            // If we're already viewing this chat, skip (handled by new_message)
            if (currentChat && currentChat.id === chat_id) return

            // Update unread count
            set((state) => ({ unreadCount: state.unreadCount + 1 }))

            // Update conversation list in real-time
            set((state) => {
                const existing = state.conversations.find(c => c.id === chat_id)
                if (existing) {
                    return {
                        conversations: state.conversations.map(conv =>
                            conv.id === chat_id
                                ? { ...conv, last_message: message, unread_count: (conv.unread_count || 0) + 1 }
                                : conv
                        )
                    }
                }
                // If conversation is new, re-fetch the full list
                get().fetchConversations()
                return {}
            })
        })

        socket.on('messages_read', ({ chat_id, read_by }) => {
            const { user } = useAuthStore.getState()
            if (read_by === user?.id) return
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.chat_id === chat_id && !msg.is_read && msg.sender_id !== read_by
                        ? { ...msg, is_read: true }
                        : msg
                ),
            }))
        })

        socket.on('user_typing', ({ chat_id, user_id, is_typing }) => {
            set((state) => ({
                typingUsers: {
                    ...state.typingUsers,
                    [chat_id]: is_typing
                        ? [...(state.typingUsers[chat_id] || []), user_id]
                        : (state.typingUsers[chat_id] || []).filter((id) => id !== user_id),
                },
            }))
        })

        // Listen for real-time notifications
        socket.on('notification', (notification) => {
            console.log('Received notification:', notification)
            set((state) => ({ notificationCount: state.notificationCount + 1 }))
        })

        // Listen for order status updates
        socket.on('order_status_update', (data) => {
            console.log('Order status update:', data)
        })

        socket.on('error', (error) => {
            console.error('Socket error:', error)
        })

        set({ socket })
    },

    // Disconnect socket
    disconnectSocket: () => {
        const { socket } = get()
        if (socket) {
            socket.disconnect()
            set({ socket: null, isConnected: false })
        }
    },

    // Join a chat room for real-time messages
    joinChat: (chatId) => {
        const { socket } = get()
        if (socket) {
            socket.emit('join_chat', { chat_id: chatId })
        }
    },

    // Leave a chat room
    leaveChat: (chatId) => {
        const { socket } = get()
        if (socket) {
            socket.emit('leave_chat', { chat_id: chatId })
        }
    },

    // Fetch conversations list
    fetchConversations: async () => {
        set({ isLoadingConversations: true, error: null })
        try {
            const response = await api.get('/api/v1/chat/conversations')
            const conversations = response.data.conversations || []
            const unreadCount = conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0)
            set({ conversations, unreadCount, isLoadingConversations: false })
            return conversations
        } catch (error) {
            set({ error: error.message, isLoadingConversations: false })
            return []
        }
    },

    // Fetch messages for a chat
    fetchMessages: async (chatId, page = 1) => {
        set({ isLoadingMessages: page === 1, error: null })
        try {
            const response = await api.get(`/api/v1/chat/${chatId}/messages?page=${page}`)
            const { messages, chat } = response.data

            if (page === 1) {
                set({ messages, currentChat: chat, isLoadingMessages: false })
            } else {
                set((state) => ({
                    messages: [...messages, ...state.messages],
                    isLoadingMessages: false,
                }))
            }

            // Join the chat room for real-time updates
            const { socket } = get()
            if (socket) {
                socket.emit('join_chat', { chat_id: chatId })
                socket.emit('mark_read', { chat_id: chatId })
            }

            return messages
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load chat'
            set({ error: errorMessage, isLoadingMessages: false, currentChat: null, messages: [] })
            throw new Error(errorMessage)
        }
    },

    // Send a message
    sendMessage: async (chatId, content, type = 'text', mediaUrl = null) => {
        set({ isSending: true, error: null })

        try {
            // Send via REST API (backend will emit socket events for real-time delivery)
            const response = await api.post(`/api/v1/chat/${chatId}/send`, {
                content,
                type,
                media_url: mediaUrl
            })

            const newMessage = response.data.message

            // Add message to local state immediately (optimistic update)
            // Deduplicate: check if already added by socket event
            set((state) => {
                const exists = state.messages.some(m => m.id === newMessage.id)
                return {
                    messages: exists ? state.messages : [...state.messages, newMessage],
                    isSending: false,
                }
            })

            return { success: true, message: newMessage }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send message'
            set({ isSending: false, error: errorMessage })
            throw new Error(errorMessage)
        }
    },

    // Start or get chat with a user/seller
    startChat: async (sellerId, productId = null) => {
        set({ isLoadingConversations: true })
        try {
            const response = await api.post('/api/v1/chat/start', {
                seller_id: sellerId,
                product_id: productId,
            })
            set({ isLoadingConversations: false })
            return { success: true, chat: response.data.chat }
        } catch (error) {
            set({ isLoadingConversations: false, error: error.message })
            return { success: false, error: error.message }
        }
    },

    // Set typing status
    setTyping: (chatId, isTyping) => {
        const { socket } = get()
        if (socket) {
            socket.emit('typing', { chat_id: chatId, is_typing: isTyping })
        }
    },

    // Clear current chat and leave room (but keep conversations list)
    clearCurrentChat: () => {
        const { currentChat, socket } = get()
        if (currentChat && socket) {
            socket.emit('leave_chat', { chat_id: currentChat.id })
        }
        set({ currentChat: null, messages: [], error: null })
    },

    // Clear error
    clearError: () => set({ error: null }),
}))

export default useChatStore
