import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminFeatured() {
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchListings()
    }, [])

    const fetchListings = async () => {
        try {
            const response = await api.get('/api/v1/subscriptions/admin/featured')
            setListings(response.data.listings || [])
        } catch (error) {
            // Endpoint may not exist yet, show empty state
            console.error('Failed to fetch featured listings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id) => {
        try {
            await api.post(`/api/v1/subscriptions/admin/featured/${id}/approve`)
            addToast({ type: 'success', message: 'Featured listing approved!' })
            fetchListings()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to approve listing' })
        }
    }

    const handleReject = async (id) => {
        try {
            await api.post(`/api/v1/subscriptions/admin/featured/${id}/reject`, { reason: 'Rejected by admin' })
            addToast({ type: 'success', message: 'Featured listing rejected' })
            fetchListings()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to reject listing' })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Featured Listings</h1>

            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))
                ) : listings.length > 0 ? (
                    listings.map(listing => (
                        <div key={listing.id} className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Product #{listing.product_id}</h3>
                                    <p className="text-sm text-gray-500">Type: {listing.listing_type}</p>
                                    <p className="text-sm text-gray-500">Status: {listing.status}</p>
                                </div>
                                {listing.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(listing.id)}
                                            className="btn-primary text-sm py-2"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(listing.id)}
                                            className="btn-secondary text-sm py-2"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card text-center py-12">
                        <span className="text-5xl block mb-4">⭐</span>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Featured Listings</h2>
                        <p className="text-gray-500">Featured listing requests will appear here</p>
                    </div>
                )}
            </div>
        </div>
    )
}
