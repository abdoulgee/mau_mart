import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AdminStoreRequests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('pending')
    const { addToast } = useUIStore()
    const [selectedRequest, setSelectedRequest] = useState(null)

    useEffect(() => {
        fetchRequests()
    }, [activeTab])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/v1/admin/store-requests', {
                params: { status: activeTab }
            })
            setRequests(response.data.requests || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to fetch store requests' })
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (requestId) => {
        try {
            await api.post(`/api/v1/admin/store-requests/${requestId}/approve`)
            addToast({ type: 'success', message: 'Store request approved!' })
            fetchRequests()
            setSelectedRequest(null)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to approve request' })
        }
    }

    const handleReject = async (requestId, reason) => {
        try {
            await api.post(`/api/v1/admin/store-requests/${requestId}/reject`, { reason })
            addToast({ type: 'success', message: 'Store request rejected' })
            fetchRequests()
            setSelectedRequest(null)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to reject request' })
        }
    }

    const tabs = [
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
    ]

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Store Requests</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))
                ) : requests.length > 0 ? (
                    requests.map(request => (
                        <div key={request.id} className="card">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-medium">
                                    {request.user?.first_name?.[0]}{request.user?.last_name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900">{request.store_name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        By: {request.user?.first_name} {request.user?.last_name} ({request.user?.email})
                                    </p>
                                    <p className="text-sm text-gray-600">{request.description}</p>
                                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                                        <span>Type: {request.store_type}</span>
                                        <span>•</span>
                                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                    </div>

                                    {request.status === 'pending' && (
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => handleApprove(request.id)}
                                                className="btn-primary text-sm py-2"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(request.id, 'Application rejected')}
                                                className="btn-secondary text-sm py-2"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <span className="text-5xl block mb-3">📋</span>
                        <p className="text-gray-500">No {activeTab} requests</p>
                    </div>
                )}
            </div>
        </div>
    )
}
