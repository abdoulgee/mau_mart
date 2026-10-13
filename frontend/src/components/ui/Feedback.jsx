import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import cn from '../../utils/cn'

const tones = {
    neutral: { badge: 'bg-surface-muted text-fg-muted', alert: 'bg-surface-muted text-fg border-line', icon: Info },
    brand: { badge: 'bg-brand-soft text-brand-text', alert: 'bg-brand-soft text-fg border-brand/20', icon: Info },
    success: { badge: 'bg-success-soft text-success', alert: 'bg-success-soft text-fg border-success/20', icon: CheckCircle2 },
    danger: { badge: 'bg-danger-soft text-danger', alert: 'bg-danger-soft text-fg border-danger/20', icon: AlertCircle },
    warning: { badge: 'bg-warning-soft text-warning', alert: 'bg-warning-soft text-fg border-warning/20', icon: AlertTriangle },
    info: { badge: 'bg-info-soft text-info', alert: 'bg-info-soft text-fg border-info/20', icon: Info },
}
const iconTone = { neutral: 'text-fg-muted', brand: 'text-brand-text', success: 'text-success', danger: 'text-danger', warning: 'text-warning', info: 'text-info' }

/** Small status label. Use sparingly, for real states (Sold, Removed, Pending...). */
export function Badge({ tone = 'neutral', dot = false, className, children }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', tones[tone].badge, className)}>
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
            {children}
        </span>
    )
}

/** Inline message for form errors, notices and tips. Errors are announced to screen readers. */
export function Alert({ tone = 'info', title, icon, action, className, children }) {
    const Icon = icon || tones[tone].icon
    return (
        <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-3 text-sm', tones[tone].alert, className)}>
            <Icon size={18} aria-hidden className={cn('mt-px shrink-0', iconTone[tone])} />
            <div className="min-w-0 flex-1 space-y-0.5">
                {title && <p className="font-medium">{title}</p>}
                {children && <div className="text-fg-muted">{children}</div>}
            </div>
            {action && <div className="shrink-0 self-center">{action}</div>}
        </div>
    )
}

export function Spinner({ size = 20, className, label = 'Loading' }) {
    return (
        <span role="status" className={cn('inline-flex text-fg-subtle', className)}>
            <Loader2 size={size} className="animate-spin" aria-hidden />
            <span className="sr-only">{label}</span>
        </span>
    )
}

/** Centered spinner for a full section while data loads */
export function LoadingBlock({ label = 'Loading', className }) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-fg-subtle', className)}>
            <Spinner size={24} label={label} />
            <p className="text-sm">{label}…</p>
        </div>
    )
}

export function EmptyState({ icon: Icon, title, message, action, className }) {
    return (
        <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
            {Icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-fg-subtle">
                    <Icon size={22} aria-hidden />
                </div>
            )}
            <h3 className="text-base font-semibold text-fg">{title}</h3>
            {message && <p className="mt-1 max-w-sm text-sm text-fg-muted">{message}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}

/** Error block with a retry button, for failed data loads */
export function ErrorState({ title = 'Something went wrong', message = 'Check your connection and try again.', onRetry, className }) {
    return (
        <EmptyState
            icon={AlertCircle}
            title={title}
            message={message}
            className={className}
            action={onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-hover"
                >
                    Try again
                </button>
            )}
        />
    )
}
