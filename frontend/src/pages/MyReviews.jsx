import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { Skeleton } from '../components/ui/Skeleton'
import api from '../services/api'

export default function MyReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchMyReviews()
    }, [])

    const fetchMyReviews = async () => {
        try {
            const response = await api.get('/api/v1/reviews/my')
            setReviews(response.data.reviews || [])
        } catch (error) {
            console.error('Failed to fetch reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return
        try {
            await api.delete(`/api/v1/reviews/${reviewId}`)
            setReviews(prev => prev.filter(r => r.id !== reviewId))
        } catch (error) {
            console.error('Failed to delete review:', error)
        }
    }

    const renderStars = (rating) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
        ))
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="My Reviews" showBack />
            <div className="p-4 space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card">
                            <div className="flex gap-3">
                                <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : reviews.length > 0 ? (
                    reviews.map(review => (
                        <div key={review.id} className="card">
                            <div className="flex gap-3">
                                {/* Product image */}
                                <div
                                    className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => navigate(`/product/${review.product?.slug || review.product_id}`)}
                                >
                                    {review.product?.media?.[0]?.url ? (
                                        <img
                                            src={review.product.media[0].url}
                                            alt={review.product?.title || 'Product'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">📦</div>
                                    )}
                                </div>

                                {/* Review content */}
                                <div className="flex-1 min-w-0">
                                    <h3
                                        className="font-medium text-gray-900 text-sm truncate cursor-pointer hover:text-blue-600"
                                        onClick={() => navigate(`/product/${review.product?.slug || review.product_id}`)}
                                    >
                                        {review.product?.title || 'Product'}
                                    </h3>
                                    <div className="flex items-center gap-1 my-1">
                                        {renderStars(review.rating)}
                                        <span className="text-xs text-gray-400 ml-1">{formatDate(review.created_at)}</span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 text-sm line-clamp-3">{review.comment}</p>
                                    )}
                                    {review.is_verified_purchase && (
                                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                                            Verified Purchase
                                        </span>
                                    )}
                                </div>

                                {/* Delete button */}
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 self-start"
                                    title="Delete review"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card text-center py-12">
                        <span className="text-5xl block mb-4">⭐</span>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Reviews</h2>
                        <p className="text-gray-500">Reviews you've written will appear here</p>
                    </div>
                )}
            </div>
        </div>
    )
}
