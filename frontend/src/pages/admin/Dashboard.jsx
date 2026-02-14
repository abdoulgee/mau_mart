import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Skeleton } from '../../components/ui/Skeleton'

function StatCard({ icon, label, value, color = 'bg-primary-500', link }) {
    const Content = () => (
        <div className="card">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    )

    if (link) {
        return <Link to={link}><Content /></Link>
    }
    return <Content />
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSellers: 0,
        totalStores: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingRequests: 0,
        pendingReports: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/v1/admin/dashboard')
            setStats(response.data.stats)
        } catch (error) {
            console.error('Failed to fetch admin stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon="👥"
                    label="Total Users"
                    value={stats.totalUsers || stats.total_users || 0}
                    color="bg-blue-500"
                    link="/admin/users"
                />
                <StatCard
                    icon="🏪"
                    label="Active Stores"
                    value={stats.totalStores || stats.total_stores || 0}
                    color="bg-green-500"
                    link="/admin/stores"
                />
                <StatCard
                    icon="📦"
                    label="Products"
                    value={stats.totalProducts || stats.total_products || 0}
                    color="bg-purple-500"
                    link="/admin/products"
                />
                <StatCard
                    icon="🛒"
                    label="Total Orders"
                    value={stats.totalOrders || stats.total_orders || 0}
                    color="bg-orange-500"
                    link="/admin/orders"
                />
            </div>

            {/* Action Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Store Requests */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Pending Requests</h3>
                        <Link to="/admin/store-requests" className="text-primary-600 text-sm hover:underline">View All</Link>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl">
                        <span className="text-3xl">📋</span>
                        <div>
                            <p className="text-2xl font-bold text-yellow-700">{stats.pendingRequests || stats.pending_requests || 0}</p>
                            <p className="text-sm text-yellow-600">Store requests awaiting review</p>
                        </div>
                    </div>
                </div>

                {/* Pending Reports */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Pending Reports</h3>
                        <Link to="/admin/reports" className="text-primary-600 text-sm hover:underline">View All</Link>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl">
                        <span className="text-3xl">🚩</span>
                        <div>
                            <p className="text-2xl font-bold text-red-700">{stats.pendingReports || stats.pending_reports || 0}</p>
                            <p className="text-sm text-red-600">Reports requiring attention</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link to="/admin/categories" className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors">
                        <span className="text-2xl block mb-2">📂</span>
                        <span className="text-sm text-gray-700">Manage Categories</span>
                    </Link>
                    <Link to="/admin/users" className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors">
                        <span className="text-2xl block mb-2">👥</span>
                        <span className="text-sm text-gray-700">Manage Users</span>
                    </Link>
                    <Link to="/admin/smtp" className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors">
                        <span className="text-2xl block mb-2">📧</span>
                        <span className="text-sm text-gray-700">SMTP Settings</span>
                    </Link>
                    <Link to="/admin/ads" className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors">
                        <span className="text-2xl block mb-2">📢</span>
                        <span className="text-sm text-gray-700">Manage Ads</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
