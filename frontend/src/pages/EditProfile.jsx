import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import api from '../services/api'

export default function EditProfile() {
    const { user, updateUser } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [profilePicture, setProfilePicture] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(user?.profile_photo_url || null)
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        student_id: user?.student_id || '',
    })

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setProfilePicture(file)
            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Use FormData for file upload
            const data = new FormData()
            data.append('first_name', formData.first_name)
            data.append('last_name', formData.last_name)
            data.append('phone', formData.phone)
            data.append('student_id', formData.student_id)
            if (profilePicture) {
                data.append('profile_picture', profilePicture)
            }

            const response = await api.put('/api/v1/users/profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            updateUser(response.data.user)
            addToast({ type: 'success', message: 'Profile updated successfully' })
            navigate('/profile')
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.message || 'Failed to update profile' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-20">
            <Header title="Edit Profile" showBack />
            <div className="p-4">
                <form onSubmit={handleSubmit} className="card space-y-4">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-surface-200 overflow-hidden flex items-center justify-center ring-4 ring-primary-100">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-primary-400">{user?.first_name?.[0] || '?'}</span>
                                )}
                            </div>
                            <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-2 cursor-pointer hover:bg-primary-600 transition-colors shadow-md">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
                            <input
                                id="profile-picture"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Click camera icon to change photo</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input
                            type="text"
                            name="student_id"
                            value={formData.student_id}
                            onChange={handleChange}
                            className="input"
                            placeholder="Enter your student ID"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    )
}
