import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Skeleton } from './Skeleton'
import getImageUrl from '../../utils/imageUrl'

export default function AdBanner({ position }) {
    const [ads, setAds] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await api.get('/api/v1/products/ads', {
                    params: { position }
                })
                setAds(response.data.ads || [])
            } catch (error) {
                console.error('Failed to fetch ads:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAds()
    }, [position])

    useEffect(() => {
        if (ads.length <= 1) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [ads])

    if (loading) return <Skeleton className="w-full aspect-[21/9] rounded-2xl mb-6" />
    if (ads.length === 0) return null

    const currentAd = ads[currentIndex]

    return (
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-6 group">
            {currentAd.link_url ? (
                <a href={currentAd.link_url} target="_blank" rel="noopener noreferrer">
                    <AdContent ad={currentAd} />
                </a>
            ) : (
                <AdContent ad={currentAd} />
            )}

            {ads.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {ads.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function AdContent({ ad }) {
    return (
        <div className="relative w-full h-full bg-gray-100">
            <img
                src={getImageUrl(ad.image_url)}
                alt={ad.title}
                className="w-full h-full object-cover"
            />
            {ad.title && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{ad.title}</h3>
                </div>
            )}
        </div>
    )
}
