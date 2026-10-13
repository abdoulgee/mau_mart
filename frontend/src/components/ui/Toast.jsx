import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import useUIStore from '../../store/uiStore'
import cn from '../../utils/cn'

const styles = {
    success: { icon: CheckCircle2, color: 'text-success' },
    error: { icon: AlertCircle, color: 'text-danger' },
    warning: { icon: AlertTriangle, color: 'text-warning' },
    info: { icon: Info, color: 'text-info' },
}

export function Toaster() {
    const { toasts, removeToast } = useUIStore()

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-20 z-[110] flex flex-col items-center gap-2 md:bottom-6 md:left-auto md:right-6 md:items-end"
        >
            {toasts.map((toast) => {
                const { icon: Icon, color } = styles[toast.type] || styles.info
                return (
                    <div
                        key={toast.id}
                        role={toast.type === 'error' ? 'alert' : 'status'}
                        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface p-3 shadow-popover animate-slide-up"
                    >
                        <Icon size={18} className={cn('mt-px shrink-0', color)} aria-hidden />
                        <p className="flex-1 text-sm text-fg">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            className="-m-1 rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg"
                            aria-label="Dismiss"
                        >
                            <X size={16} aria-hidden />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

// Shorthand: const toast = useToast(); toast.success('Saved')
export function useToast() {
    const addToast = useUIStore((state) => state.addToast)
    return {
        success: (message, duration) => addToast({ type: 'success', message, duration }),
        error: (message, duration) => addToast({ type: 'error', message, duration }),
        warning: (message, duration) => addToast({ type: 'warning', message, duration }),
        info: (message, duration) => addToast({ type: 'info', message, duration }),
    }
}
