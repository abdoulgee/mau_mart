import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Flag, MessageCircle, MessageSquare, Package, Pencil, UserX } from 'lucide-react'
import Page from '../components/navigation/Page'
import Avatar from '../components/ui/Avatar'
import Button, { IconButton } from '../components/ui/Button'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { Skeleton } from '../components/ui/Skeleton'
import { LoadMore } from '../components/ui/Pagination'
import ReportModal from '../components/ui/ReportModal'
import ProductCard, { ProductGrid, ProductGridSkeleton } from '../components/ProductCard'
import usePaginatedList from '../hooks/usePaginatedList'
import api, { errorMessage } from '../services/api'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import useUIStore from '../store/uiStore'
import { fullName } from '../utils/format'

function Stat({ label, value }) {
    return (
        <div>
            <dt className="text-xs text-fg-subtle">{label}</dt>
            <dd className="text-base font-semibold text-fg tabular">{value}</dd>
        </div>
    )
}

export default function UserProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user: me, isAuthenticated } = useAuthStore()
    const { startChat } = useChatStore()
    const { addToast } = useUIStore()
    const [seller, setSeller] = useState(null)
    const [status, setStatus] = useState('loading')
    const [starting, setStarting] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const listings = usePaginatedList(`/api/v1/users/${id}/products`)

    const load = () => {
        setStatus('loading')
        api.get(`/api/v1/users/${id}`)
            .then(({ data }) => { setSeller(data.user); setStatus('ready') })
            .catch((error) => setStatus(error.response?.status === 404 ? 'notfound' : 'error'))
    }
    useEffect(load, [id, isAuthenticated])

    const isMe = me?.id === Number(id)

    const message = async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } })
        setStarting(true)
        try {
            const chat = await startChat({ userId: Number(id) })
            navigate(`/chat/${chat.id}`)
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error, 'Could not start the chat') })
            setStarting(false)
        }
    }

    if (status === 'notfound') {
        return <Page title="Profile" back><EmptyState icon={UserX} title="User not found" message="This account may have been removed." action={<Button to="/" variant="secondary">Go home</Button>} /></Page>
    }
    if (status === 'error') {
        return <Page title="Profile" back><ErrorState onRetry={load} /></Page>
    }

    const reportButton = !isMe && isAuthenticated && seller && (
        <IconButton icon={Flag} label="Report user" onClick={() => setShowReport(true)} />
    )

    return (
        <Page title={seller ? fullName(seller) : 'Profile'} back hideTitle mobileActions={reportButton || <span />}>
            <section className="mb-8 flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-center">
                {seller ? <Avatar user={seller} size="2xl" /> : <Skeleton className="h-20 w-20 rounded-full" />}
                <div className="min-w-0 flex-1 space-y-3">
                    {seller ? (
                        <>
                            <div>
                                <h1 className="text-xl font-semibold text-fg md:text-2xl">{fullName(seller)}</h1>
                                {seller.bio && <p className="mt-1 max-w-xl text-sm text-fg-muted">{seller.bio}</p>}
                            </div>
                            <dl className="flex gap-8">
                                <Stat label="For sale" value={seller.active_listings} />
                                <Stat label="Sold" value={seller.sold_listings} />
                                <Stat label="Member since" value={new Date(seller.created_at).getFullYear()} />
                            </dl>
                        </>
                    ) : (
                        <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /></div>
                    )}
                </div>
                {seller && (
                    <div className="flex gap-2">
                        {isMe ? (
                            <Button to="/profile/edit" variant="secondary" icon={Pencil}>Edit profile</Button>
                        ) : (
                            <>
                                <Button variant="secondary" icon={MessageSquare} onClick={message} loading={starting}>Message</Button>
                                {seller.whatsapp && (
                                    <Button variant="whatsapp" icon={MessageCircle} href={`https://wa.me/${seller.whatsapp}`} target="_blank" rel="noopener noreferrer">
                                        WhatsApp
                                    </Button>
                                )}
                                <span className="hidden md:inline-flex">{reportButton}</span>
                            </>
                        )}
                    </div>
                )}
            </section>

            <section aria-label="Listings">
                <h2 className="mb-4 text-base font-semibold text-fg">Listings</h2>
                {listings.loading ? (
                    <ProductGridSkeleton count={4} />
                ) : listings.error ? (
                    <ErrorState onRetry={listings.reload} />
                ) : listings.items.length === 0 ? (
                    <EmptyState icon={Package} title="No listings yet" />
                ) : (
                    <>
                        <ProductGrid>{listings.items.map((p) => <ProductCard key={p.id} product={p} />)}</ProductGrid>
                        <LoadMore hasMore={listings.hasMore} loading={listings.loadingMore} onClick={listings.loadMore} />
                    </>
                )}
            </section>

            <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} entityType="user" entityId={Number(id)} />
        </Page>
    )
}
