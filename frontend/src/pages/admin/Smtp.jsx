import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'

export default function AdminSmtp() {
    const [config, setConfig] = useState({
        mail_server: '',
        mail_port: 587,
        mail_use_tls: true,
        mail_use_ssl: false,
        mail_username: '',
        mail_password: '',
        mail_default_sender: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const response = await api.get('/api/v1/admin/smtp-config')
            if (response.data.config) {
                setConfig({ ...config, ...response.data.config })
            }
        } catch (error) {
            // Config may not exist yet
        } finally {
            setLoading(false)
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
            addToast({ type: 'error', message: 'Failed to send test email. Check your configuration.' })
        } finally {
            setTesting(false)
        }
    }

    if (loading) {
        return <div className="p-6"><div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div></div>
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">SMTP Configuration</h1>

            <form onSubmit={handleSave} className="card space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mail Server *</label>
                        <input type="text" name="mail_server" value={config.mail_server} onChange={handleChange} placeholder="smtp.gmail.com" className="input" required />
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
                    <input type="text" name="mail_default_sender" value={config.mail_default_sender} onChange={handleChange} placeholder="MAU MART <noreply@maumart.com>" className="input" />
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
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </form>

            {/* Test Email */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Test Configuration</h3>
                <div className="flex gap-3">
                    <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Enter email to test..." className="input flex-1" />
                    <button onClick={handleTest} disabled={testing} className="btn-secondary disabled:opacity-50">
                        {testing ? 'Sending...' : 'Send Test'}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Save the configuration first, then send a test email to verify it works.</p>
            </div>

            {/* Help */}
            <div className="card bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Gmail Users</h3>
                <p className="text-sm text-blue-800 mb-2">For Gmail, use these settings:</p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Server: smtp.gmail.com</li>
                    <li>Port: 587 (TLS) or 465 (SSL)</li>
                    <li>Use an App Password (not your regular password)</li>
                    <li>Enable 2FA and generate an App Password in Google Account settings</li>
                </ul>
            </div>
        </div>
    )
}
