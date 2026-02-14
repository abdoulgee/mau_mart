import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'

export default function VerifyOtp() {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [countdown, setCountdown] = useState(60)
    const inputRefs = useRef([])
    const { pendingVerificationEmail, verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore()
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const email = pendingVerificationEmail || location.state?.email

    // Redirect if no email to verify
    useEffect(() => {
        if (!email) {
            navigate('/signup')
        }
    }, [email, navigate])

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleChange = (index, value) => {
        clearError()

        // Only allow numbers
        if (value && !/^\d$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all fields filled
        if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
            handleSubmit(newOtp.join(''))
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6)
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
            setOtp(newOtp)
            if (pastedData.length === 6) {
                handleSubmit(pastedData)
            }
        }
    }

    const handleSubmit = async (otpCode = otp.join('')) => {
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code')
            return
        }

        const result = await verifyOtp(email, otpCode)

        if (result.success) {
            toast.success('Email verified successfully!')
            navigate('/login', { state: { verified: true } })
        } else {
            toast.error(result.error)
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        }
    }

    const handleResend = async () => {
        if (countdown > 0) return

        const result = await resendOtp(email)

        if (result.success) {
            toast.success('New OTP sent to your email')
            setCountdown(60)
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12">
            {/* Icon */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-2xl shadow-lg shadow-secondary-500/30 mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
                <p className="text-gray-500 mt-2">
                    We've sent a 6-digit code to<br />
                    <span className="font-medium text-gray-700">{email}</span>
                </p>
            </div>

            {/* OTP Input */}
            <div className="card p-6 mx-auto w-full max-w-sm">
                <div className="flex justify-center gap-2 mb-6">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`
                w-12 h-14 text-center text-xl font-bold rounded-xl border-2 
                focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                transition-all duration-200
                ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-surface-50'}
                ${digit ? 'border-primary-300 bg-primary-50' : ''}
              `}
                        />
                    ))}
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-4">
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    </div>
                )}

                {/* Verify button */}
                <button
                    onClick={() => handleSubmit()}
                    disabled={isLoading || otp.join('').length !== 6}
                    className="btn-primary w-full py-3.5 mb-4"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Verifying...
                        </span>
                    ) : (
                        'Verify Email'
                    )}
                </button>

                {/* Resend */}
                <p className="text-center text-gray-600 text-sm">
                    Didn't receive the code?{' '}
                    <button
                        onClick={handleResend}
                        disabled={countdown > 0 || isLoading}
                        className={`font-medium ${countdown > 0 ? 'text-gray-400' : 'text-primary-600 hover:text-primary-700'}`}
                    >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                </p>
            </div>

            {/* Info */}
            <div className="mt-8 mx-auto max-w-sm">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                        Check your spam folder if you don't see the email in your inbox. The OTP is also printed in the backend console.
                    </p>
                </div>
            </div>
        </div>
    )
}
