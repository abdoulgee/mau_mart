import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import Button from './Button'
import cn from '../../utils/cn'

/** Accessible dialog: Escape and backdrop close it, focus moves inside and returns afterwards. */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
    const panelRef = useRef(null)
    const titleId = useId()
    // Keep the latest onClose without re-running the open/close effect (which moves focus)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        if (!open) return
        const previous = document.activeElement
        const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        // Focus the first field or button in the dialog
        const focusable = panelRef.current?.querySelector('input, select, textarea, button:not([data-close])')
        ;(focusable || panelRef.current)?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
            previous?.focus?.()
        }
    }, [open])

    if (!open) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 animate-fade-in sm:items-center sm:p-4" onMouseDown={onClose}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                    'flex max-h-[90vh] w-full flex-col rounded-t-xl border border-line bg-surface shadow-popover animate-slide-up sm:rounded-xl',
                    { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size]
                )}
            >
                <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-fg">{title}</h2>
                        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
                    </div>
                    <IconButton icon={X} label="Close" size="sm" onClick={onClose} data-close className="-mr-2" />
                </header>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
            </div>
        </div>,
        document.body
    )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onClose }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
                </>
            }
        >
            <p className="text-sm text-fg-muted">{message}</p>
        </Modal>
    )
}
