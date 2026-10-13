import { Outlet, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ requiredRole = null }) {
    const { isAuthenticated, isAdmin, isSuperAdmin } = useAuthStore()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (requiredRole === 'admin' && !isAdmin()) {
        return <Navigate to="/" replace />
    }

    if (requiredRole === 'super_admin' && !isSuperAdmin()) {
        return <Navigate to={isAdmin() ? '/admin/dashboard' : '/'} replace />
    }

    return <Outlet />
}
