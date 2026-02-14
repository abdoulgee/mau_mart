import { useState } from 'react'
import api from '../../services/api'
import useUIStore from '../../store/uiStore'

const REPORT_REASONS = [
    'Inappropriate content',
    'Fraudulent activity',
    'Counterfeit product',
    'Offensive language',
    'Misleading information',
    'Harassment',
    'Other'
]

export default function ReportModal({ isOpen, onClose, entityType, entityId }) {
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const { addToast } = useUIStore()

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!reason) {
            addToast({ type: 'warning', message: 'Please select a reason' })
            return
        }

        setLoading(true)
        try {
            await api.post('/api/v1/reports', {
                entity_type: entityType,
                entity_id: entityId,
                reason,
                description
            })
            addToast({ type: 'success', message: 'Report submitted. Thank you for making MAU MART safer!' })
            onClose()
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to submit report' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Report {entityType}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select a reason</option>
                            {REPORT_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us more about the issue..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
