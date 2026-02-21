import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import { useEffect, useState } from 'react'
import getImageUrl from '../../utils/imageUrl'

// Shared Navigation Links for Desktop
function NavLinks() {
    const { isAuthenticated, user } = useAuthStore()
    const { unreadCount } = useChatStore()
    const isSeller = user?.is_seller || user?.role === 'admin' || user?.role === 'super_admin'

    const linkClass = ({ isActive }) => `
        flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
        ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-900 hover:bg-surface-50'}
    `

    return (
        <nav className="hidden md:flex items-center gap-2 ml-6">
            <NavLink to="/" className={linkClass}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Home
            </NavLink>
            <NavLink to="/categories" className={linkClass}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Explore
            </NavLink>
            {isSeller && isAuthenticated && (
                <NavLink to="/seller" className={linkClass}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                    Sell
                </NavLink>
            )}
            <NavLink to={isAuthenticated ? "/chat" : "/login"} className={linkClass}>
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                Chat
            </NavLink>
            <NavLink to={isAuthenticated ? "/profile" : "/login"} className={linkClass}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Profile
            </NavLink>
        </nav>
    )
}

function Header({
    title,
    showBack = false,
    rightAction = null,
    transparent = false,
    className = ''
}) {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuthStore()

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    // Site name + logo for desktop header
    const [siteName, setSiteName] = useState('MAU MART')
    const [siteLogo, setSiteLogo] = useState('')
    useEffect(() => {
        try {
            const settings = JSON.parse(localStorage.getItem('app-settings') || '{}')
            if (settings.site_name) setSiteName(settings.site_name)
            if (settings.site_logo_url) setSiteLogo(settings.site_logo_url)
        } catch (e) { }
    }, [])

    return (
        <header
            className={`
        sticky top-0 z-30 safe-top
        ${transparent ? 'bg-transparent' : 'glass border-b border-surface-200/60'}
        ${className}
      `}
        >
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl md:max-w-5xl xl:max-w-6xl mx-auto">
                {/* Left side / Logo for Desktop */}
                <div className="flex items-center">
                    {/* Mobile Back Button */}
                    <div className="w-10 flex lg:hidden items-center justify-start">
                        {showBack && (
                            <button
                                onClick={handleBack}
                                className="p-2 -ml-2 rounded-2xl hover:bg-surface-100 transition-colors"
                                aria-label="Go back"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Desktop Logo */}
                    <div
                        onClick={() => navigate('/')}
                        className="hidden lg:flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-glow overflow-hidden">
                            {siteLogo ? (
                                <img src={getImageUrl(siteLogo)} alt={siteName} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-lg font-extrabold text-gold tracking-tighter uppercase">{siteName}</span>
                    </div>

                    {/* Navigation Interjection */}
                    <NavLinks />
                </div>

                {/* Title (Mobile Only) */}
                <h1 className="text-base font-bold text-gray-900 truncate flex-1 text-center tracking-tight lg:hidden">
                    {title}
                </h1>

                {/* Desktop Search & Actions */}
                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center mr-2">
                        {/* Desktop Search Trigger */}
                        <button
                            onClick={() => navigate('/search')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-surface-200 transition-all text-sm font-medium border border-transparent hover:border-surface-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Search...</span>
                        </button>
                    </div>

                    {/* Right side actions */}
                    <div className="min-w-10 flex items-center justify-end">
                        {rightAction}
                    </div>
                </div>
            </div>
        </header>
    )
}

// Search Header variant
export function SearchHeader({ placeholder = 'Search products...', onSearch, value, onChange }) {
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        if (value?.trim()) {
            onSearch?.(value)
            navigate(`/search?q=${encodeURIComponent(value)}`)
        }
    }

    return (
        <header className="sticky top-0 z-30 glass border-b border-surface-200/60 safe-top">
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl md:max-w-5xl xl:max-w-6xl mx-auto">
                {/* Desktop Logo */}
                <div
                    onClick={() => navigate('/')}
                    className="hidden lg:flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity mr-4"
                >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-glow overflow-hidden">
                        {(() => { try { const s = JSON.parse(localStorage.getItem('app-settings') || '{}'); if (s.site_logo_url) return <img src={getImageUrl(s.site_logo_url)} alt="" className="w-full h-full object-cover" /> } catch (e) { } return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> })()}
                    </div>
                </div>

                <div className="flex-1 max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <div className="relative">
                            <input
                                type="search"
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) => onChange?.(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-surface-100 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 text-sm font-medium"
                            />
                            <svg
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </form>
                </div>

                <NavLinks />
            </div>
        </header>
    )
}

// Logo Header for Home page
export function LogoHeader() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    // Dynamic site name + logo from settings
    const [siteName, setSiteName] = useState('MAU MART')
    const [siteLogo, setSiteLogo] = useState('')
    useEffect(() => {
        try {
            const settings = JSON.parse(localStorage.getItem('app-settings') || '{}')
            if (settings.site_name) setSiteName(settings.site_name)
            if (settings.site_logo_url) setSiteLogo(settings.site_logo_url)
        } catch (e) { }
    }, [])

    return (
        <header className="sticky top-0 z-30 glass border-b border-surface-200/60 safe-top">
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl md:max-w-5xl xl:max-w-6xl mx-auto">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer flex items-center gap-2.5"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow overflow-hidden">
                            {siteLogo ? (
                                <img src={getImageUrl(siteLogo)} alt={siteName} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-xl font-extrabold text-gold tracking-tight lowercase">
                            <span className="uppercase">{siteName.charAt(0)}</span>{siteName.slice(1)}
                        </span>
                    </div>

                    <NavLinks />
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1 lg:gap-3">
                    <div className="hidden lg:flex items-center mr-2">
                        {/* Desktop Search Trigger */}
                        <button
                            onClick={() => navigate('/search')}
                            className="flex items-center gap-2 px-4 py-1.5 bg-surface-100 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-surface-200 transition-all text-sm font-medium border border-transparent"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Search products...</span>
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/profile/notifications')}
                        className="p-2 rounded-xl hover:bg-surface-100 transition-colors relative"
                        aria-label="Notifications"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <button
                        onClick={() => navigate('/search')}
                        className="p-2 rounded-xl hover:bg-surface-100 transition-colors lg:hidden"
                        aria-label="Search"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    )
}

// Export Header as both default and named export to support all import patterns
export { Header }
export default Header
