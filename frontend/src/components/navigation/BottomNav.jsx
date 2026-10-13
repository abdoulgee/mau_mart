import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, MessageSquare, PlusSquare, User } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import cn from '../../utils/cn'

const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/categories', label: 'Browse', icon: LayoutGrid },
    { to: '/sell', label: 'Sell', icon: PlusSquare, auth: true, emphasis: true },
    { to: '/chat', label: 'Messages', icon: MessageSquare, auth: true, badge: true },
    { to: '/profile', label: 'Profile', icon: User, auth: true },
]

export default function BottomNav() {
    const { isAuthenticated } = useAuthStore()
    const { unreadCount } = useChatStore()

    return (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface safe-bottom md:hidden">
            <ul className="grid h-16 grid-cols-5">
                {items.map(({ to, label, icon: Icon, end, auth, badge, emphasis }) => (
                    <li key={to}>
                        <NavLink
                            to={auth && !isAuthenticated ? '/login' : to}
                            end={end}
                            className={({ isActive }) => cn(
                                'relative flex h-full flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors',
                                isActive ? 'text-brand-text' : emphasis ? 'text-fg' : 'text-fg-subtle hover:text-fg'
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand" aria-hidden />}
                                    <span className="relative">
                                        <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                                        {badge && unreadCount > 0 && (
                                            <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-fg tabular">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                                <span className="sr-only"> unread</span>
                                            </span>
                                        )}
                                    </span>
                                    {label}
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
