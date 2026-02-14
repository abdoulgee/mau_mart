import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function SellerProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const storeRes = await api.get('/api/v1/stores/my-store')
            const storeId = storeRes.data.store?.id
            if (storeId) {
                const productsRes = await api.get(`/api/v1/stores/${storeId}/products`)
                setProducts(productsRes.data.products || [])
            }
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load products' })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        try {
            await api.delete(`/api/v1/products/${productId}`)
            addToast({ type: 'success', message: 'Product deleted' })
            setProducts(products.filter(p => p.id !== productId))
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to delete product' })
        }
    }

    return (
        <div className="p-4 space-y-4 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">My Products</h2>
                <Link to="/seller/products/new" className="btn-primary text-sm">
                    + Add Product
                </Link>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card">
                            <Skeleton className="aspect-square rounded-xl mb-3" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {products.map(product => (
                        <div key={product.id} className="card">
                            <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-3 relative">
                                {product.media?.[0]?.url ? (
                                    <img src={product.media[0].url} alt={product.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                                )}
                                {!product.is_in_stock && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">Out of Stock</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">{product.title}</h3>
                            <p className="text-primary-600 font-semibold mb-3">₦{product.price?.toLocaleString()}</p>
                            <div className="flex gap-2">
                                <Link to={`/seller/products/${product.id}/edit`} className="btn-secondary text-xs py-1 flex-1">Edit</Link>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="text-xs py-1 px-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <span className="text-6xl block mb-4">📦</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6">Add your first product to start selling</p>
                    <Link to="/seller/products/new" className="btn-primary px-6">Add Product</Link>
                </div>
            )}
        </div>
    )
}
