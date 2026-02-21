import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'

export default function Signup() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        student_id: '',
        password: '',
        confirm_password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const { register, isLoading, error, clearError } = useAuthStore()
    const toast = useToast()
    const navigate = useNavigate()

    const handleChange = (e) => {
        clearError()
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate passwords match
        if (formData.password !== formData.confirm_password) {
            toast.error('Passwords do not match')
            return
        }

        // Validate password strength
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        const { confirm_password, ...submitData } = formData
        const result = await register(submitData)

        if (result.success) {
            toast.success('Account created! Please verify your email.')
            navigate('/verify-otp')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-8">
            {/* Logo */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 mb-3 overflow-hidden">
                    {(() => { try { const s = JSON.parse(localStorage.getItem('app-settings') || '{}'); if (s.site_logo_url) { const getUrl = (u) => u?.startsWith('http') ? u : `${import.meta.env.VITE_API_URL || ''}${u}`; return <img src={getUrl(s.site_logo_url)} alt="" className="w-full h-full object-cover" /> } } catch (e) { } return <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> })()}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                <p className="text-gray-500 mt-1">Join MAU MART marketplace</p>
            </div>

            {/* Form */}
            <div className="card p-6 mx-auto w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="first_name" className="label">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="John"
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="label">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Doe"
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className={`input ${error?.includes('email') ? 'input-error' : ''}`}
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="label">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+234 800 000 0000"
                            className="input"
                            required
                        />
                    </div>

                    {/* Student ID (optional) */}
                    <div>
                        <label htmlFor="student_id" className="label">
                            Student ID <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="student_id"
                            name="student_id"
                            value={formData.student_id}
                            onChange={handleChange}
                            placeholder="e.g. MAU/2020/1234"
                            className="input"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="label">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                className="input pr-12"
                                required
                                minLength={8}
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

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirm_password" className="label">
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirm_password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder="Repeat your password"
                            className={`input ${formData.confirm_password && formData.password !== formData.confirm_password ? 'input-error' : ''}`}
                            required
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Terms */}
                    <p className="text-xs text-gray-500 text-center">
                        By creating an account, you agree to our{' '}
                        <Link to="/terms" className="text-primary-600">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-primary-600">Privacy Policy</Link>
                    </p>

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
                                Creating account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>
            </div>

            {/* Sign in link */}
            <p className="text-center mt-5 text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
