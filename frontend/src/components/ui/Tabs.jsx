import cn from '../../utils/cn'

/**
 * Segmented filter tabs. options: [{ value, label, count? }]
 * Arrow keys move between tabs (roving focus).
 */
export default function Tabs({ value, onChange, options, label, className, size = 'md' }) {
    const onKeyDown = (e, index) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length
        onChange(options[next].value)
        e.currentTarget.parentElement.children[next]?.focus()
    }

    return (
        <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full overflow-x-auto no-scrollbar rounded-lg border border-line bg-surface-muted p-0.5', className)}>
            {options.map((option, index) => {
                const active = option.value === value
                return (
                    <button
                        key={option.value}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e) => onKeyDown(e, index)}
                        className={cn(
                            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors',
                            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
                            active ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg'
                        )}
                    >
                        {option.label}
                        {option.count != null && (
                            <span className={cn('tabular text-xs', active ? 'text-fg-muted' : 'text-fg-subtle')}>{option.count}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
