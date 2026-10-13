import { useNavigate } from 'react-router-dom'
import Page from '../components/navigation/Page'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import { Alert } from '../components/ui/Feedback'
import { PasswordField } from '../components/ui/Field'
import useForm, { rules } from '../hooks/useForm'
import useUIStore from '../store/uiStore'
import api, { errorMessage } from '../services/api'

const schema = {
    current_password: [rules.required('Enter your current password')],
    new_password: [rules.required('Enter a new password'), rules.minLength(8, 'Use at least 8 characters')],
    confirm_password: [rules.required('Confirm your new password'), rules.matches('new_password', "Passwords don't match")],
}

export default function ChangePassword() {
    const navigate = useNavigate()
    const { addToast } = useUIStore()
    const form = useForm({ current_password: '', new_password: '', confirm_password: '' }, schema)

    const submit = form.handleSubmit(async ({ current_password, new_password }) => {
        try {
            await api.post('/api/v1/users/change-password', { current_password, new_password })
            addToast({ type: 'success', message: 'Password changed' })
            navigate('/profile')
        } catch (error) {
            const message = errorMessage(error, 'Could not change your password')
            if (message.toLowerCase().includes('current password')) {
                form.setErrors((e) => ({ ...e, current_password: message }))
                return
            }
            throw new Error(message)
        }
    })

    return (
        <Page title="Change password" back width="narrow">
            <form onSubmit={submit} noValidate className="space-y-6">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                <Panel>
                    <div className="space-y-5">
                        <PasswordField label="Current password" required autoComplete="current-password" {...form.field('current_password')} />
                        <PasswordField label="New password" required autoComplete="new-password" hint="At least 8 characters" {...form.field('new_password')} />
                        <PasswordField label="Confirm new password" required autoComplete="new-password" {...form.field('confirm_password')} />
                    </div>
                </Panel>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" loading={form.submitting}>Update password</Button>
                </div>
            </form>
        </Page>
    )
}
