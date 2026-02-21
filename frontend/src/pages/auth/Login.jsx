import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const { login, isLoading, error, clearError } = useAuthStore()
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/'

    const handleChange = (e) => {
        clearError()
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const result = await login(formData)

        if (result.success) {
            toast.success('Welcome back!')

            // Ensure token is set in API client before navigating
            const state = useAuthStore.getState()

            if (state.accessToken) {
                api.setAuthToken(state.accessToken)
            }

            // Small delay to ensure token is properly set
            await new Promise(resolve => setTimeout(resolve, 100))

            // Navigate based on role
            if (result.user.role === 'admin' || result.user.role === 'super_admin') {
                navigate('/admin/dashboard')
            } else if (result.user.is_seller) {
                navigate('/seller')
            } else {
                navigate(from)
            }
        } else if (result.needsVerification) {
            toast.success('Please verify your email. A new code has been sent!')
            navigate('/verify-otp')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                <p className="text-gray-500 mt-1">Sign in to continue to MAU MART</p>
            </div>

            {/* Form */}
            <div className="card p-6 mx-auto w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email or Student ID */}
                    <div>
                        <label htmlFor="email" className="label">
                            Email or Student ID
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email or student ID"
                            className={`input ${error ? 'input-error' : ''}`}
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="password" className="label mb-0">
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className={`input pr-12 ${error ? 'input-error' : ''}`}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-3.5"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>

            {/* Sign up link */}
            <p className="text-center mt-6 text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                    Create one
                </Link>
            </p>
        </div>
    )
}
