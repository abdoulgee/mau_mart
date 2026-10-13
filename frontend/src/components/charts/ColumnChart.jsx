import { useState, useRef, useId } from 'react'

/** Round the axis maximum up to a clean value (1, 2, 5 × 10^n) with ~4 ticks */
function niceScale(max) {
    if (max <= 4) return { top: Math.max(max, 1), step: 1 }
    const rough = max / 4
    const power = 10 ** Math.floor(Math.log10(rough))
    const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough)
    return { top: Math.ceil(max / step) * step, step }
}

const compact = (n) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(n))

/**
 * Single-series column chart (one hue, no legend; the panel title names the series).
 * data: [{ key, label (axis), title (tooltip), value }]
 * Columns ≤ 24px with a 4px rounded cap, hairline grid, peak value labelled on its cap,
 * hover/focus tooltip per column, and a table view for screen readers and anyone who prefers numbers.
 */
export default function ColumnChart({ data, valueLabel = 'Value', height = 200, labelEvery = 2 }) {
    const [active, setActive] = useState(null)
    const wrapRef = useRef(null)
    const tableId = useId()

    const width = 640
    const pad = { top: 20, right: 8, bottom: 24, left: 32 }
    const innerW = width - pad.left - pad.right
    const innerH = height - pad.top - pad.bottom
    const max = Math.max(0, ...data.map((d) => d.value))
    const { top, step } = niceScale(max)
    const band = innerW / data.length
    const barW = Math.min(24, band - 2) // never fill the slot; keep at least a 2px surface gap
    const y = (v) => pad.top + innerH - (v / top) * innerH
    const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)
    const peakIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1

    // Column with a 4px rounded data-end and a square baseline
    const columnPath = (x, v) => {
        const h = (v / top) * innerH
        if (h <= 0) return ''
        const r = Math.min(4, h, barW / 2)
        const yTop = y(v)
        const yBase = pad.top + innerH
        return `M${x},${yBase} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${yBase} Z`
    }

    const activeItem = active != null ? data[active] : null
    const tooltipLeft = active != null ? ((pad.left + band * active + band / 2) / width) * 100 : 0

    return (
        <figure className="space-y-3">
            <div ref={wrapRef} className="relative" onMouseLeave={() => setActive(null)}>
                <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-describedby={tableId} aria-label={`${valueLabel} per day`}>
                    {/* Gridlines + y ticks */}
                    {ticks.map((t) => (
                        <g key={t}>
                            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-subtle text-[11px] tabular">{compact(t)}</text>
                        </g>
                    ))}

                    {data.map((d, i) => {
                        const x = pad.left + band * i + (band - barW) / 2
                        const dim = active != null && active !== i
                        return (
                            <g key={d.key}>
                                <path d={columnPath(x, d.value)} className={`fill-chart transition-opacity ${dim ? 'opacity-40' : ''}`} />
                                {i === peakIndex && (
                                    <text x={x + barW / 2} y={y(d.value) - 6} textAnchor="middle" className="fill-fg text-[11px] font-semibold tabular">{d.value}</text>
                                )}
                                {i % labelEvery === (data.length - 1) % labelEvery && (
                                    <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="fill-fg-subtle text-[11px]">{d.label}</text>
                                )}
                                {/* Hit target: the whole band, taller than the mark */}
                                <rect
                                    x={pad.left + band * i}
                                    y={pad.top}
                                    width={band}
                                    height={innerH}
                                    fill="transparent"
                                    tabIndex={0}
                                    role="presentation"
                                    className="cursor-default outline-none focus-visible:stroke-brand"
                                    strokeWidth="2"
                                    onMouseEnter={() => setActive(i)}
                                    onFocus={() => setActive(i)}
                                    onBlur={() => setActive(null)}
                                />
                            </g>
                        )
                    })}
                </svg>

                {activeItem && (
                    <div
                        className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 shadow-popover"
                        style={{ left: `${Math.min(Math.max(tooltipLeft, 12), 88)}%` }}
                        role="status"
                    >
                        <p className="text-sm font-semibold text-fg tabular">{activeItem.value.toLocaleString()}</p>
                        <p className="text-xs text-fg-muted">{activeItem.title}</p>
                    </div>
                )}
            </div>

            <details className="group text-xs">
                <summary className="cursor-pointer select-none text-fg-muted hover:text-fg">Show as table</summary>
                <table id={tableId} className="mt-2 w-full text-left text-sm">
                    <thead><tr className="text-xs text-fg-muted"><th className="py-1 font-medium">Date</th><th className="py-1 text-right font-medium">{valueLabel}</th></tr></thead>
                    <tbody className="divide-y divide-line">
                        {data.map((d) => (
                            <tr key={d.key}><td className="py-1 text-fg-muted">{d.title}</td><td className="py-1 text-right text-fg tabular">{d.value}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    )
}
