import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'

const HTML_TEMPLATES = [
    {
        name: 'Announcement',
        html: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; }
.header h1 { color: white; margin: 0; font-size: 28px; }
.header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
.content { padding: 30px; }
.content h2 { color: #1f2937; margin: 0 0 15px; }
.content p { color: #4b5563; line-height: 1.7; margin: 0 0 15px; }
.btn { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
.footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📢 Announcement</h1>
    <p>Important update from your marketplace</p>
  </div>
  <div class="content">
    <h2>Hello there!</h2>
    <p>We have an exciting update to share with you. Edit this content to craft your message.</p>
    <p>Add your details here...</p>
    <p><a href="#" class="btn">Learn More</a></p>
  </div>
  <div class="footer">
    <p>&copy; MAU MART - Campus Marketplace</p>
    <p>You received this because you're a member of our community.</p>
  </div>
</div>
</body>
</html>`
    },
    {
        name: 'Promotion',
        html: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 40px 30px; text-align: center; }
.header h1 { color: white; margin: 0; font-size: 36px; }
.header .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-top: 10px; }
.content { padding: 30px; text-align: center; }
.content h2 { color: #1f2937; margin: 0 0 10px; font-size: 24px; }
.content p { color: #4b5563; line-height: 1.7; }
.highlight { background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; }
.highlight .price { font-size: 32px; font-weight: bold; color: #f59e0b; }
.btn { display: inline-block; background: #ef4444; color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; }
.footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🔥 SALE</h1>
    <span class="badge">Limited Time Offer</span>
  </div>
  <div class="content">
    <h2>Don't Miss Out!</h2>
    <p>Amazing deals are waiting for you on the marketplace.</p>
    <div class="highlight">
      <p class="price">Up to 50% OFF</p>
      <p>On selected items this week only!</p>
    </div>
    <p><a href="#" class="btn">Shop Now →</a></p>
  </div>
  <div class="footer">
    <p>&copy; MAU MART - Campus Marketplace</p>
  </div>
</div>
</body>
</html>`
    },
    {
        name: 'Newsletter',
        html: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center; }
.header h1 { color: white; margin: 0; font-size: 24px; }
.content { padding: 30px; }
.content h2 { color: #1f2937; font-size: 20px; margin: 0 0 10px; }
.content p { color: #4b5563; line-height: 1.7; }
.section { border-bottom: 1px solid #e5e7eb; padding: 20px 0; }
.section:last-child { border-bottom: none; }
.tip { background: #ecfdf5; padding: 15px; border-radius: 10px; border-left: 4px solid #10b981; margin: 15px 0; }
.footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📬 Weekly Newsletter</h1>
  </div>
  <div class="content">
    <div class="section">
      <h2>What's New</h2>
      <p>Here's what happened this week on the marketplace. Edit this section with your latest news.</p>
    </div>
    <div class="section">
      <h2>Tips & Tricks</h2>
      <div class="tip">
        <p><strong>💡 Seller Tip:</strong> Add clear photos and detailed descriptions to your listings to boost sales!</p>
      </div>
    </div>
    <div class="section">
      <h2>Coming Soon</h2>
      <p>We're working on exciting new features. Stay tuned for updates!</p>
    </div>
  </div>
  <div class="footer">
    <p>&copy; MAU MART - Campus Marketplace</p>
  </div>
</div>
</body>
</html>`
    },
    {
        name: 'Blank',
        html: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.content { padding: 30px; }
.content p { color: #4b5563; line-height: 1.7; }
</style>
</head>
<body>
<div class="container">
  <div class="content">
    <p>Write your email content here...</p>
  </div>
</div>
</body>
</html>`
    },
]

export default function AdminEmailMarketing() {
    const [subject, setSubject] = useState('')
    const [htmlContent, setHtmlContent] = useState(HTML_TEMPLATES[0].html)
    const [audience, setAudience] = useState('all_users')
    const [sending, setSending] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [stats, setStats] = useState(null)
    const { addToast } = useUIStore()

    // Fetch recipient count
    useEffect(() => {
        fetchAudienceCount()
    }, [audience])

    const fetchAudienceCount = async () => {
        try {
            const response = await api.get(`/api/v1/admin/email-marketing/audience-count?audience=${audience}`)
            setStats(response.data)
        } catch {
            setStats(null)
        }
    }

    const handleTemplateSelect = (template) => {
        setHtmlContent(template.html)
    }

    const handleSend = async () => {
        if (!subject.trim()) {
            addToast({ type: 'error', message: 'Please enter an email subject' })
            return
        }
        if (!htmlContent.trim()) {
            addToast({ type: 'error', message: 'Please enter email content' })
            return
        }

        const count = stats?.count || 0
        if (!window.confirm(`Are you sure you want to send this email to ${count} recipient(s)?`)) return

        setSending(true)
        try {
            const response = await api.post('/api/v1/admin/email-marketing/send', {
                subject: subject.trim(),
                html_content: htmlContent,
                audience
            })
            addToast({ type: 'success', message: response.data.message || 'Emails sent!' })
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to send emails' })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
                    <p className="text-sm text-gray-500 mt-1">Compose and send emails to your users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Compose */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Subject */}
                    <div className="card">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Email Subject *</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="e.g. Exciting News from MAU MART!"
                            className="input"
                        />
                    </div>

                    {/* Template Selector */}
                    <div className="card">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Quick Templates</label>
                        <div className="flex gap-2 flex-wrap">
                            {HTML_TEMPLATES.map(t => (
                                <button
                                    key={t.name}
                                    onClick={() => handleTemplateSelect(t)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-600 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor / Preview Toggle */}
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <button
                                onClick={() => setPreviewMode(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!previewMode ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                ✏️ HTML Editor
                            </button>
                            <button
                                onClick={() => setPreviewMode(true)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${previewMode ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                👁️ Preview
                            </button>
                        </div>

                        {previewMode ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-4">
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <iframe
                                        srcDoc={htmlContent}
                                        title="Email Preview"
                                        className="w-full border-0"
                                        style={{ minHeight: '500px' }}
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        ) : (
                            <textarea
                                value={htmlContent}
                                onChange={e => setHtmlContent(e.target.value)}
                                className="w-full h-[500px] font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-xl border-0 resize-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter your HTML email content here..."
                                spellCheck={false}
                            />
                        )}
                    </div>
                </div>

                {/* Right: Audience & Send */}
                <div className="space-y-4">
                    {/* Audience Selector */}
                    <div className="card">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Send To</label>
                        <div className="space-y-2">
                            {[
                                { value: 'all_users', label: 'All Users', desc: 'Every registered user', icon: '👥' },
                                { value: 'sellers', label: 'Sellers Only', desc: 'Users with active stores', icon: '🏪' },
                                { value: 'buyers', label: 'Buyers Only', desc: 'Regular users (non-sellers)', icon: '🛒' },
                                { value: 'verified', label: 'Verified Users', desc: 'Only email-verified users', icon: '✅' },
                            ].map(opt => (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${audience === opt.value
                                            ? 'border-primary-400 bg-primary-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="audience"
                                        value={opt.value}
                                        checked={audience === opt.value}
                                        onChange={e => setAudience(e.target.value)}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <span className="text-xl">{opt.icon}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                                        <p className="text-xs text-gray-500">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-indigo-600">{stats.count}</p>
                                <p className="text-sm text-indigo-500 font-medium">Recipients</p>
                            </div>
                        </div>
                    )}

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={sending || !subject.trim()}
                        className="w-full btn-primary py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Email
                            </>
                        )}
                    </button>

                    {/* Warning */}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-xs text-yellow-700">
                            <strong>⚠️ Note:</strong> Emails are sent using your configured SMTP settings. Make sure SMTP is properly set up in <em>SMTP Settings</em> before sending.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
