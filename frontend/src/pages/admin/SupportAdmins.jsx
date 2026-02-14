import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

const AVAILABLE_PERMISSIONS = [
    { key: 'dashboard', label: 'Dashboard', desc: 'View admin dashboard overview' },
    { key: 'users', label: 'Manage Users', desc: 'View and moderate user accounts' },
    { key: 'stores', label: 'Manage Stores', desc: 'View, verify, and suspend stores' },
    { key: 'store_requests', label: 'Store Requests', desc: 'Approve or reject seller applications' },
    { key: 'products', label: 'Manage Products', desc: 'View and moderate products' },
    { key: 'categories', label: 'Categories', desc: 'Manage product categories' },
    { key: 'orders', label: 'Orders', desc: 'View and manage orders' },
    { key: 'reports', label: 'Reports', desc: 'Review and resolve user reports' },
    { key: 'reviews', label: 'Reviews', desc: 'Moderate product reviews' },
]

const PermissionCheckboxes = ({ selected, onToggle }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AVAILABLE_PERMISSIONS.map(perm => (
            <label
                key={perm.key}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected.includes(perm.key)
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
            >
                <input
                    type="checkbox"
                    checked={selected.includes(perm.key)}
                    onChange={() => onToggle(perm.key)}
                    className="w-4 h-4 rounded text-primary-600 mt-0.5"
                />
                <div>
                    <p className="text-sm font-semibold text-gray-900">{perm.label}</p>
                    <p className="text-xs text-gray-500">{perm.desc}</p>
                </div>
            </label>
        ))}
    </div>
)

export default function AdminSupportAdmins() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editAdmin, setEditAdmin] = useState(null)
    const [editPermissions, setEditPermissions] = useState([])
    const [editSaving, setEditSaving] = useState(false)
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', phone: '', password: '', permissions: ['dashboard']
    })
    const { addToast } = useUIStore()

    useEffect(() => { fetchAdmins() }, [])

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/api/v1/admin/support-admins')
            setAdmins(response.data.support_admins || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to fetch support admins' })
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const togglePermission = (key) => {
        setForm(prev => {
            const perms = prev.permissions.includes(key)
                ? prev.permissions.filter(p => p !== key)
                : [...prev.permissions, key]
            return { ...prev, permissions: perms }
        })
    }

    const toggleEditPermission = (key) => {
        setEditPermissions(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        )
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (form.permissions.length === 0) {
            addToast({ type: 'error', message: 'Select at least one permission' })
            return
        }
        setSaving(true)
        try {
            await api.post('/api/v1/admin/support-admins', form)
            addToast({ type: 'success', message: 'Support admin created!' })
            setShowForm(false)
            setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', permissions: ['dashboard'] })
            fetchAdmins()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to create support admin' })
        } finally {
            setSaving(false)
        }
    }

    const handleToggleStatus = async (admin) => {
        try {
            await api.put(`/api/v1/admin/support-admins/${admin.id}`, {
                permissions: admin.permissions || [],
                is_active: !admin.is_active
            })
            addToast({ type: 'success', message: admin.is_active ? 'Admin suspended' : 'Admin activated' })
            fetchAdmins()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update status' })
        }
    }

    const handleSavePermissions = async () => {
        if (editPermissions.length === 0) {
            addToast({ type: 'error', message: 'Select at least one permission' })
            return
        }
        setEditSaving(true)
        try {
            await api.put(`/api/v1/admin/support-admins/${editAdmin.id}`, {
                permissions: editPermissions
            })
            addToast({ type: 'success', message: 'Permissions updated!' })
            setEditAdmin(null)
            fetchAdmins()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update permissions' })
        } finally {
            setEditSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this support admin? They will be reverted to a regular user.')) return
        try {
            await api.delete(`/api/v1/admin/support-admins/${id}`)
            addToast({ type: 'success', message: 'Support admin removed' })
            fetchAdmins()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to remove support admin' })
        }
    }

    const openEditModal = (admin) => {
        setEditAdmin(admin)
        setEditPermissions(admin.permissions || [])
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Admins</h1>
                    <p className="text-sm text-gray-500 mt-1">Create moderator accounts with limited admin permissions</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                    </svg>
                    {showForm ? 'Cancel' : 'Add Support Admin'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="card space-y-5 border-2 border-primary-200 bg-primary-50/30">
                    <h3 className="text-lg font-bold text-gray-900">Create Support Admin</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input type="text" name="first_name" value={form.first_name} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input type="text" name="last_name" value={form.last_name} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} className="input" required minLength={8} />
                            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                            Assign Permissions <span className="text-xs font-normal text-gray-500">({form.permissions.length} selected)</span>
                        </label>
                        <PermissionCheckboxes selected={form.permissions} onToggle={togglePermission} />
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
                        {saving ? 'Creating...' : 'Create Support Admin'}
                    </button>
                </form>
            )}

            {/* Admins List */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Admin</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Permissions</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                            ))
                        ) : admins.length > 0 ? (
                            admins.map(admin => (
                                <tr key={admin.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${admin.is_active ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : 'bg-gray-400'}`}>
                                                {admin.first_name?.[0]}{admin.last_name?.[0]}
                                            </div>
                                            <span className={`font-medium ${admin.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {admin.first_name} {admin.last_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{admin.email}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(admin.permissions || []).map(p => (
                                                <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-semibold uppercase">
                                                    {p.replace('_', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {admin.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(admin)}
                                                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(admin)}
                                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${admin.is_active
                                                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    }`}
                                            >
                                                {admin.is_active ? 'Suspend' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin.id)}
                                                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center">
                                    <div className="text-gray-400 text-4xl mb-3">👥</div>
                                    <p className="text-gray-500 font-medium">No support admins yet</p>
                                    <p className="text-gray-400 text-sm mt-1">Click "Add Support Admin" to create one</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Permissions Modal */}
            {editAdmin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Permissions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{editAdmin.first_name} {editAdmin.last_name} — {editAdmin.email}</p>
                            </div>
                            <button onClick={() => setEditAdmin(null)} className="text-gray-400 hover:text-gray-600 p-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <label className="block text-sm font-bold text-gray-900">
                                Permissions <span className="text-xs font-normal text-gray-500">({editPermissions.length} selected)</span>
                            </label>
                            <PermissionCheckboxes selected={editPermissions} onToggle={toggleEditPermission} />
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={handleSavePermissions}
                                disabled={editSaving}
                                className="flex-1 btn-primary disabled:opacity-50"
                            >
                                {editSaving ? 'Saving...' : 'Save Permissions'}
                            </button>
                            <button onClick={() => setEditAdmin(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
