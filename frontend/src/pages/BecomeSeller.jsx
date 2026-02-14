import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

export default function BecomeSeller() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { addToast } = useUIStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        store_name: '',
        store_type: 'general',
        description: '',
        business_address: '',
        phone: user?.phone || '',
        email: user?.email || '',
    })

    // Route guard - check seller state
    useEffect(() => {
        if (!user) return

        // If already a seller, redirect to store management
        if (user.is_seller) {
            navigate('/seller', { replace: true })  // Fixed: actual route is /seller
            return
        }
    }, [user, navigate])

    const storeTypes = [
        { value: 'general', label: 'General Store', icon: '🏪', desc: 'Sell various products' },
        { value: 'kitchen', label: 'Kitchen/Food', icon: '🍔', desc: 'Sell food and beverages' },
        { value: 'service', label: 'Service Provider', icon: '🛠️', desc: 'Offer services like tutoring, design' },
    ]

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.store_name.trim()) {
            addToast({ type: 'error', message: 'Store name is required' })
            return
        }

        setLoading(true)
        try {
            await api.post('/api/v1/stores/request', formData)
            addToast({ type: 'success', message: 'Application submitted! We\'ll review it shortly.' })
            navigate('/profile')
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit application'
            })
        } finally {
            setLoading(false)
        }
    }

    // Show pending status if request exists and is pending
    if (user?.seller_request?.status === 'pending') {
        return (
            <div className="min-h-screen bg-surface-50 pb-8">
                <Header title="Become a Seller" showBack />
                <div className="p-4">
                    <div className="card bg-yellow-50 border-2 border-yellow-300 text-center">
                        <span className="text-5xl block mb-3">⏳</span>
                        <h2 className="text-xl font-bold mb-2 text-gray-900">Application Pending</h2>
                        <p className="text-gray-700 mb-4">
                            Your seller application is being reviewed by our team.
                        </p>
                        <p className="text-sm text-gray-600">
                            We'll notify you once your application is processed.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Show rejection message if rejected - allow re-apply
    if (user?.seller_request?.status === 'rejected') {
        return (
            <div className="min-h-screen bg-surface-50 pb-8">
                <Header title="Become a Seller" showBack />
                <div className="p-4">
                    <div className="card bg-red-50 border-2 border-red-300 text-center mb-6">
                        <span className="text-5xl block mb-3">❌</span>
                        <h2 className="text-xl font-bold mb-2 text-gray-900">Application Rejected</h2>
                        <p className="text-gray-700 mb-2">
                            Your previous seller application was not approved.
                        </p>
                        {user.seller_request.admin_notes && (
                            <p className="text-sm text-gray-600 italic">
                                Reason: {user.seller_request.admin_notes}
                            </p>
                        )}
                        <p className="text-sm text-gray-600 mt-4">
                            You can submit a new application below.
                        </p>
                    </div>
                    {/* Show form below for re-application */}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-8">
            <Header title="Become a Seller" showBack />

            <div className="p-4">
                {/* Hero */}
                <div className="card bg-gradient-to-br from-primary-500 to-accent-500 text-white text-center mb-6">
                    <span className="text-5xl block mb-3">🏪</span>
                    <h2 className="text-xl font-bold mb-2">Start Selling on MAU MART</h2>
                    <p className="text-white/80 text-sm">Join hundreds of students making money on campus</p>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="card text-center">
                        <span className="text-2xl block mb-2">💰</span>
                        <p className="text-sm font-medium text-gray-700">Earn Extra Income</p>
                    </div>
                    <div className="card text-center">
                        <span className="text-2xl block mb-2">🚀</span>
                        <p className="text-sm font-medium text-gray-700">Easy to Start</p>
                    </div>
                    <div className="card text-center">
                        <span className="text-2xl block mb-2">📱</span>
                        <p className="text-sm font-medium text-gray-700">Manage Anywhere</p>
                    </div>
                    <div className="card text-center">
                        <span className="text-2xl block mb-2">🎓</span>
                        <p className="text-sm font-medium text-gray-700">Campus Community</p>
                    </div>
                </div>

                {/* Application Form */}
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <h3 className="font-semibold text-gray-900">Seller Application</h3>

                    {/* Store Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Type</label>
                        <div className="grid grid-cols-1 gap-2">
                            {storeTypes.map(type => (
                                <label
                                    key={type.value}
                                    className={`p-3 border-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${formData.store_type === type.value
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="store_type"
                                        value={type.value}
                                        checked={formData.store_type === type.value}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <span className="text-2xl">{type.icon}</span>
                                    <div>
                                        <p className="font-medium text-gray-900">{type.label}</p>
                                        <p className="text-xs text-gray-500">{type.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Store Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                        <input
                            type="text"
                            name="store_name"
                            value={formData.store_name}
                            onChange={handleChange}
                            placeholder="e.g., John's Kitchen"
                            className="input"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Tell customers about your store..."
                            rows={3}
                            className="input resize-none"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                        <input
                            type="text"
                            name="business_address"
                            value={formData.business_address}
                            onChange={handleChange}
                            placeholder="Where customers can find you"
                            className="input"
                        />
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        By submitting, you agree to MAU MART's Seller Terms & Conditions
                    </p>
                </form>
            </div>
        </div>
    )
}
