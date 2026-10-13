/**
 * Ranked horizontal bars (e.g. listings per category). Values sit at the bar tip in text color;
 * the bar carries the single chart hue. It's a list, so screen readers get label + value directly.
 */
export default function BarList({ items, valueLabel = 'listings', max: maxProp }) {
    const max = maxProp ?? Math.max(1, ...items.map((i) => i.count))

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.name} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate text-fg-muted" title={item.name}>{item.name}</span>
                    <span className="h-3 rounded-r bg-surface-muted" aria-hidden>
                        <span
                            className="block h-full rounded-r bg-chart"
                            style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
                        />
                    </span>
                    <span className="w-8 text-right font-medium text-fg tabular">
                        {item.count}<span className="sr-only"> {valueLabel}</span>
                    </span>
                </li>
            ))}
        </ul>
    )
}
