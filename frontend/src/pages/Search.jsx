import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import useProductStore from '../store/productStore'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import AdBanner from '../components/ui/AdBanner'

function ProductCard({ product }) {
    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
                <div className="aspect-square relative overflow-hidden">
                    {product.media?.[0]?.url ? (
                        <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 leading-tight group-hover:text-primary-600 transition-colors">{product.title}</h3>
                    <span className="text-base font-bold text-primary-600">₦{product.price.toLocaleString()}</span>
                    {product.store && <p className="text-[11px] text-gray-400 mt-1">{product.store.name}</p>}
                </div>
            </div>
        </Link>
    )
}

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [loading, setLoading] = useState(false)
    const { searchResults, searchProducts, clearSearchResults } = useProductStore()
    const inputRef = useRef(null)

    const popularSearches = ['Food', 'Electronics', 'Books', 'Fashion', 'Services', 'Accommodation']

    useEffect(() => {
        inputRef.current?.focus()
        const initialQuery = searchParams.get('q')
        if (initialQuery) handleSearch(initialQuery)
        return () => clearSearchResults()
    }, [])

    const handleSearch = async (searchQuery) => {
        if (!searchQuery.trim()) return
        setLoading(true)
        setSearchParams({ q: searchQuery })
        try { await searchProducts(searchQuery) } finally { setLoading(false) }
    }

    const handleSubmit = (e) => { e.preventDefault(); handleSearch(query) }

    return (
        <div className="min-h-screen bg-surface-50">
            {/* Search Header */}
            <div className="sticky top-0 glass border-b border-surface-200/60 px-4 py-3 z-10">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <Link to="/" className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <div className="flex-1 relative">
                        <input ref={inputRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products, stores..."
                            className="w-full bg-surface-100 rounded-2xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-medium text-sm border border-surface-200" />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    {query && (
                        <button type="button" onClick={() => { setQuery(''); clearSearchResults(); setSearchParams({}); inputRef.current?.focus() }} className="p-2 text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </form>
            </div>

            <div className="p-4">
                <AdBanner position="search_banner" />
                {!query && !searchResults.length && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Popular Searches</h3>
                        <div className="flex flex-wrap gap-2">
                            {popularSearches.map(term => (
                                <button key={term} onClick={() => { setQuery(term); handleSearch(term) }}
                                    className="px-4 py-2 bg-white border border-surface-200 rounded-full text-sm text-gray-600 font-medium hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm">
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">{[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}</div>}

                {!loading && searchResults.length > 0 && (
                    <div>
                        <p className="text-sm text-gray-500 mb-4 font-medium">Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchParams.get('q')}"</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{searchResults.map(product => <ProductCard key={product.id} product={product} />)}</div>
                    </div>
                )}

                {!loading && query && searchResults.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-surface-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-400 mb-6 text-sm">Try a different search term</p>
                        <button onClick={() => { setQuery(''); clearSearchResults(); setSearchParams({}); inputRef.current?.focus() }} className="btn-secondary">Clear Search</button>
                    </div>
                )}
            </div>
        </div>
    )
}
