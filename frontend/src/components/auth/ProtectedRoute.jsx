import { Outlet, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ requiredRole = null }) {
    const { isAuthenticated, hasRole, user, accessToken } = useAuthStore()
    const location = useLocation()

    console.log('[ProtectedRoute] Check:', {
        path: location.pathname,
        isAuthenticated,
        hasAccessToken: !!accessToken,
        requiredRole,
        userRole: user?.role
    })

    // Check if user is authenticated
    if (!isAuthenticated) {
        console.log('[ProtectedRoute] Not authenticated, redirecting to login')
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check if user has required role
    if (requiredRole && !hasRole(requiredRole)) {
        // Redirect sellers trying to access admin to their dashboard
        if (requiredRole === 'admin' && hasRole('seller')) {
            return <Navigate to="/seller" replace />  // Fixed: actual route is /seller
        }
        // Redirect regular users trying to access seller/admin pages
        if (requiredRole === 'seller') {
            return <Navigate to="/become-seller" replace />
        }
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
