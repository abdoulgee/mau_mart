import { useState, useEffect } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { AdminPage } from '../../layouts/AdminLayout'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import { Alert, ErrorState, LoadingBlock, Spinner } from '../../components/ui/Feedback'
import { TextField, Checkbox } from '../../components/ui/Field'
import useForm, { rules } from '../../hooks/useForm'
import api, { errorMessage } from '../../services/api'
import useUIStore from '../../store/uiStore'
import useSettingsStore from '../../store/settingsStore'
import getImageUrl from '../../utils/imageUrl'

const defaults = {
    site_name: 'MAU MART',
    site_tagline: 'Campus Marketplace',
    site_logo_url: '',
    support_email: '',
    admin_whatsapp: '',
    require_email_verification: true,
    allow_guest_browsing: true,
    maintenance_mode: false,
}

const schema = {
    site_name: [rules.required('Enter a site name'), rules.maxLength(40)],
    site_tagline: [rules.maxLength(80)],
    support_email: [rules.email()],
    admin_whatsapp: [rules.phone('Enter a valid WhatsApp number')],
}

export default function AdminSettings() {
    const { addToast } = useUIStore()
    const [status, setStatus] = useState('loading')
    const [uploading, setUploading] = useState(false)
    const form = useForm(defaults, schema)

    const load = () => {
        setStatus('loading')
        api.get('/api/v1/admin/settings')
            .then(({ data }) => { form.setValues({ ...defaults, ...data.settings }); setStatus('ready') })
            .catch(() => setStatus('error'))
    }
    useEffect(load, [])

    const uploadLogo = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        setUploading(true)
        try {
            const data = new FormData()
            data.append('file', file)
            const res = await api.post('/api/v1/uploads/site', data, { headers: { 'Content-Type': 'multipart/form-data' } })
            form.setValue('site_logo_url', res.data.url)
        } catch (error) {
            addToast({ type: 'error', message: errorMessage(error, 'Logo upload failed') })
        } finally {
            setUploading(false)
        }
    }

    const submit = form.handleSubmit(async (values) => {
        try {
            await api.post('/api/v1/admin/settings', { ...values, admin_whatsapp: values.admin_whatsapp.replace(/\D/g, '') })
            await useSettingsStore.getState().fetchSettings()
            addToast({ type: 'success', message: 'Settings saved' })
        } catch (error) {
            throw new Error(errorMessage(error, 'Could not save settings'))
        }
    })

    if (status === 'loading') return <AdminPage title="App settings"><LoadingBlock label="Loading settings" /></AdminPage>
    if (status === 'error') return <AdminPage title="App settings"><ErrorState onRetry={load} /></AdminPage>

    const { values } = form

    return (
        <AdminPage title="App settings" description="Only super admins can change these">
            <form onSubmit={submit} noValidate className="max-w-2xl space-y-6">
                {form.formError && <Alert tone="danger">{form.formError}</Alert>}
                {values.maintenance_mode && <Alert tone="warning" title="Maintenance mode is on">Only admins can use the marketplace right now.</Alert>}

                <Panel title="Branding">
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-muted">
                                {uploading ? <Spinner /> : values.site_logo_url
                                    ? <img src={getImageUrl(values.site_logo_url)} alt="Site logo" className="h-full w-full object-cover" />
                                    : <ImagePlus size={20} aria-hidden className="text-fg-subtle" />}
                            </span>
                            <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg hover:bg-surface-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
                                {values.site_logo_url ? 'Change logo' : 'Upload logo'}
                                <input type="file" accept="image/*" onChange={uploadLogo} className="sr-only" />
                            </label>
                            {values.site_logo_url && (
                                <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => form.setValue('site_logo_url', '')}>Remove</Button>
                            )}
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <TextField label="Site name" required {...form.field('site_name')} />
                            <TextField label="Tagline" optional {...form.field('site_tagline')} />
                        </div>
                    </div>
                </Panel>

                <Panel title="Contact">
                    <div className="space-y-5">
                        <TextField label="Support email" type="email" optional hint="Shown on the Help page" {...form.field('support_email')} />
                        <TextField label="Admin WhatsApp" type="tel" optional placeholder="0803 123 4567"
                            hint="Sellers see an option to message this number to get a listing featured. Leave empty to hide it." {...form.field('admin_whatsapp')} />
                    </div>
                </Panel>

                <Panel title="Access">
                    <div className="-m-2 space-y-1">
                        <Checkbox label="Require email verification" description="New users enter a code sent to their email before they can log in."
                            checked={!!values.require_email_verification} onChange={(e) => form.setValue('require_email_verification', e.target.checked)} />
                        <Checkbox label="Allow guest browsing" description="Visitors can browse listings without an account."
                            checked={!!values.allow_guest_browsing} onChange={(e) => form.setValue('allow_guest_browsing', e.target.checked)} />
                        <Checkbox label="Maintenance mode" description="Only admins can use the site while this is on."
                            checked={!!values.maintenance_mode} onChange={(e) => form.setValue('maintenance_mode', e.target.checked)} />
                    </div>
                </Panel>

                <div className="flex justify-end">
                    <Button type="submit" loading={form.submitting}>Save settings</Button>
                </div>
            </form>
        </AdminPage>
    )
}
