import { useState, useEffect } from 'react'
import { Eye, EyeOff, Image as ImageIcon, ImagePlus, Link2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Button, { IconButton } from '../../components/ui/Button'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { Alert, Badge, EmptyState, ErrorState, Spinner } from '../../components/ui/Feedback'
import { Skeleton } from '../../components/ui/Skeleton'
import { TextField, TextAreaField } from '../../components/ui/Field'
import HomeIntro, { HomeIntroAction } from '../../components/HomeIntro'
import useForm, { rules } from '../../hooks/useForm'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'
import useSettingsStore from '../../store/settingsStore'
import getImageUrl from '../../utils/imageUrl'
import compressImage from '../../utils/compressImage'

function BannerModal({ ad, onClose, onSaved }) {
    const [image, setImage] = useState(null)
    const [preview, setPreview] = useState(ad ? getImageUrl(ad.image_url) : '')
    const [imageError, setImageError] = useState(null)
    const form = useForm(
        { title: ad?.title || '', link_url: ad?.link_url || '', sort_order: ad?.sort_order ?? 0 },
        { title: [rules.maxLength(200)], link_url: [rules.url()], sort_order: [rules.number({ min: 0 })] }
    )

    const pick = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!file.type.startsWith('image/')) return setImageError('Choose an image file')
        const compressed = await compressImage(file, 2000, 0.85)
        setImage(compressed)
        setPreview(URL.createObjectURL(compressed))
        setImageError(null)
    }

    const submit = form.handleSubmit(async (values) => {
        if (!ad && !image) {
            setImageError('Choose a banner image')
            return
        }
        const data = new FormData()
        Object.entries(values).forEach(([k, v]) => data.append(k, String(v)))
        if (image) data.append('image', image)
        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } }
            if (ad) await api.put(`/api/v1/admin/ads/${ad.id}`, data, config)
            else await api.post('/api/v1/admin/ads', data, config)
            onSaved(ad ? 'Banner updated' : 'Banner published')
        } catch (error) {
            throw new Error(errorMessage(error))
        }
    })

    return (
        <Modal open onClose={onClose} title={ad ? 'Edit banner' : 'New banner'} description="Shown below the intro on the home page. Use a wide image (about 3:1)."
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={form.submitting}>{ad ? 'Save' : 'Publish'}</Button></>}>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <div className="space-y-1.5">
                    <label className={`flex aspect-[3/1] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${imageError ? 'border-danger' : 'border-line-strong hover:border-brand'}`}>
                        {preview
                            ? <img src={preview} alt="Banner preview" className="h-full w-full object-cover" />
                            : <span className="flex flex-col items-center gap-1 text-sm text-fg-muted"><ImagePlus size={22} aria-hidden />Choose image</span>}
                        <input type="file" accept="image/*" onChange={pick} className="sr-only" />
                    </label>
                    {imageError && <p className="text-xs font-medium text-danger" role="alert">{imageError}</p>}
                </div>
                <TextField label="Title" optional hint="Shown over the image" {...form.field('title')} />
                <TextField label="Link" optional type="url" icon={Link2} placeholder="https://" {...form.field('link_url')} />
                <TextField label="Display order" type="number" min="0" hint="Lower numbers show first" {...form.field('sort_order')} />
            </form>
        </Modal>
    )
}

const INTRO_DEFAULTS = {
    hero_title: 'Buy and sell on campus',
    hero_message: "Post what you don't need, find what you do, and meet the seller in person. Chat in the app or on WhatsApp.",
}

function IntroPanel() {
    const loaded = useSettingsStore((s) => s.loaded)
    if (!loaded) return <Skeleton className="h-80 rounded-lg" />
    return <IntroForm />
}

function IntroForm() {
    const { addToast } = useUIStore()
    const settings = useSettingsStore((s) => s.settings)
    const [image, setImage] = useState(settings.hero_image_url || '')
    const [uploading, setUploading] = useState(false)
    const form = useForm(
        { hero_title: settings.hero_title || INTRO_DEFAULTS.hero_title, hero_message: settings.hero_message ?? INTRO_DEFAULTS.hero_message },
        { hero_title: [rules.required('Enter a title'), rules.maxLength(80)], hero_message: [rules.maxLength(240)] }
    )

    const upload = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!file.type.startsWith('image/')) return addToast({ type: 'error', message: 'Choose an image file' })
        setUploading(true)
        try {
            const data = new FormData()
            data.append('file', await compressImage(file, 2000, 0.85))
            const res = await api.post('/api/v1/uploads/site', data, { headers: { 'Content-Type': 'multipart/form-data' } })
            setImage(res.data.url)
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error, 'Image upload failed') })
        } finally {
            setUploading(false)
        }
    }

    const submit = form.handleSubmit(async (values) => {
        try {
            await api.post('/api/v1/admin/settings', { ...values, hero_image_url: image })
            await useSettingsStore.getState().fetchSettings()
            addToast({ type: 'success', message: 'Intro section saved' })
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not save the intro section'))
        }
    })

    const reset = () => {
        form.setValues(INTRO_DEFAULTS)
        setImage('')
    }

    return (
        <Panel title="Intro section" description="The heading at the top of the home page. Changes go live when you save.">
            <form onSubmit={submit} noValidate className="space-y-5">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}

                <div className="space-y-1.5">
                    <p className="text-sm font-medium text-fg">Preview</p>
                    <div inert="" className="rounded-lg border border-line p-4">
                        <HomeIntro preview tagline={settings.site_tagline} title={form.values.hero_title || INTRO_DEFAULTS.hero_title}
                            message={form.values.hero_message} imageUrl={image} action={<HomeIntroAction isAuthenticated tabIndex={-1} />} />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg hover:bg-surface-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
                        {uploading ? <Spinner size={14} /> : <ImagePlus size={14} aria-hidden />}
                        {image ? 'Change background' : 'Add background image'}
                        <input type="file" accept="image/*" onChange={upload} disabled={uploading} className="sr-only" />
                    </label>
                    {image && <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setImage('')}>Remove image</Button>}
                    <span className="text-xs text-fg-subtle">Wide photos work best. Text is shown in white over a dark overlay.</span>
                </div>

                <TextField label="Title" required {...form.field('hero_title')} />
                <TextAreaField label="Message" optional rows={3} hint="Up to 240 characters" {...form.field('hero_message')} />

                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" icon={RotateCcw} onClick={reset}>Use default text</Button>
                    <Button type="submit" loading={form.submitting} disabled={uploading}>Save intro</Button>
                </div>
            </form>
        </Panel>
    )
}

export default function AdminHomePage() {
    const [ads, setAds] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [working, setWorking] = useState(false)
    const { addToast } = useUIStore()

    const load = async () => {
        setError(false)
        try {
            const { data } = await api.get('/api/v1/admin/ads')
            setAds(data.ads || [])
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { load() }, [])

    const saved = (message) => {
        setEditing(null)
        addToast({ type: 'success', message })
        load()
    }

    const toggle = async (ad) => {
        try {
            await api.put(`/api/v1/admin/ads/${ad.id}`, { is_active: !ad.is_active })
            saved(ad.is_active ? 'Banner hidden' : 'Banner is live')
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err) })
        }
    }

    const remove = async () => {
        setWorking(true)
        try {
            await api.delete(`/api/v1/admin/ads/${deleting.id}`)
            setDeleting(null)
            saved('Banner deleted')
        } catch (err) {
            addToast({ type: 'error', message: errorMessage(err) })
        } finally {
            setWorking(false)
        }
    }

    return (
        <AdminPage title="Home page" description="Only super admins can change the home page">
            <IntroPanel />

            <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
                <div>
                    <h2 className="text-base font-semibold text-fg">Banners</h2>
                    <p className="mt-0.5 text-sm text-fg-muted">Promotions shown in a carousel below the intro</p>
                </div>
                {ads.length > 0 && <Button icon={Plus} onClick={() => setEditing('new')}>New banner</Button>}
            </div>
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="aspect-[3/1] rounded-lg" />)}</div>
            ) : error ? (
                <ErrorState onRetry={load} />
            ) : ads.length === 0 ? (
                <Panel><EmptyState icon={ImageIcon} title="No banners yet" message="Banners are optional. The home page works without them."
                    action={<Button icon={Plus} onClick={() => setEditing('new')}>Create a banner</Button>} /></Panel>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {ads.map((ad) => (
                        <Panel key={ad.id} padded={false} className="overflow-hidden">
                            <img src={getImageUrl(ad.image_url)} alt={ad.title || 'Banner'} className={`aspect-[3/1] w-full object-cover ${ad.is_active ? '' : 'opacity-50'}`} />
                            <div className="flex items-center gap-3 p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-fg">{ad.title || 'Untitled banner'}</p>
                                    <div className="mt-0.5 flex items-center gap-2">
                                        {ad.is_active ? <Badge tone="success" dot>Live</Badge> : <Badge dot>Hidden</Badge>}
                                        {ad.link_url && <span className="truncate text-xs text-fg-subtle">{ad.link_url}</span>}
                                    </div>
                                </div>
                                <IconButton icon={ad.is_active ? EyeOff : Eye} label={ad.is_active ? 'Hide banner' : 'Show banner'} size="sm" onClick={() => toggle(ad)} />
                                <IconButton icon={Pencil} label="Edit banner" size="sm" onClick={() => setEditing(ad)} />
                                <IconButton icon={Trash2} label="Delete banner" size="sm" variant="danger-ghost" onClick={() => setDeleting(ad)} />
                            </div>
                        </Panel>
                    ))}
                </div>
            )}

            {editing && <BannerModal ad={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}
            <ConfirmDialog open={!!deleting} title="Delete this banner?" message="It will be removed from the home page permanently."
                confirmLabel="Delete" danger loading={working} onConfirm={remove} onClose={() => setDeleting(null)} />
        </AdminPage>
    )
}
