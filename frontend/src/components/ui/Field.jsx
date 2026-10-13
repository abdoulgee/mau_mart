import { forwardRef, useId, useState } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import cn from '../../utils/cn'

export const controlClass = (error, extra) => cn(
    'w-full rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle',
    'transition-colors duration-150 hover:border-line-strong',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
    'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle',
    error
        ? 'border-danger focus-visible:ring-danger/30 focus:border-danger'
        : 'border-line focus-visible:ring-brand/30 focus:border-brand',
    extra
)

/**
 * Label + control + hint/error, wired up for screen readers.
 * The render prop receives the props the control needs ({ id, aria-invalid, aria-describedby }).
 */
export function Field({ label, hint, error, required, optional, className, children, id: idProp }) {
    const autoId = useId()
    const id = idProp || autoId
    const hintId = hint ? `${id}-hint` : undefined
    const errorId = error ? `${id}-error` : undefined

    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-fg">
                    <span>
                        {label}
                        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
                    </span>
                    {optional && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
                </label>
            )}
            {children({
                id,
                'aria-invalid': error ? true : undefined,
                'aria-describedby': cn(errorId, hintId) || undefined,
                'aria-required': required || undefined,
            })}
            {error ? (
                <p id={errorId} className="flex items-center gap-1 text-xs font-medium text-danger">
                    <AlertCircle size={14} aria-hidden className="shrink-0" />
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className="text-xs text-fg-subtle">{hint}</p>
            ) : null}
        </div>
    )
}

export const TextField = forwardRef(function TextField(
    { label, hint, error, required, optional, className, inputClassName, icon: Icon, suffix, id, ...props },
    ref
) {
    return (
        <Field label={label} hint={hint} error={error} required={required} optional={optional} className={className} id={id}>
            {(fieldProps) => (
                <div className="relative">
                    {Icon && <Icon size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />}
                    <input
                        ref={ref}
                        {...fieldProps}
                        {...props}
                        className={controlClass(error, cn('h-10', Icon && 'pl-9', suffix && 'pr-10', inputClassName))}
                    />
                    {suffix && <div className="absolute right-1 top-1/2 -translate-y-1/2">{suffix}</div>}
                </div>
            )}
        </Field>
    )
})

export const PasswordField = forwardRef(function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)
    const Toggle = visible ? EyeOff : Eye
    return (
        <TextField
            ref={ref}
            {...props}
            type={visible ? 'text' : 'password'}
            suffix={
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-hover hover:text-fg"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    <Toggle size={16} aria-hidden />
                </button>
            }
        />
    )
})

export const TextAreaField = forwardRef(function TextAreaField(
    { label, hint, error, required, optional, className, rows = 4, maxLength, value, id, ...props },
    ref
) {
    const counter = maxLength ? `${String(value || '').length}/${maxLength}` : null
    return (
        <Field label={label} hint={hint || counter} error={error} required={required} optional={optional} className={className} id={id}>
            {(fieldProps) => (
                <textarea
                    ref={ref}
                    rows={rows}
                    maxLength={maxLength}
                    value={value}
                    {...fieldProps}
                    {...props}
                    className={controlClass(error, 'resize-y py-2 leading-relaxed')}
                />
            )}
        </Field>
    )
})

export const SelectField = forwardRef(function SelectField(
    { label, hint, error, required, optional, className, children, id, ...props },
    ref
) {
    return (
        <Field label={label} hint={hint} error={error} required={required} optional={optional} className={className} id={id}>
            {(fieldProps) => (
                <select ref={ref} {...fieldProps} {...props} className={controlClass(error, 'h-10 pr-8')}>
                    {children}
                </select>
            )}
        </Field>
    )
})

/** Checkbox with a label and optional description */
export function Checkbox({ label, description, className, ...props }) {
    const id = useId()
    return (
        <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-surface-hover', className)}>
            <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line-strong accent-[rgb(var(--brand))]" {...props} />
            <span>
                <span className="block text-sm font-medium text-fg">{label}</span>
                {description && <span className="block text-xs text-fg-subtle">{description}</span>}
            </span>
        </label>
    )
}
