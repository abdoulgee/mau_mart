import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import getImageUrl from '../../utils/imageUrl'
import cn from '../../utils/cn'

/** Admin-managed home banners. Auto-advances, pauses on hover/focus, has manual controls. */
export default function AdBanner({ className }) {
    const [ads, setAds] = useState([])
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        api.get('/api/v1/products/ads')
            .then(({ data }) => setAds(data.ads || []))
            .catch(() => { })
    }, [])

    useEffect(() => {
        if (ads.length <= 1 || paused) return
        const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), 6000)
        return () => clearInterval(timer)
    }, [ads.length, paused])

    if (ads.length === 0) return null

    const ad = ads[index]
    const go = (step) => setIndex((i) => (i + step + ads.length) % ads.length)
    const image = <img src={getImageUrl(ad.image_url)} alt={ad.title || 'Promotion'} className="h-full w-full object-cover" />

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Promotions"
            className={cn('group relative aspect-[21/9] overflow-hidden rounded-lg border border-line bg-surface-muted sm:aspect-[3/1]', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {ad.link_url ? <a href={ad.link_url} target="_blank" rel="noopener noreferrer">{image}</a> : image}

            {ad.title && (
                <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-sm font-medium text-white">
                    {ad.title}
                </p>
            )}

            {ads.length > 1 && (
                <>
                    <button type="button" onClick={() => go(-1)} aria-label="Previous banner"
                        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100">
                        <ChevronLeft size={18} aria-hidden />
                    </button>
                    <button type="button" onClick={() => go(1)} aria-label="Next banner"
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100">
                        <ChevronRight size={18} aria-hidden />
                    </button>
                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                        {ads.map((a, i) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Show banner ${i + 1} of ${ads.length}`}
                                aria-current={i === index || undefined}
                                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80')}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}
