import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'

const homeItem = {
    path: '/',
    label: 'Home',
    icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    iconFilled: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
    ),
}

const categoriesItem = {
    path: '/categories',
    label: 'Explore',
    icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    iconFilled: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
        </svg>
    ),
}

const sellItem = {
    path: '/seller',
    label: 'Sell',
    icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    ),
    iconFilled: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    special: true,
}

const chatItem = {
    path: '/chat',
    label: 'Chat',
    icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    iconFilled: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
        </svg>
    ),
    showBadge: true,
}

const profileItem = {
    path: '/profile',
    label: 'Profile',
    icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    iconFilled: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    ),
}

export default function BottomNav() {
    const { isAuthenticated, user } = useAuthStore()
    const { unreadCount } = useChatStore()

    const isSeller = user?.is_seller || user?.role === 'admin' || user?.role === 'super_admin'

    // Build nav items based on user role
    const getNavItems = () => {
        const items = [homeItem, categoriesItem]

        // Only show Sell button for sellers/admins
        if (isSeller && isAuthenticated) {
            items.push(sellItem)
        }

        // Chat requires auth — redirect to login if not authenticated
        items.push({ ...chatItem, path: isAuthenticated ? '/chat' : '/login' })
        items.push({ ...profileItem, path: isAuthenticated ? '/profile' : '/login' })

        return items
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-surface-200/60 safe-bottom z-40 shadow-nav md:hidden">
            <div className="max-w-2xl lg:max-w-5xl mx-auto">
                <div className="flex items-center justify-around px-2 py-1.5">
                    {getNavItems().map((item) => (
                        <NavLink
                            key={item.path + item.label}
                            to={item.path}
                            className={({ isActive }) => `
                relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200
                ${item.special
                                    ? 'bg-gradient-to-r from-primary-400 to-primary-600 text-white shadow-glow -mt-5 p-3 rounded-full w-12 h-12 flex items-center justify-center'
                                    : isActive
                                        ? 'text-primary-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                }
              `}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={item.special ? '' : ''}>
                                        {isActive && !item.special ? item.iconFilled : item.icon}
                                    </span>
                                    {!item.special && (
                                        <span className={`text-[10px] mt-0.5 font-semibold tracking-wide ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                    {/* Active indicator dot */}
                                    {isActive && !item.special && (
                                        <span className="absolute -bottom-0.5 w-1 h-1 bg-primary-500 rounded-full" />
                                    )}
                                    {/* Unread badge */}
                                    {item.showBadge && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    )
}
