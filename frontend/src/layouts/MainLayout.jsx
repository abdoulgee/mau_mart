import { Outlet, Navigate, useLocation } from 'react-router-dom'
import BottomNav from '../components/navigation/BottomNav'
import PWAInstallPrompt from '../components/ui/PWAInstallPrompt'
import useUIStore from '../store/uiStore'
import { useEffect } from 'react'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'

export default function MainLayout() {
    const { isOnline } = useUIStore()
    const { isAuthenticated, hasRole } = useAuthStore()
    const { connectSocket, disconnectSocket, fetchConversations } = useChatStore()
    const { settings } = useSettingsStore()
    const location = useLocation()

    // Connect to chat socket when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            connectSocket()
            // fetchConversations()
        }

        return () => {
            disconnectSocket()
        }
    }, [isAuthenticated])

    // Maintenance mode check (non-admin users see maintenance page)
    if (settings.maintenance_mode && !hasRole('admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Under Maintenance</h1>
                    <p className="text-gray-500 text-sm">We're currently performing maintenance. Please check back soon!</p>
                </div>
            </div>
        )
    }

    // Guest browsing check
    if (!settings.allow_guest_browsing && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return (
        <div className="min-h-screen bg-surface-50">
            {/* Offline banner */}
            {!isOnline && (
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-2.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                    </svg>
                    You are offline. Some features may not work.
                </div>
            )}

            {/* Main content area — responsive: mobile full width, tablet/desktop centered and wider */}
            <main className="pb-20 md:pb-6 max-w-2xl md:max-w-5xl xl:max-w-6xl mx-auto transition-all">
                <Outlet />
            </main>

            {/* Bottom navigation — visible only on mobile */}
            <div className="md:hidden">
                <BottomNav />
            </div>

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </div>
    )
}
