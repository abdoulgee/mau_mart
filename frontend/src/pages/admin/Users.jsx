import { useState, useEffect } from 'react'
import { KeyRound, Lock, Pencil, Search, ShieldCheck, UserCheck, UserX, Users as UsersIcon } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Tabs from '../../components/ui/Tabs'
import Button, { IconButton } from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { Pager } from '../../components/ui/Pagination'
import { Alert, Badge, EmptyState } from '../../components/ui/Feedback'
import { TextField, PasswordField, SelectField } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import api, { errorMessage } from '../../services/api'
import { fullName, timeAgo } from '../../utils/format'

const ROLE_LABELS = { user: 'User', admin: 'Admin', super_admin: 'Super admin' }

/** Mirrors the server rule: only super admins can edit or suspend admin and super admin accounts */
const canManage = (me, u) => u.id === me?.id || me?.role === 'super_admin' || u.role === 'user'

function EditUserModal({ user, isSuper, onClose, onSaved }) {
    const form = useForm({
        first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone || '',
        whatsapp: user.whatsapp ? `+${user.whatsapp}` : '', student_id: user.student_id || '', role: user.role,
    }, {
        first_name: [rules.required()], last_name: [rules.required()],
        email: [rules.required(), rules.email()], phone: [rules.phone()], whatsapp: [rules.phone()],
    })

    const submit = form.handleSubmit(async ({ role, ...values }) => {
        try {
            await api.put(`/api/v1/admin/users/${user.id}/edit`, values)
            if (isSuper && role !== user.role) await api.put(`/api/v1/admin/users/${user.id}/role`, { role })
            onSaved('User updated')
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not update the user'))
        }
    })

    return (
        <Modal open onClose={onClose} title="Edit user" description={user.email}
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={form.submitting}>Save</Button></>}>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <div className="grid grid-cols-2 gap-3">
                    <TextField label="First name" required {...form.field('first_name')} />
                    <TextField label="Last name" required {...form.field('last_name')} />
                </div>
                <TextField label="Email" required type="email" {...form.field('email')} />
                <div className="grid grid-cols-2 gap-3">
                    <TextField label="Phone" type="tel" {...form.field('phone')} />
                    <TextField label="WhatsApp" type="tel" {...form.field('whatsapp')} />
                </div>
                <TextField label="Student ID" optional {...form.field('student_id')} />
                {isSuper && (
                    <SelectField label="Role" hint="Admins can moderate. Super admins can also change settings." {...form.field('role')}>
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </SelectField>
                )}
            </form>
        </Modal>
    )
}

function ResetPasswordModal({ user, onClose, onSaved }) {
    const form = useForm({ new_password: '' }, { new_password: [rules.required(), rules.minLength(8, 'Use at least 8 characters')] })
    const submit = form.handleSubmit(async ({ new_password }) => {
        try {
            await api.post(`/api/v1/admin/users/${user.id}/reset-password`, { new_password })
            onSaved(`Password reset for ${user.email}`)
        } catch (error) {
            throw new Error(errorMessage(error))
        }
    })
    return (
        <Modal open onClose={onClose} title="Reset password" description={`Set a new password for ${fullName(user)}. Share it with them privately.`} size="sm"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={form.submitting}>Reset password</Button></>}>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters" {...form.field('new_password')} />
            </form>
        </Modal>
    )
}

export default function AdminUsers() {
    const { user: me } = useAuthStore()
    const isSuper = me?.role === 'super_admin'
    const { addToast } = useUIStore()
    const [status, setStatus] = useState('')
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [data, setData] = useState({ users: [], pagination: {} })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [editing, setEditing] = useState(null)
    const [resetting, setResetting] = useState(null)
    const [suspending, setSuspending] = useState(null)
    const [working, setWorking] = useState(false)

    const load = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await api.get('/api/v1/admin/users', { params: { page, search: query, status } })
            setData(res.data)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [page, query, status])

    const saved = (message) => {
        setEditing(null)
        setResetting(null)
        addToast({ type: 'success', message })
        load()
    }

    const toggleStatus = async () => {
        setWorking(true)
        try {
            const res = await api.post(`/api/v1/admin/users/${suspending.id}/toggle-status`)
            addToast({ type: 'success', message: res.data.message })
            setSuspending(null)
            load()
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err) })
        } finally {
            setWorking(false)
        }
    }

    const columns = [
        {
            key: 'name', header: 'User', primary: true,
            render: (u) => (
                <div className="flex items-center gap-3">
                    <Avatar user={u} size="sm" />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{fullName(u)}</p>
                        <p className="truncate text-xs text-fg-subtle">{u.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role', header: 'Role',
            render: (u) => u.role === 'user' ? <span className="text-fg-muted">User</span> : <Badge tone="info"><ShieldCheck size={12} aria-hidden />{ROLE_LABELS[u.role]}</Badge>,
        },
        { key: 'listings', header: 'Listings', align: 'right', render: (u) => <span className="tabular">{u.listings_count}</span> },
        {
            key: 'status', header: 'Status',
            render: (u) => !u.is_active ? <Badge tone="danger" dot>Suspended</Badge> : !u.is_verified ? <Badge tone="warning" dot>Unverified</Badge> : <Badge tone="success" dot>Active</Badge>,
        },
        { key: 'joined', header: 'Joined', render: (u) => <span className="text-fg-muted">{timeAgo(u.created_at)}</span> },
        {
            key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
            render: (u) => canManage(me, u) ? (
                <div className="flex justify-end gap-1">
                    <IconButton icon={Pencil} label={`Edit ${fullName(u)}`} size="sm" onClick={() => setEditing(u)} />
                    {isSuper && <IconButton icon={KeyRound} label={`Reset password for ${fullName(u)}`} size="sm" onClick={() => setResetting(u)} />}
                    {u.id !== me?.id && (
                        <IconButton icon={u.is_active ? UserX : UserCheck} label={u.is_active ? `Suspend ${fullName(u)}` : `Reactivate ${fullName(u)}`}
                            size="sm" variant={u.is_active ? 'danger-ghost' : 'ghost'} onClick={() => setSuspending(u)} />
                    )}
                </div>
            ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle" title="Only a super admin can manage this account">
                    <Lock size={14} aria-hidden />Protected
                </span>
            ),
        },
    ]

    return (
        <AdminPage title="Users" description={data.pagination.total != null ? `${data.pagination.total.toLocaleString()} accounts` : undefined}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1) }}
                    options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} />
                <form role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }} className="sm:w-72">
                    <TextField icon={Search} type="search" placeholder="Name, email or student ID" aria-label="Search users"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </form>
            </div>

            <Panel padded={false}>
                <DataTable
                    caption="Users"
                    columns={columns}
                    rows={data.users}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    empty={<EmptyState icon={UsersIcon} title="No users found" message={query ? 'Try a different search.' : undefined} />}
                />
                <Pager page={page} pages={data.pagination.pages} total={data.pagination.total} onChange={setPage} />
            </Panel>

            {editing && <EditUserModal user={editing} isSuper={isSuper} onClose={() => setEditing(null)} onSaved={saved} />}
            {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} onSaved={saved} />}
            <ConfirmDialog
                open={!!suspending}
                title={suspending?.is_active ? 'Suspend this user?' : 'Reactivate this user?'}
                message={suspending?.is_active
                    ? `${fullName(suspending)} won't be able to log in, and their listings will be hidden.`
                    : `${fullName(suspending)} will be able to log in again and their listings will reappear.`}
                confirmLabel={suspending?.is_active ? 'Suspend' : 'Reactivate'}
                danger={suspending?.is_active}
                loading={working}
                onConfirm={toggleStatus}
                onClose={() => setSuspending(null)}
            />
        </AdminPage>
    )
}
