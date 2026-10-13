import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { AuthHeading } from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import CodeInput from '../../components/ui/CodeInput'
import { Alert } from '../../components/ui/Feedback'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function VerifyOtp() {
    const { pendingVerificationEmail, verifyOtp, resendOtp } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const location = useLocation()
    const email = pendingVerificationEmail || location.state?.email

    const [code, setCode] = useState('')
    const [error, setError] = useState(null)
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [countdown, setCountdown] = useState(60)

    useEffect(() => {
        if (!email) navigate('/signup', { replace: true })
    }, [email, navigate])

    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    const verify = async (value = code) => {
        if (value.length !== 6) {
            setError('Enter the 6-digit code')
            return
        }
        setVerifying(true)
        setError(null)
        const result = await verifyOtp(email, value)
        setVerifying(false)
        if (result.success) {
            navigate('/login', { state: { verified: true } })
        } else {
            setError(result.error)
            setCode('')
        }
    }

    const resend = async () => {
        setResending(true)
        const result = await resendOtp(email)
        setResending(false)
        if (result.success) {
            addToast({ type: 'success', message: 'We sent you a new code' })
            setCountdown(60)
            setCode('')
            setError(null)
        } else {
            addToast({ type: 'error', message: result.error })
        }
    }

    return (
        <>
            <AuthHeading title="Check your email">
                Enter the 6-digit code we sent to <span className="font-medium text-fg">{email}</span>.
            </AuthHeading>
            <form onSubmit={(e) => { e.preventDefault(); verify() }} className="space-y-4" noValidate>
                {error && <Alert tone="danger">{error}</Alert>}
                <CodeInput value={code} onChange={(v) => { setCode(v); setError(null) }} onComplete={verify} error={!!error} disabled={verifying} />
                <Button type="submit" fullWidth size="lg" loading={verifying}>Verify email</Button>
            </form>
            <div className="mt-6 space-y-2 text-center text-sm text-fg-muted">
                <p>
                    Didn't get it?{' '}
                    {countdown > 0 ? (
                        <span className="tabular">Resend in {countdown}s</span>
                    ) : (
                        <button type="button" onClick={resend} disabled={resending} className="font-medium text-brand-text hover:underline disabled:opacity-50">
                            {resending ? 'Sending…' : 'Resend code'}
                        </button>
                    )}
                </p>
                <p><Link to="/signup" className="hover:underline">Use a different email</Link></p>
            </div>
        </>
    )
}
