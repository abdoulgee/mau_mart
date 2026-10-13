import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search as SearchIcon } from 'lucide-react'
import Page from '../components/navigation/Page'
import ListingResults from '../components/ListingResults'
import CategoryChips from '../components/CategoryChips'
import { IconButton } from '../components/ui/Button'

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const query = searchParams.get('q') || ''
    const [input, setInput] = useState(query)
    const inputRef = useRef(null)

    useEffect(() => {
        setInput(query)
    }, [query])

    useEffect(() => {
        if (!query && window.matchMedia('(max-width: 767px)').matches) inputRef.current?.focus()
    }, [])

    const submit = (e) => {
        e.preventDefault()
        setSearchParams(input.trim() ? { q: input.trim() } : {})
        inputRef.current?.blur()
    }

    const mobileBar = (
        <>
            <IconButton icon={ArrowLeft} label="Back" onClick={() => navigate(-1)} />
            <form role="search" onSubmit={submit} className="relative flex-1 pr-2">
                <SearchIcon size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
                <input
                    ref={inputRef}
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search listings"
                    aria-label="Search listings"
                    enterKeyHint="search"
                    className="h-10 w-full rounded-lg border border-line bg-surface-muted pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:bg-surface focus:outline-none"
                />
            </form>
        </>
    )

    return (
        <Page title={query ? `Results for "${query}"` : 'Search'} mobileContent={mobileBar}>
            {query ? (
                <ListingResults
                    key={query}
                    params={{ q: query }}
                    emptyTitle={`No results for "${query}"`}
                    emptyMessage="Check the spelling, try a more general word, or browse a category."
                />
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-fg-muted">Type what you're looking for, or start with a category.</p>
                    <CategoryChips />
                </div>
            )}
        </Page>
    )
}
