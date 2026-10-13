import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { AuthHeading } from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import { Alert } from '../../components/ui/Feedback'
import { TextField } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import useAuthStore from '../../store/authStore'

export default function ForgotPassword() {
    const { forgotPassword } = useAuthStore()
    const navigate = useNavigate()
    const form = useForm({ email: '' }, { email: [rules.required('Enter your email'), rules.email()] })

    const submit = form.handleSubmit(async ({ email }) => {
        const result = await forgotPassword(email.trim())
        if (!result.success) throw new Error(result.error)
        navigate('/reset-password', { state: { email: email.trim() } })
    })

    return (
        <>
            <AuthHeading title="Reset your password">We'll email you a code to set a new password.</AuthHeading>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <TextField label="Email" type="email" icon={Mail} autoComplete="email" autoFocus {...form.field('email')} />
                <Button type="submit" fullWidth size="lg" loading={form.submitting}>Send code</Button>
            </form>
            <p className="mt-6 text-center text-sm">
                <Link to="/login" className="inline-flex items-center gap-1 font-medium text-fg-muted hover:text-fg">
                    <ArrowLeft size={14} aria-hidden />Back to log in
                </Link>
            </p>
        </>
    )
}
