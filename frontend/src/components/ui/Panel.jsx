import cn from '../../utils/cn'

/** Bordered surface section with an optional header row (title, description, actions). */
export default function Panel({ title, description, actions, padded = true, className, bodyClassName, children, as: Tag = 'section' }) {
    const hasHeader = title || actions
    return (
        <Tag className={cn('rounded-lg border border-line bg-surface', className)}>
            {hasHeader && (
                <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                        {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
                        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
                    </div>
                    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                </header>
            )}
            <div className={cn(padded && 'p-4 sm:p-5', bodyClassName)}>{children}</div>
        </Tag>
    )
}

/** Divided list of rows inside a Panel */
export function List({ className, children }) {
    return <ul className={cn('divide-y divide-line', className)}>{children}</ul>
}
