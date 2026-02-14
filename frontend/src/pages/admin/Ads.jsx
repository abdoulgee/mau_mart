import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminAds() {
    const [ads, setAds] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ title: '', link_url: '', position: 'home_banner', is_active: true })
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [editingAd, setEditingAd] = useState(null)
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchAds()
    }, [])

    const fetchAds = async () => {
        try {
            const response = await api.get('/api/v1/admin/ads')
            setAds(response.data.ads || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load ads' })
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const data = new FormData()
        Object.entries(formData).forEach(([key, value]) => data.append(key, value))
        if (selectedFile) {
            data.append('image', selectedFile)
        }

        try {
            if (editingAd) {
                await api.put(`/api/v1/admin/ads/${editingAd.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                addToast({ type: 'success', message: 'Ad updated!' })
            } else {
                if (!selectedFile) {
                    addToast({ type: 'error', message: 'Please select an image' })
                    return
                }
                await api.post('/api/v1/admin/ads', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                addToast({ type: 'success', message: 'Ad created!' })
            }
            setShowModal(false)
            resetForm()
            fetchAds()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to save ad' })
        }
    }

    const handleEdit = (ad) => {
        setEditingAd(ad)
        setFormData({ title: ad.title, link_url: ad.link_url || '', position: ad.position, is_active: ad.is_active })
        setPreviewUrl(ad.image_url)
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this ad?')) return
        try {
            await api.delete(`/api/v1/admin/ads/${id}`)
            addToast({ type: 'success', message: 'Ad deleted' })
            fetchAds()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to delete ad' })
        }
    }

    const handleToggleActive = async (ad) => {
        try {
            await api.patch(`/api/v1/admin/ads/${ad.id}`, { is_active: !ad.is_active })
            addToast({ type: 'success', message: ad.is_active ? 'Ad deactivated' : 'Ad activated' })
            fetchAds()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update ad' })
        }
    }

    const resetForm = () => {
        setFormData({ title: '', link_url: '', position: 'home_banner', is_active: true })
        setSelectedFile(null)
        setPreviewUrl('')
        setEditingAd(null)
    }

    const positions = [
        { value: 'home_banner', label: 'Home Banner' },
        { value: 'category_banner', label: 'Category Banner' },
        { value: 'search_banner', label: 'Search Results' },
        { value: 'bottom_banner', label: 'Bottom (CTA) Banner' },
    ]

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Ad Banners</h1>
                <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary">+ Create Ad</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
                ) : ads.length > 0 ? (
                    ads.map(ad => (
                        <div key={ad.id} className={`card overflow-hidden ${!ad.is_active ? 'opacity-60' : ''}`}>
                            <div className="h-32 bg-gray-100 overflow-hidden -mx-4 -mt-4 mb-4">
                                {ad.image_url ? (
                                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">📢</div>
                                )}
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{ad.title}</h3>
                            <p className="text-sm text-gray-500 mb-3">{positions.find(p => p.value === ad.position)?.label}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleActive(ad)} className={`text-xs px-3 py-1 rounded-lg flex-1 ${ad.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                                    {ad.is_active ? 'Active' : 'Inactive'}
                                </button>
                                <button onClick={() => handleEdit(ad)} className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">Edit</button>
                                <button onClick={() => handleDelete(ad.id)} className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg">Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <span className="text-5xl block mb-3">📢</span>
                        <p className="text-gray-500">No ads created yet</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">{editingAd ? 'Edit Ad' : 'Create Ad'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image *</label>
                                <div className="space-y-3">
                                    {previewUrl && (
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setPreviewUrl('') }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                    <label className={`
                                        flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all
                                        ${previewUrl ? 'hidden' : 'flex'}
                                    `}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm text-gray-500">Click to upload banner</p>
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                                <input type="url" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} className="input" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input">
                                    {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
