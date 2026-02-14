import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { Skeleton } from '../../components/ui/Skeleton'

const statusColors = {
    pending_payment: 'bg-primary-100 text-primary-800',
    awaiting_approval: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-surface-200 text-gray-700',
    cancelled: 'bg-surface-200 text-gray-500',
}

const statusLabels = {
    pending_payment: 'Pending',
    awaiting_approval: 'Awaiting',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Done',
    cancelled: 'Cancelled',
}

function OrderCard({ order }) {
    const product = order.product
    const buyer = order.user

    return (
        <Link
            to={`/seller/orders/${order.id}`}
            className="card block"
        >
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-100 overflow-hidden flex-shrink-0">
                    {product?.media?.[0]?.url ? (
                        <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    )}
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1 min-w-0">{product?.title || 'Product'}</h3>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 whitespace-nowrap ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">#{order.order_number}</p>
                    <p className="text-xs text-gray-400 mb-1.5">Buyer: {buyer?.first_name} {buyer?.last_name}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-primary-600 font-bold text-sm">₦{order.total_price?.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function SellerOrders() {
    const [searchParams] = useSearchParams()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all')

    useEffect(() => {
        fetchOrders()
    }, [])

    useEffect(() => {
        const status = searchParams.get('status')
        if (status) {
            setActiveTab(status)
        }
    }, [searchParams])

    const fetchOrders = async () => {
        try {
            const response = await api.get('/api/v1/orders/seller')
            setOrders(response.data.orders || [])
        } catch (error) {
            console.error('Failed to fetch seller orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = activeTab === 'all'
        ? orders
        : orders.filter(o => o.status === activeTab)

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'awaiting_approval', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'completed', label: 'Done' },
        { id: 'rejected', label: 'Rejected' },
    ]

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-900 text-center">Orders</h1>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-surface-200 p-1.5">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-xl transition-colors ${activeTab === tab.id
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-surface-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card">
                            <div className="flex gap-3">
                                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-3 w-1/2 mb-2" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))
                ) : (
                    <div className="card text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-3 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">No orders yet</h3>
                        <p className="text-gray-400 text-sm">Orders from customers will appear here</p>
                    </div>
                )}
            </div>
        </div>
    )
}
