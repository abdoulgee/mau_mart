import { useState } from 'react'
import api from '../services/api'
import useUIStore from '../store/uiStore'

// OrderReceipt Component - Can be used in Orders page or as a modal
export default function OrderReceipt({ order }) {
    const [downloading, setDownloading] = useState(false)
    const { addToast } = useUIStore()

    const downloadPDF = async () => {
        if (!order?.id) return

        setDownloading(true)
        try {
            const response = await api.get(`/api/v1/orders/${order.id}/receipt`, {
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `maumart-receipt-${order.order_number || order.id}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            addToast({ type: 'success', message: 'Receipt downloaded!' })
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to download receipt' })
        } finally {
            setDownloading(false)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    }

    if (!order) return null

    return (
        <div className="card max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Receipt</h2>
                    <p className="text-sm text-gray-500">#{order.order_number || order.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </span>
            </div>

            {/* Store Info */}
            {order.store && (
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {order.store.logo_url ? (
                            <img src={order.store.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : '🏪'}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{order.store.name}</p>
                        <p className="text-sm text-gray-500">{order.store.phone || 'No phone'}</p>
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900">Items</h3>
                {(order.items || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden">
                            {item.product?.media?.[0]?.url ? (
                                <img src={item.product.media[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">📦</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.product?.title || item.product_name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-2 mb-6 pt-4 border-t">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{(order.subtotal || order.total_amount).toLocaleString()}</span>
                </div>
                {order.delivery_fee > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>Delivery Fee</span>
                        <span>₦{order.delivery_fee.toLocaleString()}</span>
                    </div>
                )}
                {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₦{order.discount.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>₦{order.total_amount.toLocaleString()}</span>
                </div>
            </div>

            {/* Order Details */}
            <div className="space-y-2 mb-6 text-sm text-gray-600">
                <div className="flex justify-between">
                    <span>Order Date</span>
                    <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="capitalize">{order.payment_method || 'Pay on Pickup'}</span>
                </div>
                {order.pickup_location && (
                    <div className="flex justify-between">
                        <span>Pickup Location</span>
                        <span>{order.pickup_location}</span>
                    </div>
                )}
            </div>

            {/* Download Button */}
            <button
                onClick={downloadPDF}
                disabled={downloading}
                className="btn-primary w-full disabled:opacity-50"
            >
                {downloading ? 'Generating PDF...' : '📄 Download Receipt PDF'}
            </button>
        </div>
    )
}

// Printable receipt component for browser window.print()
export function PrintableReceipt({ order }) {
    if (!order) return null

    return (
        <div className="p-8 max-w-md mx-auto bg-white print:p-0" id="printable-receipt">
            <style>
                {`
          @media print {
            body { margin: 0; padding: 0; }
            #printable-receipt { max-width: 100%; }
          }
        `}
            </style>

            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">MAU MART</h1>
                <p className="text-gray-500">Campus Marketplace</p>
            </div>

            <hr className="border-dashed mb-4" />

            {/* Order Info */}
            <div className="mb-4">
                <p><strong>Order #:</strong> {order.order_number || order.id}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                <p><strong>Status:</strong> {order.status?.toUpperCase()}</p>
            </div>

            <hr className="border-dashed mb-4" />

            {/* Items */}
            <div className="mb-4">
                {(order.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between mb-2">
                        <span>{item.quantity}x {item.product?.title || item.product_name}</span>
                        <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                ))}
            </div>

            <hr className="border-dashed mb-4" />

            {/* Total */}
            <div className="text-right mb-4">
                <p className="text-xl font-bold">Total: ₦{order.total_amount.toLocaleString()}</p>
            </div>

            <hr className="border-dashed mb-4" />

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
                <p>Thank you for shopping with MAU MART!</p>
                <p>Questions? Contact us at support@maumart.com</p>
            </div>
        </div>
    )
}
