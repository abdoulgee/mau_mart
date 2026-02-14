import { Outlet, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function AuthLayout() {
    const { isAuthenticated } = useAuthStore()
    const location = useLocation()

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && !location.pathname.includes('verify-otp')) {
        const from = location.state?.from?.pathname || '/'
        return <Navigate to={from} replace />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200/30 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative max-w-lg mx-auto px-4 py-8">
                <Outlet />
            </div>
        </div>
    )
}
