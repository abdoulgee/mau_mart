import { Header } from '../components/navigation/Header'

export default function Support() {
    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Help & Support" showBack />
            <div className="p-4 space-y-4">
                <div className="card">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Frequently Asked Questions
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-surface-50 rounded-2xl">
                            <p className="font-semibold text-gray-800 text-sm">How do I become a seller?</p>
                            <p className="text-sm text-gray-500 mt-1">Go to your Profile and tap "Become a Seller" to submit your application.</p>
                        </div>
                        <div className="p-3 bg-surface-50 rounded-2xl">
                            <p className="font-semibold text-gray-800 text-sm">How do I track my order?</p>
                            <p className="text-sm text-gray-500 mt-1">Check the Orders section in your profile to see order status.</p>
                        </div>
                        <div className="p-3 bg-surface-50 rounded-2xl">
                            <p className="font-semibold text-gray-800 text-sm">How do I contact a seller?</p>
                            <p className="text-sm text-gray-500 mt-1">Use the chat feature on any product page to message the seller.</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Contact Us
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">Need more help? Reach out to our support team.</p>
                    <a href="mailto:support@maumart.com" className="btn-primary block text-center">Email Support</a>
                </div>
            </div>
        </div>
    )
}
