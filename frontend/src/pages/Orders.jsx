import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { Skeleton } from '../components/ui/Skeleton'

const statusColors = {
    pending_payment: 'bg-amber-100 text-amber-700',
    awaiting_approval: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels = {
    pending_payment: 'Pending Payment',
    awaiting_approval: 'Awaiting Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
}

function OrderCard({ order }) {
    const product = order.product
    return (
        <Link to={`/order/${order.id}`} className="card-hover block">
            <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden flex-shrink-0">
                    {product?.media?.[0]?.url ? (
                        <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product?.title || 'Product'}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-semibold ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Order #{order.order_number}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-primary-600 font-bold text-sm">₦{order.total_price?.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function Orders() {
    const { isAuthenticated } = useAuthStore()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        if (isAuthenticated) fetchOrders()
    }, [isAuthenticated])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/api/v1/orders')
            setOrders(response.data.orders || [])
        } catch (error) {
            console.error('Failed to fetch orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab)

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-gray-500 mb-6 text-sm">Please login to view your orders</p>
                    <Link to="/login" className="btn-primary px-8">Login</Link>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'pending_payment', label: 'Pending' },
        { id: 'awaiting_approval', label: 'Processing' },
        { id: 'approved', label: 'Approved' },
        { id: 'completed', label: 'Completed' },
    ]

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="My Orders" showBack />

            {/* Tabs */}
            <div className="bg-white border-b border-surface-200/60 px-4">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card">
                            <div className="flex gap-3">
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-3 w-1/2 mb-2" />
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-400 mb-6 text-sm">Start shopping to see your orders here</p>
                        <Link to="/" className="btn-primary px-6">Browse Products</Link>
                    </div>
                )}
            </div>
        </div>
    )
}
