import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

/**
 * Loads a paginated API list and supports "load more".
 * `params` changes reset the list. `key` is the array field in the response (e.g. 'products').
 */
export default function usePaginatedList(url, params = {}, { key = 'products', limit = 20, enabled = true } = {}) {
    const [items, setItems] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(enabled)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const requestId = useRef(0)
    const paramsKey = JSON.stringify(params)

    const load = useCallback(async (pageToLoad) => {
        const id = ++requestId.current
        pageToLoad === 1 ? setLoading(true) : setLoadingMore(true)
        setError(null)
        try {
            const { data } = await api.get(url, { params: { ...JSON.parse(paramsKey), page: pageToLoad, limit } })
            if (id !== requestId.current) return // a newer request replaced this one
            const newItems = data[key] || []
            setItems((prev) => (pageToLoad === 1 ? newItems : [...prev, ...newItems]))
            setPage(pageToLoad)
            setTotal(data.pagination?.total ?? newItems.length)
            setHasMore(data.pagination ? pageToLoad < data.pagination.pages : false)
        } catch (err) {
            if (id === requestId.current) setError(err)
        } finally {
            if (id === requestId.current) {
                setLoading(false)
                setLoadingMore(false)
            }
        }
    }, [url, paramsKey, key, limit])

    useEffect(() => {
        if (enabled) load(1)
        else setLoading(false)
    }, [load, enabled])

    return {
        items,
        setItems,
        total,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore: () => !loadingMore && hasMore && load(page + 1),
        reload: () => load(1),
    }
}
