import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    ExternalLink, Flag, Image, LayoutDashboard, LayoutGrid, LogOut, Mail, Menu, Package, Settings, Users, X,
} from 'lucide-react'
import Logo from '../components/navigation/Logo'
import Avatar from '../components/ui/Avatar'
import { IconButton } from '../components/ui/Button'
import useAuthStore from '../store/authStore'
import { fullName } from '../utils/format'
import cn from '../utils/cn'

const nav = [
    { group: 'Overview', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
        group: 'Marketplace',
        items: [
            { to: '/admin/products', label: 'Listings', icon: Package },
            { to: '/admin/users', label: 'Users', icon: Users },
            { to: '/admin/reports', label: 'Reports', icon: Flag },
            { to: '/admin/categories', label: 'Categories', icon: LayoutGrid },
        ],
    },
    {
        group: 'Settings',
        superOnly: true,
        items: [
            { to: '/admin/home-page', label: 'Home page', icon: Image },
            { to: '/admin/settings', label: 'App settings', icon: Settings },
            { to: '/admin/smtp', label: 'Email', icon: Mail },
        ],
    },
]

function SidebarContent({ onNavigate }) {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const isSuper = user?.role === 'super_admin'

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b border-line px-4">
                <Logo to="/admin/dashboard" />
                <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-2xs font-medium text-fg-muted">Admin</span>
            </div>
            <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                {nav.filter((g) => isSuper || !g.superOnly).map((group) => (
                    <div key={group.group}>
                        <p className="mb-1 px-3 text-2xs font-medium uppercase tracking-wide text-fg-subtle">{group.group}</p>
                        <ul className="space-y-0.5">
                            {group.items.map(({ to, label, icon: Icon }) => (
                                <li key={to}>
                                    <NavLink
                                        to={to}
                                        onClick={onNavigate}
                                        className={({ isActive }) => cn(
                                            'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                                            isActive ? 'bg-surface-muted text-fg' : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                                        )}
                                    >
                                        <Icon size={18} aria-hidden />
                                        {label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div>
                    <NavLink to="/" className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-fg-muted hover:bg-surface-hover hover:text-fg">
                        <ExternalLink size={18} aria-hidden />View marketplace
                    </NavLink>
                </div>
            </nav>
            <div className="flex items-center gap-3 border-t border-line p-3">
                <Avatar user={user} size="sm" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{fullName(user)}</p>
                    <p className="text-xs text-fg-subtle">{isSuper ? 'Super admin' : 'Admin'}</p>
                </div>
                <IconButton icon={LogOut} label="Log out" size="sm" onClick={() => { logout(); navigate('/login') }} />
            </div>
        </div>
    )
}

export default function AdminLayout() {
    const [open, setOpen] = useState(false)
    const location = useLocation()

    useEffect(() => setOpen(false), [location.pathname])

    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === 'Escape' && setOpen(false)
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    return (
        <div className="min-h-screen">
            <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-surface lg:block">
                <SidebarContent />
            </aside>

            {/* Mobile drawer */}
            {open && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
                    <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-popover animate-slide-up">
                        <IconButton icon={X} label="Close menu" className="absolute right-2 top-3" onClick={() => setOpen(false)} />
                        <SidebarContent onNavigate={() => setOpen(false)} />
                    </aside>
                </div>
            )}

            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface px-2 lg:hidden">
                <IconButton icon={Menu} label="Open menu" onClick={() => setOpen(true)} aria-expanded={open} />
                <Logo to="/admin/dashboard" />
                <span className="rounded bg-surface-muted px-1.5 py-0.5 text-2xs font-medium text-fg-muted">Admin</span>
            </header>

            <main id="main" className="lg:pl-60">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

/** Title row for admin pages */
export function AdminPage({ title, description, actions, children }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-fg md:text-2xl">{title}</h1>
                    {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            {children}
        </div>
    )
}
