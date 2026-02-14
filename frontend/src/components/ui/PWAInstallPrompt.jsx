import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if already installed as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true
        if (isStandalone) return

        // Check if user already dismissed recently
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (dismissed) {
            const dismissedTime = parseInt(dismissed)
            // Don't show for 3 days after dismissal
            if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) return
        }

        // Check for iOS (no beforeinstallprompt)
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream
        setIsIOS(isIOSDevice)

        if (isIOSDevice) {
            // Show iOS instructions after 3 seconds
            const timer = setTimeout(() => setShowBanner(true), 3000)
            return () => clearTimeout(timer)
        }

        // Android/Chrome: listen for beforeinstallprompt
        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show banner after 3 seconds
            setTimeout(() => setShowBanner(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setShowBanner(false)
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowBanner(false)
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-20 left-3 right-3 z-50 animate-slide-up md:left-auto md:right-4 md:bottom-6 md:max-w-sm">
            <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl border border-gray-700/50">
                <div className="flex items-start gap-3">
                    {/* App Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                        </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm">Install MAU MART</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isIOS
                                ? 'Tap the share button, then "Add to Home Screen"'
                                : 'Get the full app experience — fast, offline access!'
                            }
                        </p>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-gray-300 p-1 flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Action */}
                <div className="mt-3 flex gap-2">
                    {isIOS ? (
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary-500 hover:bg-primary-600 transition-colors text-white"
                        >
                            Got It
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleInstall}
                                className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary-500 hover:bg-primary-600 transition-colors text-white flex items-center justify-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Install
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
