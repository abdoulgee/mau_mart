import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function StoreSettings() {
    const navigate = useNavigate()
    const { addToast } = useUIStore()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [store, setStore] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        store_type: 'general',
        bank_name: '',
        account_number: '',
        account_name: '',
    })

    useEffect(() => {
        fetchStore()
    }, [])

    const fetchStore = async () => {
        try {
            const response = await api.get('/api/v1/stores/my-store')
            const storeData = response.data.store
            setStore(storeData)
            setFormData({
                name: storeData.name || '',
                description: storeData.description || '',
                address: storeData.address || '',
                phone: storeData.phone || '',
                email: storeData.email || '',
                store_type: storeData.store_type || 'general',
                bank_name: storeData.bank_name || '',
                account_number: storeData.account_number || '',
                account_name: storeData.account_name || '',
            })
        } catch (error) {
            console.error('Failed to fetch store:', error)
            if (error.response?.status === 404) {
                navigate('/become-seller')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.put('/api/v1/stores/my-store', formData)
            addToast({ type: 'success', message: 'Store settings updated successfully' })
            fetchStore()
        } catch (error) {
            addToast({
                type: 'error',
                message: error.response?.data?.message || 'Failed to update store settings'
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="card space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        )
    }

    const storeTypes = [
        { value: 'general', label: 'General Store' },
        { value: 'kitchen', label: 'Kitchen/Food' },
        { value: 'service', label: 'Service Provider' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
                <p className="text-gray-500 mt-1">Manage your store information</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-5">
                {/* Store Name */}
                <div>
                    <label htmlFor="name" className="label">Store Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input"
                        required
                    />
                </div>

                {/* Store Type */}
                <div>
                    <label htmlFor="store_type" className="label">Store Type</label>
                    <select
                        id="store_type"
                        name="store_type"
                        value={formData.store_type}
                        onChange={handleChange}
                        className="input"
                    >
                        {storeTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="label">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="input"
                        placeholder="Tell customers about your store..."
                    />
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="address" className="label">Address</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="input"
                        placeholder="Store location"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label htmlFor="phone" className="label">Phone</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input"
                        placeholder="Contact number"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="label">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input"
                        placeholder="Store email"
                    />
                </div>

                {/* Payment Details Section */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">💳 Payment Details</h3>
                    <p className="text-sm text-gray-500 mb-4">Buyers will use these details to pay for orders</p>

                    {/* Bank Name */}
                    <div className="mb-4">
                        <label htmlFor="bank_name" className="label">Bank Name</label>
                        <input
                            type="text"
                            id="bank_name"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., First Bank, GTBank"
                        />
                    </div>

                    {/* Account Number */}
                    <div className="mb-4">
                        <label htmlFor="account_number" className="label">Account Number</label>
                        <input
                            type="text"
                            id="account_number"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            className="input"
                            placeholder="10-digit account number"
                        />
                    </div>

                    {/* Account Name */}
                    <div>
                        <label htmlFor="account_name" className="label">Account Name</label>
                        <input
                            type="text"
                            id="account_name"
                            name="account_name"
                            value={formData.account_name}
                            onChange={handleChange}
                            className="input"
                            placeholder="Account holder name"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            {/* Store Stats */}
            {store && (
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-3">Store Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Rating</p>
                            <p className="text-lg font-semibold text-gray-900">
                                ⭐ {store.rating?.toFixed(1) || '0.0'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {store.total_orders || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {store.is_active ? '✅ Active' : '❌ Inactive'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {new Date(store.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
