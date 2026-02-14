import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

const roleColors = {
    user: 'bg-gray-100 text-gray-700',
    seller: 'bg-green-100 text-green-700',
    admin: 'bg-blue-100 text-blue-700',
    super_admin: 'bg-purple-100 text-purple-700',
}

// Edit User Modal
function EditUserModal({ user, onClose, onSaved }) {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        student_id: '',
    })
    const [saving, setSaving] = useState(false)
    const { addToast } = useUIStore()

    useEffect(() => {
        if (user) {
            setForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                student_id: user.student_id || '',
            })
        }
    }, [user])

    if (!user) return null

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.put(`/api/v1/admin/users/${user.id}/edit`, form)
            addToast({ type: 'success', message: 'User info updated!' })
            onSaved()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to update user' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" name="first_name" value={form.first_name} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" name="last_name" value={form.last_name} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input type="text" name="student_id" value={form.student_id} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Reset Password Modal
function ResetPasswordModal({ user, onClose }) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { addToast } = useUIStore()

    if (!user) return null

    const handleReset = async (e) => {
        e.preventDefault()
        if (newPassword.length < 6) {
            addToast({ type: 'error', message: 'Password must be at least 6 characters' })
            return
        }
        if (newPassword !== confirmPassword) {
            addToast({ type: 'error', message: 'Passwords do not match' })
            return
        }
        setSaving(true)
        try {
            await api.post(`/api/v1/admin/users/${user.id}/reset-password`, { new_password: newPassword })
            addToast({ type: 'success', message: `Password reset for ${user.email}!` })
            onClose()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to reset password' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                        <p className="text-sm text-gray-500 mt-1">For: {user.email}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleReset} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Repeat the password"
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <p className="text-xs text-yellow-700">
                            <strong>⚠️ Warning:</strong> This will immediately change the user's password. They will need to use the new password to log in.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-all">
                            {saving ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [selectedUser, setSelectedUser] = useState(null)
    const [editUser, setEditUser] = useState(null)
    const [resetPwUser, setResetPwUser] = useState(null)
    const { addToast } = useUIStore()

    const UserDetailModal = ({ user, onClose }) => {
        if (!user) return null
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
                <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">User Information</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-3xl font-bold">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{user.first_name} {user.last_name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.user}`}>
                                        {user.role}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.is_active ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Email Address</p>
                                <p className="text-gray-900 font-medium">{user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Phone Number</p>
                                <p className="text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Student ID</p>
                                <p className="text-gray-900 font-medium">{user.student_id || 'Not provided'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Joined Date</p>
                                <p className="text-gray-900 font-medium">{new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                        </div>

                        <div className="pt-4 grid grid-cols-3 gap-3">
                            <button
                                onClick={() => {
                                    onClose()
                                    setEditUser(user)
                                }}
                                className="py-3 rounded-xl font-bold transition-all bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200"
                            >
                                ✏️ Edit Info
                            </button>
                            <button
                                onClick={() => {
                                    onClose()
                                    setResetPwUser(user)
                                }}
                                className="py-3 rounded-xl font-bold transition-all bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                            >
                                🔑 Reset PW
                            </button>
                            <button
                                onClick={() => {
                                    handleToggleStatus(user.id)
                                    onClose()
                                }}
                                className={`py-3 rounded-xl font-bold transition-all ${user.is_active
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                    }`}
                            >
                                {user.is_active ? '🚫 Suspend' : '✅ Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    useEffect(() => {
        fetchUsers()
    }, [page, search])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/v1/admin/users', {
                params: { page, limit: 20, search }
            })
            setUsers(response.data.users || [])
            setPagination(response.data.pagination || {})
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to fetch users' })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (userId) => {
        try {
            await api.post(`/api/v1/admin/users/${userId}/toggle-status`)
            addToast({ type: 'success', message: 'User status updated' })
            fetchUsers()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update user status' })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">User</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Role</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Joined</th>
                                <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={6}>
                                            <Skeleton className="h-12 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-medium group-hover:scale-110 transition-transform">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-primary-600 decoration-primary-500 group-hover:underline">{user.first_name} {user.last_name}</p>
                                                    {user.student_id && (
                                                        <p className="text-xs text-gray-500">{user.student_id}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.user}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    className="text-sm px-3 py-1 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                                                    title="Edit user info"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => setResetPwUser(user)}
                                                    className="text-sm px-3 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                                                    title="Reset password"
                                                >
                                                    🔑
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    className={`text-sm px-3 py-1 rounded-lg ${user.is_active
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}
                                                    title={user.is_active ? 'Suspend' : 'Activate'}
                                                >
                                                    {user.is_active ? '🚫' : '✅'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-gray-600">
                        Page {page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                        className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            <UserDetailModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />

            {/* Edit User Modal */}
            <EditUserModal
                user={editUser}
                onClose={() => setEditUser(null)}
                onSaved={() => {
                    setEditUser(null)
                    fetchUsers()
                }}
            />

            {/* Reset Password Modal */}
            <ResetPasswordModal
                user={resetPwUser}
                onClose={() => setResetPwUser(null)}
            />
        </div>
    )
}
