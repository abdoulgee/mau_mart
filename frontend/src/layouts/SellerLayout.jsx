import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const sellerNavItems = [
    { path: '/seller', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/seller/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { path: '/seller/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { path: '/seller/store-settings', label: 'Store', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { path: '/seller/subscription', label: 'Plan', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { path: '/seller/featured', label: 'Featured', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { path: '/seller/ads', label: 'Ads', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
]

export default function SellerLayout() {
    const { user } = useAuthStore()
    const navigate = useNavigate()

    if (!user?.is_seller && user?.role !== 'admin' && user?.role !== 'super_admin') {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Seller Access Required</h2>
                    <p className="text-gray-500 mb-6 text-sm">You need a seller account to access this area.</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/become-seller')} className="btn-primary">Become a Seller</button>
                        <button onClick={() => navigate('/')} className="btn-secondary">Go Home</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50">
            {/* Desktop: sidebar + content */}
            <div className="flex">
                {/* Sidebar - hidden on mobile */}
                <aside className="hidden md:flex flex-col w-64 h-screen bg-gray-900 sticky top-0">
                    {/* Logo */}
                    <div className="p-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-sm">Seller Dashboard</h1>
                                <p className="text-gray-400 text-[11px]">{user?.first_name}'s Store</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {sellerNavItems.map(item => (
                            <NavLink key={item.path} to={item.path} end={item.path === '/seller'}
                                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/10">
                        <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                            Back to Store
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-h-screen">
                    {/* Mobile header */}
                    <div className="md:hidden sticky top-0 z-30 glass border-b border-surface-200/60">
                        <div className="flex items-center justify-between h-14 px-4">
                            <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-surface-100 transition-colors">
                                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <h1 className="text-base font-bold text-gray-900">Seller Dashboard</h1>
                            <div className="w-10" />
                        </div>
                    </div>

                    <div className="p-4 md:p-6 max-w-5xl">
                        <Outlet />
                    </div>

                    {/* Mobile bottom tabs */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-surface-200/60 safe-bottom z-40 shadow-nav">
                        <div className="flex items-center justify-around px-1 py-1.5">
                            {sellerNavItems.slice(0, 5).map(item => (
                                <NavLink key={item.path} to={item.path} end={item.path === '/seller'}
                                    className={({ isActive }) => `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                    {({ isActive }) => (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                                            <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>{item.label}</span>
                                            {isActive && <span className="absolute -bottom-0.5 w-1 h-1 bg-primary-500 rounded-full" />}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
