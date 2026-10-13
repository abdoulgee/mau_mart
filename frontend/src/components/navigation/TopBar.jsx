import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, Heart, LayoutGrid, MessageSquare, Plus, Search } from 'lucide-react'
import Logo from './Logo'
import Button, { IconButton } from '../ui/Button'
import Avatar from '../ui/Avatar'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import cn from '../../utils/cn'

function CountBadge({ count }) {
    if (!count) return null
    return (
        <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-2xs font-semibold text-brand-fg tabular">
            {count > 99 ? '99+' : count}
        </span>
    )
}

function DesktopSearch() {
    const navigate = useNavigate()
    const location = useLocation()
    const [params] = useSearchParams()
    const [query, setQuery] = useState('')

    useEffect(() => {
        setQuery(location.pathname === '/search' ? params.get('q') || '' : '')
    }, [location.pathname, params])

    const submit = (e) => {
        e.preventDefault()
        const q = query.trim()
        navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    }

    return (
        <form role="search" onSubmit={submit} className="relative w-full max-w-md">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search listings"
                aria-label="Search listings"
                className="h-9 w-full rounded-lg border border-line bg-surface-muted pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle hover:border-line-strong focus:border-brand focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-0"
            />
        </form>
    )
}

function DesktopNav() {
    const { isAuthenticated, user } = useAuthStore()
    const { unreadCount, notificationCount } = useChatStore()
    const link = ({ isActive }) => cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
        isActive ? 'bg-surface-muted text-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
    )

    return (
        <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to="/categories" className={link}><LayoutGrid size={16} aria-hidden />Browse</NavLink>
            {isAuthenticated ? (
                <>
                    <NavLink to="/chat" className={link}>
                        <MessageSquare size={16} aria-hidden />Messages<CountBadge count={unreadCount} />
                    </NavLink>
                    <NavLink to="/saved" className={link}><Heart size={16} aria-hidden />Saved</NavLink>
                    <IconButton icon={Bell} label="Notifications" to="/notifications" badge={notificationCount > 0} />
                    <Button to="/sell" size="md" className="ml-1">Sell</Button>
                    <NavLink to="/profile" className="ml-1 rounded-full" aria-label="Your profile">
                        <Avatar user={user} size="sm" />
                    </NavLink>
                </>
            ) : (
                <>
                    <Button to="/login" variant="ghost">Log in</Button>
                    <Button to="/signup">Sign up</Button>
                </>
            )}
        </nav>
    )
}

/**
 * Sticky top bar. Desktop: logo, search and the main navigation.
 * Mobile: back button (or logo), page title and page-specific actions.
 */
export default function TopBar({ title, back = false, actions, mobileContent }) {
    const navigate = useNavigate()
    const { notificationCount } = useChatStore()
    const { isAuthenticated } = useAuthStore()

    const goBack = () => (window.history.length > 2 ? navigate(-1) : navigate('/'))

    return (
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur safe-top">
            {/* Desktop */}
            <div className="page hidden h-16 items-center gap-6 md:flex">
                <Logo />
                <div className="flex flex-1 justify-center"><DesktopSearch /></div>
                <DesktopNav />
            </div>

            {/* Mobile */}
            <div className="flex h-14 items-center gap-2 px-2 md:hidden">
                {mobileContent || (
                    <>
                        {back ? (
                            <IconButton icon={ArrowLeft} label="Back" onClick={goBack} />
                        ) : (
                            <Logo className="ml-2" />
                        )}
                        {back && title && <p className="min-w-0 flex-1 truncate text-base font-semibold" aria-hidden>{title}</p>}
                        <div className="ml-auto flex items-center">
                            {actions ?? (
                                <>
                                    <IconButton icon={Search} label="Search" to="/search" />
                                    {isAuthenticated && <IconButton icon={Bell} label="Notifications" to="/notifications" badge={notificationCount > 0} />}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    )
}
