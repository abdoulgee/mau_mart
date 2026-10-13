import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LayoutGrid } from 'lucide-react'
import Page from '../components/navigation/Page'
import { EmptyState } from '../components/ui/Feedback'
import useCategoryStore from '../store/categoryStore'
import { categoryIcon } from '../utils/categoryIcons'

export default function Categories() {
    const { categories, loading, fetchCategories } = useCategoryStore()

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    return (
        <Page title="Browse" description="Find listings by category">
            {loading && categories.length === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
                </div>
            ) : categories.length === 0 ? (
                <EmptyState icon={LayoutGrid} title="No categories yet" message="Check back soon." />
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => {
                        const Icon = categoryIcon(category)
                        return (
                            <li key={category.id}>
                                <Link
                                    to={`/category/${category.slug}`}
                                    className="group flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-hover"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-muted text-fg-muted group-hover:text-brand-text">
                                        <Icon size={20} aria-hidden />
                                    </span>
                                    <span className="flex-1 font-medium text-fg">{category.name}</span>
                                    <ChevronRight size={18} aria-hidden className="text-fg-subtle" />
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Page>
    )
}
