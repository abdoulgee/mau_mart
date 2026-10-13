import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthHeading } from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import CodeInput from '../../components/ui/CodeInput'
import { Alert } from '../../components/ui/Feedback'
import { PasswordField } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

const schema = {
    otp: [rules.required('Enter the code from your email'), rules.minLength(6, 'Enter all 6 digits')],
    password: [rules.required('Enter a new password'), rules.minLength(8, 'Use at least 8 characters')],
    confirm_password: [rules.required('Confirm your new password'), rules.matches('password', "Passwords don't match")],
}

export default function ResetPassword() {
    const { pendingVerificationEmail, resetPassword } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email || pendingVerificationEmail
    const form = useForm({ otp: '', password: '', confirm_password: '' }, schema)

    useEffect(() => {
        if (!email) navigate('/forgot-password', { replace: true })
    }, [email, navigate])

    const submit = form.handleSubmit(async ({ otp, password }) => {
        const result = await resetPassword(email, otp, password)
        if (!result.success) throw new Error(result.error)
        addToast({ type: 'success', message: 'Password updated. Log in with your new password.' })
        navigate('/login')
    })

    return (
        <>
            <AuthHeading title="Set a new password">
                Enter the code sent to <span className="font-medium text-fg">{email}</span> and choose a new password.
            </AuthHeading>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <div className="space-y-1.5">
                    <p className="text-sm font-medium text-fg">Code</p>
                    <CodeInput value={form.values.otp} onChange={(v) => form.setValue('otp', v)} error={!!form.errors.otp} />
                    {form.errors.otp && <p className="text-xs font-medium text-danger">{form.errors.otp}</p>}
                </div>
                <PasswordField label="New password" required autoComplete="new-password" hint="At least 8 characters" {...form.field('password')} />
                <PasswordField label="Confirm new password" required autoComplete="new-password" {...form.field('confirm_password')} />
                <Button type="submit" fullWidth size="lg" loading={form.submitting}>Update password</Button>
            </form>
            <p className="mt-6 text-center text-sm text-fg-muted">
                No code? <Link to="/forgot-password" className="font-medium text-brand-text hover:underline">Send another</Link>
            </p>
        </>
    )
}
