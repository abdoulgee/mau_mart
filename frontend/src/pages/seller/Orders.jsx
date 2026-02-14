import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { Skeleton } from '../../components/ui/Skeleton'

const statusColors = {
    pending_payment: 'bg-yellow-100 text-yellow-700',
    awaiting_approval: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
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
    const buyer = order.user

    return (
        <Link
            to={`/seller/orders/${order.id}`}
            className="card"
        >
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {product?.media?.[0]?.url ? (
                        <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 line-clamp-1">{product?.title || 'Product'}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Order #{order.order_number}</p>
                    <p className="text-xs text-gray-400 mb-2">Buyer: {buyer?.first_name} {buyer?.last_name}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-primary-600 font-semibold">₦{order.total_price?.toLocaleString()}</span>
                        <span className="text-xs text-gray-400">
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
        { id: 'completed', label: 'Completed' },
        { id: 'rejected', label: 'Rejected' },
    ]

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 p-1">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-primary-500 text-white'
                                : 'text-gray-600 hover:bg-surface-50'
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
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2 mb-2" />
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                    ))
                ) : (
                    <div className="card text-center py-16">
                        <span className="text-6xl block mb-4">📦</span>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-500">Orders from customers will appear here</p>
                    </div>
                )}
            </div>
        </div>
    )
}
