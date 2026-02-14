import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminStores() {
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [search, setSearch] = useState('')
    const [selectedStore, setSelectedStore] = useState(null)
    const { addToast } = useUIStore()

    const StoreDetailModal = ({ store, onClose }) => {
        if (!store) return null
        const owner = store.owner || {}

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
                <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-scale-up">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">Store Details</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                        {/* Store Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border">
                                {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">🏪</span>}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {store.is_active ? 'Active' : 'Suspended'}
                                    </span>
                                    {store.is_verified && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                            ✓ Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Owner Info Section */}
                        <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100">
                            <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4">Owner Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-primary-600/70 font-semibold">Full Name</p>
                                    <p className="text-gray-900 font-bold">{owner.first_name} {owner.last_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-primary-600/70 font-semibold">Student ID</p>
                                    <p className="text-gray-900 font-bold">{owner.student_id || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-primary-600/70 font-semibold">Phone Number</p>
                                    <p className="text-gray-900 font-bold">{owner.phone || store.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-primary-600/70 font-semibold">Email Address</p>
                                    <p className="text-gray-900 font-bold break-all">{owner.email || store.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Store Statistics */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xl font-bold text-gray-900">{store.total_products || 0}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Products</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xl font-bold text-gray-900 text-yellow-500">⭐ {store.rating?.toFixed(1) || '0.0'}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Rating</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xl font-bold text-gray-900">{store.total_orders || 0}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Orders</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => {
                                    handleSuspend(store.id, store.is_active)
                                    onClose()
                                }}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${store.is_active
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                    }`}
                            >
                                {store.is_active ? 'Suspend Store' : 'Activate Store'}
                            </button>
                            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    useEffect(() => {
        fetchStores()
    }, [page, search])

    const fetchStores = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/v1/stores', { params: { page, limit: 20, search } })
            setStores(response.data.stores || [])
            setPagination(response.data.pagination || {})
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load stores' })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleVerify = async (storeId, isVerified) => {
        try {
            await api.patch(`/api/v1/admin/stores/${storeId}`, { is_verified: !isVerified })
            addToast({ type: 'success', message: isVerified ? 'Verification removed' : 'Store verified!' })
            fetchStores()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update store' })
        }
    }

    const handleSuspend = async (storeId, isActive) => {
        try {
            await api.patch(`/api/v1/admin/stores/${storeId}`, { is_active: !isActive })
            addToast({ type: 'success', message: isActive ? 'Store suspended' : 'Store activated' })
            fetchStores()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update store' })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stores..." className="px-4 py-2 border border-gray-200 rounded-xl" />
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Store</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Owner</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Type</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Products</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Rating</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={7} className="p-4"><Skeleton className="h-14 w-full" /></td></tr>
                                ))
                            ) : stores.length > 0 ? (
                                stores.map(store => (
                                    <tr key={store.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                                                    {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : '🏪'}
                                                </div>
                                                <div
                                                    className="flex-1 cursor-pointer group"
                                                    onClick={() => setSelectedStore(store)}
                                                >
                                                    <p className="font-medium text-gray-900 flex items-center gap-1 group-hover:text-primary-600 transition-colors group-hover:underline">
                                                        {store.name}
                                                        {store.is_verified && <span className="text-blue-500">✓</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{store.owner?.first_name} {store.owner?.last_name}</td>
                                        <td className="p-4 text-gray-600 capitalize">{store.store_type}</td>
                                        <td className="p-4 text-gray-600">{store.total_products || 0}</td>
                                        <td className="p-4"><span className="text-yellow-400">⭐</span> {store.rating?.toFixed(1) || '0.0'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {store.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handleToggleVerify(store.id, store.is_verified)} className={`text-xs px-3 py-1 rounded-lg ${store.is_verified ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                                                {store.is_verified ? '✓ Verified' : 'Verify'}
                                            </button>
                                            <button onClick={() => handleSuspend(store.id, store.is_active)} className={`text-xs px-3 py-1 rounded-lg ${store.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                {store.is_active ? 'Suspend' : 'Activate'}
                                            </button>
                                            <Link to={`/store/${store.id}`} className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-lg">View</Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No stores found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">Previous</button>
                    <span className="text-gray-600">Page {page} of {pagination.pages}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">Next</button>
                </div>
            )}
            {/* Detail Modal */}
            <StoreDetailModal
                store={selectedStore}
                onClose={() => setSelectedStore(null)}
            />
        </div>
    )
}
