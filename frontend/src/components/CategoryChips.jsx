import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useCategoryStore from '../store/categoryStore'
import { categoryIcon } from '../utils/categoryIcons'
import cn from '../utils/cn'

/** Horizontally scrolling category links */
export default function CategoryChips({ activeSlug = null, className }) {
    const { categories, loading, fetchCategories } = useCategoryStore()

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    if (loading && categories.length === 0) {
        return (
            <div className={cn('flex gap-2 overflow-hidden', className)} aria-hidden>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-9 w-28 shrink-0 rounded-full" />)}
            </div>
        )
    }

    if (categories.length === 0) return null

    return (
        <nav aria-label="Categories" className={cn('-mx-4 overflow-x-auto px-4 no-scrollbar sm:-mx-6 sm:px-6', className)}>
            <ul className="flex gap-2">
                {categories.map((category) => {
                    const Icon = categoryIcon(category)
                    const active = category.slug === activeSlug
                    return (
                        <li key={category.id}>
                            <Link
                                to={`/category/${category.slug}`}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'border-fg bg-fg text-surface'
                                        : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg'
                                )}
                            >
                                <Icon size={16} aria-hidden />
                                {category.name}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
