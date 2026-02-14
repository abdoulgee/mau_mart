import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

export default function Profile() {
    const { user, logout, isAuthenticated } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    const handleLogout = () => {
        logout()
        addToast({ type: 'success', message: 'Logged out successfully' })
        navigate('/')
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Not Logged In</h2>
                    <p className="text-gray-500 mb-6 text-sm">Please login to view your profile</p>
                    <Link to="/login" className="btn-primary px-8">Login</Link>
                </div>
            </div>
        )
    }

    const menuItems = [
        { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'My Orders', link: '/orders', color: 'text-blue-500 bg-blue-50' },
        { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Messages', link: '/chat', color: 'text-emerald-500 bg-emerald-50' },
        { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: 'My Reviews', link: '/my-reviews', color: 'text-primary-500 bg-primary-50' },
        { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Saved Items', link: '/saved', color: 'text-rose-500 bg-rose-50' },
    ]

    const settingsItems = [
        { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Edit Profile', link: '/profile/edit' },
        { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Change Password', link: '/profile/change-password' },
        { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notifications', link: '/profile/notifications' },
        { icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Help & Support', link: '/support' },
    ]

    const MenuItem = ({ item, colored = false }) => (
        <Link to={item.link} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${colored ? item.color : 'text-gray-500 bg-gray-100'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
            </span>
            <span className="flex-1 font-semibold text-sm text-gray-700">{item.label}</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </Link>
    )

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Profile" />
            <div className="p-4 space-y-4">
                {/* User Info Card */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-5 text-white relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-glow ring-2 ring-primary-400/30">
                            {user.avatar_url ? (<img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />) : (user.first_name[0] + user.last_name[0])}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold">{user.first_name} {user.last_name}</h2>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            {user.is_seller && (
                                <span className="inline-flex items-center gap-1 text-xs text-primary-300 bg-primary-500/20 px-2.5 py-0.5 rounded-full mt-1.5 font-semibold">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                                    Seller
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Seller Dashboard Link */}
                {user.is_seller && (
                    <Link to="/seller" className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-glow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Seller Dashboard</h3>
                                    <p className="text-xs text-white/70">Manage your store & products</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </Link>
                )}

                {/* Become Seller CTA */}
                {!user.is_seller && !user.seller_request && (
                    <Link to="/become-seller" className="card border-2 border-dashed border-primary-300 bg-primary-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm text-primary-700">Become a Seller</h3>
                                <p className="text-xs text-primary-600">Start selling on MAU MART today!</p>
                            </div>
                            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </Link>
                )}

                {/* Pending Application */}
                {!user.is_seller && user.seller_request?.status === 'pending' && (
                    <div className="card border-2 border-amber-200 bg-amber-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm text-amber-700">Application Pending</h3>
                                <p className="text-xs text-amber-600">We're reviewing your application</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="font-bold text-sm text-gray-900 mb-3">Quick Actions</h3>
                    <div className="space-y-0.5">{menuItems.map((item, i) => <MenuItem key={i} item={item} colored />)}</div>
                </div>

                {/* Settings */}
                <div className="card">
                    <h3 className="font-bold text-sm text-gray-900 mb-3">Settings</h3>
                    <div className="space-y-0.5">{settingsItems.map((item, i) => <MenuItem key={i} item={item} />)}</div>
                </div>

                {/* Admin Panel */}
                {(user.role === 'admin' || user.role === 'super_admin') && (
                    <Link to="/admin" className="card bg-gray-900 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div className="flex-1"><h3 className="font-bold text-sm">Admin Panel</h3><p className="text-xs text-gray-400">Manage the platform</p></div>
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </Link>
                )}

                {/* Logout */}
                <button onClick={() => setShowLogoutModal(true)} className="w-full card text-center text-red-500 font-bold text-sm hover:bg-red-50 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </div>
                </button>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-scale-in shadow-elevated">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 mx-auto mb-3 bg-red-50 rounded-2xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Logout?</h3>
                            <p className="text-gray-500 text-sm mt-1">Are you sure you want to logout?</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleLogout} className="btn-danger flex-1">Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
