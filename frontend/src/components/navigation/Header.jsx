import { useNavigate, useLocation } from 'react-router-dom'

function Header({
    title,
    showBack = false,
    rightAction = null,
    transparent = false,
    className = ''
}) {
    const navigate = useNavigate()
    const location = useLocation()

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    return (
        <header
            className={`
        sticky top-0 z-30 safe-top
        ${transparent ? 'bg-transparent' : 'glass border-b border-surface-200/60'}
        ${className}
      `}
        >
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
                {/* Left side */}
                <div className="w-10 flex items-center justify-start">
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

                {/* Title */}
                <h1 className="text-base font-bold text-gray-900 truncate flex-1 text-center tracking-tight">
                    {title}
                </h1>

                {/* Right side */}
                <div className="w-10 flex items-center justify-end">
                    {rightAction}
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
            <div className="px-4 py-3 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <input
                            type="search"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-surface-100 border-0 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-medium"
                        />
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </form>
            </div>
        </header>
    )
}

// Logo Header for Home page
export function LogoHeader() {
    const navigate = useNavigate()

    // Dynamic site name from settings
    let siteName = 'MAU MART'
    try {
        const useSettingsStore = require('../../store/settingsStore').default
        siteName = useSettingsStore.getState().settings.site_name || 'MAU MART'
    } catch { }

    return (
        <header className="sticky top-0 z-30 glass border-b border-surface-200/60 safe-top">
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <span className="text-xl font-extrabold text-gold tracking-tight">{siteName}</span>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1">
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
                        className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
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
