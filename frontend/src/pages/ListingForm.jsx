import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, ImagePlus, MessageCircle, X } from 'lucide-react'
import Page from '../components/navigation/Page'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import { Alert, LoadingBlock } from '../components/ui/Feedback'
import { TextField, TextAreaField, SelectField } from '../components/ui/Field'
import useForm, { rules } from '../hooks/useForm'
import api, { errorMessage } from '../services/api'
import useAuthStore from '../store/authStore'
import useCategoryStore from '../store/categoryStore'
import useUIStore from '../store/uiStore'
import getImageUrl from '../utils/imageUrl'
import compressImage from '../utils/compressImage'
import { CONDITIONS } from '../utils/format'
import cn from '../utils/cn'

const MAX_PHOTOS = 4

const schema = {
    title: [rules.required('Give your listing a title'), rules.minLength(3, 'Title is too short'), rules.maxLength(200)],
    price: [rules.required('Enter a price'), rules.number({ min: 0, message: 'Enter a valid price' })],
    category_id: [rules.required('Choose a category')],
    description: [rules.maxLength(2000)],
    location: [rules.maxLength(200)],
}

function PhotoTile({ src, label, onRemove, cover }) {
    return (
        <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-surface-muted">
            <img src={src} alt={label} className="h-full w-full object-cover" />
            {cover && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-2xs font-medium text-white">Cover</span>}
            <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                <X size={14} aria-hidden />
            </button>
        </div>
    )
}

function ConditionPicker({ value, onChange }) {
    return (
        <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-fg">Condition</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {Object.entries(CONDITIONS).map(([key, label]) => (
                    <label key={key} className={cn(
                        'flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand',
                        value === key ? 'border-brand bg-brand-soft text-brand-text' : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg'
                    )}>
                        <input type="radio" name="condition" value={key} checked={value === key} onChange={() => onChange(key)} className="sr-only" />
                        {label}
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

export default function ListingForm() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { categories, fetchCategories } = useCategoryStore()
    const { addToast } = useUIStore()
    const fileInput = useRef(null)

    const form = useForm({ title: '', price: '', category_id: '', condition: 'used', location: '', description: '' }, schema)
    const [existingPhotos, setExistingPhotos] = useState([])
    const [newPhotos, setNewPhotos] = useState([]) // { file, preview }
    const [photoError, setPhotoError] = useState(null)
    const [loading, setLoading] = useState(isEdit)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    useEffect(() => {
        if (!isEdit) return
        api.get(`/api/v1/products/${id}`)
            .then(({ data }) => {
                const p = data.product
                if (p.user_id !== user?.id) {
                    addToast({ type: 'error', message: 'You can only edit your own listings' })
                    navigate(`/product/${id}`, { replace: true })
                    return
                }
                form.setValues({
                    title: p.title,
                    price: String(p.price),
                    category_id: p.category ? String(p.category.id) : '',
                    condition: p.condition || 'used',
                    location: p.location || '',
                    description: p.description || '',
                })
                setExistingPhotos(p.media || [])
            })
            .catch(() => {
                addToast({ type: 'error', message: 'Listing not found' })
                navigate('/my-listings', { replace: true })
            })
            .finally(() => setLoading(false))
    }, [id, isEdit])

    useEffect(() => () => newPhotos.forEach((p) => URL.revokeObjectURL(p.preview)), [])

    const photoCount = existingPhotos.length + newPhotos.length

    const addPhotos = async (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        const images = files.filter((f) => f.type.startsWith('image/'))
        if (images.length < files.length) setPhotoError('Only image files can be added')
        else setPhotoError(null)
        const room = MAX_PHOTOS - photoCount
        if (images.length > room) setPhotoError(`You can add up to ${MAX_PHOTOS} photos`)
        if (!room) return
        setProcessing(true)
        const compressed = await Promise.all(images.slice(0, room).map((f) => compressImage(f)))
        setNewPhotos((prev) => [...prev, ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
        setProcessing(false)
    }

    const removeNewPhoto = (index) => {
        setNewPhotos((prev) => {
            URL.revokeObjectURL(prev[index].preview)
            return prev.filter((_, i) => i !== index)
        })
    }

    const removeExistingPhoto = async (photo) => {
        if (photoCount <= 1) {
            setPhotoError('A listing needs at least one photo. Add another before removing this one.')
            return
        }
        try {
            await api.delete(`/api/v1/products/${id}/images/${photo.id}`)
            setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id))
        } catch (error) {
            setPhotoError(errorMessage(error, 'Could not remove the photo'))
        }
    }

    const submit = form.handleSubmit(async (values) => {
        if (photoCount === 0) {
            setPhotoError('Add at least one photo')
            fileInput.current?.focus()
            return
        }
        const data = new FormData()
        Object.entries(values).forEach(([key, value]) => data.append(key, value))
        newPhotos.forEach(({ file }) => data.append('images', file))

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } }
            const response = isEdit
                ? await api.put(`/api/v1/products/${id}`, data, config)
                : await api.post('/api/v1/products', data, config)
            addToast({ type: 'success', message: isEdit ? 'Changes saved' : 'Your listing is live' })
            navigate(`/product/${response.data.product.id}`, { replace: true })
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not save the listing'))
        }
    })

    const title = isEdit ? 'Edit listing' : 'New listing'

    if (loading) return <Page title={title} back width="medium"><LoadingBlock label="Loading listing" /></Page>

    return (
        <Page title={title} back width="medium" description={isEdit ? undefined : 'Takes about a minute. Clear photos and an honest description sell faster.'}>
            <form onSubmit={submit} noValidate className="space-y-6 pb-20 md:pb-0">
                {form.formError && <Alert tone="danger" title="Couldn't save">{form.formError}</Alert>}

                {!user?.whatsapp && (
                    <Alert tone="info" icon={MessageCircle} action={<Button to="/profile/edit" size="sm" variant="secondary">Add number</Button>}>
                        Add your WhatsApp number so buyers can reach you there as well as in chat.
                    </Alert>
                )}

                <Panel title="Photos" description={`Up to ${MAX_PHOTOS}. The first photo is the cover.`}>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {existingPhotos.map((photo, i) => (
                            <PhotoTile key={photo.id} src={getImageUrl(photo.url)} label={`photo ${i + 1}`} cover={i === 0} onRemove={() => removeExistingPhoto(photo)} />
                        ))}
                        {newPhotos.map((photo, i) => (
                            <PhotoTile key={photo.preview} src={photo.preview} label={`new photo ${i + 1}`} cover={existingPhotos.length === 0 && i === 0} onRemove={() => removeNewPhoto(i)} />
                        ))}
                        {photoCount < MAX_PHOTOS && (
                            <button
                                type="button"
                                ref={fileInput}
                                onClick={() => document.getElementById('photo-input').click()}
                                disabled={processing}
                                className={cn(
                                    'flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs font-medium transition-colors',
                                    photoError && photoCount === 0 ? 'border-danger text-danger' : 'border-line-strong text-fg-muted hover:border-brand hover:text-brand-text'
                                )}
                            >
                                <ImagePlus size={22} aria-hidden />
                                {processing ? 'Adding…' : 'Add photo'}
                            </button>
                        )}
                    </div>
                    <input id="photo-input" type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
                    {photoError && (
                        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-danger" role="alert">
                            <AlertCircle size={14} aria-hidden />{photoError}
                        </p>
                    )}
                </Panel>

                <Panel title="Details">
                    <div className="space-y-5">
                        <TextField label="Title" required placeholder="e.g. HP EliteBook 840, 8GB RAM" maxLength={200} {...form.field('title')} />
                        <div className="grid gap-5 sm:grid-cols-2">
                            <TextField label="Price (₦)" required type="number" inputMode="numeric" min="0" placeholder="0" {...form.field('price')} />
                            <SelectField label="Category" required {...form.field('category_id')}>
                                <option value="">Choose a category</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </SelectField>
                        </div>
                        <ConditionPicker value={form.values.condition} onChange={(v) => form.setValue('condition', v)} />
                        <TextField label="Meet-up location" optional placeholder="e.g. Faculty of Science, Block C hostel" hint="Where buyers can pick it up." maxLength={200} {...form.field('location')} />
                        <TextAreaField label="Description" optional rows={5} maxLength={2000} placeholder="Condition, what's included, reason for selling…" {...form.field('description')} />
                    </div>
                </Panel>

                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 safe-bottom md:static md:border-0 md:bg-transparent md:p-0">
                    <div className="flex gap-2 md:justify-end">
                        <Button variant="secondary" onClick={() => navigate(-1)} className="hidden md:inline-flex">Cancel</Button>
                        <Button type="submit" size="lg" loading={form.submitting} className="flex-1 md:flex-none">
                            {isEdit ? 'Save changes' : 'Post listing'}
                        </Button>
                    </div>
                </div>
            </form>
        </Page>
    )
}
