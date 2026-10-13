import { SkeletonRows } from './Skeleton'
import { EmptyState, ErrorState } from './Feedback'
import cn from '../../utils/cn'

/**
 * Responsive table: a real <table> from md up, stacked rows on phones.
 * columns: [{ key, header, render(row), className, align: 'right', primary: true, hideOnMobile: true }]
 * The `primary` column leads each stacked row; the rest show as label/value lines.
 */
export default function DataTable({ columns, rows, rowKey = 'id', loading, error, onRetry, empty, caption }) {
    if (loading) return <SkeletonRows rows={5} />
    if (error) return <ErrorState message="This list could not be loaded." onRetry={onRetry} />
    if (!rows.length) return empty || <EmptyState title="Nothing here yet" />

    const primary = columns.find((c) => c.primary) || columns[0]
    const secondary = columns.filter((c) => c !== primary && !c.hideOnMobile)
    const value = (column, row) => (column.render ? column.render(row) : row[column.key])

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                    {caption && <caption className="sr-only">{caption}</caption>}
                    <thead>
                        <tr className="border-b border-line text-xs font-medium text-fg-muted">
                            {columns.map((c) => (
                                <th key={c.key} scope="col" className={cn('px-4 py-2.5 font-medium', c.align === 'right' && 'text-right', c.className)}>
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rows.map((row) => (
                            <tr key={row[rowKey]} className="hover:bg-surface-hover/50">
                                {columns.map((c) => (
                                    <td key={c.key} className={cn('px-4 py-3 align-middle', c.align === 'right' && 'text-right', c.className)}>
                                        {value(c, row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
                {rows.map((row) => (
                    <li key={row[rowKey]} className="space-y-2 px-4 py-3">
                        <div>{value(primary, row)}</div>
                        {secondary.length > 0 && (
                            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 text-sm">
                                {secondary.map((c) => (
                                    <div key={c.key} className="contents">
                                        <dt className="text-xs text-fg-subtle">{c.header}</dt>
                                        <dd className="min-w-0 justify-self-start">{value(c, row)}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </li>
                ))}
            </ul>
        </>
    )
}
