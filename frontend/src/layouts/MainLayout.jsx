import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Wrench, WifiOff } from 'lucide-react'
import BottomNav from '../components/navigation/BottomNav'
import PWAInstallPrompt from '../components/ui/PWAInstallPrompt'
import { EmptyState } from '../components/ui/Feedback'
import useUIStore from '../store/uiStore'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'

// Pages with their own bottom action bar or message composer
const HIDE_BOTTOM_NAV = [/^\/product\/\d+/, /^\/chat\/\d+/, /^\/sell$/]

export default function MainLayout() {
    const { isOnline } = useUIStore()
    const { isAuthenticated, isAdmin } = useAuthStore()
    const { connectSocket, disconnectSocket } = useChatStore()
    const { settings } = useSettingsStore()
    const location = useLocation()

    useEffect(() => {
        if (isAuthenticated) connectSocket()
        else disconnectSocket()
    }, [isAuthenticated, connectSocket, disconnectSocket])

    if (settings.maintenance_mode && !isAdmin()) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <EmptyState icon={Wrench} title="Down for maintenance" message="We're making some improvements. Please check back soon." />
            </div>
        )
    }

    if (!settings.allow_guest_browsing && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    const showBottomNav = !HIDE_BOTTOM_NAV.some((pattern) => pattern.test(location.pathname))

    return (
        <div className="min-h-screen">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
                Skip to content
            </a>
            {!isOnline && (
                <div role="status" className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-xs font-medium text-warning">
                    <WifiOff size={14} aria-hidden />
                    You're offline. Some features may not work.
                </div>
            )}
            <Outlet />
            {showBottomNav && <BottomNav />}
            <PWAInstallPrompt />
        </div>
    )
}
