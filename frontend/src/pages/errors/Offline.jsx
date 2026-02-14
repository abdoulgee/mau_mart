import { Link } from 'react-router-dom'
import useUIStore from '../../store/uiStore'

export default function Offline() {
    const { isOnline } = useUIStore()

    // If back online, offer to reload
    if (isOnline) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Back Online!</h1>
                    <p className="text-gray-500 mb-8">
                        Your connection has been restored.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary px-8"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
            <div className="text-center">
                {/* Offline Illustration */}
                <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">No Internet Connection</h1>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Please check your network connection and try again. Some features may still work offline.
                </p>

                <div className="flex flex-col gap-3 items-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary px-6"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>

                    <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        Browse cached content
                    </Link>
                </div>

                {/* Offline tips */}
                <div className="mt-10 p-4 bg-blue-50 rounded-xl max-w-sm mx-auto">
                    <h3 className="font-medium text-blue-900 mb-2 text-sm">While you're offline:</h3>
                    <ul className="text-sm text-blue-700 text-left space-y-1">
                        <li>• Previously viewed products are available</li>
                        <li>• Saved items can be accessed</li>
                        <li>• Messages will sync when online</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
