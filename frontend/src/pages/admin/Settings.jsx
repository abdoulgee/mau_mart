import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import useSettingsStore from '../../store/settingsStore'

export default function AdminSettings() {
    const { settings: storeSettings, fetchSettings: refreshGlobal } = useSettingsStore()
    const [settings, setSettings] = useState({
        site_name: 'MAU MART',
        site_tagline: 'Campus Marketplace',
        support_email: '',
        support_phone: '',
        currency: 'NGN',
        currency_symbol: '₦',
        transaction_fee_percent: 0,
        min_order_amount: 0,
        max_product_images: 4,
        require_email_verification: true,
        allow_guest_browsing: true,
        maintenance_mode: false,
        terms_url: '',
        privacy_url: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/v1/admin/settings')
            if (response.data.settings && Object.keys(response.data.settings).length > 0) {
                setSettings(prev => ({ ...prev, ...response.data.settings }))
            }
        } catch (error) {
            // Settings may not exist yet, use defaults
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
        }))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/api/v1/admin/settings', settings)
            addToast({ type: 'success', message: 'Settings saved!' })
            // Refresh the global settings store so changes take effect everywhere
            refreshGlobal()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-6"><div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div></div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Branding */}
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                            <input type="text" name="site_name" value={settings.site_name} onChange={handleChange} className="input" />
                            <p className="text-xs text-gray-400 mt-1">Shows in header, login, signup, and receipts</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                            <input type="text" name="site_tagline" value={settings.site_tagline} onChange={handleChange} className="input" />
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                            <input type="email" name="support_email" value={settings.support_email} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                            <input type="tel" name="support_phone" value={settings.support_phone} onChange={handleChange} className="input" />
                        </div>
                    </div>
                </div>

                {/* Currency & Fees */}
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Currency & Fees</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select name="currency" value={settings.currency} onChange={handleChange} className="input">
                                <option value="NGN">Nigerian Naira (NGN)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="GHS">Ghanaian Cedi (GHS)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                            <input type="text" name="currency_symbol" value={settings.currency_symbol} onChange={handleChange} className="input" />
                            <p className="text-xs text-gray-400 mt-1">Used in all price displays across the app</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Fee (%)</label>
                            <input type="number" name="transaction_fee_percent" value={settings.transaction_fee_percent} onChange={handleChange} className="input" min="0" max="100" step="0.1" />
                        </div>
                    </div>
                </div>

                {/* Limits */}
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                            <input type="number" name="min_order_amount" value={settings.min_order_amount} onChange={handleChange} className="input" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Product Images</label>
                            <input type="number" name="max_product_images" value={settings.max_product_images} onChange={handleChange} className="input" min="1" max="10" />
                        </div>
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="require_email_verification" checked={settings.require_email_verification} onChange={handleChange} className="w-4 h-4 rounded text-primary-600" />
                            <div>
                                <span className="text-gray-700">Require email verification for new users</span>
                                <p className="text-xs text-gray-400">When disabled, new users can log in immediately without email OTP</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" name="allow_guest_browsing" checked={settings.allow_guest_browsing} onChange={handleChange} className="w-4 h-4 rounded text-primary-600" />
                            <div>
                                <span className="text-gray-700">Allow guest browsing without login</span>
                                <p className="text-xs text-gray-400">When disabled, users must log in to browse products</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode} onChange={handleChange} className="w-4 h-4 rounded text-yellow-600" />
                            <div>
                                <span className="text-yellow-800 font-medium">Maintenance Mode</span>
                                <p className="text-xs text-yellow-600">All non-admin API requests will return 503. Users will see a maintenance page.</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Legal */}
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Legal Pages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service URL</label>
                            <input type="url" name="terms_url" value={settings.terms_url} onChange={handleChange} className="input" placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy URL</label>
                            <input type="url" name="privacy_url" value={settings.privacy_url} onChange={handleChange} className="input" placeholder="https://..." />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    )
}
