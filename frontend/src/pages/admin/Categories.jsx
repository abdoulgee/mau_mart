import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'
import useCategoryStore from '../../store/categoryStore'

export default function AdminCategories() {
    const { categories, loading, fetchCategories, connectSocket } = useCategoryStore()
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({ name: '', description: '', icon: '' })
    const { addToast } = useUIStore()

    useEffect(() => {
        connectSocket()
        fetchCategories(true)
    }, [])


    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingCategory) {
                await api.put(`/api/v1/admin/categories/${editingCategory.id}`, formData)
                addToast({ type: 'success', message: 'Category updated!' })
            } else {
                await api.post('/api/v1/admin/categories', formData)
                addToast({ type: 'success', message: 'Category created!' })
            }
            setShowModal(false)
            setFormData({ name: '', description: '', icon: '' })
            setEditingCategory(null)
            // No need to explicitly fetch as socket will trigger it, but doing it for immediate feedback
            fetchCategories(true)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to save category' })
        }
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setFormData({ name: category.name, description: category.description || '', icon: category.icon || '' })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this category?')) return
        try {
            await api.delete(`/api/v1/admin/categories/${id}`)
            addToast({ type: 'success', message: 'Category deleted' })
            fetchCategories(true)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to delete category' })
        }
    }

    const icons = ['🍔', '📱', '👗', '📚', '🛠️', '🏠', '⚽', '💊', '🎮', '🎨', '🚗', '💼']

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <button onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '', icon: '📦' }); setShowModal(true) }} className="btn-primary">
                    + Add Category
                </button>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Icon</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Name</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Slug</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-500">Products</th>
                            <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                            ))
                        ) : categories.length > 0 ? (
                            categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-2xl">{cat.icon || '📦'}</td>
                                    <td className="p-4 font-medium text-gray-900">{cat.name}</td>
                                    <td className="p-4 text-gray-500">{cat.slug}</td>
                                    <td className="p-4 text-gray-600">{cat.product_count || 0}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(cat)} className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Edit</button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No categories found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" rows={2} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {icons.map(icon => (
                                        <button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })} className={`w-10 h-10 rounded-lg text-xl ${formData.icon === icon ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 hover:bg-gray-200'}`}>{icon}</button>
                                    ))}
                                </div>
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
