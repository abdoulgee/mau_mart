import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import useCategoryStore from '../store/categoryStore'
import { Skeleton } from '../components/ui/Skeleton'

const categoryColors = [
    'from-amber-400 to-orange-500',
    'from-sky-400 to-blue-500',
    'from-rose-400 to-pink-500',
    'from-emerald-400 to-green-500',
    'from-violet-400 to-purple-500',
    'from-cyan-400 to-teal-500',
    'from-lime-400 to-green-500',
    'from-fuchsia-400 to-pink-500',
]

const categoryIcons = ['🛍️', '📱', '👕', '📚', '🍔', '💄', '🎮', '🏠']

export default function Categories() {
    const { categories, loading, fetchCategories, connectSocket } = useCategoryStore()

    useEffect(() => {
        connectSocket()
        fetchCategories()
    }, [])

    return (
        <div className="min-h-screen bg-surface-50">
            <Header title="Categories" showBack />
            <div className="p-4 space-y-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card flex items-center gap-4">
                            <Skeleton className="w-14 h-14 rounded-xl" />
                            <div className="flex-1">
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    ))
                ) : categories.length > 0 ? (
                    categories.map((category, i) => (
                        <Link key={category.id} to={`/category/${category.slug}`} className="card-hover flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryColors[i % categoryColors.length]} flex items-center justify-center text-2xl shadow-sm`}>
                                {category.icon && category.icon.trim().startsWith('<') ? (
                                    <span className="inline-flex items-center justify-center w-7 h-7 [&>svg]:w-7 [&>svg]:h-7 [&>svg]:text-white" dangerouslySetInnerHTML={{ __html: category.icon }} />
                                ) : (
                                    category.icon || categoryIcons[i % categoryIcons.length]
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-sm">{category.name}</h3>
                                <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{category.description}</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-3 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <p className="text-gray-500 font-medium text-sm">No categories found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
