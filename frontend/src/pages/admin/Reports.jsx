import { useState, useEffect } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'
import { Skeleton } from '../../components/ui/Skeleton'

const reportTypes = {
    product: { icon: '📦', label: 'Product' },
    store: { icon: '🏪', label: 'Store' },
    user: { icon: '👤', label: 'User' },
    review: { icon: '⭐', label: 'Review' },
}

export default function AdminReports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('pending')
    const [selectedReport, setSelectedReport] = useState(null)
    const { addToast } = useUIStore()

    useEffect(() => {
        fetchReports()
    }, [activeTab])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/v1/admin/reports', { params: { status: activeTab } })
            setReports(response.data.reports || [])
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load reports' })
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (reportId, action) => {
        try {
            await api.post(`/api/v1/admin/reports/${reportId}/resolve`, { action })
            addToast({ type: 'success', message: 'Report resolved' })
            fetchReports()
            setSelectedReport(null)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to resolve report' })
        }
    }

    const handleDismiss = async (reportId) => {
        try {
            await api.post(`/api/v1/admin/reports/${reportId}/dismiss`)
            addToast({ type: 'success', message: 'Report dismissed' })
            fetchReports()
            setSelectedReport(null)
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to dismiss report' })
        }
    }

    const tabs = [
        { id: 'pending', label: 'Pending' },
        { id: 'resolved', label: 'Resolved' },
        { id: 'dismissed', label: 'Dismissed' },
    ]

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reports List */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
                ) : reports.length > 0 ? (
                    reports.map(report => (
                        <div key={report.id} className="card" onClick={() => setSelectedReport(report)}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-xl">
                                    {reportTypes[report.report_type]?.icon || '🚩'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-gray-900">
                                            {reportTypes[report.report_type]?.label || 'Report'}: {report.reported_item_name || `#${report.reported_id}`}
                                        </h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{report.reason}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Reported by: {report.reporter?.first_name} {report.reporter?.last_name} • {new Date(report.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <span className="text-5xl block mb-3">🚩</span>
                        <p className="text-gray-500">No {activeTab} reports</p>
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Report Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">Type</label>
                                <p className="font-medium">{reportTypes[selectedReport.report_type]?.label}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Reason</label>
                                <p className="text-gray-900">{selectedReport.reason}</p>
                            </div>
                            {selectedReport.description && (
                                <div>
                                    <label className="text-sm text-gray-500">Description</label>
                                    <p className="text-gray-600">{selectedReport.description}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm text-gray-500">Reporter</label>
                                <p className="font-medium">{selectedReport.reporter?.first_name} {selectedReport.reporter?.last_name}</p>
                            </div>

                            {selectedReport.status === 'pending' && (
                                <div className="flex gap-2 pt-4 border-t">
                                    <button onClick={() => handleDismiss(selectedReport.id)} className="btn-secondary flex-1">Dismiss</button>
                                    <button onClick={() => handleResolve(selectedReport.id, 'warn')} className="bg-yellow-500 text-white px-4 py-2 rounded-xl flex-1">Warn</button>
                                    <button onClick={() => handleResolve(selectedReport.id, 'remove')} className="bg-red-500 text-white px-4 py-2 rounded-xl flex-1">Remove</button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setSelectedReport(null)} className="w-full mt-4 btn-secondary">Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}
