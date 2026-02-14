import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import { Skeleton } from '../../components/ui/Skeleton'

const planIcons = {
    basic: '🆓',
    starter: '🚀',
    professional: '⭐',
    enterprise: '👑'
}

const planColors = {
    basic: 'border-gray-200 bg-white',
    starter: 'border-primary-200 bg-primary-50',
    professional: 'border-accent-200 bg-accent-50',
    enterprise: 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-100'
}

export default function SellerSubscription() {
    const [plans, setPlans] = useState({})
    const [currentPlan, setCurrentPlan] = useState(null)
    const [subscription, setSubscription] = useState(null)
    const [loading, setLoading] = useState(true)
    const [subscribing, setSubscribing] = useState(false)
    const { addToast } = useUIStore()
    const { user } = useAuthStore()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [plansRes, subRes] = await Promise.all([
                api.get('/api/v1/subscriptions/plans'),
                api.get('/api/v1/subscriptions/my-subscription')
            ])
            setPlans(plansRes.data.plans)
            setCurrentPlan(subRes.data.plan_key)
            setSubscription(subRes.data.subscription)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load subscription data' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (planKey) => {
        if (planKey === currentPlan) return

        const plan = plans[planKey]

        if (plan.price > 0) {
            // For paid plans, show payment modal
            addToast({
                type: 'info',
                message: `To subscribe to ${plan.name}, please complete payment of ₦${plan.price.toLocaleString()} via bank transfer or card`
            })
            // In production, integrate with Paystack/Flutterwave
            return
        }

        setSubscribing(true)
        try {
            await api.post('/api/v1/subscriptions/subscribe', { plan: planKey })
            addToast({ type: 'success', message: `Subscribed to ${plan.name} plan!` })
            fetchData()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to subscribe' })
        } finally {
            setSubscribing(false)
        }
    }

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return

        try {
            await api.post('/api/v1/subscriptions/cancel')
            addToast({ type: 'success', message: 'Subscription cancelled' })
            fetchData()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to cancel subscription' })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50 p-4">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
                <Link to="/seller" className="p-2 -ml-2 text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-lg font-semibold">Subscription Plans</h1>
            </div>

            {/* Current Plan Summary */}
            {subscription && (
                <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80">Current Plan</p>
                            <p className="text-xl font-bold">{plans[currentPlan]?.name || 'Basic'}</p>
                        </div>
                        <span className="text-4xl">{planIcons[currentPlan]}</span>
                    </div>
                    {subscription.expires_at && (
                        <p className="mt-2 text-sm opacity-80">
                            Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                        </p>
                    )}
                    {currentPlan !== 'basic' && (
                        <button
                            onClick={handleCancel}
                            className="mt-3 text-sm underline opacity-80 hover:opacity-100"
                        >
                            Cancel subscription
                        </button>
                    )}
                </div>
            )}

            {/* Plans Grid */}
            <div className="p-4 grid gap-4">
                {Object.entries(plans).map(([key, plan]) => (
                    <div
                        key={key}
                        className={`relative rounded-2xl border-2 p-5 transition-all ${planColors[key]} ${currentPlan === key ? 'ring-2 ring-primary-500' : ''
                            }`}
                    >
                        {currentPlan === key && (
                            <span className="absolute -top-3 left-4 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                                Current Plan
                            </span>
                        )}

                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                <p className="text-2xl font-bold text-primary-600">
                                    {plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}`}
                                    {plan.duration_days > 0 && (
                                        <span className="text-sm text-gray-500 font-normal">/month</span>
                                    )}
                                </p>
                            </div>
                            <span className="text-3xl">{planIcons[key]}</span>
                        </div>

                        <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="text-green-500">✓</span>
                                {plan.max_products === -1 ? 'Unlimited' : plan.max_products} products
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <span className={plan.featured_slots > 0 ? 'text-green-500' : 'text-gray-300'}>
                                    {plan.featured_slots > 0 ? '✓' : '✗'}
                                </span>
                                {plan.featured_slots} featured slot{plan.featured_slots !== 1 ? 's' : ''}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <span className={plan.analytics ? 'text-green-500' : 'text-gray-300'}>
                                    {plan.analytics ? '✓' : '✗'}
                                </span>
                                Analytics dashboard
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <span className={plan.priority_support ? 'text-green-500' : 'text-gray-300'}>
                                    {plan.priority_support ? '✓' : '✗'}
                                </span>
                                Priority support
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <span className={plan.verified_badge ? 'text-green-500' : 'text-gray-300'}>
                                    {plan.verified_badge ? '✓' : '✗'}
                                </span>
                                Verified badge
                            </li>
                        </ul>

                        <button
                            onClick={() => handleSubscribe(key)}
                            disabled={currentPlan === key || subscribing}
                            className={`w-full py-3 rounded-xl font-medium transition-colors ${currentPlan === key
                                    ? 'bg-gray-100 text-gray-400 cursor-default'
                                    : 'btn-primary'
                                }`}
                        >
                            {currentPlan === key ? 'Current Plan' : plan.price === 0 ? 'Select Plan' : 'Subscribe'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Additional Actions */}
            <div className="px-4 mt-4 space-y-3">
                <Link
                    to="/seller/featured"
                    className="block p-4 bg-white rounded-2xl border border-gray-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⭐</span>
                            <div>
                                <p className="font-medium text-gray-900">Featured Listings</p>
                                <p className="text-sm text-gray-500">Boost your product visibility</p>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>

                <Link
                    to="/seller/ads"
                    className="block p-4 bg-white rounded-2xl border border-gray-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📢</span>
                            <div>
                                <p className="font-medium text-gray-900">Ad Placements</p>
                                <p className="text-sm text-gray-500">Advertise on the platform</p>
                            </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>
            </div>
        </div>
    )
}
