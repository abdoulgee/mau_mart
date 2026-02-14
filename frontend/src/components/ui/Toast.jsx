import { useEffect } from 'react'
import useUIStore from '../../store/uiStore'

// Toast types with their styles
const toastStyles = {
    success: {
        bg: 'bg-emerald-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ),
    },
    error: {
        bg: 'bg-red-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
    warning: {
        bg: 'bg-amber-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    },
    info: {
        bg: 'bg-blue-500',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
}

function Toast({ toast, onRemove }) {
    const style = toastStyles[toast.type] || toastStyles.info

    return (
        <div
            className={`${style.bg} text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-slide-up max-w-sm mx-auto`}
        >
            <span className="flex-shrink-0 bg-white/20 p-1 rounded-lg">{style.icon}</span>
            <p className="text-sm font-semibold flex-1">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}

export function Toaster() {
    const { toasts, removeToast } = useUIStore()

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast toast={toast} onRemove={removeToast} />
                </div>
            ))}
        </div>
    )
}

// Hook to show toasts easily
export function useToast() {
    const addToast = useUIStore((state) => state.addToast)

    return {
        success: (message, duration) => addToast({ type: 'success', message, duration }),
        error: (message, duration) => addToast({ type: 'error', message, duration }),
        warning: (message, duration) => addToast({ type: 'warning', message, duration }),
        info: (message, duration) => addToast({ type: 'info', message, duration }),
    }
}

export default Toast
