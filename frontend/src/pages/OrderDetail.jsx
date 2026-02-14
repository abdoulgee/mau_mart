import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import useChatStore from '../store/chatStore'
import { Skeleton } from '../components/ui/Skeleton'

const statusColors = {
    pending_payment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    awaiting_approval: 'bg-blue-100 text-blue-700 border-blue-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

const statusLabels = {
    pending_payment: 'Pending Payment',
    awaiting_approval: 'Awaiting Seller Approval',
    approved: 'Approved - Ready for Pickup',
    rejected: 'Payment Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
}

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { addToast } = useUIStore()
    const { socket, connectSocket } = useChatStore()

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [order, setOrder] = useState(null)

    // Connect socket if not connected
    useEffect(() => {
        if (!socket) {
            connectSocket()
        }
    }, [socket, connectSocket])

    // Listen for real-time order status updates
    useEffect(() => {
        if (!socket || !id) return

        const handleOrderUpdate = (data) => {
            if (data.order_id === parseInt(id)) {
                setOrder(data.order)
                addToast({
                    type: data.status === 'approved' ? 'success' :
                        data.status === 'rejected' ? 'error' : 'info',
                    message: `Order status updated: ${statusLabels[data.status] || data.status}`
                })
            }
        }

        socket.on('order_status_update', handleOrderUpdate)

        return () => {
            socket.off('order_status_update', handleOrderUpdate)
        }
    }, [socket, id, addToast])

    useEffect(() => {
        fetchOrder()
    }, [id])

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/api/v1/orders/${id}`)
            setOrder(response.data.order)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load order' })
            navigate('/orders')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmPayment = async () => {
        setProcessing(true)
        try {
            await api.post(`/api/v1/orders/${id}/confirm-payment`)
            addToast({ type: 'success', message: 'Payment confirmation sent to seller!' })
            fetchOrder()
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to confirm payment'
            })
        } finally {
            setProcessing(false)
        }
    }

    const handleApprove = async () => {
        setProcessing(true)
        try {
            await api.post(`/api/v1/orders/${id}/approve`)
            addToast({ type: 'success', message: 'Order approved! Stock updated.' })
            fetchOrder()
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to approve order'
            })
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async () => {
        const reason = prompt('Reason for rejection (optional):')
        setProcessing(true)
        try {
            await api.post(`/api/v1/orders/${id}/reject`, { reason })
            addToast({ type: 'info', message: 'Order rejected' })
            fetchOrder()
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to reject order'
            })
        } finally {
            setProcessing(false)
        }
    }

    const handleComplete = async () => {
        setProcessing(true)
        try {
            await api.post(`/api/v1/orders/${id}/complete`)
            addToast({ type: 'success', message: 'Order completed! Please leave a review.' })
            fetchOrder()
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to complete order'
            })
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50">
                <Header title="Order Details" showBack />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-48 rounded-2xl" />
                </div>
            </div>
        )
    }

    if (!order) {
        return null
    }

    const isBuyer = user?.id === order.buyer_id
    const isSeller = user?.id === order.store?.owner_id

    return (
        <div className="min-h-screen bg-surface-50 pb-24">
            <Header title="Order Details" showBack />

            <div className="p-4 space-y-4">
                {/* Status Badge */}
                <div className={`card border-2 ${statusColors[order.status]}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-75">Status</p>
                            <p className="text-lg font-bold">{statusLabels[order.status]}</p>
                        </div>
                        <span className="text-4xl">
                            {order.status === 'pending_payment' && '⏳'}
                            {order.status === 'awaiting_approval' && '🔍'}
                            {order.status === 'approved' && '✅'}
                            {order.status === 'rejected' && '❌'}
                            {order.status === 'completed' && '🎉'}
                        </span>
                    </div>
                </div>

                {/* Order Number */}
                <div className="card">
                    <p className="text-sm text-gray-500 mb-1">Order Number</p>
                    <p className="text-xl font-mono font-bold text-gray-900">#{order.order_number}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString()}
                    </p>
                </div>

                {/* Product Info */}
                <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-3">Product</h2>
                    <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            {order.product?.media?.[0]?.url ? (
                                <img src={order.product.media[0].url} alt={order.product.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{order.product?.title}</h3>
                            <p className="text-sm text-gray-500">₦{order.unit_price.toLocaleString()} × {order.quantity}</p>
                            <p className="text-lg font-bold text-primary-600 mt-1">₦{order.total_price.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Buyer/Seller Info */}
                {isSeller && order.buyer && (
                    <div className="card">
                        <h2 className="font-semibold text-gray-900 mb-3">Buyer Information</h2>
                        <div className="space-y-2">
                            <p className="text-gray-900">{order.buyer.first_name} {order.buyer.last_name}</p>
                            <p className="text-sm text-gray-500">{order.buyer.email}</p>
                            {order.buyer_note && (
                                <div className="mt-3 p-3 bg-surface-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Buyer Note:</p>
                                    <p className="text-sm text-gray-700">{order.buyer_note}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isBuyer && order.store && (
                    <div className="card">
                        <h2 className="font-semibold text-gray-900 mb-3">Seller Information</h2>
                        <Link to={`/store/${order.store.id}`} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl hover:bg-gray-100">
                            <span className="text-2xl">🏪</span>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{order.store.name}</p>
                                <p className="text-sm text-gray-500">View Store →</p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Payment Details (for buyer) */}
                {isBuyer && order.status === 'pending_payment' && order.bank_details && (
                    <div className="card bg-blue-50 border-2 border-blue-200">
                        <h2 className="font-semibold text-blue-900 mb-3">💳 Payment Details</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-blue-600 mb-1">Bank Name</p>
                                <p className="font-medium text-blue-900">{order.bank_details.bank_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 mb-1">Account Number</p>
                                <p className="font-mono font-medium text-blue-900">{order.bank_details.account_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 mb-1">Account Name</p>
                                <p className="font-medium text-blue-900">{order.bank_details.account_name}</p>
                            </div>
                            <div className="pt-3 border-t border-blue-200">
                                <p className="text-xs text-blue-600 mb-1">Amount to Pay</p>
                                <p className="text-2xl font-bold text-blue-900">₦{order.total_price.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Reason */}
                {order.status === 'rejected' && order.seller_note && (
                    <div className="card bg-red-50 border-2 border-red-200">
                        <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
                        <p className="text-sm text-red-800">{order.seller_note}</p>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-20">
                {/* Buyer Actions */}
                {isBuyer && order.status === 'pending_payment' && (
                    <button
                        onClick={handleConfirmPayment}
                        disabled={processing}
                        className="btn-primary w-full"
                    >
                        {processing ? 'Sending...' : "I've Paid - Notify Seller"}
                    </button>
                )}

                {isBuyer && order.status === 'approved' && (
                    <button
                        onClick={handleComplete}
                        disabled={processing}
                        className="btn-primary w-full"
                    >
                        {processing ? 'Processing...' : 'Mark as Received'}
                    </button>
                )}

                {/* Seller Actions */}
                {isSeller && order.status === 'awaiting_approval' && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="btn-secondary flex-1"
                        >
                            Reject
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="btn-primary flex-1"
                        >
                            {processing ? 'Approving...' : 'Approve Payment'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
