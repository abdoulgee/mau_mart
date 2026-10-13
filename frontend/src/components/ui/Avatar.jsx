import { useState } from 'react'
import getImageUrl from '../../utils/imageUrl'
import cn from '../../utils/cn'

const sizes = {
    xs: 'h-6 w-6 text-2xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl',
}

export default function Avatar({ user, size = 'md', className }) {
    const [failed, setFailed] = useState(false)
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '?'
    const src = !failed && user?.avatar_url ? getImageUrl(user.avatar_url) : null

    return (
        <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-semibold text-fg-muted ring-1 ring-line', sizes[size], className)}>
            {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
            ) : (
                <span aria-hidden>{initials}</span>
            )}
        </span>
    )
}
