import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import { Skeleton } from '../components/ui/Skeleton'

export default function Checkout() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user } = useAuthStore()
    const { addToast } = useUIStore()

    const [loading, setLoading] = useState(true)
    const [confirming, setConfirming] = useState(false)
    const [product, setProduct] = useState(null)
    const [quantity, setQuantity] = useState(parseInt(searchParams.get('qty')) || 1)
    const [buyerNote, setBuyerNote] = useState('')

    useEffect(() => {
        const productId = searchParams.get('product')
        if (!productId) {
            navigate('/')
            return
        }
        fetchProduct(productId)
    }, [])

    const fetchProduct = async (productId) => {
        try {
            const response = await api.get(`/api/v1/products/${productId}`)
            setProduct(response.data.product)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load product' })
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleIvePaid = async () => {
        if (!product.store?.bank_name || !product.store?.account_number) {
            addToast({
                type: 'error',
                message: 'Seller has not set up payment details yet. Please contact them.'
            })
            return
        }

        setConfirming(true)
        try {
            // Step 1: Create the order
            const orderResponse = await api.post('/api/v1/orders', {
                product_id: product.id,
                quantity,
                buyer_note: buyerNote
            })

            const createdOrder = orderResponse.data.order

            // Step 2: Immediately confirm payment
            const confirmResponse = await api.post(`/api/v1/orders/${createdOrder.id}/confirm-payment`)

            addToast({ type: 'success', message: 'Payment confirmation sent to seller!' })

            // Navigate to chat with seller
            if (confirmResponse.data.chat_id) {
                navigate(`/chat/${confirmResponse.data.chat_id}`)
            } else {
                navigate(`/order/${createdOrder.id}`)
            }
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to process order'
            })
        } finally {
            setConfirming(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50">
                <Header title="Checkout" showBack />
                <div className="p-4 space-y-4">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-48 rounded-2xl" />
                </div>
            </div>
        )
    }

    if (!product) {
        return null
    }

    const totalPrice = parseFloat(product.price) * quantity
    const hasPaymentDetails = product.store?.bank_name && product.store?.account_number

    return (
        <div className="min-h-screen bg-surface-50 pb-24">
            <Header title="Checkout" showBack />

            <div className="p-4 space-y-4">
                {/* Product Summary */}
                <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
                    <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden flex-shrink-0">
                            {product.media?.[0]?.url ? (
                                <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                            <p className="text-sm text-gray-500 mb-2">₦{product.price.toLocaleString()} each</p>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Quantity:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={product.stock_quantity}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                                    className="w-20 px-2 py-1.5 border border-surface-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-200 flex items-center justify-between">
                        <span className="font-medium text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-primary-600">₦{totalPrice.toLocaleString()}</span>
                    </div>
                </div>

                {/* Seller Info */}
                <div className="card">
                    <h2 className="font-semibold text-gray-900 mb-3">Seller Information</h2>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg></div>
                            <div>
                                <p className="font-medium text-gray-900">{product.store?.name}</p>
                                <p className="text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><svg className="w-3 h-3 text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>{product.store?.rating?.toFixed(1) || '0.0'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="card">
                    <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Payment Details</h2>
                    {hasPaymentDetails ? (
                        <div className="space-y-3 bg-primary-50 p-4 rounded-2xl border-2 border-primary-200">
                            <div>
                                <p className="text-xs text-blue-600 mb-1">Bank Name</p>
                                <p className="font-medium text-blue-900">{product.store.bank_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 mb-1">Account Number</p>
                                <p className="font-mono font-medium text-lg text-blue-900">{product.store.account_number}</p>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 mb-1">Account Name</p>
                                <p className="font-medium text-blue-900">{product.store.account_name}</p>
                            </div>
                            <div className="pt-3 border-t border-blue-200">
                                <p className="text-xs text-blue-600 mb-1">Amount to Transfer</p>
                                <p className="text-2xl font-bold text-blue-900">₦{totalPrice.toLocaleString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Seller has not set up payment details yet. Please contact them before ordering.
                            </p>
                        </div>
                    )}
                </div>

                {/* Buyer Note */}
                <div className="card">
                    <label className="label">Note to Seller (Optional)</label>
                    <textarea
                        value={buyerNote}
                        onChange={(e) => setBuyerNote(e.target.value)}
                        placeholder="Add any special instructions..."
                        rows={3}
                        className="input"
                    />
                </div>

                {/* Instructions */}
                <div className="card bg-amber-50 border-amber-200">
                    <h3 className="font-semibold text-amber-900 mb-2">📝 How to Complete Your Purchase</h3>
                    <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                        <li className="font-medium">Transfer ₦{totalPrice.toLocaleString()} to the account above</li>
                        <li>After transferring, click "I've Paid" button below</li>
                        <li>A receipt will be sent to the seller automatically</li>
                        <li>Wait for seller to approve your payment</li>
                        <li>Arrange pickup with seller via chat</li>
                    </ol>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 glass border-t border-surface-200/60 px-4 py-3 z-50 safe-bottom">
                <button
                    onClick={handleIvePaid}
                    disabled={confirming || !hasPaymentDetails}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                >
                    {confirming ? 'Processing...' : "I've Paid - Send Receipt to Seller"}
                </button>
            </div>
        </div>
    )
}
