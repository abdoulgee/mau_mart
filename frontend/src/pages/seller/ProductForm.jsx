import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import useCategoryStore from '../../store/categoryStore'

export default function ProductForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToast } = useUIStore()
    const { categories, fetchCategories, connectSocket } = useCategoryStore()
    const [loading, setLoading] = useState(false)
    const [mediaFiles, setMediaFiles] = useState([])
    const [previews, setPreviews] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        compare_price: '',
        product_type: 'physical',
        stock_quantity: 1,
        pickup_location: '',
        category_ids: [],
    })

    const isEdit = Boolean(id)

    useEffect(() => {
        connectSocket()
        fetchCategories()
        if (isEdit) {
            fetchProduct()
        }
    }, [id])


    const fetchProduct = async () => {
        try {
            const response = await api.get(`/api/v1/products/${id}`)
            const product = response.data.product
            setFormData({
                title: product.title || '',
                description: product.description || '',
                price: product.price || '',
                compare_price: product.compare_price || '',
                product_type: product.product_type || 'physical',
                stock_quantity: product.stock_quantity || 1,
                pickup_location: product.pickup_location || '',
                category_ids: product.categories?.map(c => c.id) || [],
            })
            if (product.media) {
                setPreviews(product.media.map(m => m.url))
            }
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load product' })
            navigate('/seller/products')
        }
    }

    const handleChange = (e) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || '' : value
        }))
    }

    const handleCategoryToggle = (catId) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(catId)
                ? prev.category_ids.filter(id => id !== catId)
                : [...prev.category_ids, catId]
        }))
    }

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 4)
        setMediaFiles(files)

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file))
        setPreviews(newPreviews)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title || !formData.price) {
            addToast({ type: 'error', message: 'Title and price are required' })
            return
        }

        setLoading(true)
        try {
            const data = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'category_ids') {
                    value.forEach(id => data.append('category_ids', id))
                } else {
                    data.append(key, value)
                }
            })

            mediaFiles.forEach(file => {
                data.append('media', file)
            })

            if (isEdit) {
                await api.put(`/api/v1/products/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                addToast({ type: 'success', message: 'Product updated!' })
            } else {
                await api.post('/api/v1/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                addToast({ type: 'success', message: 'Product created!' })
            }

            navigate('/seller/products')
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to save product' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 pb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Media Upload */}
                <div className="card">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                    <div className="grid grid-cols-4 gap-2">
                        {previews.map((preview, i) => (
                            <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                                <img src={preview} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {previews.length < 4 && (
                            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xs text-gray-400 mt-1">Add</span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleMediaChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="card space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="input resize-none" />
                    </div>
                </div>

                {/* Pricing */}
                <div className="card">
                    <h3 className="font-medium text-gray-900 mb-3">Pricing</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="input" required min="0" step="0.01" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (₦)</label>
                            <input type="number" name="compare_price" value={formData.compare_price} onChange={handleChange} className="input" min="0" step="0.01" />
                        </div>
                    </div>
                </div>

                {/* Inventory */}
                <div className="card">
                    <h3 className="font-medium text-gray-900 mb-3">Inventory</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                            <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="input" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                            <input type="text" name="pickup_location" value={formData.pickup_location} onChange={handleChange} placeholder="e.g., Block A" className="input" />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="card">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryToggle(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${formData.category_ids.includes(cat.id)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                    {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
                </button>
            </form>
        </div>
    )
}
