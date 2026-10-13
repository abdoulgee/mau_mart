import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import { Alert, Badge, ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { TextField, PasswordField, Checkbox } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'
import cn from '../../utils/cn'

const PROVIDERS = {
    resend: { label: 'Resend', hint: 'HTTP API using RESEND_API_KEY from the server environment. Falls back to SMTP if it fails.' },
    smtp: { label: 'SMTP', hint: 'Uses the SMTP account below. Falls back to Resend if it fails.' },
}

export default function AdminSmtp() {
    const { addToast } = useUIStore()
    const [status, setStatus] = useState('loading')
    const [provider, setProvider] = useState('resend')
    const [savingProvider, setSavingProvider] = useState(false)
    const [hasPassword, setHasPassword] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const [testState, setTestState] = useState(null) // { tone, message }
    const [testing, setTesting] = useState(false)

    const form = useForm(
        { server: '', port: 587, username: '', password: '', use_tls: true, from_email: '', from_name: 'MAU MART' },
        {
            server: [rules.required('Enter the SMTP server')],
            port: [rules.required(), rules.number({ min: 1, max: 65535, message: 'Enter a valid port' })],
            username: [rules.required('Enter the username')],
            password: [(v) => (!v && !hasPassword ? 'Enter the password' : null)],
            from_email: [rules.required('Enter the sender address'), rules.email()],
        }
    )

    const load = () => {
        setStatus('loading')
        Promise.all([api.get('/api/v1/admin/smtp-config'), api.get('/api/v1/admin/settings')])
            .then(([smtp, settings]) => {
                if (smtp.data.config) {
                    const { has_password, ...rest } = smtp.data.config
                    form.setValues((v) => ({ ...v, ...rest, from_name: rest.from_name || '', password: '' }))
                    setHasPassword(has_password)
                }
                setProvider(settings.data.settings?.email_provider === 'smtp' ? 'smtp' : 'resend')
                setStatus('ready')
            })
            .catch(() => setStatus('error'))
    }
    useEffect(load, [])

    const changeProvider = async (value) => {
        const previous = provider
        setProvider(value)
        setSavingProvider(true)
        try {
            await api.post('/api/v1/admin/settings', { email_provider: value })
            addToast({ type: 'success', message: `Emails now send through ${PROVIDERS[value].label}` })
        } catch (error) {
            setProvider(previous)
            addToast({ type: 'error', message: errorMessage(error) })
        } finally {
            setSavingProvider(false)
        }
    }

    const submit = form.handleSubmit(async (values) => {
        try {
            await api.post('/api/v1/admin/smtp-config', { ...values, port: Number(values.port) })
            if (values.password) setHasPassword(true)
            form.setValue('password', '')
            addToast({ type: 'success', message: 'SMTP settings saved' })
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not save SMTP settings'))
        }
    })

    const sendTest = async (e) => {
        e.preventDefault()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
            setTestState({ tone: 'danger', message: 'Enter a valid email address' })
            return
        }
        setTesting(true)
        setTestState(null)
        try {
            const { data } = await api.post('/api/v1/admin/smtp-test', { email: testEmail })
            setTestState({ tone: 'success', message: data.message })
        } catch (error) {
            setTestState({ tone: 'danger', message: errorMessage(error, 'Test email failed') })
        } finally {
            setTesting(false)
        }
    }

    if (status === 'loading') return <AdminPage title="Email"><LoadingBlock label="Loading email settings" /></AdminPage>
    if (status === 'error') return <AdminPage title="Email"><ErrorState onRetry={load} /></AdminPage>

    return (
        <AdminPage title="Email" description="Used for verification and password reset codes">
            <div className="max-w-2xl space-y-6">
                <Panel title="Provider">
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Email provider">
                        {Object.entries(PROVIDERS).map(([value, p]) => (
                            <label key={value} className={cn(
                                'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand',
                                provider === value ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong',
                                savingProvider && 'pointer-events-none opacity-60'
                            )}>
                                <input type="radio" name="provider" checked={provider === value} onChange={() => changeProvider(value)} className="mt-1 accent-[rgb(var(--brand))]" />
                                <span>
                                    <span className="flex items-center gap-2 text-sm font-medium text-fg">
                                        {p.label}{provider === value && <Badge tone="success">In use</Badge>}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-fg-muted">{p.hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </Panel>

                <Panel title="SMTP account" description={hasPassword ? 'Saved. The password is stored on the server and never shown.' : 'Not configured yet.'}>
                    <form onSubmit={submit} noValidate className="space-y-5">
                        {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                        <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
                            <TextField label="Server" required placeholder="smtp.gmail.com" {...form.field('server')} />
                            <TextField label="Port" required type="number" inputMode="numeric" {...form.field('port')} />
                        </div>
                        <TextField label="Username" required autoComplete="off" {...form.field('username')} />
                        <PasswordField label="Password" required={!hasPassword} autoComplete="new-password"
                            placeholder={hasPassword ? 'Leave empty to keep the saved password' : ''} {...form.field('password')} />
                        <div className="grid gap-5 sm:grid-cols-2">
                            <TextField label="From address" required type="email" {...form.field('from_email')} />
                            <TextField label="From name" optional {...form.field('from_name')} />
                        </div>
                        <Checkbox label="Use STARTTLS" description="For port 587. Port 465 uses SSL automatically."
                            checked={!!form.values.use_tls} onChange={(e) => form.setValue('use_tls', e.target.checked)} className="-mx-2" />
                        <div className="flex justify-end">
                            <Button type="submit" loading={form.submitting}>Save SMTP settings</Button>
                        </div>
                    </form>
                </Panel>

                <Panel title="Send a test email" description="Sends through the provider in use">
                    <form onSubmit={sendTest} noValidate className="space-y-3">
                        {testState && <Alert tone={testState.tone}>{testState.message}</Alert>}
                        <div className="flex gap-2">
                            <TextField className="flex-1" type="email" placeholder="you@example.com" aria-label="Test email address"
                                value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                            <Button type="submit" variant="secondary" icon={Send} loading={testing}>Send</Button>
                        </div>
                    </form>
                </Panel>
            </div>
        </AdminPage>
    )
}
