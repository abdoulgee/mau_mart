import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchReviews()
    }, [filter])

    const fetchReviews = async () => {
        setLoading(true)
        try {
            const params = {}
            if (filter !== 'all') params.flagged = filter === 'flagged'
            const response = await api.get('/api/v1/admin/reviews', { params })
            setReviews(response.data.reviews || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load reviews' })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (reviewId) => {
        if (!confirm('Delete this review?')) return
        try {
            await api.delete(`/api/v1/admin/reviews/${reviewId}`)
            addToast({ type: 'success', message: 'Review deleted' })
            fetchReviews()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to delete review' })
        }
    }

    const handleApprove = async (reviewId) => {
        try {
            await api.patch(`/api/v1/admin/reviews/${reviewId}`, { is_flagged: false })
            addToast({ type: 'success', message: 'Review approved' })
            fetchReviews()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to approve review' })
        }
    }

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl">
                    <option value="all">All Reviews</option>
                    <option value="flagged">Flagged Only</option>
                </select>
            </div>

            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                ) : reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className={`card ${review.is_flagged ? 'border-2 border-red-200 bg-red-50' : ''}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {review.user?.profile_photo_url ? (
                                        <img src={review.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl">{review.user?.first_name?.[0] || '?'}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <span className="font-medium text-gray-900">{review.user?.first_name} {review.user?.last_name}</span>
                                            {review.is_flagged && <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Flagged</span>}
                                        </div>
                                        <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-yellow-400 text-sm mb-2">{renderStars(review.rating)}</div>
                                    <p className="text-gray-600 mb-3">{review.comment}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">Product: {review.product?.title || `#${review.product_id}`}</span>
                                        <div className="flex gap-2">
                                            {review.is_flagged && (
                                                <button onClick={() => handleApprove(review.id)} className="text-xs px-3 py-1 bg-green-50 text-green-600 rounded-lg">Approve</button>
                                            )}
                                            <button onClick={() => handleDelete(review.id)} className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <span className="text-5xl block mb-3">⭐</span>
                        <p className="text-gray-500">No reviews found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
