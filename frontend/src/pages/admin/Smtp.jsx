import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'

export default function AdminSmtp() {
    const [emailProvider, setEmailProvider] = useState('resend')
    const [config, setConfig] = useState({
        mail_server: '',
        mail_port: 465,
        mail_use_tls: false,
        mail_use_ssl: true,
        mail_username: '',
        mail_password: '',
        mail_default_sender: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savingProvider, setSavingProvider] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchConfig()
        fetchSettings()
    }, [])

    const fetchConfig = async () => {
        try {
            const response = await api.get('/api/v1/admin/smtp-config')
            if (response.data.config) {
                setConfig(prev => ({ ...prev, ...response.data.config }))
            }
        } catch (error) {
            // Config may not exist yet
        } finally {
            setLoading(false)
        }
    }

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/v1/admin/settings')
            const settings = response.data.settings || {}
            if (settings.email_provider) {
                // Migrate old mailgun setting
                setEmailProvider(settings.email_provider === 'mailgun' ? 'resend' : settings.email_provider)
            }
        } catch (error) {
            // ignore
        }
    }

    const handleProviderChange = async (provider) => {
        setEmailProvider(provider)
        setSavingProvider(true)
        try {
            const res = await api.get('/api/v1/admin/settings')
            const currentSettings = res.data.settings || {}
            await api.post('/api/v1/admin/settings', { ...currentSettings, email_provider: provider })
            addToast({ type: 'success', message: `Email provider set to ${provider === 'resend' ? 'Resend (HTTP)' : 'SMTP'}` })
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to save email provider' })
        } finally {
            setSavingProvider(false)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
        }))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/api/v1/admin/smtp-config', config)
            addToast({ type: 'success', message: 'SMTP configuration saved!' })
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to save configuration' })
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        if (!testEmail) {
            addToast({ type: 'error', message: 'Enter a test email address' })
            return
        }
        setTesting(true)
        try {
            await api.post('/api/v1/admin/smtp-test', { email: testEmail })
            addToast({ type: 'success', message: 'Test email sent! Check your inbox.' })
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to send test email.' })
        } finally {
            setTesting(false)
        }
    }

    if (loading) {
        return <div className="p-6"><div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div></div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Email Configuration</h1>

            {/* Email Provider Toggle */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Email Provider</h3>
                <p className="text-sm text-gray-500 mb-4">Choose how MAU MART sends emails (OTP codes, marketing, notifications)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={() => handleProviderChange('resend')}
                        disabled={savingProvider}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${emailProvider === 'resend'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailProvider === 'resend' ? 'border-primary-500' : 'border-gray-300'
                                }`}>
                                {emailProvider === 'resend' && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Resend (HTTP API)</p>
                                <p className="text-xs text-gray-500 mt-0.5">Recommended for Render & cloud hosting</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => handleProviderChange('smtp')}
                        disabled={savingProvider}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${emailProvider === 'smtp'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailProvider === 'smtp' ? 'border-primary-500' : 'border-gray-300'
                                }`}>
                                {emailProvider === 'smtp' && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">SMTP (Direct)</p>
                                <p className="text-xs text-gray-500 mt-0.5">For VPS / servers with open SMTP ports</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Resend Info */}
            {emailProvider === 'resend' && (
                <div className="card bg-green-50 border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">✅ Resend Active</h3>
                    <p className="text-sm text-green-800">
                        Emails are sent via Resend HTTP API. Configure your API key in the server environment variables:
                    </p>
                    <ul className="text-sm text-green-700 list-disc list-inside mt-2 space-y-1">
                        <li><code>RESEND_API_KEY</code> — Your Resend API key</li>
                        <li><code>RESEND_FROM_EMAIL</code> — Sender email (optional, defaults to onboarding@resend.dev)</li>
                    </ul>
                    <p className="text-xs text-green-600 mt-3">
                        💡 On free tier, you can only send to your own email. Verify a domain at resend.com/domains to send to anyone.
                    </p>
                </div>
            )}

            {/* SMTP Config */}
            <div className={emailProvider === 'smtp' ? '' : 'opacity-60'}>
                <form onSubmit={handleSave} className="card space-y-6">
                    <h3 className="font-semibold text-gray-900">SMTP Configuration {emailProvider !== 'smtp' && <span className="text-xs text-gray-400">(fallback)</span>}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mail Server *</label>
                            <input type="text" name="mail_server" value={config.mail_server} onChange={handleChange} placeholder="mail.yourdomain.com" className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
                            <input type="number" name="mail_port" value={config.mail_port} onChange={handleChange} className="input" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                            <input type="email" name="mail_username" value={config.mail_username} onChange={handleChange} placeholder="your@email.com" className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input type="password" name="mail_password" value={config.mail_password} onChange={handleChange} placeholder="App password" className="input" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Sender</label>
                        <input type="text" name="mail_default_sender" value={config.mail_default_sender} onChange={handleChange} placeholder="MAU MART <noreply@yourdomain.com>" className="input" />
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="mail_use_tls" checked={config.mail_use_tls} onChange={handleChange} className="w-4 h-4 rounded text-primary-600" />
                            <span className="text-sm text-gray-700">Use TLS</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="mail_use_ssl" checked={config.mail_use_ssl} onChange={handleChange} className="w-4 h-4 rounded text-primary-600" />
                            <span className="text-sm text-gray-700">Use SSL</span>
                        </label>
                    </div>

                    <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save SMTP Configuration'}
                    </button>
                </form>
            </div>

            {/* Test Email */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Send Test Email</h3>
                <p className="text-sm text-gray-500 mb-3">
                    Test using the <strong>{emailProvider === 'resend' ? 'Resend' : 'SMTP'}</strong> provider
                </p>
                <div className="flex gap-3">
                    <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Enter email to test..." className="input flex-1" />
                    <button onClick={handleTest} disabled={testing} className="btn-secondary disabled:opacity-50">
                        {testing ? 'Sending...' : 'Send Test'}
                    </button>
                </div>
            </div>
        </div>
    )
}
