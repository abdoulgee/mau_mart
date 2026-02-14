import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

const statusColors = {
    pending_payment: 'bg-yellow-100 text-yellow-700',
    awaiting_approval: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-gray-100 text-gray-500',
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [statusFilter, setStatusFilter] = useState('all')
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchOrders()
    }, [page, statusFilter])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const params = { page, limit: 20 }
            if (statusFilter !== 'all') params.status = statusFilter
            const response = await api.get('/api/v1/admin/orders', { params })
            setOrders(response.data.orders || [])
            setPagination(response.data.pagination || {})
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load orders' })
        } finally {
            setLoading(false)
        }
    }

    const statuses = ['all', 'pending_payment', 'awaiting_approval', 'approved', 'completed', 'rejected', 'cancelled']

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {statuses.map(s => (
                        <option key={s} value={s}>{s === 'all' ? 'All Orders' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                </select>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Order #</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Buyer</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Seller</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Product</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Total</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={7} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-900">{order.order_number}</td>
                                        <td className="p-4 text-gray-600">{order.buyer?.first_name} {order.buyer?.last_name}</td>
                                        <td className="p-4 text-gray-600">{order.store?.name || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                                                    {order.product?.media?.[0]?.url ? (
                                                        <img src={order.product.media[0].url} alt="" className="w-full h-full object-cover" />
                                                    ) : <span className="text-xs flex items-center justify-center h-full">📦</span>}
                                                </div>
                                                <span className="text-sm line-clamp-1">{order.product?.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">₦{order.total_price?.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {order.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No orders found</td></tr>
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
        </div>
    )
}
