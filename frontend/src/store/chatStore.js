import { create } from 'zustand'
import { io } from 'socket.io-client'
import api, { errorMessage } from '../services/api'
import useAuthStore from './authStore'
import { API_URL } from '../config'

const myId = () => useAuthStore.getState().user?.id

const useChatStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    conversations: [],
    isLoadingConversations: false,
    currentChat: null,
    messages: [],
    isLoadingMessages: false,
    error: null,
    unreadCount: 0,
    notificationCount: 0,
    typingUsers: {},

    connectSocket: () => {
        if (get().socket || !useAuthStore.getState().accessToken) return

        const socket = io(API_URL, {
            // A function so every (re)connect sends the current token
            auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
            transports: ['websocket', 'polling'],
        })

        let authRetries = 0
        socket.on('connect', () => {
            authRetries = 0
            set({ isConnected: true })
            get().fetchUnreadCount()
            const { currentChat } = get()
            if (currentChat) socket.emit('join_chat', { chat_id: currentChat.id })
        })

        socket.on('disconnect', () => set({ isConnected: false }))

        // The server refuses expired tokens; a REST call refreshes it, then retry
        socket.on('connect_error', async () => {
            if (authRetries >= 2 || !useAuthStore.getState().isAuthenticated) return
            authRetries += 1
            try {
                await api.get('/api/v1/auth/me')
                socket.connect()
            } catch {
                /* logged out by the API layer */
            }
        })

        const receive = (message) => {
            const { currentChat, messages } = get()
            const isOpen = currentChat?.id === message.chat_id

            if (isOpen) {
                if (!messages.some((m) => m.id === message.id)) {
                    set({ messages: [...messages, message] })
                }
                if (message.sender_id !== myId()) {
                    socket.emit('mark_read', { chat_id: message.chat_id })
                }
            } else if (message.sender_id !== myId()) {
                set((state) => ({ unreadCount: state.unreadCount + 1 }))
            }

            // Keep the conversation list fresh
            const known = get().conversations.some((c) => c.id === message.chat_id)
            if (!known) {
                get().fetchConversations({ silent: true })
                return
            }
            set((state) => ({
                conversations: state.conversations
                    .map((c) => c.id === message.chat_id ? {
                        ...c,
                        last_message: message,
                        last_message_at: message.created_at,
                        unread_count: !isOpen && message.sender_id !== myId() ? (c.unread_count || 0) + 1 : c.unread_count,
                    } : c)
                    .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)),
            }))
        }

        // Rooms and personal notifications can both deliver a message; `receive` de-duplicates
        socket.on('new_message', receive)
        socket.on('new_message_notification', ({ message }) => receive(message))

        socket.on('messages_read', ({ chat_id, read_by }) => {
            if (read_by === myId()) return
            set((state) => ({
                messages: state.messages.map((m) =>
                    m.chat_id === chat_id && m.sender_id !== read_by ? { ...m, is_read: true } : m
                ),
            }))
        })

        socket.on('user_typing', ({ chat_id, user_id, is_typing }) => {
            set((state) => {
                const current = (state.typingUsers[chat_id] || []).filter((id) => id !== user_id)
                return { typingUsers: { ...state.typingUsers, [chat_id]: is_typing ? [...current, user_id] : current } }
            })
        })

        socket.on('notification', (notification) => {
            if (notification.type !== 'chat') {
                set((state) => ({ notificationCount: state.notificationCount + 1 }))
            }
        })

        set({ socket })
    },

    disconnectSocket: () => {
        get().socket?.disconnect()
        set({ socket: null, isConnected: false, conversations: [], unreadCount: 0, notificationCount: 0 })
    },

    fetchUnreadCount: async () => {
        try {
            const { data } = await api.get('/api/v1/chat/unread-count')
            set({ unreadCount: data.unread_count })
        } catch { /* ignore */ }
    },

    fetchConversations: async ({ silent = false } = {}) => {
        if (!silent) set({ isLoadingConversations: true })
        try {
            const { data } = await api.get('/api/v1/chat/conversations')
            const conversations = data.conversations || []
            set({
                conversations,
                unreadCount: conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
            })
        } catch (error) {
            set({ error: errorMessage(error, 'Failed to load chats') })
        } finally {
            set({ isLoadingConversations: false })
        }
    },

    openChat: async (chatId) => {
        chatId = Number(chatId)
        set({ isLoadingMessages: true, error: null, currentChat: null, messages: [] })
        try {
            const { data } = await api.get(`/api/v1/chat/${chatId}/messages`)
            set({ currentChat: data.chat, messages: data.messages })
            get().socket?.emit('join_chat', { chat_id: chatId })
            // Opening marks messages read on the server
            set((state) => ({
                conversations: state.conversations.map((c) => c.id === chatId ? { ...c, unread_count: 0 } : c),
            }))
            get().fetchUnreadCount()
        } catch (error) {
            set({ error: errorMessage(error, 'Failed to load chat') })
        } finally {
            set({ isLoadingMessages: false })
        }
    },

    closeChat: () => {
        const { currentChat, socket } = get()
        if (currentChat) socket?.emit('leave_chat', { chat_id: currentChat.id })
        set({ currentChat: null, messages: [], error: null })
    },

    sendMessage: async (chatId, content, mediaUrl = null) => {
        const { data } = await api.post(`/api/v1/chat/${chatId}/send`, { content, media_url: mediaUrl })
        const message = data.message
        set((state) => ({
            messages: state.messages.some((m) => m.id === message.id) ? state.messages : [...state.messages, message],
        }))
        return message
    },

    // Opens (or reuses) the conversation about a listing, or with a user
    startChat: async ({ productId, userId }) => {
        const { data } = await api.post('/api/v1/chat/start', productId ? { product_id: productId } : { user_id: userId })
        return data.chat
    },

    setTyping: (chatId, isTyping) => {
        get().socket?.emit('typing', { chat_id: chatId, is_typing: isTyping })
    },

    resetNotificationCount: () => set({ notificationCount: 0 }),
}))

export default useChatStore
