import { Link, useNavigate } from 'react-router-dom'
import { AuthHeading } from '../../layouts/AuthLayout'
import Button from '../../components/ui/Button'
import { Alert } from '../../components/ui/Feedback'
import { TextField, PasswordField } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

const schema = {
    first_name: [rules.required('Enter your first name')],
    last_name: [rules.required('Enter your last name')],
    email: [rules.required('Enter your email'), rules.email()],
    phone: [rules.required('Enter your phone number'), rules.phone()],
    whatsapp: [rules.phone('Enter a valid WhatsApp number')],
    password: [rules.required('Create a password'), rules.minLength(8, 'Use at least 8 characters')],
    confirm_password: [rules.required('Confirm your password'), rules.matches('password', "Passwords don't match")],
}

export default function Signup() {
    const { register } = useAuthStore()
    const { addToast } = useUIStore()
    const navigate = useNavigate()
    const form = useForm({
        first_name: '', last_name: '', email: '', phone: '', whatsapp: '', student_id: '', password: '', confirm_password: '',
    }, schema)

    const submit = form.handleSubmit(async ({ confirm_password, ...values }) => {
        const result = await register({ ...values, email: values.email.trim() })
        if (!result.success) {
            if (/email/i.test(result.error)) form.setErrors((e) => ({ ...e, email: result.error }))
            else if (/student id/i.test(result.error)) form.setErrors((e) => ({ ...e, student_id: result.error }))
            else throw new Error(result.error)
            return
        }
        if (result.autoVerified) {
            addToast({ type: 'success', message: 'Account created. You can log in now.' })
            navigate('/login')
        } else {
            addToast({ type: 'success', message: 'Account created. Check your email for a code.' })
            navigate('/verify-otp')
        }
    })

    return (
        <>
            <AuthHeading title="Create your account">Join to post listings and message sellers.</AuthHeading>
            <form onSubmit={submit} noValidate className="space-y-4">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <div className="grid grid-cols-2 gap-3">
                    <TextField label="First name" required autoComplete="given-name" autoFocus {...form.field('first_name')} />
                    <TextField label="Last name" required autoComplete="family-name" {...form.field('last_name')} />
                </div>
                <TextField label="Email" required type="email" autoComplete="email" {...form.field('email')} />
                <TextField label="Phone number" required type="tel" autoComplete="tel" placeholder="0803 123 4567" {...form.field('phone')} />
                <TextField label="WhatsApp number" optional type="tel" placeholder="Same as phone"
                    hint="Buyers can reach you on WhatsApp about your listings." {...form.field('whatsapp')} />
                <TextField label="Student ID" optional {...form.field('student_id')} />
                <PasswordField label="Password" required autoComplete="new-password" hint="At least 8 characters" {...form.field('password')} />
                <PasswordField label="Confirm password" required autoComplete="new-password" {...form.field('confirm_password')} />
                <Button type="submit" fullWidth size="lg" loading={form.submitting}>Create account</Button>
            </form>
            <p className="mt-6 text-center text-sm text-fg-muted">
                Already have an account? <Link to="/login" className="font-medium text-brand-text hover:underline">Log in</Link>
            </p>
        </>
    )
}
