import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Logo from '../components/navigation/Logo'
import useAuthStore from '../store/authStore'

export default function AuthLayout() {
    const { isAuthenticated } = useAuthStore()
    const location = useLocation()

    if (isAuthenticated && !location.pathname.includes('verify-otp')) {
        const from = location.state?.from
        return <Navigate to={from ? from.pathname + (from.search || '') : '/'} replace />
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="px-4 py-4 sm:px-6">
                <Logo />
            </header>
            <main id="main" className="flex flex-1 items-start justify-center px-4 pb-12 pt-6 sm:items-center sm:pt-0">
                <div className="w-full max-w-sm">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

/** Heading block shared by the auth screens */
export function AuthHeading({ title, children }) {
    return (
        <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold text-fg">{title}</h1>
            {children && <p className="text-sm text-fg-muted">{children}</p>}
        </div>
    )
}
