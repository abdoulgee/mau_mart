import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [search, setSearch] = useState('')
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchProducts()
    }, [page, search])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/v1/products', { params: { page, limit: 20, search } })
            setProducts(response.data.products || [])
            setPagination(response.data.pagination || {})
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load products' })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleFeatured = async (productId, isFeatured) => {
        try {
            await api.patch(`/api/v1/admin/products/${productId}`, { is_featured: !isFeatured })
            addToast({ type: 'success', message: isFeatured ? 'Removed from featured' : 'Added to featured' })
            fetchProducts()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to update product' })
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm('Delete this product?')) return
        try {
            await api.delete(`/api/v1/products/${productId}`)
            addToast({ type: 'success', message: 'Product deleted' })
            fetchProducts()
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to delete product' })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Product</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Store</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Price</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Stock</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-16 w-full" /></td></tr>
                                ))
                            ) : products.length > 0 ? (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                                    {product.media?.[0]?.url ? (
                                                        <img src={product.media[0].url} alt="" className="w-full h-full object-cover" />
                                                    ) : <div className="w-full h-full flex items-center justify-center">📦</div>}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                                                    <p className="text-xs text-gray-500">ID: {product.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{product.store?.name || '-'}</td>
                                        <td className="p-4 font-medium">₦{product.price?.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {product.is_featured && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs mr-1">Featured</span>}
                                            {product.is_active ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span> : <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Inactive</span>}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handleToggleFeatured(product.id, product.is_featured)} className={`text-xs px-3 py-1 rounded-lg ${product.is_featured ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-600'}`}>
                                                {product.is_featured ? '★ Featured' : '☆ Feature'}
                                            </button>
                                            <Link to={`/product/${product.id}`} className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">View</Link>
                                            <button onClick={() => handleDelete(product.id)} className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No products found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">Previous</button>
                    <span className="text-gray-600">Page {page} of {pagination.pages}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    )
}
