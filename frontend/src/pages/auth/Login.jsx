import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AuthHeading } from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import { Alert } from '../../components/ui/Feedback'
import { TextField, PasswordField } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function Login() {
    const { login } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from ? location.state.from.pathname + (location.state.from.search || '') : '/'

    const form = useForm({ email: '', password: '' }, {
        email: [rules.required('Enter your email or student ID')],
        password: [rules.required('Enter your password')],
    })

    const submit = form.handleSubmit(async (values) => {
        const result = await login({ email: values.email.trim(), password: values.password })
        if (result.success) {
            addToast({ type: 'success', message: `Welcome back, ${result.user.first_name}` })
            const isAdmin = ['admin', 'super_admin'].includes(result.user.role)
            navigate(isAdmin && from === '/' ? '/admin/dashboard' : from, { replace: true })
        } else if (result.needsVerification) {
            addToast({ type: 'info', message: 'Verify your email first. We sent you a new code.' })
            navigate('/verify-otp')
        } else {
            throw new Error(result.error)
        }
    })

    return (
        <>
            <AuthHeading title="Log in">Buy and sell with students on campus.</AuthHeading>
            {location.state?.verified && <Alert tone="success" className="mb-4">Email verified. You can log in now.</Alert>}
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <TextField label="Email or student ID" icon={Mail} autoComplete="username" autoFocus {...form.field('email')} />
                <div className="space-y-1.5">
                    <PasswordField label="Password" autoComplete="current-password" {...form.field('password')} />
                    <div className="text-right">
                        <Link to="/forgot-password" className="text-sm font-medium text-brand-text hover:underline">Forgot password?</Link>
                    </div>
                </div>
                <Button type="submit" fullWidth size="lg" loading={form.submitting}>Log in</Button>
            </form>
            <p className="mt-6 text-center text-sm text-fg-muted">
                New here? <Link to="/signup" state={location.state} className="font-medium text-brand-text hover:underline">Create an account</Link>
            </p>
        </>
    )
}
