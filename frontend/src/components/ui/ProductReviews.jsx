import { useState, useEffect } from 'react'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { Skeleton } from './Skeleton'

export default function ProductReviews({ productId, canReview = false }) {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })
    const { isAuthenticated, user } = useAuthStore()
    const { addToast } = useUIStore()

    useEffect(() => {
        if (productId) {
            fetchReviews()
        }
    }, [productId])

    const fetchReviews = async () => {
        try {
            const response = await api.get(`/api/v1/products/${productId}/reviews`)
            setReviews(response.data.reviews || [])
            if (response.data.stats) {
                setStats(response.data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!comment.trim()) {
            addToast({ type: 'error', message: 'Please write a review' })
            return
        }

        setSubmitting(true)
        try {
            await api.post(`/api/v1/products/${productId}/reviews`, { rating, comment })
            addToast({ type: 'success', message: 'Review submitted!' })
            setShowForm(false)
            setComment('')
            setRating(5)
            fetchReviews()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to submit review' })
        } finally {
            setSubmitting(false)
        }
    }

    const renderStars = (rating, interactive = false, onChange = null) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <button
                key={i}
                type="button"
                onClick={() => interactive && onChange && onChange(i + 1)}
                className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                disabled={!interactive}
            >
                ★
            </button>
        ))
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const hasUserReviewed = reviews.some(r => r.user_id === user?.id)

    return (
        <div className="space-y-6">
            {/* Stats Section */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">{stats.average?.toFixed(1) || '0.0'}</div>
                        <div className="flex justify-center my-1">{renderStars(Math.round(stats.average || 0))}</div>
                        <div className="text-sm text-gray-500">{stats.total || 0} reviews</div>
                    </div>
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = stats.distribution?.[star] || 0
                            const percent = stats.total ? (count / stats.total) * 100 : 0
                            return (
                                <div key={star} className="flex items-center gap-2 text-sm">
                                    <span className="w-3 text-gray-600">{star}</span>
                                    <span className="text-yellow-400">★</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                    <span className="w-8 text-gray-500 text-xs">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Write Review Button/Form */}
            {isAuthenticated && canReview && !hasUserReviewed && (
                <div className="card">
                    {!showForm ? (
                        <button onClick={() => setShowForm(true)} className="btn-primary w-full">
                            ✍️ Write a Review
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h4 className="font-medium text-gray-900">Write Your Review</h4>

                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Your Rating</label>
                                <div className="flex gap-1">{renderStars(rating, true, setRating)}</div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Your Review</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience with this product..."
                                    className="input min-h-[100px] resize-none"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card">
                            <div className="flex items-start gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="card">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-lg">
                                    {review.user?.profile_photo_url ? (
                                        <img src={review.user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        review.user?.first_name?.[0] || '?'
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900">
                                            {review.user?.first_name} {review.user?.last_name?.[0]}.
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2 text-sm">
                                        {renderStars(review.rating)}
                                        {review.is_verified_purchase && (
                                            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">Verified Purchase</span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <span className="text-4xl block mb-2">⭐</span>
                        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
