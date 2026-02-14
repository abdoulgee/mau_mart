import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import useUIStore from '../store/uiStore'
import api from '../services/api'

export default function ChangePassword() {
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    })

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.new_password !== formData.confirm_password) {
            addToast({ type: 'error', message: 'Passwords do not match' })
            return
        }

        setLoading(true)
        try {
            await api.put('/api/v1/users/password', {
                current_password: formData.current_password,
                new_password: formData.new_password
            })
            addToast({ type: 'success', message: 'Password changed successfully' })
            navigate('/profile')
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to change password' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Change Password" showBack />
            <div className="p-4">
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            className="input"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className="input"
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
