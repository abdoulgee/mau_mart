import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import Button, { IconButton } from './Button'

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
        <div role="dialog" aria-label="Install app" className="fixed inset-x-3 bottom-20 z-50 animate-slide-up md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
            <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-popover">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-brand-fg">
                    <Download size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-fg">Install MAU MART</h3>
                    <p className="mt-0.5 text-xs text-fg-muted">
                        {isIOS ? 'Tap the Share button, then "Add to Home Screen".' : 'Add it to your home screen for quick access.'}
                    </p>
                    {!isIOS && (
                        <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={handleInstall}>Install</Button>
                            <Button size="sm" variant="ghost" onClick={handleDismiss}>Not now</Button>
                        </div>
                    )}
                </div>
                <IconButton icon={X} label="Dismiss" size="sm" onClick={handleDismiss} className="-mr-1 -mt-1" />
            </div>
        </div>
    )
}
