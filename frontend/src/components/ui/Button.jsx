import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import cn from '../../utils/cn'

const variants = {
    primary: 'bg-brand text-brand-fg hover:bg-brand-hover',
    secondary: 'bg-surface text-fg border border-line hover:bg-surface-hover hover:border-line-strong',
    ghost: 'text-fg-muted hover:bg-surface-hover hover:text-fg',
    danger: 'bg-danger text-white hover:bg-danger-hover dark:text-canvas',
    'danger-ghost': 'text-danger hover:bg-danger-soft',
    whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp-hover dark:text-canvas',
}

const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
}

const iconSizes = { sm: 14, md: 16, lg: 18 }

/**
 * Button. Renders a <Link> when `to` is set, an <a> when `href` is set.
 * `icon` / `iconRight` take Lucide components. `loading` shows a spinner and disables the button.
 */
const Button = forwardRef(function Button(
    { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, fullWidth = false,
        to, href, className, children, disabled, type = 'button', ...props },
    ref
) {
    const classes = cn(
        'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap select-none',
        'transition-colors duration-150 active:translate-y-px',
        'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
    )
    const iconSize = iconSizes[size]
    const content = (
        <>
            {loading ? <Loader2 size={iconSize} className="animate-spin" aria-hidden /> : Icon && <Icon size={iconSize} aria-hidden />}
            {children}
            {IconRight && !loading && <IconRight size={iconSize} aria-hidden />}
        </>
    )

    if (to) {
        return <Link ref={ref} to={to} className={classes} aria-disabled={disabled || undefined} {...props}>{content}</Link>
    }
    if (href) {
        return <a ref={ref} href={href} className={classes} {...props}>{content}</a>
    }
    return (
        <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
            {content}
        </button>
    )
})

export default Button

/** Square icon-only button. `label` is required: it becomes the accessible name and tooltip. */
export const IconButton = forwardRef(function IconButton(
    { icon: Icon, label, variant = 'ghost', size = 'md', to, className, badge = false, ...props },
    ref
) {
    const dims = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-11 w-11' }[size]
    const classes = cn(
        'relative inline-flex items-center justify-center rounded-lg transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        dims,
        className
    )
    const inner = (
        <>
            <Icon size={size === 'sm' ? 16 : 20} aria-hidden />
            {badge && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden />}
        </>
    )
    if (to) {
        return <Link ref={ref} to={to} className={classes} aria-label={label} title={label} {...props}>{inner}</Link>
    }
    return (
        <button ref={ref} type="button" className={classes} aria-label={label} title={label} {...props}>{inner}</button>
    )
})
