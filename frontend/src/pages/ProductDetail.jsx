import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
    CheckCircle2, ChevronLeft, ChevronRight, Clock, Eye, Flag, Heart, ImageOff, MapPin, MessageCircle,
    MessageSquare, Pencil, RotateCcw, SearchX, Share2, ShieldCheck, Star, Tag, Trash2,
} from 'lucide-react'
import Page from '../components/navigation/Page'
import Button, { IconButton } from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Panel from '../components/ui/Panel'
import { Alert, Badge, EmptyState, ErrorState } from '../components/ui/Feedback'
import { Skeleton, SkeletonText } from '../components/ui/Skeleton'
import { ConfirmDialog } from '../components/ui/Modal'
import ReportModal from '../components/ui/ReportModal'
import api, { errorMessage } from '../services/api'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import useUIStore from '../store/uiStore'
import useSettingsStore from '../store/settingsStore'
import getImageUrl from '../utils/imageUrl'
import { formatPrice, timeAgo, CONDITIONS, whatsappLink, fullName } from '../utils/format'
import cn from '../utils/cn'

function Gallery({ images, title, sold }) {
    const [index, setIndex] = useState(0)
    useEffect(() => setIndex(0), [images])

    if (!images.length) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-line bg-surface-muted text-fg-subtle">
                <ImageOff size={40} aria-hidden />
            </div>
        )
    }

    const go = (step) => setIndex((i) => (i + step + images.length) % images.length)

    return (
        <div className="space-y-3">
            <div className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-surface-muted">
                <img
                    src={getImageUrl(images[index].url)}
                    alt={`${title}, photo ${index + 1} of ${images.length}`}
                    className={cn('h-full w-full object-contain', sold && 'opacity-70')}
                />
                {sold && <Badge className="absolute left-3 top-3 bg-fg px-2.5 py-1 text-surface">Sold</Badge>}
                {images.length > 1 && (
                    <>
                        <button type="button" onClick={() => go(-1)} aria-label="Previous photo"
                            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-fg hover:bg-surface">
                            <ChevronLeft size={18} aria-hidden />
                        </button>
                        <button type="button" onClick={() => go(1)} aria-label="Next photo"
                            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-fg hover:bg-surface">
                            <ChevronRight size={18} aria-hidden />
                        </button>
                        <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white tabular">
                            {index + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {images.map((image, i) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`Show photo ${i + 1}`}
                            aria-current={i === index || undefined}
                            className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                                i === index ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100')}
                        >
                            <img src={getImageUrl(image.url)} alt="" className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function DetailSkeleton() {
    return (
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-busy="true">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-5 w-3/4" />
                <SkeletonText lines={3} />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        </div>
    )
}

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { isAuthenticated, user } = useAuthStore()
    const { startChat } = useChatStore()
    const { addToast } = useUIStore()
    const adminWhatsapp = useSettingsStore((s) => s.settings.admin_whatsapp)

    const [product, setProduct] = useState(null)
    const [status, setStatus] = useState('loading') // loading | ready | notfound | error
    const [isSaved, setIsSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [busy, setBusy] = useState(null) // 'chat' | 'sold' | 'delete'
    const [showReport, setShowReport] = useState(false)
    const [showDelete, setShowDelete] = useState(false)

    const load = () => {
        setStatus('loading')
        api.get(`/api/v1/products/${id}`)
            .then(({ data }) => { setProduct(data.product); setStatus('ready') })
            .catch((error) => setStatus(error.response?.status === 404 ? 'notfound' : 'error'))
    }

    useEffect(load, [id, isAuthenticated])

    useEffect(() => {
        if (!isAuthenticated) return
        api.get(`/api/v1/wishlist/check/${id}`).then(({ data }) => setIsSaved(data.is_saved)).catch(() => { })
    }, [isAuthenticated, id])

    const requireLogin = (message) => {
        addToast({ type: 'info', message })
        navigate('/login', { state: { from: location } })
    }

    const share = async () => {
        const url = `${window.location.origin}/product/${id}`
        try {
            if (navigator.share) await navigator.share({ title: product.title, text: `${product.title}, ${formatPrice(product.price)}`, url })
            else {
                await navigator.clipboard.writeText(url)
                addToast({ type: 'success', message: 'Link copied to clipboard' })
            }
        } catch { /* share sheet dismissed */ }
    }

    const toggleSave = async () => {
        if (!isAuthenticated) return requireLogin('Log in to save listings')
        setSaving(true)
        try {
            if (isSaved) await api.delete(`/api/v1/wishlist/${id}`)
            else await api.post('/api/v1/wishlist', { product_id: Number(id) })
            setIsSaved(!isSaved)
            addToast({ type: 'success', message: isSaved ? 'Removed from saved' : 'Saved' })
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error, 'Could not update saved listings') })
        } finally {
            setSaving(false)
        }
    }

    const chat = async () => {
        if (!isAuthenticated) return requireLogin('Log in to message the seller')
        setBusy('chat')
        try {
            const conversation = await startChat({ productId: product.id })
            navigate(`/chat/${conversation.id}`, { state: { draft: 'Hi, is this still available?' } })
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error, 'Could not start the chat') })
            setBusy(null)
        }
    }

    const openWhatsApp = () => {
        if (!isAuthenticated) return requireLogin('Log in to contact the seller on WhatsApp')
        window.open(whatsappLink(product.seller.whatsapp, product), '_blank', 'noopener')
    }

    const toggleSold = async () => {
        setBusy('sold')
        try {
            const { data } = await api.post(`/api/v1/products/${id}/sold`, { is_sold: !product.is_sold })
            setProduct((p) => ({ ...p, is_sold: data.product.is_sold }))
            addToast({ type: 'success', message: data.product.is_sold ? 'Marked as sold. Buyers can no longer contact you about it.' : 'Listing is available again' })
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error) })
        } finally {
            setBusy(null)
        }
    }

    const remove = async () => {
        setBusy('delete')
        try {
            await api.delete(`/api/v1/products/${id}`)
            addToast({ type: 'success', message: 'Listing deleted' })
            navigate('/my-listings', { replace: true })
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error) })
            setBusy(null)
            setShowDelete(false)
        }
    }

    if (status === 'notfound') {
        return (
            <Page title="Listing" back>
                <EmptyState icon={SearchX} title="This listing isn't available" message="It may have been deleted by the seller."
                    action={<Button to="/" variant="secondary">Browse listings</Button>} />
            </Page>
        )
    }
    if (status === 'error') {
        return <Page title="Listing" back><ErrorState message="The listing could not be loaded." onRetry={load} /></Page>
    }
    if (status === 'loading' || !product) {
        return <Page title="Listing" back hideTitle><DetailSkeleton /></Page>
    }

    const isOwner = user?.id === product.user_id
    const seller = product.seller
    const contactDisabled = product.is_sold

    const ownerActions = (
        <>
            <Button to={`/product/${product.id}/edit`} variant="secondary" icon={Pencil} className="flex-1">Edit</Button>
            <Button onClick={toggleSold} loading={busy === 'sold'} variant={product.is_sold ? 'secondary' : 'primary'}
                icon={product.is_sold ? RotateCcw : CheckCircle2} className="flex-1">
                {product.is_sold ? 'Mark available' : 'Mark as sold'}
            </Button>
            <IconButton icon={Trash2} label="Delete listing" variant="danger-ghost" onClick={() => setShowDelete(true)} />
        </>
    )

    const buyerActions = (
        <>
            <IconButton icon={Heart} label={isSaved ? 'Remove from saved' : 'Save listing'} variant="secondary"
                onClick={toggleSave} disabled={saving} aria-pressed={isSaved}
                className={cn(isSaved && 'text-danger [&_svg]:fill-current')} />
            <Button onClick={chat} loading={busy === 'chat'} disabled={contactDisabled} variant="secondary" icon={MessageSquare} className="flex-1">
                Chat
            </Button>
            {seller?.has_whatsapp && (
                <Button onClick={openWhatsApp} disabled={contactDisabled} variant="whatsapp" icon={MessageCircle} className="flex-1">
                    WhatsApp
                </Button>
            )}
        </>
    )

    return (
        <Page
            title="Listing"
            back
            hideTitle
            mobileActions={
                <>
                    <IconButton icon={Share2} label="Share listing" onClick={share} />
                    {!isOwner && <IconButton icon={Flag} label="Report listing" onClick={() => (isAuthenticated ? setShowReport(true) : requireLogin('Log in to report a listing'))} />}
                </>
            }
        >
            <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
                <Gallery images={product.media || []} title={product.title} sold={product.is_sold} />

                <div className="space-y-6 md:sticky md:top-24 md:self-start">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {product.is_sold && <Badge tone="neutral" dot>Sold</Badge>}
                            {product.is_featured && <Badge tone="brand"><Star size={12} aria-hidden />Featured</Badge>}
                            <Badge>{CONDITIONS[product.condition] || 'Used'}</Badge>
                        </div>
                        <h1 className="text-xl font-semibold text-fg md:text-2xl">{product.title}</h1>
                        <p className="text-2xl font-semibold text-fg tabular">{formatPrice(product.price)}</p>
                        <dl className="space-y-1.5 text-sm text-fg-muted">
                            {product.location && (
                                <div className="flex items-center gap-2"><MapPin size={16} aria-hidden className="text-fg-subtle" /><dt className="sr-only">Meet-up location</dt><dd>{product.location}</dd></div>
                            )}
                            <div className="flex items-center gap-2"><Clock size={16} aria-hidden className="text-fg-subtle" /><dt className="sr-only">Posted</dt><dd>Posted {timeAgo(product.created_at)}</dd></div>
                            {product.category && (
                                <div className="flex items-center gap-2">
                                    <Tag size={16} aria-hidden className="text-fg-subtle" /><dt className="sr-only">Category</dt>
                                    <dd><Link to={`/category/${product.category.slug}`} className="text-brand-text hover:underline">{product.category.name}</Link></dd>
                                </div>
                            )}
                            {isOwner && (
                                <div className="flex items-center gap-2"><Eye size={16} aria-hidden className="text-fg-subtle" /><dt className="sr-only">Views</dt><dd className="tabular">{product.views} {product.views === 1 ? 'view' : 'views'}</dd></div>
                            )}
                        </dl>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden gap-2 md:flex">
                        {isOwner ? ownerActions : buyerActions}
                        <IconButton icon={Share2} label="Share listing" variant="secondary" onClick={share} />
                    </div>
                    {!isOwner && contactDisabled && <Alert tone="neutral">This item has been sold.</Alert>}

                    {product.description && (
                        <section>
                            <h2 className="mb-2 text-sm font-semibold text-fg">Description</h2>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">{product.description}</p>
                        </section>
                    )}

                    {seller && (
                        <Panel padded={false}>
                            <Link to={`/user/${seller.id}`} className="flex items-center gap-3 rounded-lg p-4 hover:bg-surface-hover">
                                <Avatar user={seller} size="lg" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-fg-subtle">{isOwner ? 'Your listing' : 'Sold by'}</p>
                                    <p className="truncate font-medium text-fg">{fullName(seller)}</p>
                                    <p className="text-xs text-fg-subtle">Member since {new Date(seller.created_at).getFullYear()}</p>
                                </div>
                                <ChevronRight size={18} aria-hidden className="text-fg-subtle" />
                            </Link>
                        </Panel>
                    )}

                    {isOwner ? (
                        adminWhatsapp && !product.is_featured && !product.is_sold && (
                            <Alert tone="brand" icon={Star} title="Want more buyers to see this?"
                                action={
                                    <Button size="sm" variant="secondary"
                                        href={`https://wa.me/${adminWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'd like to feature my listing "${product.title}" on MAU MART: ${window.location.origin}/product/${product.id}`)}`}
                                        target="_blank" rel="noopener noreferrer">
                                        Ask
                                    </Button>
                                }>
                                Ask the MAU MART team to feature it on the home page.
                            </Alert>
                        )
                    ) : (
                        <Alert tone="neutral" icon={ShieldCheck} title="Stay safe">
                            Meet in a public place on campus, check the item before paying, and never pay in advance.
                        </Alert>
                    )}

                    {!isOwner && (
                        <button type="button" onClick={() => (isAuthenticated ? setShowReport(true) : requireLogin('Log in to report a listing'))}
                            className="hidden items-center gap-1.5 text-xs text-fg-subtle hover:text-danger md:inline-flex">
                            <Flag size={14} aria-hidden />Report this listing
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile action bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 safe-bottom md:hidden">
                <div className="flex gap-2">{isOwner ? ownerActions : buyerActions}</div>
            </div>

            <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} entityType="product" entityId={product.id} />
            <ConfirmDialog
                open={showDelete}
                title="Delete this listing?"
                message="Buyers will no longer be able to find it. This can't be undone."
                confirmLabel="Delete listing"
                danger
                loading={busy === 'delete'}
                onConfirm={remove}
                onClose={() => setShowDelete(false)}
            />
        </Page>
    )
}
