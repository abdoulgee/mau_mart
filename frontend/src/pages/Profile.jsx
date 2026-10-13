import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Bell, ChevronRight, Heart, KeyRound, LayoutDashboard, LifeBuoy, LogOut, MessageCircle, MessageSquare,
    Moon, Package, Plus, UserPen,
} from 'lucide-react'
import Page from '../components/navigation/Page'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'
import { ConfirmDialog } from '../components/ui/Modal'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import { fullName } from '../utils/format'

function MenuGroup({ title, children }) {
    return (
        <section>
            <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-fg-subtle">{title}</h2>
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">{children}</ul>
        </section>
    )
}

function MenuItem({ to, icon: Icon, label, hint }) {
    return (
        <li>
            <Link to={to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover">
                <Icon size={18} aria-hidden className="text-fg-muted" />
                <span className="flex-1 text-sm font-medium text-fg">{label}</span>
                {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
                <ChevronRight size={16} aria-hidden className="text-fg-subtle" />
            </Link>
        </li>
    )
}

export default function Profile() {
    const { user, logout, fetchProfile, isAdmin } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const [confirmLogout, setConfirmLogout] = useState(false)
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const toggleDark = () => {
        const next = !dark
        setDark(next)
        document.documentElement.classList.toggle('dark', next)
        localStorage.setItem('theme', next ? 'dark' : 'light')
    }

    const handleLogout = () => {
        logout()
        addToast({ type: 'success', message: 'You have been logged out' })
        navigate('/')
    }

    if (!user) return null

    return (
        <Page title="Profile" width="narrow">
            <div className="space-y-8">
                <section className="flex items-center gap-4">
                    <Avatar user={user} size="xl" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-fg">{fullName(user)}</p>
                        <p className="truncate text-sm text-fg-muted">{user.email}</p>
                        <Link to={`/user/${user.id}`} className="text-sm font-medium text-brand-text hover:underline">View public profile</Link>
                    </div>
                </section>

                {!user.whatsapp && (
                    <Alert tone="info" icon={MessageCircle} action={<Button to="/profile/edit" size="sm" variant="secondary">Add</Button>}>
                        Add a WhatsApp number so buyers can reach you faster.
                    </Alert>
                )}

                <Button to="/sell" icon={Plus} fullWidth size="lg">Post a listing</Button>

                <MenuGroup title="Marketplace">
                    <MenuItem to="/my-listings" icon={Package} label="My listings" />
                    <MenuItem to="/chat" icon={MessageSquare} label="Messages" />
                    <MenuItem to="/saved" icon={Heart} label="Saved" />
                    <MenuItem to="/notifications" icon={Bell} label="Notifications" />
                </MenuGroup>

                <MenuGroup title="Account">
                    <MenuItem to="/profile/edit" icon={UserPen} label="Edit profile" />
                    <MenuItem to="/profile/change-password" icon={KeyRound} label="Change password" />
                    <li>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Moon size={18} aria-hidden className="text-fg-muted" />
                            <span id="dark-label" className="flex-1 text-sm font-medium text-fg">Dark theme</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={dark}
                                aria-labelledby="dark-label"
                                onClick={toggleDark}
                                className={`relative h-6 w-11 rounded-full transition-colors ${dark ? 'bg-brand' : 'bg-line-strong'}`}
                            >
                                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface shadow-card transition-transform ${dark ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                    </li>
                    <MenuItem to="/support" icon={LifeBuoy} label="Help and safety" />
                    {isAdmin() && <MenuItem to="/admin" icon={LayoutDashboard} label="Admin panel" />}
                </MenuGroup>

                <Button variant="danger-ghost" icon={LogOut} fullWidth onClick={() => setConfirmLogout(true)}>Log out</Button>
            </div>

            <ConfirmDialog
                open={confirmLogout}
                title="Log out?"
                message="You'll need to log in again to message sellers or post listings."
                confirmLabel="Log out"
                onConfirm={handleLogout}
                onClose={() => setConfirmLogout(false)}
            />
        </Page>
    )
}
