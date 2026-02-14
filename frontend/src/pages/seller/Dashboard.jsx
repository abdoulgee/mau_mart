import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function SellerDashboard() {
    const { user } = useAuthStore()
    const location = useLocation()
    const navigate = useNavigate()
    const [store, setStore] = useState(null)
    const [stats, setStats] = useState({})
    const [recentOrders, setRecentOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const storeRes = await api.get('/api/v1/stores/my-store')
            setStore(storeRes.data.store)

            // Fetch basic stats and recent orders
            const ordersRes = await api.get('/api/v1/orders/seller?limit=5')
            const orders = ordersRes.data.orders || []
            setStats({
                totalOrders: ordersRes.data.pagination?.total || 0,
                pendingOrders: orders.filter(o => o.status === 'awaiting_approval').length || 0
            })
            setRecentOrders(orders.slice(0, 5))
        } catch (error) {
            if (error.response?.status === 404) {
                navigate('/become-seller')
            }
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            'pending_payment': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending Payment' },
            'awaiting_approval': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Awaiting Approval' },
            'approved': { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
            'rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
            'completed': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
            'cancelled': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' }
        }
        return badges[status] || badges['pending_payment']
    }

    // Dashboard home content
    const isDashboardHome = location.pathname === '/seller'

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
            </div>
        )
    }

    if (!isDashboardHome) {
        return <Outlet />
    }

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Welcome Card */}
            <div className="card bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                <h2 className="text-lg font-semibold mb-1">Welcome back! 👋</h2>
                <p className="text-white/80 text-sm">
                    {store?.name || 'Your Store'}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <div>
                        <span className="text-white/70">Rating</span>
                        <p className="font-semibold flex items-center gap-1">
                            <span className="text-yellow-300">⭐</span>
                            {store?.rating?.toFixed(1) || '0.0'}
                        </p>
                    </div>
                    <div>
                        <span className="text-white/70">Total Orders</span>
                        <p className="font-semibold">{store?.total_orders || 0}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card text-center">
                    <span className="text-3xl mb-2 block">📦</span>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                </div>
                <Link to="/seller/orders?status=awaiting_approval" className="card text-center hover:shadow-md transition-shadow">
                    <span className="text-3xl mb-2 block">⏳</span>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                    <p className="text-sm text-gray-500">Pending Approval</p>
                </Link>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Link to="/seller/products/new" className="card text-center hover:shadow-md transition-shadow">
                        <span className="text-2xl mb-2 block">➕</span>
                        <p className="text-sm font-medium text-gray-700">Add Product</p>
                    </Link>
                    <Link to="/seller/products" className="card text-center hover:shadow-md transition-shadow">
                        <span className="text-2xl mb-2 block">📋</span>
                        <p className="text-sm font-medium text-gray-700">My Products</p>
                    </Link>
                    <Link to="/seller/orders" className="card text-center hover:shadow-md transition-shadow">
                        <span className="text-2xl mb-2 block">🛒</span>
                        <p className="text-sm font-medium text-gray-700">Orders</p>
                    </Link>
                    <Link to="/seller/store" className="card text-center hover:shadow-md transition-shadow">
                        <span className="text-2xl mb-2 block">⚙️</span>
                        <p className="text-sm font-medium text-gray-700">Store Settings</p>
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                    <Link to="/seller/orders" className="text-primary-600 text-sm">View All</Link>
                </div>
                {recentOrders.length > 0 ? (
                    <div className="space-y-3">
                        {recentOrders.map(order => {
                            const badge = getStatusBadge(order.status)
                            return (
                                <Link
                                    key={order.id}
                                    to={`/order/${order.id}`}
                                    className="card hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {order.buyer?.first_name} {order.buyer?.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Order #{order.order_number}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-semibold text-gray-900">
                                                ₦{parseFloat(order.total_price).toLocaleString()}
                                            </p>
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="card text-center py-8">
                        <span className="text-4xl block mb-2">📊</span>
                        <p className="text-gray-500 text-sm">No orders yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}
